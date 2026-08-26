/**
 * Golden tests for the three disjoint Bug rich-text builders.
 *
 * The disjoint field mapping (`docs/product-decisions.md` §5.4) was verified
 * once by hand against Bug 56329, phrase by phrase. These tests make that
 * verification repeatable: they assert not only that each field carries its own
 * content, but that nothing leaks across the boundary between them.
 */

import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildCreateBugOperations,
  buildDescriptionHtml,
  buildReproStepsHtml,
  buildSystemInfoHtml,
  type BugCandidateRecord,
  type BugPlacement,
} from '../src/ado/bug.ts';
import { FIELD } from '../src/ado/fields.ts';

/**
 * A Bug Candidate whose every section carries a unique marker word, so a leak
 * from one field into another is detectable by searching for that word alone.
 */
const BUG: BugCandidateRecord = {
  title: '[DEMO][Authentication][Login] Verify lockout counter resets',
  description: 'DESCMARKER the lockout counter does not reset after a successful sign-in.',
  preconditions: ['PRECONDMARKER an account exists', 'PRECONDMARKER the counter is at two'],
  steps: ['STEPMARKER open the login page', 'STEPMARKER sign in with valid credentials'],
  expectedResult: 'EXPECTEDMARKER the failed-attempt counter returns to zero.',
  actualResult: 'ACTUALMARKER the counter remains at two.',
  environmentLabel: 'STG',
  environmentHost: 'https://example-host.invalid',
  requirementReference: 'REQMARKER REQ-LOG-018 AC-2',
  relatedTestCaseLocalId: 'TC-99001-002',
  relatedTestCaseAdoId: 55295,
  relatedUserStoryId: 99001,
  failureClassification: 'PRODUCT_BUG',
  evidenceNote: 'EVIDENCEMARKER screenshot attached, credential masking confirmed.',
};

const PLACEMENT: BugPlacement = {
  parentUserStoryId: 99001,
  areaPath: 'DEMO\\Team',
  iterationPath: 'DEMO\\Sprint 1',
  assignedTo: 'someone@example.invalid',
  severity: '3 - Medium',
};

/** Every marker word, mapped to the single field allowed to contain it. */
const MARKER_OWNER = {
  DESCMARKER: 'description',
  PRECONDMARKER: 'repro',
  STEPMARKER: 'repro',
  EXPECTEDMARKER: 'repro',
  ACTUALMARKER: 'repro',
  REQMARKER: 'repro',
  EVIDENCEMARKER: 'system',
} as const;

test('Description carries the description alone, with no section heading', () => {
  const html = buildDescriptionHtml(BUG);

  ok(html.includes('DESCMARKER'));
  // Description is the field shown first on every board card; a heading there
  // reads as a fragment of a larger document rather than a summary.
  ok(!html.includes('<b>'));
});

test('Repro Steps carries preconditions, steps, expected, actual, requirement and test case', () => {
  const html = buildReproStepsHtml(BUG);

  for (const heading of [
    'Preconditions',
    'Steps to Reproduce',
    'Expected Result',
    'Actual Result',
    'Requirement Reference',
    'Related Test Case',
  ]) {
    ok(html.includes(`<b>${heading}</b>`), `Repro Steps must carry the ${heading} section`);
  }

  // Both halves of the pair are always emitted: losing one turns a reproducible
  // report into an argument.
  ok(html.includes('EXPECTEDMARKER'));
  ok(html.includes('ACTUALMARKER'));
  ok(html.includes('TC-99001-002'));
  ok(html.includes('55295'));
});

test('Repro Steps renders steps as an ordered list and preconditions as unordered', () => {
  const html = buildReproStepsHtml(BUG);

  ok(html.includes('<ol>'));
  ok(html.includes('<ul>'));
});

test('System Info carries environment label AND host, classification and evidence', () => {
  const html = buildSystemInfoHtml(BUG);

  for (const heading of ['Environment', 'Failure Classification', 'Evidence']) {
    ok(html.includes(`<b>${heading}</b>`), `System Info must carry the ${heading} section`);
  }

  // Label and host are recorded together because they can legitimately disagree.
  ok(html.includes('STG'));
  ok(html.includes('https://example-host.invalid'));
  ok(html.includes('PRODUCT_BUG'));
  ok(html.includes('EVIDENCEMARKER'));
});

test('the three fields are disjoint — no marker appears in more than one', () => {
  const fields = {
    description: buildDescriptionHtml(BUG),
    repro: buildReproStepsHtml(BUG),
    system: buildSystemInfoHtml(BUG),
  };

  for (const [marker, owner] of Object.entries(MARKER_OWNER)) {
    const present = Object.entries(fields)
      .filter(([, html]) => html.includes(marker))
      .map(([name]) => name);

    deepStrictEqual(present, [owner], `${marker} must appear only in the ${owner} field`);
  }
});

test('empty precondition and step lists render as None rather than an empty list', () => {
  const html = buildReproStepsHtml({ ...BUG, preconditions: [], steps: [] });

  ok(html.includes('<i>None</i>'));
  ok(!html.includes('<ul></ul>'));
  ok(!html.includes('<ol></ol>'));
});

test('user content is HTML-escaped, so markup in a candidate cannot break the field', () => {
  const html = buildDescriptionHtml({
    ...BUG,
    description: 'A <script>alert(1)</script> & "quoted" value',
  });

  ok(!html.includes('<script>'));
  ok(html.includes('&lt;script&gt;'));
  ok(html.includes('&amp;'));
});

test('buildCreateBugOperations writes Severity but never Priority', () => {
  const ops = buildCreateBugOperations(BUG, PLACEMENT);
  const paths = ops.map((op) => op.path);

  // Severity is alwaysRequired with no default, so a create must set it.
  ok(paths.includes(`/fields/${FIELD.severity}`), 'Severity must be written');

  // Priority has a template default; leaving it unset is how that default is
  // honoured (§5.2). Writing it silently overrides the process template.
  ok(!paths.includes(`/fields/${FIELD.priority}`), 'Priority must NOT be written by default');
});

test('buildCreateBugOperations writes Priority only when explicitly overridden', () => {
  const ops = buildCreateBugOperations(BUG, { ...PLACEMENT, priorityOverride: '1' });
  const priority = ops.find((op) => op.path === `/fields/${FIELD.priority}`);

  strictEqual(priority?.value, '1');
});

test('buildCreateBugOperations omits the assignee when publishing unassigned', () => {
  const ops = buildCreateBugOperations(BUG, { ...PLACEMENT, assignedTo: null });

  ok(!ops.some((op) => op.path === `/fields/${FIELD.assignedTo}`));
});

test('buildCreateBugOperations maps each section onto its own field', () => {
  const ops = buildCreateBugOperations(BUG, PLACEMENT);
  const valueAt = (path: string) => String(ops.find((op) => op.path === path)?.value ?? '');

  ok(valueAt(`/fields/${FIELD.title}`).includes('lockout counter'));
  ok(valueAt(`/fields/${FIELD.description}`).includes('DESCMARKER'));
  ok(valueAt(`/fields/${FIELD.reproSteps}`).includes('STEPMARKER'));
  ok(valueAt(`/fields/${FIELD.systemInfo}`).includes('EVIDENCEMARKER'));

  // The disjointness that was verified by hand against a real Bug, asserted here.
  ok(!valueAt(`/fields/${FIELD.description}`).includes('STEPMARKER'));
  ok(!valueAt(`/fields/${FIELD.reproSteps}`).includes('DESCMARKER'));
  ok(!valueAt(`/fields/${FIELD.systemInfo}`).includes('STEPMARKER'));
});
