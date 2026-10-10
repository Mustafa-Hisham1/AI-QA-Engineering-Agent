/**
 * The structured record of one MANUAL execution run — `execution-results.json`
 * in `docs/projects/<KEY>/executions/US-<id>/RUN-<NNN>/` — written by the
 * `/execute-test-cases` Skill beside `execution-results.md`, and the only input
 * of `manual-report.html` (`docs/product-decisions.md` §10.4).
 *
 * It records only what the run observed: every field is something the agent
 * did or saw. Totals are NOT stored — they are derived from the case results,
 * so the report can never disagree with them.
 *
 * Validation is strict, like the Test Case CSV: a record that cannot be read
 * confidently is refused with the field that is wrong, never rendered with a
 * guess. It also enforces the run policy (§10.5, `./run-policy.ts`): a product
 * bug never stops a run or skips another case; a run stops only on a
 * legitimate, evidenced condition; every PRODUCT_BUG failure has a Bug
 * Candidate. No dependency on automation results; no Azure DevOps knowledge.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  BUG_CANDIDATE_STATUSES,
  BUG_DISPOSITIONS,
  STATUS_FOR_DISPOSITION,
  type BugCandidateStatus,
  type BugDisposition,
  type BugResolution,
} from '../reporting/bug-report.ts';
import { STOP_CONDITIONS, STOP_EVIDENCE, type StopCondition } from './run-policy.ts';

export const MANUAL_RESULTS_FILE = 'execution-results.json';
export const MANUAL_EXECUTION_TYPE = 'MANUAL';

/** Execution statuses (`docs/product-decisions.md` §8). */
export type ManualStatus = 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED';
const STATUSES: readonly ManualStatus[] = ['PASS', 'FAIL', 'BLOCKED', 'SKIPPED'];

/** OBSERVED: a step that records behaviour without asserting it (observation-only). */
export type ManualStepStatus = 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT EXECUTED' | 'OBSERVED';
const STEP_STATUSES: readonly ManualStepStatus[] = ['PASS', 'FAIL', 'BLOCKED', 'NOT EXECUTED', 'OBSERVED'];

/** Failure classification (`docs/product-decisions.md` §9). */
export type Classification =
  | 'PRODUCT_BUG'
  | 'TEST_DATA_ISSUE'
  | 'ENVIRONMENT_ISSUE'
  | 'NETWORK_ISSUE'
  | 'AUTHENTICATION_ISSUE'
  | 'TEST_SCRIPT_ISSUE'
  | 'UNKNOWN';
const CLASSIFICATIONS: readonly Classification[] = [
  'PRODUCT_BUG',
  'TEST_DATA_ISSUE',
  'ENVIRONMENT_ISSUE',
  'NETWORK_ISSUE',
  'AUTHENTICATION_ISSUE',
  'TEST_SCRIPT_ISSUE',
  'UNKNOWN',
];

/** Evidence stays inside the run's gitignored `evidence/` directory. */
export const SAFE_EVIDENCE = /^evidence\/[A-Za-z0-9._-]+\.(png|jpe?g|txt|log|json)$/;
const SAFE_BUG_FILE = /^bug-candidates\/[A-Za-z0-9._-]+\.md$/;
const RUN_ID = /^RUN-\d{3,}$/;

export interface ManualEvidence {
  /** Relative to the run directory: `evidence/<file>`. */
  readonly path: string;
  readonly label: string;
}

export interface ManualStep {
  readonly index: number;
  readonly action: string;
  /** As the CSV stated it when the run executed. */
  readonly expected: string;
  readonly actual: string;
  readonly status: ManualStepStatus;
}

export interface ManualCaseResult {
  readonly testCaseId: string;
  readonly title: string;
  readonly adoId: number | null;
  readonly requirementReference: string | null;
  readonly status: ManualStatus;
  /** True for a case that records behaviour instead of asserting it. */
  readonly observationOnly: boolean;
  readonly durationMs: number | null;
  /** Required for FAIL and BLOCKED; null for PASS. */
  readonly classification: Classification | null;
  /**
   * What was OBSERVED that made the case not PASS — a confirmed fact, required
   * for every non-PASS status. Never a hypothesis.
   */
  readonly reason: string | null;
  /** A SUSPECTED root cause — unconfirmed, kept apart from the observation. */
  readonly suspectedCause: string | null;
  /** True when the case was not executed because the run had stopped (§10.5). */
  readonly notReached: boolean;
  readonly preconditionCheck: string | null;
  readonly steps: readonly ManualStep[];
  readonly evidence: readonly ManualEvidence[];
  /** Recorded, unverified — never results. */
  readonly observations: readonly string[];
  readonly bugCandidateId: string | null;
}

export interface ManualBugCandidate {
  readonly id: string;
  /** `bug-candidates/<file>.md`, relative to the run directory. */
  readonly file: string;
  readonly title: string;
  /**
   * Every case of this run that failed on this one defect. One underlying issue
   * is one Bug Candidate, however many cases it fails.
   */
  readonly testCaseIds: readonly string[];
  /** As classified during the run — kept even when a human later resolves it as not a bug. */
  readonly classification: 'PRODUCT_BUG';
  /** The confirmed observation: what the application actually did. */
  readonly summary: string;
  /** A suspected root cause — unconfirmed — or null. */
  readonly suspectedRootCause: string | null;
  /** Draft until a human reviews it; Confirmed or Not a Bug only with a recorded `resolution`. */
  readonly status: BugCandidateStatus;
  /** The human review, after the run (§10.6). Null while Draft. */
  readonly resolution: BugResolution | null;
  readonly evidence: readonly ManualEvidence[];
  // The detail of the Bug Candidate file, for the report's Bug Report section.
  // Optional: a record without them still renders, from `summary` alone.
  readonly description: string | null;
  readonly preconditions: readonly string[];
  readonly stepsToReproduce: readonly string[];
  /** By handle only (invariant 7). */
  readonly testData: readonly string[];
  readonly expectedResult: string | null;
  readonly actualResult: string | null;
  readonly requirementReference: string | null;
  readonly notes: readonly string[];
}

/** Whether the run executed every eligible case, or stopped on a legitimate condition (§10.5). */
export type RunCompletion =
  | { readonly status: 'COMPLETED' }
  | {
      readonly status: 'STOPPED';
      readonly condition: StopCondition;
      readonly explanation: string;
      /** The last case executed before stopping. */
      readonly afterTestCaseId: string;
    };

export interface ManualRunResults {
  readonly executionType: typeof MANUAL_EXECUTION_TYPE;
  readonly project: string;
  readonly runId: string;
  readonly userStory: { readonly id: number; readonly title: string | null };
  readonly environment: { readonly label: string; readonly host: string };
  /** ISO 8601. */
  readonly startedAt: string;
  readonly finishedAt: string | null;
  readonly executedBy: string;
  /** The CSV the cases were read from, and its sha256 at execution time. */
  readonly testCaseSource: { readonly path: string; readonly sha256: string };
  readonly completion: RunCompletion;
  readonly results: readonly ManualCaseResult[];
  readonly bugCandidates: readonly ManualBugCandidate[];
  readonly observations: readonly string[];
}

export interface ManualTotals {
  readonly total: number;
  readonly pass: number;
  readonly fail: number;
  readonly blocked: number;
  readonly skipped: number;
  /** Of the skipped, those not executed because the run stopped. */
  readonly notReached: number;
}

/** Raised for a results record that cannot be read confidently. */
export class ManualResultsError extends Error {
  readonly details: readonly string[];
  constructor(message: string, details: readonly string[] = []) {
    super(message);
    this.name = 'ManualResultsError';
    this.details = details;
  }
}

// ---------------------------------------------------------------------------
// Derived values
// ---------------------------------------------------------------------------

export function manualTotals(results: readonly ManualCaseResult[]): ManualTotals {
  const count = (status: ManualStatus): number => results.filter((entry) => entry.status === status).length;
  return {
    total: results.length,
    pass: count('PASS'),
    fail: count('FAIL'),
    blocked: count('BLOCKED'),
    skipped: count('SKIPPED'),
    notReached: results.filter((entry) => entry.notReached).length,
  };
}

/**
 * The overall verdict. FAIL wins; a run with a BLOCKED case — or one that
 * stopped before reaching every case — is INCOMPLETE: it did not prove the
 * cases it could not run. Scope-SKIPPED cases do not count.
 */
export function manualVerdict(totals: ManualTotals): 'PASS' | 'FAIL' | 'INCOMPLETE' | 'NO RESULT' {
  if (totals.fail > 0) return 'FAIL';
  if (totals.blocked > 0 || totals.notReached > 0) return 'INCOMPLETE';
  if (totals.pass > 0) return 'PASS';
  return 'NO RESULT';
}

/** Run duration: wall clock when finished, else the sum of case durations when all are known. */
export function manualDurationMs(run: ManualRunResults): number | null {
  if (run.finishedAt) return Date.parse(run.finishedAt) - Date.parse(run.startedAt);
  const durations = run.results.map((entry) => entry.durationMs);
  return durations.every((value): value is number => value !== null) ? durations.reduce((a, b) => a + b, 0) : null;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates parsed JSON as a manual run record for `runDir`.
 *
 * @param runDir   the run directory, to check evidence and Bug Candidate files exist
 * @param expected the project key, story ID and run ID the record must declare
 * @throws {ManualResultsError} listing every problem found
 */
export function validateManualResults(
  data: unknown,
  runDir: string,
  expected: { project: string; storyId: number; runId: string },
): ManualRunResults {
  const problems: string[] = [];
  const fail = (message: string): void => {
    problems.push(message);
  };
  const str = (value: unknown): value is string => typeof value === 'string';
  const text = (value: unknown, where: string, required = true): string => {
    if (str(value) && (!required || value.trim())) return value;
    if (!required && (value === null || value === undefined)) return '';
    fail(`${where}: expected ${required ? 'a non-empty string' : 'a string'}`);
    return '';
  };
  const list = (value: unknown, where: string): unknown[] => {
    if (Array.isArray(value)) return value;
    fail(`${where}: expected a list`);
    return [];
  };
  const evidenceList = (value: unknown, where: string): ManualEvidence[] =>
    list(value, where).map((item, index) => {
      const at = `${where}[${index}]`;
      if (!isObject(item)) {
        fail(`${at}: expected an object`);
        return { path: '', label: '' };
      }
      const path = text(item.path, `${at}.path`);
      if (path && !SAFE_EVIDENCE.test(path)) fail(`${at}.path "${path}" must be evidence/<file>.(png|jpg|jpeg|txt|log|json)`);
      else if (path && !existsSync(join(runDir, path))) fail(`${at}.path "${path}" does not exist in the run directory`);
      return { path, label: text(item.label, `${at}.label`) };
    });

  const optionalText = (value: unknown, where: string): string | null =>
    value === null || value === undefined ? null : text(value, where);
  const textList = (value: unknown, where: string): string[] =>
    value === null || value === undefined ? [] : list(value, where).map((entry, index) => text(entry, `${where}[${index}]`));
  const readResolution = (value: unknown, where: string): BugResolution | null => {
    if (!isObject(value)) {
      fail(`${where}: expected an object`);
      return null;
    }
    const disposition = value.disposition as BugDisposition;
    if (!BUG_DISPOSITIONS.includes(disposition)) fail(`${where}.disposition must be one of ${BUG_DISPOSITIONS.join(', ')}`);
    const decidedAt = text(value.decidedAt, `${where}.decidedAt`);
    if (decidedAt && Number.isNaN(Date.parse(decidedAt))) fail(`${where}.decidedAt is not an ISO 8601 date`);
    return {
      disposition,
      decidedBy: text(value.decidedBy, `${where}.decidedBy`),
      decidedAt,
      decisionRef: optionalText(value.decisionRef, `${where}.decisionRef`),
      rationale: text(value.rationale, `${where}.rationale`),
    };
  };

  if (!isObject(data)) throw new ManualResultsError('execution-results.json is not a JSON object.');

  if (data.executionType !== MANUAL_EXECUTION_TYPE) fail(`executionType must be "${MANUAL_EXECUTION_TYPE}"`);
  if (data.project !== expected.project) fail(`project is "${String(data.project)}", expected "${expected.project}"`);
  const runId = text(data.runId, 'runId');
  if (runId && (!RUN_ID.test(runId) || runId !== expected.runId)) fail(`runId "${runId}" must equal the run directory name "${expected.runId}"`);

  const story = isObject(data.userStory) ? data.userStory : (fail('userStory: expected an object'), {} as Json);
  if (story.id !== expected.storyId) fail(`userStory.id is ${String(story.id)}, expected ${expected.storyId}`);
  const storyTitle = story.title === null || story.title === undefined ? null : text(story.title, 'userStory.title');

  const environment = isObject(data.environment) ? data.environment : (fail('environment: expected an object'), {} as Json);
  const label = text(environment.label, 'environment.label');
  const host = text(environment.host, 'environment.host');
  if (/^prod/i.test(label)) fail('environment.label is PROD — manual execution never runs against PROD');

  const startedAt = text(data.startedAt, 'startedAt');
  if (startedAt && Number.isNaN(Date.parse(startedAt))) fail('startedAt is not an ISO 8601 date-time');
  const finishedAt = data.finishedAt === null || data.finishedAt === undefined ? null : text(data.finishedAt, 'finishedAt');
  if (finishedAt && (Number.isNaN(Date.parse(finishedAt)) || Date.parse(finishedAt) < Date.parse(startedAt))) {
    fail('finishedAt must be an ISO 8601 date-time not before startedAt');
  }
  const executedBy = text(data.executedBy, 'executedBy');

  const source = isObject(data.testCaseSource) ? data.testCaseSource : (fail('testCaseSource: expected an object'), {} as Json);
  const sourcePath = text(source.path, 'testCaseSource.path');
  if (sourcePath && !sourcePath.endsWith('test-cases.csv')) {
    fail('testCaseSource.path must be the story\'s test-cases.csv — the single source of truth (§6.4)');
  }
  const sha256 = text(source.sha256, 'testCaseSource.sha256');
  if (sha256 && !/^[0-9a-f]{64}$/.test(sha256)) fail('testCaseSource.sha256 must be 64 lowercase hex characters');

  const idPattern = new RegExp(`^TC-${expected.storyId}-\\d{3,}$`);
  const results: ManualCaseResult[] = list(data.results, 'results').map((item, index) => {
    const at = `results[${index}]`;
    if (!isObject(item)) {
      fail(`${at}: expected an object`);
      return null as unknown as ManualCaseResult;
    }
    const testCaseId = text(item.testCaseId, `${at}.testCaseId`);
    const where = testCaseId || at;
    if (testCaseId && !idPattern.test(testCaseId)) fail(`${where}: not a Test Case ID of User Story ${expected.storyId}`);

    const status = item.status as ManualStatus;
    if (!STATUSES.includes(status)) fail(`${where}: status must be one of ${STATUSES.join(', ')}`);

    const classification = item.classification === null || item.classification === undefined ? null : (item.classification as Classification);
    if (classification !== null && !CLASSIFICATIONS.includes(classification)) fail(`${where}: unknown classification "${String(classification)}"`);
    if ((status === 'FAIL' || status === 'BLOCKED') && classification === null) fail(`${where}: a ${status} result needs a failure classification`);
    if (status === 'PASS' && classification !== null) fail(`${where}: a PASS result has no failure classification`);

    const reason = item.reason === null || item.reason === undefined ? null : text(item.reason, `${where}.reason`);
    if (status !== 'PASS' && !reason) fail(`${where}: a ${status} result needs a reason`);
    const suspectedCause = item.suspectedCause === null || item.suspectedCause === undefined ? null : text(item.suspectedCause, `${where}.suspectedCause`);

    const notReached = item.notReached === true;
    if (notReached && status !== 'SKIPPED') fail(`${where}: a case not reached because the run stopped is SKIPPED`);
    // A product bug is a result for the case it was found in, never a reason not
    // to run another case (§10.5). Only a stop condition leaves cases unrun.
    if (status === 'SKIPPED' && !notReached && reason && /\bbug\b|PRODUCT_BUG/i.test(reason)) {
      fail(`${where}: SKIPPED because of a bug — a product bug never causes another case to be skipped; execute it`);
    }

    const steps: ManualStep[] = list(item.steps, `${where}.steps`).map((raw, stepIndex) => {
      const stepAt = `${where}.steps[${stepIndex}]`;
      if (!isObject(raw)) {
        fail(`${stepAt}: expected an object`);
        return { index: 0, action: '', expected: '', actual: '', status: 'NOT EXECUTED' };
      }
      const stepStatus = raw.status as ManualStepStatus;
      if (!STEP_STATUSES.includes(stepStatus)) fail(`${stepAt}: status must be one of ${STEP_STATUSES.join(', ')}`);
      if (!Number.isInteger(raw.index) || (raw.index as number) < 1) fail(`${stepAt}: index must be a positive integer`);
      return {
        index: raw.index as number,
        action: text(raw.action, `${stepAt}.action`),
        expected: text(raw.expected, `${stepAt}.expected`),
        actual: text(raw.actual, `${stepAt}.actual`, stepStatus !== 'NOT EXECUTED'),
        status: stepStatus,
      };
    });
    if (status !== 'SKIPPED' && steps.length === 0) fail(`${where}: an executed case records its steps`);
    const indexes = steps.map((step) => step.index);
    if (new Set(indexes).size !== indexes.length) fail(`${where}: step numbers repeat`);
    if (status === 'PASS' && steps.some((step) => step.status !== 'PASS' && step.status !== 'OBSERVED')) {
      fail(`${where}: PASS needs every step PASS (or OBSERVED)`);
    }
    if (status === 'FAIL' && !steps.some((step) => step.status === 'FAIL')) fail(`${where}: FAIL needs at least one failed step`);

    const durationMs = item.durationMs === null || item.durationMs === undefined ? null : (item.durationMs as number);
    if (durationMs !== null && (typeof durationMs !== 'number' || durationMs < 0)) fail(`${where}: durationMs must be a non-negative number or null`);
    const adoId = item.adoId === null || item.adoId === undefined ? null : (item.adoId as number);
    if (adoId !== null && (!Number.isInteger(adoId) || adoId <= 0)) fail(`${where}: adoId must be a positive integer or null`);

    return {
      testCaseId,
      title: text(item.title, `${where}.title`),
      adoId,
      requirementReference: item.requirementReference === null || item.requirementReference === undefined ? null : text(item.requirementReference, `${where}.requirementReference`),
      status,
      observationOnly: item.observationOnly === true,
      durationMs,
      classification,
      reason,
      suspectedCause,
      notReached,
      preconditionCheck: item.preconditionCheck === null || item.preconditionCheck === undefined ? null : text(item.preconditionCheck, `${where}.preconditionCheck`),
      steps,
      evidence: evidenceList(item.evidence ?? [], `${where}.evidence`),
      observations: list(item.observations ?? [], `${where}.observations`).map((entry, i) => text(entry, `${where}.observations[${i}]`)),
      bugCandidateId: item.bugCandidateId === null || item.bugCandidateId === undefined ? null : text(item.bugCandidateId, `${where}.bugCandidateId`),
    };
  });
  if (results.length === 0) fail('results: a run records at least one Test Case');
  const ids = results.map((entry) => entry?.testCaseId).filter(Boolean);
  const repeated = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (repeated.length > 0) fail(`results: Test Case IDs repeat — ${[...new Set(repeated)].join(', ')}`);

  const bugCandidates: ManualBugCandidate[] = list(data.bugCandidates ?? [], 'bugCandidates').map((item, index) => {
    const at = `bugCandidates[${index}]`;
    if (!isObject(item)) {
      fail(`${at}: expected an object`);
      return null as unknown as ManualBugCandidate;
    }
    const id = text(item.id, `${at}.id`);
    const file = text(item.file, `${at}.file`);
    let fileText = '';
    if (file && !SAFE_BUG_FILE.test(file)) fail(`${at}.file "${file}" must be bug-candidates/<file>.md`);
    else if (file && !existsSync(join(runDir, file))) fail(`${at}.file "${file}" does not exist in the run directory`);
    else if (file) fileText = readFileSync(join(runDir, file), 'utf8');
    if (item.classification !== 'PRODUCT_BUG') fail(`${at}: only a PRODUCT_BUG failure produces a Bug Candidate`);

    // Draft until a human reviews it. Any other status must carry the human's
    // resolution, and the two must agree (§10.6, invariant 1).
    const status = item.status as BugCandidateStatus;
    if (!BUG_CANDIDATE_STATUSES.includes(status)) {
      fail(`${at}: status must be one of ${BUG_CANDIDATE_STATUSES.join(', ')} — a new Bug Candidate is always Draft`);
    }
    const resolution = item.resolution === null || item.resolution === undefined ? null : readResolution(item.resolution, `${at}.resolution`);
    if (status === 'Draft' && resolution !== null) fail(`${at}: a Draft has no resolution — set the status the human decided`);
    if (status !== 'Draft' && BUG_CANDIDATE_STATUSES.includes(status)) {
      if (resolution === null) fail(`${at}: status ${status} needs the human's resolution (disposition, decidedBy, decidedAt, rationale)`);
      else if (STATUS_FOR_DISPOSITION[resolution.disposition] !== status) {
        fail(`${at}: status ${status} disagrees with resolution.disposition ${resolution.disposition}`);
      }
    }

    // One underlying defect is one Bug Candidate, linked to every case it failed.
    // `testCaseId` (a single case) is still read for records written before that.
    const linked = Array.isArray(item.testCaseIds)
      ? item.testCaseIds.map((entry, i) => text(entry, `${at}.testCaseIds[${i}]`))
      : item.testCaseId !== undefined
        ? [text(item.testCaseId, `${at}.testCaseId`)]
        : (fail(`${at}: testCaseIds must list the Test Case(s) this defect failed`), []);
    if (linked.length === 0) fail(`${at}: testCaseIds must list at least one Test Case`);
    for (const testCaseId of linked) {
      if (testCaseId && !ids.includes(testCaseId)) fail(`${at}: Test Case ${testCaseId} is not in this run's results`);
      // The Bug Candidate file is the document a human reviews and /publish-bug
      // reads: it must name the run and the Test Case it came from.
      else if (fileText && !fileText.includes(testCaseId)) fail(`${at}: ${file} does not name Test Case ${testCaseId}`);
    }
    if (fileText && !fileText.includes(runId)) fail(`${at}: ${file} does not name the execution run ${runId}`);

    return {
      id,
      file,
      title: text(item.title, `${at}.title`),
      testCaseIds: linked,
      classification: 'PRODUCT_BUG',
      summary: text(item.summary, `${at}.summary`),
      suspectedRootCause:
        item.suspectedRootCause === null || item.suspectedRootCause === undefined ? null : text(item.suspectedRootCause, `${at}.suspectedRootCause`),
      status,
      resolution,
      evidence: evidenceList(item.evidence ?? [], `${at}.evidence`),
      description: optionalText(item.description, `${at}.description`),
      preconditions: textList(item.preconditions, `${at}.preconditions`),
      stepsToReproduce: textList(item.stepsToReproduce, `${at}.stepsToReproduce`),
      testData: textList(item.testData, `${at}.testData`),
      expectedResult: optionalText(item.expectedResult, `${at}.expectedResult`),
      actualResult: optionalText(item.actualResult, `${at}.actualResult`),
      requirementReference: optionalText(item.requirementReference, `${at}.requirementReference`),
      notes: textList(item.notes, `${at}.notes`),
    };
  });

  // No duplicate Bug Candidates for one defect: the same title twice is the same issue raised twice.
  const titles = bugCandidates.map((bug) => bug?.title.trim().toLowerCase().replace(/\s+/g, ' ')).filter(Boolean);
  const repeatedTitles = titles.filter((title, index) => titles.indexOf(title) !== index);
  if (repeatedTitles.length > 0) {
    fail(`bugCandidates: the same defect is raised more than once ("${repeatedTitles[0]}") — link every affected case to ONE Bug Candidate`);
  }

  const bugById = new Map(bugCandidates.filter(Boolean).map((bug) => [bug.id, bug]));
  for (const result of results) {
    if (!result) continue;
    if (result.status === 'FAIL' && result.classification === 'PRODUCT_BUG' && !result.bugCandidateId) {
      fail(`${result.testCaseId}: a FAIL classified PRODUCT_BUG is recorded as a Bug Candidate — bugCandidateId is missing`);
    }
    if (!result.bugCandidateId) continue;
    const bug = bugById.get(result.bugCandidateId);
    if (!bug) fail(`${result.testCaseId}: bugCandidateId "${result.bugCandidateId}" is not in bugCandidates`);
    else if (!bug.testCaseIds.includes(result.testCaseId)) fail(`${result.bugCandidateId}: testCaseIds does not include ${result.testCaseId}, which links to it`);
    if (result.status !== 'FAIL' || result.classification !== 'PRODUCT_BUG') {
      fail(`${result.testCaseId}: only a FAIL classified PRODUCT_BUG links a Bug Candidate`);
    }
  }
  for (const bug of bugById.values()) {
    for (const testCaseId of bug.testCaseIds) {
      const result = results.find((entry) => entry?.testCaseId === testCaseId);
      if (result && result.bugCandidateId !== bug.id) fail(`${bug.id}: lists ${testCaseId}, but that case does not link back to it`);
    }
  }

  const completion = validateCompletion(data.completion, results, fail);

  const observations = list(data.observations ?? [], 'observations').map((entry, i) => text(entry, `observations[${i}]`));

  if (problems.length > 0) throw new ManualResultsError(`execution-results.json is not a valid manual run record (${problems.length} problem(s)).`, problems);

  return {
    executionType: MANUAL_EXECUTION_TYPE,
    project: expected.project,
    runId,
    userStory: { id: expected.storyId, title: storyTitle },
    environment: { label, host },
    startedAt,
    finishedAt,
    executedBy,
    testCaseSource: { path: sourcePath, sha256 },
    completion,
    results,
    bugCandidates,
    observations,
  };
}

/**
 * Validates how the run ended against the run policy (§10.5): a COMPLETED run
 * left no case unreached; a STOPPED run names a legitimate condition — never a
 * product bug — consistent with the case it stopped after, and every case
 * after that one is recorded as not reached.
 */
function validateCompletion(value: unknown, results: readonly ManualCaseResult[], fail: (message: string) => void): RunCompletion {
  if (!isObject(value)) {
    fail('completion: expected { "status": "COMPLETED" } or { "status": "STOPPED", "condition", "explanation", "afterTestCaseId" }');
    return { status: 'COMPLETED' };
  }
  const notReached = results.filter((entry) => entry?.notReached);

  if (value.status === 'COMPLETED') {
    if (notReached.length > 0) {
      fail(`completion: a COMPLETED run reached every case, but ${notReached.map((entry) => entry.testCaseId).join(', ')} is marked not reached`);
    }
    return { status: 'COMPLETED' };
  }

  if (value.status !== 'STOPPED') {
    fail('completion.status must be COMPLETED or STOPPED');
    return { status: 'COMPLETED' };
  }

  const condition = value.condition as StopCondition;
  if (String(value.condition) === 'PRODUCT_BUG') {
    fail('completion.condition: a product bug never stops a run — record the FAIL and its Bug Candidate, then continue (§10.5)');
  } else if (!STOP_CONDITIONS.includes(condition)) {
    fail(`completion.condition must be one of ${STOP_CONDITIONS.join(', ')}`);
  }
  const explanation = typeof value.explanation === 'string' && value.explanation.trim() ? value.explanation : '';
  if (!explanation) fail('completion.explanation: a STOPPED run says why continuing was unsafe or impossible');

  const afterTestCaseId = typeof value.afterTestCaseId === 'string' ? value.afterTestCaseId : '';
  const position = results.findIndex((entry) => entry?.testCaseId === afterTestCaseId);
  if (position === -1) {
    fail(`completion.afterTestCaseId "${afterTestCaseId}" is not in this run's results`);
  } else {
    const stopCase = results[position]!;
    if (stopCase.notReached) fail(`completion.afterTestCaseId ${afterTestCaseId} was not reached — name the last case executed`);
    const evidence = STOP_EVIDENCE[condition];
    if (evidence && (stopCase.classification === null || !evidence.includes(stopCase.classification))) {
      fail(`completion: ${condition} needs ${afterTestCaseId} classified ${evidence.join(' or ')}, not ${stopCase.classification ?? 'none'}`);
    }
    // Nothing executes after the stop, and nothing before it is "not reached".
    results.forEach((entry, index) => {
      if (!entry) return;
      if (index > position && !entry.notReached && entry.status !== 'SKIPPED') {
        fail(`${entry.testCaseId}: executed after the run stopped at ${afterTestCaseId}`);
      }
      if (index < position && entry.notReached) fail(`${entry.testCaseId}: marked not reached, but it comes before the stop at ${afterTestCaseId}`);
    });
  }

  return { status: 'STOPPED', condition, explanation, afterTestCaseId };
}
