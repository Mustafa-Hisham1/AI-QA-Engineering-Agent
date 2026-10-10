/**
 * The Playwright `test` every generated spec imports (`docs/product-decisions.md`
 * §7.1). Project-agnostic: it knows the active project only through the
 * Playwright project the config created for it.
 *
 *   import { expect, test, testCaseDetails } from '../../../../src/automation/fixtures.ts';
 *
 * Fixtures:
 *   appEnv      the validated environment (label + base URL). Re-validated
 *               here, so a spec cannot run against an environment the config
 *               would have refused.
 *   account(H)  credentials for account handle H, in memory only.
 *   dataValue(H) the value of single-value handle H, in memory only.
 *
 *   endSessions (auto) logs out every application session the test opened —
 *               after a pass or a failure, after the failure screenshot is
 *               taken, never replacing the test's own result (sessions.ts).
 *
 * A handle whose variables are unset SKIPS the test as
 * `NOT RUN — TEST_DATA_UNAVAILABLE: <HANDLE>` — missing test data is never a
 * failure (§8, §9).
 */

import { test as base, type TestInfo } from '@playwright/test';

import { resolveActiveProject, type ActiveProject } from '../projects/active-project.ts';
import {
  AutomationConfigError,
  resolveAccountHandle,
  resolveAutomationEnvironment,
  resolveValueHandle,
  type AccountCredentials,
  type AutomationEnvironment,
} from './config.ts';
import { sanitizeError, sanitizeText, type SanitizableError } from './sanitizer.ts';
import { endSessions } from './sessions.ts';

export { expect } from '@playwright/test';
export { testCaseDetails } from './traceability.ts';

interface AutomationFixtures {
  appEnv: AutomationEnvironment;
  account: (handle: string) => AccountCredentials;
  dataValue: (handle: string) => string;
  redactErrorContext: void;
  endSessions: void;
}

/** The active project, as pinned by `playwright.config.ts` in the project metadata. */
function projectFor(testInfo: TestInfo): ActiveProject {
  const key = (testInfo.project.metadata as { projectKey?: unknown }).projectKey;
  if (typeof key !== 'string') {
    throw new Error('No active project in the Playwright project metadata. Run through playwright.config.ts.');
  }
  return resolveActiveProject(key);
}

function skipWhenUnavailable<T>(testInfo: TestInfo, handle: string, resolveHandle: () => T): T {
  try {
    return resolveHandle();
  } catch (error) {
    if (error instanceof AutomationConfigError && error.code === 'TEST_DATA_UNAVAILABLE') {
      testInfo.skip(true, `NOT RUN — TEST_DATA_UNAVAILABLE: ${handle}`);
    }
    throw error;
  }
}

export const test = base.extend<AutomationFixtures>({
  // Two verified leaks in a failing test's errors (Playwright 1.64):
  // - a failing locator assertion attaches an ARIA snapshot of its receiver,
  //   carrying input values, masked passwords included;
  // - a failing fill() prints its call log, which records fill("<value>").
  // Auto fixtures are torn down last, so this runs after the test and before
  // any reporter or error-context.md sees the errors. The message, call log and
  // screenshot are kept, minus the values.
  redactErrorContext: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, testInfo) => {
      await use();
      for (const error of testInfo.errors) sanitizeError(error as SanitizableError);
    },
    { auto: true },
  ],

  // Every session the test opened on its page is ended in teardown, passed or
  // failed, through the application's own session termination (§7.1.3).
  // Playwright captures the failure screenshot before any fixture is torn down,
  // so cleanup cannot disturb the evidence; teardown runs in its own time slot,
  // so it still happens after a test timed out. A failed logout is reported,
  // never thrown — it must not mask the test's result.
  endSessions: [
    async ({ page }, use, testInfo) => {
      await use();
      const caseId = testInfo.title.split(' ')[0];
      for (const result of await endSessions(page)) {
        const what = { 'logged-out': 'logged out', 'nothing-to-end': 'nothing to log out', failed: 'LOGOUT FAILED' }[result.outcome];
        const description = sanitizeText(`${result.label} (${result.when}): ${what} — ${result.detail}`);
        testInfo.annotations.push({ type: 'session-cleanup', description });
        // Handle labels and status codes only — never a username or a token.
        (result.outcome === 'failed' ? console.warn : console.log)(`[session-cleanup] ${caseId}: ${description}`);
      }
    },
    { auto: true, timeout: 60_000 },
  ],

  // Playwright requires the object-destructuring pattern for the first argument.
  // eslint-disable-next-line no-empty-pattern
  appEnv: async ({}, use, testInfo) => {
    await use(resolveAutomationEnvironment(projectFor(testInfo)));
  },

  // Depends on appEnv so no credential is ever resolved for a refused environment.
  account: async ({ appEnv }, use, testInfo) => {
    void appEnv;
    const project = projectFor(testInfo);
    await use((handle) => skipWhenUnavailable(testInfo, handle, () => resolveAccountHandle(project, handle)));
  },

  dataValue: async ({ appEnv }, use, testInfo) => {
    void appEnv;
    const project = projectFor(testInfo);
    await use((handle) => skipWhenUnavailable(testInfo, handle, () => resolveValueHandle(project, handle)));
  },
});
