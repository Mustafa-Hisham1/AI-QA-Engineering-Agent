# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: artifact-check.spec.ts >> TC-1-001 — element never appears (page snapshot path)
- Location: src\automation\artifact-check\artifact-check.spec.ts:46:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('This text is never rendered')
Expected: visible
Timeout: 1000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('This text is never rendered') with timeout 1000ms
  - waiting for getByText('This text is never rendered')

```

# Test source

```ts
  1  | /**
  2  |  * Deliberately FAILING spec for `npm run automation:verify-artifacts`.
  3  |  *
  4  |  * Unauthenticated and offline: the page is local content (`setContent`), so no
  5  |  * environment, URL or credential is involved. It types sentinel values into a
  6  |  * username field and a password field — the way a login test would — then fails
  7  |  * an assertion, so Playwright writes everything it writes on a real failure.
  8  |  */
  9  | 
  10 | import type { Page } from '@playwright/test';
  11 | 
  12 | // The REAL fixtures, so the check covers the redaction layer real specs get.
  13 | import { expect, test, testCaseDetails } from '../fixtures.ts';
  14 | 
  15 | import { SENTINEL_PASSWORD, SENTINEL_USERNAME } from './sentinels.ts';
  16 | 
  17 | const LOGIN_FORM = `
  18 |   <main>
  19 |     <h1>Artifact check</h1>
  20 |     <label>Username <input name="username" autocomplete="off"></label>
  21 |     <label>Password <input name="password" type="password" autocomplete="off"></label>
  22 |     <button type="button">Login</button>
  23 |   </main>`;
  24 | 
  25 | async function enterCredentials(page: Page): Promise<void> {
  26 |   await page.setContent(LOGIN_FORM);
  27 |   await test.step('Step 1: Enter the credentials', async () => {
  28 |     await page.getByLabel('Username').fill(SENTINEL_USERNAME);
  29 |     await page.getByLabel('Password').fill(SENTINEL_PASSWORD);
  30 |   });
  31 | }
  32 | 
  33 | // Three failure shapes and one pass. Playwright captures page state on two paths — a
  34 | // whole-page snapshot after any failure, and a snapshot of the matcher's
  35 | // receiver when a locator assertion fails — and a failing action prints its call
  36 | // log, which records fill("<value>"). The three must fail; none may leak. Each traces
  37 | // to a synthetic Test Case (projects/ARTIFACT-CHECK) so the HTML report and its
  38 | // Bug Candidates are generated — and scanned — exactly as for a real run.
  39 | //
  40 | // NOT exercised here, because nothing can make it safe: `toMatchAriaSnapshot`
  41 | // on a container holding a credential field prints the typed value in the
  42 | // failure MESSAGE (verified 2026-10-09, Playwright 1.64). Automation code may
  43 | // not use ARIA-snapshot APIs at all — tests/automation-code-safety.test.ts
  44 | // enforces that.
  45 | 
  46 | test('TC-1-001 — element never appears (page snapshot path)', testCaseDetails({ testCaseId: 'TC-1-001', storyId: 1 }), async ({ page }) => {
  47 |   await enterCredentials(page);
  48 |   await test.step('Step 2: Submit and expect a page that never appears', async () => {
  49 |     await page.getByRole('button', { name: 'Login' }).click();
> 50 |     await expect(page.getByText('This text is never rendered')).toBeVisible({ timeout: 1_000 });
     |                                                                 ^ Error: expect(locator).toBeVisible() failed
  51 |   });
  52 | });
  53 | 
  54 | test('TC-1-002 — a fill that cannot complete (action call log path)', testCaseDetails({ testCaseId: 'TC-1-002', storyId: 1 }), async ({ page }) => {
  55 |   // Playwright's call log records fill("<value>"), and a failing action prints
  56 |   // its call log in the error message.
  57 |   await page.setContent(`${LOGIN_FORM}<label>Locked <input name="locked" type="password" disabled></label>`);
  58 |   await test.step('Step 1: Enter the password into a field that never becomes editable', async () => {
  59 |     await page.getByLabel('Locked').fill(SENTINEL_PASSWORD, { timeout: 1_000 });
  60 |   });
  61 | });
  62 | 
  63 | test('TC-1-003 — text assertion on the form container (receiver path)', testCaseDetails({ testCaseId: 'TC-1-003', storyId: 1 }), async ({ page }) => {
  64 |   await enterCredentials(page);
  65 |   await test.step('Step 2: Expect text the form never shows', async () => {
  66 |     await expect(page.locator('main')).toHaveText('This text is never rendered', { timeout: 1_000 });
  67 |   });
  68 | });
  69 | test('TC-1-004 — a passing login form test (video on PASS)', testCaseDetails({ testCaseId: 'TC-1-004', storyId: 1 }), async ({ page }) => {
  70 |   // Passes on purpose: video is recorded for every outcome (§7.2.1), so the check
  71 |   // must prove a passing test's video reaches the report too — and that typing
  72 |   // credentials in a passing test leaks nothing into the report's text.
  73 |   await enterCredentials(page);
  74 |   await test.step('Step 2: Confirm the login form is shown', async () => {
  75 |     await expect(page.getByRole('heading', { name: 'Artifact check' })).toBeVisible();
  76 |   });
  77 | });
  78 | 
```