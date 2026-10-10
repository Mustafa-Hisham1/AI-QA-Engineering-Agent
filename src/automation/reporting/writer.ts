/**
 * Writes one run's report directory (`docs/product-decisions.md` §7.2):
 *
 *   <REPORT_ROOT>/<KEY>/RUN-<NNN>/
 *     automation-report.html       the human-friendly QA report (never
 *                                  manual-report.html — src/reporting/report-files.ts)
 *     execution-results.json       the same report, machine-readable
 *     bug-candidates/BUG-NNN.md    local Bug Candidates for /publish-bug
 *     attachments/                 <TC-ID>.png failure screenshots and
 *                                  <TC-ID>.webm videos (every test, §7.2.1)
 *
 * Runs are append-only: a new run never overwrites an earlier one.
 *
 * Each run is ALSO written to the Module directory of the specs it executed
 * (human decision 2026-10-10, `docs/product-decisions.md` §7.2):
 *
 *   automation/<KEY>/<Module path>/automation-report.html
 *
 * — the latest run of that Module, rewritten by every run that executes its
 * specs. Its screenshots and videos are NOT copied into the code tree: it links
 * to the run directory's `attachments/`. The run directory stays the history.
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import { AUTOMATION_REPORT_FILE, reportPathFor } from '../../reporting/report-files.ts';
import type { BuiltReport } from './build.ts';
import { renderBugCandidateMarkdown, renderReportHtml } from './generator.ts';
import type { ExecutionReport } from './model.ts';

export const REPORT_FILE = AUTOMATION_REPORT_FILE;
export const RESULTS_FILE = 'execution-results.json';

const RUN_DIR = /^RUN-(\d{3,})$/;

/** The next free `RUN-NNN` under a project's report root. */
export function nextRunId(projectReportRoot: string): string {
  const highest = existsSync(projectReportRoot)
    ? Math.max(0, ...readdirSync(projectReportRoot).map((name) => Number(RUN_DIR.exec(name)?.[1] ?? 0)))
    : 0;
  return `RUN-${String(highest + 1).padStart(3, '0')}`;
}

/** The most recent `RUN-NNN` that holds a report, or null. */
export function latestRunId(projectReportRoot: string): string | null {
  if (!existsSync(projectReportRoot)) return null;
  const runs = readdirSync(projectReportRoot)
    .filter((name) => RUN_DIR.test(name) && existsSync(join(projectReportRoot, name, RESULTS_FILE)))
    .sort((a, b) => Number(RUN_DIR.exec(a)![1]) - Number(RUN_DIR.exec(b)![1]));
  return runs.at(-1) ?? null;
}

/** Writes the HTML and the Bug Candidate files from a report. Re-runnable. */
export function writeRenderedReport(runDir: string, report: ExecutionReport): string {
  // Checked first: refuses a directory holding a manual report, before writing anything.
  const htmlPath = reportPathFor(runDir, 'automation');
  mkdirSync(join(runDir, 'bug-candidates'), { recursive: true });
  for (const bug of report.bugCandidates) {
    writeFileSync(join(runDir, 'bug-candidates', `${bug.id}.md`), renderBugCandidateMarkdown(bug, report), 'utf8');
  }
  writeFileSync(htmlPath, renderReportHtml(report), 'utf8');
  return htmlPath;
}

/** Writes a new run directory: attachments, results JSON, HTML, Bug Candidates. */
export function writeReport(runDir: string, built: BuiltReport): string {
  if (existsSync(runDir)) throw new Error(`${runDir} already exists — runs are append-only.`);
  mkdirSync(join(runDir, 'attachments'), { recursive: true });

  for (const copy of built.copies) copyFileSync(copy.from, join(runDir, copy.to));

  writeFileSync(join(runDir, RESULTS_FILE), `${JSON.stringify(built.report, null, 2)}\n`, 'utf8');
  return writeRenderedReport(runDir, built.report);
}

/**
 * The Module directories of the executed specs: `automation/<KEY>/<Module path>`
 * for every spec at `automation/<KEY>/<Module path>/tests/<file>.spec.ts`. Specs
 * elsewhere (e.g. the artifact check) have no Module report.
 */
export function moduleDirsOf(projectKey: string, specFiles: readonly (string | null)[]): string[] {
  const dirs = new Set<string>();
  for (const spec of specFiles) {
    if (!spec) continue;
    const posixSpec = spec.replaceAll('\\', '/');
    const match = new RegExp(`^automation/${projectKey}/(.+)/tests/[^/]+\\.spec\\.ts$`).exec(posixSpec);
    if (match) dirs.add(`automation/${projectKey}/${match[1]}`);
  }
  return [...dirs].sort();
}

/**
 * Writes `<moduleDir>/automation-report.html` for a run whose report lives in
 * `runDir`, linking its attachments there. Overwrites the Module's previous
 * copy — the run directory keeps the history.
 */
export function writeModuleReport(moduleDir: string, runDir: string, report: ExecutionReport): string {
  const htmlPath = reportPathFor(moduleDir, 'automation');
  const base = relative(moduleDir, runDir).replaceAll('\\', '/');
  mkdirSync(dirname(htmlPath), { recursive: true });
  writeFileSync(htmlPath, renderReportHtml(report, { attachmentBase: base }), 'utf8');
  return htmlPath;
}
