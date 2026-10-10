/**
 * Tests for the CSV-first Test Case contract (`docs/product-decisions.md` §6.4,
 * src/testcases/store.ts, src/testcases/csv-artifact.ts).
 *
 *   - The CSV is the single source of truth; every consumer loads it.
 *   - Markdown is rendered from the CSV and never written back into it.
 *   - Human CSV edits survive rendering, validation and publisher write-back.
 *   - Migration from a Markdown-only artifact is lossless or writes nothing.
 */

import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { selectAutomationScope } from '../src/automation/scope.ts';
import { listProjectKeys, resolveActiveProject, type ActiveProject } from '../src/projects/active-project.ts';
import { ArtifactError, GENERATED_BEGIN, GENERATED_END, parseArtifact } from '../src/testcases/artifact.ts';
import { CSV_COLUMNS, formatTestCaseCsv, parseTestCaseCsv } from '../src/testcases/csv-artifact.ts';
import { formatCsv, parseCsv } from '../src/testcases/csv.ts';
import {
  checkMarkdownSync,
  csvPathFor,
  loadTestCases,
  markdownPathFor,
  migrateMarkdownToCsv,
  recordPublishedId,
  renderMarkdown,
} from '../src/testcases/store.ts';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const CSV_FIXTURE = readFileSync(join(REPO_ROOT, 'tests/fixtures/valid-artifact.csv'), 'utf8');
const MD_FIXTURE = readFileSync(join(REPO_ROOT, 'tests/fixtures/valid-artifact.md'), 'utf8');
const STORY = 99001;

/** A scratch project root holding one story's files. */
function project(files: { csv?: string; md?: string }): string {
  const root = mkdtempSync(join(tmpdir(), 'qa-store-'));
  mkdirSync(join(root, 'test-cases', `US-${STORY}`), { recursive: true });
  if (files.csv !== undefined) writeFileSync(csvPathFor(root, STORY), files.csv, 'utf8');
  if (files.md !== undefined) writeFileSync(markdownPathFor(root, STORY), files.md, 'utf8');
  return root;
}

/** Edits one cell of the CSV text, the way a human would in a spreadsheet. */
function editCell(csv: string, localId: string, column: (typeof CSV_COLUMNS)[number], value: string): string {
  const rows = parseCsv(csv);
  const row = rows.find((entry) => entry[0] === localId);
  ok(row, `${localId} must be in the CSV`);
  row[CSV_COLUMNS.indexOf(column)] = value;
  return formatCsv(rows);
}

function expectArtifactError(fn: () => unknown, fragment: string): void {
  throws(fn, (error: unknown) => {
    ok(error instanceof ArtifactError, `expected ArtifactError, got ${String(error)}`);
    ok(`${error.message} ${error.details.join(' ')}`.includes(fragment), `"${error.message}" should mention "${fragment}"`);
    return true;
  });
}

// ---------------------------------------------------------------------------
// The CSV is the source of truth
// ---------------------------------------------------------------------------

test('the CSV fixture and the Markdown fixture hold the same cases', () => {
  const fromCsv = parseTestCaseCsv(CSV_FIXTURE, STORY, 'fixture.csv');
  const fromMd = parseArtifact(join(REPO_ROOT, 'tests/fixtures/valid-artifact.md'), STORY).testCases;
  deepStrictEqual(
    fromCsv.map(({ headingLine: _a, ...rest }) => rest),
    fromMd.map(({ headingLine: _b, ...rest }) => rest),
  );
});

test('loadTestCases reads the CSV and ignores Markdown that disagrees with it — CSV wins', () => {
  const root = project({ csv: CSV_FIXTURE });
  renderMarkdown(root, STORY);
  // Someone edits the rendering instead of the CSV.
  const md = readFileSync(markdownPathFor(root, STORY), 'utf8').replace('Click Login', 'Click Sign In NOW');
  writeFileSync(markdownPathFor(root, STORY), md);

  const loaded = loadTestCases(root, STORY);
  strictEqual(loaded.filePath, csvPathFor(root, STORY));
  strictEqual(loaded.testCases[1]!.steps[1]!.action, 'Click Login');
  ok(checkMarkdownSync(root, STORY).problems.length > 0, 'the stale rendering must be reported');
});

test('loadTestCases refuses a story that only has a legacy Markdown artifact, pointing at migration', () => {
  expectArtifactError(() => loadTestCases(project({ md: MD_FIXTURE }), STORY), 'testcases:migrate');
});

test('loadTestCases reports a missing story as a generation instruction', () => {
  expectArtifactError(() => loadTestCases(project({}), STORY), '/write-test-cases');
});

test('the provenance fingerprint comes from the Markdown header; cases come from the CSV', () => {
  // Without a rendering there is no provenance header to read.
  strictEqual(loadTestCases(project({ csv: CSV_FIXTURE }), STORY).contentFingerprint, null);

  const migrated = project({ md: MD_FIXTURE });
  migrateMarkdownToCsv(migrated, STORY);
  strictEqual(loadTestCases(migrated, STORY).contentFingerprint, '334a9561b7cb81fbaf6e6f2c9975044bcd3c702f838008052a67cb4c948d78d0');
});

// ---------------------------------------------------------------------------
// Rendering never modifies the CSV; CSV edits reach the Markdown
// ---------------------------------------------------------------------------

test('rendering Markdown from the CSV leaves the CSV byte-identical', () => {
  // A human-saved file: every field quoted, CRLF endings, no BOM.
  const humanStyle = parseCsv(CSV_FIXTURE)
    .map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  const root = project({ csv: humanStyle });
  const before = readFileSync(csvPathFor(root, STORY));

  renderMarkdown(root, STORY);
  renderMarkdown(root, STORY);

  deepStrictEqual(readFileSync(csvPathFor(root, STORY)), before);
  deepStrictEqual(checkMarkdownSync(root, STORY).problems, []);
});

test('human CSV edits to title, steps, expected results and Need Automation appear in the re-rendered Markdown', () => {
  let csv = CSV_FIXTURE;
  csv = editCell(csv, 'TC-99001-002', 'Title', '[DEMO][Authentication][Login - Portal] Verify a valid user signs in and lands on the dashboard');
  csv = editCell(csv, 'TC-99001-002', 'Steps', '1. Enter the credentials for `PRIMARY_VALID`\n2. Click Login\n3. Wait for the dashboard');
  csv = editCell(csv, 'TC-99001-002', 'Expected Results', '1. The values are accepted\n2. Navigation starts\n3. The dashboard is displayed');
  csv = editCell(csv, 'TC-99001-002', 'Need Automation', 'Yes');
  const root = project({ csv });

  renderMarkdown(root, STORY);
  const rendered = parseArtifact(markdownPathFor(root, STORY), STORY).testCases[1]!;

  strictEqual(rendered.title, '[DEMO][Authentication][Login - Portal] Verify a valid user signs in and lands on the dashboard');
  strictEqual(rendered.steps.length, 3);
  strictEqual(rendered.steps[2]!.expected, 'The dashboard is displayed');
  strictEqual(rendered.needAutomation, 'Yes');
  deepStrictEqual(checkMarkdownSync(root, STORY).problems, []);
});

test('a CSV edit not yet rendered is reported as drift, and rendering clears it', () => {
  const root = project({ csv: CSV_FIXTURE });
  renderMarkdown(root, STORY);
  writeFileSync(csvPathFor(root, STORY), editCell(CSV_FIXTURE, 'TC-99001-001', 'Need Automation', 'No'));

  ok(checkMarkdownSync(root, STORY).problems.some((problem) => problem.includes('needAutomation')));
  renderMarkdown(root, STORY);
  deepStrictEqual(checkMarkdownSync(root, STORY).problems, []);
});

test('rendering keeps narrative outside the generated block verbatim', () => {
  const root = project({ csv: CSV_FIXTURE });
  const narrative = ['# Test Cases — US 99001', '', '## How to read this file', 'Hand-written guidance.', ''];
  const tail = ['', '## AI self-review record', 'Hand-written review.', ''];
  writeFileSync(markdownPathFor(root, STORY), [...narrative, GENERATED_BEGIN, 'stale', GENERATED_END, ...tail].join('\n'));

  renderMarkdown(root, STORY);
  const md = readFileSync(markdownPathFor(root, STORY), 'utf8');
  ok(md.startsWith(narrative.join('\n')));
  ok(md.endsWith(tail.join('\n')));
  ok(!md.includes('\nstale\n'));
});

test('pipes and line breaks inside a step survive the CSV and the Markdown table', () => {
  const csv = editCell(CSV_FIXTURE, 'TC-99001-001', 'Steps', '1. Open the login URL | then wait\nfor the form\n2. Inspect the form fields');
  const root = project({ csv });
  renderMarkdown(root, STORY);

  const [first] = parseArtifact(markdownPathFor(root, STORY), STORY).testCases;
  strictEqual(first!.steps[0]!.action, 'Open the login URL | then wait\nfor the form');
  deepStrictEqual(checkMarkdownSync(root, STORY).problems, []);
});

test('a Rejected case renders under "Rejected test cases" and still matches the CSV', () => {
  const root = project({ csv: editCell(CSV_FIXTURE, 'TC-99001-002', 'Review/Lifecycle Status', 'Rejected') });
  renderMarkdown(root, STORY);
  const md = readFileSync(markdownPathFor(root, STORY), 'utf8');
  ok(md.indexOf('## Rejected test cases') < md.indexOf('### TC-99001-002'));
  deepStrictEqual(checkMarkdownSync(root, STORY).problems, []);
});

// ---------------------------------------------------------------------------
// CSV validation
// ---------------------------------------------------------------------------

test('the CSV parser refuses duplicate, malformed and foreign Test Case IDs', () => {
  const second = parseCsv(CSV_FIXTURE)[2]!;
  expectArtifactError(
    () => parseTestCaseCsv(formatCsv([...parseCsv(CSV_FIXTURE), second]), STORY, 'x.csv'),
    'Duplicate Test Case IDs',
  );
  expectArtifactError(() => parseTestCaseCsv(editCell(CSV_FIXTURE, 'TC-99001-002', 'Test Case ID', 'TC-99001-2'), STORY, 'x.csv'), 'not a valid Test Case ID');
  // The User Story ID column catches a file read for the wrong story first…
  expectArtifactError(() => parseTestCaseCsv(CSV_FIXTURE, 99002, 'x.csv'), 'belongs to User Story 99002');
  // …and an ID from another story is refused even when that column agrees.
  expectArtifactError(
    () => parseTestCaseCsv(editCell(CSV_FIXTURE, 'TC-99001-002', 'Test Case ID', 'TC-99002-002'), STORY, 'x.csv'),
    'belongs to User Story 99002',
  );
});

test('the CSV parser refuses a renamed, missing or reordered column', () => {
  expectArtifactError(() => parseTestCaseCsv(CSV_FIXTURE.replace('Need Automation', 'Automate?'), STORY, 'x.csv'), 'header');
});

test('the CSV parser refuses Steps and Expected Results that are not numbered alike', () => {
  expectArtifactError(
    () => parseTestCaseCsv(editCell(CSV_FIXTURE, 'TC-99001-001', 'Expected Results', '1. The login form is displayed'), STORY, 'x.csv'),
    'not numbered alike',
  );
});

test('the CSV parser refuses an invalid Need Automation, reads an empty one as undecided', () => {
  expectArtifactError(() => parseTestCaseCsv(editCell(CSV_FIXTURE, 'TC-99001-001', 'Need Automation', 'maybe'), STORY, 'x.csv'), 'Need Automation');
  const cases = parseTestCaseCsv(editCell(CSV_FIXTURE, 'TC-99001-001', 'Need Automation', ''), STORY, 'x.csv');
  strictEqual(cases[0]!.needAutomation, null);
});

test('the CSV parser refuses an unreadable Azure DevOps ID instead of assuming unpublished', () => {
  expectArtifactError(() => parseTestCaseCsv(editCell(CSV_FIXTURE, 'TC-99001-001', 'Azure DevOps ID', 'about 55294'), STORY, 'x.csv'), 'Azure DevOps ID');
});

test('the CSV parser refuses a title that disagrees with Project, Module and Feature/Page', () => {
  expectArtifactError(() => parseTestCaseCsv(editCell(CSV_FIXTURE, 'TC-99001-001', 'Module', 'Billing'), STORY, 'x.csv'), 'does not match');
});

test('a row with the wrong field count is refused rather than shifted', () => {
  const broken = CSV_FIXTURE.replace('Positive · UI,REQ-LOG-002 AC-1', 'Positive · UI,REQ-LOG-002, AC-1');
  expectArtifactError(() => parseTestCaseCsv(broken, STORY, 'x.csv'), 'fields');
});

test('an unnumbered line in Steps continues the step above it', () => {
  const csv = editCell(CSV_FIXTURE, 'TC-99001-001', 'Steps', '1. Open the login URL\nas an unauthenticated visitor\n2. Inspect the form fields');
  strictEqual(parseTestCaseCsv(csv, STORY, 'x.csv')[0]!.steps[0]!.action, 'Open the login URL\nas an unauthenticated visitor');
});

// ---------------------------------------------------------------------------
// Publisher write-back
// ---------------------------------------------------------------------------

test('recordPublishedId changes only the ID and status cells, keeping every human edit', () => {
  const edited = editCell(CSV_FIXTURE, 'TC-99001-002', 'Notes', '- Human note, with a comma and "quotes".\n- Second line.');
  const root = project({ csv: edited });
  renderMarkdown(root, STORY);

  recordPublishedId(root, STORY, 'TC-99001-002', 55700);

  const before = parseCsv(edited);
  const after = parseCsv(readFileSync(csvPathFor(root, STORY), 'utf8'));
  const changed: string[] = [];
  after.forEach((row, r) => row.forEach((value, c) => value !== before[r]![c] && changed.push(`${row[0]}:${CSV_COLUMNS[c]}`)));
  deepStrictEqual(changed, ['TC-99001-002:Azure DevOps ID', 'TC-99001-002:Review/Lifecycle Status']);

  const [first, second] = loadTestCases(root, STORY).testCases;
  strictEqual(second!.adoId, 55700);
  strictEqual(second!.status, 'Published');
  strictEqual(second!.needAutomation, 'No');
  strictEqual(first!.adoId, 55294);
  // The Markdown is re-rendered with the ID.
  deepStrictEqual(checkMarkdownSync(root, STORY).problems, []);
});

test('recordPublishedId for an unknown case says the work item WAS created', () => {
  const root = project({ csv: CSV_FIXTURE });
  expectArtifactError(() => recordPublishedId(root, STORY, 'TC-99001-099', 55701), 'WAS created');
});

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

test('migration writes a CSV that reproduces every case and keeps the narrative', () => {
  const root = project({ md: MD_FIXTURE });
  const result = migrateMarkdownToCsv(root, STORY);

  strictEqual(result.cases, 2);
  const legacy = parseArtifact(join(REPO_ROOT, 'tests/fixtures/valid-artifact.md'), STORY).testCases;
  deepStrictEqual(
    loadTestCases(root, STORY).testCases.map(({ headingLine: _a, ...rest }) => rest),
    legacy.map(({ headingLine: _b, ...rest }) => rest),
  );
  const md = readFileSync(markdownPathFor(root, STORY), 'utf8');
  ok(md.includes(GENERATED_BEGIN) && md.includes(GENERATED_END));
  ok(md.includes('334a9561b7cb81fbaf6e6f2c9975044bcd3c702f838008052a67cb4c948d78d0'), 'provenance header kept');
  deepStrictEqual(checkMarkdownSync(root, STORY).problems, []);
});

test('migration refuses to overwrite an existing CSV, which may hold human edits', () => {
  const root = project({ csv: CSV_FIXTURE, md: MD_FIXTURE });
  const before = readFileSync(csvPathFor(root, STORY));
  expectArtifactError(() => migrateMarkdownToCsv(root, STORY), 'refusing to overwrite');
  deepStrictEqual(readFileSync(csvPathFor(root, STORY)), before);
});

test('a rendered Markdown whose CSV is missing is not re-migrated', () => {
  const root = project({ csv: CSV_FIXTURE });
  renderMarkdown(root, STORY);
  const md = readFileSync(markdownPathFor(root, STORY), 'utf8');
  const bare = project({ md });
  expectArtifactError(() => migrateMarkdownToCsv(bare, STORY), 'Restore the CSV');
});

// ---------------------------------------------------------------------------
// Downstream consumers read the CSV
// ---------------------------------------------------------------------------

test('automation scope follows the latest CSV Need Automation and status, not the Markdown', () => {
  const root = project({ csv: CSV_FIXTURE });
  renderMarkdown(root, STORY);
  const demo: ActiveProject = { key: 'DEMO', root, profilePath: join(root, 'profile.md'), source: 'explicit' };

  strictEqual(selectAutomationScope(demo, loadTestCases(root, STORY)).inScope.length, 1);

  // The human flips TC-002 to Yes in the CSV; the Markdown is left stale.
  writeFileSync(csvPathFor(root, STORY), editCell(CSV_FIXTURE, 'TC-99001-002', 'Need Automation', 'Yes'));
  deepStrictEqual(
    selectAutomationScope(demo, loadTestCases(root, STORY)).inScope.map((entry) => entry.testCase.localId),
    ['TC-99001-001', 'TC-99001-002'],
  );

  // And an unapproved case is still refused, however it is marked.
  const unapproved = editCell(editCell(CSV_FIXTURE, 'TC-99001-002', 'Need Automation', 'Yes'), 'TC-99001-002', 'Review/Lifecycle Status', 'AI-Reviewed');
  writeFileSync(csvPathFor(root, STORY), unapproved);
  deepStrictEqual(
    selectAutomationScope(demo, loadTestCases(root, STORY)).inScope.map((entry) => entry.testCase.localId),
    ['TC-99001-001'],
  );
});

const CONSUMERS = [
  'src/cli/publish-test-cases.ts',
  'src/cli/automation-scope.ts',
  'src/cli/check-test-cases.ts',
  'src/cli/test-cases.ts',
  'src/automation/reporting/reporter.ts',
];

test('every consumer loads test cases through the CSV store, never by parsing the Markdown', () => {
  for (const path of CONSUMERS) {
    const source = readFileSync(join(REPO_ROOT, path), 'utf8');
    ok(/from '(\.\.\/)+testcases\/store\.ts'/.test(source), `${path} must import src/testcases/store.ts`);
    ok(!/\bparseArtifact\s*\(/.test(source), `${path} must not parse the Markdown for case content`);
  }
});

test('every Skill that consumes test cases names the CSV as its source, and none reads cases from the Markdown', () => {
  const skill = (name: string): string => readFileSync(join(REPO_ROOT, `.claude/skills/${name}/SKILL.md`), 'utf8');

  for (const name of ['write-test-cases', 'publish-test-cases', 'execute-test-cases', 'automate-test-cases']) {
    const text = skill(name);
    ok(text.includes('test-cases.csv'), `${name}: must name test-cases.csv`);
    ok(text.includes('§6.4'), `${name}: must cite the CSV-first decision (§6.4)`);
  }
  // Agent-driven consumers read cases through the strict parser, never by eye.
  for (const name of ['execute-test-cases', 'automate-test-cases']) {
    ok(/testcases:show/.test(skill(name)), `${name}: must read cases with npm run testcases:show`);
    ok(/allowed-tools:.*testcases:show/.test(skill(name)), `${name}: must be granted testcases:show`);
  }
  ok(/testcases:render/.test(skill('write-test-cases')), 'write-test-cases: must render the Markdown from the CSV');
  ok(!/Execution reads `test-cases\.md`/.test(skill('execute-test-cases')), 'execute-test-cases: must not read cases from the Markdown');
});

test('only the store and the Markdown reader call parseArtifact in src/', () => {
  const offenders: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(join(REPO_ROOT, dir), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else if (path.endsWith('.ts') && /\bparseArtifact(Text)?\s*\(/.test(readFileSync(join(REPO_ROOT, path), 'utf8'))) offenders.push(path);
    }
  };
  walk('src');
  deepStrictEqual(offenders.sort(), ['src/testcases/artifact.ts', 'src/testcases/store.ts']);
});

// ---------------------------------------------------------------------------
// Every real artifact in the repository
// ---------------------------------------------------------------------------

/** Every story directory under every project root, the synthetic one included. */
function storyDirectories(): { root: string; storyId: number }[] {
  const roots = listProjectKeys(join(REPO_ROOT, 'docs/projects')).map(
    (key) => resolveActiveProject(key, join(REPO_ROOT, 'docs/projects')).root,
  );
  roots.push(join(REPO_ROOT, 'src/automation/artifact-check/projects/ARTIFACT-CHECK'));

  const found: { root: string; storyId: number }[] = [];
  for (const root of roots) {
    const dir = join(root, 'test-cases');
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const match = /^US-(\d+)$/.exec(entry.name);
      if (entry.isDirectory() && match) found.push({ root, storyId: Number(match[1]) });
    }
  }
  return found;
}

test('every story in the repository has both test-cases.csv and test-cases.md, and they match', () => {
  const stories = storyDirectories();
  ok(stories.length > 0, 'expected at least one story with test cases');
  for (const { root, storyId } of stories) {
    ok(existsSync(csvPathFor(root, storyId)), `${root} US-${storyId}: test-cases.csv is missing`);
    ok(existsSync(markdownPathFor(root, storyId)), `${root} US-${storyId}: test-cases.md is missing`);
    deepStrictEqual(checkMarkdownSync(root, storyId).problems, [], `${root} US-${storyId}: Markdown out of date — run testcases:render`);
  }
});

test('re-serialising each real CSV through the writer reproduces the same cases', () => {
  for (const { root, storyId } of storyDirectories()) {
    const cases = loadTestCases(root, storyId).testCases;
    const again = parseTestCaseCsv(formatTestCaseCsv(cases, storyId), storyId, 'roundtrip');
    deepStrictEqual(
      again.map(({ headingLine: _a, ...rest }) => rest),
      cases.map(({ headingLine: _b, ...rest }) => rest),
    );
  }
});
