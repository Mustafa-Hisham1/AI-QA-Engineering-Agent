/**
 * Tests for Active Project resolution.
 *
 * The behaviour under test is mostly REFUSAL: with more than one project in the
 * repository, the agent must stop rather than pick one. A wrong guess here runs
 * an execution against the wrong application, or publishes one project's Test
 * Cases onto another project's board — silently, in both directions.
 */

import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  ACTIVE_PROJECT_VAR,
  ProjectError,
  describeActiveProject,
  listProjectKeys,
  readProfileSettings,
  resolveActiveProject,
  testCasesPathFor,
} from '../src/projects/active-project.ts';

/** Builds a throwaway projects root containing the named projects. */
function projectsRoot(keys: readonly string[], profileBody = '# Profile\n'): string {
  const root = mkdtempSync(join(tmpdir(), 'qa-projects-'));
  for (const key of keys) {
    mkdirSync(join(root, key), { recursive: true });
    writeFileSync(join(root, key, 'profile.md'), profileBody, 'utf8');
  }
  return root;
}

/** Runs `fn` with QA_ACTIVE_PROJECT set to `value`, then restores it. */
function withEnv(value: string | undefined, fn: () => void): void {
  const previous = process.env[ACTIVE_PROJECT_VAR];
  if (value === undefined) delete process.env[ACTIVE_PROJECT_VAR];
  else process.env[ACTIVE_PROJECT_VAR] = value;

  try {
    fn();
  } finally {
    if (previous === undefined) delete process.env[ACTIVE_PROJECT_VAR];
    else process.env[ACTIVE_PROJECT_VAR] = previous;
  }
}

test('listProjectKeys returns only directories that actually carry a profile', () => {
  const root = projectsRoot(['NBO', 'NDC-CORE']);
  // A directory without a profile is not a project.
  mkdirSync(join(root, 'scratch'), { recursive: true });

  deepStrictEqual(listProjectKeys(root), ['NBO', 'NDC-CORE']);
});

test('listProjectKeys is empty when no projects exist', () => {
  deepStrictEqual(listProjectKeys(join(tmpdir(), 'no-such-projects-root')), []);
});

test('an explicit key wins and is reported as explicit', () => {
  const root = projectsRoot(['NBO', 'NDC-CORE']);

  withEnv(undefined, () => {
    const project = resolveActiveProject('NDC-CORE', root);
    strictEqual(project.key, 'NDC-CORE');
    strictEqual(project.source, 'explicit');
  });
});

test('an explicit key overrides the environment variable', () => {
  const root = projectsRoot(['NBO', 'NDC-CORE']);

  withEnv('NBO', () => {
    strictEqual(resolveActiveProject('NDC-CORE', root).key, 'NDC-CORE');
  });
});

test('the environment variable is used when no key is passed', () => {
  const root = projectsRoot(['NBO', 'NDC-CORE']);

  withEnv('NBO', () => {
    const project = resolveActiveProject(null, root);
    strictEqual(project.key, 'NBO');
    strictEqual(project.source, 'environment');
  });
});

test('AMBIGUOUS: several projects and no key named must stop, never guess', () => {
  const root = projectsRoot(['NBO', 'NDC-CORE']);

  withEnv(undefined, () => {
    throws(
      () => resolveActiveProject(null, root),
      (error: unknown) => {
        ok(error instanceof ProjectError);
        ok(error.message.includes('ambiguous'));
        // The operator must be told what the real choices are.
        ok(error.details.some((d) => d.includes('NBO') && d.includes('NDC-CORE')));
        return true;
      },
    );
  });
});

test('a sole project is used without a key, because nothing is ambiguous', () => {
  const root = projectsRoot(['NBO']);

  withEnv(undefined, () => {
    const project = resolveActiveProject(null, root);
    strictEqual(project.key, 'NBO');
    strictEqual(project.source, 'sole-project');
  });
});

test('adding a second project turns a previously-safe default into an error', () => {
  // This is the regression that matters when NDC Core is onboarded: code that
  // worked while NBO stood alone must NOT silently keep choosing NBO.
  const single = projectsRoot(['NBO']);
  const dual = projectsRoot(['NBO', 'NDC-CORE']);

  withEnv(undefined, () => {
    strictEqual(resolveActiveProject(null, single).key, 'NBO');
    throws(() => resolveActiveProject(null, dual), ProjectError);
  });
});

test('a named project with no profile is an error, not a fallback to another', () => {
  const root = projectsRoot(['NBO']);

  withEnv(undefined, () => {
    throws(
      () => resolveActiveProject('NDC-CORE', root),
      (error: unknown) => {
        ok(error instanceof ProjectError);
        ok(error.message.includes('has no profile'));
        return true;
      },
    );
  });
});

test('no projects at all is an error rather than an empty default', () => {
  const root = projectsRoot([]);

  withEnv(undefined, () => {
    throws(() => resolveActiveProject(null, root), ProjectError);
  });
});

test('a key containing path separators is rejected', () => {
  const root = projectsRoot(['NBO']);

  for (const bad of ['../secrets', 'NBO/../..', 'a/b', '..']) {
    withEnv(undefined, () => {
      throws(
        () => resolveActiveProject(bad, root),
        (error: unknown) => {
          ok(error instanceof ProjectError);
          ok(error.message.includes('not a valid project key'));
          return true;
        },
        `"${bad}" must be rejected`,
      );
    });
  }
});

test('artifact paths are scoped to the resolved project', () => {
  const root = projectsRoot(['NBO', 'NDC-CORE']);

  withEnv(undefined, () => {
    const nbo = testCasesPathFor(resolveActiveProject('NBO', root), 53717);
    const ndc = testCasesPathFor(resolveActiveProject('NDC-CORE', root), 53717);

    ok(nbo.includes('NBO'));
    ok(ndc.includes('NDC-CORE'));
    ok(nbo !== ndc);
  });
});

test('readProfileSettings reads the settings table and ignores headers', () => {
  const body = [
    '# NBO',
    '',
    '| Setting | Value |',
    '|---|---|',
    '| Project Key | NBO |',
    '| Tracker Project | `NBO` |',
    '| Allowed Environments | STG |',
    '',
    'Prose that is not a table row.',
  ].join('\n');

  const root = projectsRoot(['NBO'], body);
  const settings = readProfileSettings(resolveActiveProject('NBO', root));

  strictEqual(settings.get('Project Key'), 'NBO');
  strictEqual(settings.get('Tracker Project'), 'NBO');
  strictEqual(settings.get('Allowed Environments'), 'STG');
  strictEqual(settings.get('Setting'), undefined);
});

test('describeActiveProject says how the project was chosen', () => {
  const root = projectsRoot(['NBO', 'NDC-CORE']);

  withEnv(undefined, () => {
    ok(describeActiveProject(resolveActiveProject('NBO', root)).includes('named explicitly'));
  });
  withEnv('NBO', () => {
    ok(describeActiveProject(resolveActiveProject(null, root)).includes(ACTIVE_PROJECT_VAR));
  });
});
