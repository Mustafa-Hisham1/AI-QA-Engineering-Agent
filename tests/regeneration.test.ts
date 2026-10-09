/**
 * Tests for the regeneration checks behind `npm run testcases:check`.
 *
 * Regeneration rewrites the whole artifact, so these lock in what it must keep:
 * Test Case IDs, Azure DevOps IDs, human-set statuses and Need Automation
 * decisions — each checked on its own, because the fields are independent.
 */

import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { parseArtifact } from '../src/testcases/artifact.ts';
import type { TestCaseArtifact } from '../src/testcases/model.ts';
import { findCasesWithoutAutomationDecision, findRegenerationLosses } from '../src/testcases/regeneration.ts';

const FIXTURE_TEXT = readFileSync(fileURLToPath(new URL('./fixtures/valid-artifact.md', import.meta.url)), 'utf8');

/** Parses artifact text through the real parser, so the checks see real records. */
function artifactFrom(text: string): TestCaseArtifact {
  const dir = mkdtempSync(join(tmpdir(), 'qa-regeneration-'));
  const path = join(dir, 'test-cases.md');
  writeFileSync(path, text, 'utf8');
  return parseArtifact(path, 99001);
}

/** The fixture with exact replacements applied, each of which must match. */
function fixtureWith(...replacements: readonly (readonly [string, string])[]): string {
  let text = FIXTURE_TEXT;
  for (const [from, to] of replacements) {
    ok(text.includes(from), `fixture must contain "${from}"`);
    text = text.replace(from, to);
  }
  return text;
}

/** A third case, as regeneration would append for a new requirement. */
const NEW_CASE = `
### TC-99001-003 — Login rejects an empty password

| | |
|---|---|
| **Title** | \`[DEMO][Authentication][Login - Portal] Verify login is refused when the password is empty\` |
| Project / Module / Feature-Page | DEMO / Authentication / Login - Portal |
| Test Type | Negative · Validation |
| Requirement Reference | REQ-LOG-003 AC-1 |
| Decisions Applied | — |
| Azure DevOps ID | — |
| Review/Lifecycle Status | AI-Reviewed |
| Need Automation | Yes |

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Submit the form with the password empty | Login is refused and the field is flagged |
`;

test('every case of the reference artifact carries a Need Automation decision', () => {
  deepStrictEqual(findCasesWithoutAutomationDecision(artifactFrom(FIXTURE_TEXT)), []);
});

test('a case without Need Automation is reported as undecided', () => {
  const artifact = artifactFrom(fixtureWith(['| Need Automation | No |\n', '']));

  deepStrictEqual(findCasesWithoutAutomationDecision(artifact), ['TC-99001-002']);
});

test('a regeneration that keeps every preserved value reports nothing', () => {
  // Content may change freely; the preserved fields may not.
  const next = artifactFrom(
    fixtureWith(['| 2 | Click Login | The dashboard is displayed |', '| 2 | Click Login | The home dashboard is displayed |']) +
      NEW_CASE,
  );

  deepStrictEqual(findRegenerationLosses(artifactFrom(FIXTURE_TEXT), next), []);
  deepStrictEqual(findCasesWithoutAutomationDecision(next), []);
});

test('a human-edited Need Automation value survives regeneration', () => {
  // The human flipped the AI recommendation Yes -> No on TC-001. A regeneration
  // that writes the fresh AI recommendation back over it has lost a decision.
  const humanReviewed = artifactFrom(fixtureWith(['| Need Automation | Yes |', '| Need Automation | No |']));
  const regenerated = artifactFrom(FIXTURE_TEXT);

  deepStrictEqual(findRegenerationLosses(humanReviewed, regenerated), [
    { localId: 'TC-99001-001', problem: 'Need Automation changed from No to Yes.' },
  ]);
});

test('dropping a recorded Need Automation value is a loss', () => {
  const regenerated = artifactFrom(fixtureWith(['| Need Automation | No |\n', '']));

  deepStrictEqual(findRegenerationLosses(artifactFrom(FIXTURE_TEXT), regenerated), [
    { localId: 'TC-99001-002', problem: 'Need Automation changed from No to (missing).' },
  ]);
});

test('a legacy artifact with no decisions may gain fresh recommendations', () => {
  const legacy = artifactFrom(FIXTURE_TEXT.replace(/^\| Need Automation \|.*\r?\n/gm, ''));

  deepStrictEqual(findCasesWithoutAutomationDecision(legacy), ['TC-99001-001', 'TC-99001-002']);
  deepStrictEqual(findRegenerationLosses(legacy, artifactFrom(FIXTURE_TEXT)), []);
});

test('a removed Test Case ID is a loss', () => {
  const previous = artifactFrom(FIXTURE_TEXT + NEW_CASE);
  const losses = findRegenerationLosses(previous, artifactFrom(FIXTURE_TEXT));

  deepStrictEqual(losses.map((loss) => loss.localId), ['TC-99001-003']);
  ok(losses[0]!.problem.includes('Test Case ID disappeared'));
});

test('a changed or cleared Azure DevOps ID is a loss', () => {
  const previous = artifactFrom(FIXTURE_TEXT);

  deepStrictEqual(
    findRegenerationLosses(previous, artifactFrom(fixtureWith(['| Azure DevOps ID | **55294** |', '| Azure DevOps ID | — |']))),
    [{ localId: 'TC-99001-001', problem: 'Azure DevOps ID changed from 55294 to —.' }],
  );
  deepStrictEqual(
    findRegenerationLosses(previous, artifactFrom(fixtureWith(['| Azure DevOps ID | **55294** |', '| Azure DevOps ID | **55295** |']))),
    [{ localId: 'TC-99001-001', problem: 'Azure DevOps ID changed from 55294 to 55295.' }],
  );
});

test('a human-set status reset by regeneration is a loss; an agent status is not', () => {
  const previous = artifactFrom(FIXTURE_TEXT);
  const reset = artifactFrom(fixtureWith(['| Review/Lifecycle Status | Approved |', '| Review/Lifecycle Status | AI-Reviewed |']));

  deepStrictEqual(findRegenerationLosses(previous, reset), [
    { localId: 'TC-99001-002', problem: 'Review/Lifecycle Status changed from Approved to AI-Reviewed.' },
  ]);

  // An agent-set status may legitimately change when the agent revises a case.
  const aiReviewed = artifactFrom(fixtureWith(['| Review/Lifecycle Status | Approved |', '| Review/Lifecycle Status | AI-Reviewed |']));
  const redrafted = artifactFrom(fixtureWith(['| Review/Lifecycle Status | Approved |', '| Review/Lifecycle Status | Draft |']));
  deepStrictEqual(findRegenerationLosses(aiReviewed, redrafted), []);
});

test('Need Automation and Review/Lifecycle Status are checked independently', () => {
  const previous = artifactFrom(FIXTURE_TEXT);

  // Status kept, decision changed: exactly one loss, about Need Automation.
  const decisionOnly = findRegenerationLosses(
    previous,
    artifactFrom(fixtureWith(['| Need Automation | No |', '| Need Automation | Yes |'])),
  );
  deepStrictEqual(decisionOnly.map((loss) => loss.problem), ['Need Automation changed from No to Yes.']);

  // Decision kept, status changed: exactly one loss, about the status.
  const statusOnly = findRegenerationLosses(
    previous,
    artifactFrom(fixtureWith(['| Review/Lifecycle Status | Approved |', '| Review/Lifecycle Status | Needs-Changes |'])),
  );
  deepStrictEqual(statusOnly.map((loss) => loss.problem), ['Review/Lifecycle Status changed from Approved to Needs-Changes.']);
});

test('approving a case does not change its Need Automation decision, and Yes does not approve it', () => {
  // AI-Reviewed + Yes: a Yes recommendation leaves the case unapproved.
  const recommended = artifactFrom(
    fixtureWith(
      ['| Review/Lifecycle Status | Approved |', '| Review/Lifecycle Status | AI-Reviewed |'],
      ['| Need Automation | No |', '| Need Automation | Yes |'],
    ),
  );
  strictEqual(recommended.testCases[1]!.needAutomation, 'Yes');
  strictEqual(recommended.testCases[1]!.status, 'AI-Reviewed');

  // The human approves it: Yes stays Yes, and nothing is lost.
  const approved = artifactFrom(fixtureWith(['| Need Automation | No |', '| Need Automation | Yes |']));
  strictEqual(approved.testCases[1]!.status, 'Approved');
  deepStrictEqual(findRegenerationLosses(recommended, approved), []);

  // Approval does not carry the decision with it: flipping Yes to No alongside
  // the approval is still a Need Automation loss, and only that.
  deepStrictEqual(findRegenerationLosses(recommended, artifactFrom(FIXTURE_TEXT)), [
    { localId: 'TC-99001-002', problem: 'Need Automation changed from Yes to No.' },
  ]);
});
