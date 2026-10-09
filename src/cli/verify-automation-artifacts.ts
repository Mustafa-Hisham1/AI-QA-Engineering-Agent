/**
 * Verifies what automation writes: no typed secret reaches disk, the console,
 * or the HTML execution report's text; and every attachment the report holds is
 * an allowed, genuine file inside its own `attachments/` directory
 * (invariant 7, `docs/product-decisions.md` §7.1.1, §7.2, §7.2.1).
 *
 *   node src/cli/verify-automation-artifacts.ts
 *
 * Runs `src/automation/artifact-check/` — an offline, unauthenticated spec that
 * types sentinel values into a username and a password field; three of its
 * tests fail on purpose, one passes — under the real ARTIFACT_POLICY, fixtures
 * and reporters. Then:
 *
 * 1. Every test has its video in the report, every failure its screenshot, and
 *    the passing test no screenshot (screenshots stay failure-only).
 * 2. Every screenshot and video is genuinely a PNG / WebM, and the report's
 *    `attachments/` holds nothing else.
 * 3. The HTML references only `#anchors` and files inside `attachments/` that
 *    exist — and plays each test's video from there.
 * 4. Every file written, and the console output, is searched for the sentinels
 *    as UTF-8 and UTF-16LE bytes.
 *
 * What (4) cannot see: pixels. A screenshot shows a password field masked; a
 * VIDEO shows the UI as it ran, and STG videos are kept by explicit human
 * decision with that risk accepted (§7.2.1). Videos are verified for presence,
 * location and format, never blanked or deleted.
 *
 * Must pass before any credentialed automation runs, and again after any change
 * to the artifact policy, the fixtures, the report, or a Playwright upgrade.
 *
 * Exit codes:  0 = pass   1 = a leak or a disallowed attachment   2 = the check itself was invalid
 */

import { closeSync, existsSync, openSync, readdirSync, readFileSync, readSync, rmSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { ARTIFACT_CHECK_OUTPUT } from '../automation/artifact-policy.ts';
import { SENTINELS } from '../automation/artifact-check/sentinels.ts';
import { signatureOfBytes } from '../automation/reporting/build.ts';
import { runPlaywright } from '../automation/runner.ts';

const CONFIG = 'src/automation/artifact-check/playwright.config.ts';
const RUN_DIR = `${ARTIFACT_CHECK_OUTPUT}/reports/ARTIFACT-CHECK/RUN-001`;
const FAILING = ['TC-1-001', 'TC-1-002', 'TC-1-003'];
const PASSING = ['TC-1-004'];
const ALLOWED_ATTACHMENT = /^TC-1-\d{3}(-\d+)?\.(png|webm)$/;

function filesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

function posix(path: string): string {
  return path.replace(/\\/g, '/');
}

/** Which sentinels occur in `content`, in either common text encoding. */
function leaksIn(content: Buffer): string[] {
  return SENTINELS.filter(
    (sentinel) => content.includes(Buffer.from(sentinel, 'utf8')) || content.includes(Buffer.from(sentinel, 'utf16le')),
  );
}

function signatureOf(path: string): 'png' | 'webm' | null {
  const fd = openSync(path, 'r');
  try {
    const head = new Uint8Array(8);
    readSync(fd, head, 0, head.length, 0);
    return signatureOfBytes(head);
  } finally {
    closeSync(fd);
  }
}

function kindOf(name: string): string {
  if (name.endsWith('.webm')) return 'video, bytes scanned; pixels kept by decision §7.2.1';
  if (name.endsWith('.png')) return 'image, bytes scanned';
  return 'text';
}

/** Structural checks on the report's attachments and HTML references. */
function checkReport(problems: string[]): void {
  const attachments = join(RUN_DIR, 'attachments');
  const present = existsSync(attachments) ? readdirSync(attachments) : [];

  for (const id of [...FAILING, ...PASSING]) {
    if (!present.includes(`${id}.webm`)) problems.push(`${id}: no video in the report (attachments/${id}.webm)`);
  }
  for (const id of FAILING) {
    if (!present.includes(`${id}.png`)) problems.push(`${id}: no failure screenshot in the report (attachments/${id}.png)`);
  }
  for (const id of PASSING) {
    if (present.includes(`${id}.png`)) problems.push(`${id}: a PASSING test has a screenshot — screenshots are failure-only`);
  }

  for (const name of present) {
    if (!ALLOWED_ATTACHMENT.test(name)) {
      problems.push(`attachments/${name}: not an allowed attachment name`);
      continue;
    }
    const expected = name.endsWith('.png') ? 'png' : 'webm';
    if (signatureOf(join(attachments, name)) !== expected) problems.push(`attachments/${name}: content is not a genuine ${expected.toUpperCase()}`);
  }

  const html = readFileSync(join(RUN_DIR, 'execution-report.html'), 'utf8');
  for (const [, attribute, value] of html.matchAll(/\b(src|href)="([^"]*)"/g)) {
    if (value!.startsWith('#')) continue;
    const safe = /^attachments\/[A-Za-z0-9._-]+\.(png|webm)$/.test(value!) && existsSync(join(RUN_DIR, value!));
    if (!safe) problems.push(`execution-report.html: ${attribute}="${value}" points outside the run's attachments/`);
  }
  for (const id of [...FAILING, ...PASSING]) {
    if (!html.includes(`<video controls preload="metadata" src="attachments/${id}.webm">`)) {
      problems.push(`execution-report.html: no playable video for ${id}`);
    }
  }
}

async function main(): Promise<number> {
  // A stale file from an earlier run must not be mistaken for this run's output.
  rmSync(ARTIFACT_CHECK_OUTPUT, { recursive: true, force: true });

  const run = await runPlaywright(['test', '--config', CONFIG], undefined, true);

  // Three tests must FAIL (or their failure artifacts were never written) and one
  // must PASS (or a passing test's video was never exercised).
  if (!/\b3 failed\b/.test(run.output) || !/\b1 passed\b/.test(run.output)) {
    console.error('INVALID: the artifact-check spec did not produce 3 failures and 1 pass, so nothing was verified.');
    console.error(run.output);
    return 2;
  }

  const required = ['execution-report.html', 'execution-results.json', 'bug-candidates/BUG-001.md'];
  const missing = required.filter((file) => !existsSync(join(RUN_DIR, file)));
  if (missing.length > 0) {
    console.error(`INVALID: the execution report was not fully written (missing ${missing.join(', ')} in ${RUN_DIR}).`);
    console.error(run.output);
    return 2;
  }

  const findings: string[] = [];

  console.log('Report structure:');
  const problems: string[] = [];
  checkReport(problems);
  for (const problem of problems) console.log(`  FAIL   ${problem}`);
  if (problems.length === 0) {
    console.log('  ok     every test has its video; every failure its screenshot; the pass none');
    console.log('  ok     attachments/ holds only genuine PNG/WebM files named for their Test Case');
    console.log('  ok     the HTML references only files inside the run\'s attachments/, and plays each video');
  }
  findings.push(...problems);

  console.log();
  console.log('Files written, searched for the sentinel values:');
  for (const file of filesUnder(ARTIFACT_CHECK_OUTPUT)) {
    const leaked = leaksIn(readFileSync(file));
    const name = posix(relative(ARTIFACT_CHECK_OUTPUT, file));
    console.log(`  ${leaked.length > 0 ? 'LEAK ' : 'clean'}  ${name}  (${kindOf(name)})`);
    if (leaked.length > 0) findings.push(`${name}: ${leaked.length} sentinel value(s)`);
  }

  const consoleLeaks = leaksIn(Buffer.from(run.output, 'utf8'));
  console.log(`  ${consoleLeaks.length > 0 ? 'LEAK ' : 'clean'}  (console output of the run)`);
  if (consoleLeaks.length > 0) findings.push(`console output: ${consoleLeaks.length} sentinel value(s)`);

  console.log();
  if (findings.length > 0) {
    console.error('FAIL: do not run credentialed automation until this passes.');
    for (const finding of findings) console.error(`  ${finding}`);
    return 1;
  }

  console.log('PASS: no typed value in any text output, the console or the report; every attachment is allowed, genuine and in place.');
  return 0;
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(`Unexpected failure: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
