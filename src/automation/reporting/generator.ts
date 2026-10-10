/**
 * Renders an automation ExecutionReport as one self-contained HTML page —
 * `automation-report.html` — and each Bug Candidate as the Markdown file
 * `/publish-bug` reads (`docs/product-decisions.md` §7.2).
 *
 * Pure. No scripts, no external resources: the page works offline from the
 * report directory, and every value is HTML-escaped — report text comes from
 * Playwright errors, and must never be interpreted as markup. The presentation
 * is shared with the manual report (`src/reporting/html.ts`); the data is not.
 */

import { renderBugReportSection, type BugReportEntry } from '../../reporting/bug-report.ts';
import { badge, escapeHtml, formatDuration, renderGallery, renderPage, renderStepTable } from '../../reporting/html.ts';
import type {
  BugCandidate,
  ExecutionReport,
  ExecutionStatus,
  ReportAttachment,
  StepResult,
  TestCaseResult,
} from './model.ts';

export { escapeHtml, formatDuration };

/** The execution type this report states, so it can never be mistaken for a manual run. */
export const AUTOMATION_EXECUTION_TYPE = 'AUTOMATED';

/** Only files the writer copied into `attachments/` may be referenced. */
const SAFE_ATTACHMENT = /^attachments\/[A-Za-z0-9._-]+\.(png|webm)$/;

const STATUS_CLASS: Record<ExecutionStatus, string> = {
  PASS: 'pass',
  FAIL: 'fail',
  'NOT RUN': 'notrun',
  'NOT AUTOMATED': 'notauto',
};

function anchor(result: TestCaseResult, position: number): string {
  return `tc-${(result.testCaseId ?? `untraced-${position}`).replace(/[^A-Za-z0-9-]/g, '')}`;
}

function renderAttachments(attachments: readonly ReportAttachment[], safe: RegExp): string {
  return renderGallery(attachments, safe);
}

export interface RenderOptions {
  /**
   * Where `attachments/` lives relative to the HTML being written — set when the
   * report is written outside its run directory (the module copy,
   * `<module>/automation-report.html`), e.g. `../../../../.artifacts/reports/NBO/RUN-016`.
   * Attachments are still validated against `attachments/<file>` first.
   */
  readonly attachmentBase?: string;
}

const SAFE_BASE = /^(\.\.\/)*[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The report with attachment paths relocated under `base` — only allow-listed paths survive. */
function relocate(report: ExecutionReport, base: string): ExecutionReport {
  // `..` only as a leading run (up out of the Module directory), never in the middle.
  const parts = base.split('/');
  const climbs = parts.findIndex((part) => part !== '..');
  const unsafePart = parts.some((part, index) => part === '.' || part === '' || (part === '..' && index >= climbs));
  if (!SAFE_BASE.test(base) || climbs === -1 || unsafePart) throw new Error(`Unsafe attachment base "${base}".`);
  const move = (items: readonly ReportAttachment[]): ReportAttachment[] =>
    items.filter((item) => SAFE_ATTACHMENT.test(item.path)).map((item) => ({ ...item, path: `${base}/${item.path}` }));
  return {
    ...report,
    results: report.results.map((result) => ({ ...result, attachments: move(result.attachments) })),
    bugCandidates: report.bugCandidates.map((bug) => ({ ...bug, attachments: move(bug.attachments) })),
  };
}

function renderSteps(steps: readonly StepResult[], failedStep: number | null): string {
  return renderStepTable(
    steps.map((step) => ({
      ...step,
      css: step.status === 'PASS' ? 'pass' : step.status === 'FAIL' ? 'fail' : 'notrun',
    })),
    failedStep,
    true,
  );
}

function renderResult(result: TestCaseResult, position: number, safeAttachment: RegExp): string {
  const css = STATUS_CLASS[result.status];
  const open = result.status === 'FAIL' ? ' open' : '';
  const ids = [
    `<dt>Test Case</dt><dd>${escapeHtml(result.testCaseId ?? 'Not traceable — no Test Case annotation')}</dd>`,
    `<dt>User Story</dt><dd>${escapeHtml(result.userStoryId ?? '—')}</dd>`,
    `<dt>ADO Test Case</dt><dd>${escapeHtml(result.adoId ?? '—')}</dd>`,
    `<dt>Module / Feature</dt><dd>${escapeHtml(result.module ?? '—')} / ${escapeHtml(result.featurePage ?? '—')}</dd>`,
    `<dt>Requirement</dt><dd>${escapeHtml(result.requirementReference ?? '—')}</dd>`,
    `<dt>Playwright spec</dt><dd><code>${escapeHtml(result.specFile ?? '—')}</code></dd>`,
  ].join('');

  const why = result.failure
    ? `<div class="why"><h4>Why it failed${result.failedStep !== null ? ` — Step ${escapeHtml(result.failedStep)}` : ' — outside the Test Case steps'}</h4>
<dl class="kv"><dt>Expected Result</dt><dd>${escapeHtml(result.failure.expected)}</dd>
<dt>Actual Result</dt><dd>${escapeHtml(result.failure.actual)}</dd>
<dt>Failure reason</dt><dd>${escapeHtml(result.failure.reason)}</dd>
<dt>Classification</dt><dd>${badge(result.failure.classification, 'class')} <span class="muted">Automatic and provisional. ${escapeHtml(result.failure.classificationNote)}</span></dd>
${result.bugCandidateId ? `<dt>Bug Candidate</dt><dd><a href="#${escapeHtml(result.bugCandidateId)}">${escapeHtml(result.bugCandidateId)}</a></dd>` : ''}</dl>
<details class="raw"><summary>Full error</summary><pre>${escapeHtml(result.failure.error)}</pre></details></div>`
    : '';

  const reason = result.reason ? `<p class="reason">${escapeHtml(result.reason)}</p>` : '';
  // Every outcome shows what it recorded: a passing test's video is evidence too.
  const evidence = result.status === 'NOT AUTOMATED' ? '' : `<h4>Attachments</h4>${renderAttachments(result.attachments, safeAttachment)}`;

  return `<details class="result ${css}" id="${anchor(result, position)}"${open}>
<summary>${badge(result.status, css)}<span class="tcid">${escapeHtml(result.testCaseId ?? '(untraced)')}</span><span class="title">${escapeHtml(result.title)}</span><span class="meta">US ${escapeHtml(result.userStoryId ?? '—')} · ADO ${escapeHtml(result.adoId ?? '—')} · ${escapeHtml(formatDuration(result.durationMs))}</span></summary>
<div class="body">${reason}${why}<dl class="kv ids">${ids}</dl><h4>Steps</h4>${renderSteps(result.steps, result.failedStep)}${evidence}</div>
</details>`;
}

/** This run's Bug Candidate, in the shared Bug Report shape. */
function bugEntry(bug: BugCandidate, report: ExecutionReport): BugReportEntry {
  const position = report.results.findIndex((result) => result.testCaseId === bug.testCaseId);
  return {
    id: bug.id,
    title: bug.title,
    status: bug.status,
    classification: bug.classification,
    testCases: [{ id: bug.testCaseId, href: position === -1 ? null : `#${anchor(report.results[position]!, position)}` }],
    userStory: `US ${bug.userStoryId}`,
    runId: report.runId,
    requirementReference: bug.requirementReference,
    description: bug.description,
    preconditions: bug.preconditions,
    stepsToReproduce: bug.stepsToReproduce,
    testData: bug.testData,
    expectedResult: bug.expectedResult,
    actualResult: bug.actualResult,
    environment: bug.environment,
    facts: [
      { label: 'ADO Test Case', value: bug.adoId === null ? '—' : String(bug.adoId) },
      { label: 'Classification note', value: 'Automatic and provisional — a human confirms it.' },
    ],
    suspectedCause: null,
    notes: [],
    resolution: bug.resolution ?? null,
    evidence: bug.attachments,
    file: `bug-candidates/${bug.id}.md`,
  };
}

export function renderReportHtml(original: ExecutionReport, options: RenderOptions = {}): string {
  const report = options.attachmentBase ? relocate(original, options.attachmentBase) : original;
  const safeAttachment = options.attachmentBase
    ? new RegExp(`^${escapeRegExp(options.attachmentBase)}/attachments/[A-Za-z0-9._-]+\\.(png|webm)$`)
    : SAFE_ATTACHMENT;
  const { totals } = report;
  const verdict = totals.fail === 0 && totals.pass > 0 ? 'PASS' : totals.fail > 0 ? 'FAIL' : 'NO RESULT';
  const verdictCss = verdict === 'PASS' ? 'pass' : 'fail';
  const share = (n: number): string => (totals.total === 0 ? '0' : ((n / totals.total) * 100).toFixed(2));

  const failures = report.results
    .map((result, position) => ({ result, position }))
    .filter(({ result }) => result.status === 'FAIL');

  const failureList =
    failures.length === 0
      ? ''
      : `<div class="card"><h3>Failed Test Cases</h3><ul class="failures">${failures
          .map(
            ({ result, position }) =>
              `<li><a href="#${anchor(result, position)}"><b>${escapeHtml(result.testCaseId ?? '(untraced)')}</b></a> — ${result.failedStep !== null ? `Step ${escapeHtml(result.failedStep)}` : 'outside the steps'}: ${escapeHtml(result.failure?.reason ?? '')} <span class="muted">(${escapeHtml(result.failure?.classification ?? '')})</span></li>`,
          )
          .join('')}</ul></div>`;

  const bugReport = renderBugReportSection(
    report.bugCandidates.map((bug) => bugEntry(bug, report)),
    { safeEvidence: safeAttachment, publishHint: '/publish-bug <this run>/bug-candidates/BUG-NNN.md', linkLocalFile: false },
  );

  return renderPage(
    `Automation Report ${report.runId}`,
    `<h1>Execution Report — ${escapeHtml(report.project)} ${escapeHtml(report.runId)} <span class="exec-type" data-execution-type="${AUTOMATION_EXECUTION_TYPE}">${AUTOMATION_EXECUTION_TYPE}</span></h1>
<p class="muted">Execution type: <b>${AUTOMATION_EXECUTION_TYPE}</b> — deterministic Playwright automation. Generated from sanitised results; credential-free by construction.</p>

<h2>Execution Summary</h2>
<div class="card">
<div class="verdict"><span class="big ${verdictCss}">${escapeHtml(verdict)}</span><span>${escapeHtml(totals.pass)} of ${escapeHtml(totals.total)} Test Cases passed</span></div>
<div class="bar" role="img" aria-label="${escapeHtml(`${totals.pass} passed, ${totals.fail} failed, ${totals.notRun} not run, ${totals.notAutomated} not automated`)}"><i class="pass" style="width:${share(totals.pass)}%"></i><i class="fail" style="width:${share(totals.fail)}%"></i><i class="notrun" style="width:${share(totals.notRun)}%"></i><i class="notauto" style="width:${share(totals.notAutomated)}%"></i></div>
<div class="stats">
<div class="stat"><b>${escapeHtml(totals.total)}</b><span>Total Test Cases</span></div>
<div class="stat pass"><b>${escapeHtml(totals.pass)}</b><span>Passed</span></div>
<div class="stat fail"><b>${escapeHtml(totals.fail)}</b><span>Failed</span></div>
<div class="stat notrun"><b>${escapeHtml(totals.notRun)}</b><span>Not Run</span></div>
<div class="stat notauto"><b>${escapeHtml(totals.notAutomated)}</b><span>Not Automated</span></div>
<div class="stat"><b>${escapeHtml(formatDuration(report.durationMs))}</b><span>Duration</span></div>
</div>
<dl class="facts">
<div><dt>Execution type</dt><dd>${AUTOMATION_EXECUTION_TYPE} (Playwright)</dd></div>
<div><dt>Project</dt><dd>${escapeHtml(report.project)}</dd></div>
<div><dt>User Story(s)</dt><dd>${escapeHtml(report.userStories.join(', ') || '—')}</dd></div>
<div><dt>Module(s)</dt><dd>${escapeHtml(report.modules.join(', ') || '—')}</dd></div>
<div><dt>Environment</dt><dd>${escapeHtml(report.environment.label)} · <code>${escapeHtml(report.environment.host)}</code></dd></div>
<div><dt>Executed</dt><dd>${escapeHtml(report.startedAt)}</dd></div>
<div><dt>Run</dt><dd>${escapeHtml(report.runId)}</dd></div>
</dl>
</div>
${failureList}

<h2>Test Case Results</h2>
<p class="muted">User Story → Test Case → Playwright spec → result → classification → Bug Candidate. Click a Test Case for its steps.</p>
${report.results.map((result, position) => renderResult(result, position, safeAttachment)).join('\n')}

${bugReport}

<footer>No credential text, traces, ARIA snapshots or page snapshots are included. Videos are STG QA recordings for the project testing team (product decision §7.2.1): they show the UI as it ran, and are kept, never blanked. Playwright debug output stays in <code>.artifacts/playwright-results/</code>.</footer>`,
  );
}

/** The Bug Candidate as a local Markdown file, in the shape `/publish-bug` reads. */
export function renderBugCandidateMarkdown(bug: BugCandidate, report: ExecutionReport): string {
  const bullets = (items: readonly string[]): string => (items.length === 0 ? '- None stated.' : items.map((item) => `- ${item}`).join('\n'));
  const numbered = (items: readonly string[]): string => items.map((item, index) => `${index + 1}. ${item}`).join('\n');

  const resolution = bug.resolution ?? null;
  const statusLine =
    bug.status === 'Not a Bug'
      ? '**Resolved — NOT A BUG** (invalid bug report). Never published. Kept for traceability.'
      : bug.status === 'Confirmed'
        ? '**Confirmed bug** — reviewed by a human. Not in Azure DevOps until /publish-bug.'
        : '**Draft** — awaiting human review. Not in Azure DevOps.';
  const resolutionSection = resolution
    ? `## Resolution

- Disposition: ${resolution.disposition}
- Decided by: ${resolution.decidedBy} on ${resolution.decidedAt}${resolution.decisionRef ? ` (decision ${resolution.decisionRef})` : ''}
- Rationale: ${resolution.rationale}

The original Bug Candidate below is kept exactly as raised by the run.

`
    : '';

  return `# ${bug.id} — Bug Candidate (automation)

| | |
|---|---|
| Status | ${statusLine} |
| Source | Automated run ${report.runId}, project ${report.project} |
| Related Test Case | ${bug.testCaseId} (Azure DevOps ID ${bug.adoId ?? '—'}) |
| Related User Story | ${bug.userStoryId} |
| Requirement Reference | ${bug.requirementReference} |
| Failure Classification | ${bug.classification} — automatic and **provisional**; confirm before publishing |
| Environment | ${bug.environment.label} — host \`${bug.environment.host}\` |
| Severity / Priority | Not proposed — decided by the human at publish time |

${resolutionSection}## Title

${bug.title}

## Description

${bug.description}

## Preconditions

${bullets(bug.preconditions)}

## Steps to Reproduce

${numbered(bug.stepsToReproduce)}

## Test Data

${bullets(bug.testData)}

## Expected Result

${bug.expectedResult}

## Actual Result

${bug.actualResult}

## Evidence

${bug.attachments.length === 0 ? '- None.' : bug.attachments.map((entry) => `- ${entry.label}: \`../${entry.path}\``).join('\n')}

Publishing is a separate, human-approved step: \`/publish-bug\` with this file.
`;
}
