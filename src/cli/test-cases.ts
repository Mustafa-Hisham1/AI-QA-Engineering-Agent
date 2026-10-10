/**
 * Works with a story's Test Case files. Local files only — never Azure DevOps.
 *
 *   node src/cli/test-cases.ts render  53717 [--project <KEY>]
 *       Re-render test-cases.md from test-cases.csv. Writes the Markdown only;
 *       the CSV is never written.
 *
 *   node src/cli/test-cases.ts migrate 53717 [--project <KEY>]
 *       One-time conversion of a legacy Markdown-only artifact: writes
 *       test-cases.csv and re-renders test-cases.md from it. Refuses when a CSV
 *       already exists, and writes nothing unless every case round-trips exactly.
 *
 *   node src/cli/test-cases.ts show    53717 [TC-ID …] [--project <KEY>] [--json]
 *       Prints cases from the CSV — the current, human-reviewed content — for
 *       workflows that execute or automate them. Writes nothing.
 *
 * The CSV is the single source of truth for test-case content
 * (`docs/product-decisions.md` §6.4).
 *
 * Exit codes:  0 = done (show only warns when the Markdown is out of date)   1 = unexpected failure   2 = configuration or artifact problem
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { ProjectError, describeActiveProject, resolveActiveProject } from '../projects/active-project.ts';
import { ArtifactError } from '../testcases/artifact.ts';
import type { TestCaseRecord } from '../testcases/model.ts';
import { checkMarkdownSync, loadTestCases, migrateMarkdownToCsv, renderMarkdown } from '../testcases/store.ts';

type Command = 'render' | 'migrate' | 'show';

interface Args {
  readonly command: Command | null;
  readonly id: number | null;
  readonly caseIds: readonly string[];
  readonly project: string | null;
  readonly json: boolean;
}

function parseArgs(argv: readonly string[]): Args {
  const [first, ...rest] = argv;
  const command = first === 'render' || first === 'migrate' || first === 'show' ? first : null;
  let id: number | null = null;
  const caseIds: string[] = [];
  let project: string | null = null;
  let json = false;

  for (let index = 0; index < rest.length; index++) {
    const arg = rest[index]!;
    if (arg === '--project') project = rest[++index] ?? null;
    else if (arg === '--json') json = true;
    else if (/^TC-\d+-\d+$/.test(arg)) caseIds.push(arg);
    else if (!arg.startsWith('--')) {
      const parsed = Number(arg);
      if (Number.isInteger(parsed) && parsed > 0) id = parsed;
    }
  }
  return { command, id, caseIds, project, json };
}

function printUsage(): void {
  console.log();
  console.log('Usage: node src/cli/test-cases.ts <render|migrate|show> <user-story-id> [TC-ID …] [--project <KEY>] [--json]');
  console.log();
  console.log('  render    Re-render test-cases.md from test-cases.csv (writes the Markdown only)');
  console.log('  migrate   Create test-cases.csv from a legacy Markdown-only artifact (once)');
  console.log('  show      Print cases from the CSV; optionally only the named Test Case IDs');
  console.log();
}

function printCase(record: TestCaseRecord): void {
  console.log('='.repeat(78));
  console.log(`${record.localId} — ${record.title}`);
  console.log('='.repeat(78));
  console.log(`Project / Module / Feature-Page  ${record.project} / ${record.module} / ${record.featurePage}`);
  console.log(`Test Type                        ${record.testType}`);
  console.log(`Requirement Reference            ${record.requirementReference}`);
  console.log(`Decisions Applied                ${record.decisionsApplied}`);
  console.log(`Azure DevOps ID                  ${record.adoId ?? '—'}`);
  console.log(`Review/Lifecycle Status          ${record.status}`);
  console.log(`Need Automation                  ${record.needAutomation ?? '(undecided)'}`);
  const list = (title: string, values: readonly string[]): void => {
    console.log();
    console.log(`${title}:`);
    if (values.length === 0) console.log('  (none)');
    for (const value of values) console.log(`  ${value}`);
  };
  list('Precondition', record.precondition);
  list('Test Data', record.testData);
  console.log();
  console.log('Steps:');
  for (const step of record.steps) {
    console.log(`  ${step.index}. ${step.action.replace(/\n/g, '\n     ')}`);
    console.log(`     Expected: ${step.expected.replace(/\n/g, '\n               ')}`);
  }
  list('Notes', record.notes);
  console.log();
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === null || args.id === null) {
    console.error('Error: a command and a User Story ID are required.');
    printUsage();
    return 2;
  }

  const storyId = args.id;
  const project = resolveActiveProject(args.project);
  // Status lines go to stderr in JSON mode so stdout stays parseable.
  const info = args.json ? console.error : console.log;
  info(describeActiveProject(project));

  if (args.command === 'migrate') {
    const result = migrateMarkdownToCsv(project.root, storyId);
    console.log(`Migrated ${result.cases} case(s): every case round-tripped through the CSV and the Markdown unchanged.`);
    console.log(`  wrote ${result.csvPath}`);
    console.log(`  re-rendered ${result.markdownPath} from the CSV (narrative kept verbatim)`);
    if (result.replacedRejectedText.length > 0) {
      console.log('  The empty "Rejected test cases" section now carries the standard text. It replaced:');
      for (const line of result.replacedRejectedText) console.log(`    ${line}`);
    }
    return 0;
  }

  if (args.command === 'render') {
    const count = renderMarkdown(project.root, storyId);
    console.log(`Rendered ${count} case(s) from the CSV into test-cases.md. The CSV was not modified.`);
    return 0;
  }

  // show
  const artifact = loadTestCases(project.root, storyId);
  const unknown = args.caseIds.filter((id) => !artifact.testCases.some((entry) => entry.localId === id));
  if (unknown.length > 0) {
    console.error(`Not in ${artifact.filePath}: ${unknown.join(', ')}`);
    return 2;
  }
  const selected =
    args.caseIds.length === 0 ? artifact.testCases : artifact.testCases.filter((entry) => args.caseIds.includes(entry.localId));

  // Recorded by an execution run, so its report can show whether the CSV changed since.
  const sha256 = createHash('sha256').update(readFileSync(artifact.filePath)).digest('hex');

  const sync = checkMarkdownSync(project.root, storyId);
  if (sync.problems.length > 0) {
    info(`Note: test-cases.md is out of date with the CSV (${sync.problems.length} difference(s)). Shown below is the CSV.`);
  }

  if (args.json) {
    console.log(JSON.stringify({ source: artifact.filePath, sha256, storyId, testCases: selected }, null, 2));
  } else {
    info(`Source: ${artifact.filePath} (${selected.length} of ${artifact.testCases.length} case(s))`);
    info(`sha256: ${sha256}`);
    info('');
    for (const record of selected) printCase(record);
  }
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
