/**
 * Shows — and if asked, re-renders — an automation execution report.
 *
 *   node src/cli/automation-report.ts --project NBO                # latest run
 *   node src/cli/automation-report.ts --project NBO --run RUN-004  # a specific run
 *
 * Every `automation:test` run writes its report automatically; this command
 * finds it again, and re-renders the HTML and Bug Candidate files from the
 * stored `execution-results.json` (already sanitised) — useful after the
 * report template changes. It never re-runs a test and never copies a new
 * attachment.
 *
 * Exit codes:  0 = report found   1 = no report   2 = project problem
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { REPORT_ROOT } from '../automation/artifact-policy.ts';
import type { ExecutionReport } from '../automation/reporting/model.ts';
import { RESULTS_FILE, latestRunId, writeRenderedReport } from '../automation/reporting/writer.ts';
import { ProjectError, describeActiveProject, resolveActiveProject } from '../projects/active-project.ts';

function parseArgs(argv: readonly string[]): { project: string | null; run: string | null } {
  let project: string | null = null;
  let run: string | null = null;
  for (let index = 0; index < argv.length; index++) {
    if (argv[index] === '--project') project = argv[++index] ?? null;
    else if (argv[index] === '--run') run = argv[++index] ?? null;
  }
  return { project, run };
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  const project = resolveActiveProject(args.project);
  console.log(`Active project: ${describeActiveProject(project)}`);

  const projectRoot = `${REPORT_ROOT}/${project.key}`;
  if (args.run !== null && !/^RUN-\d{3,}$/.test(args.run)) {
    console.error(`"${args.run}" is not a run ID (expected RUN-NNN).`);
    return 1;
  }

  const runId = args.run ?? latestRunId(projectRoot);
  const resultsPath = runId ? `${projectRoot}/${runId}/${RESULTS_FILE}` : null;
  if (!runId || !resultsPath || !existsSync(resultsPath)) {
    console.error(`No execution report for ${project.key}${args.run ? ` run ${args.run}` : ''} under ${projectRoot}/.`);
    console.error('Reports are written by: npm run automation:test -- --project <KEY>');
    return 1;
  }

  const report = JSON.parse(readFileSync(resultsPath, 'utf8')) as ExecutionReport;
  const htmlPath = writeRenderedReport(`${projectRoot}/${runId}`, report);

  const { totals } = report;
  console.log(`Run ${runId}: ${totals.total} Test Cases — ${totals.pass} passed, ${totals.fail} failed, ${totals.notRun} not run, ${totals.notAutomated} not automated; ${report.bugCandidates.length} Bug Candidate(s).`);
  console.log(`Report: ${htmlPath}`);
  console.log(`Open:   ${pathToFileURL(resolve(htmlPath)).href}`);
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  if (error instanceof ProjectError) {
    console.error(`Active project problem: ${error.message}`);
    for (const detail of error.details) console.error(`  ${detail}`);
    process.exitCode = 2;
  } else {
    console.error(`Unexpected failure: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
