/**
 * Runs once before any test executes, and refuses the run unless the
 * environment is allowed (invariant 5, `docs/product-decisions.md` §7.1).
 *
 * The guard lives here rather than in `playwright.config.ts` so that test
 * discovery (`--list`) works without an environment, while every real run —
 * including a bare `npx playwright test` that bypasses the npm scripts — is
 * still checked before a browser starts.
 */

import type { FullConfig } from '@playwright/test';

import { resolveActiveProject } from '../projects/active-project.ts';
import { resolveAutomationEnvironment } from './config.ts';

export default function globalSetup(config: FullConfig): void {
  const key = (config.projects[0]?.metadata as { projectKey?: unknown } | undefined)?.projectKey;
  if (typeof key !== 'string') {
    throw new Error('No active project in the Playwright config. Refusing to run.');
  }

  const environment = resolveAutomationEnvironment(resolveActiveProject(key));
  console.log(`Automation target: ${environment.projectKey} — ${environment.label} — ${environment.host}`);
}
