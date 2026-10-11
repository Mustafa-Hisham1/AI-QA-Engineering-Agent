/**
 * Checks a story's Test Case set. Local files only — it never reads or writes
 * Azure DevOps, and it never writes the CSV.
 *
 *   node src/cli/check-test-cases.ts 52857 --snapshot   # BEFORE revising the CSV
 *   node src/cli/check-test-cases.ts 52857              # AFTER revising and rendering
 *
 * The CSV is the source of truth (`docs/product-decisions.md` §6.4). The check:
 *
 *   - parses `test-cases.csv` strictly (header, IDs, steps paired with expected
 *     results, statuses, Need Automation values) and requires a Need Automation
 *     decision on every case;
 *   - requires `test-cases.md` to exist and to match the CSV case for case —
 *     a stale rendering is fixed with `npm run testcases:render`, never by
 *     editing the CSV to match;
 *   - when a snapshot exists, reports every Test Case ID, Azure DevOps ID,
 *     human-set status or Need Automation value the revision lost, and lists
 *     every case whose content changed so the human can review the revision.
 *
 * `--snapshot` copies the CSV, human edits included, to `test-cases.previous.csv`
 * beside it (gitignored). A clean check removes the snapshot; a failed one keeps
 * it so the lost values can be restored from it.
 *
 * Exit codes:  0 = clean   1 = losses, drift or missing decisions   2 = configuration or artifact problem
 */

import { copyFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { ProjectError, describeActiveProject, resolveActiveProject } from '../projects/active-project.ts';
import { ArtifactError } from '../testcases/artifact.ts';
import { findCasesWithoutAutomationDecision, findContentChanges, findRegenerationLosses } from '../testcases/regeneration.ts';
import { checkMarkdownSync, csvPathFor, loadTestCases, loadTestCasesFromCsvFile } from '../testcases/store.ts';

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
  console.log('  <user-story-id>   User Story whose Test Case set is checked, e.g. 52857');
  console.log('  --project <KEY>   Active project: a directory name under docs/projects.');
  console.log('                    Required when more than one project profile exists.');
  console.log('  --snapshot        Save the current CSV before revising it');
  console.log('  (no flag)         Check the CSV and its Markdown rendering, and compare with the snapshot if one exists');
  console.log();
}

function snapshotPathFor(csvPath: string): string {
  return join(dirname(csvPath), 'test-cases.previous.csv');
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
  const csvPath = csvPathFor(project.root, storyId);
  const snapshotPath = snapshotPathFor(csvPath);

  console.log(describeActiveProject(project));

  if (args.snapshot) {
    if (!existsSync(csvPath)) {
      console.log(`No CSV at ${csvPath} — first generation, nothing to preserve.`);
      return 0;
    }
    // Parse before copying: a snapshot that cannot be parsed cannot be compared
    // against, and finding that out after the revision is too late.
    const artifact = loadTestCases(project.root, storyId);
    copyFileSync(csvPath, snapshotPath);
    console.log(`Snapshot saved: ${snapshotPath} (${artifact.testCases.length} cases).`);
    return 0;
  }

  const artifact = loadTestCases(project.root, storyId);
  let failed = false;

  const yes = artifact.testCases.filter((entry) => entry.needAutomation === 'Yes').length;
  const no = artifact.testCases.filter((entry) => entry.needAutomation === 'No').length;
  console.log(`${csvPath}: ${artifact.testCases.length} cases — Need Automation: ${yes} Yes, ${no} No.`);

  const undecided = findCasesWithoutAutomationDecision(artifact);
  if (undecided.length > 0) {
    failed = true;
    console.error(`${undecided.length} case(s) have no Need Automation value:`);
    for (const localId of undecided) console.error(`  ${localId}`);
  }

  const sync = checkMarkdownSync(project.root, storyId);
  if (sync.problems.length > 0) {
    failed = true;
    console.error(`test-cases.md does not match test-cases.csv (${sync.problems.length} difference(s)) — the CSV wins:`);
    for (const problem of sync.problems.slice(0, 20)) console.error(`  ${problem}`);
    if (sync.problems.length > 20) console.error(`  … and ${sync.problems.length - 20} more`);
    console.error(`Re-render it from the CSV: npm run testcases:render -- ${storyId} --project ${project.key}`);
  } else {
    console.log('test-cases.md matches test-cases.csv.');
  }

  if (existsSync(snapshotPath)) {
    const previous = loadTestCasesFromCsvFile(snapshotPath, storyId);
    const losses = findRegenerationLosses(previous, artifact);
    if (losses.length > 0) {
      failed = true;
      console.error(`The revision lost ${losses.length} preserved value(s) — restore them from ${snapshotPath}:`);
      for (const loss of losses) console.error(`  ${loss.localId}: ${loss.problem}`);
    } else {
      console.log(`Compared with the snapshot (${previous.testCases.length} cases): nothing lost.`);
    }

    // Not a failure: listed so the human reviews exactly what the revision touched.
    const changes = findContentChanges(previous, artifact);
    if (changes.length > 0) {
      console.log(`${changes.length} case(s) changed content since the snapshot — review them:`);
      for (const change of changes) console.log(`  ${change.localId}: ${change.fields.join(', ')}`);
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
