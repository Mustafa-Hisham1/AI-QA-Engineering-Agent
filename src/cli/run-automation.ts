/**
 * Runs or lists the active project's Playwright automation.
 *
 *   node src/cli/run-automation.ts --project NBO --list               # discovery only
 *   node src/cli/run-automation.ts --project NBO --grep @TC-53717-006 # run one case
 *
 * Resolves the active project the same way as every other command, then starts
 * the pinned Playwright runner with that project pinned. Every argument other
 * than `--project <KEY>` is passed to `playwright test` unchanged.
 *
 * Execution against an environment is guarded by `src/automation/global-setup.ts`
 * (label, allow-list, PROD block). Discovery (`--list`) touches no environment.
 *
 * Exit codes: Playwright's own, or 2 for a project problem.
 */

import { existsSync } from 'node:fs';

import { runPlaywright } from '../automation/runner.ts';
import { ProjectError, describeActiveProject, resolveActiveProject } from '../projects/active-project.ts';

function splitArgs(argv: readonly string[]): { project: string | null; forwarded: string[] } {
  let project: string | null = null;
  const forwarded: string[] = [];

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]!;
    if (arg === '--project') project = argv[++index] ?? null;
    else forwarded.push(arg);
  }

  return { project, forwarded };
}

async function main(): Promise<number> {
  const { project: explicitKey, forwarded } = splitArgs(process.argv.slice(2));
  const project = resolveActiveProject(explicitKey);
  console.log(`Active project: ${describeActiveProject(project)}`);

  const testDir = `automation/${project.key}`;
  if (!existsSync(testDir)) {
    console.log(`No automation exists yet for ${project.key} (${testDir}/). Nothing to run.`);
    return 0;
  }

  const run = await runPlaywright(['test', ...forwarded], project.key);
  return run.exitCode;
}

try {
  process.exitCode = await main();
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
