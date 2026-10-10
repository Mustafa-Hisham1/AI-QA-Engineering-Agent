/**
 * Renders a MANUAL execution run as `manual-report.html`, in the run's own
 * directory (`docs/projects/<KEY>/executions/US-<id>/RUN-<NNN>/`,
 * `docs/product-decisions.md` §10.4).
 *
 * Same look and structure as the automation report — the presentation is
 * shared (`src/reporting/html.ts`) — but its own data: only what the manual
 * run recorded in `execution-results.json`. Nothing is invented; a value the
 * run did not record is shown as "—".
 *
 * The writer writes ONE file, `manual-report.html`, and refuses a directory
 * holding an automation report (`src/reporting/report-files.ts`).
 */

import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { renderBugReportSection, type BugReportEntry } from '../reporting/bug-report.ts';
import { badge, escapeHtml, formatDuration, renderGallery, renderPage, renderStepTable } from '../reporting/html.ts';
import { reportPathFor } from '../reporting/report-files.ts';
import {
  MANUAL_EXECUTION_TYPE,
  MANUAL_RESULTS_FILE,
  SAFE_EVIDENCE,
  manualDurationMs,
  manualTotals,
  manualVerdict,
  type ManualBugCandidate,
  type ManualCaseResult,
  type ManualEvidence,
  type ManualRunResults,
  type ManualStatus,
  type ManualStepStatus,
} from './manual-results.ts';

/** The CSV as it stands when the report is rendered, compared with the run's record. */
export interface SourceCheck {
  /** sha256 of the CSV now, or null when it cannot be read. */
  readonly currentSha256: string | null;
}

const STATUS_CLASS: Record<ManualStatus, string> = { PASS: 'pass', FAIL: 'fail', BLOCKED: 'notrun', SKIPPED: 'notauto' };
const STEP_CLASS: Record<ManualStepStatus, string> = {
  PASS: 'pass',
  FAIL: 'fail',
  BLOCKED: 'notrun',
  'NOT EXECUTED': 'notrun',
  OBSERVED: 'observed',
};

function anchor(id: string): string {
  return `tc-${id.replace(/[^A-Za-z0-9-]/g, '')}`;
}

function gallery(evidence: readonly ManualEvidence[], empty: string): string {
  return renderGallery(
    evidence.map((entry) => ({ kind: /\.(png|jpe?g)$/.test(entry.path) ? 'screenshot' : 'file', path: entry.path, label: entry.label })),
    SAFE_EVIDENCE,
    empty,
  );
}

function renderCase(result: ManualCaseResult, bugStatus: ReadonlyMap<string, string>): string {
  const css = STATUS_CLASS[result.status];
  const open = result.status === 'FAIL' || result.status === 'BLOCKED' ? ' open' : '';
  const failedStep = result.steps.find((step) => step.status === 'FAIL' || step.status === 'BLOCKED')?.index ?? null;

  const ids = [
    `<dt>Test Case</dt><dd>${escapeHtml(result.testCaseId)}</dd>`,
    `<dt>ADO Test Case</dt><dd>${escapeHtml(result.adoId ?? '—')}</dd>`,
    `<dt>Requirement</dt><dd>${escapeHtml(result.requirementReference ?? '—')}</dd>`,
    `<dt>Duration</dt><dd>${escapeHtml(formatDuration(result.durationMs))}</dd>`,
    `<dt>Precondition check</dt><dd>${escapeHtml(result.preconditionCheck ?? '—')}</dd>`,
  ].join('');

  // Confirmed observation and suspected cause are labelled apart, always.
  const why =
    result.status === 'FAIL' || result.status === 'BLOCKED'
      ? `<div class="why"><h4>Why it is ${escapeHtml(result.status)}${failedStep !== null ? ` — Step ${escapeHtml(failedStep)}` : ''}</h4>
<dl class="kv"><dt>Observed (confirmed)</dt><dd data-kind="observed">${escapeHtml(result.reason ?? '—')}</dd>
${result.suspectedCause ? `<dt>Suspected cause (unconfirmed)</dt><dd data-kind="suspected">${escapeHtml(result.suspectedCause)}</dd>` : ''}
<dt>Classification</dt><dd>${badge(result.classification ?? '—', 'class')} <span class="muted">Assigned during manual execution (§9); a human confirms it.</span></dd>
${result.bugCandidateId ? `<dt>Bug Candidate</dt><dd><a href="#${escapeHtml(result.bugCandidateId)}">${escapeHtml(result.bugCandidateId)}</a>${bugStatus.get(result.bugCandidateId) === 'Not a Bug' ? ' — <b>resolved after the run as NOT A BUG</b> <span class="muted">(this result is kept as executed)</span>' : bugStatus.get(result.bugCandidateId) === 'Confirmed' ? ' — confirmed as a bug after the run' : ''}</dd>` : ''}</dl></div>`
      : '';
  const reason =
    result.status === 'SKIPPED'
      ? `<p class="reason">${result.notReached ? '<b>Not reached — the run stopped.</b> ' : ''}${escapeHtml(result.reason ?? '')}</p>`
      : '';
  const observationOnly = result.observationOnly
    ? '<p class="notice">Observation-only case: it records behaviour and asserts nothing about the undecided part.</p>'
    : '';
  const observations =
    result.observations.length === 0
      ? ''
      : `<h4>Observations (unverified)</h4><ul class="obs">${result.observations.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}</ul>`;

  return `<details class="result ${css}" id="${anchor(result.testCaseId)}"${open}>
<summary>${badge(result.status, css)}<span class="tcid">${escapeHtml(result.testCaseId)}</span><span class="title">${escapeHtml(result.title)}</span><span class="meta">ADO ${escapeHtml(result.adoId ?? '—')} · ${escapeHtml(formatDuration(result.durationMs))}${result.observationOnly ? ' · observation-only' : ''}</span></summary>
<div class="body">${reason}${observationOnly}${why}<dl class="kv ids">${ids}</dl><h4>Steps</h4>${renderStepTable(
    result.steps.map((step) => ({ ...step, css: STEP_CLASS[step.status] })),
    failedStep,
    false,
  )}<h4>Evidence</h4>${gallery(result.evidence, 'No evidence captured — a PASS needs none unless the case asks for it (§10).')}${observations}</div>
</details>`;
}

/** This run's Bug Candidate, in the shared Bug Report shape. Only what the run recorded. */
function bugEntry(bug: ManualBugCandidate, run: ManualRunResults): BugReportEntry {
  const inRun = new Set(run.results.map((entry) => entry.testCaseId));
  return {
    id: bug.id,
    title: bug.title,
    status: bug.status,
    classification: bug.classification,
    testCases: bug.testCaseIds.map((id) => ({ id, href: inRun.has(id) ? `#${anchor(id)}` : null })),
    userStory: `US ${run.userStory.id}${run.userStory.title ? ` — ${run.userStory.title}` : ''}`,
    runId: run.runId,
    requirementReference: bug.requirementReference,
    description: bug.description ?? bug.summary,
    preconditions: bug.preconditions,
    stepsToReproduce: bug.stepsToReproduce,
    testData: bug.testData,
    expectedResult: bug.expectedResult,
    actualResult: bug.actualResult ?? bug.summary,
    environment: run.environment,
    facts: bug.testCaseIds.length > 1 ? [{ label: 'Linked cases', value: 'one defect, raised once — linked to every case it failed' }] : [],
    suspectedCause: bug.suspectedRootCause,
    notes: bug.notes,
    resolution: bug.resolution,
    evidence: bug.evidence.map((entry) => ({ kind: /\.(png|jpe?g)$/.test(entry.path) ? 'screenshot' : 'file', path: entry.path, label: entry.label })),
    file: bug.file,
  };
}

/** How the run ended: every case reached, or a legitimate stop (§10.5). */
function renderCompletion(run: ManualRunResults, notReached: number): string {
  if (run.completion.status === 'COMPLETED') {
    return '<p class="notice" data-completion="COMPLETED"><b>Run completed</b> — every eligible case was executed. A product bug never stops a run.</p>';
  }
  const stop = run.completion;
  return `<div class="why" data-completion="STOPPED"><h4>Run stopped — ${escapeHtml(stop.condition)}</h4>
<dl class="kv"><dt>Why</dt><dd>${escapeHtml(stop.explanation)}</dd>
<dt>Stopped after</dt><dd><a href="#${anchor(stop.afterTestCaseId)}">${escapeHtml(stop.afterTestCaseId)}</a></dd>
<dt>Not reached</dt><dd>${escapeHtml(notReached)} case(s), recorded as SKIPPED. All results up to the stop are kept.</dd></dl></div>`;
}

/** Renders the whole report. Pure. */
export function renderManualReportHtml(run: ManualRunResults, source: SourceCheck): string {
  const totals = manualTotals(run.results);
  const verdict = manualVerdict(totals);
  const verdictCss = verdict === 'PASS' ? 'pass' : verdict === 'FAIL' ? 'fail' : 'notrun';
  const share = (n: number): string => (totals.total === 0 ? '0' : ((n / totals.total) * 100).toFixed(2));

  const notPassed = run.results.filter((entry) => entry.status === 'FAIL' || entry.status === 'BLOCKED');
  const notPassedList =
    notPassed.length === 0
      ? ''
      : `<div class="card"><h3>Failed and Blocked Test Cases</h3><ul class="failures">${notPassed
          .map(
            (entry) =>
              `<li><a href="#${anchor(entry.testCaseId)}"><b>${escapeHtml(entry.testCaseId)}</b></a> — ${badge(entry.status, STATUS_CLASS[entry.status])} ${escapeHtml(entry.reason ?? '')} <span class="muted">(${escapeHtml(entry.classification ?? '')})</span></li>`,
          )
          .join('')}</ul></div>`;

  const sourceNote =
    source.currentSha256 === null
      ? ' <span class="muted">(the CSV cannot be read now)</span>'
      : source.currentSha256 === run.testCaseSource.sha256
        ? ' <span class="muted">(unchanged since the run)</span>'
        : ' <b>— the CSV has changed since this run; the steps below are as executed</b>';

  const bugStatus = new Map(run.bugCandidates.map((bug) => [bug.id, bug.status]));
  const bugReport = renderBugReportSection(
    run.bugCandidates.map((bug) => bugEntry(bug, run)),
    { safeEvidence: SAFE_EVIDENCE, publishHint: '/publish-bug <this run>/bug-candidates/<file>.md', linkLocalFile: true },
  );

  const runObservations =
    run.observations.length === 0
      ? ''
      : `<h2>Observations</h2><p class="muted">Recorded during the run, unverified, and not results for any Test Case.</p><ul class="obs card">${run.observations.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}</ul>`;

  const story = `US ${run.userStory.id}${run.userStory.title ? ` — ${run.userStory.title}` : ''}`;
  const duration = manualDurationMs(run);

  return renderPage(
    `Manual Execution Report ${run.runId}`,
    `<h1>Execution Report — ${escapeHtml(run.project)} ${escapeHtml(run.runId)} <span class="exec-type" data-execution-type="${MANUAL_EXECUTION_TYPE}">${MANUAL_EXECUTION_TYPE}</span></h1>
<p class="muted">Execution type: <b>${MANUAL_EXECUTION_TYPE}</b> — agent-driven, step by step, through the Playwright MCP server. Not automation code. Credential-free: accounts are named by handle only.</p>

<h2>Execution Summary</h2>
<div class="card">
<div class="verdict"><span class="big ${verdictCss}">${escapeHtml(verdict)}</span><span>${escapeHtml(totals.pass)} of ${escapeHtml(totals.total)} Test Cases passed</span></div>
<div class="bar" role="img" aria-label="${escapeHtml(`${totals.pass} passed, ${totals.fail} failed, ${totals.blocked} blocked, ${totals.skipped} skipped`)}"><i class="pass" style="width:${share(totals.pass)}%"></i><i class="fail" style="width:${share(totals.fail)}%"></i><i class="notrun" style="width:${share(totals.blocked)}%"></i><i class="notauto" style="width:${share(totals.skipped)}%"></i></div>
<div class="stats">
<div class="stat"><b data-total="total">${escapeHtml(totals.total)}</b><span>Total Test Cases</span></div>
<div class="stat pass"><b data-total="pass">${escapeHtml(totals.pass)}</b><span>Passed</span></div>
<div class="stat fail"><b data-total="fail">${escapeHtml(totals.fail)}</b><span>Failed</span></div>
<div class="stat notrun"><b data-total="blocked">${escapeHtml(totals.blocked)}</b><span>Blocked</span></div>
<div class="stat notauto"><b data-total="skipped">${escapeHtml(totals.skipped)}</b><span>Skipped${totals.notReached > 0 ? ` (<span data-total="notReached">${escapeHtml(totals.notReached)}</span> not reached)` : ''}</span></div>
<div class="stat"><b>${escapeHtml(formatDuration(duration))}</b><span>Duration</span></div>
</div>
${renderCompletion(run, totals.notReached)}
<dl class="facts">
<div><dt>Execution type</dt><dd>${MANUAL_EXECUTION_TYPE} (Playwright MCP)</dd></div>
<div><dt>Run completion</dt><dd>${escapeHtml(run.completion.status === 'COMPLETED' ? 'COMPLETED' : `STOPPED — ${run.completion.condition}`)}</dd></div>
<div><dt>User Story</dt><dd>${escapeHtml(story)}</dd></div>
<div><dt>Project</dt><dd>${escapeHtml(run.project)}</dd></div>
<div><dt>Environment</dt><dd>${escapeHtml(run.environment.label)} · <code>${escapeHtml(run.environment.host)}</code></dd></div>
<div><dt>Run</dt><dd>${escapeHtml(run.runId)}</dd></div>
<div><dt>Started</dt><dd>${escapeHtml(run.startedAt)}</dd></div>
<div><dt>Finished</dt><dd>${escapeHtml(run.finishedAt ?? '—')}</dd></div>
<div><dt>Executed by</dt><dd>${escapeHtml(run.executedBy)}</dd></div>
<div><dt>Source artifact</dt><dd><code>${escapeHtml(run.testCaseSource.path)}</code>${sourceNote}</dd></div>
</dl>
</div>
${notPassedList}

<h2>Test Case Results</h2>
<p class="muted">Each case as executed: steps, Expected vs Actual, status, classification, evidence. Click a Test Case to expand it.</p>
${run.results.map((result) => renderCase(result, bugStatus)).join('\n')}

${bugReport}
${runObservations}

<footer>Manual execution record. No Test Run, Test Result or Bug was written to Azure DevOps. No credential, accessibility snapshot or session data is included; evidence is rendered screenshots in this run's <code>evidence/</code> directory (gitignored).</footer>`,
  );
}

/**
 * Writes `manual-report.html` into `runDir` — and nothing else.
 *
 * @throws {ReportIsolationError} when `runDir` holds an automation report.
 */
export function writeManualReport(runDir: string, run: ManualRunResults, source: SourceCheck): string {
  const htmlPath = reportPathFor(runDir, 'manual');
  writeFileSync(htmlPath, renderManualReportHtml(run, source), 'utf8');
  return htmlPath;
}

const RUN_DIR = /^RUN-(\d{3,})$/;

/** The latest run under a story's executions directory that holds a manual results record, or null. */
export function latestManualRun(storyDir: string): string | null {
  if (!existsSync(storyDir)) return null;
  const runs = readdirSync(storyDir)
    .filter((name) => RUN_DIR.test(name) && existsSync(join(storyDir, name, MANUAL_RESULTS_FILE)))
    .sort((a, b) => Number(RUN_DIR.exec(a)![1]) - Number(RUN_DIR.exec(b)![1]));
  return runs.at(-1) ?? null;
}
