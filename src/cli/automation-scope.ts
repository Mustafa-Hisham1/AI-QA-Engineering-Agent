/**
 * Shows which Test Cases of a User Story are in automation scope, grouped by
 * Module, with the plan and spec path each one maps to. Reads local files only.
 *
 *   node src/cli/automation-scope.ts 53717 --project NBO
 *
 * In scope = Need Automation = Yes AND Approved/Published
 * (`docs/product-decisions.md` §7.1). Every other case is listed with its
 * reason — nothing is dropped silently.
 *
 * Exit codes:  0 = success (even when nothing is in scope)   2 = project or artifact problem
 */

import { existsSync } from 'node:fs';

import { selectAutomationScope, type ScopedCase } from '../automation/scope.ts';
import { ProjectError, describeActiveProject, resolveActiveProject } from '../projects/active-project.ts';
import { ArtifactError, artifactPathFor, parseArtifact } from '../testcases/artifact.ts';

function parseArgs(argv: readonly string[]): { id: number | null; project: string | null } {
  let id: number | null = null;
  let project: string | null = null;

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--project') project = argv[++index] ?? null;
    else if (arg !== undefined && !arg.startsWith('--')) {
      const parsed = Number(arg);
      if (Number.isInteger(parsed) && parsed > 0) id = parsed;
    }
  }

  return { id, project };
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  if (args.id === null) {
    console.error('Error: a User Story ID is required.');
    console.error('Usage: node src/cli/automation-scope.ts <user-story-id> [--project <KEY>]');
    return 2;
  }

  const project = resolveActiveProject(args.project);
  const artifactPath = artifactPathFor(project.root, args.id);
  const artifact = parseArtifact(artifactPath, args.id);
  const { inScope, excluded } = selectAutomationScope(project, artifact);

  console.log(`Active project: ${describeActiveProject(project)}`);
  console.log(`Artifact:       ${artifactPath}`);
  console.log(`Cases:          ${artifact.testCases.length} — ${inScope.length} in automation scope, ${excluded.length} excluded`);

  const byModule = new Map<string, ScopedCase[]>();
  for (const entry of inScope) {
    const group = byModule.get(entry.testCase.module) ?? [];
    group.push(entry);
    byModule.set(entry.testCase.module, group);
  }

  for (const [module, cases] of byModule) {
    const planPath = cases[0]!.planPath;
    console.log();
    console.log(`Module ${module}  (${cases.length} case(s))`);
    console.log(`  plan: ${planPath}${existsSync(planPath) ? '' : '  [not yet written]'}`);
    for (const entry of cases) {
      const adoId = entry.testCase.adoId ?? '—';
      const spec = existsSync(entry.specPath) ? 'exists' : 'not yet generated';
      console.log(`  ${entry.testCase.localId}  ${entry.testCase.status}  ADO ${adoId}  ${entry.specPath}  [${spec}]`);
    }
  }

  if (excluded.length > 0) {
    console.log();
    console.log('Excluded:');
    for (const entry of excluded) {
      console.log(`  ${entry.testCase.localId}  ${entry.reason}  — ${entry.detail}`);
    }
  }

  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  if (error instanceof ProjectError || error instanceof ArtifactError) {
    console.error(`${error instanceof ProjectError ? 'Active project' : 'Artifact'} problem: ${error.message}`);
    for (const detail of error.details) console.error(`  ${detail}`);
    process.exitCode = 2;
  } else {
    console.error(`Unexpected failure: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
