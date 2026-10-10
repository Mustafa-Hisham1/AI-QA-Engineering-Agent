/**
 * When a MANUAL execution run continues, and when it stops
 * (`docs/product-decisions.md` §10.5).
 *
 * The rule: **a failing case never stops the run by itself.** A `PRODUCT_BUG`
 * becomes a FAIL and a local Bug Candidate, and the next case runs. Test cases
 * are independently executable (§4), so one case's defect says nothing about
 * whether the next case can run.
 *
 * The run stops only when continuing is unsafe or technically impossible:
 *
 *   ENVIRONMENT_UNAVAILABLE   the environment is unreachable, or consistently failing
 *   AUTHENTICATION_BROKEN     authentication is broken and prevents further testing
 *   BLOCKING_ISSUE            an issue makes every later result unreliable
 *   DESTRUCTIVE_RISK          continuing could make unintended destructive changes
 *                             or corrupt test data
 *
 * "Consistently" means the same environment or authentication cause on
 * consecutive cases — one transient failure is retried and recorded, not a
 * reason to abandon the run. The agent may also stop at once on an explicit
 * signal (the reachability check failed, the login itself is broken, a step
 * would destroy shared data). Pure: no I/O.
 */

import type { Classification, ManualStatus } from './manual-results.ts';

export type StopCondition = 'ENVIRONMENT_UNAVAILABLE' | 'AUTHENTICATION_BROKEN' | 'BLOCKING_ISSUE' | 'DESTRUCTIVE_RISK';

export const STOP_CONDITIONS: readonly StopCondition[] = [
  'ENVIRONMENT_UNAVAILABLE',
  'AUTHENTICATION_BROKEN',
  'BLOCKING_ISSUE',
  'DESTRUCTIVE_RISK',
];

/** Consecutive cases with the same environment/authentication cause that mean "consistently failing". */
export const CONSECUTIVE_FAILURES_TO_STOP = 2;

/** One executed case, as far as the decision needs it. */
export interface CaseOutcome {
  readonly testCaseId: string;
  readonly status: ManualStatus;
  readonly classification: Classification | null;
}

/**
 * Explicit signals the agent observed, each a short explanation. Any one present
 * stops the run at once — they describe a state, not a single case.
 */
export interface RunSignals {
  /** The target failed its reachability check. */
  readonly environmentUnreachable?: string | null;
  /** The login itself is broken for the accounts the remaining cases need. */
  readonly authenticationBroken?: string | null;
  /** An issue that makes every later result unreliable. */
  readonly blockingIssue?: string | null;
  /** Continuing would make unintended destructive changes or corrupt test data. */
  readonly destructiveRisk?: string | null;
}

export type RunDecision =
  | { readonly action: 'CONTINUE'; readonly note: string }
  | { readonly action: 'STOP'; readonly condition: StopCondition; readonly explanation: string };

const ENVIRONMENT: readonly Classification[] = ['ENVIRONMENT_ISSUE', 'NETWORK_ISSUE'];

/** How many of the most recent outcomes, in a row, have a classification in `set`. */
function trailing(history: readonly CaseOutcome[], set: readonly Classification[]): number {
  let count = 0;
  for (let index = history.length - 1; index >= 0; index--) {
    const classification = history[index]!.classification;
    if (classification === null || !set.includes(classification)) break;
    count++;
  }
  return count;
}

/** Decides, after a case, whether the run continues with the next case. */
export function decideAfterCase(history: readonly CaseOutcome[], signals: RunSignals = {}): RunDecision {
  // Safety first: an unsafe or impossible state stops regardless of results.
  if (signals.destructiveRisk) return { action: 'STOP', condition: 'DESTRUCTIVE_RISK', explanation: signals.destructiveRisk };
  if (signals.environmentUnreachable) {
    return { action: 'STOP', condition: 'ENVIRONMENT_UNAVAILABLE', explanation: signals.environmentUnreachable };
  }
  if (signals.authenticationBroken) {
    return { action: 'STOP', condition: 'AUTHENTICATION_BROKEN', explanation: signals.authenticationBroken };
  }
  if (signals.blockingIssue) return { action: 'STOP', condition: 'BLOCKING_ISSUE', explanation: signals.blockingIssue };

  const environment = trailing(history, ENVIRONMENT);
  if (environment >= CONSECUTIVE_FAILURES_TO_STOP) {
    return {
      action: 'STOP',
      condition: 'ENVIRONMENT_UNAVAILABLE',
      explanation: `The last ${environment} cases failed on an environment or network cause — the environment is consistently failing.`,
    };
  }
  const authentication = trailing(history, ['AUTHENTICATION_ISSUE']);
  if (authentication >= CONSECUTIVE_FAILURES_TO_STOP) {
    return {
      action: 'STOP',
      condition: 'AUTHENTICATION_BROKEN',
      explanation: `The last ${authentication} cases could not authenticate — authentication is broken and prevents further testing.`,
    };
  }

  const last = history.at(-1);
  const note =
    last?.classification === 'PRODUCT_BUG'
      ? `${last.testCaseId} failed as a suspected PRODUCT_BUG: record a Bug Candidate and continue — a product bug never stops the run.`
      : 'Continue with the next case.';
  return { action: 'CONTINUE', note };
}

/** The classifications a recorded stop must be consistent with, per condition; null = judgement, any. */
export const STOP_EVIDENCE: Record<StopCondition, readonly Classification[] | null> = {
  ENVIRONMENT_UNAVAILABLE: ENVIRONMENT,
  AUTHENTICATION_BROKEN: ['AUTHENTICATION_ISSUE'],
  BLOCKING_ISSUE: null,
  DESTRUCTIVE_RISK: null,
};
