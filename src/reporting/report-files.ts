/**
 * The two QA report filenames, and the guard that keeps them apart
 * (`docs/product-decisions.md` §7.2, §10.4).
 *
 *   automation-report.html   written only by the automation reporter, into
 *                            `.artifacts/reports/<KEY>/RUN-<NNN>/`
 *   manual-report.html       written only by the manual execution report, into
 *                            `docs/projects/<KEY>/executions/US-<id>/RUN-<NNN>/`
 *
 * Isolation is structural, in three layers: the two run roots differ; each
 * writer writes only its own filename; and each writer refuses a run directory
 * that already holds the OTHER report type — so neither can ever overwrite,
 * rename or delete the other's report, even if a path were mis-configured.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const AUTOMATION_REPORT_FILE = 'automation-report.html';
export const MANUAL_REPORT_FILE = 'manual-report.html';

export type ReportKind = 'automation' | 'manual';

const OWN: Record<ReportKind, string> = { automation: AUTOMATION_REPORT_FILE, manual: MANUAL_REPORT_FILE };
const OTHER: Record<ReportKind, string> = { automation: MANUAL_REPORT_FILE, manual: AUTOMATION_REPORT_FILE };

/** Raised when a report would land in another report type's run directory. */
export class ReportIsolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportIsolationError';
  }
}

/**
 * The path a report of `kind` is written to in `runDir`, after checking the
 * directory belongs to that kind.
 *
 * @throws {ReportIsolationError} when `runDir` already holds the other report.
 */
export function reportPathFor(runDir: string, kind: ReportKind): string {
  if (existsSync(join(runDir, OTHER[kind]))) {
    throw new ReportIsolationError(
      `${runDir} holds ${OTHER[kind]} — refusing to write ${OWN[kind]} into another execution type's run.`,
    );
  }
  return join(runDir, OWN[kind]);
}
