/**
 * Reusable read-only Azure DevOps client.
 *
 * Every future read capability (User Story, attachments, existing Test Cases)
 * builds on this. It owns auth, retries, and error mapping so callers deal only
 * with normalised results and AdoError.
 *
 * Writes are intentionally absent — see the note in ./http.ts.
 */

import type { AdoConfig } from './config.ts';
import { AdoError, registerSecret } from './errors.ts';
import { FIELD, HIERARCHY_CHILD_RELATION, TEST_CASE_FIELD } from './fields.ts';
import { countSteps } from './test-case.ts';
import { buildAuthHeader, getBytes, getJson, type RequestOptions } from './http.ts';
import {
  SUPPORTED_WORK_ITEM_TYPE,
  buildAttachmentDownloadUrl,
  computeContentFingerprint,
  decodeTextAttachment,
  normaliseAttachments,
  normaliseUserStory,
  sha256,
  type AttachmentInfo,
  type MarkdownDocument,
  type RawWorkItem,
  type RequirementContext,
} from './user-story.ts';

// ---------------------------------------------------------------------------
// Raw Azure DevOps response shapes (internal — never leave this module)
// ---------------------------------------------------------------------------

interface RawIdentity {
  readonly id?: string;
  readonly providerDisplayName?: string;
}

interface RawConnectionData {
  readonly authenticatedUser?: RawIdentity;
  readonly authorizedUser?: RawIdentity;
  readonly instanceId?: string;
  readonly deploymentType?: string;
}

interface RawWorkItemType {
  readonly name?: string;
  readonly referenceName?: string;
}

interface RawWorkItemTypesResponse {
  readonly count?: number;
  readonly value?: readonly RawWorkItemType[];
}

// ---------------------------------------------------------------------------
// Normalised results (the only shapes callers see)
// ---------------------------------------------------------------------------

export interface ConnectionInfo {
  /** Display name of the identity the PAT belongs to. Never an email address. */
  readonly authenticatedAs: string;
  /** Stable organisation identifier — confirms which org answered. */
  readonly instanceId: string;
  readonly deploymentType: string;
}

export interface WorkItemTypeInfo {
  readonly name: string;
  readonly referenceName: string;
}

/** Where a parent work item lives, and how a child links to it. */
export interface ParentContext {
  readonly id: number;
  readonly workItemType: string;
  readonly title: string;
  readonly areaPath: string | null;
  readonly iterationPath: string | null;
  /** Absolute API URL used as the target of a hierarchy relation. */
  readonly apiUrl: string;
}

/** A child work item as seen from its parent. */
export interface ChildWorkItem {
  readonly id: number;
  readonly workItemType: string;
  readonly title: string;
  /** Steps actually stored on the item, or null when it carries no steps field. */
  readonly stepCount: number | null;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class AdoReadClient {
  readonly #config: AdoConfig;
  readonly #authHeader: string;
  readonly #requestOptions: RequestOptions;

  constructor(config: AdoConfig) {
    this.#config = config;
    this.#authHeader = buildAuthHeader(config.pat);
    this.#requestOptions = {
      timeoutMs: config.timeoutMs,
      maxAttempts: config.maxAttempts,
    };

    // The base64-encoded header is as sensitive as the PAT itself.
    registerSecret(this.#authHeader);
  }

  get organizationName(): string {
    return this.#config.orgName;
  }

  get projectName(): string {
    return this.#config.project;
  }

  /**
   * Verifies authentication and identifies the organisation.
   *
   * Deliberately touches no work items, so an auth failure is never confused
   * with a permissions or project problem.
   */
  async getConnectionData(): Promise<ConnectionInfo> {
    const url = `${this.#config.orgUrl}/_apis/connectionData`;
    const raw = await getJson<RawConnectionData>(url, this.#authHeader, this.#requestOptions);

    // Only the display name is read. The identity object also carries the
    // account email and descriptors — PII we have no need for and therefore
    // never load into memory, artifacts, or model context.
    const displayName = raw.authenticatedUser?.providerDisplayName ?? raw.authorizedUser?.providerDisplayName;

    if (!displayName) {
      throw new AdoError('AUTH_FAILED', 'Azure DevOps did not return an authenticated identity.', {
        hint: 'The credential was not accepted. Verify ADO_PAT_READ is a current, non-revoked token.',
      });
    }

    return {
      authenticatedAs: displayName,
      instanceId: raw.instanceId ?? 'unknown',
      deploymentType: raw.deploymentType ?? 'unknown',
    };
  }

  /**
   * Lists the work item types defined in the configured project.
   *
   * This doubles as the project-access probe: it is read-only, sits within the
   * "Work Items (Read)" scope the pipeline actually needs, and confirms project
   * reachability without reading a single work item.
   */
  async getProjectWorkItemTypes(): Promise<WorkItemTypeInfo[]> {
    // Project names may contain spaces and other URL-significant characters.
    const project = encodeURIComponent(this.#config.project);
    const url = `${this.#config.orgUrl}/${project}/_apis/wit/workitemtypes?api-version=7.1`;

    const raw = await getJson<RawWorkItemTypesResponse>(url, this.#authHeader, this.#requestOptions);

    return (raw.value ?? [])
      .filter((type): type is RawWorkItemType & { name: string } => typeof type.name === 'string')
      .map((type) => ({
        name: type.name,
        referenceName: type.referenceName ?? type.name,
      }));
  }

  /**
   * Reads one User Story and returns its Requirement Context.
   *
   * This is the entry point every later pipeline stage uses. It verifies the
   * work item type, normalises the fields, lists the attachments, and downloads
   * the Markdown attachments — which is where the detailed requirement usually
   * lives in this project.
   *
   * Non-Markdown attachments are listed but not downloaded: they may be large
   * binaries, and nothing downstream can read them yet.
   *
   * @throws {AdoError} NOT_FOUND when the ID does not exist or is not visible,
   *                    UNSUPPORTED_WORK_ITEM_TYPE when it is not a User Story.
   */
  async readUserStory(id: number): Promise<RequirementContext> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AdoError('CONFIG_INVALID', `"${id}" is not a valid work item ID.`, {
        hint: 'Pass a positive whole number, e.g. 53717.',
      });
    }

    const raw = await this.#getWorkItem(id);
    const story = normaliseUserStory(raw, id);
    const attachments = normaliseAttachments(raw);

    const markdownDocuments: MarkdownDocument[] = [];
    for (const attachment of attachments.filter((candidate) => candidate.isMarkdown)) {
      markdownDocuments.push(await this.#downloadMarkdown(attachment));
    }

    return {
      organization: this.#config.orgName,
      story,
      attachments,
      markdownDocuments,
      contentFingerprint: computeContentFingerprint(story, markdownDocuments),
      retrievedAt: new Date().toISOString(),
    };
  }

  /**
   * Reads the placement context of a parent work item: where it lives, and the
   * URL a child needs in order to link to it.
   *
   * Used before publishing so children inherit the parent's area and iteration
   * instead of landing in the project root, and so the parent's type is verified
   * before anything is created under it.
   *
   * @throws {AdoError} NOT_FOUND when the ID does not exist or is not visible,
   *                    UNSUPPORTED_WORK_ITEM_TYPE when it is not a User Story.
   */
  async readParentContext(id: number): Promise<ParentContext> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AdoError('CONFIG_INVALID', `"${id}" is not a valid work item ID.`, {
        hint: 'Pass a positive whole number, e.g. 53717.',
      });
    }

    const raw = await this.#getWorkItem(id);
    const fields = raw.fields ?? {};

    const workItemType = typeof fields[FIELD.workItemType] === 'string' ? (fields[FIELD.workItemType] as string) : '';

    if (workItemType !== SUPPORTED_WORK_ITEM_TYPE) {
      throw new AdoError(
        'UNSUPPORTED_WORK_ITEM_TYPE',
        `Work item ${id} is a "${workItemType || 'unknown type'}", not a ${SUPPORTED_WORK_ITEM_TYPE}.`,
        {
          hint: `V1 supports ${SUPPORTED_WORK_ITEM_TYPE} only. Widening this is a project-level decision.`,
        },
      );
    }

    // Prefer the URL Azure DevOps reports; only fall back to constructing one,
    // because a hand-built URL that differs from the canonical form produces a
    // relation Azure DevOps accepts but does not resolve.
    const apiUrl = raw.url ?? `${this.#config.orgUrl}/_apis/wit/workItems/${id}`;

    return {
      id,
      workItemType,
      title: typeof fields[FIELD.title] === 'string' ? (fields[FIELD.title] as string) : '',
      areaPath: typeof fields[FIELD.areaPath] === 'string' ? (fields[FIELD.areaPath] as string) : null,
      iterationPath: typeof fields[FIELD.iterationPath] === 'string' ? (fields[FIELD.iterationPath] as string) : null,
      apiUrl,
    };
  }

  /**
   * Lists the child work items of a parent.
   *
   * This is the duplicate guard and the post-publish verification in one: it
   * reports what is ACTUALLY in Azure DevOps rather than what a local file claims,
   * which is the only trustworthy basis for deciding whether an item still needs
   * creating.
   */
  async getChildWorkItems(parentId: number): Promise<ChildWorkItem[]> {
    const raw = await this.#getWorkItem(parentId);

    const childIds = (raw.relations ?? [])
      .filter((relation) => relation.rel === HIERARCHY_CHILD_RELATION)
      .map((relation) => {
        const match = /\/(\d+)$/.exec(relation.url ?? '');
        return match ? Number(match[1]) : undefined;
      })
      .filter((id): id is number => id !== undefined);

    if (childIds.length === 0) return [];

    const children: ChildWorkItem[] = [];

    // Azure DevOps caps a batch read at 200 ids per request.
    for (let offset = 0; offset < childIds.length; offset += 200) {
      const batch = childIds.slice(offset, offset + 200);
      const project = encodeURIComponent(this.#config.project);
      const fields = [FIELD.title, FIELD.workItemType, TEST_CASE_FIELD.steps]
        .map(encodeURIComponent)
        .join(',');
      const url = `${this.#config.orgUrl}/${project}/_apis/wit/workitems?ids=${batch.join(',')}&fields=${fields}&api-version=7.1`;

      const response = await getJson<{ readonly value?: readonly RawWorkItem[] }>(
        url,
        this.#authHeader,
        this.#requestOptions,
      );

      for (const item of response.value ?? []) {
        if (typeof item.id !== 'number') continue;
        const itemFields = item.fields ?? {};
        const stepsXml = itemFields[TEST_CASE_FIELD.steps];

        children.push({
          id: item.id,
          title: typeof itemFields[FIELD.title] === 'string' ? (itemFields[FIELD.title] as string) : '',
          workItemType:
            typeof itemFields[FIELD.workItemType] === 'string' ? (itemFields[FIELD.workItemType] as string) : '',
          stepCount: typeof stepsXml === 'string' ? countSteps(stepsXml) : null,
        });
      }
    }

    return children;
  }

  /**
   * Fetches a work item with relations expanded.
   *
   * `$expand=relations` is what makes attachments visible — without it the
   * response carries fields only, and the story looks like it has no
   * attachments at all.
   */
  async #getWorkItem(id: number): Promise<RawWorkItem> {
    const project = encodeURIComponent(this.#config.project);
    const url = `${this.#config.orgUrl}/${project}/_apis/wit/workitems/${id}?$expand=relations&api-version=7.1`;

    return getJson<RawWorkItem>(url, this.#authHeader, this.#requestOptions);
  }

  /** Downloads one Markdown attachment and decodes it to text. */
  async #downloadMarkdown(attachment: AttachmentInfo): Promise<MarkdownDocument> {
    const url = buildAttachmentDownloadUrl(attachment);
    const { bytes } = await getBytes(url, this.#authHeader, this.#requestOptions);

    return {
      attachmentId: attachment.id,
      fileName: attachment.fileName,
      comment: attachment.comment,
      content: decodeTextAttachment(bytes),
      byteLength: bytes.byteLength,
      sha256: sha256(bytes),
    };
  }
}
