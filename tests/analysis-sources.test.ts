/**
 * Tests for the sources of a Requirement Analysis (src/analysis/sources.ts):
 * the four source combinations, optional sources never blocking, the UI
 * exploration decision, provenance round-trips, change detection, and the
 * unchanged story fingerprint.
 */

import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { readApiSpec } from '../src/analysis/api-spec.ts';
import {
  decideUiExploration,
  findSourceChanges,
  loadApiSource,
  parseRecordedSources,
  renderSourceCoverageRows,
  renderSourceProvenanceRows,
  type ApiSourceStatus,
  type UiDecision,
} from '../src/analysis/sources.ts';
import { computeContentFingerprint, type UserStory } from '../src/ado/user-story.ts';
import { resolveActiveProject, type ActiveProject } from '../src/projects/active-project.ts';

const fixture = (name: string): string => fileURLToPath(new URL(`./fixtures/api/${name}`, import.meta.url));
const REAL_ANALYSIS = fileURLToPath(new URL('../docs/projects/NBO/requirements/US-53717/requirement-analysis.md', import.meta.url));

function demoProject(allowed = 'STG'): ActiveProject {
  const root = mkdtempSync(join(tmpdir(), 'qa-analysis-'));
  mkdirSync(join(root, 'DEMO'));
  writeFileSync(
    join(root, 'DEMO', 'profile.md'),
    [
      '| Setting | Value |',
      '|---|---|',
      '| Project Key | DEMO |',
      `| Allowed Environments | ${allowed} |`,
      '| Environment Label Variable | APP_ENV |',
      '| Automation Base URL Variable | APP_{ENV}_WEB_URL |',
      '',
      '| `DEMO_ADMIN` | an admin account |',
    ].join('\n'),
    'utf8',
  );
  return resolveActiveProject('DEMO', root);
}

const STG = { APP_ENV: 'STG', APP_STG_WEB_URL: 'https://stg.example.test/login', DEMO_ADMIN_USERNAME: 'admin.user@example.test', DEMO_ADMIN_PASSWORD: 'not-real-password-1' };
const NOT_REQUESTED = { requested: false, account: null };
const OPENAPI = loadApiSource(fixture('openapi-auth.json'));
const POSTMAN = loadApiSource(fixture('postman-auth.json'));
const NO_API = loadApiSource(null);

function analysisWith(api: ApiSourceStatus, ui: UiDecision, fingerprint = 'f'.repeat(64)): string {
  return ['| | |', '|---|---|', `| Content fingerprint | \`${fingerprint}\` |`, ...renderSourceProvenanceRows(api, ui)].join('\n');
}

// ---------------------------------------------------------------------------
// The four source combinations
// ---------------------------------------------------------------------------

test('1. User Story only: API Not provided, UI Not performed — both recorded, nothing fails', () => {
  const ui = decideUiExploration(demoProject(), NOT_REQUESTED, STG);

  strictEqual(NO_API.status, 'not-provided');
  strictEqual(ui.perform, false);
  deepStrictEqual(renderSourceProvenanceRows(NO_API, ui), [
    '| API source | Not provided |',
    '| UI exploration | Not performed — not requested (add --ui to explore the application UI) |',
  ]);
  deepStrictEqual(renderSourceCoverageRows(NO_API, ui), [
    '| API Specification | Not provided | — |',
    '| UI Exploration | Not performed | not requested (add --ui to explore the application UI) |',
  ]);
});

test('2. User Story + OpenAPI: the type, version, path and sha256 are recorded', () => {
  ok(OPENAPI.status === 'provided');
  const rows = renderSourceProvenanceRows(OPENAPI, { perform: false, reason: 'not requested' });

  strictEqual(rows[0], `| API source | OpenAPI 3.0.1 — \`${fixture('openapi-auth.json')}\` |`);
  strictEqual(rows[1], `| API source sha256 | \`${OPENAPI.spec.sha256}\` |`);
  ok(renderSourceCoverageRows(OPENAPI, { perform: false, reason: 'x' })[0]!.startsWith('| API Specification | OpenAPI 3.0.1 |'));
});

test('3. User Story + Postman Collection: identified as Postman and recorded', () => {
  ok(POSTMAN.status === 'provided');
  strictEqual(POSTMAN.spec.type, 'Postman');
  ok(renderSourceProvenanceRows(POSTMAN, { perform: false, reason: 'x' })[0]!.includes('| API source | Postman 2.1.0 —'));
  ok(renderSourceCoverageRows(POSTMAN, { perform: false, reason: 'x' })[0]!.includes('2 operation(s)'));
});

test('4. User Story + UI: exploration runs on the allowed label and host, as the account handle', () => {
  const ui = decideUiExploration(demoProject(), { requested: true, account: 'DEMO_ADMIN' }, STG);

  deepStrictEqual(ui, { perform: true, label: 'STG', host: 'stg.example.test', account: 'DEMO_ADMIN' });
  deepStrictEqual(renderSourceProvenanceRows(NO_API, ui)[1], '| UI exploration | Performed — environment **STG**, host `stg.example.test`, as `DEMO_ADMIN` |');
  deepStrictEqual(renderSourceCoverageRows(NO_API, ui)[1], '| UI Exploration | Performed | STG — `stg.example.test`, as `DEMO_ADMIN` |');
});

test('4b. UI without an account explores unauthenticated pages only', () => {
  const ui = decideUiExploration(demoProject(), { requested: true, account: null }, STG);

  ok(ui.perform);
  ok(renderSourceCoverageRows(NO_API, ui)[1]!.includes('unauthenticated pages only'));
});

test('5. User Story + API + UI: both sources recorded together', () => {
  const ui = decideUiExploration(demoProject(), { requested: true, account: null }, STG);
  const rows = renderSourceProvenanceRows(OPENAPI, ui);

  strictEqual(rows.length, 3);
  ok(rows[0]!.startsWith('| API source | OpenAPI'));
  ok(rows[2]!.startsWith('| UI exploration | Performed'));
});

// ---------------------------------------------------------------------------
// Optional sources never block
// ---------------------------------------------------------------------------

test('6. a missing or unusable API source is recorded, never thrown', () => {
  const missing = loadApiSource(fixture('nope.json'));
  ok(missing.status === 'unusable');
  ok(missing.reason.includes('no such file'));
  ok(renderSourceProvenanceRows(missing, { perform: false, reason: 'x' })[0]!.startsWith('| API source | Not used —'));

  // Not JSON (a Markdown file) and not a specification: recorded, not thrown.
  strictEqual(loadApiSource(fixture('../valid-artifact.md')).status, 'unusable');
  strictEqual(loadApiSource('').status, 'not-provided');

  // A genuine programming error is not swallowed as "unusable source".
  throws(() => loadApiSource('x.json', () => {
    throw new TypeError('bug');
  }), TypeError);
});

test('7. UI unavailable is a reason, never an error: no environment, no URL, PROD, unlisted label, credentials', () => {
  const project = demoProject();
  const reason = (env: Record<string, string>, account: string | null = null): string => {
    const ui = decideUiExploration(project, { requested: true, account }, env);
    ok(!ui.perform);
    return ui.reason;
  };

  ok(reason({}).startsWith('no environment or base URL configured'));
  ok(reason({ APP_ENV: 'STG' }).includes('APP_STG_WEB_URL'));
  ok(reason({ APP_ENV: 'PROD', APP_PROD_WEB_URL: 'https://x.test' }).includes('PROD is blocked'));
  ok(reason({ APP_ENV: 'UAT', APP_UAT_WEB_URL: 'https://x.test' }).startsWith('environment not allowed'));
  ok(reason({ ...STG, DEMO_ADMIN_PASSWORD: '' }, 'DEMO_ADMIN').includes('DEMO_ADMIN_PASSWORD not set'));
  ok(reason(STG, 'OTHER_ADMIN').includes('not a handle DEMO declares'));
});

test('a profile listing PROD still cannot make UI exploration reach PROD', () => {
  const ui = decideUiExploration(demoProject('STG, PROD'), { requested: true, account: null }, { APP_ENV: 'PROD', APP_PROD_WEB_URL: 'https://x.test' });

  strictEqual(ui.perform, false);
});

test('the UI decision never exposes a credential value', () => {
  const project = demoProject();
  const decisions = [
    decideUiExploration(project, { requested: true, account: 'DEMO_ADMIN' }, STG),
    decideUiExploration(project, { requested: true, account: 'DEMO_ADMIN' }, { ...STG, DEMO_ADMIN_USERNAME: '' }),
  ];
  const text = JSON.stringify(decisions);

  ok(!text.includes('admin.user@example.test'));
  ok(!text.includes('not-real-password-1'));
});

// ---------------------------------------------------------------------------
// Provenance and change detection
// ---------------------------------------------------------------------------

test('provenance rows round-trip: what is written is what the next run reads', () => {
  const ui: UiDecision = { perform: true, label: 'STG', host: 'stg.example.test', account: null };
  const recorded = parseRecordedSources(analysisWith(OPENAPI, ui));

  ok(OPENAPI.status === 'provided');
  strictEqual(recorded.storyFingerprint, 'f'.repeat(64));
  deepStrictEqual([recorded.api!.provided, recorded.api!.sha256], [true, OPENAPI.spec.sha256]);
  ok(recorded.ui!.startsWith('Performed — environment **STG**'));
});

test('11. the story fingerprint is unchanged: same golden value, still blind to rev and state', () => {
  const story = { title: 'Login', description: 'Users sign in.', acceptanceCriteria: 'AC-1 lockout after 5', extraFields: [] } as unknown as UserStory;
  const documents = [{ fileName: 'spec.md', sha256: 'a'.repeat(64) }] as never;
  const golden = '8592a578ebdc357279e68bed2db37152cff22672c32e0814199881d580642798';

  strictEqual(computeContentFingerprint(story, documents), golden);
  strictEqual(computeContentFingerprint({ ...story, rev: 99, state: 'Closed' } as UserStory, documents), golden);
});

test('11b. an existing analysis written before API/UI provenance still parses, and its fingerprint still compares', () => {
  const recorded = parseRecordedSources(readFileSync(REAL_ANALYSIS, 'utf8'));

  strictEqual(recorded.storyFingerprint, '334a9561b7cb81fbaf6e6f2c9975044bcd3c702f838008052a67cb4c948d78d0');
  strictEqual(recorded.api, null, 'no API row yet: treated as Not provided');
  deepStrictEqual(findSourceChanges(recorded, { storyFingerprint: recorded.storyFingerprint, api: NO_API }), []);
  deepStrictEqual(findSourceChanges(recorded, { storyFingerprint: '0'.repeat(64), api: NO_API }).map((c) => [c.source, c.refresh]), [['User Story', true]]);
});

test('an API specification that changed, or is newly supplied, asks for a refresh', () => {
  ok(OPENAPI.status === 'provided');
  const none: UiDecision = { perform: false, reason: 'x' };
  const changedSpec: ApiSourceStatus = { status: 'provided', spec: { ...OPENAPI.spec, sha256: '1'.repeat(64) } };

  const before = parseRecordedSources(analysisWith(OPENAPI, none));
  deepStrictEqual(findSourceChanges(before, { storyFingerprint: 'f'.repeat(64), api: OPENAPI }), []);
  deepStrictEqual(findSourceChanges(before, { storyFingerprint: 'f'.repeat(64), api: changedSpec }).map((c) => c.change), ['sha256 changed — the specification changed']);

  const withoutApi = parseRecordedSources(analysisWith(NO_API, none));
  deepStrictEqual(findSourceChanges(withoutApi, { storyFingerprint: 'f'.repeat(64), api: OPENAPI }).map((c) => [c.change, c.refresh]), [['newly supplied — not yet analysed', true]]);
});

test('an API analysed before but not supplied now is a note, not a refresh', () => {
  const recorded = parseRecordedSources(analysisWith(OPENAPI, { perform: false, reason: 'x' }));
  const [change] = findSourceChanges(recorded, { storyFingerprint: null, api: NO_API });

  strictEqual(change!.refresh, false);
  ok(change!.change.includes('not re-verified'));
});

test('UI exploration alone never triggers a refresh', () => {
  const recorded = parseRecordedSources(analysisWith(NO_API, { perform: true, label: 'STG', host: 'h', account: null }));

  deepStrictEqual(findSourceChanges(recorded, { storyFingerprint: 'f'.repeat(64), api: NO_API }), []);
});

test('an API spec on its own is read identically through loadApiSource and readApiSpec', () => {
  ok(OPENAPI.status === 'provided');
  strictEqual(OPENAPI.spec.sha256, readApiSpec(fixture('openapi-auth.json')).sha256);
});
