/**
 * Deliberately FAILING spec for `npm run automation:verify-artifacts`.
 *
 * Unauthenticated and offline: the page is local content (`setContent`), so no
 * environment, URL or credential is involved. It types sentinel values into a
 * username field and a password field — the way a login test would — then fails
 * an assertion, so Playwright writes everything it writes on a real failure.
 */

import type { Page } from '@playwright/test';

// The REAL fixtures, so the check covers the redaction layer real specs get.
import { expect, test, testCaseDetails } from '../fixtures.ts';

import { SENTINEL_PASSWORD, SENTINEL_USERNAME } from './sentinels.ts';

const LOGIN_FORM = `
  <main>
    <h1>Artifact check</h1>
    <label>Username <input name="username" autocomplete="off"></label>
    <label>Password <input name="password" type="password" autocomplete="off"></label>
    <button type="button">Login</button>
  </main>`;

async function enterCredentials(page: Page): Promise<void> {
  await page.setContent(LOGIN_FORM);
  await test.step('Step 1: Enter the credentials', async () => {
    await page.getByLabel('Username').fill(SENTINEL_USERNAME);
    await page.getByLabel('Password').fill(SENTINEL_PASSWORD);
  });
}

// Three failure shapes and one pass. Playwright captures page state on two paths — a
// whole-page snapshot after any failure, and a snapshot of the matcher's
// receiver when a locator assertion fails — and a failing action prints its call
// log, which records fill("<value>"). The three must fail; none may leak. Each traces
// to a synthetic Test Case (projects/ARTIFACT-CHECK) so the HTML report and its
// Bug Candidates are generated — and scanned — exactly as for a real run.
//
// NOT exercised here, because nothing can make it safe: `toMatchAriaSnapshot`
// on a container holding a credential field prints the typed value in the
// failure MESSAGE (verified 2026-10-09, Playwright 1.64). Automation code may
// not use ARIA-snapshot APIs at all — tests/automation-code-safety.test.ts
// enforces that.

test('TC-1-001 — element never appears (page snapshot path)', testCaseDetails({ testCaseId: 'TC-1-001', storyId: 1 }), async ({ page }) => {
  await enterCredentials(page);
  await test.step('Step 2: Submit and expect a page that never appears', async () => {
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('This text is never rendered')).toBeVisible({ timeout: 1_000 });
  });
});

test('TC-1-002 — a fill that cannot complete (action call log path)', testCaseDetails({ testCaseId: 'TC-1-002', storyId: 1 }), async ({ page }) => {
  // Playwright's call log records fill("<value>"), and a failing action prints
  // its call log in the error message.
  await page.setContent(`${LOGIN_FORM}<label>Locked <input name="locked" type="password" disabled></label>`);
  await test.step('Step 1: Enter the password into a field that never becomes editable', async () => {
    await page.getByLabel('Locked').fill(SENTINEL_PASSWORD, { timeout: 1_000 });
  });
});

test('TC-1-003 — text assertion on the form container (receiver path)', testCaseDetails({ testCaseId: 'TC-1-003', storyId: 1 }), async ({ page }) => {
  await enterCredentials(page);
  await test.step('Step 2: Expect text the form never shows', async () => {
    await expect(page.locator('main')).toHaveText('This text is never rendered', { timeout: 1_000 });
  });
});
test('TC-1-004 — a passing login form test (video on PASS)', testCaseDetails({ testCaseId: 'TC-1-004', storyId: 1 }), async ({ page }) => {
  // Passes on purpose: video is recorded for every outcome (§7.2.1), so the check
  // must prove a passing test's video reaches the report too — and that typing
  // credentials in a passing test leaks nothing into the report's text.
  await enterCredentials(page);
  await test.step('Step 2: Confirm the login form is shown', async () => {
    await expect(page.getByRole('heading', { name: 'Artifact check' })).toBeVisible();
  });
});
