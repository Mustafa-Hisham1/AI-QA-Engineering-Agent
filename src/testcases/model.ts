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

/**
 * The automation-scope decision (`docs/product-decisions.md` §6.3).
 *
 * The agent writes an initial recommendation; the human may change it, and the
 * value in the artifact after review is what decides future automation scope.
 * Deliberately independent of {@link ReviewStatus}: `Yes` is not approval, and
 * approval does not imply `Yes`.
 */
export type NeedAutomation = 'Yes' | 'No';

export const NEED_AUTOMATION_VALUES: readonly NeedAutomation[] = ['Yes', 'No'];

export function isNeedAutomation(value: string): value is NeedAutomation {
  return (NEED_AUTOMATION_VALUES as readonly string[]).includes(value);
}

/** One Test Case, exactly as the local artifact defines it. */
export interface TestCaseRecord {
  /** Stable internal ID, e.g. `TC-53717-001`. Assigned before any external ID. */
  readonly localId: string;
  /** The short scenario line after the ID in the case heading. Local only. */
  readonly summary: string;
  /** The `##` group the case is rendered under. Local only; not a scope field. */
  readonly section: string;
  /**
   * Lines introducing the section, carried by its first case. Empty on every
   * other case. Local only — kept so grouping text survives a CSV round trip.
   */
  readonly sectionNote: readonly string[];
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
  /**
   * Whether this case belongs in future automation scope. Null when the artifact
   * records no decision — an artifact generated before the field existed. Null
   * is "undecided", never an implicit `Yes` or `No`.
   */
  readonly needAutomation: NeedAutomation | null;
  readonly precondition: readonly string[];
  readonly testData: readonly string[];
  readonly steps: readonly TestCaseStep[];
  readonly notes: readonly string[];
  /**
   * 1-based position of the case in its source: the `###` heading line in
   * Markdown, the row number (header = 1) in CSV. For error messages only.
   */
  readonly headingLine: number;
}

/** The parsed artifact: its provenance plus every case in file order. */
export interface TestCaseArtifact {
  /** The file the cases were read from — the CSV for every consumer (§6.4). */
  readonly filePath: string;
  readonly storyId: number;
  /** Content fingerprint recorded in the artifact's provenance header. */
  readonly contentFingerprint: string | null;
  readonly testCases: readonly TestCaseRecord[];
}
