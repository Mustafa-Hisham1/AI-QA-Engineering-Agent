/**
 * Builds the execution report from raw Playwright results and the Test Case
 * artifact (`docs/product-decisions.md` §7.2).
 *
 * Pure: no file system, no Playwright. The reporter collects the raw results
 * and supplies lookups; this module decides everything that ends up in the
 * report — and sanitises every Playwright string on the way in.
 *
 * Sources of truth:
 * - Test Case ID, User Story ID, ADO ID: the spec's own annotations
 *   (`testCaseDetails`). Never inferred from a file name or title.
 * - Step actions, Expected Results, title, module: the Test Case artifact.
 * - Status, durations, errors, screenshots: Playwright.
 */

import { isAbsolute, relative, resolve } from 'node:path';

import { sanitizeText, stripAnsi } from '../sanitizer.ts';
import type { TestCaseRecord } from '../../testcases/model.ts';
import { classifyFailure } from './classify.ts';
import type {
  BugCandidate,
  ExecutionReport,
  ExecutionStatus,
  FailureDetail,
  ReportAttachment,
  ReportEnvironment,
  StepResult,
  TestCaseResult,
} from './model.ts';

export interface RawStep {
  readonly title: string;
  readonly durationMs: number;
  readonly error: string | null;
}

export interface RawAttachment {
  readonly name: string;
  readonly contentType: string;
  readonly path: string | null;
}

export interface RawTestResult {
  readonly title: string;
  readonly specFile: string;
  readonly annotations: readonly { readonly type: string; readonly description?: string }[];
  readonly status: 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';
  readonly durationMs: number;
  /** `test.step` steps only, in execution order. */
  readonly steps: readonly RawStep[];
  readonly errors: readonly string[];
  readonly attachments: readonly RawAttachment[];
}

export interface NotAutomatedCase {
  readonly testCase: TestCaseRecord;
  readonly storyId: number;
  readonly specFile: string;
  readonly reason: string;
}

export interface BuildInput {
  readonly runId: string;
  readonly project: string;
  readonly environment: ReportEnvironment;
  readonly startedAt: string;
  readonly durationMs: number;
  readonly raws: readonly RawTestResult[];
  /** The Test Case a spec traces to, or null when the artifact has no such case. */
  readonly lookupTestCase: (storyId: number, testCaseId: string) => TestCaseRecord | null;
  readonly notAutomated: readonly NotAutomatedCase[];
  /** Decides which Playwright attachments may be copied into the report. */
  readonly gate: AttachmentGate;
}

/** The kinds of file the report accepts, identified by their content. */
export type FileSignature = 'png' | 'webm';

/**
 * Everything the attachment allow-list needs from the outside world. A file is
 * copied only when ALL hold: an allowed name + content type, the file exists,
 * it lies inside Playwright's output directory, and its bytes really are that
 * kind of file. A spec cannot smuggle `.env` in by attaching it as "video".
 */
export interface AttachmentGate {
  /** From the artifact policy. A video is never reported when false. */
  readonly videoAllowed: boolean;
  readonly fileExists: (path: string) => boolean;
  /** True only for a path inside one of Playwright's output directories. */
  readonly isInsideOutput: (path: string) => boolean;
  /** The file's real kind, from its first bytes; null for anything else. */
  readonly signatureOf: (path: string) => FileSignature | null;
}

/** True when `path` resolves inside one of `roots` — never equal to, never above. */
export function insideAny(roots: readonly string[], path: string): boolean {
  const target = resolve(path);
  return roots.some((root) => {
    const rel = relative(resolve(root), target);
    return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
  });
}

/** Identifies a PNG or WebM file by its magic bytes. */
export function signatureOfBytes(head: Uint8Array): FileSignature | null {
  const starts = (bytes: readonly number[]): boolean => bytes.every((byte, index) => head[index] === byte);
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  // EBML header — the container WebM (and Matroska) files start with.
  if (starts([0x1a, 0x45, 0xdf, 0xa3])) return 'webm';
  return null;
}

/** An attachment the writer must copy: Playwright output -> `<report>/attachments/`. */
export interface AttachmentCopy {
  readonly from: string;
  readonly to: string;
}

export interface BuiltReport {
  readonly report: ExecutionReport;
  readonly copies: readonly AttachmentCopy[];
}

const STEP_TITLE = /^Step (\d+):\s*(.*)$/;
const NOT_APPLICABLE = '—';

/** Every Playwright string enters the report through here. */
function clean(text: string): string {
  return stripAnsi(sanitizeText(text)).trim();
}

function firstLine(text: string): string {
  return text.split('\n').map((line) => line.trim()).find(Boolean) ?? '';
}

function stripBullet(line: string): string {
  return line.replace(/^[-*]\s+/, '').trim();
}

/**
 * What the application actually showed, from a Playwright error: the
 * `Received` value, an element-not-found statement, or the received side of a
 * diff — falling back to the error's first line.
 */
export function extractActual(error: string): string {
  const lines = error.split('\n');

  const received = lines.find((line) => /^\s*Received( string| value)?:/.test(line));
  if (received) return received.trim();

  if (/element\(s\) not found/.test(error)) {
    const locator = lines.find((line) => /^\s*Locator:/.test(line));
    return `The element was not found on the page${locator ? ` (${locator.trim()})` : ''}.`;
  }

  // A diff: `- Expected - n` / `+ Received + n`, then the body until the call log.
  const header = lines.findIndex((line) => /^\s*\+ Received\b/.test(line));
  if (header !== -1) {
    const diff: string[] = [];
    for (const line of lines.slice(header + 1)) {
      if (/^\s*Call log:/.test(line)) break;
      if (!/^\s*\+/.test(line)) continue;
      const text = line.replace(/^\s*\+/, '').trim();
      if (text) diff.push(text);
    }
    if (diff.length > 0) return `Received: ${diff.join(' ')}`;
  }

  return firstLine(error);
}

function annotation(raw: RawTestResult, type: string): string | null {
  return raw.annotations.find((entry) => entry.type === type)?.description?.trim() || null;
}

function toStatus(status: RawTestResult['status']): ExecutionStatus {
  if (status === 'passed') return 'PASS';
  if (status === 'skipped') return 'NOT RUN';
  return 'FAIL';
}

/** The two attachment kinds the report accepts, and nothing else. */
const ALLOWED = [
  { kind: 'screenshot', name: 'screenshot', contentType: 'image/png', signature: 'png', label: 'Screenshot' },
  { kind: 'video', name: 'video', contentType: 'video/webm', signature: 'webm', label: 'Video' },
] as const;

/**
 * Selects the attachments that may enter the report: failure screenshots, and
 * the test's video — for any outcome — when the policy allows video. Each must
 * pass every check of the AttachmentGate. Everything else Playwright attaches —
 * error-context.md, traces, anything new — is ignored by construction: this is
 * an allow-list, not a deny-list.
 *
 * Files are named after the Test Case: `TC-…png`, `TC-…webm`, then `TC-…-2.png`
 * for a second one (a test with two pages records two videos).
 */
export function selectAttachments(
  raw: RawTestResult,
  baseName: string,
  gate: AttachmentGate,
): { attachments: ReportAttachment[]; copies: AttachmentCopy[] } {
  const attachments: ReportAttachment[] = [];
  const copies: AttachmentCopy[] = [];
  const counts = { screenshot: 0, video: 0 };

  for (const entry of raw.attachments) {
    const rule = ALLOWED.find((allowed) => allowed.name === entry.name && allowed.contentType === entry.contentType);
    if (!rule || !entry.path) continue;
    if (rule.kind === 'video' && !gate.videoAllowed) continue;
    if (!gate.fileExists(entry.path) || !gate.isInsideOutput(entry.path)) continue;
    if (gate.signatureOf(entry.path) !== rule.signature) continue;

    const n = ++counts[rule.kind];
    const to = `attachments/${baseName}${n === 1 ? '' : `-${n}`}.${rule.signature}`;
    attachments.push({ kind: rule.kind, path: to, label: n === 1 ? rule.label : `${rule.label} ${n}` });
    copies.push({ from: entry.path, to });
  }

  return { attachments, copies };
}

function buildSteps(
  raw: RawTestResult,
  testCase: TestCaseRecord | null,
  status: ExecutionStatus,
  failedActual: string,
): { steps: StepResult[]; failedStep: number | null } {
  const executed = new Map<number, RawStep & { action: string }>();
  for (const step of raw.steps) {
    const match = STEP_TITLE.exec(step.title);
    if (match) executed.set(Number(match[1]), { ...step, action: clean(match[2] ?? '') });
  }

  const failed = [...executed.entries()].find(([, step]) => step.error !== null);
  const failedStep = failed ? failed[0] : null;

  const notExecuted =
    status === 'NOT RUN'
      ? 'Not executed — the test was not run.'
      : status === 'FAIL'
        ? 'Not executed — an earlier failure stopped the test.'
        : 'Not executed — the spec has no step for this Test Case step.';

  const rows: StepResult[] = [];
  const planned = testCase
    ? testCase.steps.map((step) => ({ index: step.index, action: step.action, expected: step.expected }))
    : [...executed.entries()].map(([index, step]) => ({ index, action: step.action, expected: NOT_APPLICABLE }));

  for (const step of planned) {
    const run = executed.get(step.index);
    if (!run) {
      rows.push({ ...step, status: 'NOT EXECUTED', actual: notExecuted, durationMs: null });
    } else if (run.error !== null) {
      rows.push({ ...step, status: 'FAIL', actual: failedActual, durationMs: run.durationMs });
    } else {
      rows.push({
        ...step,
        status: 'PASS',
        actual: 'Passed — every action and assertion in this step succeeded.',
        durationMs: run.durationMs,
      });
    }
  }

  // A spec step the Test Case does not have is shown, never hidden.
  if (testCase) {
    for (const [index, run] of executed) {
      if (testCase.steps.some((step) => step.index === index)) continue;
      rows.push({
        index,
        action: `${run.action} (not in the Test Case)`,
        expected: NOT_APPLICABLE,
        status: run.error !== null ? 'FAIL' : 'PASS',
        actual: run.error !== null ? failedActual : 'Passed.',
        durationMs: run.durationMs,
      });
    }
  }

  return { steps: rows.sort((a, b) => a.index - b.index), failedStep };
}

function buildFailure(raw: RawTestResult, testCase: TestCaseRecord | null, failedStep: number | null): FailureDetail {
  const stepError = raw.steps.find((step) => step.error !== null)?.error ?? null;
  const error = clean([...raw.errors, ...(raw.errors.length === 0 && stepError ? [stepError] : [])].join('\n\n'));
  const { classification, note } = classifyFailure(error, failedStep !== null);
  const expected =
    failedStep !== null
      ? (testCase?.steps.find((step) => step.index === failedStep)?.expected ?? NOT_APPLICABLE)
      : NOT_APPLICABLE;

  return {
    reason: firstLine(error) || 'The test failed without an error message.',
    error,
    expected,
    actual: extractActual(error) || 'Not determined — see the error.',
    classification,
    classificationNote: note,
  };
}

function bugCandidateFor(
  id: string,
  result: TestCaseResult,
  testCase: TestCaseRecord,
  runId: string,
  environment: ReportEnvironment,
): BugCandidate {
  const failure = result.failure!;
  const prefix = `[${testCase.project}][${testCase.module}][${testCase.featurePage}]`;
  const scenario = testCase.title.startsWith(prefix) ? testCase.title.slice(prefix.length).trim() : testCase.title;
  const where = result.failedStep !== null ? `Step ${result.failedStep}` : 'setup';
  const reproduce = testCase.steps
    .filter((step) => result.failedStep === null || step.index <= result.failedStep)
    .map((step) => step.action);

  return {
    id,
    title: `${prefix} ${scenario} — fails at ${where}`,
    description:
      `Automated run ${runId} of ${result.testCaseId} failed at ${where}. ` +
      `The Test Case expects: "${failure.expected}". Observed: ${failure.actual} ` +
      'Classified PRODUCT_BUG automatically and provisionally — a human must confirm it before anything is published.',
    preconditions: testCase.precondition.map(stripBullet),
    stepsToReproduce: reproduce,
    testData: testCase.testData.map(stripBullet),
    expectedResult: failure.expected,
    actualResult: failure.actual,
    testCaseId: testCase.localId,
    adoId: testCase.adoId,
    userStoryId: result.userStoryId!,
    requirementReference: testCase.requirementReference,
    classification: failure.classification,
    environment,
    attachments: result.attachments,
    status: 'Draft',
  };
}

export function buildReport(input: BuildInput): BuiltReport {
  const results: TestCaseResult[] = [];
  const copies: AttachmentCopy[] = [];
  const bugCandidates: BugCandidate[] = [];

  input.raws.forEach((raw, position) => {
    const testCaseId = annotation(raw, 'test-case');
    const storyText = annotation(raw, 'user-story');
    const userStoryId = storyText && /^\d+$/.test(storyText) ? Number(storyText) : null;
    const adoText = annotation(raw, 'ado-id');
    const testCase = testCaseId && userStoryId !== null ? input.lookupTestCase(userStoryId, testCaseId) : null;

    const status = toStatus(raw.status);
    const baseName = testCaseId ?? `untraced-${position + 1}`;
    const { attachments, copies: own } = selectAttachments(raw, baseName, input.gate);
    copies.push(...own);

    const preliminary = status === 'FAIL' ? buildFailure(raw, testCase, null) : null;
    const { steps, failedStep } = buildSteps(raw, testCase, status, preliminary?.actual ?? '');
    const failure = status === 'FAIL' ? buildFailure(raw, testCase, failedStep) : null;

    const reason =
      status === 'NOT RUN'
        ? clean(annotation(raw, 'skip') ?? 'Skipped.')
        : testCaseId && !testCase
          ? `${testCaseId} was not found in the Test Case artifact of User Story ${userStoryId ?? '?'} — check the spec's annotations.`
          : !testCaseId
            ? 'This spec carries no Test Case annotation (testCaseDetails), so it is not traceable to a Test Case.'
            : null;

    const result: TestCaseResult = {
      testCaseId,
      userStoryId,
      adoId: adoText && /^\d+$/.test(adoText) ? Number(adoText) : (testCase?.adoId ?? null),
      title: testCase?.title ?? clean(raw.title),
      module: testCase?.module ?? null,
      featurePage: testCase?.featurePage ?? null,
      requirementReference: testCase?.requirementReference ?? null,
      specFile: raw.specFile,
      status,
      durationMs: raw.durationMs,
      steps,
      failedStep,
      failure,
      reason,
      attachments,
      bugCandidateId: null,
    };

    // Only a PRODUCT_BUG on a traceable case becomes a Bug Candidate (§9).
    if (failure?.classification === 'PRODUCT_BUG' && testCase && userStoryId !== null) {
      const id = `BUG-${String(bugCandidates.length + 1).padStart(3, '0')}`;
      const withId = { ...result, bugCandidateId: id };
      bugCandidates.push(bugCandidateFor(id, withId, testCase, input.runId, input.environment));
      results.push(withId);
    } else {
      results.push(result);
    }
  });

  for (const entry of input.notAutomated) {
    results.push({
      testCaseId: entry.testCase.localId,
      userStoryId: entry.storyId,
      adoId: entry.testCase.adoId,
      title: entry.testCase.title,
      module: entry.testCase.module,
      featurePage: entry.testCase.featurePage,
      requirementReference: entry.testCase.requirementReference,
      specFile: entry.specFile,
      status: 'NOT AUTOMATED',
      durationMs: null,
      steps: entry.testCase.steps.map((step) => ({
        index: step.index,
        action: step.action,
        expected: step.expected,
        status: 'NOT EXECUTED' as const,
        actual: 'Not executed — this Test Case has no automated spec.',
        durationMs: null,
      })),
      failedStep: null,
      failure: null,
      reason: entry.reason,
      attachments: [],
      bugCandidateId: null,
    });
  }

  const count = (status: ExecutionStatus): number => results.filter((entry) => entry.status === status).length;
  const unique = <T>(values: readonly (T | null)[]): T[] => [...new Set(values.filter((value): value is T => value !== null))];

  return {
    report: {
      runId: input.runId,
      project: input.project,
      userStories: unique(results.map((entry) => entry.userStoryId)).sort((a, b) => a - b),
      modules: unique(results.map((entry) => entry.module)).sort(),
      environment: input.environment,
      startedAt: input.startedAt,
      durationMs: input.durationMs,
      totals: {
        total: results.length,
        pass: count('PASS'),
        fail: count('FAIL'),
        notRun: count('NOT RUN'),
        notAutomated: count('NOT AUTOMATED'),
      },
      results,
      bugCandidates,
    },
    copies,
  };
}
