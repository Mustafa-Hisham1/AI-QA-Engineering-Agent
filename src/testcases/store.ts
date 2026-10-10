/**
 * The Test Case store: the ONE way any workflow reads or changes a story's
 * test cases (`docs/product-decisions.md` §6.4).
 *
 *   test-cases.csv   the single source of truth for test-case content. Humans
 *                    review and edit it; every consumer reads it.
 *   test-cases.md    a rendering of the CSV for reading, plus narrative the CSV
 *                    does not hold (provenance, prerequisites, coverage map,
 *                    self-review). Only the block between the generated-block
 *                    markers is produced from the CSV; the rest is kept verbatim.
 *
 * Rules this module enforces:
 *
 *   - Consumers load cases from the CSV only (`loadTestCases`). The Markdown is
 *     never read for content, so a stale or hand-edited rendering cannot leak
 *     into publishing, execution or automation. If the two disagree, CSV wins.
 *   - Rendering reads the CSV and writes the Markdown only. It never writes the
 *     CSV, so it cannot undo a human edit.
 *   - The only change this code ever makes to the CSV is the publisher's
 *     write-back of an Azure DevOps ID and the `Published` status, cell by cell.
 *   - Migration from a Markdown-only artifact refuses to run when a CSV exists,
 *     and refuses to write unless the round trip reproduces every case exactly.
 *
 * No Azure DevOps knowledge (invariant 6); local files only.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import {
  ArtifactError,
  GENERATED_BEGIN,
  GENERATED_END,
  REJECTED_SECTION,
  artifactPathFor,
  parseArtifact,
  parseArtifactText,
  readMarkdownFingerprint,
} from './artifact.ts';
import { CSV_COLUMNS, formatTestCaseCsv, parseTestCaseCsv } from './csv-artifact.ts';
import { formatCsv, parseCsv } from './csv.ts';
import type { TestCaseArtifact, TestCaseRecord } from './model.ts';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/** The CSV — the source of truth — inside the story's project directory. */
export function csvPathFor(projectRoot: string, storyId: number): string {
  return `${projectRoot}/test-cases/US-${storyId}/test-cases.csv`;
}

/** The Markdown rendering. */
export function markdownPathFor(projectRoot: string, storyId: number): string {
  return artifactPathFor(projectRoot, storyId);
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

function readCsvText(csvPath: string, markdownPath: string, storyId: number): string {
  if (!existsSync(csvPath)) {
    if (existsSync(markdownPath)) {
      throw new ArtifactError(`No test-cases.csv for User Story ${storyId} — only a legacy Markdown artifact exists.`, [
        `Found:    ${markdownPath}`,
        `Missing:  ${csvPath}`,
        `Migrate it once with: npm run testcases:migrate -- ${storyId} --project <KEY>`,
      ]);
    }
    throw new ArtifactError(`No Test Case artifact at ${csvPath}`, [`Generate it first with /write-test-cases ${storyId}`]);
  }
  return readFileSync(csvPath, 'utf8');
}

/**
 * Loads a story's test cases from its CSV. Every consumer — publishing,
 * execution, automation scope, reporting, checks — reads cases through here.
 *
 * The provenance fingerprint is taken from the Markdown header when the
 * rendering exists; case content never is.
 *
 * @throws {ArtifactError} when the CSV is missing or malformed.
 */
export function loadTestCases(projectRoot: string, storyId: number): TestCaseArtifact {
  const csvPath = csvPathFor(projectRoot, storyId);
  const markdownPath = markdownPathFor(projectRoot, storyId);
  const testCases = parseTestCaseCsv(readCsvText(csvPath, markdownPath, storyId), storyId, csvPath);
  const contentFingerprint = existsSync(markdownPath) ? readMarkdownFingerprint(readFileSync(markdownPath, 'utf8')) : null;
  return { filePath: csvPath, storyId, contentFingerprint, testCases };
}

/** Parses a CSV file that is not at the standard path — a snapshot, a fixture. */
export function loadTestCasesFromCsvFile(csvPath: string, storyId: number): TestCaseArtifact {
  if (!existsSync(csvPath)) throw new ArtifactError(`No Test Case CSV at ${csvPath}`);
  return {
    filePath: csvPath,
    storyId,
    contentFingerprint: null,
    testCases: parseTestCaseCsv(readFileSync(csvPath, 'utf8'), storyId, csvPath),
  };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/** The heading a case is grouped under: its Section, or its Feature/Page when blank. */
export function effectiveSection(record: TestCaseRecord): string {
  return record.section || record.featurePage;
}

/** Escapes a value for a Markdown table cell. */
function tableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function renderCase(record: TestCaseRecord): string[] {
  const out: string[] = [];
  out.push(`### ${record.localId} — ${record.summary || record.title}`, '');
  out.push('| | |', '|---|---|');
  out.push(`| **Title** | \`${tableCell(record.title)}\` |`);
  out.push(`| Project / Module / Feature-Page | ${tableCell(`${record.project} / ${record.module} / ${record.featurePage}`)} |`);
  out.push(`| Test Type | ${tableCell(record.testType)} |`);
  out.push(`| Requirement Reference | ${tableCell(record.requirementReference)} |`);
  out.push(`| Decisions Applied | ${tableCell(record.decisionsApplied)} |`);
  out.push(`| Azure DevOps ID | ${record.adoId === null ? '—' : `**${record.adoId}**`} |`);
  out.push(`| Review/Lifecycle Status | ${record.status} |`);
  if (record.needAutomation !== null) out.push(`| Need Automation | ${record.needAutomation} |`);

  const block = (title: string, values: readonly string[]): void => {
    if (values.length === 0) return;
    out.push('', `**${title}**`, ...values);
  };
  block('Precondition', record.precondition);
  block('Test Data', record.testData);

  out.push('', '**Steps**', '', '| # | Step | Expected Result |', '|---|---|---|');
  for (const step of record.steps) {
    out.push(`| ${step.index} | ${tableCell(step.action)} | ${tableCell(step.expected)} |`);
  }

  block('Notes', record.notes);
  return out;
}

/**
 * Renders the generated block — markers included — from the records. Pure:
 * no file system.
 *
 * Cases keep CSV order and are grouped under a `##` heading whenever their
 * section changes. Rejected cases are listed last under "Rejected test cases"
 * (§6.1), whatever their section.
 */
export function renderCasesBlock(records: readonly TestCaseRecord[]): string {
  const active = records.filter((record) => record.status !== 'Rejected');
  const rejected = records.filter((record) => record.status === 'Rejected');

  const out: string[] = [GENERATED_BEGIN, ''];
  let current: string | null = null;

  for (const record of active) {
    const section = effectiveSection(record);
    if (section !== current) {
      if (current !== null) out.push('---', '');
      out.push(`## ${section}`, '');
      if (record.sectionNote.length > 0) out.push(...record.sectionNote, '');
      current = section;
    } else {
      if (record.sectionNote.length > 0) {
        throw new ArtifactError(`${record.localId}: Section Note is set, but it is not the first case of "${section}".`, [
          'A Section Note introduces its section, so it belongs on the first row of that section only.',
        ]);
      }
      out.push('---', '');
    }
    out.push(...renderCase(record), '');
  }

  if (active.length > 0) out.push('---', '');
  out.push(`## ${REJECTED_SECTION}`, '');
  if (rejected.length === 0) {
    out.push(
      'None. A case the human rejects moves here with status `Rejected` and keeps its original ID, which is never',
      'reused (`docs/product-decisions.md` §6.1).',
      '',
    );
  } else {
    rejected.forEach((record, index) => {
      if (index > 0) out.push('---', '');
      out.push(...renderCase(record), '');
    });
  }

  out.push(GENERATED_END);
  return out.join('\n');
}

/**
 * The line ending a file already uses. A rendering keeps it, so re-rendering a
 * CRLF file does not show every line as changed in version control.
 */
function eolOf(text: string): string {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

/** Replaces the generated block of an existing rendering, keeping all narrative. */
function spliceBlock(markdown: string, block: string, markdownPath: string): string {
  const eol = eolOf(markdown);
  const lines = markdown.split(/\r?\n/);
  const begin = lines.indexOf(GENERATED_BEGIN);
  const end = lines.indexOf(GENERATED_END);
  if (begin === -1 || end === -1 || end < begin) {
    throw new ArtifactError(`${markdownPath} has no generated-block markers.`, [
      'It is a legacy Markdown-only artifact. Migrate it once with npm run testcases:migrate.',
    ]);
  }
  return [...lines.slice(0, begin), ...block.split('\n'), ...lines.slice(end + 1)].join(eol);
}

/** A rendering for a story that has no Markdown yet: cases only, no narrative. */
function newDocument(storyId: number, block: string): string {
  return [
    `# Test Cases — US ${storyId}`,
    '',
    '> Rendered from `test-cases.csv`, the source of truth for test-case content',
    '> (`docs/product-decisions.md` §6.4). No narrative sections have been written yet.',
    '',
    block,
    '',
  ].join('\n');
}

/**
 * Renders `test-cases.md` from the current CSV. Reads the CSV, writes the
 * Markdown — and nothing else.
 *
 * @returns the number of cases rendered.
 */
export function renderMarkdown(projectRoot: string, storyId: number): number {
  const artifact = loadTestCases(projectRoot, storyId);
  const markdownPath = markdownPathFor(projectRoot, storyId);
  const block = renderCasesBlock(artifact.testCases);

  const next = existsSync(markdownPath)
    ? spliceBlock(readFileSync(markdownPath, 'utf8'), block, markdownPath)
    : newDocument(storyId, block);
  writeFileSync(markdownPath, next, 'utf8');
  return artifact.testCases.length;
}

// ---------------------------------------------------------------------------
// Synchronisation check
// ---------------------------------------------------------------------------

/** Field values compared between the CSV and the Markdown, per case. */
function comparable(record: TestCaseRecord): Record<string, unknown> {
  return {
    summary: record.summary || record.title,
    title: record.title,
    project: record.project,
    module: record.module,
    featurePage: record.featurePage,
    testType: record.testType,
    requirementReference: record.requirementReference,
    decisionsApplied: record.decisionsApplied,
    adoId: record.adoId,
    status: record.status,
    needAutomation: record.needAutomation,
    precondition: record.precondition,
    testData: record.testData,
    steps: record.steps,
    notes: record.notes,
  };
}

/**
 * Lists every way the Markdown cases differ from the CSV cases. Empty means the
 * rendering is current. The CSV side is authoritative: a difference is fixed
 * by re-rendering, never by editing the CSV to match.
 */
export function findMarkdownDrift(csv: readonly TestCaseRecord[], markdown: readonly TestCaseRecord[]): string[] {
  const problems: string[] = [];
  const mdById = new Map(markdown.map((record) => [record.localId, record]));
  const csvIds = new Set(csv.map((record) => record.localId));

  for (const record of markdown) {
    if (!csvIds.has(record.localId)) problems.push(`${record.localId}: in the Markdown but not in the CSV.`);
  }

  // Which CSV case opens each section, for comparing section notes.
  const firstOfSection = new Set<string>();
  let previous: string | null = null;
  for (const record of csv.filter((entry) => entry.status !== 'Rejected')) {
    const section = effectiveSection(record);
    if (section !== previous) firstOfSection.add(record.localId);
    previous = section;
  }

  for (const record of csv) {
    const rendered = mdById.get(record.localId);
    if (!rendered) {
      problems.push(`${record.localId}: in the CSV but not in the Markdown.`);
      continue;
    }

    const expected = comparable(record);
    const actual = comparable(rendered);
    for (const field of Object.keys(expected)) {
      if (JSON.stringify(expected[field]) !== JSON.stringify(actual[field])) {
        problems.push(`${record.localId}: ${field} differs.`);
      }
    }

    if (record.status !== 'Rejected') {
      if (effectiveSection(record) !== effectiveSection(rendered)) problems.push(`${record.localId}: section differs.`);
      if (firstOfSection.has(record.localId) && JSON.stringify(record.sectionNote) !== JSON.stringify(rendered.sectionNote)) {
        problems.push(`${record.localId}: section note differs.`);
      }
    }
  }

  const csvOrder = csv.filter((entry) => entry.status !== 'Rejected').map((entry) => entry.localId);
  const mdOrder = markdown.filter((entry) => entry.status !== 'Rejected').map((entry) => entry.localId);
  if (problems.length === 0 && csvOrder.join() !== mdOrder.join()) problems.push('The cases are in a different order.');

  return problems;
}

/** Result of comparing a story's two files. */
export interface SyncReport {
  readonly csvPath: string;
  readonly markdownPath: string;
  /** False when the Markdown is missing altogether. */
  readonly markdownExists: boolean;
  readonly problems: readonly string[];
}

/** Compares the Markdown rendering with the CSV. Reads both; writes nothing. */
export function checkMarkdownSync(projectRoot: string, storyId: number): SyncReport {
  const csvPath = csvPathFor(projectRoot, storyId);
  const markdownPath = markdownPathFor(projectRoot, storyId);
  const csv = loadTestCases(projectRoot, storyId).testCases;

  if (!existsSync(markdownPath)) return { csvPath, markdownPath, markdownExists: false, problems: ['test-cases.md does not exist.'] };

  const text = readFileSync(markdownPath, 'utf8');
  if (!text.includes(GENERATED_BEGIN) || !text.includes(GENERATED_END)) {
    return { csvPath, markdownPath, markdownExists: true, problems: ['test-cases.md has no generated-block markers.'] };
  }

  let markdown: readonly TestCaseRecord[];
  try {
    markdown = parseArtifact(markdownPath, storyId).testCases;
  } catch (error) {
    if (!(error instanceof ArtifactError)) throw error;
    return { csvPath, markdownPath, markdownExists: true, problems: [`test-cases.md cannot be parsed: ${error.message}`] };
  }
  return { csvPath, markdownPath, markdownExists: true, problems: findMarkdownDrift(csv, markdown) };
}

// ---------------------------------------------------------------------------
// Publisher write-back
// ---------------------------------------------------------------------------

/**
 * Records a published Azure DevOps ID and sets the status to `Published`, for
 * ONE case, in the CSV — then re-renders the Markdown.
 *
 * Called immediately after each successful creation and flushed to disk before
 * the next one is attempted. Batching would mean an interrupted run loses the
 * IDs of items that were really created, and the next run would create them
 * again — the exact duplicate this design exists to prevent.
 *
 * Only the two cells of the named row change. Every other cell keeps its exact
 * value, so a human edit anywhere in the file survives the write-back.
 *
 * @throws {ArtifactError} when the row or cells are not found, rather than
 *                         writing a file that no longer records the truth.
 */
export function recordPublishedId(projectRoot: string, storyId: number, localId: string, adoId: number): void {
  const csvPath = csvPathFor(projectRoot, storyId);
  const created = `Azure DevOps work item ${adoId} WAS created. Record it manually before re-running, or the next run will duplicate it.`;

  let rows: string[][];
  try {
    rows = parseCsv(readFileSync(csvPath, 'utf8'));
  } catch (error) {
    throw new ArtifactError(`Could not read ${csvPath} to record ${localId}'s Azure DevOps ID.`, [
      error instanceof Error ? error.message : String(error),
      created,
    ]);
  }

  const idColumn = CSV_COLUMNS.indexOf('Test Case ID');
  const adoColumn = CSV_COLUMNS.indexOf('Azure DevOps ID');
  const statusColumn = CSV_COLUMNS.indexOf('Review/Lifecycle Status');
  const row = rows.slice(1).find((entry) => entry[idColumn]?.trim() === localId);
  if (!row || row.length !== CSV_COLUMNS.length) {
    throw new ArtifactError(`Could not find ${localId} in ${csvPath} to record its Azure DevOps ID.`, [created]);
  }

  row[adoColumn] = String(adoId);
  row[statusColumn] = 'Published';
  const next = formatCsv(rows);
  // Never write a file the strict parser would refuse on the next run.
  parseTestCaseCsv(next, storyId, csvPath);

  try {
    writeFileSync(csvPath, next, 'utf8');
  } catch (error) {
    // Typically the file is open in a spreadsheet tool that locks it.
    throw new ArtifactError(`Could not write ${csvPath} to record ${localId}'s Azure DevOps ID.`, [
      error instanceof Error ? error.message : String(error),
      created,
    ]);
  }

  try {
    renderMarkdown(projectRoot, storyId);
  } catch (error) {
    throw new ArtifactError(`${localId} is recorded in the CSV, but test-cases.md could not be re-rendered.`, [
      error instanceof Error ? error.message : String(error),
      'The CSV is correct. Fix the Markdown, then run npm run testcases:render.',
    ]);
  }
}

// ---------------------------------------------------------------------------
// Migration from a Markdown-only artifact
// ---------------------------------------------------------------------------

/** Where the case block of a legacy Markdown file starts and ends (end exclusive). */
function legacyBlockBounds(lines: readonly string[], markdownPath: string): { start: number; end: number } {
  const firstCase = lines.findIndex((line) => /^### TC-\d+-\d+/.test(line));
  if (firstCase === -1) throw new ArtifactError(`No Test Cases found in ${markdownPath}`);

  // The block opens at the `##` group heading above the first case — unless the
  // cases sit directly under the document title, in which case it opens at the
  // first case and the whole header above it stays narrative.
  let start = firstCase;
  for (let index = firstCase - 1; index >= 0; index--) {
    const line = lines[index]!;
    if (line.startsWith('## ')) {
      start = index;
      break;
    }
    if (line.startsWith('# ')) break;
  }

  const rejected = lines.findIndex((line) => line === `## ${REJECTED_SECTION}`);
  let lastCase = firstCase;
  lines.forEach((line, index) => {
    if (/^### TC-\d+-\d+/.test(line)) lastCase = index;
  });
  const from = Math.max(rejected, lastCase) + 1;
  let end = lines.findIndex((line, index) => index >= from && line.startsWith('## '));
  if (end === -1) end = lines.length;
  // Keep the separator that closed the block with the narrative after it.
  while (end > start && (lines[end - 1]!.trim() === '' || lines[end - 1]!.trim() === '---')) end--;
  return { start, end };
}

/** Result of a migration, for the caller to report. */
export interface MigrationResult {
  readonly csvPath: string;
  readonly markdownPath: string;
  readonly cases: number;
  /** Lines of the legacy Rejected section replaced by the standard text. */
  readonly replacedRejectedText: readonly string[];
}

/**
 * Migrates a legacy Markdown-only artifact: writes the CSV from the parsed
 * cases and re-renders the Markdown from that CSV, keeping all narrative.
 *
 * Nothing is written unless BOTH round trips reproduce every case exactly —
 * CSV text back to records, and the re-rendered Markdown back to records.
 *
 * @throws {ArtifactError} when a CSV already exists (it may hold human edits),
 *                         when the Markdown is already migrated, or when any
 *                         round trip would change a case.
 */
export function migrateMarkdownToCsv(projectRoot: string, storyId: number): MigrationResult {
  const csvPath = csvPathFor(projectRoot, storyId);
  const markdownPath = markdownPathFor(projectRoot, storyId);

  if (existsSync(csvPath)) {
    throw new ArtifactError(`${csvPath} already exists — refusing to overwrite it.`, [
      'The CSV is the source of truth and may hold human edits. Migration only creates a CSV that does not exist.',
    ]);
  }
  if (!existsSync(markdownPath)) throw new ArtifactError(`No Markdown artifact at ${markdownPath} to migrate.`);

  const original = readFileSync(markdownPath, 'utf8');
  if (original.includes(GENERATED_BEGIN)) {
    throw new ArtifactError(`${markdownPath} already has generated-block markers but no CSV.`, [
      'Its cases were rendered from a CSV that is now missing. Restore the CSV from version control.',
    ]);
  }

  const legacy = parseArtifact(markdownPath, storyId).testCases;

  // Round trip 1: records -> CSV text -> records.
  const csvText = formatTestCaseCsv(legacy, storyId);
  const fromCsv = parseTestCaseCsv(csvText, storyId, csvPath);
  const csvDrift = findMarkdownDrift(legacy, fromCsv);
  if (csvDrift.length > 0) throw new ArtifactError('Migration would change cases in the CSV — nothing written.', csvDrift);

  // Round trip 2: CSV records -> rendered Markdown -> records.
  const lines = original.split(/\r?\n/);
  const { start, end } = legacyBlockBounds(lines, markdownPath);
  const rejectedHeading = lines.indexOf(`## ${REJECTED_SECTION}`);
  const replacedRejectedText =
    rejectedHeading === -1
      ? []
      : lines.slice(rejectedHeading + 1, end).filter((line) => line.trim() !== '' && line.trim() !== '---' && !/^### TC-/.test(line));
  const rendered = [...lines.slice(0, start), ...renderCasesBlock(fromCsv).split('\n'), '', ...lines.slice(end)].join(
    eolOf(original),
  );

  const fromMarkdown = parseArtifactText(rendered, storyId, markdownPath).testCases;
  const mdDrift = findMarkdownDrift(fromCsv, fromMarkdown);
  if (mdDrift.length > 0) throw new ArtifactError('Migration would change cases in the Markdown — nothing written.', mdDrift);

  writeFileSync(csvPath, csvText, 'utf8');
  writeFileSync(markdownPath, rendered, 'utf8');
  return { csvPath, markdownPath, cases: fromCsv.length, replacedRejectedText };
}
