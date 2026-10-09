/**
 * What Playwright may write to disk during automation (invariant 7,
 * `docs/product-decisions.md` §10.1 and §7.1).
 *
 * One definition, imported by `playwright.config.ts` AND by the artifact check
 * (`npm run automation:verify-artifacts`), so the check always verifies the
 * policy that real runs use — never a copy of it.
 *
 * - **Screenshots on failure only** — rendered pixels, where a password field
 *   shows masked. The evidence format the canary established.
 * - **No trace.** A trace records every action with its arguments and DOM
 *   snapshots carrying input values (verified 2026-10-09).
 * - **Video for every test — pass, fail, or skipped after it started.** Human
 *   decision 2026-10-09 (`docs/product-decisions.md` §7.2.1): STG recordings are
 *   QA artifacts for the project testing team, and the risk of sensitive STG UI
 *   content appearing in them is explicitly ACCEPTED. A video is never deleted
 *   or blanked for containing such content. Automation runs only against an
 *   allowed, non-PROD label (`globalSetup`), so this never touches PROD.
 */

import { fileURLToPath } from 'node:url';

export const ARTIFACT_POLICY = {
  screenshot: 'only-on-failure',
  trace: 'off',
  video: 'on',
} as const;

/** Whether the policy permits video at all. The report consults this, never a spec. */
export const VIDEO_ALLOWED: boolean = (ARTIFACT_POLICY.video as string) !== 'off';

/** Console reporter. No Playwright HTML report: it embeds per-action detail on disk. */
export const REPORTER = 'list';

/** The QA execution reporter — sanitised, credential-free (src/automation/reporting/). */
export const EXECUTION_REPORTER = fileURLToPath(new URL('./reporting/reporter.ts', import.meta.url));

/** Root of every Playwright output. Under `.artifacts/`, which is gitignored. */
export const OUTPUT_ROOT = '.artifacts/playwright-results';

/** Root of the HTML execution reports: `<REPORT_ROOT>/<KEY>/RUN-<NNN>/`. Gitignored. */
export const REPORT_ROOT = '.artifacts/reports';

/** Where `npm run automation:verify-artifacts` writes, then scans. */
export const ARTIFACT_CHECK_OUTPUT = '.artifacts/artifact-check';
