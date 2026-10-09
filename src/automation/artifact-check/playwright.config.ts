/**
 * Configuration for the artifact check only. It uses the SAME artifact policy,
 * reporters and fixtures as the real `playwright.config.ts`, so the check
 * verifies what real runs actually write — including the HTML execution
 * report and its Bug Candidates. No environment, no baseURL.
 *
 * The report needs a project and a Test Case artifact to trace to; it gets a
 * synthetic one (`projects/ARTIFACT-CHECK`), never a real project's.
 */

import { defineConfig, devices } from '@playwright/test';

import { ARTIFACT_CHECK_OUTPUT, ARTIFACT_POLICY, EXECUTION_REPORTER, REPORTER } from '../artifact-policy.ts';
import { suppressPageSnapshots } from '../config.ts';

suppressPageSnapshots();

/** Relative to the repository root, where the check runs. */
const CHECK_PROJECTS_ROOT = 'src/automation/artifact-check/projects';
const CHECK_PROJECT_KEY = 'ARTIFACT-CHECK';

export default defineConfig({
  testDir: '.',
  testMatch: 'artifact-check.spec.ts',
  outputDir: `../../../${ARTIFACT_CHECK_OUTPUT}/test-results`,
  reporter: [
    [REPORTER],
    [EXECUTION_REPORTER, { projectKey: CHECK_PROJECT_KEY, projectsRoot: CHECK_PROJECTS_ROOT, outputRoot: `${ARTIFACT_CHECK_OUTPUT}/reports` }],
  ],
  workers: 1,
  retries: 0,
  use: { ...ARTIFACT_POLICY, ...devices['Desktop Chrome'] },
});
