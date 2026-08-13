/**
 * Azure DevOps error taxonomy and secret redaction.
 *
 * Downstream code never inspects HTTP status codes — it switches on AdoErrorCode.
 * That keeps ADO transport details inside this module.
 */

export type AdoErrorCode =
  | 'CONFIG_MISSING'
  | 'CONFIG_INVALID'
  | 'AUTH_FAILED'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  /** The work item exists but is not a type this project is allowed to read. */
  | 'UNSUPPORTED_WORK_ITEM_TYPE'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNEXPECTED_RESPONSE';

// ---------------------------------------------------------------------------
// Secret redaction
//
// We never intentionally log secrets. This registry is defence in depth: any
// registered value is scrubbed from every error message before it can surface
// in a console, a report, or a stack trace.
// ---------------------------------------------------------------------------

const secrets = new Set<string>();

/** Register a value that must never appear in output. Short values are ignored. */
export function registerSecret(value: string | undefined): void {
  if (value && value.trim().length >= 8) {
    secrets.add(value.trim());
  }
}

/** Replace every registered secret in `input` with a placeholder. */
export function redact(input: string): string {
  let output = input;
  for (const secret of secrets) {
    output = output.split(secret).join('[REDACTED]');
  }
  return output;
}

/** Test seam — clears the registry. */
export function clearSecrets(): void {
  secrets.clear();
}

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export interface AdoErrorOptions {
  /** Actionable remediation shown to the operator. */
  hint?: string;
  /**
   * Per-item diagnostic lines, rendered under the reason.
   * Used to say precisely which variable is wrong and how — a bare
   * "missing configuration" sends people hunting in the wrong place.
   */
  details?: readonly string[];
  /** HTTP status, when the failure came from a response. Diagnostics only. */
  status?: number;
  cause?: unknown;
}

export class AdoError extends Error {
  readonly code: AdoErrorCode;
  readonly hint: string | undefined;
  readonly details: readonly string[];
  readonly status: number | undefined;

  constructor(code: AdoErrorCode, message: string, options: AdoErrorOptions = {}) {
    // Redact at construction so no code path can leak a secret through .message.
    super(redact(message), options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'AdoError';
    this.code = code;
    this.hint = options.hint === undefined ? undefined : redact(options.hint);
    this.details = (options.details ?? []).map(redact);
    this.status = options.status;
  }
}

export function isAdoError(error: unknown): error is AdoError {
  return error instanceof AdoError;
}
