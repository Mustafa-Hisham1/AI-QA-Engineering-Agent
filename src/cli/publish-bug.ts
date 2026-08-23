/**
 * Publishes ONE human-reviewed Bug Candidate to Azure DevOps, then verifies it.
 *
 *   node src/cli/publish-bug.ts <input.json>             # DRY RUN + duplicate check
 *   node src/cli/publish-bug.ts <input.json> --confirm   # publish, then verify
 *   node src/cli/publish-bug.ts <input.json> --verify-only <id>   # re-verify an existing Bug
 *
 * Input schema: docs/bug-input.schema.md
 *
 * - **Dry run is the default.** Nothing is written unless `--confirm` is passed,
 *   and `--confirm` must never be passed without explicit human approval given
 *   immediately beforehand (invariant 2).
 * - **One Bug per invocation.** No batch mode: bugs are reviewed individually,
 *   and a loop is how duplicates get created by accident.
 * - **Duplicate checking is scoped to the owning User Story only**
 *   (`docs/product-decisions.md` §5.1).
 * - **Writes are never retried** (invariant 4).
 * - **Publishing does not end at a Bug ID.** The item is read back and verified;
 *   a verification failure is reported as PUBLISH_VERIFICATION_FAILED and never
 *   as success.
 */

import { readFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';
import { AdoReadClient } from '../ado/client.ts';
import { loadConfig, loadWriteConfig } from '../ado/config.ts';
import { isAdoError, redact } from '../ado/errors.ts';
import { AdoWriteClient } from '../ado/write-client.ts';
import { verifyBug, type BugCandidateRecord, type BugExpectation, type BugPlacement } from '../ado/bug.ts';

function log(message = ''): void {
  process.stdout.write(`${message}\n`);
}

function fail(message = ''): void {
  process.stderr.write(`${message}\n`);
}

/** Exit code used when the Bug exists but does not match what was intended. */
const PUBLISH_VERIFICATION_FAILED = 3;

interface Args {
  readonly inputPath: string;
  readonly confirm: boolean;
  readonly verifyOnly: number | null;
}

function parseArgs(argv: readonly string[]): Args | null {
  let inputPath: string | undefined;
  let confirm = false;
  let verifyOnly: number | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    if (arg === '--confirm') confirm = true;
    else if (arg === '--verify-only') {
      const value = Number(argv[index + 1]);
      if (Number.isInteger(value) && value > 0) {
        verifyOnly = value;
        index += 1;
      }
    } else if (!arg.startsWith('--')) inputPath ??= arg;
  }

  return inputPath ? { inputPath, confirm, verifyOnly } : null;
}

function usage(): void {
  log('Usage: node src/cli/publish-bug.ts <input.json> [--confirm] [--verify-only <bug-id>]');
  log();
  log('  Dry run by default — validates, checks for duplicates, prints the exact');
  log('  request, and writes nothing.');
  log('  --confirm            Publish, then verify. Requires explicit human approval first.');
  log('  --verify-only <id>   Verify an existing Bug against the input. Writes nothing.');
  log();
  log('  Input schema: docs/bug-input.schema.md');
}

interface BugInput {
  readonly bug: BugCandidateRecord;
  readonly placement: BugPlacement & { readonly priorityOverride?: string | null };
  readonly attachment?: { readonly path: string; readonly comment: string };
}

/**
 * Rejects an input that must not reach Azure DevOps.
 *
 * Every rule here exists because the alternative is a Bug that looks fine and is
 * wrong: filed under the wrong story, unassigned by accident, or carrying a
 * severity nobody approved.
 */
function validateInput(input: BugInput): string[] {
  const problems: string[] = [];
  const { bug, placement } = input;

  if (bug?.failureClassification !== 'PRODUCT_BUG') {
    problems.push(
      `failureClassification is "${bug?.failureClassification ?? '(missing)'}" — only PRODUCT_BUG may be published as a Bug.`,
    );
  }

  if (!bug?.title?.trim()) problems.push('bug.title is empty.');
  // The Description field carries this and nothing else, so an empty value would
  // publish a Bug whose first-read field is blank.
  if (!bug?.description?.trim()) {
    problems.push('bug.description is empty — it is the ONLY content of the Azure DevOps Description field.');
  }
  if (!bug?.expectedResult?.trim()) problems.push('bug.expectedResult is empty.');
  if (!bug?.actualResult?.trim()) problems.push('bug.actualResult is empty.');
  if (!bug?.steps?.length) problems.push('bug.steps is empty — a Bug nobody can reproduce is not worth filing.');

  if (!placement) {
    problems.push('placement is missing.');
    return problems;
  }

  if (placement.parentUserStoryId !== bug?.relatedUserStoryId) {
    problems.push(
      `placement.parentUserStoryId (${placement.parentUserStoryId}) does not match bug.relatedUserStoryId ` +
        `(${bug?.relatedUserStoryId}). The Bug must be filed under the User Story that owns the Test Case.`,
    );
  }

  if (!placement.severity?.trim()) {
    problems.push(
      'placement.severity is empty. Severity is required on Bug with no template default, and must be the value the human approved for THIS bug.',
    );
  }

  // `null` is a valid, deliberate choice; `undefined` means nobody decided.
  if (placement.assignedTo === undefined) {
    problems.push(
      'placement.assignedTo is absent. It must be the assignee the human approved for THIS bug, or an explicit null to publish unassigned. It is never inherited from a previous bug.',
    );
  }

  if (input.attachment && !existsSync(input.attachment.path)) {
    problems.push(`attachment.path does not exist: ${input.attachment.path}`);
  }

  return problems;
}

/**
 * Lists Bugs already under the owning User Story.
 *
 * SCOPE IS DELIBERATE (`docs/product-decisions.md` §5.1): only children of this
 * story. No parent traversal, no area path, no project-wide search. A Bug under
 * a different story is out of scope for this workflow by human decision.
 */
async function findDuplicatesInStory(
  read: AdoReadClient,
  userStoryId: number,
  title: string,
): Promise<{ readonly bugs: readonly { id: number; title: string }[]; readonly likely: readonly { id: number; title: string }[] }> {
  const children = await read.getChildWorkItems(userStoryId);
  const bugs = children
    .filter((child) => child.workItemType === 'Bug')
    .map((child) => ({ id: child.id, title: child.title }));

  const key = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, ' ');
  const likely = bugs.filter((bug) => key(bug.title) === key(title));

  return { bugs, likely };
}

/** Reads the Bug back and checks it against what was intended. */
async function runVerification(
  read: AdoReadClient,
  bugId: number,
  expectation: BugExpectation,
): Promise<boolean> {
  log();
  log('Verifying the Bug against Azure DevOps...');

  const actual = await read.readBug(bugId);
  const result = verifyBug(actual, expectation);

  log(`  id            ${actual.id}`);
  log(`  type          ${actual.workItemType}`);
  log(`  title         ${actual.title}`);
  log(`  state         ${actual.state}`);
  log(`  assignedTo    ${actual.assignedToUniqueName ?? '(unassigned)'}`);
  log(`  severity      ${actual.severity ?? '(not set)'}`);
  log(`  priority      ${actual.priority ?? '(not set)'}${expectation.priorityOverride === null ? '  (template default)' : '  (explicit override)'}`);
  log(`  description   ${actual.hasDescription ? 'present' : 'EMPTY'}`);
  log(`  reproSteps    ${actual.hasReproSteps ? 'present' : 'EMPTY'}`);
  log(`  systemInfo    ${actual.hasSystemInfo ? 'present' : 'EMPTY'}`);

  // A relation naming a file proves a link exists, not that the bytes are
  // retrievable. Only a download proves the attachment really landed.
  let attachmentBytes: number | null = null;
  if (expectation.attachmentFileName) {
    const relation = actual.relations.find(
      (r) => r.rel === 'AttachedFile' && r.fileName === expectation.attachmentFileName,
    );
    if (relation) {
      try {
        attachmentBytes = await read.fetchAttachmentSize(relation.url);
        log(`  attachment    ${relation.fileName} (${attachmentBytes} bytes, downloaded)`);
      } catch (error) {
        log(`  attachment    ${relation.fileName} — RELATION EXISTS BUT DOWNLOAD FAILED`);
        fail(`    ${redact(error instanceof Error ? error.message : String(error))}`);
        attachmentBytes = -1;
      }
    }
  }

  const downloadFailed = attachmentBytes === -1 || attachmentBytes === 0;

  if (result.ok && !downloadFailed) {
    log();
    log(`  Verification PASSED — ${result.checksRun} checks.`);
    return true;
  }

  fail();
  fail('  PUBLISH_VERIFICATION_FAILED');
  for (const problem of result.problems) {
    fail(`    ${problem.check}`);
    fail(`      expected: ${problem.expected}`);
    fail(`      actual  : ${problem.actual}`);
  }
  if (downloadFailed) {
    fail('    attachment bytes');
    fail(`      expected: a downloadable, non-empty file`);
    fail(`      actual  : ${attachmentBytes === -1 ? 'download failed' : 'empty file'}`);
  }
  fail();
  fail(`  The Bug EXISTS as #${bugId}. It was NOT deleted and NO second Bug was created.`);
  fail('  Investigate and fix that item by hand — do not re-run --confirm, which would duplicate it.');
  return false;
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    usage();
    return 2;
  }

  const input = JSON.parse(readFileSync(args.inputPath, 'utf8')) as BugInput;

  const problems = validateInput(input);
  if (problems.length > 0) {
    fail('INPUT REJECTED — nothing was read from or written to Azure DevOps.');
    fail();
    for (const problem of problems) fail(`  - ${problem}`);
    fail();
    fail('  See docs/bug-input.schema.md');
    return 2;
  }

  const { bug, placement } = input;
  const priorityOverride = placement.priorityOverride ?? null;

  const expectation: BugExpectation = {
    title: bug.title,
    parentUserStoryId: placement.parentUserStoryId,
    relatedTestCaseAdoId: bug.relatedTestCaseAdoId,
    assignedTo: placement.assignedTo,
    severity: placement.severity,
    priorityOverride,
    attachmentFileName: input.attachment ? basename(input.attachment.path) : null,
  };

  const read = new AdoReadClient(loadConfig());

  // --verify-only re-checks an existing item and writes nothing.
  if (args.verifyOnly !== null) {
    log(`Verify-only: Bug #${args.verifyOnly} against ${args.inputPath}`);
    const ok = await runVerification(read, args.verifyOnly, expectation);
    return ok ? 0 : PUBLISH_VERIFICATION_FAILED;
  }

  const write = new AdoWriteClient(loadWriteConfig());
  const operations = write.planCreateBug(bug, placement);

  log('='.repeat(72));
  log('PUBLISH BUG — ' + (args.confirm ? 'LIVE WRITE' : 'DRY RUN (nothing will be written)'));
  log('='.repeat(72));
  log(`Organization : ${write.organizationName}`);
  log(`Project      : ${write.projectName}`);
  log(`User Story   : ${placement.parentUserStoryId} (owns Test Case ${bug.relatedTestCaseLocalId})`);
  log();

  // Duplicate check comes BEFORE the payload preview: if a duplicate exists the
  // operator should never see a create they are not going to perform.
  log(`Duplicate check — scope: children of User Story ${placement.parentUserStoryId} ONLY`);
  const { bugs, likely } = await findDuplicatesInStory(read, placement.parentUserStoryId, bug.title);
  log(`  existing Bugs under this story: ${bugs.length}`);
  for (const existing of bugs) log(`    [${existing.id}] ${existing.title}`);

  if (likely.length > 0) {
    fail();
    fail('DUPLICATE FOUND — nothing was written.');
    for (const existing of likely) fail(`  [${existing.id}] ${existing.title}`);
    fail();
    fail('  A Bug with this title already exists under this User Story.');
    fail('  Report it, link to it, or update it. Do NOT create a second one.');
    return 1;
  }
  log('  no title match — safe to create.');
  log();

  log(`POST         : ${write.createBugUrl()}`);
  log('Content-Type : application/json-patch+json');
  log();
  log('Field mapping (Description / Repro Steps / System Info are DISJOINT):');
  log('  Description : Description');
  log('  Repro Steps : Preconditions, Steps to Reproduce, Expected Result, Actual Result,');
  log('                Requirement Reference, Related Test Case');
  log('  System Info : Environment, Failure Classification, Evidence');
  log();
  log('Field operations:');
  log(JSON.stringify(operations, null, 2));
  log();
  log('Then a SECOND request (PATCH) adds relations:');
  log(`  parent   -> User Story #${placement.parentUserStoryId}`);
  log(`  related  -> Test Case  #${bug.relatedTestCaseAdoId} (${bug.relatedTestCaseLocalId})`);
  if (input.attachment) log(`  attached -> ${basename(input.attachment.path)}`);
  log();
  log(`Severity     : ${placement.severity}   (human-approved for THIS bug)`);
  log(`Assignee     : ${placement.assignedTo ?? '(deliberately unassigned)'}   (human-approved for THIS bug)`);
  log(
    priorityOverride === null
      ? 'Priority     : NOT written — the Azure DevOps template default applies.'
      : `Priority     : ${priorityOverride}   (explicit human override)`,
  );
  log();

  if (!args.confirm) {
    log('DRY RUN — nothing was written.');
    log('Re-run with --confirm to publish. Writes are never retried.');
    return 0;
  }

  // ---- from here on, everything is irreversible ----

  let attachmentUrl: string | null = null;
  let attachmentComment = '';

  if (input.attachment) {
    const fileName = basename(input.attachment.path);
    const bytes = new Uint8Array(readFileSync(input.attachment.path));
    log(`Uploading attachment "${fileName}" (${bytes.byteLength} bytes)...`);
    attachmentUrl = await write.uploadAttachment(fileName, bytes);
    attachmentComment = input.attachment.comment;
    log('  uploaded.');
    log();
  }

  log('Creating the Bug...');
  const created = await write.createBug(bug, placement, attachmentUrl, attachmentComment);

  log();
  log(`CREATED Bug #${created.adoId}`);
  if (created.htmlUrl) log(`  ${created.htmlUrl}`);

  if (!created.linked) {
    fail();
    fail('PUBLISH_VERIFICATION_FAILED — the Bug was created but its relations could NOT be applied.');
    fail(`  reason: ${redact(created.linkError ?? 'unknown')}`);
    fail(`  The Bug EXISTS as #${created.adoId}. Do NOT re-run --confirm — that would duplicate it.`);
    return PUBLISH_VERIFICATION_FAILED;
  }

  const ok = await runVerification(read, created.adoId, expectation);

  if (!ok) return PUBLISH_VERIFICATION_FAILED;

  log();
  log(`Published and verified: Bug #${created.adoId}`);
  log(`  record this ID in the Bug Candidate and set its status to Published.`);
  return 0;
}

try {
  process.exitCode = await main();
} catch (error) {
  process.exitCode = 1;
  // Every message is redacted before printing: error bodies can echo the
  // credential back (invariant 7).
  const message = error instanceof Error ? error.message : String(error);
  fail(redact(message));

  if (isAdoError(error)) {
    for (const detail of error.details) fail(`  ${redact(detail)}`);
    if (error.hint) fail(`  hint: ${redact(error.hint)}`);
  }
}
