/**
 * Tests for the manual run policy (`docs/product-decisions.md` §10.5):
 *
 *   - a PRODUCT_BUG fails its own case, raises a Bug Candidate, and the run
 *     continues — it never stops the run or skips another case;
 *   - the run stops only on a legitimate, evidenced condition;
 *   - Bug Candidates and the report reflect both, with totals that match.
 *
 * Synthetic data only. Nothing is executed against any environment.
 */

import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { renderManualReportHtml, writeManualReport } from '../src/execution/manual-report.ts';
import {
  MANUAL_RESULTS_FILE,
  ManualResultsError,
  manualTotals,
  manualVerdict,
  validateManualResults,
  type Classification,
  type ManualStatus,
} from '../src/execution/manual-results.ts';
import {
  CONSECUTIVE_FAILURES_TO_STOP,
  decideAfterCase,
  type CaseOutcome,
  type RunDecision,
  type RunSignals,
} from '../src/execution/run-policy.ts';

const STORY = 99001;
const id = (n: number): string => `TC-${STORY}-${String(n).padStart(3, '0')}`;
const outcome = (n: number, status: ManualStatus, classification: Classification | null): CaseOutcome => ({ testCaseId: id(n), status, classification });

// ---------------------------------------------------------------------------
// The policy
// ---------------------------------------------------------------------------

test('a PRODUCT_BUG never stops the run — the next case runs', () => {
  const decision = decideAfterCase([outcome(1, 'PASS', null), outcome(2, 'FAIL', 'PRODUCT_BUG')]);
  strictEqual(decision.action, 'CONTINUE');
  ok(decision.action === 'CONTINUE' && /Bug Candidate and continue/.test(decision.note));
});

test('any number of PRODUCT_BUG failures in a row still continue', () => {
  const history = [1, 2, 3, 4, 5].map((n) => outcome(n, 'FAIL', 'PRODUCT_BUG'));
  strictEqual(decideAfterCase(history).action, 'CONTINUE');
});

test('test-data, script and unknown failures continue too — they block or fail one case only', () => {
  for (const classification of ['TEST_DATA_ISSUE', 'TEST_SCRIPT_ISSUE', 'UNKNOWN'] as const) {
    const history = [1, 2, 3].map((n) => outcome(n, 'BLOCKED', classification));
    strictEqual(decideAfterCase(history).action, 'CONTINUE', classification);
  }
});

test('one transient environment or authentication failure continues; a consistent one stops', () => {
  strictEqual(CONSECUTIVE_FAILURES_TO_STOP, 2);
  strictEqual(decideAfterCase([outcome(1, 'BLOCKED', 'NETWORK_ISSUE')]).action, 'CONTINUE');
  strictEqual(decideAfterCase([outcome(1, 'BLOCKED', 'ENVIRONMENT_ISSUE'), outcome(2, 'PASS', null), outcome(3, 'BLOCKED', 'ENVIRONMENT_ISSUE')]).action, 'CONTINUE');

  const environment = decideAfterCase([outcome(1, 'BLOCKED', 'ENVIRONMENT_ISSUE'), outcome(2, 'BLOCKED', 'NETWORK_ISSUE')]);
  strictEqual(environment.action, 'STOP');
  strictEqual(environment.action === 'STOP' && environment.condition, 'ENVIRONMENT_UNAVAILABLE');

  const authentication = decideAfterCase([outcome(1, 'BLOCKED', 'AUTHENTICATION_ISSUE'), outcome(2, 'BLOCKED', 'AUTHENTICATION_ISSUE')]);
  strictEqual(authentication.action === 'STOP' && authentication.condition, 'AUTHENTICATION_BROKEN');
});

test('an explicit unsafe or impossible signal stops at once, destructive risk first', () => {
  const cases: [RunSignals, string][] = [
    [{ environmentUnreachable: 'Reachability check failed' }, 'ENVIRONMENT_UNAVAILABLE'],
    [{ authenticationBroken: 'The login page returns 500 for every account' }, 'AUTHENTICATION_BROKEN'],
    [{ blockingIssue: 'The app version changed mid-run' }, 'BLOCKING_ISSUE'],
    [{ destructiveRisk: 'The next step would deactivate a live market' }, 'DESTRUCTIVE_RISK'],
    [{ destructiveRisk: 'Would corrupt shared data', environmentUnreachable: 'down' }, 'DESTRUCTIVE_RISK'],
  ];
  for (const [signals, condition] of cases) {
    const decision = decideAfterCase([outcome(1, 'PASS', null)], signals);
    strictEqual(decision.action === 'STOP' && decision.condition, condition);
  }
});

// ---------------------------------------------------------------------------
// A simulated run: the policy drives the loop, the record is validated and rendered
// ---------------------------------------------------------------------------

interface Scripted {
  readonly status: ManualStatus;
  readonly classification: Classification | null;
  readonly signals?: RunSignals;
}

/** Runs scripted cases the way the Skill does: execute, record, ask the policy, continue or stop. */
function simulate(script: readonly Scripted[]): { executed: string[]; decision: RunDecision | null } {
  const history: CaseOutcome[] = [];
  let decision: RunDecision | null = null;
  for (const [index, step] of script.entries()) {
    history.push(outcome(index + 1, step.status, step.classification));
    decision = decideAfterCase(history, step.signals);
    if (decision.action === 'STOP') break;
  }
  return { executed: history.map((entry) => entry.testCaseId), decision };
}

test('a PRODUCT_BUG in one case does not prevent the later independent cases from executing', () => {
  const { executed, decision } = simulate([
    { status: 'PASS', classification: null },
    { status: 'FAIL', classification: 'PRODUCT_BUG' },
    { status: 'PASS', classification: null },
    { status: 'FAIL', classification: 'PRODUCT_BUG' },
    { status: 'PASS', classification: null },
  ]);
  deepStrictEqual(executed, [id(1), id(2), id(3), id(4), id(5)]);
  strictEqual(decision?.action, 'CONTINUE');
});

test('a legitimate stop condition still stops the run, keeping every result before it', () => {
  const { executed, decision } = simulate([
    { status: 'FAIL', classification: 'PRODUCT_BUG' },
    { status: 'BLOCKED', classification: 'ENVIRONMENT_ISSUE' },
    { status: 'BLOCKED', classification: 'ENVIRONMENT_ISSUE' },
    { status: 'PASS', classification: null },
    { status: 'PASS', classification: null },
  ]);
  deepStrictEqual(executed, [id(1), id(2), id(3)]);
  strictEqual(decision?.action === 'STOP' && decision.condition, 'ENVIRONMENT_UNAVAILABLE');

  const destructive = simulate([
    { status: 'PASS', classification: null },
    { status: 'PASS', classification: null, signals: { destructiveRisk: 'Next case would delete shared data' } },
    { status: 'PASS', classification: null },
  ]);
  deepStrictEqual(destructive.executed, [id(1), id(2)]);
});

// ---------------------------------------------------------------------------
// Records, Bug Candidates and the report
// ---------------------------------------------------------------------------

function step(status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT EXECUTED', actual = 'as expected'): Record<string, unknown> {
  return { index: 1, action: 'Do the thing', expected: 'The thing happens', actual: status === 'NOT EXECUTED' ? '' : actual, status };
}

function caseResult(n: number, status: ManualStatus, extra: Record<string, unknown> = {}): Record<string, unknown> {
  const stepStatus = status === 'PASS' ? 'PASS' : status === 'FAIL' ? 'FAIL' : 'NOT EXECUTED';
  return {
    testCaseId: id(n), title: `[DEMO][Area][Page] Case ${n}`, adoId: null, requirementReference: null, status,
    observationOnly: false, durationMs: 1000, classification: null, reason: null, suspectedCause: null, notReached: false,
    preconditionCheck: null, steps: status === 'SKIPPED' ? [] : [step(stepStatus, status === 'FAIL' ? 'Something else happened' : 'as expected')],
    evidence: [], observations: [], bugCandidateId: null, ...extra,
  };
}

const productBug = (n: number, bug: string, extra: Record<string, unknown> = {}): Record<string, unknown> =>
  caseResult(n, 'FAIL', { classification: 'PRODUCT_BUG', reason: 'The confirmation dialog never appears', bugCandidateId: bug, ...extra });

function record(results: Record<string, unknown>[], bugs: Record<string, unknown>[], completion: Record<string, unknown> = { status: 'COMPLETED' }) {
  return {
    executionType: 'MANUAL', project: 'DEMO', runId: 'RUN-001', userStory: { id: STORY, title: null },
    environment: { label: 'STG', host: 'demo-stg.example.test' }, startedAt: '2026-10-10T10:00:00.000Z', finishedAt: null,
    executedBy: 'AI agent via Playwright MCP', testCaseSource: { path: 'docs/projects/DEMO/test-cases/US-99001/test-cases.csv', sha256: 'c'.repeat(64) },
    completion, results, bugCandidates: bugs, observations: [],
  };
}

function bug(idText: string, cases: string[], title = 'The confirmation dialog never appears', fileBody?: string): Record<string, unknown> {
  return {
    id: idText, file: `bug-candidates/${idText}.md`, title: `[DEMO][Area][Page] ${title}`, testCaseIds: cases,
    classification: 'PRODUCT_BUG', summary: 'Confirmed: clicking Save shows no dialog and nothing is saved.',
    suspectedRootCause: 'Possibly the dialog component fails to load (unconfirmed).', status: 'Draft', evidence: [],
    ...(fileBody === undefined ? {} : { fileBody }),
  };
}

/** Writes the run directory and validates the record in it. */
function load(data: ReturnType<typeof record>) {
  const dir = join(mkdtempSync(join(tmpdir(), 'qa-policy-')), 'RUN-001');
  mkdirSync(join(dir, 'bug-candidates'), { recursive: true });
  for (const entry of data.bugCandidates) {
    const body = (entry.fileBody as string | undefined) ?? `# ${entry.id}\n\n| Related run | RUN-001 |\n| Related Test Cases | ${(entry.testCaseIds as string[]).join(', ')} |\n`;
    writeFileSync(join(dir, entry.file as string), body);
    delete entry.fileBody;
  }
  writeFileSync(join(dir, MANUAL_RESULTS_FILE), JSON.stringify(data));
  return { dir, run: validateManualResults(JSON.parse(readFileSync(join(dir, MANUAL_RESULTS_FILE), 'utf8')), dir, { project: 'DEMO', storyId: STORY, runId: 'RUN-001' }) };
}

function refused(data: ReturnType<typeof record>, fragment: string): void {
  throws(
    () => load(data),
    (error: unknown) => {
      ok(error instanceof ManualResultsError, String(error));
      ok(error.details.some((detail) => detail.includes(fragment)), `expected "${fragment}" in:\n${error.details.join('\n')}`);
      return true;
    },
  );
}

test('a completed run with a PRODUCT_BUG followed by executed cases is valid, and the report shows them all', () => {
  const { dir, run } = load(record([caseResult(1, 'PASS'), productBug(2, 'BUG-CANDIDATE-1'), caseResult(3, 'PASS'), caseResult(4, 'PASS')], [bug('BUG-CANDIDATE-1', [id(2)])]));
  const totals = manualTotals(run.results);
  deepStrictEqual(totals, { total: 4, pass: 3, fail: 1, blocked: 0, skipped: 0, notReached: 0 });
  strictEqual(manualVerdict(totals), 'FAIL');

  const html = readFileSync(writeManualReport(dir, run, { currentSha256: null }), 'utf8');
  for (const n of [1, 2, 3, 4]) ok(html.includes(`id="tc-${id(n)}"`), `${id(n)} must appear`);
  ok(html.includes('data-completion="COMPLETED"'));
  ok(html.includes('id="BUG-CANDIDATE-1"') && html.includes('href="bug-candidates/BUG-CANDIDATE-1.md"'));
  for (const [key, value] of [['total', 4], ['pass', 3], ['fail', 1], ['blocked', 0], ['skipped', 0]] as const) {
    ok(html.includes(`data-total="${key}">${value}<`), `${key} = ${value}`);
  }
});

test('the report keeps confirmed observations apart from suspected root causes', () => {
  const { run } = load(
    record([productBug(1, 'BUG-CANDIDATE-1', { suspectedCause: 'Maybe a slow API (unconfirmed)' })], [bug('BUG-CANDIDATE-1', [id(1)])]),
  );
  const html = renderManualReportHtml(run, { currentSha256: null });
  ok(html.includes('Observed (confirmed)') && html.includes('Suspected cause (unconfirmed)'));
  ok(html.includes('Suspected root cause (unconfirmed)'));
  ok(/data-kind="observed">The confirmation dialog never appears/.test(html));
  ok(/data-kind="suspected">Maybe a slow API/.test(html));
});

test('a legitimate stop is recorded: results up to it are kept, the rest are not reached, the verdict is INCOMPLETE', () => {
  const { run } = load(
    record(
      [
        caseResult(1, 'PASS'),
        caseResult(2, 'BLOCKED', { classification: 'ENVIRONMENT_ISSUE', reason: 'HTTP 503 on every page' }),
        caseResult(3, 'BLOCKED', { classification: 'ENVIRONMENT_ISSUE', reason: 'HTTP 503 on every page' }),
        caseResult(4, 'SKIPPED', { notReached: true, reason: 'Not executed — the run stopped: ENVIRONMENT_UNAVAILABLE' }),
        caseResult(5, 'SKIPPED', { notReached: true, reason: 'Not executed — the run stopped: ENVIRONMENT_UNAVAILABLE' }),
      ],
      [],
      { status: 'STOPPED', condition: 'ENVIRONMENT_UNAVAILABLE', explanation: 'Two consecutive cases hit HTTP 503', afterTestCaseId: id(3) },
    ),
  );
  const totals = manualTotals(run.results);
  deepStrictEqual(totals, { total: 5, pass: 1, fail: 0, blocked: 2, skipped: 2, notReached: 2 });
  strictEqual(manualVerdict(totals), 'INCOMPLETE');

  const html = renderManualReportHtml(run, { currentSha256: null });
  ok(html.includes('data-completion="STOPPED"') && html.includes('Run stopped — ENVIRONMENT_UNAVAILABLE'));
  ok(html.includes('data-total="notReached">2<'));
  ok(html.includes('Not reached — the run stopped.'));
});

test('a product bug is never a stop condition', () => {
  refused(
    record(
      [productBug(1, 'BUG-CANDIDATE-1'), caseResult(2, 'SKIPPED', { notReached: true, reason: 'Not executed — the run stopped' })],
      [bug('BUG-CANDIDATE-1', [id(1)])],
      { status: 'STOPPED', condition: 'PRODUCT_BUG', explanation: 'Found a bug', afterTestCaseId: id(1) },
    ),
    'a product bug never stops a run',
  );
});

test('a case is never skipped because of a bug found in another case', () => {
  refused(
    record([productBug(1, 'BUG-CANDIDATE-1'), caseResult(2, 'SKIPPED', { reason: 'Skipped because of the bug in TC-99001-001' })], [bug('BUG-CANDIDATE-1', [id(1)])]),
    'a product bug never causes another case to be skipped',
  );
});

test('a stop must be consistent with the case it stopped after', () => {
  refused(
    record(
      [productBug(1, 'BUG-CANDIDATE-1'), caseResult(2, 'SKIPPED', { notReached: true, reason: 'Not executed — the run stopped' })],
      [bug('BUG-CANDIDATE-1', [id(1)])],
      { status: 'STOPPED', condition: 'ENVIRONMENT_UNAVAILABLE', explanation: 'It seemed down', afterTestCaseId: id(1) },
    ),
    'ENVIRONMENT_UNAVAILABLE needs',
  );
});

test('nothing executes after a stop, and a completed run has nothing unreached', () => {
  refused(
    record(
      [caseResult(1, 'BLOCKED', { classification: 'AUTHENTICATION_ISSUE', reason: 'Login rejected' }), caseResult(2, 'PASS')],
      [],
      { status: 'STOPPED', condition: 'AUTHENTICATION_BROKEN', explanation: 'Login broken', afterTestCaseId: id(1) },
    ),
    'executed after the run stopped',
  );
  refused(
    record([caseResult(1, 'PASS'), caseResult(2, 'SKIPPED', { notReached: true, reason: 'Not executed' })], []),
    'a COMPLETED run reached every case',
  );
});

test('every PRODUCT_BUG failure is recorded as a Bug Candidate', () => {
  refused(record([productBug(1, null as unknown as string)], []), 'bugCandidateId is missing');
});

test('one underlying defect is one Bug Candidate linked to every case it failed', () => {
  const { run } = load(
    record([productBug(1, 'BUG-CANDIDATE-1'), caseResult(2, 'PASS'), productBug(3, 'BUG-CANDIDATE-1')], [bug('BUG-CANDIDATE-1', [id(1), id(3)])]),
  );
  strictEqual(run.bugCandidates.length, 1);
  const html = renderManualReportHtml(run, { currentSha256: null });
  ok(html.includes(`href="#tc-${id(1)}"`) && html.includes(`href="#tc-${id(3)}"`));
  ok(html.includes('one defect, raised once'));
});

test('the same defect raised twice is refused as a duplicate Bug Candidate', () => {
  refused(
    record([productBug(1, 'BUG-CANDIDATE-1'), productBug(2, 'BUG-CANDIDATE-2')], [bug('BUG-CANDIDATE-1', [id(1)]), bug('BUG-CANDIDATE-2', [id(2)])]),
    'the same defect is raised more than once',
  );
});

test('a Bug Candidate links both ways, and its file names the run and its Test Cases', () => {
  refused(record([productBug(1, 'BUG-CANDIDATE-1'), productBug(2, 'BUG-CANDIDATE-1')], [bug('BUG-CANDIDATE-1', [id(1)])]), 'does not include TC-99001-002');
  refused(
    record([productBug(1, 'BUG-CANDIDATE-1')], [bug('BUG-CANDIDATE-1', [id(1)], undefined, `# BUG-CANDIDATE-1\n\nRelated Test Case: ${id(1)}\n`)]),
    'does not name the execution run RUN-001',
  );
  refused(
    record([productBug(1, 'BUG-CANDIDATE-1')], [bug('BUG-CANDIDATE-1', [id(1)], undefined, '# BUG-CANDIDATE-1\n\nRelated run: RUN-001\n')]),
    `does not name Test Case ${id(1)}`,
  );
});

test('the /execute-test-cases Skill continues past a product bug and lists the stop conditions', () => {
  const skill = readFileSync(new URL('../.claude/skills/execute-test-cases/SKILL.md', import.meta.url), 'utf8');
  ok(/A product bug never stops the run/i.test(skill), 'the Skill must state that a product bug never stops the run');
  ok(!/Do not continue executing the remaining cases until the human has reviewed it/.test(skill), 'the old stop rule must be gone');
  for (const condition of ['ENVIRONMENT_UNAVAILABLE', 'AUTHENTICATION_BROKEN', 'BLOCKING_ISSUE', 'DESTRUCTIVE_RISK']) {
    ok(skill.includes(condition), `the Skill must list ${condition}`);
  }
});
