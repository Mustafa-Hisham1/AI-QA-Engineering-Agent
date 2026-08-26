/**
 * Active Project resolution.
 *
 * The repository holds artifacts for more than one project, so every command
 * and every skill must know which project a request belongs to BEFORE it reads
 * or writes anything.
 *
 * The rule this module exists to enforce: **the active project is explicit or
 * the run stops.** It is never inferred from a story ID, never guessed from
 * which project directory happens to contain a similarly-named file, and never
 * defaulted to whichever project came first. Guessing here would point an
 * execution at the wrong application, or publish one project's Test Cases into
 * another project's Azure DevOps board — both silent, both expensive.
 *
 * The single-project case is the one deliberate convenience: when exactly one
 * project profile exists there is nothing to disambiguate, so that project is
 * used. As soon as a second profile appears, ambiguity becomes an error.
 *
 * This module has no Azure DevOps knowledge.
 *
 * ENVIRONMENT ACCESS (invariant 7)
 * -------------------------------
 * This module reads exactly one environment variable, `QA_ACTIVE_PROJECT`, and
 * it is **not a credential** — it is a directory name under `docs/projects`,
 * safe to print and printed by design so a run says which project it acted on.
 *
 * It reads **no secret of any kind**. Credentials remain exclusive to
 * `src/ado/config.ts`, which is still the only module that may read a PAT or any
 * other secret from the environment. Nothing here resolves a test-data handle to
 * its value; handles are resolved at execution time and never persisted.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Joins path segments with forward slashes on every platform.
 *
 * These paths are written into artifacts and printed in reports that are read
 * and diffed across machines, so a Windows backslash would make the same
 * location look like two different ones in review.
 */
function joinPosix(...segments: readonly string[]): string {
  return segments.join('/').replace(/\\/g, '/').replace(/\/+/g, '/');
}

/** Root of the per-project artifact tree. */
export const PROJECTS_ROOT = 'docs/projects';

/** Environment variable naming the active project, when one is set. */
export const ACTIVE_PROJECT_VAR = 'QA_ACTIVE_PROJECT';

/** Raised when the active project cannot be established safely. */
export class ProjectError extends Error {
  readonly details: readonly string[];

  constructor(message: string, details: readonly string[] = []) {
    super(message);
    this.name = 'ProjectError';
    this.details = details;
  }
}

/** How the active project was determined, so output can show it. */
export type ProjectSource = 'explicit' | 'environment' | 'sole-project';

export interface ActiveProject {
  /** Directory name under docs/projects, e.g. `NBO`. */
  readonly key: string;
  /** Absolute-from-repo-root path to the project directory. */
  readonly root: string;
  /** Path to the project profile. */
  readonly profilePath: string;
  readonly source: ProjectSource;
}

/**
 * A project key must be a plain directory name.
 *
 * Rejecting separators and `..` is what stops a supplied key from escaping the
 * projects root and reading an unrelated part of the filesystem.
 */
const VALID_KEY = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function assertValidKey(key: string): void {
  if (!VALID_KEY.test(key)) {
    throw new ProjectError(`"${key}" is not a valid project key.`, [
      'A project key is a directory name under docs/projects, such as NBO or NDC-CORE.',
      'Letters, digits, dot, dash and underscore only — no path separators.',
    ]);
  }
}

/** Lists the project keys that actually have a profile on disk. */
export function listProjectKeys(root: string = PROJECTS_ROOT): readonly string[] {
  if (!existsSync(root)) return [];

  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(root, name, 'profile.md')))
    .sort();
}

function describeChoices(keys: readonly string[]): readonly string[] {
  if (keys.length === 0) {
    return [`No project profile found under ${PROJECTS_ROOT}/<KEY>/profile.md.`];
  }
  return [`Available projects: ${keys.join(', ')}`];
}

/**
 * Resolves the active project.
 *
 * Precedence — most explicit first:
 *   1. `explicitKey` (a `--project` flag, or the key a skill was told).
 *   2. `QA_ACTIVE_PROJECT` in the environment.
 *   3. The sole project, when exactly one profile exists.
 *
 * @throws {ProjectError} when no project is named and the choice is ambiguous,
 *                        or when the named project has no profile.
 */
export function resolveActiveProject(
  explicitKey?: string | null,
  root: string = PROJECTS_ROOT,
): ActiveProject {
  const available = listProjectKeys(root);

  const named = explicitKey?.trim() || process.env[ACTIVE_PROJECT_VAR]?.trim() || null;
  const source: ProjectSource = explicitKey?.trim() ? 'explicit' : 'environment';

  if (named) {
    assertValidKey(named);

    const projectRoot = joinPosix(root, named);
    const profilePath = joinPosix(projectRoot, 'profile.md');

    if (!existsSync(profilePath)) {
      throw new ProjectError(`Project "${named}" has no profile.`, [
        `Expected: ${profilePath}`,
        ...describeChoices(available),
      ]);
    }

    return { key: named, root: projectRoot, profilePath, source };
  }

  // Nothing named. Only a single unambiguous project may be assumed.
  if (available.length === 1) {
    const key = available[0]!;
    const projectRoot = joinPosix(root, key);
    return {
      key,
      root: projectRoot,
      profilePath: joinPosix(projectRoot, 'profile.md'),
      source: 'sole-project',
    };
  }

  if (available.length === 0) {
    throw new ProjectError('No project profile exists, so there is nothing to work on.', [
      ...describeChoices(available),
      `Create ${PROJECTS_ROOT}/<KEY>/profile.md before running this command.`,
    ]);
  }

  // Several projects exist and none was named. Stop — never pick one.
  throw new ProjectError('The active project is ambiguous and must be stated explicitly.', [
    ...describeChoices(available),
    '',
    `Pass --project <KEY>, or set ${ACTIVE_PROJECT_VAR}=<KEY>.`,
    'The project is never inferred from a story ID or from file contents.',
  ]);
}

// ---------------------------------------------------------------------------
// Artifact paths
//
// Every per-story artifact lives under the owning project, so two projects can
// never write into the same directory.
// ---------------------------------------------------------------------------

export function requirementsDirFor(project: ActiveProject, storyId: number): string {
  return joinPosix(project.root, 'requirements', `US-${storyId}`);
}

export function testCasesPathFor(project: ActiveProject, storyId: number): string {
  return joinPosix(project.root, 'test-cases', `US-${storyId}`, 'test-cases.md');
}

export function executionsDirFor(project: ActiveProject, storyId: number): string {
  return joinPosix(project.root, 'executions', `US-${storyId}`);
}

// ---------------------------------------------------------------------------
// Profile reading
//
// The profile is Markdown a human maintains and a skill reads. Only the small
// machine-checked header is parsed here; the prose is for the agent to read.
// Deliberately hand-parsed — a config framework would be a new dependency for
// what is a handful of `key: value` lines (invariant 8).
// ---------------------------------------------------------------------------

/** A `Key | Value` row from the profile's settings table. */
const SETTING_ROW = /^\|\s*([A-Za-z][A-Za-z0-9 /._-]*?)\s*\|\s*(.*?)\s*\|\s*$/;

function cleanValue(value: string): string {
  return value.replace(/^`+|`+$/g, '').replace(/^\*\*|\*\*$/g, '').trim();
}

/**
 * Reads the profile's settings table into a map.
 *
 * Values are returned verbatim for the caller to interpret. This function
 * deliberately does not validate the profile's contents: the skills state the
 * rules, and a missing setting must surface as "not configured" at the point of
 * use rather than as a parse error here.
 */
export function readProfileSettings(project: ActiveProject): ReadonlyMap<string, string> {
  let text: string;
  try {
    text = readFileSync(project.profilePath, 'utf8');
  } catch (error) {
    throw new ProjectError(`Could not read the profile for "${project.key}".`, [
      project.profilePath,
      error instanceof Error ? error.message : String(error),
    ]);
  }

  const settings = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const match = SETTING_ROW.exec(line);
    if (!match) continue;

    const key = match[1]!.trim();
    const value = cleanValue(match[2]!);
    // Skip the table's own header and divider rows.
    if (!key || key === 'Setting' || /^-+$/.test(key)) continue;
    if (!settings.has(key)) settings.set(key, value);
  }

  return settings;
}

/** Renders the active project for command output. Never prints secrets. */
export function describeActiveProject(project: ActiveProject): string {
  const via = {
    explicit: 'named explicitly',
    environment: `from ${ACTIVE_PROJECT_VAR}`,
    'sole-project': 'the only project in this repository',
  }[project.source];

  return `${project.key} (${via})`;
}
