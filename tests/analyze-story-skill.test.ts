/**
 * Contract tests for the `/analyze-story` Skill and the analysis code behind it.
 *
 * The analysis itself is performed by the agent following SKILL.md, so these
 * tests pin what CAN be pinned:
 * - the tools the Skill is granted — no Azure DevOps write, no Test Case or Bug
 *   publishing, no automation, no screenshot, no arbitrary page script;
 * - the rules its text must keep stating — optional sources never block,
 *   conflicts become open questions, human decisions are never overwritten,
 *   observations never become requirements, no Test Cases are generated;
 * - the analysis code — read-only: it writes no file and cannot reach any
 *   Azure DevOps write path.
 */

import { ok } from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (relative: string): string => readFileSync(fileURLToPath(new URL(`../${relative}`, import.meta.url)), 'utf8');

const SKILL = read('.claude/skills/analyze-story/SKILL.md');
const ALLOWED_TOOLS = /^allowed-tools:\s*(.+)$/m.exec(SKILL)?.[1]?.split(',').map((tool) => tool.trim()) ?? [];

test('the Skill declares its granted tools', () => {
  ok(ALLOWED_TOOLS.length > 0);
  for (const required of ['Bash(npm run story:read:*)', 'Bash(npm run analysis:preflight:*)', 'Bash(npm run api:read:*)']) {
    ok(ALLOWED_TOOLS.includes(required), `${required} must be granted`);
  }
});

test('13. no Azure DevOps write, publish, automation or commit tool is granted', () => {
  const forbidden = /testcases:publish|bug:publish|automation:|testcases:check|git commit|git push|git add/;
  for (const tool of ALLOWED_TOOLS) ok(!forbidden.test(tool), `${tool} must not be granted to /analyze-story`);
  // The only Bash commands are the three read-only scripts and two read-only git commands.
  const bash = ALLOWED_TOOLS.filter((tool) => tool.startsWith('Bash('));
  ok(bash.every((tool) => /^Bash\((npm run (story:read|analysis:preflight|api:read)|git (diff|status)):\*\)$/.test(tool)), bash.join(', '));
});

test('UI exploration is granted only safe, in-session browser tools', () => {
  const browser = ALLOWED_TOOLS.filter((tool) => tool.startsWith('mcp__playwright__'));
  ok(browser.includes('mcp__playwright__browser_navigate'));
  for (const unsafe of ['browser_evaluate', 'browser_run_code_unsafe', 'browser_take_screenshot', 'browser_file_upload', 'browser_drag', 'browser_drop']) {
    ok(!browser.some((tool) => tool.endsWith(unsafe)), `${unsafe} must not be granted: it would persist evidence or bypass the rules`);
  }
});

const RULES: readonly [string, RegExp][] = [
  ['the User Story is the only mandatory source', /The User Story is the only mandatory source/],
  ['6. a missing optional source never blocks', /optional source that is missing or unusable never blocks the analysis/],
  ['API Source: Not provided is recorded', /API Source: Not provided/],
  ['7. UI Exploration: Not performed — <reason> is recorded', /UI Exploration: Not performed — <reason>/],
  ['UI exploration is opt-in', /Opt-in: without it, no browser starts/],
  ['8/9. conflicting sources become an open question', /When sources disagree, keep every side visible and ask/],
  ['8/9. the example shows [E], [API] and [UI] with a [?] question', /\[E\][^\n]*\n\[API\][^\n]*\n\[UI\][^\n]*\n\[\?\] OQ-/],
  ['10. decisions are never overwritten by API or UI evidence', /\*\*never overwritten\*\*/],
  ['10. decisions outrank the API specification and the observed UI', /the API specification, and the observed UI/],
  ['observations never become requirements', /An observation is current behaviour, never\s+a requirement/],
  ['API values are never invented', /never invent an endpoint, a field, a status code or a\s+rule/],
  ['the API specification is never copied into the repository', /The API specification is never copied into the repository/],
  ['12. no Test Cases are generated', /Do NOT generate Test Cases, automation code, or Bugs/],
  ['PROD is never explored', /\*\*Never PROD\.\*\*/],
  ['no snapshot or screenshot is persisted', /Persist no snapshot and no screenshot/],
  ['UI exploration does not change business data', /\*\*Read-only\.\*\*/],
  ['the existing fingerprint rule is unchanged', /\*\*Unchanged rule\.\*\*/],
  ['backward-compatible invocation', /behaves exactly as it always has/],
];

for (const [rule, pattern] of RULES) {
  test(`the Skill states: ${rule}`, () => {
    ok(pattern.test(SKILL), `SKILL.md no longer states: ${rule}`);
  });
}

const ANALYSIS_CODE = ['src/analysis/api-spec.ts', 'src/analysis/sources.ts', 'src/cli/analysis-preflight.ts', 'src/cli/api-read.ts'];

test('12/13. the analysis code is read-only: no file writes, no Azure DevOps write path, no Test Case write-back', () => {
  for (const path of ANALYSIS_CODE) {
    const source = read(path);
    for (const [what, pattern] of [
      ['a file write', /\b(writeFileSync|appendFileSync|copyFileSync|rmSync|unlinkSync|mkdirSync|renameSync|createWriteStream)\b/],
      ['the Azure DevOps write transport', /http-write|write-client|loadWriteConfig|AdoWriteClient/],
      ['Test Case write-back', /recordPublishedId|testcases\/artifact/],
      ['an Azure DevOps read client (the preflight needs none)', /ado\/client|AdoReadClient/],
    ] as const) {
      ok(!pattern.test(source), `${path} must not contain ${what}`);
    }
  }
});

test('10. the analysis code never touches decisions.md', () => {
  // `docs/product-decisions.md` (the method record) may be cited; a story's decisions.md may not be touched.
  for (const path of ANALYSIS_CODE) ok(!/(?<!product-)decisions\.md/.test(read(path)), `${path} must not reference decisions.md`);
});
