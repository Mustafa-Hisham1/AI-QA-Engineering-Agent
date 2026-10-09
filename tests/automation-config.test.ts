/**
 * Tests for the automation environment guard and handle resolution
 * (src/automation/config.ts).
 *
 * Every test passes its own environment object, so nothing here reads the real
 * `.env` or a real credential.
 */

import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  AutomationConfigError,
  parseAllowedEnvironments,
  registerEnvironmentSecrets,
  resolveAccountHandle,
  resolveAutomationEnvironment,
  resolveValueHandle,
  type AutomationConfigErrorCode,
} from '../src/automation/config.ts';
import { resolveActiveProject, type ActiveProject } from '../src/projects/active-project.ts';

interface ProfileOptions {
  allowed?: string;
  baseUrlVariable?: string;
}

/** A throwaway project with a minimal profile. Handles are declared by name only. */
function demoProject(options: ProfileOptions = {}): ActiveProject {
  const root = mkdtempSync(join(tmpdir(), 'qa-automation-'));
  mkdirSync(join(root, 'DEMO'));
  writeFileSync(
    join(root, 'DEMO', 'profile.md'),
    [
      '# Project Profile — DEMO',
      '',
      '| Setting | Value |',
      '|---|---|',
      '| Project Key | DEMO |',
      `| Allowed Environments | ${options.allowed ?? 'STG, QA'} |`,
      '| Environment Label Variable | APP_ENV |',
      `| Automation Base URL Variable | ${options.baseUrlVariable ?? 'APP_{ENV}_WEB_URL'} |`,
      '',
      '| Handle | Purpose |',
      '|---|---|',
      '| `DEMO_ACCOUNT` | A valid account |',
      '| `DEMO_CODE` | A single value |',
    ].join('\n'),
    'utf8',
  );
  return resolveActiveProject('DEMO', root);
}

function throwsCode(fn: () => unknown, code: AutomationConfigErrorCode, includes?: string): void {
  throws(fn, (error: unknown) => {
    ok(error instanceof AutomationConfigError, `expected AutomationConfigError, got ${String(error)}`);
    strictEqual(error.code, code);
    const text = [error.message, ...error.details].join('\n');
    if (includes) ok(text.includes(includes), `"${text}" should mention "${includes}"`);
    return true;
  });
}

const STG = { APP_ENV: 'STG', APP_STG_WEB_URL: 'https://app.example.test/login' };

test('resolves the environment from the explicit label and the profile-named URL variable', () => {
  deepStrictEqual(resolveAutomationEnvironment(demoProject(), STG), {
    projectKey: 'DEMO',
    label: 'STG',
    baseUrl: 'https://app.example.test/login',
    host: 'app.example.test',
  });
});

test('{ENV} in the URL variable follows the label, so a label never pairs with another environment\'s host', () => {
  const env = { APP_ENV: 'QA', APP_STG_WEB_URL: 'https://stg.example.test', APP_QA_WEB_URL: 'https://qa.example.test' };

  strictEqual(resolveAutomationEnvironment(demoProject(), env).host, 'qa.example.test');
});

test('PROD is refused even when the profile lists it as allowed', () => {
  // No profile can unblock PROD (invariant 5): the check precedes the allow-list.
  const project = demoProject({ allowed: 'STG, PROD' });

  throwsCode(() => resolveAutomationEnvironment(project, { APP_ENV: 'PROD', APP_PROD_WEB_URL: 'https://x.test' }), 'ENVIRONMENT_NOT_ALLOWED', 'PROD is blocked');
  throwsCode(() => resolveAutomationEnvironment(project, { APP_ENV: 'PRODUCTION', APP_PRODUCTION_WEB_URL: 'https://x.test' }), 'ENVIRONMENT_NOT_ALLOWED');
});

test('a label not on the active project\'s allow-list is refused', () => {
  throwsCode(() => resolveAutomationEnvironment(demoProject(), { APP_ENV: 'UAT', APP_UAT_WEB_URL: 'https://x.test' }), 'ENVIRONMENT_NOT_ALLOWED', 'UAT');
});

test('a profile with no allowed environment refuses every label', () => {
  const project = demoProject({ allowed: '**None configured**' });

  throwsCode(() => resolveAutomationEnvironment(project, STG), 'ENVIRONMENT_NOT_ALLOWED', 'none configured');
});

test('a missing label stops the run instead of being inferred from the URL', () => {
  throwsCode(() => resolveAutomationEnvironment(demoProject(), { APP_STG_WEB_URL: 'https://stg.example.test' }), 'ENVIRONMENT_NOT_CONFIGURED', 'APP_ENV is not set');
});

test('the hostname carries no authority: an allowed label with an alarming host is still that label', () => {
  // §12.1 — the label decides, never the host name, in either direction.
  const env = { APP_ENV: 'STG', APP_STG_WEB_URL: 'https://prod-looking-host.example.test' };

  strictEqual(resolveAutomationEnvironment(demoProject(), env).label, 'STG');
});

test('an unset base URL variable, or a TBD setting, is not configured', () => {
  throwsCode(() => resolveAutomationEnvironment(demoProject(), { APP_ENV: 'STG' }), 'ENVIRONMENT_NOT_CONFIGURED', 'APP_STG_WEB_URL');
  throwsCode(() => resolveAutomationEnvironment(demoProject({ baseUrlVariable: 'TBD' }), STG), 'ENVIRONMENT_NOT_CONFIGURED', 'Automation Base URL Variable');
});

test('a base URL that is not http(s) is refused', () => {
  throwsCode(() => resolveAutomationEnvironment(demoProject(), { APP_ENV: 'STG', APP_STG_WEB_URL: 'file:///etc/hosts' }), 'ENVIRONMENT_NOT_CONFIGURED');
  throwsCode(() => resolveAutomationEnvironment(demoProject(), { APP_ENV: 'STG', APP_STG_WEB_URL: 'not a url' }), 'ENVIRONMENT_NOT_CONFIGURED');
});

test('parseAllowedEnvironments keeps labels and drops prose', () => {
  deepStrictEqual(parseAllowedEnvironments('STG, QA'), ['STG', 'QA']);
  deepStrictEqual(parseAllowedEnvironments('None configured'), []);
  deepStrictEqual(parseAllowedEnvironments(undefined), []);
});

test('an account handle resolves from <HANDLE>_USERNAME and <HANDLE>_PASSWORD', () => {
  const credentials = resolveAccountHandle(demoProject(), 'DEMO_ACCOUNT', {
    DEMO_ACCOUNT_USERNAME: 'demo.user@example.test',
    DEMO_ACCOUNT_PASSWORD: 'not-a-real-password-1',
  });

  deepStrictEqual(credentials, { handle: 'DEMO_ACCOUNT', username: 'demo.user@example.test', password: 'not-a-real-password-1' });
});

test('a single-value handle resolves from <HANDLE>', () => {
  strictEqual(resolveValueHandle(demoProject(), 'DEMO_CODE', { DEMO_CODE: 'AGENCY-001' }), 'AGENCY-001');
});

test('a handle the profile does not declare is refused, even when its variables exist', () => {
  // Never resolve something that merely looks like a handle of this project.
  throwsCode(
    () => resolveAccountHandle(demoProject(), 'OTHER_ACCOUNT', { OTHER_ACCOUNT_USERNAME: 'u', OTHER_ACCOUNT_PASSWORD: 'p' }),
    'HANDLE_NOT_DECLARED',
    'OTHER_ACCOUNT',
  );
});

test('a declared handle with unset variables is TEST_DATA_UNAVAILABLE, naming the variable and never a value', () => {
  const env = { DEMO_ACCOUNT_USERNAME: 'visible.user@example.test' };

  throws(
    () => resolveAccountHandle(demoProject(), 'DEMO_ACCOUNT', env),
    (error: unknown) => {
      ok(error instanceof AutomationConfigError);
      strictEqual(error.code, 'TEST_DATA_UNAVAILABLE');
      ok(error.message.includes('DEMO_ACCOUNT_PASSWORD'));
      ok(!error.message.includes('visible.user@example.test'));
      return true;
    },
  );
});

test('resolved credentials are registered for redaction', () => {
  resolveAccountHandle(demoProject(), 'DEMO_ACCOUNT', {
    DEMO_ACCOUNT_USERNAME: 'redaction.user@example.test',
    DEMO_ACCOUNT_PASSWORD: 'redaction-password-42',
  });

  const error = new AutomationConfigError('ENVIRONMENT_NOT_CONFIGURED', 'leaked redaction-password-42 here', ['and redaction.user@example.test']);
  ok(!error.message.includes('redaction-password-42'));
  ok(!error.details[0]!.includes('redaction.user@example.test'));
});

test('registerEnvironmentSecrets registers every declared handle value and secret-named variable', () => {
  const env = {
    DEMO_ACCOUNT_USERNAME: 'runner.side.user@example.test',
    DEMO_ACCOUNT_PASSWORD: 'runner-side-password-1',
    DEMO_CODE: 'RUNNER-SIDE-CODE-9',
    SOME_API_TOKEN: 'runner-side-token-abcdef',
    APP_STG_WEB_URL: 'https://visible-host.example.test',
  };
  registerEnvironmentSecrets(demoProject(), env);

  const error = new AutomationConfigError('ENVIRONMENT_NOT_CONFIGURED', Object.values(env).join(' | '));
  for (const secret of ['runner.side.user@example.test', 'runner-side-password-1', 'RUNNER-SIDE-CODE-9', 'runner-side-token-abcdef']) {
    ok(!error.message.includes(secret), `${secret} must be redacted`);
  }
  // A base URL is configuration, not a secret: the report records the host verbatim (§12.1).
  ok(error.message.includes('https://visible-host.example.test'));
});
