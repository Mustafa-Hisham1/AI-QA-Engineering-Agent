/**
 * Finds the in-scope Test Cases of the executed stories that have no spec —
 * the report's NOT AUTOMATED rows (`docs/product-decisions.md` §7.2).
 *
 * In scope means exactly what `/automate-test-cases` uses: Need Automation =
 * Yes AND Approved/Published (`selectAutomationScope`). A case whose spec
 * exists but was filtered out of this run (`--grep`) is not reported at all —
 * it is automated, just not run here.
 */

import type { ActiveProject } from '../../projects/active-project.ts';
import type { TestCaseArtifact } from '../../testcases/model.ts';
import { selectAutomationScope } from '../scope.ts';
import type { NotAutomatedCase } from './build.ts';

export interface PlanRow {
  readonly status: string;
  readonly reason: string;
}

/**
 * Reads the case table of an Automation Plan: rows keyed by Test Case ID, with
 * the `Automation Status` and `Reason` columns. Lenient by design — a plan is
 * Markdown a Skill writes and a human edits; an unreadable plan only loses the
 * reason text, never a result.
 */
export function parsePlanRows(text: string): Map<string, PlanRow> {
  const rows = new Map<string, PlanRow>();
  let statusColumn = -1;
  let reasonColumn = -1;

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());

    if (cells.includes('Automation Status')) {
      statusColumn = cells.indexOf('Automation Status');
      reasonColumn = cells.indexOf('Reason');
      continue;
    }

    const id = cells[0]?.replace(/`/g, '');
    if (statusColumn === -1 || !id || !/^TC-\d+-\d+$/.test(id)) continue;
    rows.set(id, { status: cells[statusColumn] ?? '', reason: reasonColumn === -1 ? '' : (cells[reasonColumn] ?? '') });
  }

  return rows;
}

export function findNotAutomated(
  project: ActiveProject,
  artifacts: readonly TestCaseArtifact[],
  executedIds: ReadonlySet<string>,
  fileExists: (path: string) => boolean,
  readText: (path: string) => string | null,
): NotAutomatedCase[] {
  const found: NotAutomatedCase[] = [];
  const plans = new Map<string, Map<string, PlanRow>>();

  for (const artifact of artifacts) {
    for (const scoped of selectAutomationScope(project, artifact).inScope) {
      if (executedIds.has(scoped.testCase.localId) || fileExists(scoped.specPath)) continue;

      if (!plans.has(scoped.planPath)) {
        const text = readText(scoped.planPath);
        plans.set(scoped.planPath, text === null ? new Map() : parsePlanRows(text));
      }
      const row = plans.get(scoped.planPath)!.get(scoped.testCase.localId);

      const reason = row?.status.startsWith('NOT AUTOMATED')
        ? `${row.status}${row.reason ? ` — ${row.reason}` : ''} (${scoped.planPath})`
        : `No spec at ${scoped.specPath}${row ? ` — plan status: ${row.status}` : ''} (${scoped.planPath}).`;

      found.push({ testCase: scoped.testCase, storyId: scoped.storyId, specFile: scoped.specPath, reason });
    }
  }

  return found;
}
