/**
 * The QA execution report model (`docs/product-decisions.md` §7.2).
 *
 * Built from Playwright's results joined with the Test Case artifact, which is
 * the source of truth for step actions and Expected Results. Every string in a
 * report has already passed through the sanitizer; the HTML generator escapes
 * it again on output.
 */

/** Per Test Case, in the report. */
export type ExecutionStatus = 'PASS' | 'FAIL' | 'NOT RUN' | 'NOT AUTOMATED';

export type StepStatus = 'PASS' | 'FAIL' | 'NOT EXECUTED';

/** The failure classification vocabulary of `docs/product-decisions.md` §9. */
export type FailureClassification =
  | 'PRODUCT_BUG'
  | 'TEST_DATA_ISSUE'
  | 'ENVIRONMENT_ISSUE'
  | 'NETWORK_ISSUE'
  | 'AUTHENTICATION_ISSUE'
  | 'TEST_SCRIPT_ISSUE'
  | 'UNKNOWN';

export interface ReportAttachment {
  readonly kind: 'screenshot' | 'video';
  /** Relative to the report directory, always `attachments/<file>`. */
  readonly path: string;
  readonly label: string;
}

export interface StepResult {
  readonly index: number;
  readonly action: string;
  /** From the Test Case artifact; `—` when the test is not traceable to one. */
  readonly expected: string;
  readonly status: StepStatus;
  readonly actual: string;
  readonly durationMs: number | null;
}

export interface FailureDetail {
  /** First line of the error, e.g. `expect(locator).toBeVisible() failed`. */
  readonly reason: string;
  /** The full error, sanitised. */
  readonly error: string;
  /** The failed step's Expected Result, from the Test Case. */
  readonly expected: string;
  readonly actual: string;
  readonly classification: FailureClassification;
  /** Why this classification — automatic and provisional, for a human to confirm. */
  readonly classificationNote: string;
}

export interface TestCaseResult {
  /** Null only when a spec carries no Test Case annotation — flagged, never invented. */
  readonly testCaseId: string | null;
  readonly userStoryId: number | null;
  readonly adoId: number | null;
  readonly title: string;
  readonly module: string | null;
  readonly featurePage: string | null;
  readonly requirementReference: string | null;
  readonly specFile: string | null;
  readonly status: ExecutionStatus;
  readonly durationMs: number | null;
  readonly steps: readonly StepResult[];
  /** Index of the failed step; null when the failure was outside any step. */
  readonly failedStep: number | null;
  readonly failure: FailureDetail | null;
  /** NOT RUN / NOT AUTOMATED: why. */
  readonly reason: string | null;
  readonly attachments: readonly ReportAttachment[];
  readonly bugCandidateId: string | null;
}

export interface BugCandidate {
  /** `BUG-001`, numbered within the run. */
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly preconditions: readonly string[];
  readonly stepsToReproduce: readonly string[];
  /** By handle only (invariant 7). */
  readonly testData: readonly string[];
  readonly expectedResult: string;
  readonly actualResult: string;
  readonly testCaseId: string;
  readonly adoId: number | null;
  readonly userStoryId: number;
  readonly requirementReference: string;
  readonly classification: FailureClassification;
  readonly environment: ReportEnvironment;
  readonly attachments: readonly ReportAttachment[];
  /** Always Draft: only a human reviews it, and only /publish-bug publishes it. */
  readonly status: 'Draft';
}

export interface ReportEnvironment {
  /** The explicit label; the host is recorded beside it, verbatim (§12.1). */
  readonly label: string;
  readonly host: string;
}

export interface ExecutionReport {
  readonly runId: string;
  readonly project: string;
  readonly userStories: readonly number[];
  readonly modules: readonly string[];
  readonly environment: ReportEnvironment;
  /** ISO 8601. */
  readonly startedAt: string;
  readonly durationMs: number;
  readonly totals: {
    readonly total: number;
    readonly pass: number;
    readonly fail: number;
    readonly notRun: number;
    readonly notAutomated: number;
  };
  readonly results: readonly TestCaseResult[];
  readonly bugCandidates: readonly BugCandidate[];
}
