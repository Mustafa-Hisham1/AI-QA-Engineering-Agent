/**
 * Presentation shared by the two QA execution reports:
 *
 *   automation-report.html   deterministic Playwright runs (src/automation/reporting/)
 *   manual-report.html       agent-driven MCP runs (src/execution/)
 *
 * One stylesheet, one set of building blocks — summary cards, status badges,
 * expandable Test Case sections, the step table, the evidence gallery — so the
 * two reports look and read alike while their data and generation stay separate.
 *
 * Pure: no file system. Every value is HTML-escaped; report text must never be
 * interpreted as markup.
 */

export function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  return `${Math.floor(seconds / 60)} m ${Math.round(seconds % 60)} s`;
}

export function badge(status: string, css: string): string {
  return `<span class="badge ${css}">${escapeHtml(status)}</span>`;
}

/** One file shown in the evidence gallery, by a path relative to the report. */
export interface GalleryItem {
  readonly kind: 'screenshot' | 'video' | 'file';
  readonly path: string;
  readonly label: string;
}

/**
 * Renders the evidence gallery. Only paths matching `safePath` are referenced —
 * each report decides which directory its evidence may come from.
 */
export function renderGallery(items: readonly GalleryItem[], safePath: RegExp, empty = 'No attachment.'): string {
  const safe = items.filter((entry) => safePath.test(entry.path));
  if (safe.length === 0) return `<p class="muted">${escapeHtml(empty)}</p>`;

  return `<div class="attachments">${safe
    .map((entry) => {
      const href = escapeHtml(entry.path);
      const label = escapeHtml(entry.label);
      if (entry.kind === 'screenshot') {
        return `<figure><a href="${href}" target="_blank" rel="noopener"><img src="${href}" alt="${label}" loading="lazy"></a><figcaption><a href="${href}" target="_blank" rel="noopener">View ${label}</a></figcaption></figure>`;
      }
      if (entry.kind === 'video') {
        return `<figure class="video"><video controls preload="metadata" src="${href}"></video><figcaption><a href="${href}" target="_blank" rel="noopener">&#9654; Play ${label}</a></figcaption></figure>`;
      }
      return `<figure class="file"><figcaption><a href="${href}" target="_blank" rel="noopener">Open ${label}</a></figcaption></figure>`;
    })
    .join('')}</div>`;
}

/** One row of the step table. */
export interface StepRow {
  readonly index: number;
  readonly action: string;
  readonly expected: string;
  readonly actual: string;
  readonly status: string;
  /** CSS class for the status badge. */
  readonly css: string;
  /** Null hides the value; the column is shown only when `withDuration`. */
  readonly durationMs?: number | null;
}

/** The step-level Expected vs Actual table. */
export function renderStepTable(rows: readonly StepRow[], failedStep: number | null, withDuration: boolean): string {
  if (rows.length === 0) return '<p class="muted">No Test Case steps were recorded.</p>';

  const body = rows
    .map((step) => {
      const marker = step.index === failedStep ? ' class="failed-step"' : '';
      const duration = withDuration ? `<td class="num">${escapeHtml(formatDuration(step.durationMs ?? null))}</td>` : '';
      return `<tr${marker}><td class="num">${escapeHtml(step.index)}</td><td>${escapeHtml(step.action)}</td><td>${escapeHtml(step.expected)}</td><td>${escapeHtml(step.actual)}</td><td>${badge(step.status, step.css)}</td>${duration}</tr>`;
    })
    .join('');

  return `<div class="table-wrap"><table class="steps"><thead><tr><th>#</th><th>Step</th><th>Expected Result</th><th>Actual Result</th><th>Status</th>${withDuration ? '<th>Duration</th>' : ''}</tr></thead><tbody>${body}</tbody></table></div>`;
}

/** The page shell: doctype, the shared stylesheet, a title, and the body. */
export function renderPage(title: string, body: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><style>${REPORT_STYLE}</style></head>
<body><main>
${body}
</main></body></html>
`;
}

/**
 * The shared stylesheet. Status colours: pass, fail, notrun (amber — automation
 * NOT RUN, manual BLOCKED), notauto (indigo — NOT AUTOMATED, manual SKIPPED),
 * observed (neutral — manual observation-only steps).
 */
export const REPORT_STYLE = `
:root{--bg:#f6f7f9;--card:#fff;--text:#1d232b;--muted:#5d6876;--line:#dde2e8;--pass:#1a7f4b;--pass-bg:#e3f4ea;--fail:#c0302b;--fail-bg:#fbe5e4;--notrun:#8a6a00;--notrun-bg:#fbf1d3;--notauto:#5b5f97;--notauto-bg:#e8e9f6;--accent:#2f5fb3}
@media (prefers-color-scheme:dark){:root{--bg:#14181d;--card:#1c2229;--text:#e6eaef;--muted:#9aa5b1;--line:#2d3640;--pass:#5cd08f;--pass-bg:#173527;--fail:#ff7b72;--fail-bg:#3d1c1b;--notrun:#e3b341;--notrun-bg:#3a2f12;--notauto:#a5a9e8;--notauto-bg:#262842;--accent:#7aa7ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:1180px;margin:0 auto;padding:24px 16px 64px}h1{margin:0 0 4px;font-size:24px}h2{margin:36px 0 12px;font-size:19px}h3{margin:8px 0 12px;font-size:17px}h4{margin:16px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
.muted{color:var(--muted)}code{font:13px ui-monospace,Consolas,monospace}a{color:var(--accent)}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px}
.verdict{display:flex;align-items:center;gap:16px;flex-wrap:wrap}.verdict .big{font-size:22px;font-weight:700;padding:6px 16px;border-radius:8px}
.big.pass{background:var(--pass-bg);color:var(--pass)}.big.fail{background:var(--fail-bg);color:var(--fail)}.big.notrun{background:var(--notrun-bg);color:var(--notrun)}
.exec-type{display:inline-block;font:700 12px ui-monospace,Consolas,monospace;letter-spacing:.06em;padding:2px 10px;border-radius:6px;background:var(--line);color:var(--text);vertical-align:middle}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:14px}.stat{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px}.stat b{display:block;font-size:22px}.stat span{color:var(--muted);font-size:13px}
.stat.pass b{color:var(--pass)}.stat.fail b{color:var(--fail)}.stat.notrun b{color:var(--notrun)}.stat.notauto b{color:var(--notauto)}
.bar{display:flex;height:12px;border-radius:6px;overflow:hidden;margin-top:14px;background:var(--line)}.bar i{display:block}.bar .pass{background:var(--pass)}.bar .fail{background:var(--fail)}.bar .notrun{background:var(--notrun)}.bar .notauto{background:var(--notauto)}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:4px 24px;margin:14px 0 0}.facts div{min-width:0}.facts dt{color:var(--muted);font-size:13px}.facts dd{margin:0;overflow-wrap:anywhere}
.badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}
.badge.pass{background:var(--pass-bg);color:var(--pass)}.badge.fail{background:var(--fail-bg);color:var(--fail)}.badge.notrun{background:var(--notrun-bg);color:var(--notrun)}.badge.notauto{background:var(--notauto-bg);color:var(--notauto)}.badge.class,.badge.draft,.badge.observed{background:var(--line);color:var(--text)}
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
article.bug.notabug{border-left-color:var(--muted);border-left-style:dashed}article.bug.notabug h3{color:var(--muted)}
.badge.confirmed{background:var(--fail-bg);color:var(--fail)}.badge.notabug{background:var(--notauto-bg);color:var(--notauto)}
.resolution{border-radius:8px;padding:4px 14px;margin:0 0 12px}.resolution.notabug{background:var(--notauto-bg)}.resolution.confirmed{background:var(--fail-bg)}.resolution h4{margin-top:8px}
.bug-counts{font-weight:600}h3.bug-group{margin-top:20px}
.notice{border-left:4px solid var(--accent);padding:8px 12px;background:var(--card);border-radius:6px}
ul.obs li{margin:4px 0}
footer{margin-top:40px;color:var(--muted);font-size:13px}
`;
