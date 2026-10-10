/**
 * Generates the MANUAL execution report of a run — `manual-report.html` — from
 * the run's `execution-results.json` (`docs/product-decisions.md` §10.4).
 *
 *   node src/cli/execution-report.ts 52857 --project NBO                # latest manual run
 *   node src/cli/execution-report.ts 52857 --project NBO --run RUN-001  # a specific run
 *
 * The final, mandatory step of every `/execute-test-cases` run. Re-runnable: it
 * re-renders the same run's report and never touches another run, the
 * automation report, the Test Case CSV, the application or Azure DevOps.
 *
 * Refuses (exit 1) a results record that is malformed, that names an evidence
 * or Bug Candidate file that does not exist, or that contains the value of any
 * configured handle or credential — records name handles, never values.
 *
 * Exit codes:  0 = report written   1 = run or record problem   2 = project problem
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { redact } from '../ado/errors.ts';
import { registerEnvironmentSecrets } from '../automation/config.ts';
import { latestManualRun, writeManualReport } from '../execution/manual-report.ts';
import { MANUAL_RESULTS_FILE, ManualResultsError, manualTotals, manualVerdict, validateManualResults } from '../execution/manual-results.ts';
import { ProjectError, describeActiveProject, executionsDirFor, resolveActiveProject } from '../projects/active-project.ts';
import { ReportIsolationError } from '../reporting/report-files.ts';
import { csvPathFor } from '../testcases/store.ts';

const RUN_DIR = /^RUN-(\d{3,})$/;

function parseArgs(argv: readonly string[]): { id: number | null; project: string | null; run: string | null } {
  let id: number | null = null;
  let project: string | null = null;
  let run: string | null = null;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]!;
    if (arg === '--project') project = argv[++index] ?? null;
    else if (arg === '--run') run = argv[++index] ?? null;
    else if (!arg.startsWith('--') && Number.isInteger(Number(arg)) && Number(arg) > 0) id = Number(arg);
  }
  return { id, project, run };
}

function sha256Of(path: string): string | null {
  try {
    return createHash('sha256').update(readFileSync(path)).digest('hex');
  } catch {
    return null;
  }
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  if (args.id === null) {
    console.error('Usage: node src/cli/execution-report.ts <user-story-id> [--project <KEY>] [--run RUN-NNN]');
    return 1;
  }
  if (args.run !== null && !RUN_DIR.test(args.run)) {
    console.error(`"${args.run}" is not a run ID (expected RUN-NNN).`);
    return 1;
  }

  const project = resolveActiveProject(args.project);
  console.log(`Active project: ${describeActiveProject(project)}`);

  const storyDir = executionsDirFor(project, args.id);
  const runId = args.run ?? latestManualRun(storyDir);
  if (!runId) {
    console.error(`No manual run with ${MANUAL_RESULTS_FILE} under ${storyDir}/.`);
    console.error('Manual runs are produced by /execute-test-cases.');
    return 1;
  }
  const runDir = join(storyDir, runId);
  const resultsPath = join(runDir, MANUAL_RESULTS_FILE);
  if (!existsSync(resultsPath)) {
    console.error(`${resultsPath} does not exist.`);
    return 1;
  }

  const text = readFileSync(resultsPath, 'utf8');

  // Records name handles, never values. Any configured handle or credential
  // value in the record is a leak into a file that may be committed.
  registerEnvironmentSecrets(project);
  if (redact(text) !== text) {
    console.error(`${resultsPath} contains the value of a configured handle or credential.`);
    console.error('Replace every such value with the handle name, then re-run. No report was written.');
    return 1;
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    console.error(`${resultsPath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }

  const run = validateManualResults(data, runDir, { project: project.key, storyId: args.id, runId });
  const htmlPath = writeManualReport(runDir, run, { currentSha256: sha256Of(csvPathFor(project.root, args.id)) });

  const totals = manualTotals(run.results);
  console.log(
    `${runId} (MANUAL): ${totals.total} Test Case(s) — ${totals.pass} passed, ${totals.fail} failed, ${totals.blocked} blocked, ${totals.skipped} skipped; verdict ${manualVerdict(totals)}; ${run.bugCandidates.length} Bug Candidate(s).`,
  );
  console.log(`Manual report: ${htmlPath}`);
  console.log(`Open:          ${pathToFileURL(resolve(htmlPath)).href}`);
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  if (error instanceof ProjectError) {
    console.error(`Active project problem: ${error.message}`);
    for (const detail of error.details) console.error(`  ${detail}`);
    process.exitCode = 2;
  } else if (error instanceof ManualResultsError) {
    console.error(error.message);
    for (const detail of error.details) console.error(`  ${detail}`);
    process.exitCode = 1;
  } else if (error instanceof ReportIsolationError) {
    console.error(error.message);
    process.exitCode = 1;
  } else {
    console.error(`Unexpected failure: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
