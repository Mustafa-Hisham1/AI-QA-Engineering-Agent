/**
 * Configuration loading for the Azure DevOps integration.
 *
 * Secrets live in the environment (loaded from a gitignored `.env`), never in
 * source. This module is the only place that reads them; the rest of the
 * integration receives an AdoConfig and never touches `process.env`.
 */

import { resolve } from 'node:path';

import { AdoError, registerSecret } from './errors.ts';

export interface AdoConfig {
  /** Normalised organisation URL, no trailing slash. */
  readonly orgUrl: string;
  /** Organisation name derived from the URL, for display only. */
  readonly orgName: string;
  readonly project: string;
  /** READ-ONLY personal access token. Never logged, never serialised. */
  readonly pat: string;
  readonly timeoutMs: number;
  readonly maxAttempts: number;
}

const REQUIRED_VARS = ['ADO_ORG_URL', 'ADO_PROJECT', 'ADO_PAT_READ'] as const;

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_ATTEMPTS = 3;

/** Outcome of trying to load `.env`, so failures can be reported precisely. */
type EnvFileStatus =
  | { readonly kind: 'loaded'; readonly path: string }
  | { readonly kind: 'absent'; readonly path: string }
  | { readonly kind: 'unreadable'; readonly path: string; readonly reason: string };

/**
 * Loads `.env` from the project root.
 *
 * A missing file is not an error — variables may come from the real environment
 * instead. But a file that exists and cannot be parsed must never be swallowed:
 * silently ignoring it makes a load failure look identical to unset variables,
 * which sends people debugging the wrong layer.
 */
function loadDotEnv(): EnvFileStatus {
  const path = resolve(process.cwd(), '.env');

  try {
    process.loadEnvFile(path);
    return { kind: 'loaded', path };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      return { kind: 'absent', path };
    }
    return {
      kind: 'unreadable',
      path,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/** How a required variable is failing — the distinction drives the remediation. */
type VarState = 'ok' | 'unset' | 'empty';

function classifyVar(name: string): VarState {
  const raw = process.env[name];
  if (raw === undefined) return 'unset';
  return raw.trim() ? 'ok' : 'empty';
}

function describeEnvFile(status: EnvFileStatus): string {
  switch (status.kind) {
    case 'loaded':
      return `.env: loaded from ${status.path}`;
    case 'absent':
      return `.env: no file at ${status.path} (values must come from the environment)`;
    case 'unreadable':
      return `.env: found at ${status.path} but could not be read`;
  }
}

/** Remediation tailored to what actually went wrong. */
function buildConfigHint(status: EnvFileStatus, hasEmpty: boolean, hasUnset: boolean): string {
  if (status.kind === 'absent') {
    return 'Create a .env file in the project root (copy .env.example) and set the variable(s) above. .env is gitignored and stays on this machine.';
  }

  if (hasEmpty && !hasUnset) {
    return 'The .env file loaded correctly, but these variables have no value yet — this is the unedited template. Open .env and put a real value after each "=" sign.';
  }

  if (hasEmpty) {
    return 'Open .env and set a real value after "=" for every variable listed above.';
  }

  return 'Add the variable(s) above to your .env file, each as NAME=value.';
}

function readVar(name: string): string | undefined {
  const raw = process.env[name];
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function readNumericVar(name: string, fallback: number): number {
  const raw = readVar(name);
  if (raw === undefined) return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new AdoError('CONFIG_INVALID', `${name} must be a positive number (got "${raw}").`, {
      hint: `Remove ${name} from .env to use the default of ${fallback}.`,
    });
  }
  return parsed;
}

/**
 * Extracts the organisation name for display.
 * Supports both `dev.azure.com/{org}` and legacy `{org}.visualstudio.com`.
 */
function deriveOrgName(url: URL): string {
  const firstSegment = url.pathname.split('/').filter(Boolean)[0];
  if (firstSegment) return firstSegment;

  const [subdomain] = url.hostname.split('.');
  return subdomain ?? url.hostname;
}

function parseOrgUrl(value: string): { orgUrl: string; orgName: string } {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new AdoError('CONFIG_INVALID', `ADO_ORG_URL is not a valid URL: "${value}"`, {
      hint: 'Expected something like https://dev.azure.com/my-organization',
    });
  }

  if (url.protocol !== 'https:') {
    throw new AdoError('CONFIG_INVALID', `ADO_ORG_URL must use https (got "${url.protocol}").`, {
      hint: 'Expected something like https://dev.azure.com/my-organization',
    });
  }

  const orgName = deriveOrgName(url);
  if (!orgName) {
    throw new AdoError('CONFIG_INVALID', `Could not determine the organisation from ADO_ORG_URL.`, {
      hint: 'Expected https://dev.azure.com/<organization> or https://<organization>.visualstudio.com',
    });
  }

  return { orgUrl: `${url.origin}${url.pathname}`.replace(/\/+$/, ''), orgName };
}

/**
 * Loads and validates Azure DevOps configuration.
 *
 * @throws {AdoError} CONFIG_MISSING when required variables are absent,
 *                    CONFIG_INVALID when a value is malformed.
 */
export function loadConfig(): AdoConfig {
  const envFile = loadDotEnv();

  // A .env that exists but cannot be parsed is a distinct failure from unset
  // variables, and must be reported as such.
  if (envFile.kind === 'unreadable') {
    throw new AdoError('CONFIG_INVALID', `Could not read ${envFile.path}`, {
      details: [envFile.reason],
      hint: 'Check the file is valid UTF-8 in NAME=value format, and that this account can read it.',
    });
  }

  const states = REQUIRED_VARS.map((name) => ({ name, state: classifyVar(name) }));
  const problems = states.filter((entry) => entry.state !== 'ok');

  if (problems.length > 0) {
    const hasEmpty = problems.some((entry) => entry.state === 'empty');
    const hasUnset = problems.some((entry) => entry.state === 'unset');

    // Distinguishing "not set" from "set but empty" is the whole point here:
    // reporting both as "missing" points the reader at config loading when the
    // real problem is an unfilled value.
    const summary = hasEmpty && !hasUnset ? 'present but empty' : 'not usable';

    throw new AdoError('CONFIG_MISSING', `Required Azure DevOps configuration is ${summary}.`, {
      details: [
        describeEnvFile(envFile),
        '',
        ...problems.map(
          (entry) =>
            `${entry.name.padEnd(14)} ${entry.state === 'empty' ? 'present but empty (no value after "=")' : 'not set'}`,
        ),
      ],
      hint: buildConfigHint(envFile, hasEmpty, hasUnset),
    });
  }

  // Non-null assertions are safe: the missing-variable check above guarantees presence.
  const { orgUrl, orgName } = parseOrgUrl(readVar('ADO_ORG_URL')!);
  const pat = readVar('ADO_PAT_READ')!;

  // Register before any request is made, so a leak is impossible from here on.
  registerSecret(pat);

  return {
    orgUrl,
    orgName,
    project: readVar('ADO_PROJECT')!,
    pat,
    timeoutMs: readNumericVar('ADO_TIMEOUT_MS', DEFAULT_TIMEOUT_MS),
    maxAttempts: readNumericVar('ADO_MAX_ATTEMPTS', DEFAULT_MAX_ATTEMPTS),
  };
}

/** Config safe to print or serialise. Deliberately omits the PAT. */
export function describeConfig(config: AdoConfig): Record<string, string> {
  return {
    organization: config.orgName,
    organizationUrl: config.orgUrl,
    project: config.project,
    credential: 'ADO_PAT_READ (loaded, not displayed)',
  };
}
