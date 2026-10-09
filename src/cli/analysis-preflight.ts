/**
 * Decides, before `/analyze-story` analyses anything, which optional sources it
 * can use — and what changed since the last analysis. Read-only: it never
 * writes a file, never touches Azure DevOps, never starts a browser.
 *
 *   node src/cli/analysis-preflight.ts 53717 --project NBO
 *   node src/cli/analysis-preflight.ts 53717 --project NBO --api specs/auth.json --ui --ui-account ADMIN_VALID
 *   node src/cli/analysis-preflight.ts 53717 --project NBO --fingerprint <sha256 from story:read>
 *
 * Prints:
 * - the API source status (type, path, sha256, operation count — or why unusable);
 * - the UI exploration decision (environment label + host — or why not);
 * - changes against the existing analysis (story fingerprint, API sha256);
 * - the provenance rows and Source Coverage rows to write into the analysis.
 *
 * An absent or unusable optional source is a status, never a failure.
 * Exit codes:  0 = done   2 = project problem or bad arguments
 */

import { existsSync, readFileSync } from 'node:fs';

import {
  decideUiExploration,
  findSourceChanges,
  loadApiSource,
  parseRecordedSources,
  renderSourceCoverageRows,
  renderSourceProvenanceRows,
} from '../analysis/sources.ts';
import { ProjectError, describeActiveProject, requirementsDirFor, resolveActiveProject } from '../projects/active-project.ts';

interface Args {
  readonly id: number | null;
  readonly project: string | null;
  readonly api: string | null;
  readonly ui: boolean;
  readonly uiAccount: string | null;
  readonly fingerprint: string | null;
  readonly json: boolean;
}

function parseArgs(argv: readonly string[]): Args {
  let id: number | null = null;
  let project: string | null = null;
  let api: string | null = null;
  let ui = false;
  let uiAccount: string | null = null;
  let fingerprint: string | null = null;
  let json = false;

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--project') project = argv[++index] ?? null;
    else if (arg === '--api') api = argv[++index] ?? null;
    else if (arg === '--ui') ui = true;
    else if (arg === '--ui-account') {
      uiAccount = argv[++index] ?? null;
      ui = true;
    } else if (arg === '--fingerprint') fingerprint = argv[++index] ?? null;
    else if (arg === '--json') json = true;
    else if (arg !== undefined && !arg.startsWith('--')) {
      const parsed = Number(arg);
      if (Number.isInteger(parsed) && parsed > 0) id = parsed;
    }
  }
  return { id, project, api, ui, uiAccount, fingerprint, json };
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  if (args.id === null) {
    console.error('Error: a User Story ID is required.');
    console.error('Usage: node src/cli/analysis-preflight.ts <id> [--project <KEY>] [--api <path>] [--ui] [--ui-account <HANDLE>] [--fingerprint <sha256>] [--json]');
    return 2;
  }
  if (args.fingerprint !== null && !/^[0-9a-f]{64}$/.test(args.fingerprint)) {
    console.error('Error: --fingerprint must be the 64-character content fingerprint from story:read.');
    return 2;
  }

  const project = resolveActiveProject(args.project);
  const analysisPath = `${requirementsDirFor(project, args.id)}/requirement-analysis.md`;
  const existing = existsSync(analysisPath) ? readFileSync(analysisPath, 'utf8') : null;

  const api = loadApiSource(args.api);
  const ui = decideUiExploration(project, { requested: args.ui, account: args.uiAccount });
  const recorded = existing === null ? null : parseRecordedSources(existing);
  const changes = recorded ? findSourceChanges(recorded, { storyFingerprint: args.fingerprint, api }) : [];

  const provenanceRows = renderSourceProvenanceRows(api, ui);
  const coverageRows = renderSourceCoverageRows(api, ui);

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          project: project.key,
          storyId: args.id,
          analysisPath,
          analysisExists: existing !== null,
          api:
            api.status === 'provided'
              ? { status: 'provided', type: api.spec.type, version: api.spec.version, path: api.spec.path, sha256: api.spec.sha256, operations: api.spec.operations.length }
              : api,
          ui,
          recorded,
          changes,
          provenanceRows,
          coverageRows,
        },
        null,
        2,
      ),
    );
    return 0;
  }

  console.log(`Active project: ${describeActiveProject(project)}`);
  console.log(`Analysis:       ${analysisPath} ${existing === null ? '(none yet — first analysis)' : '(exists)'}`);
  console.log();
  console.log('API source:');
  if (api.status === 'provided') {
    console.log(`  ${api.spec.type} ${api.spec.version} — ${api.spec.path}`);
    console.log(`  sha256 ${api.spec.sha256} — ${api.spec.operations.length} operation(s)`);
    console.log(`  Read the relevant operations with: npm run api:read -- ${api.spec.path} --match <term>`);
  } else if (api.status === 'unusable') {
    console.log(`  NOT USED — ${api.reason}`);
    console.log('  The analysis continues from the User Story; record the reason.');
  } else {
    console.log('  Not provided');
  }
  console.log();
  console.log('UI exploration:');
  console.log(ui.perform ? `  PERFORM — ${ui.label} — ${ui.host}${ui.account ? ` — as ${ui.account}` : ' — unauthenticated pages only'}` : `  Not performed — ${ui.reason}`);

  if (recorded) {
    console.log();
    console.log('Against the existing analysis:');
    if (!args.fingerprint) console.log('  (story fingerprint not compared — pass --fingerprint <sha256> from story:read)');
    if (recorded.api === null) console.log('  (the analysis predates API/UI provenance — treated as API Source: Not provided)');
    if (changes.length === 0) console.log('  No source change detected.');
    for (const change of changes) console.log(`  ${change.refresh ? 'REFRESH' : 'note   '}  ${change.source}: ${change.change}`);
  }

  console.log();
  console.log('Provenance rows (add to the analysis provenance table):');
  for (const row of provenanceRows) console.log(`  ${row}`);
  console.log();
  console.log('Source Coverage rows (after the User Story and Markdown Attachments rows):');
  for (const row of coverageRows) console.log(`  ${row}`);
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  if (error instanceof ProjectError) {
    console.error(`Active project problem: ${error.message}`);
    for (const detail of error.details) console.error(`  ${detail}`);
    process.exitCode = 2;
  } else {
    console.error(`Unexpected failure: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
