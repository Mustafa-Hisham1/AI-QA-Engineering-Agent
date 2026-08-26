/**
 * Golden-file tests for the Test Case artifact parser.
 *
 * These lock in CURRENT behaviour so the project-context refactor cannot change
 * it by accident. The parser is the piece a path or key change touches first,
 * and its failure modes are the ones that would silently publish wrong content:
 * a misread Azure DevOps ID creates a duplicate, a misread status publishes
 * something nobody approved.
 */

import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { ArtifactError, artifactPathFor, parseArtifact, recordPublishedId } from '../src/testcases/artifact.ts';

const FIXTURE = fileURLToPath(new URL('./fixtures/valid-artifact.md', import.meta.url));

/** Writes content to a scratch file so a mutating test never touches the fixture. */
function scratchFile(content: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'qa-artifact-'));
  const path = join(dir, 'test-cases.md');
  writeFileSync(path, content, 'utf8');
  return path;
}

/** The fixture with one region replaced, to provoke a specific failure. */
function fixtureWithReplacement(from: string, to: string): string {
  const text = readFileSync(FIXTURE, 'utf8');
  ok(text.includes(from), `fixture must contain "${from}"`);
  return scratchFile(text.replace(from, to));
}

test('artifactPathFor builds the per-story artifact path inside its project', () => {
  strictEqual(
    artifactPathFor('docs/projects/NBO', 53717),
    'docs/projects/NBO/test-cases/US-53717/test-cases.md',
  );
});

test('artifactPathFor keeps two projects on separate paths for the same story ID', () => {
  // The same story number in two projects must never resolve to one file.
  const nbo = artifactPathFor('docs/projects/NBO', 53717);
  const ndc = artifactPathFor('docs/projects/NDC-CORE', 53717);

  ok(nbo !== ndc);
});

test('parseArtifact reads provenance and every case in file order', () => {
  const artifact = parseArtifact(FIXTURE, 99001);

  strictEqual(artifact.storyId, 99001);
  strictEqual(
    artifact.contentFingerprint,
    '334a9561b7cb81fbaf6e6f2c9975044bcd3c702f838008052a67cb4c948d78d0',
  );
  deepStrictEqual(
    artifact.testCases.map((c) => c.localId),
    ['TC-99001-001', 'TC-99001-002'],
  );
});

test('parseArtifact maps every metadata field of a published case', () => {
  const [first] = parseArtifact(FIXTURE, 99001).testCases;

  strictEqual(
    first!.title,
    '[DEMO][Authentication][Login - Portal] Verify the login form presents Email and Password',
  );
  strictEqual(first!.project, 'DEMO');
  strictEqual(first!.module, 'Authentication');
  strictEqual(first!.featurePage, 'Login - Portal');
  strictEqual(first!.testType, 'Positive · UI');
  strictEqual(first!.requirementReference, 'REQ-LOG-002 AC-1');
  strictEqual(first!.decisionsApplied, '—');
  strictEqual(first!.adoId, 55294);
  strictEqual(first!.status, 'Published');
});

test('parseArtifact reads an unpublished case as adoId null', () => {
  const [, second] = parseArtifact(FIXTURE, 99001).testCases;

  strictEqual(second!.adoId, null);
  strictEqual(second!.status, 'Approved');
  strictEqual(second!.decisionsApplied, 'D-01');
});

test('parseArtifact captures precondition, test data, steps and notes', () => {
  const [first, second] = parseArtifact(FIXTURE, 99001).testCases;

  deepStrictEqual(first!.precondition, [
    '- The portal URL is reachable and the user is **not** authenticated.',
  ]);
  deepStrictEqual(first!.testData, ['- None.']);
  strictEqual(first!.steps.length, 2);
  deepStrictEqual(first!.steps[0], {
    index: 1,
    action: 'Open the login URL as an unauthenticated visitor',
    expected: 'The login form is displayed',
  });

  // Test data is referenced by handle, never by value (invariant 7).
  ok(second!.testData.some((line) => line.includes('PRIMARY_VALID')));
  deepStrictEqual(second!.notes, ['- Settle before judging the post-submit URL.']);
});

test('parseArtifact records the heading line so rewriting stays precise', () => {
  const [first, second] = parseArtifact(FIXTURE, 99001).testCases;

  ok(first!.headingLine > 0);
  ok(second!.headingLine > first!.headingLine);
});

test('parseArtifact reports a missing file as a generation instruction', () => {
  throws(
    () => parseArtifact(join(tmpdir(), 'definitely-absent-artifact.md'), 53717),
    (error: unknown) => {
      ok(error instanceof ArtifactError);
      ok(error.message.includes('No Test Case artifact at'));
      return true;
    },
  );
});

test('parseArtifact rejects an unreadable Azure DevOps ID instead of assuming unpublished', () => {
  // Reading an unparseable cell as "not published" is exactly how a duplicate
  // work item gets created, so it must fail loudly.
  const path = fixtureWithReplacement(
    '| Azure DevOps ID | **55294** |',
    '| Azure DevOps ID | probably 55294 |',
  );

  throws(
    () => parseArtifact(path, 99001),
    (error: unknown) => {
      ok(error instanceof ArtifactError);
      ok(error.message.includes('could not read the Azure DevOps ID cell'));
      return true;
    },
  );
});

test('parseArtifact rejects an unknown Review/Lifecycle Status', () => {
  const path = fixtureWithReplacement(
    '| Review/Lifecycle Status | Approved |',
    '| Review/Lifecycle Status | Signed-Off |',
  );

  throws(
    () => parseArtifact(path, 99001),
    (error: unknown) => {
      ok(error instanceof ArtifactError);
      ok(error.message.includes('unknown Review/Lifecycle Status'));
      return true;
    },
  );
});

test('parseArtifact rejects a Title that disagrees with its structured fields', () => {
  const path = fixtureWithReplacement(
    '| Project / Module / Feature-Page | DEMO / Authentication / Login - Portal |\n| Test Type | Positive · UI |\n| Requirement Reference | REQ-LOG-002 AC-1 |',
    '| Project / Module / Feature-Page | DEMO / Billing / Login - Portal |\n| Test Type | Positive · UI |\n| Requirement Reference | REQ-LOG-002 AC-1 |',
  );

  throws(
    () => parseArtifact(path, 99001),
    (error: unknown) => {
      ok(error instanceof ArtifactError);
      ok(error.message.includes('Title does not match its structured fields'));
      return true;
    },
  );
});

test('parseArtifact rejects a scope that is not exactly three parts', () => {
  const path = fixtureWithReplacement(
    '| Project / Module / Feature-Page | DEMO / Authentication / Login - Portal |\n| Test Type | Positive · UI |\n| Requirement Reference | REQ-LOG-002 AC-1 |',
    '| Project / Module / Feature-Page | DEMO / Authentication |\n| Test Type | Positive · UI |\n| Requirement Reference | REQ-LOG-002 AC-1 |',
  );

  throws(
    () => parseArtifact(path, 99001),
    (error: unknown) => {
      ok(error instanceof ArtifactError);
      ok(error.message.includes('must have exactly three slash-separated values'));
      return true;
    },
  );
});

test('parseArtifact rejects a step with no expected result', () => {
  const path = fixtureWithReplacement(
    '| 2 | Inspect the form fields | An **Email** field and a **Password** field are present |',
    '| 2 | Inspect the form fields |  |',
  );

  throws(
    () => parseArtifact(path, 99001),
    (error: unknown) => {
      ok(error instanceof ArtifactError);
      ok(error.message.includes('has no expected result'));
      return true;
    },
  );
});

test('recordPublishedId writes the ID back and sets the status to Published', () => {
  const path = scratchFile(readFileSync(FIXTURE, 'utf8'));

  recordPublishedId(path, 'TC-99001-002', 55700);

  const [first, second] = parseArtifact(path, 99001).testCases;
  strictEqual(second!.adoId, 55700);
  strictEqual(second!.status, 'Published');

  // The other case must be untouched — a write-back that edits a neighbouring
  // case would re-point an already-published item at different content.
  strictEqual(first!.adoId, 55294);
  strictEqual(first!.status, 'Published');
});
