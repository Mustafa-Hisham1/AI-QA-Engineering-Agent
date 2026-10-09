/**
 * Guards a regeneration of a local Test Case artifact. Local files only — it
 * never reads or writes Azure DevOps.
 *
 *   node src/cli/check-test-cases.ts 53717 --snapshot   # BEFORE regenerating
 *   node src/cli/check-test-cases.ts 53717              # AFTER regenerating
 *
 * `--snapshot` copies the current artifact, human edits included, to
 * `test-cases.previous.md` beside it (gitignored). The check then parses the
 * artifact strictly, requires a Need Automation decision on every case, and —
 * when a snapshot exists — reports every Test Case ID, Azure DevOps ID,
 * human-set status or Need Automation value the regeneration failed to keep.
 * A clean check removes the snapshot; a failed one keeps it so the lost values
 * can be restored from it.
 *
 * Exit codes:  0 = clean   1 = losses or missing decisions   2 = configuration or artifact problem
 */

import { copyFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { ProjectError, describeActiveProject, resolveActiveProject } from '../projects/active-project.ts';
import { ArtifactError, artifactPathFor, parseArtifact } from '../testcases/artifact.ts';
import { findCasesWithoutAutomationDecision, findRegenerationLosses } from '../testcases/regeneration.ts';

interface Args {
  readonly id: number | null;
  readonly snapshot: boolean;
  readonly project: string | null;
}

function parseArgs(argv: readonly string[]): Args {
  let id: number | null = null;
  let snapshot = false;
  let project: string | null = null;

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--snapshot') snapshot = true;
    else if (arg === '--project') {
      project = argv[++index] ?? null;
    } else if (arg !== undefined && !arg.startsWith('--')) {
      const parsed = Number(arg);
      if (Number.isInteger(parsed) && parsed > 0) id = parsed;
    }
  }

  return { id, snapshot, project };
}

function printUsage(): void {
  console.log();
  console.log('Usage: node src/cli/check-test-cases.ts <user-story-id> [--project <KEY>] [--snapshot]');
  console.log();
  console.log('  <user-story-id>   User Story whose Test Case artifact is checked, e.g. 53717');
  console.log('  --project <KEY>   Active project: a directory name under docs/projects.');
  console.log('                    Required when more than one project profile exists.');
  console.log('  --snapshot        Save the current artifact before regenerating it');
  console.log('  (no flag)         Check the artifact, and compare it with the snapshot if one exists');
  console.log();
}

function snapshotPathFor(artifactPath: string): string {
  return join(dirname(artifactPath), 'test-cases.previous.md');
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));

  if (args.id === null) {
    console.error('Error: a User Story ID is required.');
    printUsage();
    return 2;
  }

  const storyId = args.id;
  const project = resolveActiveProject(args.project);
  const artifactPath = artifactPathFor(project.root, storyId);
  const snapshotPath = snapshotPathFor(artifactPath);

  console.log(describeActiveProject(project));

  if (args.snapshot) {
    if (!existsSync(artifactPath)) {
      console.log(`No artifact at ${artifactPath} — first generation, nothing to preserve.`);
      return 0;
    }
    // Parse before copying: a snapshot that cannot be parsed cannot be compared
    // against, and finding that out after the rewrite is too late.
    const artifact = parseArtifact(artifactPath, storyId);
    copyFileSync(artifactPath, snapshotPath);
    console.log(`Snapshot saved: ${snapshotPath} (${artifact.testCases.length} cases).`);
    return 0;
  }

  const artifact = parseArtifact(artifactPath, storyId);
  let failed = false;

  const yes = artifact.testCases.filter((entry) => entry.needAutomation === 'Yes').length;
  const no = artifact.testCases.filter((entry) => entry.needAutomation === 'No').length;
  console.log(`${artifactPath}: ${artifact.testCases.length} cases — Need Automation: ${yes} Yes, ${no} No.`);

  const undecided = findCasesWithoutAutomationDecision(artifact);
  if (undecided.length > 0) {
    failed = true;
    console.error(`${undecided.length} case(s) have no Need Automation value:`);
    for (const localId of undecided) console.error(`  ${localId}`);
  }

  if (existsSync(snapshotPath)) {
    const previous = parseArtifact(snapshotPath, storyId);
    const losses = findRegenerationLosses(previous, artifact);
    if (losses.length > 0) {
      failed = true;
      console.error(`Regeneration lost ${losses.length} preserved value(s) — restore them from ${snapshotPath}:`);
      for (const loss of losses) console.error(`  ${loss.localId}: ${loss.problem}`);
    } else {
      console.log(`Compared with the snapshot (${previous.testCases.length} cases): nothing lost.`);
    }
  } else {
    console.log('No snapshot — nothing to compare against.');
  }

  if (failed) return 1;

  if (existsSync(snapshotPath)) rmSync(snapshotPath);
  console.log('Check passed.');
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  if (error instanceof ProjectError) {
    console.error(`Active project problem: ${error.message}`);
    for (const detail of error.details) console.error(`  ${detail}`);
    process.exitCode = 2;
  } else if (error instanceof ArtifactError) {
    console.error(`Artifact problem: ${error.message}`);
    for (const detail of error.details) console.error(`  ${detail}`);
    process.exitCode = 2;
  } else {
    console.error(`Unexpected failure: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
