/**
 * Renders an ExecutionReport as one self-contained HTML page, and each Bug
 * Candidate as the Markdown file `/publish-bug` reads
 * (`docs/product-decisions.md` §7.2).
 *
 * Pure. No scripts, no external resources: the page works offline from the
 * report directory, and every value is HTML-escaped — report text comes from
 * Playwright errors, and must never be interpreted as markup.
 */

import type {
  BugCandidate,
  ExecutionReport,
  ExecutionStatus,
  ReportAttachment,
  StepResult,
  TestCaseResult,
} from './model.ts';

export function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Only files the writer copied into `attachments/` may be referenced. */
const SAFE_ATTACHMENT = /^attachments\/[A-Za-z0-9._-]+\.(png|webm)$/;

export function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  return `${Math.floor(seconds / 60)} m ${Math.round(seconds % 60)} s`;
}

const STATUS_CLASS: Record<ExecutionStatus, string> = {
  PASS: 'pass',
  FAIL: 'fail',
  'NOT RUN': 'notrun',
  'NOT AUTOMATED': 'notauto',
};

function badge(status: string, css: string): string {
  return `<span class="badge ${css}">${escapeHtml(status)}</span>`;
}

function anchor(result: TestCaseResult, position: number): string {
  return `tc-${(result.testCaseId ?? `untraced-${position}`).replace(/[^A-Za-z0-9-]/g, '')}`;
}

function renderAttachments(attachments: readonly ReportAttachment[]): string {
  const safe = attachments.filter((entry) => SAFE_ATTACHMENT.test(entry.path));
  if (safe.length === 0) return '<p class="muted">No attachment.</p>';

  return `<div class="attachments">${safe
    .map((entry) =>
      entry.kind === 'screenshot'
        ? `<figure><a href="${escapeHtml(entry.path)}" target="_blank" rel="noopener"><img src="${escapeHtml(entry.path)}" alt="${escapeHtml(entry.label)}" loading="lazy"></a><figcaption><a href="${escapeHtml(entry.path)}" target="_blank" rel="noopener">View ${escapeHtml(entry.label)}</a></figcaption></figure>`
        : `<figure class="video"><video controls preload="metadata" src="${escapeHtml(entry.path)}"></video><figcaption><a href="${escapeHtml(entry.path)}" target="_blank" rel="noopener">&#9654; Play ${escapeHtml(entry.label)}</a></figcaption></figure>`,
    )
    .join('')}</div>`;
}

function renderSteps(steps: readonly StepResult[], failedStep: number | null): string {
  if (steps.length === 0) return '<p class="muted">No Test Case steps were recorded.</p>';

  const rows = steps
    .map((step) => {
      const css = step.status === 'PASS' ? 'pass' : step.status === 'FAIL' ? 'fail' : 'notrun';
      const marker = step.index === failedStep ? ' class="failed-step"' : '';
      return `<tr${marker}><td class="num">${escapeHtml(step.index)}</td><td>${escapeHtml(step.action)}</td><td>${escapeHtml(step.expected)}</td><td>${escapeHtml(step.actual)}</td><td>${badge(step.status, css)}</td><td class="num">${escapeHtml(formatDuration(step.durationMs))}</td></tr>`;
    })
    .join('');

  return `<div class="table-wrap"><table class="steps"><thead><tr><th>#</th><th>Step</th><th>Expected Result</th><th>Actual Result</th><th>Status</th><th>Duration</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderResult(result: TestCaseResult, position: number): string {
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
  const evidence = result.status === 'NOT AUTOMATED' ? '' : `<h4>Attachments</h4>${renderAttachments(result.attachments)}`;

  return `<details class="result ${css}" id="${anchor(result, position)}"${open}>
<summary>${badge(result.status, css)}<span class="tcid">${escapeHtml(result.testCaseId ?? '(untraced)')}</span><span class="title">${escapeHtml(result.title)}</span><span class="meta">US ${escapeHtml(result.userStoryId ?? '—')} · ADO ${escapeHtml(result.adoId ?? '—')} · ${escapeHtml(formatDuration(result.durationMs))}</span></summary>
<div class="body">${reason}${why}<dl class="kv ids">${ids}</dl><h4>Steps</h4>${renderSteps(result.steps, result.failedStep)}${evidence}</div>
</details>`;
}

function renderBug(bug: BugCandidate): string {
  const list = (items: readonly string[], ordered: boolean): string =>
    items.length === 0
      ? '<p class="muted">None stated.</p>'
      : `<${ordered ? 'ol' : 'ul'}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`;

  return `<article class="bug" id="${escapeHtml(bug.id)}">
<header><span class="bug-id">${escapeHtml(bug.id)}</span>${badge(bug.status, 'draft')}${badge(bug.classification, 'class')}</header>
<h3>${escapeHtml(bug.title)}</h3>
<dl class="kv">
<dt>Description</dt><dd>${escapeHtml(bug.description)}</dd>
<dt>Preconditions</dt><dd>${list(bug.preconditions, false)}</dd>
<dt>Steps to Reproduce</dt><dd>${list(bug.stepsToReproduce, true)}</dd>
<dt>Test Data</dt><dd>${list(bug.testData, false)}</dd>
<dt>Expected Result</dt><dd>${escapeHtml(bug.expectedResult)}</dd>
<dt>Actual Result</dt><dd>${escapeHtml(bug.actualResult)}</dd>
<dt>Related Test Case</dt><dd>${escapeHtml(bug.testCaseId)} · ADO ${escapeHtml(bug.adoId ?? '—')}</dd>
<dt>Related User Story</dt><dd>${escapeHtml(bug.userStoryId)}</dd>
<dt>Requirement</dt><dd>${escapeHtml(bug.requirementReference)}</dd>
<dt>Failure Classification</dt><dd>${escapeHtml(bug.classification)} <span class="muted">(automatic, provisional)</span></dd>
<dt>Environment</dt><dd>${escapeHtml(bug.environment.label)} · <code>${escapeHtml(bug.environment.host)}</code></dd>
<dt>Attachments</dt><dd>${renderAttachments(bug.attachments)}</dd>
<dt>Local file</dt><dd><code>bug-candidates/${escapeHtml(bug.id)}.md</code></dd>
</dl></article>`;
}

const STYLE = `
:root{--bg:#f6f7f9;--card:#fff;--text:#1d232b;--muted:#5d6876;--line:#dde2e8;--pass:#1a7f4b;--pass-bg:#e3f4ea;--fail:#c0302b;--fail-bg:#fbe5e4;--notrun:#8a6a00;--notrun-bg:#fbf1d3;--notauto:#5b5f97;--notauto-bg:#e8e9f6;--accent:#2f5fb3}
@media (prefers-color-scheme:dark){:root{--bg:#14181d;--card:#1c2229;--text:#e6eaef;--muted:#9aa5b1;--line:#2d3640;--pass:#5cd08f;--pass-bg:#173527;--fail:#ff7b72;--fail-bg:#3d1c1b;--notrun:#e3b341;--notrun-bg:#3a2f12;--notauto:#a5a9e8;--notauto-bg:#262842;--accent:#7aa7ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:1180px;margin:0 auto;padding:24px 16px 64px}h1{margin:0 0 4px;font-size:24px}h2{margin:36px 0 12px;font-size:19px}h3{margin:8px 0 12px;font-size:17px}h4{margin:16px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
.muted{color:var(--muted)}code{font:13px ui-monospace,Consolas,monospace}a{color:var(--accent)}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px}
.verdict{display:flex;align-items:center;gap:16px;flex-wrap:wrap}.verdict .big{font-size:22px;font-weight:700;padding:6px 16px;border-radius:8px}
.big.pass{background:var(--pass-bg);color:var(--pass)}.big.fail{background:var(--fail-bg);color:var(--fail)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:14px}.stat{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px}.stat b{display:block;font-size:22px}.stat span{color:var(--muted);font-size:13px}
.stat.pass b{color:var(--pass)}.stat.fail b{color:var(--fail)}.stat.notrun b{color:var(--notrun)}.stat.notauto b{color:var(--notauto)}
.bar{display:flex;height:12px;border-radius:6px;overflow:hidden;margin-top:14px;background:var(--line)}.bar i{display:block}.bar .pass{background:var(--pass)}.bar .fail{background:var(--fail)}.bar .notrun{background:var(--notrun)}.bar .notauto{background:var(--notauto)}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:4px 24px;margin:14px 0 0}.facts div{min-width:0}.facts dt{color:var(--muted);font-size:13px}.facts dd{margin:0;overflow-wrap:anywhere}
.badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}
.badge.pass{background:var(--pass-bg);color:var(--pass)}.badge.fail{background:var(--fail-bg);color:var(--fail)}.badge.notrun{background:var(--notrun-bg);color:var(--notrun)}.badge.notauto{background:var(--notauto-bg);color:var(--notauto)}.badge.class,.badge.draft{background:var(--line);color:var(--text)}
.failures li{margin:4px 0}
details.result{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--line);border-radius:8px;margin:8px 0}
details.result.pass{border-left-color:var(--pass)}details.result.fail{border-left-color:var(--fail)}details.result.notrun{border-left-color:var(--notrun)}details.result.notauto{border-left-color:var(--notauto)}
details.result>summary{cursor:pointer;padding:10px 14px;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;list-style-position:outside}
.tcid{font:600 13px ui-monospace,Consolas,monospace}.title{flex:1 1 320px;min-width:0}.meta{color:var(--muted);font-size:13px}
.body{padding:0 14px 14px;border-top:1px solid var(--line)}.reason{background:var(--notrun-bg);padding:8px 12px;border-radius:6px;margin:12px 0 0}
.why{background:var(--fail-bg);border-radius:8px;padding:4px 14px 10px;margin-top:12px}.why h4{color:var(--fail)}
dl.kv{display:grid;grid-template-columns:minmax(120px,180px) 1fr;gap:6px 14px;margin:0}dl.kv dt{color:var(--muted);font-size:13px}dl.kv dd{margin:0;overflow-wrap:anywhere}dl.ids{margin-top:14px}
@media (max-width:600px){dl.kv{grid-template-columns:1fr}dl.kv dd{margin-bottom:6px}}
.table-wrap{overflow-x:auto}table.steps{width:100%;border-collapse:collapse;font-size:14px}table.steps th,table.steps td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}table.steps th{color:var(--muted);font-weight:600;font-size:13px}td.num{white-space:nowrap}
tr.failed-step td{background:var(--fail-bg)}
pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:10px;font:12.5px/1.45 ui-monospace,Consolas,monospace;max-height:420px;overflow:auto}
details.raw summary{cursor:pointer;color:var(--accent);margin-top:8px}
.attachments{display:flex;flex-wrap:wrap;gap:12px}.attachments figure{margin:0;max-width:320px}.attachments figure.video{max-width:480px}.attachments img,.attachments video{max-width:100%;border:1px solid var(--line);border-radius:6px;display:block}.attachments figcaption{font-size:13px;margin-top:4px}
article.bug{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--fail);border-radius:8px;padding:12px 16px;margin:12px 0}article.bug header{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.bug-id{font:700 14px ui-monospace,Consolas,monospace}
.notice{border-left:4px solid var(--accent);padding:8px 12px;background:var(--card);border-radius:6px}
footer{margin-top:40px;color:var(--muted);font-size:13px}
`;

export function renderReportHtml(report: ExecutionReport): string {
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

  const bugs =
    report.bugCandidates.length === 0
      ? '<p class="muted">No Bug Candidates in this run — no failure was classified PRODUCT_BUG.</p>'
      : report.bugCandidates.map(renderBug).join('');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Execution Report ${escapeHtml(report.runId)}</title><style>${STYLE}</style></head>
<body><main>
<h1>Execution Report — ${escapeHtml(report.project)} ${escapeHtml(report.runId)}</h1>
<p class="muted">Deterministic Playwright automation. Generated from sanitised results; credential-free by construction.</p>

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
${report.results.map(renderResult).join('\n')}

<h2>Bug Reports</h2>
<p class="notice">Local Bug Candidates only — <b>nothing here was created in Azure DevOps</b>. Each is a Draft until a human reviews it; publishing is a separate, explicitly approved step: <code>/publish-bug &lt;this run&gt;/bug-candidates/BUG-NNN.md</code>.</p>
${bugs}

<footer>No credential text, traces, ARIA snapshots or page snapshots are included. Videos are STG QA recordings for the project testing team (product decision §7.2.1): they show the UI as it ran, and are kept, never blanked. Playwright debug output stays in <code>.artifacts/playwright-results/</code>.</footer>
</main></body></html>
`;
}

/** The Bug Candidate as a local Markdown file, in the shape `/publish-bug` reads. */
export function renderBugCandidateMarkdown(bug: BugCandidate, report: ExecutionReport): string {
  const bullets = (items: readonly string[]): string => (items.length === 0 ? '- None stated.' : items.map((item) => `- ${item}`).join('\n'));
  const numbered = (items: readonly string[]): string => items.map((item, index) => `${index + 1}. ${item}`).join('\n');

  return `# ${bug.id} — Bug Candidate (automation)

| | |
|---|---|
| Status | **Draft** — awaiting human review. Not in Azure DevOps. |
| Source | Automated run ${report.runId}, project ${report.project} |
| Related Test Case | ${bug.testCaseId} (Azure DevOps ID ${bug.adoId ?? '—'}) |
| Related User Story | ${bug.userStoryId} |
| Requirement Reference | ${bug.requirementReference} |
| Failure Classification | ${bug.classification} — automatic and **provisional**; confirm before publishing |
| Environment | ${bug.environment.label} — host \`${bug.environment.host}\` |
| Severity / Priority | Not proposed — decided by the human at publish time |

## Title

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
