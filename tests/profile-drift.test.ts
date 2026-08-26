/**
 * Project-profile drift validation.
 *
 * A project's `profile.md` declares the test-data handles that project defines.
 * Its Test Cases reference handles by name. Nothing structural keeps the two in
 * step, so they drift: a new case introduces a handle nobody added to the
 * profile, and the gap only surfaces at execution time as a `BLOCKED` run
 * against a live environment — after a browser has already been started.
 *
 * This suite closes that gap at `npm test` time. It is **project-agnostic**: it
 * discovers whatever projects exist, and asserts nothing about any particular
 * one. It **never invents a handle** — an undeclared handle is reported, never
 * added, because only a human knows whether the profile or the test case is the
 * side that is wrong.
 *
 * Direction matters. A handle used but NOT declared is a real defect: execution
 * would reach for test data the project never defined. The reverse — declared
 * but not yet referenced — is normal and healthy: a profile legitimately
 * describes data before cases consume it, so it is reported for information and
 * never fails the suite.
 */

import { ok } from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { listProjectKeys, readProfileSettings, resolveActiveProject } from '../src/projects/active-project.ts';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const PROJECTS_ROOT = join(REPO_ROOT, 'docs', 'projects');

/**
 * A test-data handle: SCREAMING_SNAKE_CASE with at least one underscore, inside
 * backticks.
 *
 * The underscore requirement is what separates a handle from the other
 * all-caps tokens that legitimately appear in prose — `POST`, `PASS`, `BLOCKED`
 * — without needing a stop-list that would rot.
 */
const HANDLE = /`([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)`/g;

/** Handle-shaped tokens that are vocabulary, not test data. */
const NOT_HANDLES = new Set([
  // Failure classifications (docs/product-decisions.md §9).
  'PRODUCT_BUG',
  'TEST_DATA_ISSUE',
  'ENVIRONMENT_ISSUE',
  'NETWORK_ISSUE',
  'AUTHENTICATION_ISSUE',
  'TEST_SCRIPT_ISSUE',
  'PUBLISH_VERIFICATION_FAILED',
  // Environment variable names. A profile names these; they are configuration,
  // not test data, and are never resolved as handles.
  'ADO_ORG_URL',
  'ADO_PROJECT',
  'ADO_PAT_READ',
  'ADO_PAT_WRITE',
  'ADO_TIMEOUT_MS',
  'ADO_MAX_ATTEMPTS',
  'QA_ACTIVE_PROJECT',
]);

/**
 * Configuration variables a profile names — `APP_ENV`, `APP_<ENV>_<APP>_URL`.
 *
 * These are environment configuration, not test data: they hold a URL or a
 * label, and no Test Case ever resolves one as a handle. Matching by prefix
 * rather than by name keeps this working for a project whose variables nobody
 * has written yet.
 */
const CONFIG_VAR = /^APP_|_URL$/;

function matchHandles(text: string): Set<string> {
  const found = new Set<string>();
  for (const [, handle] of text.matchAll(HANDLE)) {
    if (handle && !NOT_HANDLES.has(handle) && !CONFIG_VAR.test(handle)) found.add(handle);
  }
  return found;
}

/**
 * Extracts handles from the `**Test Data**` blocks of a Test Case artifact.
 *
 * Scoped to those blocks deliberately: a handle named in a step or a note is
 * prose, while the Test Data block is where a case declares what it will
 * actually resolve at execution time. Scanning the whole file would sweep up
 * requirement IDs and story keys.
 */
function handlesUsedInArtifact(filePath: string): Set<string> {
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  const used = new Set<string>();
  let inTestData = false;

  for (const line of lines) {
    if (line.trim() === '**Test Data**') {
      inTestData = true;
      continue;
    }
    // Any other bold section heading closes the block.
    if (inTestData && line.startsWith('**')) inTestData = false;
    if (inTestData) for (const handle of matchHandles(line)) used.add(handle);
  }

  return used;
}

/** Every `test-cases.md` under a project, with the story it belongs to. */
function testCaseArtifacts(projectRoot: string): { storyDir: string; path: string }[] {
  const root = join(projectRoot, 'test-cases');
  if (!existsSync(root)) return [];

  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ storyDir: entry.name, path: join(root, entry.name, 'test-cases.md') }))
    .filter((entry) => existsSync(entry.path));
}

/** Handles the project's profile declares. */
function handlesDeclaredInProfile(profilePath: string): Set<string> {
  return matchHandles(readFileSync(profilePath, 'utf8'));
}

const PROJECT_KEYS = listProjectKeys(PROJECTS_ROOT);

test('the repository has at least one project profile to validate', () => {
  ok(PROJECT_KEYS.length > 0, `no project profile found under ${PROJECTS_ROOT}`);
});

for (const key of PROJECT_KEYS) {
  const project = resolveActiveProject(key, PROJECTS_ROOT);

  test(`${key}: profile is readable and declares its settings`, () => {
    const settings = readProfileSettings(project);

    // Every profile must at least identify itself; without a key, nothing
    // downstream can report which project a result came from.
    ok(settings.get('Project Key'), `${key}: profile has no "Project Key" setting`);
  });

  test(`${key}: every handle used by a Test Case is declared in the profile`, () => {
    const declared = handlesDeclaredInProfile(project.profilePath);
    const artifacts = testCaseArtifacts(project.root);

    const undeclared = new Map<string, string[]>();

    for (const { storyDir, path } of artifacts) {
      for (const handle of handlesUsedInArtifact(path)) {
        if (declared.has(handle)) continue;
        const stories = undeclared.get(handle) ?? [];
        stories.push(storyDir);
        undeclared.set(handle, stories);
      }
    }

    if (undeclared.size > 0) {
      const report = [...undeclared.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([handle, stories]) => `  ${handle}  — used by ${stories.join(', ')}`)
        .join('\n');

      ok(
        false,
        `${key}: ${undeclared.size} test-data handle(s) are used by Test Cases but NOT declared ` +
          `in ${project.profilePath}:\n${report}\n\n` +
          'Execution would treat each as missing test data (BLOCKED / TEST_DATA_ISSUE).\n' +
          'Fix by declaring the handle in the profile, or by correcting the Test Case — ' +
          'a human decides which side is wrong. Do not invent a handle to silence this.',
      );
    }
  });

  test(`${key}: handles declared but not yet used are reported, not failed`, () => {
    const declared = handlesDeclaredInProfile(project.profilePath);
    const used = new Set<string>();
    for (const { path } of testCaseArtifacts(project.root)) {
      for (const handle of handlesUsedInArtifact(path)) used.add(handle);
    }

    const unused = [...declared].filter((handle) => !used.has(handle)).sort();

    // Informational only. A profile may legitimately describe test data before
    // any case consumes it, so this must never fail a build.
    if (unused.length > 0) {
      console.log(`      note: ${key} declares ${unused.length} handle(s) no Test Case references yet:`);
      console.log(`      ${unused.join(', ')}`);
    }

    ok(true);
  });

  test(`${key}: the profile declares no credential values`, () => {
    const text = readFileSync(project.profilePath, 'utf8');

    // A profile names handles and variable NAMES only, never values
    // (invariant 7). An assignment of a secret-looking name is the shape that
    // would leak one.
    const assignment = /\b(PASSWORD|SECRET|TOKEN|PAT|APIKEY|API_KEY)\b\s*[:=]\s*\S+/i;
    const match = assignment.exec(text);

    ok(
      match === null,
      `${key}: the profile appears to assign a credential value (${match?.[0]}). ` +
        'Profiles name handles and variable names only — values live in .env (invariant 7).',
    );
  });
}
