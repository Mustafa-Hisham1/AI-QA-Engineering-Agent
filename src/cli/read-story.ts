/**
 * Reads one Azure DevOps User Story and prints its Requirement Context.
 *
 *   node src/cli/read-story.ts 53717
 *   node src/cli/read-story.ts 53717 --summary   # metadata only, no body text
 *   node src/cli/read-story.ts 53717 --json      # machine-readable
 *   node src/cli/read-story.ts 53717 --save-source <dir>
 *
 * Read-only with respect to Azure DevOps: it fetches the work item, its
 * attachment list, and the content of Markdown attachments. Requirement
 * analysis is a separate, human-reviewed step.
 *
 * `--save-source` stores the Markdown attachments verbatim as a local snapshot.
 * The content fingerprint tells a later session *that* the requirement changed;
 * only a stored snapshot can tell it *what* changed, which is what impact
 * analysis needs (docs/product-decisions.md §14).
 *
 * Exit codes:  0 = read successfully   1 = read failure   2 = configuration problem
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

import { AdoReadClient } from '../ado/client.ts';
import { loadConfig, type AdoConfig } from '../ado/config.ts';
import { isAdoError, redact, type AdoError } from '../ado/errors.ts';
import type { RequirementContext } from '../ado/user-story.ts';

function log(line = ''): void {
  console.log(redact(line));
}

interface Args {
  readonly id: number | null;
  readonly json: boolean;
  readonly summary: boolean;
  readonly saveSource: string | null;
}

function parseArgs(argv: readonly string[]): Args {
  let id: number | null = null;
  let json = false;
  let summary = false;
  let saveSource: string | null = null;

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--json') json = true;
    else if (arg === '--summary') summary = true;
    else if (arg === '--save-source') saveSource = argv[++index] ?? null;
    else if (arg !== undefined && !arg.startsWith('--')) {
      const parsed = Number(arg);
      if (Number.isInteger(parsed) && parsed > 0) id = parsed;
    }
  }

  return { id, json, summary, saveSource };
}

function printUsage(): void {
  log();
  log('Usage: node src/cli/read-story.ts <user-story-id> [--summary] [--json] [--save-source <dir>]');
  log();
  log('  <user-story-id>      Azure DevOps work item ID of a User Story, e.g. 53717');
  log('  --summary            Print metadata and attachment list only');
  log('  --json               Print the Requirement Context as JSON');
  log('  --save-source <dir>  Write the Markdown attachments verbatim into <dir>');
  log();
}

/**
 * Writes the Markdown attachments into `directory`.
 *
 * The file name comes from Azure DevOps, so it is reduced to its base name: an
 * attachment named "..\\..\\something.md" must not be able to write outside the
 * target directory.
 */
async function saveMarkdownSources(context: RequirementContext, directory: string): Promise<string[]> {
  const target = resolve(directory);
  await mkdir(target, { recursive: true });

  const written: string[] = [];
  for (const document of context.markdownDocuments) {
    const path = join(target, basename(document.fileName));
    await writeFile(path, document.content, 'utf8');
    written.push(path);
  }
  return written;
}

function section(heading: string, body: string): void {
  log();
  log(`## ${heading}`);
  log();
  log(body.trim() ? body : '(empty)');
}

function printContext(context: RequirementContext, summaryOnly: boolean): void {
  const { story } = context;

  log();
  log(`User Story ${story.id} — ${story.title}`);
  log('='.repeat(72));
  log(`Work item type   : ${story.workItemType}  (verified)`);
  log(`State            : ${story.state}${story.reason ? ` (${story.reason})` : ''}`);
  log(`Project          : ${story.project}`);
  log(`Area path        : ${story.areaPath ?? '-'}`);
  log(`Iteration        : ${story.iterationPath ?? '-'}`);
  log(`Tags             : ${story.tags.length > 0 ? story.tags.join(', ') : '-'}`);
  log(`Assigned to      : ${story.assignedTo ?? '-'}`);
  log(`Created          : ${story.createdDate ?? '-'}${story.createdBy ? ` by ${story.createdBy}` : ''}`);
  log(`Last changed     : ${story.changedDate ?? '-'}${story.changedBy ? ` by ${story.changedBy}` : ''}`);
  log(`Revision         : ${story.rev}`);
  log(`Story points     : ${story.storyPoints ?? '-'}`);
  log(`Priority         : ${story.priority ?? '-'}`);
  // Printed in full, not truncated: a later run compares this value against the
  // one recorded in the analysis artifact to decide whether the requirement
  // actually changed. A shortened hash cannot be compared reliably.
  log(`Fingerprint      : ${context.contentFingerprint}  (content only)`);
  log(`Work item URL    : ${story.htmlUrl ?? '-'}`);

  log();
  log(`Attachments      : ${context.attachments.length}`);
  for (const attachment of context.attachments) {
    const size = attachment.sizeBytes === null ? '' : ` ${attachment.sizeBytes} bytes`;
    const kind = attachment.isMarkdown ? ' [markdown]' : '';
    log(`  - ${attachment.fileName}${size}${kind}${attachment.comment ? ` — ${attachment.comment}` : ''}`);

    // The hash belongs next to the file name so --summary alone is enough to
    // record provenance in an analysis artifact.
    const downloaded = context.markdownDocuments.find((document) => document.attachmentId === attachment.id);
    if (downloaded) log(`      sha256 ${downloaded.sha256}`);
  }

  if (context.attachments.length > 0 && context.markdownDocuments.length === 0) {
    log();
    log('Warning: no Markdown attachment found. The detailed requirement is usually a .md file.');
  }

  if (summaryOnly) {
    log();
    return;
  }

  section('Description', story.description);
  section('Acceptance Criteria', story.acceptanceCriteria);

  for (const field of story.extraFields) {
    section(`Additional field: ${field.referenceName}`, field.value);
  }

  for (const document of context.markdownDocuments) {
    log();
    log('='.repeat(72));
    log(`Attachment: ${document.fileName}  (${document.byteLength} bytes)`);
    log(`sha256: ${document.sha256}`);
    log('='.repeat(72));
    log();
    log(document.content);
  }
  log();
}

function printFailure(error: AdoError): void {
  log();
  log(`[FAIL] ${error.code}`);
  log(`  Reason : ${error.message}`);
  for (const line of error.details) {
    log(line ? `           ${line}` : '');
  }
  if (error.hint) log(`  Fix    : ${error.hint}`);
  log();
}

function toFailurePayload(error: AdoError): Record<string, unknown> {
  return {
    ok: false,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint ?? null,
  };
}

async function main(): Promise<number> {
  const { id, json, summary, saveSource } = parseArgs(process.argv.slice(2));

  if (id === null) {
    if (json) {
      console.log(JSON.stringify({ ok: false, code: 'CONFIG_INVALID', message: 'A positive User Story ID is required.' }, null, 2));
    } else {
      printUsage();
    }
    return 2;
  }

  let config: AdoConfig;
  try {
    config = loadConfig();
  } catch (error) {
    if (!isAdoError(error)) throw error;
    if (json) console.log(JSON.stringify(toFailurePayload(error), null, 2));
    else printFailure(error);
    return 2;
  }

  try {
    const context = await new AdoReadClient(config).readUserStory(id);

    const savedFiles = saveSource === null ? [] : await saveMarkdownSources(context, saveSource);

    if (json) {
      console.log(JSON.stringify({ ok: true, ...context, savedFiles }, null, 2));
    } else {
      printContext(context, summary);
      for (const file of savedFiles) log(`Saved source attachment: ${file}`);
      if (savedFiles.length > 0) log();
    }

    return 0;
  } catch (error) {
    if (!isAdoError(error)) throw error;
    if (json) console.log(JSON.stringify(toFailurePayload(error), null, 2));
    else printFailure(error);
    return 1;
  }
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    // Last-resort handler: redact before printing, since an unexpected error may
    // have captured a request detail we did not anticipate.
    const message = error instanceof Error ? error.message : String(error);
    console.error(redact(`Unexpected failure: ${message}`));
    process.exitCode = 1;
  });
