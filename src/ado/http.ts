/**
 * Low-level HTTP transport for Azure DevOps.
 *
 * READ-ONLY BOUNDARY
 * ------------------
 * This module deliberately exposes GET only. There is no post/patch/put/delete
 * helper, so no code built on it can modify Azure DevOps — the restriction is
 * structural rather than a convention.
 *
 * Writes will arrive later in a separate module that loads its own write-scoped
 * credential. Note that reads are idempotent and safe to retry; writes are not,
 * which is a second reason to keep the two transports apart.
 */

import { AdoError } from './errors.ts';

export interface RequestOptions {
  readonly timeoutMs: number;
  readonly maxAttempts: number;
}

/** Statuses worth retrying: transient by nature. 4xx (except 429) never is. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function backoffDelayMs(attempt: number): number {
  const base = 500 * 2 ** (attempt - 1); // 500ms, 1s, 2s, ...
  const jitter = Math.random() * 250; // spread concurrent retries
  return Math.min(base + jitter, 8_000);
}

/** Parses Retry-After, which may be seconds or an HTTP date. */
function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;

  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;

  const date = Date.parse(header);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());

  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Maps a failed HTTP response to a domain error.
 *
 * Note on 404: Azure DevOps intentionally returns 404 for resources you lack
 * permission to see, so that it does not leak their existence. "Not found" and
 * "not permitted" are therefore genuinely indistinguishable here, and the
 * message says so rather than guessing.
 */
function mapErrorResponse(response: Response, url: string): AdoError {
  const { status } = response;

  if (status === 401) {
    return new AdoError('AUTH_FAILED', 'Azure DevOps rejected the credential (HTTP 401).', {
      status,
      hint: 'The PAT is invalid, expired, or revoked. Generate a new read-only token and update ADO_PAT_READ in .env',
    });
  }

  if (status === 403) {
    return new AdoError('PERMISSION_DENIED', 'Access denied by Azure DevOps (HTTP 403).', {
      status,
      hint: 'The PAT authenticated but lacks the required scope. Ensure it grants "Work Items (Read)".',
    });
  }

  if (status === 404) {
    return new AdoError(
      'NOT_FOUND',
      'Azure DevOps returned 404 — the resource does not exist, or the token cannot see it.',
      {
        status,
        hint: 'Check ADO_ORG_URL and ADO_PROJECT for typos, and confirm the token has access to that project.',
      },
    );
  }

  if (status === 429) {
    return new AdoError('RATE_LIMITED', 'Rate limited by Azure DevOps (HTTP 429).', {
      status,
      hint: 'Too many requests. The client already retried with backoff — try again shortly.',
    });
  }

  if (status >= 500) {
    return new AdoError('SERVICE_UNAVAILABLE', `Azure DevOps is unavailable (HTTP ${status}).`, {
      status,
      hint: 'This is an Azure DevOps-side failure. Check https://status.dev.azure.com and retry later.',
    });
  }

  return new AdoError('UNEXPECTED_RESPONSE', `Unexpected response from Azure DevOps (HTTP ${status}) for ${url}`, {
    status,
  });
}

/** Maps a thrown fetch/network failure to a domain error. */
function mapNetworkError(error: unknown, url: string): AdoError {
  const name = error instanceof Error ? error.name : '';

  if (name === 'TimeoutError' || name === 'AbortError') {
    return new AdoError('TIMEOUT', `Request to Azure DevOps timed out: ${url}`, {
      cause: error,
      hint: 'Check the network connection, or raise ADO_TIMEOUT_MS in .env if the connection is simply slow.',
    });
  }

  return new AdoError('NETWORK_ERROR', `Could not reach Azure DevOps: ${url}`, {
    cause: error,
    hint: 'Check network connectivity, DNS, proxy settings, and that ADO_ORG_URL is correct.',
  });
}

/**
 * Builds the Basic auth header.
 *
 * Azure DevOps expects an EMPTY username and the PAT as the password — the
 * leading colon is required and is a common source of 401s when omitted.
 */
export function buildAuthHeader(pat: string): string {
  return `Basic ${Buffer.from(`:${pat}`).toString('base64')}`;
}

/**
 * Performs an authenticated GET and parses the JSON body.
 *
 * @throws {AdoError} always — never a raw fetch/parse error.
 */
export async function getJson<T>(
  url: string,
  authHeader: string,
  options: RequestOptions,
): Promise<T> {
  let lastError: AdoError | undefined;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          // Requesting JSON explicitly is what makes the HTML sign-in page
          // detectable below rather than silently mis-parsed.
          Accept: 'application/json',
          'User-Agent': 'ai-qa-engineering-agent/0.0.1',
        },
        signal: AbortSignal.timeout(options.timeoutMs),
      });
    } catch (error) {
      lastError = mapNetworkError(error, url);
      if (attempt < options.maxAttempts) {
        await sleep(backoffDelayMs(attempt));
        continue;
      }
      throw lastError;
    }

    if (!response.ok) {
      lastError = mapErrorResponse(response, url);

      if (isRetryableStatus(response.status) && attempt < options.maxAttempts) {
        const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
        await sleep(retryAfter ?? backoffDelayMs(attempt));
        continue;
      }
      throw lastError;
    }

    // Azure DevOps quirk: an invalid or expired PAT frequently yields
    // "203 Non-Authoritative Information" with an HTML sign-in page instead of
    // a clean 401. Without this guard it parses as success and fails
    // confusingly further downstream.
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new AdoError(
        'AUTH_FAILED',
        `Azure DevOps returned "${contentType || 'unknown content type'}" instead of JSON (HTTP ${response.status}).`,
        {
          status: response.status,
          hint:
            'This normally means the PAT is invalid, expired, or revoked — Azure DevOps served a sign-in page. ' +
            'It can also mean ADO_ORG_URL points at the wrong organisation.',
        },
      );
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      throw new AdoError('UNEXPECTED_RESPONSE', `Could not parse the Azure DevOps response as JSON: ${url}`, {
        status: response.status,
        cause: error,
      });
    }
  }

  /* c8 ignore next — unreachable: the loop always returns or throws. */
  throw lastError ?? new AdoError('UNEXPECTED_RESPONSE', `Request failed: ${url}`);
}
