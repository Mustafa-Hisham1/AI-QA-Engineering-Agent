/**
 * Tests for the "Bug Report" section of BOTH QA reports — manual-report.html
 * and automation-report.html — and for Bug Candidate dispositions
 * (`docs/product-decisions.md` §10.6).
 *
 * Synthetic data only: nothing is executed, no application is touched.
 */

import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { renderBugCandidateMarkdown, renderReportHtml } from '../src/automation/reporting/generator.ts';
import type { BugCandidate, ExecutionReport } from '../src/automation/reporting/model.ts';
import { writeRenderedReport } from '../src/automation/reporting/writer.ts';
import { renderManualReportHtml, writeManualReport } from '../src/execution/manual-report.ts';
import { MANUAL_RESULTS_FILE, ManualResultsError, manualTotals, validateManualResults, type ManualRunResults } from '../src/execution/manual-results.ts';
import { renderBugReportSection, type BugReportEntry } from '../src/reporting/bug-report.ts';
import { AUTOMATION_REPORT_FILE, MANUAL_REPORT_FILE } from '../src/reporting/report-files.ts';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const STORY = 99002;
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** The section of a report between its "Bug Report" heading and the next h2 or footer. */
function bugSection(html: string): string {
  const start = html.indexOf('<section class="bug-report"');
  ok(start >= 0, 'the report must contain the Bug Report section');
  return html.slice(start, html.indexOf('</section>', start) + '</section>'.length);
}

/** The Execution Summary card, which a Bug Candidate resolution must never change. */
function summarySection(html: string): string {
  const start = html.indexOf('<h2>Execution Summary</h2>');
  ok(start >= 0);
  return html.slice(start, html.indexOf('<h2>Test Case Results</h2>', start));
}

// ---------------------------------------------------------------------------
// Manual run fixtures
// ---------------------------------------------------------------------------

const RESOLUTION = {
  disposition: 'NOT_A_BUG',
  decidedBy: 'human reviewer',
  decidedAt: '2026-10-10',
  decisionRef: 'D-90',
  rationale: 'The observed behaviour is correct.',
};

function manualRecord(runId: string, bugId: string, resolved: boolean): Record<string, unknown> {
  return {
    executionType: 'MANUAL',
    project: 'DEMO',
    runId,
    userStory: { id: STORY, title: 'Demo story' },
    environment: { label: 'STG', host: 'demo-stg.example.test' },
    startedAt: '2026-10-10T10:00:00.000Z',
    finishedAt: '2026-10-10T10:05:00.000Z',
    executedBy: 'AI agent via Playwright MCP',
    testCaseSource: { path: `docs/projects/DEMO/test-cases/US-${STORY}/test-cases.csv`, sha256: 'a'.repeat(64) },
    completion: { status: 'COMPLETED' },
    results: [
      {
        testCaseId: `TC-${STORY}-001`, title: '[DEMO][Auth][Login] Verify the form', adoId: null, requirementReference: 'REQ-1',
        status: 'PASS', observationOnly: false, durationMs: 1000, classification: null, reason: null, preconditionCheck: null,
        steps: [{ index: 1, action: 'Open the page', expected: 'The form is shown', actual: 'The form is shown', status: 'PASS' }],
        evidence: [], observations: [], bugCandidateId: null,
      },
      {
        testCaseId: `TC-${STORY}-002`, title: '[DEMO][Auth][Login] Verify Remember Me', adoId: null, requirementReference: 'REQ-2',
        status: 'FAIL', observationOnly: false, durationMs: 2000, classification: 'PRODUCT_BUG', reason: 'Remember Me is absent', preconditionCheck: null,
        steps: [{ index: 1, action: 'Inspect the options', expected: 'Remember Me is present', actual: 'No Remember Me option', status: 'FAIL' }],
        evidence: [{ path: 'evidence/step1.png', label: 'Step 1' }], observations: [], bugCandidateId: bugId,
      },
    ],
    bugCandidates: [
      {
        id: bugId, file: `bug-candidates/${bugId}.md`, title: `[DEMO][Auth][Login] Remember Me is missing (${bugId})`,
        testCaseIds: [`TC-${STORY}-002`], classification: 'PRODUCT_BUG',
        summary: 'The option REQ-2 requires is absent.',
        suspectedRootCause: 'Possibly behind a feature flag (unconfirmed).',
        status: resolved ? 'Not a Bug' : 'Draft',
        resolution: resolved ? RESOLUTION : null,
        description: 'The login form has no Remember Me option.',
        preconditions: ['An unauthenticated browser session.'],
        stepsToReproduce: ['Open the login page.', 'Inspect the options under the password field.'],
        testData: ['Account handle: `DEMO_ACCOUNT`'],
        expectedResult: 'A Remember Me option is shown (REQ-2).',
        actualResult: 'No Remember Me option is shown.',
        requirementReference: 'REQ-2',
        notes: ['Seen on every reload.'],
        evidence: [{ path: 'evidence/step1.png', label: 'Form without Remember Me' }],
      },
    ],
    observations: [],
  };
}

function manualRunDir(record: Record<string, unknown>, root = mkdtempSync(join(tmpdir(), 'qa-bugs-'))): string {
  const runId = record.runId as string;
  const dir = join(root, runId);
  mkdirSync(join(dir, 'evidence'), { recursive: true });
  mkdirSync(join(dir, 'bug-candidates'), { recursive: true });
  writeFileSync(join(dir, 'evidence', 'step1.png'), PNG);
  for (const bug of record.bugCandidates as Record<string, unknown>[]) {
    writeFileSync(join(dir, bug.file as string), `# ${bug.id}\n\n| Related run | ${runId} |\n| Related Test Case | TC-${STORY}-002 |\n`);
  }
  writeFileSync(join(dir, MANUAL_RESULTS_FILE), JSON.stringify(record, null, 2));
  return dir;
}

function manualRun(dir: string, runId: string): ManualRunResults {
  return validateManualResults(JSON.parse(readFileSync(join(dir, MANUAL_RESULTS_FILE), 'utf8')), dir, { project: 'DEMO', storyId: STORY, runId });
}

// ---------------------------------------------------------------------------
// Automation run fixtures
// ---------------------------------------------------------------------------

function automationBug(id: string, overrides: Partial<BugCandidate> = {}): BugCandidate {
  return {
    id,
    title: `[DEMO][Auth][Login] Sign-in fails (${id})`,
    description: 'Sign-in does not reach the dashboard.',
    preconditions: ['A valid account exists.'],
    stepsToReproduce: ['Enter the credentials for `PRIMARY_VALID`', 'Click Login'],
    testData: ['Account handle: `PRIMARY_VALID`'],
    expectedResult: 'The dashboard is displayed',
    actualResult: 'The element was not found on the page',
    testCaseId: `TC-${STORY}-002`,
    adoId: null,
    userStoryId: STORY,
    requirementReference: 'REQ-2',
    classification: 'PRODUCT_BUG',
    environment: { label: 'STG', host: 'stg.example.test' },
    attachments: [{ kind: 'screenshot', path: `attachments/TC-${STORY}-002.png`, label: 'Failure screenshot' }],
    status: 'Draft',
    ...overrides,
  };
}

function automationReport(runId: string, bugs: readonly BugCandidate[]): ExecutionReport {
  return {
    runId, project: 'DEMO', userStories: [STORY], modules: ['Auth'], environment: { label: 'STG', host: 'stg.example.test' },
    startedAt: '2026-10-10T10:00:00.000Z', durationMs: 1000,
    totals: { total: 1, pass: 0, fail: 1, notRun: 0, notAutomated: 0 },
    results: [{
      testCaseId: `TC-${STORY}-002`, userStoryId: STORY, adoId: null, title: '[DEMO][Auth][Login] Verify sign-in', module: 'Auth', featurePage: 'Login',
      requirementReference: 'REQ-2', specFile: null, status: 'FAIL', durationMs: 1000,
      steps: [{ index: 1, action: 'Click Login', expected: 'The dashboard is displayed', status: 'FAIL', actual: 'Not found', durationMs: 1000 }],
      failedStep: 1,
      failure: { reason: 'expect failed', error: 'expect failed', expected: 'The dashboard is displayed', actual: 'Not found', classification: 'PRODUCT_BUG', classificationNote: 'n/a' },
      reason: null, attachments: [], bugCandidateId: bugs[0]?.id ?? null,
    }],
    bugCandidates: bugs,
  };
}

// ---------------------------------------------------------------------------
// The shared section
// ---------------------------------------------------------------------------

function entry(overrides: Partial<BugReportEntry> = {}): BugReportEntry {
  return {
    id: 'BUG-1', title: 'A title', status: 'Draft', classification: 'PRODUCT_BUG',
    testCases: [{ id: 'TC-1-001', href: '#tc-TC-1-001' }], userStory: 'US 1', runId: 'RUN-001', requirementReference: null,
    description: null, preconditions: [], stepsToReproduce: [], testData: [], expectedResult: null, actualResult: null,
    environment: null, facts: [], suspectedCause: null, notes: [], resolution: null, evidence: [], file: null,
    ...overrides,
  };
}

test('the shared section shows an empty state when a run has no Bug Candidates', () => {
  const html = renderBugReportSection([], { safeEvidence: /^evidence\//, publishHint: 'x', linkLocalFile: true });
  ok(html.includes('<h2>Bug Report</h2>'));
  ok(html.includes('data-empty="bug-report"'));
  ok(html.includes('No Bug Candidates in this run'));
});

test('the shared section escapes every value and references only safe evidence paths', () => {
  const html = renderBugReportSection(
    [entry({
      title: '<script>alert(1)</script>',
      description: '<img src=x onerror=alert(2)>',
      notes: ['"quoted" & <b>bold</b>'],
      evidence: [
        { kind: 'screenshot', path: 'evidence/ok.png', label: 'ok' },
        { kind: 'file', path: '../../.env', label: 'escape attempt' },
      ],
    })],
    { safeEvidence: /^evidence\/[A-Za-z0-9._-]+\.png$/, publishHint: '<hint>', linkLocalFile: true },
  );
  ok(!html.includes('<script>') && !html.includes('<img src=x') && !html.includes('<b>bold</b>'));
  ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  ok(html.includes('href="evidence/ok.png"'));
  ok(!html.includes('.env'), 'an unsafe evidence path is never referenced');
});

test('resolved NOT A BUG candidates are grouped and marked apart from open and confirmed bugs', () => {
  const html = renderBugReportSection(
    [
      entry({ id: 'BUG-OPEN', status: 'Draft' }),
      entry({ id: 'BUG-REAL', status: 'Confirmed', resolution: { ...RESOLUTION, disposition: 'CONFIRMED_BUG' } as never }),
      entry({ id: 'BUG-NOT', status: 'Not a Bug', resolution: RESOLUTION as never }),
    ],
    { safeEvidence: /^evidence\//, publishHint: 'x', linkLocalFile: true },
  );
  const active = html.indexOf('data-bug-group="active"');
  const resolved = html.indexOf('data-bug-group="not-a-bug"');
  ok(active >= 0 && resolved > active, 'open and confirmed bugs first, resolved ones after');
  ok(html.indexOf('id="BUG-OPEN"') < resolved && html.indexOf('id="BUG-REAL"') < resolved);
  ok(html.indexOf('id="BUG-NOT"') > resolved);
  ok(html.includes('data-bug-status="Not a Bug"') && html.includes('Resolved — NOT A BUG'));
  ok(html.includes('data-bug-status="Confirmed"') && html.includes('Confirmed bug'));
  ok(html.includes('data-count="Draft">1<') && html.includes('data-count="Confirmed">1<') && html.includes('data-count="Not a Bug">1<'));
});

// ---------------------------------------------------------------------------
// manual-report.html
// ---------------------------------------------------------------------------

test('manual-report.html renders a Bug Report section with every Bug Candidate field', () => {
  const dir = manualRunDir(manualRecord('RUN-001', 'BUG-001', false));
  const section = bugSection(renderManualReportHtml(manualRun(dir, 'RUN-001'), { currentSha256: null }));

  ok(section.includes('<h2>Bug Report</h2>'));
  for (const label of [
    'Bug ID', 'Status', 'Related Test Case', 'Related User Story', 'Execution run', 'Requirement', 'Description', 'Preconditions',
    'Steps to Reproduce', 'Test Data', 'Expected Result', 'Actual Result — observed (confirmed)', 'Environment', 'Failure Classification',
    'Suspected root cause (unconfirmed)', 'Notes', 'Evidence', 'Local file',
  ]) {
    ok(section.includes(`<dt>${label}</dt>`), `the manual Bug Report must render ${label}`);
  }
  for (const value of [
    'The login form has no Remember Me option.', 'An unauthenticated browser session.', 'Open the login page.',
    'Account handle: `DEMO_ACCOUNT`', 'A Remember Me option is shown (REQ-2).', 'No Remember Me option is shown.',
    'demo-stg.example.test', 'Possibly behind a feature flag (unconfirmed).', 'Seen on every reload.', `TC-${STORY}-002`,
  ]) {
    ok(section.includes(value.replace(/`/g, '`')), `the manual Bug Report must show "${value}"`);
  }
  // Observation and hypothesis are labelled apart.
  ok(section.indexOf('data-field="actual"') !== section.indexOf('data-field="suspected"'));
  ok(section.includes('Draft — awaiting human review'));
});

test('manual-report.html shows only its own run\'s Bug Candidates', () => {
  const root = mkdtempSync(join(tmpdir(), 'qa-bug-runs-'));
  const first = manualRunDir(manualRecord('RUN-001', 'BUG-ALPHA', false), root);
  const second = manualRunDir(manualRecord('RUN-002', 'BUG-BRAVO', true), root);

  const one = bugSection(readFileSync(writeManualReport(first, manualRun(first, 'RUN-001'), { currentSha256: null }), 'utf8'));
  const two = bugSection(readFileSync(writeManualReport(second, manualRun(second, 'RUN-002'), { currentSha256: null }), 'utf8'));

  ok(one.includes('id="BUG-ALPHA"') && !one.includes('BUG-BRAVO'));
  ok(two.includes('id="BUG-BRAVO"') && !two.includes('BUG-ALPHA'));
});

test('a manual Bug Candidate resolved as NOT A BUG keeps its observation and evidence, and the case stays FAIL', () => {
  const dir = manualRunDir(manualRecord('RUN-001', 'BUG-001', true));
  const run = manualRun(dir, 'RUN-001');
  const html = renderManualReportHtml(run, { currentSha256: null });
  const section = bugSection(html);

  strictEqual(run.bugCandidates[0]!.status, 'Not a Bug');
  ok(section.includes('data-bug-status="Not a Bug"'));
  ok(section.includes('data-disposition="NOT_A_BUG"'));
  ok(section.includes('The observed behaviour is correct.') && section.includes('D-90') && section.includes('human reviewer'));
  ok(section.includes('No Remember Me option is shown.'), 'the original observation is kept');
  ok(section.includes('href="evidence/step1.png"'), 'the original evidence is kept');
  ok(section.includes('PRODUCT_BUG'), 'the classification assigned during the run is kept');
  ok(html.includes('resolved after the run as NOT A BUG'));
  strictEqual(run.results[1]!.status, 'FAIL');
});

test('resolving a Bug Candidate never changes the execution totals or the Execution Summary', () => {
  const draftDir = manualRunDir(manualRecord('RUN-001', 'BUG-001', false));
  const resolvedDir = manualRunDir(manualRecord('RUN-001', 'BUG-001', true));
  const draft = manualRun(draftDir, 'RUN-001');
  const resolved = manualRun(resolvedDir, 'RUN-001');

  deepStrictEqual(manualTotals(resolved.results), manualTotals(draft.results));
  deepStrictEqual(manualTotals(resolved.results), { total: 2, pass: 1, fail: 1, blocked: 0, skipped: 0, notReached: 0 });
  strictEqual(
    summarySection(renderManualReportHtml(resolved, { currentSha256: null })),
    summarySection(renderManualReportHtml(draft, { currentSha256: null })),
  );

  const report = automationReport('RUN-004', [automationBug('BUG-001')]);
  const resolvedReport = automationReport('RUN-004', [automationBug('BUG-001', { status: 'Not a Bug', resolution: RESOLUTION as never })]);
  deepStrictEqual(resolvedReport.totals, report.totals);
  strictEqual(summarySection(renderReportHtml(resolvedReport)), summarySection(renderReportHtml(report)));
});

test('every Bug Report link in the manual report resolves relative to the report', () => {
  const dir = manualRunDir(manualRecord('RUN-001', 'BUG-001', true));
  const section = bugSection(readFileSync(writeManualReport(dir, manualRun(dir, 'RUN-001'), { currentSha256: null }), 'utf8'));
  const links = [...section.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]!);

  ok(links.length > 0);
  for (const link of links) {
    if (link.startsWith('#')) {
      ok(link === `#tc-TC-${STORY}-002`, `unexpected anchor ${link}`);
      continue;
    }
    ok(existsSync(join(dir, link)), `${link} must exist beside the report`);
  }
});

test('a manual run with no Bug Candidates shows the empty state', () => {
  const record = manualRecord('RUN-001', 'BUG-001', false);
  const results = record.results as Record<string, unknown>[];
  results.splice(1, 1);
  record.bugCandidates = [];
  const dir = manualRunDir(record);
  const section = bugSection(renderManualReportHtml(manualRun(dir, 'RUN-001'), { currentSha256: null }));
  ok(section.includes('data-empty="bug-report"'));
});

test('manual Bug Candidate text is escaped in the Bug Report', () => {
  const record = manualRecord('RUN-001', 'BUG-001', false);
  const bug = (record.bugCandidates as Record<string, unknown>[])[0]!;
  bug.actualResult = '<script>alert("x")</script>';
  bug.stepsToReproduce = ['<img src=x onerror=alert(1)>'];
  const dir = manualRunDir(record);
  const section = bugSection(renderManualReportHtml(manualRun(dir, 'RUN-001'), { currentSha256: null }));
  ok(!section.includes('<script>') && !section.includes('<img src=x'));
  ok(section.includes('&lt;script&gt;'));
});

test('validation: only a human resolution moves a Bug Candidate off Draft, and status and disposition agree', () => {
  const invalid = (mutate: (bug: Record<string, unknown>) => void, fragment: string): void => {
    const record = manualRecord('RUN-001', 'BUG-001', false);
    mutate((record.bugCandidates as Record<string, unknown>[])[0]!);
    const dir = manualRunDir(record);
    throws(() => manualRun(dir, 'RUN-001'), (error: unknown) => {
      ok(error instanceof ManualResultsError);
      ok(error.details.some((detail) => detail.includes(fragment)), `expected "${fragment}" in:\n${error.details.join('\n')}`);
      return true;
    });
  };
  invalid((bug) => (bug.status = 'Not a Bug'), "needs the human's resolution");
  invalid((bug) => { bug.status = 'Confirmed'; bug.resolution = RESOLUTION; }, 'disagrees with resolution.disposition');
  invalid((bug) => (bug.resolution = RESOLUTION), 'a Draft has no resolution');
  invalid((bug) => { bug.status = 'Not a Bug'; bug.resolution = { ...RESOLUTION, rationale: '' }; }, 'resolution.rationale');
  invalid((bug) => { bug.status = 'Not a Bug'; bug.resolution = { ...RESOLUTION, decidedAt: 'yesterday' }; }, 'ISO 8601');
  invalid((bug) => (bug.preconditions = 'not a list'), 'preconditions: expected a list');
});

test('execution:report refuses a Bug Candidate holding a configured credential value, and writes nothing', () => {
  const root = mkdtempSync(join(tmpdir(), 'qa-bug-ws-'));
  const projectRoot = join(root, 'docs', 'projects', 'DEMO');
  mkdirSync(join(projectRoot, 'test-cases', `US-${STORY}`), { recursive: true });
  writeFileSync(join(projectRoot, 'profile.md'), '# DEMO\n\n| Setting | Value |\n|---|---|\n| Project Key | DEMO |\n\n| Handle | Purpose |\n|---|---|\n| `DEMO_ACCOUNT` | An account |\n');
  cpSync(join(REPO, 'tests', 'fixtures', 'valid-artifact.csv'), join(projectRoot, 'test-cases', `US-${STORY}`, 'test-cases.csv'));
  writeFileSync(join(root, '.env'), 'DEMO_ACCOUNT_USERNAME=bug.user@example.test\nDEMO_ACCOUNT_PASSWORD=Bug-Secret-77!\n');
  const record = manualRecord('RUN-001', 'BUG-001', false);
  (record.bugCandidates as Record<string, unknown>[])[0]!.stepsToReproduce = ['Log in with password Bug-Secret-77!'];
  const runDir = manualRunDir(record, join(projectRoot, 'executions', `US-${STORY}`));

  const result = spawnSync(process.execPath, [join(REPO, 'src', 'cli', 'execution-report.ts'), String(STORY), '--project', 'DEMO'], {
    cwd: root, encoding: 'utf8', env: { ...process.env, QA_ACTIVE_PROJECT: '' },
  });
  const out = `${result.stdout}${result.stderr}`;
  strictEqual(result.status, 1, out);
  ok(out.includes('contains the value of a configured handle or credential'), out);
  ok(!out.includes('Bug-Secret-77!'));
  ok(!existsSync(join(runDir, MANUAL_REPORT_FILE)));
});

// ---------------------------------------------------------------------------
// automation-report.html
// ---------------------------------------------------------------------------

test('automation-report.html renders a Bug Report section with every Bug Candidate field', () => {
  const section = bugSection(renderReportHtml(automationReport('RUN-004', [automationBug('BUG-001')])));
  ok(section.includes('<h2>Bug Report</h2>'));
  for (const label of [
    'Bug ID', 'Status', 'Related Test Case', 'Related User Story', 'Execution run', 'Requirement', 'Description', 'Preconditions',
    'Steps to Reproduce', 'Test Data', 'Expected Result', 'Actual Result — observed (confirmed)', 'Environment', 'Failure Classification',
    'ADO Test Case', 'Evidence', 'Local file',
  ]) {
    ok(section.includes(`<dt>${label}</dt>`), `the automation Bug Report must render ${label}`);
  }
  ok(section.includes('href="attachments/TC-99002-002.png"'));
  ok(section.includes('href="#tc-TC-99002-002"'));
  // The automation report links only into its run's attachments/ (automation:verify-artifacts):
  // the local Bug Candidate file is named, not linked.
  ok(section.includes('<code>bug-candidates/BUG-001.md</code>'));
  ok(!section.includes('href="bug-candidates/'));
  for (const link of [...section.matchAll(/(?:src|href)="([^"#][^"]*)"/g)].map((match) => match[1]!)) {
    ok(link.startsWith('attachments/'), `the automation Bug Report must not link outside attachments/: ${link}`);
  }
});

test('automation-report.html shows only its own run\'s Bug Candidates, and its links resolve', () => {
  const root = mkdtempSync(join(tmpdir(), 'qa-auto-bugs-'));
  const write = (runId: string, bugId: string): string => {
    const dir = join(root, runId);
    mkdirSync(join(dir, 'attachments'), { recursive: true });
    writeFileSync(join(dir, 'attachments', `TC-${STORY}-002.png`), PNG);
    return readFileSync(writeRenderedReport(dir, automationReport(runId, [automationBug(bugId)])), 'utf8');
  };
  const one = bugSection(write('RUN-001', 'BUG-001'));
  const two = bugSection(write('RUN-002', 'BUG-007'));

  ok(one.includes('id="BUG-001"') && !one.includes('BUG-007'));
  ok(two.includes('id="BUG-007"') && !two.includes('id="BUG-001"'));
  for (const [runId, section] of [['RUN-001', one], ['RUN-002', two]] as const) {
    for (const link of [...section.matchAll(/(?:src|href)="([^"#][^"]*)"/g)].map((match) => match[1]!)) {
      ok(existsSync(join(root, runId, link)), `${runId}: ${link} must exist beside the report`);
    }
  }
  ok(existsSync(join(root, 'RUN-001', AUTOMATION_REPORT_FILE)) && !existsSync(join(root, 'RUN-001', MANUAL_REPORT_FILE)));
});

test('an automation Bug Candidate resolved as NOT A BUG is shown apart, and its Markdown records the resolution', () => {
  const bug = automationBug('BUG-001', { status: 'Not a Bug', resolution: RESOLUTION as never });
  const report = automationReport('RUN-004', [bug, automationBug('BUG-002')]);
  const section = bugSection(renderReportHtml(report));

  ok(section.indexOf('id="BUG-002"') < section.indexOf('data-bug-group="not-a-bug"'));
  ok(section.indexOf('id="BUG-001"') > section.indexOf('data-bug-group="not-a-bug"'));
  ok(section.includes('The observed behaviour is correct.'));

  const markdown = renderBugCandidateMarkdown(bug, report);
  ok(markdown.includes('Resolved — NOT A BUG'));
  ok(markdown.includes('## Resolution') && markdown.includes('NOT_A_BUG') && markdown.includes('D-90'));
  ok(markdown.includes('## Actual Result'), 'the original candidate is kept below the resolution');
  ok(!renderBugCandidateMarkdown(automationBug('BUG-002'), report).includes('## Resolution'));
});

test('an automation run with no Bug Candidates shows the empty state', () => {
  const section = bugSection(renderReportHtml(automationReport('RUN-004', [])));
  ok(section.includes('data-empty="bug-report"'));
});

test('automation Bug Candidate text is escaped, and no credential reaches the Bug Report', () => {
  const report = automationReport('RUN-004', [automationBug('BUG-001', { title: '<script>x</script>', actualResult: '<img src=x onerror=1>' })]);
  const html = renderReportHtml(report);
  const section = bugSection(html);
  ok(!section.includes('<script>x') && !section.includes('<img src=x'));
  ok(section.includes('&lt;script&gt;x&lt;/script&gt;'));
  // Built reports are sanitised before rendering (tests/automation-reporting.test.ts);
  // the section itself adds nothing but what the candidate holds.
  ok(!/password/i.test(section.replace(/PRIMARY_VALID/g, '')));
});

test('the Bug Report code is shared presentation: no report depends on the other\'s data or code', () => {
  const read = (path: string): string => readFileSync(join(REPO, path), 'utf8');
  const shared = read('src/reporting/bug-report.ts');
  ok(!/automation\/|execution\//.test(shared.replace(/\/\*\*[\s\S]*?\*\//g, '')), 'the shared section imports neither report');
  ok(!/automation\/reporting/.test(read('src/execution/manual-report.ts')));
  ok(!/src\/execution|\.\.\/\.\.\/execution/.test(read('src/automation/reporting/generator.ts')));
  ok(read('src/execution/manual-report.ts').includes('renderBugReportSection'));
  ok(read('src/automation/reporting/generator.ts').includes('renderBugReportSection'));
});
