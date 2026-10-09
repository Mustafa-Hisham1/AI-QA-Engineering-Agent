/**
 * Writes one run's report directory (`docs/product-decisions.md` §7.2):
 *
 *   <REPORT_ROOT>/<KEY>/RUN-<NNN>/
 *     execution-report.html        the human-friendly QA report
 *     execution-results.json       the same report, machine-readable
 *     bug-candidates/BUG-NNN.md    local Bug Candidates for /publish-bug
 *     attachments/                 <TC-ID>.png failure screenshots and
 *                                  <TC-ID>.webm videos (every test, §7.2.1)
 *
 * Runs are append-only: a new run never overwrites an earlier one.
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { BuiltReport } from './build.ts';
import { renderBugCandidateMarkdown, renderReportHtml } from './generator.ts';
import type { ExecutionReport } from './model.ts';

export const REPORT_FILE = 'execution-report.html';
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
  mkdirSync(join(runDir, 'bug-candidates'), { recursive: true });
  for (const bug of report.bugCandidates) {
    writeFileSync(join(runDir, 'bug-candidates', `${bug.id}.md`), renderBugCandidateMarkdown(bug, report), 'utf8');
  }
  const htmlPath = join(runDir, REPORT_FILE);
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
