/**
 * Selects which Test Cases `/automate-test-cases` may automate, and where their
 * plan and code live (`docs/product-decisions.md` §7.1).
 *
 * Selection is code, not judgement: the human already made both decisions it
 * depends on. **Need Automation** (§6.3) decides automation scope, and the
 * **Review/Lifecycle Status** (§6.1) decides approval. This module reads both
 * and changes neither — it never re-evaluates Need Automation, and an
 * automation decision never approves anything.
 *
 * Pure: no file system, no Playwright, no Azure DevOps.
 */

import type { ActiveProject } from '../projects/active-project.ts';
import type { ReviewStatus, TestCaseArtifact, TestCaseRecord } from '../testcases/model.ts';

/**
 * Statuses that carry a human approval. `Published` is approved content that
 * was then created in Azure DevOps. The same rule execution applies.
 */
const APPROVED_STATUSES: readonly ReviewStatus[] = ['Approved', 'Published'];

export type ExclusionReason =
  /** The human (or the accepted recommendation) said No. Never automated. */
  | 'NEED_AUTOMATION_NO'
  /** No value recorded. Undecided is never read as Yes. */
  | 'NEED_AUTOMATION_UNDECIDED'
  /** Need Automation = Yes, but the case is not approved. Refused. */
  | 'NOT_APPROVED';

/** A case selected for automation, with the paths its plan and code use. */
export interface ScopedCase {
  readonly testCase: TestCaseRecord;
  readonly storyId: number;
  /**
   * Directory path for the case's Module, e.g. `Authentication`, `User-Management`,
   * or `Company/Operating-Country` when the profile declares a sub-module.
   */
  readonly moduleDir: string;
  readonly planPath: string;
  readonly specPath: string;
}

export interface ExcludedCase {
  readonly testCase: TestCaseRecord;
  readonly reason: ExclusionReason;
  readonly detail: string;
}

export interface AutomationScope {
  readonly inScope: readonly ScopedCase[];
  readonly excluded: readonly ExcludedCase[];
}

/**
 * The directory name for a Module: whitespace and any character outside
 * `[A-Za-z0-9._-]` become a dash. `User Management` -> `User-Management`.
 *
 * Automation is organised by Module, not by User Story (human decision,
 * 2026-10-09): one story can span modules, and one module accumulates cases
 * from many stories.
 */
export function moduleDirName(module: string): string {
  const dir = module
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|-+$/g, '');
  if (!dir) {
    throw new Error(`Module "${module}" has no usable characters for a directory name.`);
  }
  return dir;
}

/**
 * A sub-module the active project's profile declares: the cases of `module`
 * whose Feature/Page contains `featureMatch` (case-insensitive) live under
 * `<Module>/<Sub-Module>/` (human decision 2026-10-10, NBO: Company > Operating
 * Country). The Test Case's own Module field is never changed — the CSV is the
 * source of truth (§6.4) — only where its plan and code live.
 */
export interface SubModule {
  readonly module: string;
  readonly subModule: string;
  readonly featureMatch: string;
}

/**
 * The Module directory path for a case: `<Module>`, or `<Module>/<Sub-Module>`
 * when a declared sub-module claims its Feature/Page. The longest matching
 * phrase wins, so two sub-modules of one Module cannot both claim a case.
 */
export function modulePathFor(testCase: Pick<TestCaseRecord, 'module' | 'featurePage'>, subModules: readonly SubModule[] = []): string {
  const feature = testCase.featurePage.trim().toLowerCase();
  const match = subModules
    .filter((entry) => entry.module.trim() === testCase.module.trim() && feature.includes(entry.featureMatch.trim().toLowerCase()))
    .sort((a, b) => b.featureMatch.trim().length - a.featureMatch.trim().length)[0];
  const top = moduleDirName(testCase.module);
  return match ? `${top}/${moduleDirName(match.subModule)}` : top;
}

/** `docs/projects/<KEY>/automation/<Module path>/automation-plan.md` */
export function automationPlanPathFor(project: ActiveProject, modulePath: string): string {
  const dir = modulePath
    .split('/')
    .map((part) => moduleDirName(part))
    .join('/');
  return `${project.root}/automation/${dir}/automation-plan.md`;
}

/** `automation/<KEY>/<Module path>/tests/TC-<story>-NNN.spec.ts` — one spec per Test Case. */
export function specPathFor(project: ActiveProject, testCase: TestCaseRecord, subModules: readonly SubModule[] = []): string {
  return `automation/${project.key}/${modulePathFor(testCase, subModules)}/tests/${testCase.localId}.spec.ts`;
}

/**
 * Partitions an artifact's cases into automation scope and exclusions.
 *
 * In scope means BOTH: Need Automation = Yes, AND Approved/Published. Every
 * other case is returned with its reason — nothing is dropped silently.
 */
export function selectAutomationScope(
  project: ActiveProject,
  artifact: TestCaseArtifact,
  subModules: readonly SubModule[] = [],
): AutomationScope {
  const inScope: ScopedCase[] = [];
  const excluded: ExcludedCase[] = [];

  for (const testCase of artifact.testCases) {
    if (testCase.needAutomation === 'No') {
      excluded.push({ testCase, reason: 'NEED_AUTOMATION_NO', detail: 'Need Automation = No' });
      continue;
    }

    if (testCase.needAutomation === null) {
      excluded.push({
        testCase,
        reason: 'NEED_AUTOMATION_UNDECIDED',
        detail: 'No Need Automation value — run /write-test-cases, then have a human review it',
      });
      continue;
    }

    if (!APPROVED_STATUSES.includes(testCase.status)) {
      excluded.push({
        testCase,
        reason: 'NOT_APPROVED',
        detail: `Need Automation = Yes, but status is ${testCase.status} — only Approved or Published cases are automated`,
      });
      continue;
    }

    const moduleDir = modulePathFor(testCase, subModules);
    inScope.push({
      testCase,
      storyId: artifact.storyId,
      moduleDir,
      planPath: automationPlanPathFor(project, moduleDir),
      specPath: specPathFor(project, testCase, subModules),
    });
  }

  return { inScope, excluded };
}
