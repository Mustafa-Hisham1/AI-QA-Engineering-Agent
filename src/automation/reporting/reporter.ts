/**
 * The Playwright reporter that writes the QA execution report
 * (`docs/product-decisions.md` §7.2). Registered by `playwright.config.ts`
 * beside the `list` console reporter, so every run — through
 * `npm run automation:test` or a bare `npx playwright test` — produces one
 * report, and no spec has any reporting responsibility.
 *
 * Runs in Playwright's runner process. It collects raw results per test, then,
 * once the run ends: registers the environment's credential values for
 * redaction, joins the results with the Test Case artifact, finds the in-scope
 * cases that have no spec, builds the report, and writes the run directory.
 *
 * A reporting failure never fails the run: the test results stand, and the
 * reason is printed (sanitised).
 */

import { closeSync, existsSync, openSync, readFileSync, readSync } from 'node:fs';
import { relative } from 'node:path';

import type { FullConfig, FullResult, Reporter, TestCase, TestResult, TestStep } from '@playwright/test/reporter';

import { resolveActiveProject } from '../../projects/active-project.ts';
import { ArtifactError, artifactPathFor, parseArtifact } from '../../testcases/artifact.ts';
import type { TestCaseArtifact, TestCaseRecord } from '../../testcases/model.ts';
import { REPORT_ROOT, VIDEO_ALLOWED } from '../artifact-policy.ts';
import { AutomationConfigError, registerEnvironmentSecrets, resolveAutomationEnvironment } from '../config.ts';
import { sanitizeText } from '../sanitizer.ts';
import { buildReport, insideAny, signatureOfBytes, type FileSignature, type RawStep, type RawTestResult } from './build.ts';
import type { ReportEnvironment } from './model.ts';
import { findNotAutomated } from './not-automated.ts';
import { nextRunId, writeReport } from './writer.ts';

export interface ExecutionReporterOptions {
  /** The active project, pinned by the config. */
  readonly projectKey: string;
  /** Defaults to docs/projects. The artifact check points it at its own fixture project. */
  readonly projectsRoot?: string;
  /** Defaults to REPORT_ROOT. */
  readonly outputRoot?: string;
}

function posix(path: string): string {
  return path.replace(/\\/g, '/');
}

function collectSteps(steps: readonly TestStep[], into: RawStep[]): void {
  for (const step of steps) {
    if (step.category === 'test.step') {
      into.push({ title: step.title, durationMs: step.duration, error: step.error?.message ?? step.error?.value ?? null });
    }
    collectSteps(step.steps, into);
  }
}

/** Reads a file's first bytes to identify it; null for anything unreadable or unknown. */
function readSignature(path: string): FileSignature | null {
  try {
    const fd = openSync(path, 'r');
    try {
      const head = new Uint8Array(8);
      readSync(fd, head, 0, head.length, 0);
      return signatureOfBytes(head);
    } finally {
      closeSync(fd);
    }
  } catch {
    return null;
  }
}

export default class ExecutionReporter implements Reporter {
  private readonly options: ExecutionReporterOptions;
  private readonly raws: RawTestResult[] = [];
  private startedAt = new Date();
  /** Playwright output directories: the only place an attachment may be copied from. */
  private outputDirs: string[] = [];

  constructor(options: ExecutionReporterOptions) {
    this.options = options;
  }

  printsToStdio(): boolean {
    return false;
  }

  onBegin(config: FullConfig): void {
    this.startedAt = new Date();
    this.outputDirs = config.projects.map((project) => project.outputDir);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const steps: RawStep[] = [];
    collectSteps(result.steps, steps);

    this.raws.push({
      title: test.title,
      specFile: posix(relative(process.cwd(), test.location.file)),
      annotations: [...test.annotations, ...result.annotations],
      status: result.status,
      durationMs: result.duration,
      steps,
      errors: result.errors.map((error) => error.message ?? error.value ?? ''),
      attachments: result.attachments.map((entry) => ({ name: entry.name, contentType: entry.contentType, path: entry.path ?? null })),
    });
  }

  onEnd(result: FullResult): void {
    if (this.raws.length === 0) return;

    try {
      const htmlPath = this.write(result.duration);
      console.log(`\nExecution report: ${posix(htmlPath)}`);
    } catch (error) {
      console.error(`\nExecution report NOT written: ${sanitizeText(error instanceof Error ? error.message : String(error))}`);
    }
  }

  private write(durationMs: number): string {
    const project = resolveActiveProject(this.options.projectKey, this.options.projectsRoot);
    registerEnvironmentSecrets(project);

    let environment: ReportEnvironment;
    try {
      const resolved = resolveAutomationEnvironment(project);
      environment = { label: resolved.label, host: resolved.host };
    } catch (error) {
      if (!(error instanceof AutomationConfigError)) throw error;
      environment = { label: 'NOT CONFIGURED', host: '—' };
    }

    const storyIds = new Set<number>();
    for (const raw of this.raws) {
      const story = raw.annotations.find((entry) => entry.type === 'user-story')?.description;
      if (story && /^\d+$/.test(story)) storyIds.add(Number(story));
    }

    const artifacts = new Map<number, TestCaseArtifact>();
    for (const storyId of storyIds) {
      try {
        artifacts.set(storyId, parseArtifact(artifactPathFor(project.root, storyId), storyId));
      } catch (error) {
        if (!(error instanceof ArtifactError)) throw error;
        // Reported per test as "not found in the Test Case artifact".
      }
    }

    const lookupTestCase = (storyId: number, testCaseId: string): TestCaseRecord | null =>
      artifacts.get(storyId)?.testCases.find((entry) => entry.localId === testCaseId) ?? null;

    const executedIds = new Set(
      this.raws.map((raw) => raw.annotations.find((entry) => entry.type === 'test-case')?.description).filter((id): id is string => !!id),
    );

    const notAutomated = findNotAutomated(project, [...artifacts.values()], executedIds, existsSync, (path) =>
      existsSync(path) ? readFileSync(path, 'utf8') : null,
    );

    const projectRoot = `${this.options.outputRoot ?? REPORT_ROOT}/${project.key}`;
    const runId = nextRunId(projectRoot);

    const built = buildReport({
      runId,
      project: project.key,
      environment,
      startedAt: this.startedAt.toISOString(),
      durationMs,
      raws: this.raws,
      lookupTestCase,
      notAutomated,
      gate: {
        videoAllowed: VIDEO_ALLOWED,
        fileExists: existsSync,
        isInsideOutput: (path) => insideAny(this.outputDirs, path),
        signatureOf: readSignature,
      },
    });

    return writeReport(`${projectRoot}/${runId}`, built);
  }
}
