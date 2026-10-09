/**
 * Environment and test-data configuration for deterministic Playwright
 * automation (`docs/product-decisions.md` §7.1).
 *
 * ENVIRONMENT ACCESS (invariant 7)
 * -------------------------------
 * This is the **only** automation module that reads `process.env`, by human
 * decision (2026-10-09). It is the automation counterpart of
 * `src/ado/config.ts`: it reads the application-under-test environment label,
 * its base URL, and test-data handle values — nothing else, and nothing from
 * the tracker. Every resolved credential is registered with `redact()`, every
 * error names a variable or handle and never a value, and nothing here writes a
 * value anywhere.
 *
 * SAFETY
 * ------
 * - **The environment is the explicit label, never the hostname** (§12.1).
 * - **PROD is refused unconditionally** — before the allow-list is consulted,
 *   so no profile can unblock it (invariant 5).
 * - **A label must be on the active project's allow-list.**
 * - **A handle must be declared in the active project's profile**, and resolves
 *   by convention: account handles from `<HANDLE>_USERNAME` /
 *   `<HANDLE>_PASSWORD`, single-value handles from `<HANDLE>`.
 */

import { resolve } from 'node:path';

import { redact, registerSecret } from '../ado/errors.ts';
import { readProfileHandles, readProfileSettings, type ActiveProject } from '../projects/active-project.ts';

/** A read-only view of environment variables. A seam for tests. */
export type EnvSource = Readonly<Record<string, string | undefined>>;

export type AutomationConfigErrorCode =
  /** A required setting or variable is absent. Fix the configuration. */
  | 'ENVIRONMENT_NOT_CONFIGURED'
  /** The label is PROD, or not on the active project's allow-list. */
  | 'ENVIRONMENT_NOT_ALLOWED'
  /** The handle is not declared in the active project's profile. */
  | 'HANDLE_NOT_DECLARED'
  /** The handle is declared, but its variables are unset. BLOCKED, never FAIL. */
  | 'TEST_DATA_UNAVAILABLE';

export class AutomationConfigError extends Error {
  readonly code: AutomationConfigErrorCode;
  readonly details: readonly string[];

  constructor(code: AutomationConfigErrorCode, message: string, details: readonly string[] = []) {
    super(redact(message));
    this.name = 'AutomationConfigError';
    this.code = code;
    this.details = details.map(redact);
  }
}

/** The validated environment one automation run targets. */
export interface AutomationEnvironment {
  readonly projectKey: string;
  /** The explicit label, e.g. `STG`. This — not the host — is the environment. */
  readonly label: string;
  /** Recorded verbatim beside the label, because the two can disagree (§12.1). */
  readonly baseUrl: string;
  readonly host: string;
}

export interface AccountCredentials {
  readonly handle: string;
  readonly username: string;
  readonly password: string;
}

let dotEnvLoaded = false;

/**
 * Loads `.env` once into `process.env` and returns it.
 *
 * Playwright does not load `.env` itself. A missing file is fine — values may
 * come from the real environment — but an unreadable one is an error, because
 * swallowing it makes a load failure look like unset variables.
 */
export function automationEnv(): EnvSource {
  if (!dotEnvLoaded) {
    dotEnvLoaded = true;
    try {
      process.loadEnvFile(resolve(process.cwd(), '.env'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new AutomationConfigError('ENVIRONMENT_NOT_CONFIGURED', '.env exists but could not be read.', [
          error instanceof Error ? error.message : String(error),
        ]);
      }
    }
  }
  return process.env;
}

/**
 * Environment for a child Playwright process, with the active project pinned.
 *
 * The child re-resolves the project from `QA_ACTIVE_PROJECT`, so it acts on
 * exactly the project the parent resolved — never on a guess of its own.
 */
export function playwrightChildEnv(projectKey?: string): NodeJS.ProcessEnv {
  return projectKey ? { ...process.env, QA_ACTIVE_PROJECT: projectKey } : { ...process.env };
}

/**
 * Stops Playwright from capturing a whole-page ARIA snapshot after a failure.
 *
 * Playwright 1.64 writes that snapshot into `error-context.md`, and an ARIA
 * snapshot carries every input's value — including a password the page masks
 * (verified by `npm run automation:verify-artifacts`, 2026-10-09). Called from
 * every Playwright config; worker processes inherit it. The receiver snapshot a
 * failing matcher attaches is a separate path, removed by the `redactErrorContext`
 * fixture in `fixtures.ts`.
 */
export function suppressPageSnapshots(): void {
  process.env['PLAYWRIGHT_NO_COPY_PROMPT'] = '1';
}

/** A setting value the profile actually configured; TBD and empty are "not configured". */
function configured(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || /^TBD\b/i.test(trimmed)) return null;
  return trimmed;
}

const LABEL = /^[A-Z][A-Z0-9_-]*$/;
const VARIABLE = /^[A-Z][A-Z0-9_]*$/;

/** Parses `Allowed Environments` — a comma list of labels. Prose like "None configured" yields none. */
export function parseAllowedEnvironments(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => LABEL.test(entry));
}

/**
 * Resolves and validates the environment automation may target.
 *
 * @throws {AutomationConfigError} unless the label is explicit, not PROD, on the
 *         active project's allow-list, and its base URL variable is set.
 */
export function resolveAutomationEnvironment(project: ActiveProject, env: EnvSource = automationEnv()): AutomationEnvironment {
  const settings = readProfileSettings(project);
  const profile = project.profilePath;

  const labelVar = configured(settings.get('Environment Label Variable'));
  if (!labelVar || !VARIABLE.test(labelVar)) {
    throw new AutomationConfigError('ENVIRONMENT_NOT_CONFIGURED', `${project.key}: no "Environment Label Variable" setting.`, [profile]);
  }

  const label = env[labelVar]?.trim();
  if (!label) {
    throw new AutomationConfigError('ENVIRONMENT_NOT_CONFIGURED', `${labelVar} is not set.`, [
      'Set the environment label explicitly in .env. It is never inferred from a URL or hostname.',
    ]);
  }

  // Checked BEFORE the allow-list, so a profile that lists PROD still cannot
  // reach it (invariant 5).
  if (/^PROD/i.test(label)) {
    throw new AutomationConfigError('ENVIRONMENT_NOT_ALLOWED', `${labelVar}=${label}: PROD is blocked.`, [
      'Automation never runs against PROD, and no project profile can enable it (invariant 5).',
    ]);
  }

  const allowed = parseAllowedEnvironments(settings.get('Allowed Environments'));
  if (!allowed.includes(label)) {
    throw new AutomationConfigError('ENVIRONMENT_NOT_ALLOWED', `${labelVar}=${label} is not allowed for ${project.key}.`, [
      `Allowed: ${allowed.length > 0 ? allowed.join(', ') : 'none configured'} (${profile}).`,
    ]);
  }

  const template = configured(settings.get('Automation Base URL Variable'));
  if (!template) {
    throw new AutomationConfigError('ENVIRONMENT_NOT_CONFIGURED', `${project.key}: no "Automation Base URL Variable" setting.`, [profile]);
  }

  const urlVar = template.replaceAll('{ENV}', label);
  if (!VARIABLE.test(urlVar)) {
    throw new AutomationConfigError('ENVIRONMENT_NOT_CONFIGURED', `"${urlVar}" is not a valid variable name.`, [profile]);
  }

  const rawUrl = env[urlVar]?.trim();
  if (!rawUrl) {
    throw new AutomationConfigError('ENVIRONMENT_NOT_CONFIGURED', `${urlVar} is not set.`, [
      `It holds the ${label} base URL for ${project.key}. Set it in .env.`,
    ]);
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new AutomationConfigError('ENVIRONMENT_NOT_CONFIGURED', `${urlVar} is not a valid URL.`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new AutomationConfigError('ENVIRONMENT_NOT_CONFIGURED', `${urlVar} must be an http(s) URL.`);
  }

  return { projectKey: project.key, label, baseUrl: rawUrl, host: url.host };
}

function assertDeclared(project: ActiveProject, handle: string): void {
  if (!readProfileHandles(project).has(handle)) {
    throw new AutomationConfigError('HANDLE_NOT_DECLARED', `${handle} is not a handle ${project.key} declares.`, [
      `Declare it in ${project.profilePath}, or correct the test. Never borrow another project's handle.`,
    ]);
  }
}

function readVariable(env: EnvSource, handle: string, variable: string): string {
  const value = env[variable];
  if (value === undefined || value === '') {
    throw new AutomationConfigError('TEST_DATA_UNAVAILABLE', `${handle}: ${variable} is not set.`, [
      'Missing test data is BLOCKED / TEST_DATA_ISSUE, never a product failure.',
    ]);
  }
  return value;
}

/**
 * Resolves an account handle from `<HANDLE>_USERNAME` and `<HANDLE>_PASSWORD`,
 * into memory only. Both values are registered for redaction.
 */
export function resolveAccountHandle(project: ActiveProject, handle: string, env: EnvSource = automationEnv()): AccountCredentials {
  assertDeclared(project, handle);
  const username = readVariable(env, handle, `${handle}_USERNAME`);
  const password = readVariable(env, handle, `${handle}_PASSWORD`);
  registerSecret(username);
  registerSecret(password);
  return { handle, username, password };
}

/**
 * Whether an account handle's credentials are configured — WITHOUT resolving
 * or returning them. Used to decide, before a browser starts, whether UI
 * exploration can authenticate. Reports variable names only.
 */
export function accountHandleStatus(
  project: ActiveProject,
  handle: string,
  env: EnvSource = automationEnv(),
): { readonly declared: boolean; readonly missing: readonly string[] } {
  if (!readProfileHandles(project).has(handle)) return { declared: false, missing: [] };
  const missing = [`${handle}_USERNAME`, `${handle}_PASSWORD`].filter((variable) => !env[variable]);
  return { declared: true, missing };
}

/** Variable names whose values are secrets, whatever project they belong to. */
const SECRET_VARIABLE = /PASSWORD|PASSWD|SECRET|TOKEN|_PAT$|_PAT_|API_?KEY/i;

/**
 * Registers every credential value the environment holds for redaction.
 *
 * The HTML report is built in Playwright's runner process, which never
 * resolves a handle, so the worker's redaction registry is not there. This
 * registers the same values up front: every declared handle's variables, and
 * every variable whose name marks it as a secret. Values are never returned.
 */
export function registerEnvironmentSecrets(project: ActiveProject, env: EnvSource = automationEnv()): void {
  for (const handle of readProfileHandles(project)) {
    for (const variable of [handle, `${handle}_USERNAME`, `${handle}_PASSWORD`]) registerSecret(env[variable]);
  }
  for (const [name, value] of Object.entries(env)) {
    if (SECRET_VARIABLE.test(name)) registerSecret(value);
  }
}

/** Resolves a single-value handle from `<HANDLE>`, into memory only. */
export function resolveValueHandle(project: ActiveProject, handle: string, env: EnvSource = automationEnv()): string {
  assertDeclared(project, handle);
  const value = readVariable(env, handle, handle);
  registerSecret(value);
  return value;
}
