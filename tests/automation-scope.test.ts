/**
 * Tests for automation case selection, module layout and traceability
 * (src/automation/scope.ts, src/automation/traceability.ts).
 *
 * Selection must read Need Automation and Review/Lifecycle Status as the human
 * left them, and change neither.
 */

import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  automationPlanPathFor,
  moduleDirName,
  selectAutomationScope,
  specPathFor,
} from '../src/automation/scope.ts';
import { testCaseDetails } from '../src/automation/traceability.ts';
import type { ActiveProject } from '../src/projects/active-project.ts';
import { parseArtifact } from '../src/testcases/artifact.ts';
import type { TestCaseArtifact } from '../src/testcases/model.ts';

const FIXTURE = fileURLToPath(new URL('./fixtures/valid-artifact.md', import.meta.url));
const FIXTURE_TEXT = readFileSync(FIXTURE, 'utf8');

const DEMO: ActiveProject = {
  key: 'DEMO',
  root: 'docs/projects/DEMO',
  profilePath: 'docs/projects/DEMO/profile.md',
  source: 'explicit',
};

/** The fixture (TC-001: Published + Yes, TC-002: Approved + No) with replacements applied. */
function artifactWith(...replacements: readonly (readonly [string, string])[]): TestCaseArtifact {
  let text = FIXTURE_TEXT;
  for (const [from, to] of replacements) {
    ok(text.includes(from), `fixture must contain "${from}"`);
    text = text.replace(from, to);
  }
  const dir = mkdtempSync(join(tmpdir(), 'qa-scope-'));
  const path = join(dir, 'test-cases.md');
  writeFileSync(path, text, 'utf8');
  return parseArtifact(path, 99001);
}

test('a Published case with Need Automation = Yes is in scope; No is excluded', () => {
  const { inScope, excluded } = selectAutomationScope(DEMO, artifactWith());

  deepStrictEqual(inScope.map((entry) => entry.testCase.localId), ['TC-99001-001']);
  deepStrictEqual(excluded.map((entry) => [entry.testCase.localId, entry.reason]), [['TC-99001-002', 'NEED_AUTOMATION_NO']]);
});

test('an Approved case with Need Automation = Yes is in scope', () => {
  const { inScope } = selectAutomationScope(DEMO, artifactWith(['| Need Automation | No |', '| Need Automation | Yes |']));

  deepStrictEqual(inScope.map((entry) => [entry.testCase.localId, entry.testCase.status]), [
    ['TC-99001-001', 'Published'],
    ['TC-99001-002', 'Approved'],
  ]);
});

test('Need Automation = Yes does not approve: an unapproved Yes case is refused', () => {
  for (const status of ['Draft', 'AI-Reviewed', 'Needs-Changes', 'Rejected']) {
    const { inScope, excluded } = selectAutomationScope(
      DEMO,
      artifactWith(
        ['| Need Automation | No |', '| Need Automation | Yes |'],
        ['| Review/Lifecycle Status | Approved |', `| Review/Lifecycle Status | ${status} |`],
      ),
    );

    ok(!inScope.some((entry) => entry.testCase.localId === 'TC-99001-002'), `${status} must not be in scope`);
    const refused = excluded.find((entry) => entry.testCase.localId === 'TC-99001-002');
    strictEqual(refused?.reason, 'NOT_APPROVED');
    ok(refused.detail.includes(status));
  }
});

test('approval does not imply automation: an Approved No case stays excluded', () => {
  const { excluded } = selectAutomationScope(DEMO, artifactWith());

  strictEqual(excluded[0]!.testCase.status, 'Approved');
  strictEqual(excluded[0]!.reason, 'NEED_AUTOMATION_NO');
});

test('an undecided case (no Need Automation row) is excluded, never treated as Yes', () => {
  const { inScope, excluded } = selectAutomationScope(DEMO, artifactWith(['| Need Automation | Yes |\n', '']));

  deepStrictEqual(inScope, []);
  deepStrictEqual(excluded.map((entry) => entry.reason), ['NEED_AUTOMATION_UNDECIDED', 'NEED_AUTOMATION_NO']);
});

test('every case is accounted for: in scope plus excluded equals the artifact', () => {
  const artifact = artifactWith();
  const { inScope, excluded } = selectAutomationScope(DEMO, artifact);

  strictEqual(inScope.length + excluded.length, artifact.testCases.length);
});

test('selection leaves every Need Automation value and status as the human set it', () => {
  const artifact = artifactWith();
  const before = artifact.testCases.map((entry) => [entry.needAutomation, entry.status]);

  selectAutomationScope(DEMO, artifact);

  deepStrictEqual(artifact.testCases.map((entry) => [entry.needAutomation, entry.status]), before);
});

test('plan and spec paths are organised by Module, not by User Story', () => {
  const [scoped] = selectAutomationScope(DEMO, artifactWith()).inScope;

  strictEqual(scoped!.moduleDir, 'Authentication');
  strictEqual(scoped!.planPath, 'docs/projects/DEMO/automation/Authentication/automation-plan.md');
  strictEqual(scoped!.specPath, 'automation/DEMO/Authentication/tests/TC-99001-001.spec.ts');
  strictEqual(scoped!.storyId, 99001);
  ok(!scoped!.planPath.includes('US-'));
  ok(!scoped!.specPath.includes('US-'));
});

test('two modules in one story map to two plans', () => {
  const artifact = artifactWith(
    ['| Need Automation | No |', '| Need Automation | Yes |'],
    [
      '| **Title** | `[DEMO][Authentication][Login - Portal] Verify a valid user can sign in` |\n| Project / Module / Feature-Page | DEMO / Authentication / Login - Portal |',
      '| **Title** | `[DEMO][User Management][Users] Verify a valid user can sign in` |\n| Project / Module / Feature-Page | DEMO / User Management / Users |',
    ],
  );

  deepStrictEqual(
    selectAutomationScope(DEMO, artifact).inScope.map((entry) => entry.planPath),
    ['docs/projects/DEMO/automation/Authentication/automation-plan.md', 'docs/projects/DEMO/automation/User-Management/automation-plan.md'],
  );
});

test('moduleDirName turns a Module into a stable directory name', () => {
  strictEqual(moduleDirName('Authentication'), 'Authentication');
  strictEqual(moduleDirName('User Management'), 'User-Management');
  strictEqual(moduleDirName('Manual Invoice'), 'Manual-Invoice');
  strictEqual(moduleDirName('  Geo Master & City  '), 'Geo-Master-City');
  throws(() => moduleDirName(' & '));
});

test('path helpers stay inside the active project', () => {
  const testCase = artifactWith().testCases[0]!;

  ok(automationPlanPathFor(DEMO, 'Authentication').startsWith('docs/projects/DEMO/automation/'));
  ok(specPathFor(DEMO, testCase).startsWith('automation/DEMO/'));
});

test('testCaseDetails tags a test with its Test Case and User Story, and annotates the ADO ID', () => {
  deepStrictEqual(testCaseDetails({ testCaseId: 'TC-53717-006', storyId: 53717, adoId: 55299 }), {
    tag: ['@TC-53717-006', '@US-53717'],
    annotation: [
      { type: 'test-case', description: 'TC-53717-006' },
      { type: 'user-story', description: '53717' },
      { type: 'ado-id', description: '55299' },
    ],
  });
});

test('testCaseDetails omits the ADO annotation for an unpublished case', () => {
  const details = testCaseDetails({ testCaseId: 'TC-99001-002', storyId: 99001, adoId: null });

  deepStrictEqual(details.annotation.map((entry) => entry.type), ['test-case', 'user-story']);
});

test('testCaseDetails refuses an ID that does not belong to the story, or is malformed', () => {
  // A spec copied from a neighbour with only one field edited would trace to the wrong case.
  throws(() => testCaseDetails({ testCaseId: 'TC-53717-006', storyId: 52860 }), /does not belong to User Story 52860/);
  throws(() => testCaseDetails({ testCaseId: 'TC-53717', storyId: 53717 }), /not a Test Case ID/);
});
