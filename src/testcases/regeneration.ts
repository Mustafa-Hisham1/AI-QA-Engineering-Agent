/**
 * Checks that regenerating a Test Case artifact kept what it must keep.
 *
 * `/write-test-cases` regenerates the artifact by rewriting Markdown, so the
 * preservation rules (CLAUDE.md, `docs/product-decisions.md` §6.1, §6.3) would
 * otherwise rest on the writer remembering them. These checks make them
 * verifiable: compare the artifact as it was before regeneration with the
 * artifact after it.
 *
 * Pure functions over parsed artifacts — no file system, no Azure DevOps.
 */

import type { ReviewStatus, TestCaseArtifact, TestCaseRecord } from './model.ts';

/**
 * Statuses that record a human statement or an external fact. Regeneration
 * must never change them: resetting `Approved` publishes nothing a human
 * approved, and resetting `Published` hides a work item that really exists.
 */
const PRESERVED_STATUSES: readonly ReviewStatus[] = ['Approved', 'Needs-Changes', 'Rejected', 'Published'];

/** One thing regeneration lost or changed that it was not allowed to. */
export interface RegenerationLoss {
  readonly localId: string;
  readonly problem: string;
}

/**
 * Lists everything in `previous` that `next` failed to preserve.
 *
 * An existing Need Automation value is preserved whoever set it. The artifact
 * cannot tell a human edit from the agent's own earlier recommendation, so the
 * only safe rule is to treat every recorded value as possibly human-reviewed.
 * A changed recommendation belongs in the self-review record, not in the cell.
 *
 * Each field is checked on its own: Need Automation and Review/Lifecycle Status
 * are independent, and one being preserved says nothing about the other.
 */
export function findRegenerationLosses(previous: TestCaseArtifact, next: TestCaseArtifact): RegenerationLoss[] {
  const nextById = new Map<string, TestCaseRecord>(next.testCases.map((entry) => [entry.localId, entry]));
  const losses: RegenerationLoss[] = [];

  for (const before of previous.testCases) {
    const after = nextById.get(before.localId);

    if (!after) {
      losses.push({
        localId: before.localId,
        problem: 'Test Case ID disappeared. IDs are never removed or renumbered; a rejected case moves to "Rejected test cases".',
      });
      continue;
    }

    if (before.adoId !== after.adoId) {
      losses.push({
        localId: before.localId,
        problem: `Azure DevOps ID changed from ${before.adoId ?? '—'} to ${after.adoId ?? '—'}.`,
      });
    }

    if (PRESERVED_STATUSES.includes(before.status) && before.status !== after.status) {
      losses.push({
        localId: before.localId,
        problem: `Review/Lifecycle Status changed from ${before.status} to ${after.status}.`,
      });
    }

    if (before.needAutomation !== null && before.needAutomation !== after.needAutomation) {
      losses.push({
        localId: before.localId,
        problem: `Need Automation changed from ${before.needAutomation} to ${after.needAutomation ?? '(missing)'}.`,
      });
    }
  }

  return losses;
}

/** IDs of cases that record no Need Automation decision, in file order. */
export function findCasesWithoutAutomationDecision(artifact: TestCaseArtifact): string[] {
  return artifact.testCases.filter((entry) => entry.needAutomation === null).map((entry) => entry.localId);
}
