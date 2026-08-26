/**
 * Publishes approved Test Cases from a local artifact to Azure DevOps as child
 * work items of their User Story.
 *
 *   node src/cli/publish-test-cases.ts 53717             # DRY RUN — writes nothing
 *   node src/cli/publish-test-cases.ts 53717 --confirm   # performs the writes
 *   node src/cli/publish-test-cases.ts 53717 --verify    # verify only, no writes
 *
 * SAFETY MODEL
 * ------------
 * - **Dry run is the default.** Nothing is written unless `--confirm` is passed,
 *   so the exact operation can be shown to a human first (invariant 2). The
 *   preview is built by the same code as the write, not a description of it.
 * - **Only `Approved` cases are published.** `Draft`, `AI-Reviewed`,
 *   `Needs-Changes` and `Rejected` are refused: the agent must never publish what
 *   a human has not approved (invariant 1).
 * - **Duplicates are prevented from Azure DevOps state, not local state.** Before
 *   writing, the existing children of the story are read and matched by title. A
 *   local file that lost an ID cannot cause a duplicate.
 * - **No write is ever retried** (invariant 4) — see ../ado/http-write.ts.
 * - **Each created ID is recorded locally before the next create is attempted**,
 *   so an interrupted run leaves an accurate artifact.
 *
 * Exit codes:  0 = success   1 = one or more failures   2 = configuration or artifact problem
 */

import { AdoReadClient, type ChildWorkItem, type ParentContext } from '../ado/client.ts';
import { loadConfig, loadWriteConfig } from '../ado/config.ts';
import { isAdoError, redact } from '../ado/errors.ts';
import { AdoWriteClient } from '../ado/write-client.ts';
import { ProjectError, describeActiveProject, resolveActiveProject } from '../projects/active-project.ts';
import { ArtifactError, artifactPathFor, parseArtifact, recordPublishedId } from '../testcases/artifact.ts';
import type { TestCaseRecord } from '../testcases/model.ts';

function log(line = ''): void {
  console.log(redact(line));
}

function fail(line = ''): void {
  console.error(redact(line));
}

interface Args {
  readonly id: number | null;
  readonly confirm: boolean;
  readonly verifyOnly: boolean;
  readonly limit: number | null;
  /** Active project key from --project, or null to resolve it another way. */
  readonly project: string | null;
}

function parseArgs(argv: readonly string[]): Args {
  let id: number | null = null;
  let confirm = false;
  let verifyOnly = false;
  let limit: number | null = null;
  let project: string | null = null;

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--confirm') confirm = true;
    else if (arg === '--verify') verifyOnly = true;
    else if (arg === '--project') {
      project = argv[++index] ?? null;
    } else if (arg === '--limit') {
      const parsed = Number(argv[++index]);
      if (Number.isInteger(parsed) && parsed > 0) limit = parsed;
    } else if (arg !== undefined && !arg.startsWith('--')) {
      const parsed = Number(arg);
      if (Number.isInteger(parsed) && parsed > 0) id = parsed;
    }
  }

  return { id, confirm, verifyOnly, limit, project };
}

function printUsage(): void {
  log();
  log('Usage: node src/cli/publish-test-cases.ts <user-story-id> [--project <KEY>] [--confirm] [--verify] [--limit <n>]');
  log();
  log('  <user-story-id>   User Story whose approved Test Cases are published, e.g. 53717');
  log('  --project <KEY>   Active project: a directory name under docs/projects.');
  log('                    Required when more than one project profile exists.');
  log('  (no flag)         DRY RUN — shows the exact operations and writes nothing');
  log('  --confirm         Perform the writes. Requires explicit human approval first.');
  log('  --verify          Verify published children against the artifact; writes nothing');
  log('  --limit <n>       Publish at most n cases this run (useful for a first single write)');
  log();
}

/** Normalises a title for duplicate matching: whitespace and case are not identity. */
function titleKey(title: string): string {
  return title.replace(/\s+/g, ' ').trim().toLowerCase();
}

interface Plan {
  readonly toPublish: readonly TestCaseRecord[];
  readonly alreadyPublished: readonly TestCaseRecord[];
  /** Approved locally, but a matching child already exists in Azure DevOps. */
  readonly existsRemotely: readonly { readonly testCase: TestCaseRecord; readonly child: ChildWorkItem }[];
  readonly notApproved: readonly TestCaseRecord[];
}

function buildPlan(testCases: readonly TestCaseRecord[], children: readonly ChildWorkItem[]): Plan {
  const byTitle = new Map(children.map((child) => [titleKey(child.title), child]));

  const toPublish: TestCaseRecord[] = [];
  const alreadyPublished: TestCaseRecord[] = [];
  const existsRemotely: { testCase: TestCaseRecord; child: ChildWorkItem }[] = [];
  const notApproved: TestCaseRecord[] = [];

  for (const testCase of testCases) {
    // An ID recorded locally is decisive: never create it again.
    if (testCase.adoId !== null) {
      alreadyPublished.push(testCase);
      continue;
    }

    if (testCase.status !== 'Approved') {
      notApproved.push(testCase);
      continue;
    }

    // No local ID, but Azure DevOps already has a child with this title. That
    // means a previous run created it and the artifact never recorded it —
    // publishing again would duplicate.
    const existing = byTitle.get(titleKey(testCase.title));
    if (existing) {
      existsRemotely.push({ testCase, child: existing });
      continue;
    }

    toPublish.push(testCase);
  }

  return { toPublish, alreadyPublished, existsRemotely, notApproved };
}

function printOperationPreview(
  client: AdoWriteClient,
  testCase: TestCaseRecord,
  parent: ParentContext,
): void {
  const operations = client.planCreateTestCase(testCase, {
    areaPath: parent.areaPath,
    iterationPath: parent.iterationPath,
    parentUrl: parent.apiUrl,
  });

  log(`  POST ${client.createTestCaseUrl()}`);
  log('  Content-Type: application/json-patch+json');
  log('  Body:');
  for (const line of JSON.stringify(operations, null, 2).split('\n')) {
    log(`    ${line}`);
  }
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));

  if (args.id === null) {
    fail('Error: a User Story ID is required.');
    printUsage();
    return 2;
  }

  const storyId = args.id;

  // Resolve the active project BEFORE anything is read or written. An ambiguous
  // project stops the run rather than defaulting to one (see active-project.ts).
  const project = resolveActiveProject(args.project);
  const artifactPath = artifactPathFor(project.root, storyId);

  // ---- Load the local artifact (no network yet) --------------------------
  const artifact = parseArtifact(artifactPath, storyId);

  log();
  log('='.repeat(78));
  log(`Publish Test Cases — User Story ${storyId}`);
  log('='.repeat(78));
  log();
  log(`Project           ${describeActiveProject(project)}`);
  log(`Artifact          ${artifactPath}`);
  log(`Test cases parsed ${artifact.testCases.length}`);
  if (artifact.contentFingerprint) {
    log(`Fingerprint       ${artifact.contentFingerprint}`);
  }

  // ---- Read Azure DevOps state (read-only path) -------------------------
  const readClient = new AdoReadClient(loadConfig());
  const parent = await readClient.readParentContext(storyId);
  const children = await readClient.getChildWorkItems(storyId);

  log();
  log(`Parent            ${parent.workItemType} ${parent.id} — ${parent.title}`);
  log(`Area path         ${parent.areaPath ?? '(none)'}`);
  log(`Iteration path    ${parent.iterationPath ?? '(none)'}`);
  log(`Existing children ${children.length}`);

  // Show what is already under the story. An existing Test Case with a different
  // title is exactly what a title-based duplicate guard cannot see, so it has to
  // be a human judgement, not a silent skip.
  if (children.length > 0) {
    log();
    log('Existing children of this User Story:');
    for (const child of children) {
      log(`  ${String(child.id).padEnd(8)} ${child.workItemType.padEnd(14)} ${child.title}`);
    }
  }

  const plan = buildPlan(artifact.testCases, children);

  log();
  log('Plan');
  log(`  to publish            ${plan.toPublish.length}`);
  log(`  already published     ${plan.alreadyPublished.length} (have a local Azure DevOps ID — skipped)`);
  log(`  exist in Azure DevOps ${plan.existsRemotely.length} (matched by title — skipped, no duplicate)`);
  log(`  not approved          ${plan.notApproved.length} (refused: only Approved cases are published)`);

  if (plan.notApproved.length > 0) {
    log();
    log('Not approved — these will NOT be published:');
    for (const testCase of plan.notApproved) {
      log(`  ${testCase.localId}  status=${testCase.status}`);
    }
  }

  if (plan.existsRemotely.length > 0) {
    log();
    log('Already in Azure DevOps by title — recording the existing ID instead of creating a duplicate:');
    for (const entry of plan.existsRemotely) {
      log(`  ${entry.testCase.localId} -> existing work item ${entry.child.id}`);
    }
  }

  // ---- Verify-only mode --------------------------------------------------
  if (args.verifyOnly) {
    return reportVerification(artifact.testCases, children, parent) ? 0 : 1;
  }

  // ---- Dry run (the default) --------------------------------------------
  if (!args.confirm) {
    log();
    log('-'.repeat(78));
    log('DRY RUN — nothing has been written to Azure DevOps.');
    log('-'.repeat(78));

    if (plan.toPublish.length === 0) {
      log();
      log('Nothing to publish.');
      return 0;
    }

    const sample = plan.toPublish[0]!;
    log();
    log(`Exact operation for the first case (${sample.localId}), as it would be sent:`);
    log();
    printOperationPreview(new AdoWriteClient(loadWriteConfig()), sample, parent);
    log();
    log(`The remaining ${plan.toPublish.length - 1} case(s) use the identical operation shape.`);
    log();
    log('Every case that would be created:');
    for (const testCase of plan.toPublish) {
      log(`  ${testCase.localId}  ${testCase.steps.length} step(s)  ${testCase.title}`);
    }
    log();
    log('Re-run with --confirm to perform these writes. Writes are never retried.');
    return 0;
  }

  // ---- Confirmed write --------------------------------------------------
  const writeClient = new AdoWriteClient(loadWriteConfig());

  const queue = args.limit === null ? plan.toPublish : plan.toPublish.slice(0, args.limit);

  log();
  log('-'.repeat(78));
  log(`WRITING to Azure DevOps — ${queue.length} Test Case(s). Writes are NOT retried.`);
  log('-'.repeat(78));
  log();

  // Cases Azure DevOps already has: record the existing ID locally rather than
  // creating a second copy. This is a local-file change, not an ADO write.
  for (const entry of plan.existsRemotely) {
    recordPublishedId(artifactPath, entry.testCase.localId, entry.child.id);
    log(`  = ${entry.testCase.localId}  reconciled to existing work item ${entry.child.id}`);
  }

  const created: { localId: string; adoId: number }[] = [];
  const failures: { localId: string; message: string; details: readonly string[] }[] = [];

  for (const testCase of queue) {
    try {
      const result = await writeClient.createTestCase(testCase, {
        areaPath: parent.areaPath,
        iterationPath: parent.iterationPath,
        parentUrl: parent.apiUrl,
      });

      // Record immediately, before the next create. An interruption here must
      // never leave a created item unrecorded.
      recordPublishedId(artifactPath, result.localId, result.adoId);

      created.push({ localId: result.localId, adoId: result.adoId });
      log(`  + ${testCase.localId}  ->  work item ${result.adoId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const details = isAdoError(error) ? [...error.details, ...(error.hint ? [error.hint] : [])] : [];

      failures.push({ localId: testCase.localId, message, details });
      fail(`  ! ${testCase.localId}  FAILED — not marked Published`);
      fail(`      ${message}`);
      for (const detail of details) fail(`      ${detail}`);

      // A credential or permission failure will hit every remaining case
      // identically. Continuing would produce 50 identical errors and obscure
      // the one that matters.
      if (isAdoError(error) && (error.code === 'AUTH_FAILED' || error.code === 'PERMISSION_DENIED')) {
        fail();
        fail('Stopping: this failure affects every remaining Test Case. Fix the credential and re-run —');
        fail('cases already created are recorded locally and will be skipped.');
        break;
      }
    }
  }

  log();
  log('-'.repeat(78));
  log(`Created ${created.length}, failed ${failures.length}, reconciled ${plan.existsRemotely.length}`);
  log('-'.repeat(78));

  // ---- Verify against Azure DevOps -------------------------------------
  log();
  log('Verifying against Azure DevOps...');
  const finalArtifact = parseArtifact(artifactPath, storyId);
  const finalChildren = await readClient.getChildWorkItems(storyId);
  const verified = reportVerification(finalArtifact.testCases, finalChildren, parent);

  return failures.length === 0 && verified ? 0 : 1;
}

/**
 * Checks every locally-published case against the parent's actual children.
 *
 * Verification reads Azure DevOps rather than trusting the local file: the point
 * is to catch a case the artifact calls Published that is not really there, or is
 * not really a child.
 */
function reportVerification(
  testCases: readonly TestCaseRecord[],
  children: readonly ChildWorkItem[],
  parent: ParentContext,
): boolean {
  const childById = new Map(children.map((child) => [child.id, child]));

  const published = testCases.filter((testCase) => testCase.adoId !== null);
  const unpublished = testCases.filter((testCase) => testCase.adoId === null);

  const problems: string[] = [];

  for (const testCase of published) {
    const child = childById.get(testCase.adoId!);

    if (!child) {
      problems.push(`${testCase.localId}: work item ${testCase.adoId} is NOT a child of ${parent.id}`);
      continue;
    }

    if (child.workItemType !== 'Test Case') {
      problems.push(`${testCase.localId}: work item ${testCase.adoId} is a "${child.workItemType}", not a Test Case`);
    }

    if (titleKey(child.title) !== titleKey(testCase.title)) {
      problems.push(
        `${testCase.localId}: title in Azure DevOps does not match the artifact\n` +
          `      artifact: ${testCase.title}\n` +
          `      ADO ${testCase.adoId}: ${child.title}`,
      );
    }

    // A matching title proves the item exists; only the step count proves the
    // steps document was actually stored.
    if (child.stepCount === null) {
      problems.push(`${testCase.localId}: work item ${testCase.adoId} carries NO steps field`);
    } else if (child.stepCount !== testCase.steps.length) {
      problems.push(
        `${testCase.localId}: work item ${testCase.adoId} has ${child.stepCount} step(s), the artifact has ${testCase.steps.length}`,
      );
    }
  }

  log();
  log(`  published locally      ${published.length}`);
  log(`  verified as children   ${published.length - problems.length}`);
  log(`  still unpublished      ${unpublished.length}`);

  if (unpublished.length > 0) {
    log();
    log('  Still unpublished:');
    for (const testCase of unpublished) {
      log(`    ${testCase.localId}  status=${testCase.status}`);
    }
  }

  if (problems.length > 0) {
    fail();
    fail('  VERIFICATION PROBLEMS:');
    for (const problem of problems) fail(`    ${problem}`);
    return false;
  }

  log();
  log('  Verification passed: every published Test Case exists as a child of the User Story,');
  log('  is of type Test Case, and its title and step count match the artifact.');
  return true;
}

try {
  process.exitCode = await main();
} catch (error) {
  fail();

  if (error instanceof ProjectError) {
    fail(`Active project problem: ${error.message}`);
    for (const detail of error.details) fail(`  ${detail}`);
    process.exitCode = 2;
  } else if (error instanceof ArtifactError) {
    fail(`Artifact problem: ${error.message}`);
    for (const detail of error.details) fail(`  ${detail}`);
    process.exitCode = 2;
  } else if (isAdoError(error)) {
    fail(`Azure DevOps error [${error.code}]: ${error.message}`);
    for (const detail of error.details) fail(`  ${detail}`);
    if (error.hint) fail(`  Hint: ${error.hint}`);
    process.exitCode = error.code === 'CONFIG_MISSING' || error.code === 'CONFIG_INVALID' ? 2 : 1;
  } else {
    fail(`Unexpected failure: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
