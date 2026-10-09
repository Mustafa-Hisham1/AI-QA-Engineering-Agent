/**
 * Enforces the automation code-safety rules (src/automation/code-safety.ts) on
 * every file under `automation/`, and tests the rules themselves.
 *
 * The repository scan is what makes the rules binding: a generated spec that
 * uses an ARIA snapshot, re-enables tracing, saves a session, reads
 * process.env, or bypasses the project fixtures fails `npm test`.
 */

import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { findCodeSafetyViolations } from '../src/automation/code-safety.ts';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const AUTOMATION_ROOT = join(REPO_ROOT, 'automation');

function tsFilesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? tsFilesUnder(path) : path.endsWith('.ts') ? [path] : [];
  });
}

const COMPLIANT_SPEC = `
import { expect, test, testCaseDetails } from '../../../../src/automation/fixtures.ts';
import { LoginPage } from '../pages/LoginPage.ts';

test('TC-99001-002 — Verify a valid user can sign in', testCaseDetails({ testCaseId: 'TC-99001-002', storyId: 99001 }), async ({ page, account }) => {
  const credentials = account('PRIMARY_VALID');
  await test.step('Step 1: Enter the credentials', async () => {
    await new LoginPage(page).login(credentials);
  });
  await test.step('Step 2: Click Login', async () => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});
`;

test('a spec written to the conventions has no violations', () => {
  deepStrictEqual(findCodeSafetyViolations('spec.ts', COMPLIANT_SPEC), []);
});

test('page objects may import Playwright types', () => {
  deepStrictEqual(findCodeSafetyViolations('LoginPage.ts', "import type { Locator, Page } from '@playwright/test';"), []);
});

const FORBIDDEN: readonly [string, string][] = [
  ["await expect(page.locator('form')).toMatchAriaSnapshot('- textbox');", 'ARIA snapshots'],
  ["const tree = await page.locator('main').ariaSnapshot();", 'ARIA snapshots'],
  ["test.use({ trace: 'on' });", 'artifact policy'],
  ["test.use({ video: 'retain-on-failure' });", 'artifact policy'],
  ['await context.tracing.start({ snapshots: true });', 'Tracing'],
  ["await context.storageState({ path: 'auth.json' });", 'Saved sessions'],
  ['const password = process.env.ADMIN_VALID_PASSWORD;', 'environment is read only'],
  ["import { test, expect } from '@playwright/test';", 'fixtures.ts'],
  ["import { expect } from \"@playwright/test\";", 'fixtures.ts'],
];

for (const [line, rule] of FORBIDDEN) {
  test(`forbidden: ${line}`, () => {
    const violations = findCodeSafetyViolations('spec.ts', line);

    strictEqual(violations.length, 1, `expected exactly one violation for: ${line}`);
    ok(violations[0]!.rule.includes(rule), `"${violations[0]!.rule}" should mention "${rule}"`);
  });
}

test('comments explaining a rule do not trip it', () => {
  const source = [
    '// toMatchAriaSnapshot is forbidden here: it prints passwords.',
    '/* never set trace: on, never read process.env */',
    "await page.getByRole('button', { name: 'Login' }).click(); // not storageState",
  ].join('\n');

  deepStrictEqual(findCodeSafetyViolations('spec.ts', source), []);
});

test('violations report the line they are on', () => {
  const [violation] = findCodeSafetyViolations('spec.ts', "const a = 1;\nconst b = process.env.X;");

  strictEqual(violation!.line, 2);
});

test('every file under automation/ satisfies the code-safety rules', () => {
  const violations = tsFilesUnder(AUTOMATION_ROOT).flatMap((path) =>
    findCodeSafetyViolations(relative(REPO_ROOT, path).replace(/\\/g, '/'), readFileSync(path, 'utf8')),
  );

  ok(
    violations.length === 0,
    `automation code breaks a safety rule:\n${violations.map((v) => `  ${v.path}:${v.line}  ${v.rule}`).join('\n')}`,
  );
});
