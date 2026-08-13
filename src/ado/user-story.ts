/**
 * Normalisation of an Azure DevOps User Story into a Requirement Context.
 *
 * The Requirement Context is the single input every later stage of the pipeline
 * consumes — requirement analysis, test case generation, traceability. Raw
 * Azure DevOps JSON never leaves this module: field reference names stay behind
 * the boundary in ./fields.ts, HTML becomes Markdown, and identities are
 * reduced to display names so no account email enters an artifact or model
 * context.
 *
 * V1 supports the `User Story` work item type only (docs/product-decisions.md
 * §3). The type check is enforced, not advisory — reading an Epic as if it were
 * a story would silently produce coverage claims about the wrong requirement.
 */

import { createHash } from 'node:crypto';

import { ATTACHED_FILE_RELATION, FIELD, MAPPED_FIELDS } from './fields.ts';
import { AdoError } from './errors.ts';
import { htmlToMarkdown, htmlToPlainText } from '../text/html-to-markdown.ts';

/** The only work item type the V1 reader accepts. */
export const SUPPORTED_WORK_ITEM_TYPE = 'User Story';

// ---------------------------------------------------------------------------
// Raw Azure DevOps shapes (internal — never leave this module)
// ---------------------------------------------------------------------------

interface RawIdentityRef {
  readonly displayName?: string;
}

interface RawRelation {
  readonly rel?: string;
  readonly url?: string;
  readonly attributes?: Record<string, unknown>;
}

export interface RawWorkItem {
  readonly id?: number;
  readonly rev?: number;
  readonly fields?: Record<string, unknown>;
  readonly relations?: readonly RawRelation[];
  readonly _links?: { readonly html?: { readonly href?: string } };
}

// ---------------------------------------------------------------------------
// Normalised shapes (the only shapes callers see)
// ---------------------------------------------------------------------------

/** A field present on the work item that has no normalised property. */
export interface ExtraField {
  readonly referenceName: string;
  readonly value: string;
}

export interface UserStory {
  readonly id: number;
  /** Azure DevOps revision number. Bumps on any change, including trivial ones. */
  readonly rev: number;
  readonly workItemType: string;
  readonly title: string;
  readonly state: string;
  readonly reason: string | null;
  readonly project: string;
  readonly areaPath: string | null;
  readonly iterationPath: string | null;
  readonly tags: readonly string[];
  readonly assignedTo: string | null;
  readonly createdBy: string | null;
  readonly changedBy: string | null;
  readonly createdDate: string | null;
  readonly changedDate: string | null;
  readonly priority: number | null;
  readonly storyPoints: number | null;
  readonly valueArea: string | null;
  /** Description converted from HTML to Markdown. Empty string when absent. */
  readonly description: string;
  /** Acceptance Criteria converted from HTML to Markdown. Empty when absent. */
  readonly acceptanceCriteria: string;
  /** Unrecognised fields, kept so custom-template requirement text is not lost. */
  readonly extraFields: readonly ExtraField[];
  /** Browser URL of the work item, for traceability in artifacts. */
  readonly htmlUrl: string | null;
}

export interface AttachmentInfo {
  /** Azure DevOps attachment GUID, parsed from the relation URL. */
  readonly id: string;
  readonly fileName: string;
  readonly url: string;
  readonly comment: string | null;
  readonly sizeBytes: number | null;
  readonly isMarkdown: boolean;
}

export interface MarkdownDocument {
  readonly attachmentId: string;
  readonly fileName: string;
  readonly comment: string | null;
  readonly content: string;
  readonly byteLength: number;
  /** Content hash, so a changed attachment is detectable without a diff. */
  readonly sha256: string;
}

export interface RequirementContext {
  readonly organization: string;
  readonly story: UserStory;
  readonly attachments: readonly AttachmentInfo[];
  /** Downloaded Markdown attachments, in attachment order. */
  readonly markdownDocuments: readonly MarkdownDocument[];
  /**
   * Hash of the requirement *content* only — title, description, acceptance
   * criteria, extra fields and Markdown attachments. Deliberately independent
   * of `rev`, which changes when someone edits a tag or reassigns the story;
   * this answers "did the requirement itself change?" (§14).
   */
  readonly contentFingerprint: string;
  readonly retrievedAt: string;
}

// ---------------------------------------------------------------------------
// Field readers
// ---------------------------------------------------------------------------

function readString(fields: Record<string, unknown>, name: string): string | null {
  const value = fields[name];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  return null;
}

function readNumber(fields: Record<string, unknown>, name: string): number | null {
  const value = fields[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Identities are reduced to a display name — never the account email. */
function readIdentity(fields: Record<string, unknown>, name: string): string | null {
  const value = fields[name];
  if (typeof value === 'string') return value.trim() || null;
  if (value && typeof value === 'object') {
    const display = (value as RawIdentityRef).displayName;
    if (typeof display === 'string') return display.trim() || null;
  }
  return null;
}

function readTags(fields: Record<string, unknown>): string[] {
  const raw = readString(fields, FIELD.tags);
  if (!raw) return [];
  return raw
    .split(';')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/**
 * Everything not covered by a normalised property, rendered as text.
 *
 * Custom process templates put real requirement content in custom fields. This
 * project cannot know their names, so the safe default is to surface them.
 */
function readExtraFields(fields: Record<string, unknown>): ExtraField[] {
  const extras: ExtraField[] = [];

  for (const [name, value] of Object.entries(fields)) {
    if (MAPPED_FIELDS.includes(name)) continue;
    if (value === null || value === undefined || value === '') continue;

    let text: string;
    if (typeof value === 'string') {
      // A custom field may be HTML or plain text; the converter handles both.
      text = /<[a-zA-Z/!]/.test(value) ? htmlToMarkdown(value) : value.trim();
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      text = String(value);
    } else if (typeof value === 'object') {
      const display = (value as RawIdentityRef).displayName;
      // Objects are identities or link containers; only a display name is
      // meaningful, and dumping the rest would leak PII into artifacts.
      if (typeof display !== 'string') continue;
      text = display.trim();
    } else {
      continue;
    }

    if (text) extras.push({ referenceName: name, value: text });
  }

  return extras.sort((a, b) => a.referenceName.localeCompare(b.referenceName));
}

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

const MARKDOWN_EXTENSIONS = ['.md', '.markdown', '.mdown', '.mkd'];

export function isMarkdownFileName(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return MARKDOWN_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

/** The attachment GUID is the last path segment of the relation URL. */
function parseAttachmentId(url: string): string {
  const segment = url.split('?')[0]?.split('/').filter(Boolean).pop();
  return segment ?? url;
}

function readAttachments(relations: readonly RawRelation[]): AttachmentInfo[] {
  const attachments: AttachmentInfo[] = [];

  for (const relation of relations) {
    if (relation.rel !== ATTACHED_FILE_RELATION || !relation.url) continue;

    const attributes = relation.attributes ?? {};
    const rawName = attributes['name'];
    const fileName = typeof rawName === 'string' && rawName.trim() ? rawName.trim() : parseAttachmentId(relation.url);
    const rawComment = attributes['comment'];
    const rawSize = attributes['resourceSize'];

    attachments.push({
      id: parseAttachmentId(relation.url),
      fileName,
      url: relation.url,
      comment: typeof rawComment === 'string' && rawComment.trim() ? rawComment.trim() : null,
      sizeBytes: typeof rawSize === 'number' && Number.isFinite(rawSize) ? rawSize : null,
      isMarkdown: isMarkdownFileName(fileName),
    });
  }

  return attachments;
}

/**
 * Decodes attachment bytes to text.
 *
 * Encoding is detected from the byte-order mark when present, because a
 * UTF-16 file decoded as UTF-8 turns requirement text into unreadable noise
 * that is easy to mistake for a formatting problem. UTF-8 is strict, with
 * windows-1252 as the fallback: a legacy single-byte file must degrade to
 * slightly wrong punctuation, never to a hard failure that hides the content.
 */
export function decodeTextAttachment(bytes: Uint8Array): string {
  const [b0, b1, b2] = [bytes[0], bytes[1], bytes[2]];

  if (b0 === 0xff && b1 === 0xfe) return new TextDecoder('utf-16le').decode(bytes.subarray(2));
  if (b0 === 0xfe && b1 === 0xff) return new TextDecoder('utf-16be').decode(bytes.subarray(2));

  const body = b0 === 0xef && b1 === 0xbb && b2 === 0xbf ? bytes.subarray(3) : bytes;

  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(body);
  } catch {
    text = new TextDecoder('windows-1252').decode(body);
  }

  // Normalise line endings so fingerprints do not change with the editor used.
  return text.replace(/\r\n?/g, '\n');
}

export function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Download URL for an attachment. `download=true` avoids an inline redirect. */
export function buildAttachmentDownloadUrl(attachment: AttachmentInfo): string {
  const separator = attachment.url.includes('?') ? '&' : '?';
  return `${attachment.url}${separator}fileName=${encodeURIComponent(attachment.fileName)}&download=true`;
}

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

/**
 * Verifies the work item type and normalises the fields.
 *
 * @throws {AdoError} UNSUPPORTED_WORK_ITEM_TYPE when the item is not a User Story.
 */
export function normaliseUserStory(raw: RawWorkItem, requestedId: number): UserStory {
  const fields = raw.fields ?? {};
  const workItemType = readString(fields, FIELD.workItemType);

  if (!workItemType) {
    throw new AdoError('UNEXPECTED_RESPONSE', `Work item ${requestedId} came back without a work item type.`, {
      hint: 'The response was not a work item. Verify the ID and that the API version is still supported.',
    });
  }

  if (workItemType !== SUPPORTED_WORK_ITEM_TYPE) {
    throw new AdoError(
      'UNSUPPORTED_WORK_ITEM_TYPE',
      `Work item ${requestedId} is a "${workItemType}", not a "${SUPPORTED_WORK_ITEM_TYPE}".`,
      {
        details: [`Title: ${readString(fields, FIELD.title) ?? '(untitled)'}`],
        hint: `V1 reads "${SUPPORTED_WORK_ITEM_TYPE}" work items only (docs/product-decisions.md §3). Supply a User Story ID, or record a decision to widen the reader before changing this.`,
      },
    );
  }

  const title = readString(fields, FIELD.title);
  if (!title) {
    throw new AdoError('UNEXPECTED_RESPONSE', `User Story ${requestedId} has no title.`, {
      hint: 'A work item always has a title; the response is unexpected. Re-read the work item.',
    });
  }

  return {
    id: raw.id ?? requestedId,
    rev: raw.rev ?? readNumber(fields, FIELD.rev) ?? 0,
    workItemType,
    title,
    state: readString(fields, FIELD.state) ?? 'unknown',
    reason: readString(fields, FIELD.reason),
    project: readString(fields, FIELD.teamProject) ?? 'unknown',
    areaPath: readString(fields, FIELD.areaPath),
    iterationPath: readString(fields, FIELD.iterationPath),
    tags: readTags(fields),
    assignedTo: readIdentity(fields, FIELD.assignedTo),
    createdBy: readIdentity(fields, FIELD.createdBy),
    changedBy: readIdentity(fields, FIELD.changedBy),
    createdDate: readString(fields, FIELD.createdDate),
    changedDate: readString(fields, FIELD.changedDate),
    priority: readNumber(fields, FIELD.priority),
    storyPoints: readNumber(fields, FIELD.storyPoints) ?? readNumber(fields, FIELD.effort),
    valueArea: readString(fields, FIELD.valueArea),
    description: htmlToMarkdown(fields[FIELD.description] as string | undefined),
    acceptanceCriteria: htmlToMarkdown(fields[FIELD.acceptanceCriteria] as string | undefined),
    extraFields: readExtraFields(fields),
    htmlUrl: raw._links?.html?.href ?? null,
  };
}

export function normaliseAttachments(raw: RawWorkItem): AttachmentInfo[] {
  return readAttachments(raw.relations ?? []);
}

/** Plain-text form of a rich-text value, exposed for single-line fields. */
export const toPlainText = htmlToPlainText;

/**
 * Content fingerprint over requirement-bearing content only.
 *
 * Excludes `rev`, dates, state and assignment on purpose: those change for
 * reasons that do not affect test coverage, and a fingerprint that moves on
 * every reassignment would train everyone to ignore it.
 */
export function computeContentFingerprint(
  story: UserStory,
  markdownDocuments: readonly MarkdownDocument[],
): string {
  const canonical = JSON.stringify({
    title: story.title,
    description: story.description,
    acceptanceCriteria: story.acceptanceCriteria,
    extraFields: story.extraFields,
    attachments: markdownDocuments.map((document) => ({ fileName: document.fileName, sha256: document.sha256 })),
  });

  return sha256(canonical);
}
