/**
 * The ONE Playwright configuration for this repository
 * (`docs/product-decisions.md` §7.1). There is no per-project config: the
 * active project selects which project's specs this config runs.
 *
 * - The active project is resolved exactly as everywhere else — explicit
 *   `QA_ACTIVE_PROJECT`, or the sole project. Ambiguity stops the run here,
 *   before discovery. Use `npm run automation:list|test -- --project <KEY>`.
 * - Exactly one Playwright project is defined, named after the active project,
 *   with its specs under `automation/<KEY>/`.
 * - The environment guard (label, allow-list, PROD block) runs in globalSetup,
 *   before any test, so discovery needs no environment but execution does.
 * - Artifacts follow ARTIFACT_POLICY: failure screenshots, a video of every
 *   test (§7.2.1), no trace, no Playwright HTML report — all under the
 *   gitignored `.artifacts/`.
 */

import { defineConfig, devices } from '@playwright/test';

import { ARTIFACT_POLICY, EXECUTION_REPORTER, OUTPUT_ROOT, REPORTER } from './src/automation/artifact-policy.ts';
import { AutomationConfigError, automationEnv, resolveAutomationEnvironment, suppressPageSnapshots } from './src/automation/config.ts';
import { resolveActiveProject } from './src/projects/active-project.ts';

automationEnv();
suppressPageSnapshots();
const project = resolveActiveProject();

/** Base URL when the environment is valid; globalSetup refuses the run otherwise. */
function baseUrl(): string | undefined {
  try {
    return resolveAutomationEnvironment(project).baseUrl;
  } catch (error) {
    if (error instanceof AutomationConfigError) return undefined;
    throw error;
  }
}

export default defineConfig({
  testDir: `automation/${project.key}`,
  testMatch: '**/*.spec.ts',
  outputDir: `${OUTPUT_ROOT}/${project.key}`,
  // Console output for debugging, plus the QA execution report (one per run).
  reporter: [[REPORTER], [EXECUTION_REPORTER, { projectKey: project.key }]],
  globalSetup: './src/automation/global-setup.ts',

  // Test Cases are independently executable, but they share finite accounts
  // and server-side state (lockout counters, unique records). Serial by default.
  fullyParallel: false,
  workers: 1,
  // A retry would hide a flaky result behind a green one; classification needs
  // to see the first failure (§9).
  retries: 0,
  forbidOnly: true,

  use: { ...ARTIFACT_POLICY, baseURL: baseUrl() },

  projects: [
    {
      name: project.key,
      metadata: { projectKey: project.key },
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
