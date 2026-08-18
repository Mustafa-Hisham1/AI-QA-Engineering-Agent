/**
 * Maps a local Bug Candidate onto Azure DevOps Bug fields.
 *
 * Mirrors ./test-case.ts: this module owns the field mapping and the HTML the
 * Bug carries, and the write client owns the request. Keeping the two apart is
 * what lets a dry run show the exact body that the real write will send.
 */

import { escapeHtml } from '../text/markdown-to-html.ts';
import {
  ATTACHED_FILE_RELATION,
  BUG_WORK_ITEM_TYPE,
  FIELD,
  HIERARCHY_PARENT_RELATION,
  RELATED_RELATION,
  SEVERITY,
} from './fields.ts';
import type { JsonPatchOperation } from './http-write.ts';

/** One reproduction step, as a human would follow it. */
export interface BugStep {
  readonly action: string;
}

/**
 * A Bug Candidate, in the project's own vocabulary.
 *
 * Deliberately free of Azure DevOps field names (invariant 6) — everything here
 * is the local artifact's language, and this module is the only place it becomes
 * `System.*` / `Microsoft.VSTS.*`.
 */
export interface BugCandidateRecord {
  readonly title: string;
  readonly description: string;
  readonly preconditions: readonly string[];
  readonly steps: readonly string[];
  readonly expectedResult: string;
  readonly actualResult: string;
  /** Environment label — e.g. STG. Never inferred from a hostname. */
  readonly environmentLabel: string;
  /** Target host, recorded verbatim beside the label because they can disagree. */
  readonly environmentHost: string;
  readonly requirementReference: string;
  /** Internal Test Case ID, e.g. TC-<story>-002. */
  readonly relatedTestCaseLocalId: string;
  readonly relatedTestCaseAdoId: number;
  readonly relatedUserStoryId: number;
  readonly failureClassification: string;
  readonly evidenceNote: string;
}

/**
 * Where the Bug is placed, who owns it, and how it is graded.
 *
 * Every field here is decided PER BUG by the human. None of it may be carried
 * over from a previously published Bug — a stale assignee or severity under a
 * new bug's title is silently wrong in a way nobody reviews twice.
 */
export interface BugPlacement {
  readonly parentUserStoryId: number;
  readonly areaPath: string;
  readonly iterationPath: string;
  /** Identity the human approved for THIS bug, or null to publish unassigned. */
  readonly assignedTo: string | null;
  /** Severity the human approved for THIS bug, spelled as the template spells it. */
  readonly severity: string;
  /**
   * Priority ONLY when the human explicitly asked for one on this bug.
   * `null`/absent means the field is not written at all, so the process
   * template's own default applies.
   */
  readonly priorityOverride?: string | null;
}

function listHtml(items: readonly string[]): string {
  if (items.length === 0) return '<p><i>None</i></p>';
  return `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
}

function orderedListHtml(items: readonly string[]): string {
  if (items.length === 0) return '<p><i>None</i></p>';
  return `<ol>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ol>`;
}

/**
 * Builds the Repro Steps HTML — the field a developer actually reads.
 *
 * Azure DevOps Bugs have no separate precondition, expected-result or
 * environment field, so all of it goes here in a fixed order. Losing the
 * Expected/Actual pair is what turns a reproducible bug report into an argument.
 */
export function buildReproStepsHtml(bug: BugCandidateRecord): string {
  return [
    `<p>${escapeHtml(bug.description)}</p>`,
    '<p><b>Preconditions</b></p>',
    listHtml(bug.preconditions),
    '<p><b>Steps to Reproduce</b></p>',
    orderedListHtml(bug.steps),
    '<p><b>Expected Result</b></p>',
    `<p>${escapeHtml(bug.expectedResult)}</p>`,
    '<p><b>Actual Result</b></p>',
    `<p>${escapeHtml(bug.actualResult)}</p>`,
    '<p><b>Environment</b></p>',
    `<p>${escapeHtml(bug.environmentLabel)} — ${escapeHtml(bug.environmentHost)}</p>`,
    '<p><b>Requirement Reference</b></p>',
    `<p>${escapeHtml(bug.requirementReference)}</p>`,
    '<p><b>Related Test Case</b></p>',
    `<p>${escapeHtml(bug.relatedTestCaseLocalId)} (Azure DevOps #${bug.relatedTestCaseAdoId})</p>`,
    '<p><b>Failure Classification</b></p>',
    `<p>${escapeHtml(bug.failureClassification)}</p>`,
    '<p><b>Evidence</b></p>',
    `<p>${escapeHtml(bug.evidenceNote)}</p>`,
  ].join('');
}

/**
 * Builds the JSON Patch document that creates the Bug.
 *
 * NOTE ON PRIORITY: Priority is written ONLY when the human explicitly asked for
 * a value on this bug (`placement.priorityOverride`). Otherwise the field is
 * omitted entirely so the process template's default applies — writing a value,
 * even the template's own, would record an explicit human choice that was never
 * made.
 *
 * Severity IS always written: the template marks it required with no default, so
 * a create fails without it.
 */
export function buildCreateBugOperations(
  bug: BugCandidateRecord,
  placement: BugPlacement,
): JsonPatchOperation[] {
  const operations: JsonPatchOperation[] = [
    { op: 'add', path: `/fields/${FIELD.title}`, value: bug.title },
    { op: 'add', path: `/fields/${FIELD.reproSteps}`, value: buildReproStepsHtml(bug) },
    { op: 'add', path: `/fields/${FIELD.severity}`, value: placement.severity },
    // Children inherit the story's area and iteration; otherwise the Bug lands
    // in the project root, away from the work it belongs to.
    { op: 'add', path: `/fields/${FIELD.areaPath}`, value: placement.areaPath },
    { op: 'add', path: `/fields/${FIELD.iterationPath}`, value: placement.iterationPath },
  ];

  if (placement.assignedTo) {
    operations.push({ op: 'add', path: `/fields/${FIELD.assignedTo}`, value: placement.assignedTo });
  }

  // Absent by default. See the note above: an omitted field is how the template
  // default is honoured, and it is not the same as writing that same value.
  if (placement.priorityOverride != null && placement.priorityOverride !== '') {
    operations.push({ op: 'add', path: `/fields/${FIELD.priority}`, value: placement.priorityOverride });
  }

  return operations;
}

/**
 * Relation operations, applied after the Bug exists.
 *
 * Kept separate from field operations because they need URLs built from the
 * organisation and project, and because a relation failure must be
 * distinguishable from a field failure when reporting what actually landed.
 */
export function buildBugRelationOperations(
  apiBaseUrl: string,
  placement: BugPlacement,
  relatedTestCaseAdoId: number,
  attachmentUrl: string | null,
  attachmentComment: string,
): JsonPatchOperation[] {
  const operations: JsonPatchOperation[] = [
    {
      op: 'add',
      path: '/relations/-',
      value: {
        rel: HIERARCHY_PARENT_RELATION,
        url: `${apiBaseUrl}/_apis/wit/workItems/${placement.parentUserStoryId}`,
      },
    },
    {
      op: 'add',
      path: '/relations/-',
      value: {
        rel: RELATED_RELATION,
        url: `${apiBaseUrl}/_apis/wit/workItems/${relatedTestCaseAdoId}`,
        attributes: { comment: 'Bug found by this Test Case' },
      },
    },
  ];

  if (attachmentUrl) {
    operations.push({
      op: 'add',
      path: '/relations/-',
      value: {
        rel: ATTACHED_FILE_RELATION,
        url: attachmentUrl,
        attributes: { comment: attachmentComment },
      },
    });
  }

  return operations;
}

// ---------------------------------------------------------------------------
// Post-create verification
// ---------------------------------------------------------------------------

/** What the caller intended to publish, checked against what Azure DevOps stored. */
export interface BugExpectation {
  readonly title: string;
  readonly parentUserStoryId: number;
  readonly relatedTestCaseAdoId: number;
  /** Assignee unique name the human approved, or null when intentionally unassigned. */
  readonly assignedTo: string | null;
  readonly severity: string;
  /**
   * Priority the human explicitly requested, or null to expect the template
   * default. Null means "any value is acceptable as long as WE did not set it" —
   * the template chooses, so verification asserts only that a value exists.
   */
  readonly priorityOverride: string | null;
  /** Attachment file name expected on the Bug, or null when none was published. */
  readonly attachmentFileName: string | null;
}

export interface BugVerificationProblem {
  readonly check: string;
  readonly expected: string;
  readonly actual: string;
}

export interface BugVerificationResult {
  readonly ok: boolean;
  readonly problems: readonly BugVerificationProblem[];
  readonly checksRun: number;
}

/**
 * Compares a Bug read back from Azure DevOps against what was intended.
 *
 * Pure and side-effect free: the caller does the reading, this decides whether
 * what came back is right. Every mismatch is reported rather than the first one,
 * because a publish that got two fields wrong should say so in one pass.
 *
 * Attachment BYTES are not checked here — that needs a download, which the
 * caller performs. This verifies the relation exists and names the right file.
 */
export function verifyBug(
  actual: {
    readonly id: number;
    readonly workItemType: string;
    readonly title: string;
    readonly state: string;
    readonly assignedToUniqueName: string | null;
    readonly severity: string | null;
    readonly priority: string | null;
    readonly hasReproSteps: boolean;
    readonly relations: readonly { readonly rel: string; readonly targetId: number | null; readonly fileName: string | null }[];
  },
  expected: BugExpectation,
): BugVerificationResult {
  const problems: BugVerificationProblem[] = [];
  let checksRun = 0;

  const check = (name: string, pass: boolean, expectedText: string, actualText: string): void => {
    checksRun += 1;
    if (!pass) problems.push({ check: name, expected: expectedText, actual: actualText });
  };

  check('work item type', actual.workItemType === BUG_WORK_ITEM_TYPE, BUG_WORK_ITEM_TYPE, actual.workItemType || '(none)');

  check('title', actual.title === expected.title, expected.title, actual.title || '(none)');

  check('repro steps present', actual.hasReproSteps, 'non-empty repro steps', actual.hasReproSteps ? 'present' : 'EMPTY');

  // An initial state is whatever the template's first state is, so the check is
  // that the Bug is NOT already resolved or closed — a published bug that lands
  // closed would be silently invisible to whoever has to fix it.
  const terminal = ['Resolved', 'Closed', 'Done', 'Removed'];
  check(
    'initial state',
    !terminal.includes(actual.state),
    'an open (non-terminal) state',
    actual.state || '(none)',
  );

  check(
    'severity',
    actual.severity === expected.severity,
    expected.severity,
    actual.severity ?? '(not set)',
  );

  if (expected.priorityOverride === null) {
    // The template default applies. Assert only that SOMETHING is set: asserting
    // a specific number here would hardcode one project's default.
    check(
      'priority (template default)',
      actual.priority !== null,
      'any value chosen by the process template',
      actual.priority ?? '(not set)',
    );
  } else {
    check(
      'priority (explicit override)',
      actual.priority === expected.priorityOverride,
      expected.priorityOverride,
      actual.priority ?? '(not set)',
    );
  }

  if (expected.assignedTo === null) {
    check('assignee', actual.assignedToUniqueName === null, '(unassigned)', actual.assignedToUniqueName ?? '(unassigned)');
  } else {
    check(
      'assignee',
      (actual.assignedToUniqueName ?? '').toLowerCase() === expected.assignedTo.toLowerCase(),
      expected.assignedTo,
      actual.assignedToUniqueName ?? '(unassigned)',
    );
  }

  const hasParent = actual.relations.some(
    (r) => r.rel === HIERARCHY_PARENT_RELATION && r.targetId === expected.parentUserStoryId,
  );
  check(
    'parent User Story link',
    hasParent,
    `${HIERARCHY_PARENT_RELATION} -> ${expected.parentUserStoryId}`,
    hasParent ? 'present' : 'MISSING',
  );

  const hasTestCase = actual.relations.some(
    (r) => r.rel === RELATED_RELATION && r.targetId === expected.relatedTestCaseAdoId,
  );
  check(
    'related Test Case link',
    hasTestCase,
    `${RELATED_RELATION} -> ${expected.relatedTestCaseAdoId}`,
    hasTestCase ? 'present' : 'MISSING',
  );

  if (expected.attachmentFileName !== null) {
    const attached = actual.relations.find(
      (r) => r.rel === ATTACHED_FILE_RELATION && r.fileName === expected.attachmentFileName,
    );
    check(
      'attachment relation',
      attached !== undefined,
      expected.attachmentFileName,
      attached ? 'present' : 'MISSING',
    );
  }

  return { ok: problems.length === 0, problems, checksRun };
}

export { ATTACHED_FILE_RELATION, BUG_WORK_ITEM_TYPE, SEVERITY };
