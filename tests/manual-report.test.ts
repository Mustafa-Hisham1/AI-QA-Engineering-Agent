/**
 * Tests for the MANUAL execution report (`manual-report.html`) and its isolation
 * from the automation report (`automation-report.html`) —
 * `docs/product-decisions.md` §10.4.
 *
 * Synthetic data only: no test case is executed, no application is touched.
 */

import { deepStrictEqual, notStrictEqual, ok, strictEqual, throws } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import type { ExecutionReport } from '../src/automation/reporting/model.ts';
import { writeRenderedReport } from '../src/automation/reporting/writer.ts';
import { latestManualRun, renderManualReportHtml, writeManualReport } from '../src/execution/manual-report.ts';
import {
  MANUAL_RESULTS_FILE,
  ManualResultsError,
  manualTotals,
  manualVerdict,
  validateManualResults,
  type ManualRunResults,
} from '../src/execution/manual-results.ts';
import { AUTOMATION_REPORT_FILE, MANUAL_REPORT_FILE, ReportIsolationError } from '../src/reporting/report-files.ts';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const STORY = 99001;
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** A manual results record exercising every status, an observation-only case and a Bug Candidate. */
function sampleRecord(runId = 'RUN-001'): Record<string, unknown> {
  return {
    executionType: 'MANUAL',
    project: 'DEMO',
    runId,
    userStory: { id: STORY, title: 'Demo story' },
    environment: { label: 'STG', host: 'demo-stg.example.test' },
    startedAt: '2026-10-10T10:00:00.000Z',
    finishedAt: '2026-10-10T10:12:30.000Z',
    executedBy: 'AI agent via Playwright MCP',
    testCaseSource: { path: `docs/projects/DEMO/test-cases/US-${STORY}/test-cases.csv`, sha256: 'a'.repeat(64) },
    completion: { status: 'COMPLETED' },
    results: [
      {
        testCaseId: 'TC-99001-001', title: '[DEMO][Auth][Login] Verify the login form', adoId: 55294, requirementReference: 'REQ-1',
        status: 'PASS', observationOnly: false, durationMs: 4000, classification: null, reason: null, preconditionCheck: 'Unauthenticated',
        steps: [{ index: 1, action: 'Open the login page', expected: 'The form is shown', actual: 'The form is shown', status: 'PASS' }],
        evidence: [], observations: [], bugCandidateId: null,
      },
      {
        testCaseId: 'TC-99001-002', title: '[DEMO][Auth][Login] Verify Remember Me', adoId: null, requirementReference: 'REQ-2',
        status: 'FAIL', observationOnly: false, durationMs: 6000, classification: 'PRODUCT_BUG', reason: 'Remember Me is absent', preconditionCheck: null,
        steps: [
          { index: 1, action: 'Open the login page', expected: 'The form is shown', actual: 'The form is shown', status: 'PASS' },
          { index: 2, action: 'Inspect the options', expected: 'Remember Me is present', actual: 'No Remember Me option', status: 'FAIL' },
        ],
        evidence: [{ path: 'evidence/TC-99001-002-step2.png', label: 'Step 2 — form without Remember Me' }],
        observations: ['The Forgot password link sits where Remember Me would be (unverified)'], bugCandidateId: 'BUG-CANDIDATE-1',
      },
      {
        testCaseId: 'TC-99001-003', title: '[DEMO][Auth][Login] Verify lockout', adoId: null, requirementReference: null,
        status: 'BLOCKED', observationOnly: false, durationMs: null, classification: 'TEST_DATA_ISSUE', reason: 'Handle ADMIN_LOCKOUT is not configured', preconditionCheck: null,
        steps: [{ index: 1, action: 'Log in as ADMIN_LOCKOUT', expected: 'Login form accepts input', actual: '', status: 'NOT EXECUTED' }],
        evidence: [], observations: [], bugCandidateId: null,
      },
      {
        testCaseId: 'TC-99001-004', title: '[DEMO][Auth][Login] Verify the Agent Portal login', adoId: null, requirementReference: null,
        status: 'SKIPPED', observationOnly: false, durationMs: null, classification: null, reason: 'Out of the requested scope', preconditionCheck: null,
        steps: [], evidence: [], observations: [], bugCandidateId: null,
      },
      {
        testCaseId: 'TC-99001-005', title: '[DEMO][Auth][Login] Observe the counter', adoId: null, requirementReference: null,
        status: 'PASS', observationOnly: true, durationMs: 3000, classification: null, reason: null, preconditionCheck: null,
        steps: [{ index: 1, action: 'Submit twice', expected: 'Observation only', actual: 'Counter showed 2', status: 'OBSERVED' }],
        evidence: [], observations: [], bugCandidateId: null,
      },
    ],
    bugCandidates: [
      {
        id: 'BUG-CANDIDATE-1', file: 'bug-candidates/BUG-CANDIDATE-1.md', title: '[DEMO][Auth][Login] Remember Me is missing',
        testCaseIds: ['TC-99001-002'], classification: 'PRODUCT_BUG', summary: 'The option REQ-2 requires is absent.',
        suspectedRootCause: 'The option may be behind a feature flag (unconfirmed)', status: 'Draft',
        evidence: [{ path: 'evidence/TC-99001-002-step2.png', label: 'Step 2' }],
      },
    ],
    observations: ['The page took 4 s to settle after login (unverified)'],
  };
}

/** A run directory with the files the sample record references. */
function runDirWith(record: Record<string, unknown>, root = mkdtempSync(join(tmpdir(), 'qa-manual-')), runId = 'RUN-001'): string {
  const dir = join(root, runId);
  mkdirSync(join(dir, 'evidence'), { recursive: true });
  mkdirSync(join(dir, 'bug-candidates'), { recursive: true });
  writeFileSync(join(dir, 'evidence', 'TC-99001-002-step2.png'), PNG);
  writeFileSync(join(dir, 'bug-candidates', 'BUG-CANDIDATE-1.md'), `# BUG-CANDIDATE-1\n\n| Related run | ${runId} |\n| Related Test Case | TC-99001-002 |\n`);
  writeFileSync(join(dir, MANUAL_RESULTS_FILE), JSON.stringify(record, null, 2));
  return dir;
}

function validRun(dir: string, runId = 'RUN-001'): ManualRunResults {
  return validateManualResults(JSON.parse(readFileSync(join(dir, MANUAL_RESULTS_FILE), 'utf8')), dir, { project: 'DEMO', storyId: STORY, runId });
}

function expectInvalid(mutate: (record: Record<string, unknown>) => void, fragment: string): void {
  const record = sampleRecord();
  mutate(record);
  const dir = runDirWith(record);
  throws(
    () => validRun(dir),
    (error: unknown) => {
      ok(error instanceof ManualResultsError, String(error));
      ok(error.details.some((detail) => detail.includes(fragment)), `expected a problem mentioning "${fragment}", got:\n${error.details.join('\n')}`);
      return true;
    },
  );
}

/** A minimal automation report, to put an automation-report.html on disk. */
function automationReport(): ExecutionReport {
  return {
    runId: 'RUN-001', project: 'DEMO', userStories: [STORY], modules: ['Auth'], environment: { label: 'STG', host: 'demo-stg.example.test' },
    startedAt: '2026-10-10T10:00:00.000Z', durationMs: 1000,
    totals: { total: 0, pass: 0, fail: 0, notRun: 0, notAutomated: 0 }, results: [], bugCandidates: [],
  };
}

// ---------------------------------------------------------------------------
// Generation and naming
// ---------------------------------------------------------------------------

test('a manual run writes manual-report.html into its own run directory — and only that file', () => {
  const dir = runDirWith(sampleRecord());
  const before = readdirSync(dir).sort();
  const path = writeManualReport(dir, validRun(dir), { currentSha256: 'a'.repeat(64) });

  strictEqual(path, join(dir, MANUAL_REPORT_FILE));
  strictEqual(MANUAL_REPORT_FILE, 'manual-report.html');
  deepStrictEqual(readdirSync(dir).sort(), [...before, MANUAL_REPORT_FILE].sort());
});

test('an automation run writes automation-report.html', () => {
  const dir = mkdtempSync(join(tmpdir(), 'qa-auto-'));
  const path = writeRenderedReport(dir, automationReport());
  strictEqual(AUTOMATION_REPORT_FILE, 'automation-report.html');
  strictEqual(path, join(dir, AUTOMATION_REPORT_FILE));
  ok(!existsSync(join(dir, MANUAL_REPORT_FILE)));
});

test('a manual report cannot overwrite an automation report', () => {
  const dir = runDirWith(sampleRecord());
  writeRenderedReport(dir, automationReport());
  const automation = readFileSync(join(dir, AUTOMATION_REPORT_FILE));

  throws(() => writeManualReport(dir, validRun(dir), { currentSha256: null }), ReportIsolationError);
  deepStrictEqual(readFileSync(join(dir, AUTOMATION_REPORT_FILE)), automation);
  ok(!existsSync(join(dir, MANUAL_REPORT_FILE)));
});

test('an automation report cannot overwrite a manual report', () => {
  const dir = runDirWith(sampleRecord());
  writeManualReport(dir, validRun(dir), { currentSha256: null });
  const manual = readFileSync(join(dir, MANUAL_REPORT_FILE));

  throws(() => writeRenderedReport(dir, automationReport()), ReportIsolationError);
  deepStrictEqual(readFileSync(join(dir, MANUAL_REPORT_FILE)), manual);
  ok(!existsSync(join(dir, AUTOMATION_REPORT_FILE)));
  ok(!existsSync(join(dir, 'bug-candidates', 'BUG-001.md')), 'the refused automation write must leave no file behind');
});

test('reports stay isolated across run directories: a new run never touches an earlier one', () => {
  const root = mkdtempSync(join(tmpdir(), 'qa-runs-'));
  const first = runDirWith(sampleRecord('RUN-001'), root, 'RUN-001');
  writeManualReport(first, validRun(first, 'RUN-001'), { currentSha256: null });
  const firstReport = readFileSync(join(first, MANUAL_REPORT_FILE));

  const record = sampleRecord('RUN-002');
  (record.results as Record<string, unknown>[])[0]!.title = '[DEMO][Auth][Login] Verify the login form — second run';
  const second = runDirWith(record, root, 'RUN-002');
  writeManualReport(second, validRun(second, 'RUN-002'), { currentSha256: null });

  deepStrictEqual(readFileSync(join(first, MANUAL_REPORT_FILE)), firstReport);
  notStrictEqual(readFileSync(join(second, MANUAL_REPORT_FILE), 'utf8'), firstReport.toString('utf8'));
  strictEqual(latestManualRun(root), 'RUN-002');
});

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

test('each report states its own execution type, and never the other', () => {
  const dir = runDirWith(sampleRecord());
  const manual = renderManualReportHtml(validRun(dir), { currentSha256: null });
  ok(manual.includes('data-execution-type="MANUAL"'));
  ok(manual.includes('MANUAL (Playwright MCP)'));
  ok(!manual.includes('data-execution-type="AUTOMATED"'));

  const autoDir = mkdtempSync(join(tmpdir(), 'qa-auto-'));
  const automation = readFileSync(writeRenderedReport(autoDir, automationReport()), 'utf8');
  ok(automation.includes('data-execution-type="AUTOMATED"'));
  ok(!automation.includes('data-execution-type="MANUAL"'));
});

test('manual report totals match the recorded results, and every executed case appears', () => {
  const dir = runDirWith(sampleRecord());
  const run = validRun(dir);
  const html = renderManualReportHtml(run, { currentSha256: null });
  const totals = manualTotals(run.results);

  deepStrictEqual(totals, { total: 5, pass: 2, fail: 1, blocked: 1, skipped: 1, notReached: 0 });
  strictEqual(manualVerdict(totals), 'FAIL');
  for (const [key, value] of Object.entries(totals)) {
    // "Not reached" is shown only when the run stopped (tests/run-policy.test.ts).
    if (key === 'notReached') continue;
    ok(html.includes(`data-total="${key}">${value}<`), `summary card ${key} must show ${value}`);
  }
  for (const result of run.results) ok(html.includes(`id="tc-${result.testCaseId}"`), `${result.testCaseId} must appear`);
  ok(html.includes('Remember Me is present') && html.includes('No Remember Me option'), 'Expected and Actual of each step');
  ok(html.includes('PRODUCT_BUG') && html.includes('TEST_DATA_ISSUE'), 'classifications');
  ok(html.includes('id="BUG-CANDIDATE-1"'), 'Bug Candidates section');
  ok(html.includes('Demo story') && html.includes('demo-stg.example.test') && html.includes('RUN-001'), 'header facts');
  ok(html.includes('12 m 30 s'), 'duration from start to finish');
});

test('the verdict is INCOMPLETE when nothing failed but a case was blocked', () => {
  deepStrictEqual(manualVerdict({ total: 2, pass: 1, fail: 0, blocked: 1, skipped: 0, notReached: 0 }), 'INCOMPLETE');
  deepStrictEqual(manualVerdict({ total: 2, pass: 1, fail: 0, blocked: 0, skipped: 1, notReached: 0 }), 'PASS');
});

test('every evidence and Bug Candidate link in the manual report resolves relative to the report', () => {
  const dir = runDirWith(sampleRecord());
  const path = writeManualReport(dir, validRun(dir), { currentSha256: null });
  const html = readFileSync(path, 'utf8');
  const links = [...html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)].map((match) => match[1]!);

  ok(links.length > 0);
  for (const link of links) {
    ok(/^(evidence|bug-candidates)\//.test(link), `unexpected link target ${link}`);
    ok(existsSync(join(dir, link)), `${link} must exist beside the report`);
  }
});

test('the manual report is self-contained: no script and no external resource', () => {
  const dir = runDirWith(sampleRecord());
  const html = renderManualReportHtml(validRun(dir), { currentSha256: null });
  ok(!/<script/i.test(html));
  ok(!/(src|href)="(https?:)?\/\//i.test(html));
});

test('report text is escaped, never interpreted as markup', () => {
  const record = sampleRecord();
  (record.results as Record<string, unknown>[])[0]!.title = '[DEMO][Auth][Login] <img src=x onerror=alert(1)>';
  const dir = runDirWith(record);
  const html = renderManualReportHtml(validRun(dir), { currentSha256: null });
  ok(!html.includes('<img src=x'));
  ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
});

test('a CSV changed since the run is flagged in the report', () => {
  const dir = runDirWith(sampleRecord());
  ok(renderManualReportHtml(validRun(dir), { currentSha256: 'a'.repeat(64) }).includes('unchanged since the run'));
  ok(renderManualReportHtml(validRun(dir), { currentSha256: 'b'.repeat(64) }).includes('has changed since this run'));
});

// ---------------------------------------------------------------------------
// Validation — nothing is rendered from a record that cannot be trusted
// ---------------------------------------------------------------------------

test('validation refuses records that would mislead the report', () => {
  expectInvalid((r) => (r.executionType = 'AUTOMATED'), 'executionType');
  expectInvalid((r) => ((r.environment as Record<string, unknown>).label = 'PROD'), 'PROD');
  expectInvalid((r) => (r.runId = 'RUN-009'), 'runId');
  expectInvalid((r) => ((r.testCaseSource as Record<string, unknown>).path = 'docs/test-cases.md'), 'test-cases.csv');
  expectInvalid((r) => ((r.results as Record<string, unknown>[])[1]!.classification = null), 'needs a failure classification');
  expectInvalid((r) => ((r.results as Record<string, unknown>[])[2]!.reason = null), 'needs a reason');
  expectInvalid((r) => ((r.results as Record<string, unknown>[])[0]!.testCaseId = 'TC-12345-001'), 'not a Test Case ID of User Story');
  expectInvalid((r) => ((r.results as Record<string, unknown>[])[1]!.status = 'PASS'), 'PASS needs every step PASS');
  expectInvalid((r) => ((r.results as Record<string, unknown>[])[0]!.status = 'FAIL'), 'FAIL needs at least one failed step');
  expectInvalid((r) => ((r.results as Record<string, unknown>[])[0]!.status = 'PASSED'), 'status must be one of');
  expectInvalid((r) => ((r.bugCandidates as Record<string, unknown>[])[0]!.status = 'Approved'), 'a new Bug Candidate is always Draft');
  expectInvalid((r) => (((r.results as Record<string, unknown>[])[1]!.evidence as Record<string, unknown>[])[0]!.path = 'evidence/missing.png'), 'does not exist');
  expectInvalid((r) => (((r.results as Record<string, unknown>[])[1]!.evidence as Record<string, unknown>[])[0]!.path = '../../.env'), 'must be evidence/');
  expectInvalid((r) => (r.results = []), 'at least one Test Case');
});

// ---------------------------------------------------------------------------
// The CLI, end to end, in a scratch workspace
// ---------------------------------------------------------------------------

/** A scratch workspace with a DEMO project, a CSV and a manual run. */
function workspace(record: Record<string, unknown>, env = ''): { root: string; runDir: string; csv: string } {
  const root = mkdtempSync(join(tmpdir(), 'qa-ws-'));
  const projectRoot = join(root, 'docs', 'projects', 'DEMO');
  mkdirSync(join(projectRoot, 'test-cases', `US-${STORY}`), { recursive: true });
  writeFileSync(join(projectRoot, 'profile.md'), '# DEMO\n\n| Setting | Value |\n|---|---|\n| Project Key | DEMO |\n\n| Handle | Purpose |\n|---|---|\n| `DEMO_ACCOUNT` | An account |\n');
  cpSync(join(REPO, 'tests', 'fixtures', 'valid-artifact.csv'), join(projectRoot, 'test-cases', `US-${STORY}`, 'test-cases.csv'));
  if (env) writeFileSync(join(root, '.env'), env);
  const runDir = runDirWith(record, join(projectRoot, 'executions', `US-${STORY}`));
  return { root, runDir, csv: join(projectRoot, 'test-cases', `US-${STORY}`, 'test-cases.csv') };
}

function runCli(cwd: string): { status: number | null; out: string } {
  const result = spawnSync(process.execPath, [join(REPO, 'src', 'cli', 'execution-report.ts'), String(STORY), '--project', 'DEMO'], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, QA_ACTIVE_PROJECT: '' },
  });
  return { status: result.status, out: `${result.stdout}${result.stderr}` };
}

const sha = (path: string): string => createHash('sha256').update(readFileSync(path)).digest('hex');

test('execution:report writes manual-report.html for the latest manual run and leaves the CSV byte-identical', () => {
  const { root, runDir, csv } = workspace(sampleRecord());
  const before = sha(csv);

  const { status, out } = runCli(root);

  strictEqual(status, 0, out);
  ok(existsSync(join(runDir, MANUAL_REPORT_FILE)), out);
  ok(out.includes('RUN-001 (MANUAL)'), out);
  strictEqual(sha(csv), before);
});

test('execution:report refuses a record containing a configured handle value, and writes nothing', () => {
  const record = sampleRecord();
  (record.results as Record<string, unknown>[])[0]!.observations = ['Logged in as demo.user@example.test'];
  const { root, runDir } = workspace(record, 'DEMO_ACCOUNT_USERNAME=demo.user@example.test\nDEMO_ACCOUNT_PASSWORD=Sup3r-Secret!\n');

  const { status, out } = runCli(root);

  strictEqual(status, 1, out);
  ok(out.includes('contains the value of a configured handle or credential'), out);
  ok(!out.includes('demo.user@example.test') && !out.includes('Sup3r-Secret!'), 'the value itself is never printed');
  ok(!existsSync(join(runDir, MANUAL_REPORT_FILE)));
});

// ---------------------------------------------------------------------------
// Separation of the code paths
// ---------------------------------------------------------------------------

test('the /execute-test-cases Skill makes manual-report.html a mandatory final step', () => {
  const skill = readFileSync(join(REPO, '.claude/skills/execute-test-cases/SKILL.md'), 'utf8');
  ok(/allowed-tools:.*execution:report/.test(skill), 'the Skill must be granted npm run execution:report');
  ok(/Generate the MANUAL HTML report \(mandatory\)/.test(skill));
  ok(skill.includes('manual-report.html') && skill.includes('execution-results.json'));
  ok(/never write `automation-report\.html`/.test(skill), 'the Skill must never write the automation report');
});

test('the automation Skill names automation-report.html, never the manual report', () => {
  const skill = readFileSync(join(REPO, '.claude/skills/automate-test-cases/SKILL.md'), 'utf8');
  ok(skill.includes('automation-report.html'));
  ok(!skill.includes('execution-report.html'), 'the old automation filename must be gone');
});

test('the manual report code depends on no automation run and never writes Test Case files', () => {
  const read = (path: string): string => readFileSync(join(REPO, path), 'utf8');
  for (const path of ['src/execution/manual-results.ts', 'src/execution/manual-report.ts', 'src/cli/execution-report.ts']) {
    const source = read(path);
    ok(!/automation\/reporting/.test(source), `${path} must not depend on the automation reporter`);
    ok(!/recordPublishedId|renderMarkdown|migrateMarkdownToCsv|formatTestCaseCsv/.test(source), `${path} must not write Test Case files`);
  }
  // The manual writer writes exactly one file, at the guarded path.
  const writer = read('src/execution/manual-report.ts');
  strictEqual((writer.match(/writeFileSync\(/g) ?? []).length, 1);
  ok(/const htmlPath = reportPathFor\(runDir, 'manual'\)/.test(writer));
});
