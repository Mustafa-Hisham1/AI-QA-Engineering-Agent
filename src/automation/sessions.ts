/**
 * Application sessions a test opened, so every one of them is ended when the
 * test finishes — passed or failed (`docs/product-decisions.md` §7.1.3).
 *
 * Why: clearing cookies and storage only forgets a session in the browser; the
 * application keeps it server-side (NBO: in Redis, capped per account). Abandoned
 * sessions from automated runs reached the cap and blocked every further login
 * (2026-10-10).
 *
 * How: a project's login Page Object calls `registerSession(owner, label, end)`
 * as soon as it submits a login. `end` performs the application's own session
 * termination (for NBO, its logout API with that session's token). The
 * `endSessions` auto fixture (`fixtures.ts`) ends what is still open at
 * teardown and reports every outcome — including sessions ended mid-test by an
 * account switch (`endSession`). Sessions are keyed by the test's own `page`, so
 * a test can only ever end the sessions it opened — never another test's.
 *
 * Project-agnostic: no locator, URL or credential. Pure apart from the
 * callbacks it is given.
 */

import { registerSecret } from '../ado/errors.ts';

/** What ending a session found. `ended: false` means there was nothing to end. */
export interface SessionEndReport {
  readonly ended: boolean;
  /** Evidence for the report — status codes, never a token or credential. */
  readonly detail: string;
}

export type EndSessionCallback = () => Promise<SessionEndReport>;

interface OpenSession {
  readonly label: string;
  readonly end: EndSessionCallback;
}

export interface SessionEndResult {
  readonly label: string;
  readonly outcome: 'logged-out' | 'nothing-to-end' | 'failed';
  /** When ended: the evidence; when failed: why. Never a credential. */
  readonly detail: string;
  /** `switch` — ended mid-test before another login; `teardown` — at test end. */
  readonly when: 'switch' | 'teardown';
}

const open = new WeakMap<object, OpenSession[]>();
const history = new WeakMap<object, SessionEndResult[]>();

/**
 * Records a session the test opened on `owner` (its page). `label` names the
 * account by HANDLE, never by username.
 */
export function registerSession(owner: object, label: string, end: EndSessionCallback): void {
  open.set(owner, [...(open.get(owner) ?? []), { label, end }]);
}

/**
 * Registers a session secret (an access token) for redaction, so it can never
 * reach an error message, a log line or a report. Held in memory only.
 */
export function registerSessionSecret(secret: string): void {
  registerSecret(secret);
}

/** Labels of the sessions still open on `owner`, oldest first. */
export function openSessions(owner: object): string[] {
  return (open.get(owner) ?? []).map((session) => session.label);
}

async function runEnd(session: OpenSession, when: SessionEndResult['when']): Promise<SessionEndResult> {
  try {
    const report = await session.end();
    return { label: session.label, outcome: report.ended ? 'logged-out' : 'nothing-to-end', detail: report.detail, when };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { label: session.label, outcome: 'failed', detail: message.split('\n')[0] ?? message, when };
  }
}

function remember(owner: object, result: SessionEndResult): void {
  history.set(owner, [...(history.get(owner) ?? []), result]);
}

/**
 * Ends every session still open on `owner` mid-test — before another login on
 * the same page. Never throws: a failure is remembered for the teardown report,
 * and the test carries on.
 */
export async function endOpenSessionsNow(owner: object): Promise<SessionEndResult[]> {
  const sessions = [...(open.get(owner) ?? [])].reverse();
  open.delete(owner);
  const results: SessionEndResult[] = [];
  for (const session of sessions) {
    const result = await runEnd(session, 'switch');
    remember(owner, result);
    results.push(result);
  }
  return results;
}

/**
 * At teardown: ends every session still open on `owner`, newest first, and
 * returns every outcome of the test — the mid-test ones first. Each session is
 * attempted even when an earlier one failed, and a failure is RETURNED, never
 * thrown: cleanup must not replace or hide the test's own result.
 */
export async function endSessions(owner: object): Promise<SessionEndResult[]> {
  const sessions = [...(open.get(owner) ?? [])].reverse();
  open.delete(owner);
  for (const session of sessions) remember(owner, await runEnd(session, 'teardown'));
  const all = history.get(owner) ?? [];
  history.delete(owner);
  return all;
}
