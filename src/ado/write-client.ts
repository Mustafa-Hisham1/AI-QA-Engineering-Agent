/**
 * Azure DevOps WRITE client.
 *
 * Separate from AdoReadClient and built on ./http-write.ts, which has no GET and
 * no retries. Loading a write-scoped credential is the caller's decision, made
 * explicitly via loadWriteConfig() — the read path cannot reach this class's
 * credential.
 *
 * Every method here performs an IRREVERSIBLE external action. None of them may be
 * called without explicit human approval immediately beforehand (invariant 2);
 * that gate lives in the CLI, which is the only thing a human drives.
 */

import type { AdoWriteConfig } from './config.ts';
import { registerSecret } from './errors.ts';
import { BUG_WORK_ITEM_TYPE, TEST_CASE_WORK_ITEM_TYPE } from './fields.ts';
import { buildAuthHeader } from './http.ts';
import {
  patchJsonPatch,
  postAttachment,
  postJsonPatch,
  type JsonPatchOperation,
  type WriteRequestOptions,
} from './http-write.ts';
import { buildCreateTestCaseOperations, type TestCasePlacement } from './test-case.ts';
import {
  buildBugRelationOperations,
  buildCreateBugOperations,
  type BugCandidateRecord,
  type BugPlacement,
} from './bug.ts';
import type { TestCaseRecord } from '../testcases/model.ts';

/** Minimal shape of a created work item — only what the caller needs. */
interface RawCreatedWorkItem {
  readonly id?: number;
  readonly _links?: { readonly html?: { readonly href?: string } };
}

export interface CreatedTestCase {
  readonly localId: string;
  readonly adoId: number;
  /** Browser URL of the created work item, when Azure DevOps returned one. */
  readonly htmlUrl: string | null;
}

export interface CreatedBug {
  readonly adoId: number;
  /** Browser URL of the created work item, when Azure DevOps returned one. */
  readonly htmlUrl: string | null;
  /** False when the Bug was created but its relations could not be applied. */
  readonly linked: boolean;
  /** Why linking failed, when it did. The Bug still exists. */
  readonly linkError: string | null;
}

export class AdoWriteClient {
  readonly #config: AdoWriteConfig;
  readonly #authHeader: string;
  readonly #options: WriteRequestOptions;

  constructor(config: AdoWriteConfig) {
    this.#config = config;
    this.#authHeader = buildAuthHeader(config.writePat);
    this.#options = { timeoutMs: config.timeoutMs };

    // The base64-encoded header is as sensitive as the PAT itself.
    registerSecret(this.#authHeader);
  }

  get organizationName(): string {
    return this.#config.orgName;
  }

  get projectName(): string {
    return this.#config.project;
  }

  /** The URL a create would POST to. Exposed so a dry run can show it exactly. */
  createTestCaseUrl(): string {
    const project = encodeURIComponent(this.#config.project);
    const type = encodeURIComponent(`$${TEST_CASE_WORK_ITEM_TYPE}`);
    return `${this.#config.orgUrl}/${project}/_apis/wit/workitems/${type}?api-version=7.1`;
  }

  /**
   * Builds the exact operations a create would send, without sending anything.
   *
   * The dry run and the real write share this one function deliberately: a
   * preview built by different code than the write is a preview of nothing.
   */
  planCreateTestCase(testCase: TestCaseRecord, placement: TestCasePlacement): JsonPatchOperation[] {
    return buildCreateTestCaseOperations(testCase, placement);
  }

  /**
   * Creates ONE Test Case work item as a child of a User Story.
   *
   * One item per call, by design: the caller records the returned ID locally
   * before creating the next one, so an interruption can never lose the record of
   * something that was really created.
   *
   * @throws {AdoError} on any failure. The write is NOT retried.
   */
  async createTestCase(testCase: TestCaseRecord, placement: TestCasePlacement): Promise<CreatedTestCase> {
    const operations = this.planCreateTestCase(testCase, placement);

    const created = await postJsonPatch<RawCreatedWorkItem>(
      this.createTestCaseUrl(),
      this.#authHeader,
      this.#options,
      operations,
    );

    if (typeof created.id !== 'number' || !Number.isInteger(created.id) || created.id <= 0) {
      // Something was very likely created but its ID is unusable, so the local
      // artifact cannot record it. Surfacing this loudly is the only safe move:
      // treating it as a failure would invite a duplicate on the next run.
      throw new Error(
        `${testCase.localId}: Azure DevOps accepted the create but returned no usable work item ID. ` +
          'Check Azure DevOps for a Test Case with this title and record its ID manually before re-running.',
      );
    }

    return {
      localId: testCase.localId,
      adoId: created.id,
      htmlUrl: created._links?.html?.href ?? null,
    };
  }

  /** The URL a Bug create would POST to. Exposed so a dry run can show it exactly. */
  createBugUrl(): string {
    const project = encodeURIComponent(this.#config.project);
    const type = encodeURIComponent(`$${BUG_WORK_ITEM_TYPE}`);
    return `${this.#config.orgUrl}/${project}/_apis/wit/workitems/${type}?api-version=7.1`;
  }

  /** Builds the exact field operations a Bug create would send, sending nothing. */
  planCreateBug(bug: BugCandidateRecord, placement: BugPlacement): JsonPatchOperation[] {
    return buildCreateBugOperations(bug, placement);
  }

  /**
   * Uploads a file to the attachment store WITHOUT linking it to anything.
   *
   * Deliberately its own step. The upload is the only part that can fail on file
   * size or content, and an attachment that is uploaded but never linked is
   * discarded by Azure DevOps — so doing this first cannot leave a Bug carrying a
   * broken attachment reference.
   *
   * @throws {AdoError} on any failure. NOT retried.
   */
  async uploadAttachment(fileName: string, bytes: Uint8Array): Promise<string> {
    const project = encodeURIComponent(this.#config.project);
    const name = encodeURIComponent(fileName);
    const url = `${this.#config.orgUrl}/${project}/_apis/wit/attachments?fileName=${name}&api-version=7.1`;

    const uploaded = await postAttachment(url, this.#authHeader, this.#options, bytes);

    if (typeof uploaded.url !== 'string' || !uploaded.url) {
      throw new Error(
        `Azure DevOps accepted the attachment "${fileName}" but returned no URL, so it cannot be linked. ` +
          'Re-uploading is safe — an unlinked attachment is discarded.',
      );
    }

    return uploaded.url;
  }

  /**
   * Creates ONE Bug, then links it in a SECOND request.
   *
   * Split in two on purpose. A create that carries relations fails atomically if
   * any relation is bad — leaving no Bug and no clear reason. Creating first means
   * a link failure leaves a real Bug with a known ID that a human can finish by
   * hand, which is far better than a silent nothing.
   *
   * @throws {AdoError} on any failure. NEITHER request is retried (invariant 4).
   */
  async createBug(
    bug: BugCandidateRecord,
    placement: BugPlacement,
    attachmentUrl: string | null,
    attachmentComment: string,
  ): Promise<CreatedBug> {
    const created = await postJsonPatch<RawCreatedWorkItem>(
      this.createBugUrl(),
      this.#authHeader,
      this.#options,
      this.planCreateBug(bug, placement),
    );

    if (typeof created.id !== 'number' || !Number.isInteger(created.id) || created.id <= 0) {
      throw new Error(
        'Azure DevOps accepted the Bug create but returned no usable work item ID. ' +
          `Check Azure DevOps for a Bug titled "${bug.title}" before running again, to avoid a duplicate.`,
      );
    }

    const apiBaseUrl = `${this.#config.orgUrl}/${encodeURIComponent(this.#config.project)}`;
    const relations = buildBugRelationOperations(
      apiBaseUrl,
      placement,
      bug.relatedTestCaseAdoId,
      attachmentUrl,
      attachmentComment,
    );

    const project = encodeURIComponent(this.#config.project);
    const patchUrl = `${this.#config.orgUrl}/${project}/_apis/wit/workitems/${created.id}?api-version=7.1`;

    let linked = false;
    let linkError: string | null = null;
    try {
      await patchJsonPatch<RawCreatedWorkItem>(patchUrl, this.#authHeader, this.#options, relations);
      linked = true;
    } catch (error) {
      // The Bug exists. Reporting the ID matters more than the link failure, so
      // this is returned rather than thrown — a throw here would strand a real
      // work item with no ID surfaced to the operator.
      linkError = error instanceof Error ? error.message : String(error);
    }

    return {
      adoId: created.id,
      htmlUrl: created._links?.html?.href ?? null,
      linked,
      linkError,
    };
  }
}
