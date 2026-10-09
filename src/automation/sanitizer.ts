/**
 * Removes credential material from text Playwright produced — error messages,
 * stacks, call logs — before it reaches the console, `error-context.md`, or the
 * HTML execution report (invariant 7, `docs/product-decisions.md` §7.1.1).
 *
 * ONE sanitizer, used in both places that handle Playwright text:
 * - worker side, by the `redactErrorContext` fixture, before any reporter or
 *   error-context file sees a test's errors;
 * - runner side, by the HTML report, for step errors and anything else.
 *
 * Every rule here closes a leak verified by `npm run automation:verify-artifacts`
 * against Playwright 1.64. Pure: text in, text out.
 */

import { redact } from '../ado/errors.ts';

/**
 * A text-entry action in a Playwright call log: `fill("…")`, `type("…")`,
 * `pressSequentially("…")`, `insertText("…")`. Playwright logs the typed value
 * verbatim — a masked password included — and prints the call log whenever the
 * action fails.
 */
const TEXT_ENTRY_ARGUMENT = /\b(fill|type|pressSequentially|insertText)\((["'`])(?:\\.|(?!\2)[^\\])*\2/g;

/**
 * An ARIA-snapshot line for an editable control: `- textbox "Password": value`.
 * ARIA snapshots carry input values, masked passwords included. ARIA-snapshot
 * APIs are forbidden in automation code; this catches any that still arrive.
 */
const ARIA_INPUT_VALUE = /^(\s*[-+]?\s*- (?:textbox|searchbox|combobox|spinbutton)\b[^:\n]*):[^\n]*$/gm;

export function sanitizeText(text: string): string {
  return redact(text)
    .replace(TEXT_ENTRY_ARGUMENT, (_match, action: string) => `${action}("[REDACTED]"`)
    .replace(ARIA_INPUT_VALUE, '$1: [REDACTED]');
}

/** Playwright's ANSI colour codes — meaningless outside a terminal. */
const ANSI = /\u001b\[[0-9;]*m/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI, '');
}

/** The serialisable shape of a Playwright test error, as far as sanitising needs. */
export interface SanitizableError {
  message?: string;
  stack?: string;
  value?: string;
  snippet?: string;
  errorContext?: string;
  cause?: SanitizableError;
}

/**
 * Sanitises a test error in place, recursively through `cause`, and drops the
 * matcher's ARIA receiver snapshot entirely (`errorContext`).
 */
export function sanitizeError(error: SanitizableError): void {
  delete error.errorContext;
  if (error.message !== undefined) error.message = sanitizeText(error.message);
  if (error.stack !== undefined) error.stack = sanitizeText(error.stack);
  if (error.value !== undefined) error.value = sanitizeText(error.value);
  if (error.snippet !== undefined) error.snippet = sanitizeText(error.snippet);
  if (error.cause) sanitizeError(error.cause);
}
