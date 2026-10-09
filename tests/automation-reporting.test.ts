/**
 * Tests for the HTML execution report (src/automation/reporting/) and the
 * shared sanitizer (src/automation/sanitizer.ts).
 *
 * Built from the golden Test Case fixture, so step actions and Expected
 * Results come from a real artifact parse — exactly as in a run.
 */

import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { clearSecrets, registerSecret } from '../src/ado/errors.ts';
import {
  buildReport,
  extractActual,
  insideAny,
  selectAttachments,
  signatureOfBytes,
  type AttachmentGate,
  type BuildInput,
  type RawTestResult,
} from '../src/automation/reporting/build.ts';
import { classifyFailure } from '../src/automation/reporting/classify.ts';
import { escapeHtml, renderBugCandidateMarkdown, renderReportHtml } from '../src/automation/reporting/generator.ts';
import { findNotAutomated, parsePlanRows } from '../src/automation/reporting/not-automated.ts';
import { latestRunId, nextRunId, writeReport } from '../src/automation/reporting/writer.ts';
import { sanitizeError, sanitizeText, stripAnsi } from '../src/automation/sanitizer.ts';
import type { ActiveProject } from '../src/projects/active-project.ts';
import { parseArtifact } from '../src/testcases/artifact.ts';

const FIXTURE = fileURLToPath(new URL('./fixtures/valid-artifact.md', import.meta.url));
const ARTIFACT = parseArtifact(FIXTURE, 99001);
const DEMO: ActiveProject = { key: 'DEMO', root: 'docs/projects/DEMO', profilePath: 'docs/projects/DEMO/profile.md', source: 'explicit' };

/** A password-shaped value that must never appear in any output. */
const PASSWORD = 'Sentinel-Pa55word-z9';
const USERNAME = 'sentinel.user@example.test';

function traced(testCaseId: string, adoId?: number): RawTestResult['annotations'] {
  return [
    { type: 'test-case', description: testCaseId },
    { type: 'user-story', description: '99001' },
    ...(adoId ? [{ type: 'ado-id', description: String(adoId) }] : []),
  ];
}

const PASSED: RawTestResult = {
  title: 'TC-99001-001 — Login form presents the specified fields',
  specFile: 'automation/DEMO/Authentication/tests/TC-99001-001.spec.ts',
  annotations: traced('TC-99001-001', 55294),
  status: 'passed',
  durationMs: 1200,
  steps: [
    { title: 'Step 1: Open the login URL as an unauthenticated visitor', durationMs: 500, error: null },
    { title: 'Step 2: Inspect the form fields', durationMs: 300, error: null },
  ],
  errors: [],
  attachments: [{ name: 'video', contentType: 'video/webm', path: '/out/tc1/video.webm' }],
};

const FAILURE_MESSAGE = [
  '\u001b[31mError: expect(locator).toBeVisible() failed\u001b[39m',
  '',
  "Locator: getByRole('heading', { name: 'Dashboard' })",
  'Expected: visible',
  'Timeout: 5000ms',
  'Error: element(s) not found',
  '',
  'Call log:',
  `  - fill("${PASSWORD}")`,
  `  - textbox "Password": ${PASSWORD}`,
].join('\n');

const FAILED: RawTestResult = {
  title: 'TC-99001-002 — Valid credentials authenticate successfully',
  specFile: 'automation/DEMO/Authentication/tests/TC-99001-002.spec.ts',
  annotations: traced('TC-99001-002'),
  status: 'failed',
  durationMs: 6400,
  steps: [
    { title: 'Step 1: Enter the credentials for `PRIMARY_VALID`', durationMs: 900, error: null },
    { title: 'Step 2: Click Login', durationMs: 5100, error: FAILURE_MESSAGE },
  ],
  errors: [FAILURE_MESSAGE],
  attachments: [
    { name: 'screenshot', contentType: 'image/png', path: '/out/tc2/test-failed-1.png' },
    { name: 'error-context', contentType: 'text/markdown', path: '/out/tc2/error-context.md' },
    { name: 'trace', contentType: 'application/zip', path: '/out/tc2/trace.zip' },
    { name: 'video', contentType: 'video/webm', path: '/out/tc2/video.webm' },
  ],
};

const SKIPPED: RawTestResult = {
  ...PASSED,
  status: 'skipped',
  durationMs: 10,
  steps: [],
  annotations: [...traced('TC-99001-001', 55294), { type: 'skip', description: 'NOT RUN — TEST_DATA_UNAVAILABLE: PRIMARY_VALID' }],
};

/** Playwright output lives under /out; a file's kind comes from its extension here, from its bytes in a run. */
function gate(overrides: Partial<AttachmentGate> = {}): AttachmentGate {
  return {
    videoAllowed: true,
    fileExists: () => true,
    isInsideOutput: (path) => insideAny(['/out'], path),
    signatureOf: (path) => (path.endsWith('.png') ? 'png' : path.endsWith('.webm') ? 'webm' : null),
    ...overrides,
  };
}

function input(overrides: Partial<BuildInput> = {}): BuildInput {
  return {
    runId: 'RUN-007',
    project: 'DEMO',
    environment: { label: 'STG', host: 'stg.example.test' },
    startedAt: '2026-10-09T10:00:00.000Z',
    durationMs: 7600,
    raws: [PASSED, FAILED],
    lookupTestCase: (storyId, id) => (storyId === 99001 ? (ARTIFACT.testCases.find((entry) => entry.localId === id) ?? null) : null),
    notAutomated: [],
    gate: gate(),
    ...overrides,
  };
}

function everything(text: string): void {
  ok(!text.includes(PASSWORD), 'the password must never be rendered');
  ok(!text.includes(USERNAME), 'the username must never be rendered');
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

test('a passed test appears as PASS, with every step passed against its Expected Result', () => {
  const { report } = buildReport(input());
  const pass = report.results.find((entry) => entry.testCaseId === 'TC-99001-001')!;

  strictEqual(pass.status, 'PASS');
  deepStrictEqual(pass.steps.map((step) => [step.index, step.status]), [[1, 'PASS'], [2, 'PASS']]);
  strictEqual(pass.steps[1]!.expected, 'An **Email** field and a **Password** field are present');
  strictEqual(pass.failure, null);
  ok(renderReportHtml(report).includes('Passed — every action and assertion in this step succeeded.'));
});

test('a failed test appears as FAIL, with the failed step, Expected, Actual, reason and classification', () => {
  const { report } = buildReport(input());
  const fail = report.results.find((entry) => entry.testCaseId === 'TC-99001-002')!;

  strictEqual(fail.status, 'FAIL');
  strictEqual(fail.failedStep, 2);
  deepStrictEqual(fail.steps.map((step) => step.status), ['PASS', 'FAIL']);
  strictEqual(fail.failure!.expected, 'The dashboard is displayed');
  ok(fail.failure!.actual.startsWith('The element was not found on the page'));
  strictEqual(fail.failure!.reason, 'Error: expect(locator).toBeVisible() failed');
  strictEqual(fail.failure!.classification, 'PRODUCT_BUG');

  const html = renderReportHtml(report);
  ok(html.includes('Why it failed — Step 2'));
  ok(html.includes('class="failed-step"'));
  ok(html.includes('The dashboard is displayed'));
  ok(html.includes('The element was not found on the page'));
  ok(html.includes('expect(locator).toBeVisible() failed'));
});

test('mixed PASS/FAIL renders the right totals, verdict and failure list', () => {
  const { report } = buildReport(input({ raws: [PASSED, FAILED, SKIPPED] }));

  deepStrictEqual(report.totals, { total: 3, pass: 1, fail: 1, notRun: 1, notAutomated: 0 });
  const html = renderReportHtml(report);
  ok(html.includes('<span class="big fail">FAIL</span>'));
  ok(html.includes('1 of 3 Test Cases passed'));
  ok(html.includes('Failed Test Cases'));
  ok(html.includes('href="#tc-TC-99001-002"'));
});

test('an all-pass run shows a PASS verdict and no failure list', () => {
  const html = renderReportHtml(buildReport(input({ raws: [PASSED] })).report);

  ok(html.includes('<span class="big pass">PASS</span>'));
  ok(!html.includes('Failed Test Cases'));
});

test('a skipped test is NOT RUN with its reason, never FAIL', () => {
  const [result] = buildReport(input({ raws: [SKIPPED] })).report.results;

  strictEqual(result!.status, 'NOT RUN');
  strictEqual(result!.reason, 'NOT RUN — TEST_DATA_UNAVAILABLE: PRIMARY_VALID');
  strictEqual(result!.failure, null);
  ok(result!.steps.every((step) => step.status === 'NOT EXECUTED'));
});

test('traceability IDs are preserved from the spec annotations, never invented', () => {
  const { report } = buildReport(input());
  const [pass, fail] = report.results;

  deepStrictEqual([pass!.testCaseId, pass!.userStoryId, pass!.adoId], ['TC-99001-001', 99001, 55294]);
  deepStrictEqual([fail!.testCaseId, fail!.userStoryId, fail!.adoId], ['TC-99001-002', 99001, null]);
  strictEqual(pass!.specFile, 'automation/DEMO/Authentication/tests/TC-99001-001.spec.ts');
  deepStrictEqual(report.userStories, [99001]);
  deepStrictEqual(report.modules, ['Authentication']);

  const html = renderReportHtml(report);
  ok(html.includes('TC-99001-001') && html.includes('US 99001 · ADO 55294'));
});

test('a spec with no Test Case annotation is flagged as untraceable, not given an ID', () => {
  const [result] = buildReport(input({ raws: [{ ...PASSED, annotations: [] }] })).report.results;

  strictEqual(result!.testCaseId, null);
  strictEqual(result!.userStoryId, null);
  ok(result!.reason!.includes('not traceable'));
});

test('an annotation naming a case the artifact lacks is reported, not silently accepted', () => {
  const [result] = buildReport(input({ raws: [{ ...PASSED, annotations: traced('TC-99001-099') }] })).report.results;

  ok(result!.reason!.includes('TC-99001-099 was not found in the Test Case artifact'));
});

// ---------------------------------------------------------------------------
// Bug Reports
// ---------------------------------------------------------------------------

test('a PRODUCT_BUG failure becomes a Draft Bug Candidate with every field', () => {
  const { report } = buildReport(input());
  const [bug] = report.bugCandidates;

  strictEqual(report.bugCandidates.length, 1);
  strictEqual(bug!.id, 'BUG-001');
  strictEqual(bug!.status, 'Draft');
  strictEqual(bug!.title, '[DEMO][Authentication][Login - Portal] Verify a valid user can sign in — fails at Step 2');
  deepStrictEqual(bug!.stepsToReproduce, ['Enter the credentials for `PRIMARY_VALID`', 'Click Login']);
  deepStrictEqual(bug!.preconditions, ['A valid account exists.']);
  strictEqual(bug!.expectedResult, 'The dashboard is displayed');
  ok(bug!.actualResult.startsWith('The element was not found'));
  deepStrictEqual([bug!.testCaseId, bug!.userStoryId, bug!.environment.label], ['TC-99001-002', 99001, 'STG']);
  strictEqual(report.results[1]!.bugCandidateId, 'BUG-001');

  const html = renderReportHtml(report);
  ok(html.includes('<h2>Bug Reports</h2>'));
  ok(html.includes('id="BUG-001"'));
  for (const label of ['Description', 'Steps to Reproduce', 'Actual Result', 'Expected Result', 'Related Test Case', 'Related User Story', 'Failure Classification', 'Environment', 'Attachments']) {
    ok(html.includes(`<dt>${label}</dt>`), `Bug section must render ${label}`);
  }
  ok(html.includes(escapeHtml(bug!.title)));
  ok(html.includes('nothing here was created in Azure DevOps'));
});

test('the Bug Candidate Markdown carries what /publish-bug needs, as a Draft', () => {
  const { report } = buildReport(input());
  const markdown = renderBugCandidateMarkdown(report.bugCandidates[0]!, report);

  for (const heading of ['## Title', '## Description', '## Preconditions', '## Steps to Reproduce', '## Test Data', '## Expected Result', '## Actual Result', '## Evidence']) {
    ok(markdown.includes(heading), `missing ${heading}`);
  }
  ok(markdown.includes('**Draft**'));
  ok(markdown.includes('`stg.example.test`'));
  ok(markdown.includes('Not proposed — decided by the human at publish time'));
  everything(markdown);
});

test('the Bug Reports section renders an explicit empty state', () => {
  const html = renderReportHtml(buildReport(input({ raws: [PASSED] })).report);

  ok(html.includes('<h2>Bug Reports</h2>'));
  ok(html.includes('No Bug Candidates in this run'));
});

test('only PRODUCT_BUG becomes a Bug Candidate — a script failure does not', () => {
  const scriptFailure = 'TimeoutError: locator.click: Timeout 5000ms exceeded.';
  const raw: RawTestResult = {
    ...FAILED,
    errors: [scriptFailure],
    steps: [FAILED.steps[0]!, { title: 'Step 2: Click Login', durationMs: 5000, error: scriptFailure }],
  };
  const { report } = buildReport(input({ raws: [raw] }));

  strictEqual(report.results[0]!.failure!.classification, 'TEST_SCRIPT_ISSUE');
  deepStrictEqual(report.bugCandidates, []);
});

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

test('a PASS test keeps its video, and no screenshot', () => {
  const built = buildReport(input());
  const pass = built.report.results[0]!;

  deepStrictEqual(pass.attachments, [{ kind: 'video', path: 'attachments/TC-99001-001.webm', label: 'Video' }]);
  ok(built.copies.some((copy) => copy.from === '/out/tc1/video.webm' && copy.to === 'attachments/TC-99001-001.webm'));
});

test('a FAIL test keeps its failure screenshot AND its video, named for the Test Case', () => {
  const built = buildReport(input());
  const fail = built.report.results[1]!;

  deepStrictEqual(fail.attachments, [
    { kind: 'screenshot', path: 'attachments/TC-99001-002.png', label: 'Screenshot' },
    { kind: 'video', path: 'attachments/TC-99001-002.webm', label: 'Video' },
  ]);
  deepStrictEqual(
    built.copies.filter((copy) => copy.to.startsWith('attachments/TC-99001-002')),
    [
      { from: '/out/tc2/test-failed-1.png', to: 'attachments/TC-99001-002.png' },
      { from: '/out/tc2/video.webm', to: 'attachments/TC-99001-002.webm' },
    ],
  );
  // The Bug Candidate carries the same evidence.
  deepStrictEqual(built.report.bugCandidates[0]!.attachments, fail.attachments);
});

test('the HTML links the screenshot preview and plays the right video for each Test Case', () => {
  const html = renderReportHtml(buildReport(input()).report);

  ok(html.includes('<a href="attachments/TC-99001-002.png" target="_blank" rel="noopener"><img src="attachments/TC-99001-002.png"'));
  ok(html.includes('View Screenshot'));
  for (const id of ['TC-99001-001', 'TC-99001-002']) {
    ok(html.includes(`<video controls preload="metadata" src="attachments/${id}.webm">`), `${id} must have a playable video`);
    ok(html.includes(`<a href="attachments/${id}.webm" target="_blank" rel="noopener">&#9654; Play Video</a>`));
  }
});

test('a second video of the same test gets its own numbered file', () => {
  const twoPages: RawTestResult = {
    ...PASSED,
    attachments: [
      { name: 'video', contentType: 'video/webm', path: '/out/tc1/video.webm' },
      { name: 'video', contentType: 'video/webm', path: '/out/tc1/video-1.webm' },
    ],
  };
  const { attachments } = selectAttachments(twoPages, 'TC-99001-001', gate());

  deepStrictEqual(attachments.map((entry) => entry.path), ['attachments/TC-99001-001.webm', 'attachments/TC-99001-001-2.webm']);
});

test('error-context.md and traces are never copied into the report', () => {
  const { copies } = buildReport(input());

  ok(!copies.some((copy) => copy.from.endsWith('error-context.md')));
  ok(!copies.some((copy) => copy.from.endsWith('trace.zip')));
});

test('no arbitrary file can be exposed as a video or screenshot', () => {
  const smuggled: RawTestResult = {
    ...PASSED,
    attachments: [
      // Labelled video, but its bytes are not WebM.
      { name: 'video', contentType: 'video/webm', path: '/out/tc1/secrets.env' },
      // Genuine-looking name, but outside Playwright's output directory.
      { name: 'video', contentType: 'video/webm', path: '/repo/.env.webm' },
      { name: 'screenshot', contentType: 'image/png', path: '/home/user/.ssh/id.png' },
      // Escapes the output directory by traversal.
      { name: 'video', contentType: 'video/webm', path: '/out/../repo/clip.webm' },
      // Wrong content type for the name.
      { name: 'video', contentType: 'text/plain', path: '/out/tc1/video.webm' },
      // Unknown attachment names.
      { name: 'clip', contentType: 'video/webm', path: '/out/tc1/video.webm' },
      { name: 'error-context', contentType: 'text/markdown', path: '/out/tc1/error-context.md' },
    ],
  };
  const { attachments, copies } = selectAttachments(smuggled, 'TC-99001-001', gate());

  deepStrictEqual(attachments, []);
  deepStrictEqual(copies, []);
});

test('insideAny accepts only paths strictly inside an output directory', () => {
  ok(insideAny(['/out'], '/out/tc1/video.webm'));
  ok(!insideAny(['/out'], '/out'));
  ok(!insideAny(['/out'], '/out/../etc/passwd'));
  ok(!insideAny(['/out'], '/outside/video.webm'));
  ok(!insideAny([], '/out/tc1/video.webm'));
});

test('signatureOfBytes recognises PNG and WebM by content, nothing else', () => {
  strictEqual(signatureOfBytes(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'png');
  strictEqual(signatureOfBytes(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0])), 'webm');
  strictEqual(signatureOfBytes(new TextEncoder().encode('ADO_PAT_')), null);
});

test('no video is reported when the policy disallows it, or when no file exists', () => {
  const off = selectAttachments(FAILED, 'TC-99001-002', gate({ videoAllowed: false }));
  ok(!off.attachments.some((entry) => entry.kind === 'video'), 'policy off: no video');

  const missing = selectAttachments(FAILED, 'TC-99001-002', gate({ fileExists: (path) => !path.endsWith('.webm') }));
  ok(!missing.attachments.some((entry) => entry.kind === 'video'), 'no file: no fake video');

  ok(!renderReportHtml(buildReport(input({ gate: gate({ videoAllowed: false }) })).report).includes('<video'));
});

test('an attachment whose file is missing is not referenced', () => {
  const { report, copies } = buildReport(input({ gate: gate({ fileExists: () => false }) }));

  deepStrictEqual(report.results[1]!.attachments, []);
  deepStrictEqual(copies, []);
});

test('the generator refuses to reference any path outside attachments/', () => {
  const { report } = buildReport(input());
  const tampered = {
    ...report,
    results: report.results.map((entry) => ({
      ...entry,
      attachments: [{ kind: 'screenshot' as const, path: '../../.env', label: 'x' }, { kind: 'screenshot' as const, path: 'javascript:alert(1)', label: 'y' }],
    })),
  };
  const html = renderReportHtml(tampered);

  ok(!html.includes('../../.env'));
  ok(!html.includes('javascript:'));
});

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

test('credentials never reach the report: call logs, ARIA lines, registered secrets, titles', () => {
  clearSecrets();
  registerSecret(USERNAME);
  registerSecret(PASSWORD);
  try {
    const leaky: RawTestResult = {
      ...FAILED,
      title: `TC-99001-002 — signs in as ${USERNAME}`,
      annotations: [],
      errors: [`${FAILURE_MESSAGE}\nReceived: "${USERNAME}"`],
    };
    const { report } = buildReport(input({ raws: [PASSED, FAILED, leaky] }));
    const html = renderReportHtml(report);
    const json = JSON.stringify(report);

    everything(html);
    everything(json);
    for (const bug of report.bugCandidates) everything(renderBugCandidateMarkdown(bug, report));
    ok(html.includes('fill(&quot;[REDACTED]&quot;)'));
  } finally {
    clearSecrets();
  }
});

test('an unregistered password typed by fill() is still removed from the report', () => {
  // The runner process may not hold a secret the worker typed; the call-log rule
  // removes it regardless.
  clearSecrets();
  const json = JSON.stringify(buildReport(input()).report);

  ok(!json.includes(PASSWORD));
});

test('report text is HTML-escaped, never interpreted', () => {
  const evil = 'Error: expect(locator).toHaveText() failed\nReceived: "<script>alert(1)</script>"';
  const raw: RawTestResult = { ...FAILED, errors: [evil], steps: [FAILED.steps[0]!, { ...FAILED.steps[1]!, error: evil }] };
  const html = renderReportHtml(buildReport(input({ raws: [raw] })).report);

  ok(!html.includes('<script>'));
  ok(html.includes('&lt;script&gt;'));
});

test('sanitizeText removes text-entry arguments and ARIA input values', () => {
  strictEqual(sanitizeText(`  - fill("${PASSWORD}")`), '  - fill("[REDACTED]")');
  strictEqual(sanitizeText(`pressSequentially('${PASSWORD}')`), 'pressSequentially("[REDACTED]")');
  strictEqual(sanitizeText(`  - textbox "Password": ${PASSWORD}`), '  - textbox "Password": [REDACTED]');
  strictEqual(sanitizeText('  - button "Login"'), '  - button "Login"');
});

test('sanitizeError drops the ARIA receiver snapshot and sanitises message, stack and cause', () => {
  const error = {
    message: `fill("${PASSWORD}")`,
    stack: `at fill("${PASSWORD}")`,
    errorContext: `- textbox "Password": ${PASSWORD}`,
    cause: { message: `fill("${PASSWORD}")` },
  };
  sanitizeError(error);

  strictEqual(error.errorContext, undefined);
  everything(JSON.stringify(error));
});

test('stripAnsi removes terminal colour codes', () => {
  strictEqual(stripAnsi('\u001b[31mError\u001b[39m'), 'Error');
});

// ---------------------------------------------------------------------------
// Classification, extraction, NOT AUTOMATED, writer
// ---------------------------------------------------------------------------

test('classification follows §9 vocabulary and prefers keeping a human looking', () => {
  strictEqual(classifyFailure('Error: expect(locator).toBeVisible() failed', true).classification, 'PRODUCT_BUG');
  strictEqual(classifyFailure('Error: expect(locator).toBeVisible() failed\nError: element(s) not found', true).classification, 'PRODUCT_BUG');
  strictEqual(classifyFailure('TimeoutError: locator.fill: Timeout 1000ms exceeded.', true).classification, 'TEST_SCRIPT_ISSUE');
  strictEqual(classifyFailure('page.goto: net::ERR_NAME_NOT_RESOLVED', true).classification, 'NETWORK_ISSUE');
  strictEqual(classifyFailure('NOT RUN — TEST_DATA_UNAVAILABLE: X', true).classification, 'TEST_DATA_ISSUE');
  strictEqual(classifyFailure('Error: expect(locator).toBeVisible() failed', false).classification, 'UNKNOWN');
  strictEqual(classifyFailure('something odd', true).classification, 'UNKNOWN');
});

test('extractActual reads Received, not-found, and diff forms', () => {
  strictEqual(extractActual('Expected: "a"\nReceived: "b"'), 'Received: "b"');
  strictEqual(extractActual("Locator: getByText('x')\nError: element(s) not found"), "The element was not found on the page (Locator: getByText('x')).");
  strictEqual(extractActual('- Expected  - 1\n+ Received  + 2\n\n- want\n+\n+   Got this\n\nCall log:\n+ nope'), 'Received: Got this');
});

test('NOT AUTOMATED: an in-scope case with no spec is reported with its plan reason', () => {
  const plan = [
    '| Test Case | User Story | Automation Status | Reason |',
    '|---|---|---|---|',
    '| TC-99001-001 | 99001 | NOT AUTOMATED — AUTH_FLOW_UNSUPPORTED | OTP required |',
  ].join('\n');
  deepStrictEqual(parsePlanRows(plan).get('TC-99001-001'), { status: 'NOT AUTOMATED — AUTH_FLOW_UNSUPPORTED', reason: 'OTP required' });

  const found = findNotAutomated(DEMO, [ARTIFACT], new Set(), () => false, () => plan);
  deepStrictEqual(found.map((entry) => entry.testCase.localId), ['TC-99001-001']);
  ok(found[0]!.reason.startsWith('NOT AUTOMATED — AUTH_FLOW_UNSUPPORTED — OTP required'));

  const { report } = buildReport(input({ raws: [], notAutomated: found }));
  strictEqual(report.totals.notAutomated, 1);
  strictEqual(report.results[0]!.status, 'NOT AUTOMATED');
});

test('NOT AUTOMATED excludes executed cases, cases with a spec, and Need Automation = No', () => {
  deepStrictEqual(findNotAutomated(DEMO, [ARTIFACT], new Set(['TC-99001-001']), () => false, () => null), []);
  deepStrictEqual(findNotAutomated(DEMO, [ARTIFACT], new Set(), () => true, () => null), []);
  // TC-99001-002 is Need Automation = No: never NOT AUTOMATED.
  ok(!findNotAutomated(DEMO, [ARTIFACT], new Set(), () => false, () => null).some((entry) => entry.testCase.localId === 'TC-99001-002'));
});

test('writeReport writes an append-only run directory with only the planned attachments', () => {
  const root = mkdtempSync(join(tmpdir(), 'qa-report-'));
  const source = join(root, 'out');
  mkdirSync(source);
  writeFileSync(join(source, 'test-failed-1.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2]));
  writeFileSync(join(source, 'video.webm'), Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 1, 2, 3, 4]));
  // A file labelled as video that is not one: must never be copied.
  writeFileSync(join(source, 'fake.webm'), `ADO_PAT_WRITE=${PASSWORD}`);
  writeFileSync(join(source, 'error-context.md'), `- textbox "Password": ${PASSWORD}`);

  const raw: RawTestResult = {
    ...FAILED,
    attachments: [
      { name: 'screenshot', contentType: 'image/png', path: join(source, 'test-failed-1.png') },
      { name: 'error-context', contentType: 'text/markdown', path: join(source, 'error-context.md') },
      { name: 'video', contentType: 'video/webm', path: join(source, 'video.webm') },
      { name: 'video', contentType: 'video/webm', path: join(source, 'fake.webm') },
    ],
  };
  const reports = join(root, 'reports', 'DEMO');
  strictEqual(nextRunId(reports), 'RUN-001');

  const runDir = join(reports, 'RUN-001');
  const realGate: AttachmentGate = {
    videoAllowed: true,
    fileExists: existsSync,
    isInsideOutput: (path) => insideAny([source], path),
    signatureOf: (path) => signatureOfBytes(readFileSync(path).subarray(0, 8)),
  };
  writeReport(runDir, buildReport(input({ raws: [raw], gate: realGate })));

  deepStrictEqual(readdirSync(runDir).sort(), ['attachments', 'bug-candidates', 'execution-report.html', 'execution-results.json']);
  deepStrictEqual(readdirSync(join(runDir, 'attachments')).sort(), ['TC-99001-002.png', 'TC-99001-002.webm']);
  for (const file of readdirSync(join(runDir, 'attachments'))) {
    ok(!readFileSync(join(runDir, 'attachments', file)).includes(Buffer.from(PASSWORD)), `${file} must not be the decoy`);
  }
  deepStrictEqual(readdirSync(join(runDir, 'bug-candidates')), ['BUG-001.md']);
  for (const file of ['execution-report.html', 'execution-results.json', 'bug-candidates/BUG-001.md']) {
    everything(readFileSync(join(runDir, file), 'utf8'));
  }

  strictEqual(nextRunId(reports), 'RUN-002');
  strictEqual(latestRunId(reports), 'RUN-001');
  throws(() => writeReport(runDir, buildReport(input())), /append-only/);
});
