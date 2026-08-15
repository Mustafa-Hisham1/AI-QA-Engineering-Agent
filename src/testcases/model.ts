/**
 * The normalised Test Case shape shared by the artifact parser and the publisher.
 *
 * Deliberately free of Azure DevOps knowledge: no field reference names, no work
 * item concepts beyond an optional external ID. Mapping onto Azure DevOps fields
 * happens in `src/ado/test-case.ts` and nowhere else (invariant 6).
 */

/** One step and the result expected after performing it. */
export interface TestCaseStep {
  /** Step number as written in the artifact. */
  readonly index: number;
  readonly action: string;
  /** Expected result for this step. Every step in this project has one. */
  readonly expected: string;
}

/**
 * Review/Lifecycle Status values (`docs/product-decisions.md` §6.1).
 *
 * A plain union rather than an enum: this project runs `.ts` directly under
 * `erasableSyntaxOnly`, so enums are unavailable by design.
 */
export type ReviewStatus =
  | 'Draft'
  | 'AI-Reviewed'
  | 'Needs-Changes'
  | 'Approved'
  | 'Published'
  | 'Rejected';

export const REVIEW_STATUSES: readonly ReviewStatus[] = [
  'Draft',
  'AI-Reviewed',
  'Needs-Changes',
  'Approved',
  'Published',
  'Rejected',
];

export function isReviewStatus(value: string): value is ReviewStatus {
  return (REVIEW_STATUSES as readonly string[]).includes(value);
}

/** One Test Case, exactly as the local artifact defines it. */
export interface TestCaseRecord {
  /** Stable internal ID, e.g. `TC-53717-001`. Assigned before any external ID. */
  readonly localId: string;
  /** Full title, including the `[Project][Module][Feature/Page]` prefix. */
  readonly title: string;
  readonly project: string;
  readonly module: string;
  readonly featurePage: string;
  readonly testType: string;
  readonly requirementReference: string;
  /** Confirmed decision IDs governing this case, or an em dash when none. */
  readonly decisionsApplied: string;
  /** Azure DevOps work item ID once published; null before that. */
  readonly adoId: number | null;
  readonly status: ReviewStatus;
  readonly precondition: readonly string[];
  readonly testData: readonly string[];
  readonly steps: readonly TestCaseStep[];
  readonly notes: readonly string[];
  /** 1-based line number of this case's `###` heading, for precise rewriting. */
  readonly headingLine: number;
}

/** The parsed artifact: its provenance plus every case in file order. */
export interface TestCaseArtifact {
  readonly filePath: string;
  readonly storyId: number;
  /** Content fingerprint recorded in the artifact's provenance header. */
  readonly contentFingerprint: string | null;
  readonly testCases: readonly TestCaseRecord[];
}
