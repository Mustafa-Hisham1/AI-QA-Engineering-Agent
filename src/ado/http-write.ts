/**
 * Low-level HTTP transport for Azure DevOps WRITES.
 *
 * WRITE BOUNDARY
 * --------------
 * Deliberately a separate module from ./http.ts, which exposes GET only. Keeping
 * them apart is what makes the read path structurally incapable of modifying
 * Azure DevOps (invariant 3) — not a naming convention that a later edit could
 * quietly break.
 *
 * NO RETRIES
 * ----------
 * `./http.ts` retries freely because reads are idempotent. Writes are not, and
 * this module therefore makes exactly ONE attempt (invariant 4). A retry after a
 * request that actually succeeded but whose response was lost creates a DUPLICATE
 * Test Case or Bug in Azure DevOps — a silent, human-visible mess that is far
 * worse than a failed run the operator can inspect and re-drive.
 *
 * A timeout or a dropped connection therefore leaves an UNKNOWN outcome, and this
 * module says so explicitly rather than guessing. The caller's job is to
 * reconcile against Azure DevOps before writing again; the publisher does that by
 * matching existing children by title before it creates anything.
 */

import { AdoError } from './errors.ts';

/** Write requests carry no attempt count: there is only ever one attempt. */
export interface WriteRequestOptions {
  readonly timeoutMs: number;
}

/** Media type for the JSON Patch document Azure DevOps expects for work items. */
export const JSON_PATCH_CONTENT_TYPE = 'application/json-patch+json';

/**
 * One operation in an Azure DevOps JSON Patch document.
 *
 * `from` is unused by this project but part of the JSON Patch shape; it is
 * omitted rather than sent as null, which Azure DevOps rejects.
 */
export interface JsonPatchOperation {
  readonly op: 'add' | 'replace' | 'remove' | 'test';
  readonly path: string;
  readonly value?: unknown;
}

/**
 * Maps a failed write response to a domain error.
 *
 * Separate from the read path's mapping because the same status means something
 * different here: a 404 on a write is usually a bad work item type or project,
 * not a hidden resource, and a 400 carries the field-level validation message
 * that is the single most useful thing to show the operator.
 */
function mapWriteErrorResponse(response: Response, url: string, body: string): AdoError {
  const { status } = response;

  // Azure DevOps puts the actionable reason in the body's `message` field.
  const detail = extractErrorMessage(body);
  const details = detail ? [detail] : [];

  if (status === 400) {
    return new AdoError('UNEXPECTED_RESPONSE', 'Azure DevOps rejected the write as invalid (HTTP 400).', {
      status,
      details,
      hint: 'Usually a field that does not exist on this work item type, a value the process template disallows, or a malformed steps document. The message above names the field.',
    });
  }

  if (status === 401) {
    return new AdoError('AUTH_FAILED', 'Azure DevOps rejected the write credential (HTTP 401).', {
      status,
      details,
      hint: 'ADO_PAT_WRITE is invalid, expired, or revoked. Generate a new PAT with "Work Items (Read & write)" and update .env',
    });
  }

  if (status === 403) {
    return new AdoError('PERMISSION_DENIED', 'Azure DevOps denied the write (HTTP 403).', {
      status,
      details,
      hint: 'The token authenticated but may lack "Work Items (Read & write)", or the identity lacks permission to create work items in this area path.',
    });
  }

  if (status === 404) {
    return new AdoError('NOT_FOUND', 'Azure DevOps returned 404 for the write target.', {
      status,
      details,
      hint: 'Check the project name and that the work item type exists in this project. A parent ID that cannot be seen also gives 404.',
    });
  }

  if (status === 409) {
    return new AdoError('UNEXPECTED_RESPONSE', 'Azure DevOps reported a conflict (HTTP 409).', {
      status,
      details,
      hint: 'The work item changed concurrently. Re-read it and reconcile before writing again — do not blind-retry.',
    });
  }

  if (status === 429) {
    return new AdoError('RATE_LIMITED', 'Rate limited by Azure DevOps (HTTP 429).', {
      status,
      details,
      hint: 'The write was NOT retried, by design. Wait, then re-run — the publisher skips items that already exist.',
    });
  }

  if (status >= 500) {
    return new AdoError('SERVICE_UNAVAILABLE', `Azure DevOps is unavailable (HTTP ${status}).`, {
      status,
      details,
      hint: 'The write may or may not have been applied. Verify in Azure DevOps before re-running.',
    });
  }

  return new AdoError('UNEXPECTED_RESPONSE', `Unexpected response from Azure DevOps (HTTP ${status}) for ${url}`, {
    status,
    details,
  });
}

/** Pulls the human-readable reason out of an Azure DevOps error body. */
function extractErrorMessage(body: string): string | undefined {
  if (!body.trim()) return undefined;

  try {
    const parsed = JSON.parse(body) as { message?: unknown; value?: { Message?: unknown } };
    const message = parsed.message ?? parsed.value?.Message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  } catch {
    // Not JSON — fall through and return a trimmed excerpt instead.
  }

  const excerpt = body.trim().slice(0, 500);
  return excerpt || undefined;
}

/**
 * Maps a thrown fetch/network failure on a write to a domain error.
 *
 * The wording matters: after a timeout the request may well have been applied.
 * Reporting it as a plain failure invites a retry that duplicates the work item.
 */
function mapWriteNetworkError(error: unknown, url: string): AdoError {
  const name = error instanceof Error ? error.name : '';

  if (name === 'TimeoutError' || name === 'AbortError') {
    return new AdoError('TIMEOUT', `Azure DevOps write timed out with an UNKNOWN outcome: ${url}`, {
      cause: error,
      hint: 'The write may have been applied. It was NOT retried. Check Azure DevOps for the item before running again.',
    });
  }

  return new AdoError('NETWORK_ERROR', `Could not reach Azure DevOps for a write: ${url}`, {
    cause: error,
    hint: 'If the connection dropped mid-request the write may still have been applied. It was NOT retried — verify in Azure DevOps before re-running.',
  });
}

/**
 * Sends one authenticated write request and parses the JSON response.
 *
 * Exactly one attempt. Never retries. Never throws a raw fetch error.
 *
 * @throws {AdoError} always, on any failure.
 */
async function write<T>(
  url: string,
  method: 'POST' | 'PATCH',
  authHeader: string,
  options: WriteRequestOptions,
  body: unknown,
  contentType: string,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
        'Content-Type': contentType,
        'User-Agent': 'ai-qa-engineering-agent/0.0.1',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options.timeoutMs),
    });
  } catch (error) {
    throw mapWriteNetworkError(error, url);
  }

  if (!response.ok) {
    // Read the body before mapping: it carries the field-level reason, and it
    // can only be consumed once.
    let raw = '';
    try {
      raw = await response.text();
    } catch {
      // A body that cannot be read must not mask the status-based error.
    }
    throw mapWriteErrorResponse(response, url, raw);
  }

  const responseType = response.headers.get('content-type') ?? '';
  if (!responseType.includes('application/json')) {
    // A non-JSON success body means an auth interstitial answered instead of the
    // API. Treating it as success would record a Test Case as published when
    // nothing was created.
    throw new AdoError(
      'AUTH_FAILED',
      `Azure DevOps returned "${responseType || 'unknown content type'}" instead of JSON for a write (HTTP ${response.status}).`,
      {
        status: response.status,
        hint: 'This normally means ADO_PAT_WRITE is invalid, expired, or revoked and a sign-in page was served instead.',
      },
    );
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    // The write likely succeeded — only the response could not be parsed. Say so.
    throw new AdoError('UNEXPECTED_RESPONSE', `The Azure DevOps write succeeded but its response could not be parsed: ${url}`, {
      status: response.status,
      cause: error,
      hint: 'The item was probably created. Verify in Azure DevOps before re-running, to avoid a duplicate.',
    });
  }
}

/** POSTs a JSON Patch document — how work items are created. */
export function postJsonPatch<T>(
  url: string,
  authHeader: string,
  options: WriteRequestOptions,
  operations: readonly JsonPatchOperation[],
): Promise<T> {
  return write<T>(url, 'POST', authHeader, options, operations, JSON_PATCH_CONTENT_TYPE);
}

/** PATCHes a JSON Patch document — how an existing work item is updated. */
export function patchJsonPatch<T>(
  url: string,
  authHeader: string,
  options: WriteRequestOptions,
  operations: readonly JsonPatchOperation[],
): Promise<T> {
  return write<T>(url, 'PATCH', authHeader, options, operations, JSON_PATCH_CONTENT_TYPE);
}
