/**
 * Read-only Azure DevOps connectivity check.
 *
 *   node src/cli/check-connection.ts
 *   node src/cli/check-connection.ts --json
 *
 * Verifies, in order: configuration -> authentication -> organisation ->
 * project access. Reads no work items and modifies nothing.
 *
 * Exit codes:  0 = connected   1 = connection/auth failure   2 = configuration problem
 */

import { AdoReadClient } from '../ado/client.ts';
import { describeConfig, loadConfig, type AdoConfig } from '../ado/config.ts';
import { AdoError, isAdoError, redact } from '../ado/errors.ts';

const PASS = '[ OK ]';
const FAIL = '[FAIL]';

/** Work item types that typically carry requirements, across ADO process templates. */
const REQUIREMENT_TYPE_NAMES = ['User Story', 'Product Backlog Item', 'Requirement', 'Issue', 'Feature', 'Epic'];

/** The only work item type the V1 reader supports. See docs/product-decisions.md §3. */
const V1_WORK_ITEM_TYPE = 'User Story';

interface CheckResult {
  readonly ok: boolean;
  readonly organization: string;
  readonly project: string;
  readonly authenticatedAs: string;
  readonly instanceId: string;
  readonly deploymentType: string;
  readonly workItemTypeCount: number;
  readonly requirementTypes: readonly string[];
  readonly checkedAt: string;
}

function log(line = ''): void {
  console.log(redact(line));
}

function printHeader(config: AdoConfig): void {
  const described = describeConfig(config);
  log();
  log('Azure DevOps - Read-Only Connectivity Check');
  log('='.repeat(60));
  log(`Organization : ${described.organization}  (${described.organizationUrl})`);
  log(`Project      : ${described.project}`);
  log(`Credential   : ${described.credential}`);
  log();
}

async function runChecks(config: AdoConfig): Promise<CheckResult> {
  const client = new AdoReadClient(config);

  log(`${PASS} Configuration loaded`);

  // Authentication + organisation identity. Touches no work items, so a failure
  // here is unambiguously about the credential or the org URL.
  const connection = await client.getConnectionData();
  log(`${PASS} Authentication succeeded    - authenticated as: ${connection.authenticatedAs}`);
  log(`${PASS} Organization accessible     - instance ${connection.instanceId} (${connection.deploymentType})`);

  // Project access, probed through the Work Items scope the pipeline needs.
  const workItemTypes = await client.getProjectWorkItemTypes();
  log(`${PASS} Project accessible          - ${workItemTypes.length} work item types readable`);

  const requirementTypes = workItemTypes
    .map((type) => type.name)
    .filter((name) => REQUIREMENT_TYPE_NAMES.includes(name));

  return {
    ok: true,
    organization: config.orgName,
    project: config.project,
    authenticatedAs: connection.authenticatedAs,
    instanceId: connection.instanceId,
    deploymentType: connection.deploymentType,
    workItemTypeCount: workItemTypes.length,
    requirementTypes,
    checkedAt: new Date().toISOString(),
  };
}

function printSuccess(result: CheckResult): void {
  log();
  log('Result: CONNECTION OK (read-only)');

  if (result.requirementTypes.length > 0) {
    log();
    log(`Requirement-bearing work item types found: ${result.requirementTypes.join(', ')}`);

    // V1 reads one type only; report whether this project actually offers it.
    log(
      result.requirementTypes.includes(V1_WORK_ITEM_TYPE)
        ? `V1 scope reads "${V1_WORK_ITEM_TYPE}" only - available in this project.`
        : `Warning: "${V1_WORK_ITEM_TYPE}" not found - V1 reads that type only.`,
    );
  }
  log();
}

function printFailure(error: AdoError): void {
  log();
  log(`${FAIL} ${error.code}`);
  log(`  Reason : ${error.message}`);

  for (const line of error.details) {
    log(line ? `           ${line}` : '');
  }

  if (error.hint) {
    log(`  Fix    : ${error.hint}`);
  }
  log();
}

function toFailurePayload(error: AdoError): Record<string, unknown> {
  return {
    ok: false,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint ?? null,
    checkedAt: new Date().toISOString(),
  };
}

async function main(): Promise<number> {
  const asJson = process.argv.includes('--json');

  let config: AdoConfig;
  try {
    config = loadConfig();
  } catch (error) {
    if (!isAdoError(error)) throw error;

    if (asJson) {
      console.log(JSON.stringify(toFailurePayload(error), null, 2));
    } else {
      log();
      log('Azure DevOps - Read-Only Connectivity Check');
      log('='.repeat(60));
      // The error carries the precise file path and per-variable state, so no
      // generic advice is added here — it would only compete with the facts.
      printFailure(error);
      log('Then re-run:  npm run ado:check');
      log();
    }
    return 2;
  }

  if (!asJson) printHeader(config);

  try {
    const result = await runChecks(config);

    if (asJson) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printSuccess(result);
    }
    return 0;
  } catch (error) {
    if (!isAdoError(error)) throw error;

    if (asJson) {
      console.log(JSON.stringify(toFailurePayload(error), null, 2));
    } else {
      printFailure(error);
    }
    return 1;
  }
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    // Last-resort handler. Redact before printing: an unexpected error may have
    // captured a request detail we did not anticipate.
    const message = error instanceof Error ? error.message : String(error);
    console.error(redact(`Unexpected failure: ${message}`));
    process.exitCode = 1;
  });
