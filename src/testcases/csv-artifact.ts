/**
 * The Test Case CSV schema (`docs/projects/<KEY>/test-cases/US-<id>/test-cases.csv`)
 * — the single source of truth for test-case content (`docs/product-decisions.md`
 * §6.4). One row per case, in display order.
 *
 * Multiline columns hold one item per line:
 *
 *   Precondition, Test Data, Notes, Section Note   one Markdown line each, verbatim
 *   Steps                                         `1. <action>`, `2. <action>` …
 *   Expected Results                              `1. <expected>`, `2. <expected>` …
 *
 * A line that does not start with `<n>. ` continues the step above it, so a
 * human may wrap a long step. Steps and Expected Results must carry the same
 * numbers in the same order: a step with no expected result is refused, exactly
 * as in the Markdown.
 *
 * Validation is shared with the Markdown reader (`buildRecord`), so a case
 * cannot be valid in one file and invalid in the other.
 */

import { ArtifactError, assertUniqueIds, buildRecord } from './artifact.ts';
import { CsvError, formatCsv, parseCsv } from './csv.ts';
import type { TestCaseRecord, TestCaseStep } from './model.ts';

/** Column order is fixed; headers are matched exactly. */
export const CSV_COLUMNS = [
  'Test Case ID',
  'User Story ID',
  'Section',
  'Section Note',
  'Summary',
  'Title',
  'Project',
  'Module',
  'Feature/Page',
  'Test Type',
  'Requirement Reference',
  'Decisions Applied',
  'Azure DevOps ID',
  'Review/Lifecycle Status',
  'Need Automation',
  'Precondition',
  'Test Data',
  'Steps',
  'Expected Results',
  'Notes',
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];

const NUMBERED = /^(\d+)\.\s+(.*)$/;

/**
 * Splits a multiline cell into its non-blank lines. Leading whitespace is kept —
 * it is how a wrapped bullet continues — and trailing whitespace is dropped.
 */
function lines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '');
}

/** Reads `1. text` lines; unnumbered lines continue the item above them. */
function numbered(value: string, column: CsvColumn, localId: string): { index: number; text: string }[] {
  const items: { index: number; text: string }[] = [];
  for (const line of lines(value).map((entry) => entry.trim())) {
    const match = NUMBERED.exec(line);
    if (match) {
      items.push({ index: Number(match[1]), text: match[2]!.trim() });
    } else if (items.length > 0) {
      items[items.length - 1]!.text += `\n${line}`;
    } else {
      throw new ArtifactError(`${localId}: the ${column} column must start with a numbered line, e.g. "1. …".`, [
        `Found: "${line}"`,
      ]);
    }
  }
  return items;
}

/** Pairs the Steps and Expected Results columns by step number. */
function pairSteps(stepsCell: string, expectedCell: string, localId: string): TestCaseStep[] {
  const actions = numbered(stepsCell, 'Steps', localId);
  const expected = numbered(expectedCell, 'Expected Results', localId);

  const actionNumbers = actions.map((item) => item.index).join(', ');
  const expectedNumbers = expected.map((item) => item.index).join(', ');
  if (actionNumbers !== expectedNumbers) {
    throw new ArtifactError(`${localId}: Steps and Expected Results are not numbered alike.`, [
      `Steps:            ${actionNumbers || '(none)'}`,
      `Expected Results: ${expectedNumbers || '(none)'}`,
      'Every step carries its own expected result, under the same number.',
    ]);
  }
  const duplicate = actions.find((item, index) => actions.findIndex((other) => other.index === item.index) !== index);
  if (duplicate) throw new ArtifactError(`${localId}: step ${duplicate.index} appears more than once.`);

  return actions.map((item, position) => ({ index: item.index, action: item.text, expected: expected[position]!.text }));
}

/**
 * Parses the CSV text of one story's Test Case set.
 *
 * @throws {ArtifactError} for any malformed row — wrapping CSV syntax errors too.
 */
export function parseTestCaseCsv(text: string, storyId: number, source: string): TestCaseRecord[] {
  let rows: string[][];
  try {
    rows = parseCsv(text);
  } catch (error) {
    if (error instanceof CsvError) throw new ArtifactError(`${source} is not valid CSV: ${error.message}`);
    throw error;
  }

  const [header, ...body] = rows;
  if (!header || header.join(',') !== CSV_COLUMNS.join(',')) {
    throw new ArtifactError(`${source} does not have the Test Case CSV header.`, [
      `Expected: ${CSV_COLUMNS.join(', ')}`,
      `Found:    ${header ? header.join(', ') : '(empty file)'}`,
      'Columns may not be renamed, added, removed or reordered.',
    ]);
  }

  const records: TestCaseRecord[] = [];
  body.forEach((row, offset) => {
    const rowNumber = offset + 2;
    // A blank line between rows carries nothing; spreadsheet tools leave them.
    if (row.every((cell) => cell.trim() === '')) return;
    if (row.length !== CSV_COLUMNS.length) {
      throw new ArtifactError(`${source}: row ${rowNumber} has ${row.length} fields, expected ${CSV_COLUMNS.length}.`, [
        'A comma, quote or line break inside a value must be inside a quoted field.',
      ]);
    }

    const cell = (column: CsvColumn): string => row[CSV_COLUMNS.indexOf(column)]!;
    const localId = cell('Test Case ID').trim();
    if (!localId) throw new ArtifactError(`${source}: row ${rowNumber} has no Test Case ID.`);

    const userStory = cell('User Story ID').trim();
    if (userStory !== String(storyId)) {
      throw new ArtifactError(`${localId}: User Story ID is "${userStory}", but this file belongs to User Story ${storyId}.`);
    }

    const automation = cell('Need Automation').trim();
    records.push(
      buildRecord(
        {
          localId,
          summary: cell('Summary'),
          section: cell('Section'),
          sectionNote: lines(cell('Section Note')),
          title: cell('Title'),
          project: cell('Project'),
          module: cell('Module'),
          featurePage: cell('Feature/Page'),
          testType: cell('Test Type'),
          requirementReference: cell('Requirement Reference'),
          decisionsApplied: cell('Decisions Applied'),
          adoId: cell('Azure DevOps ID'),
          status: cell('Review/Lifecycle Status'),
          // Empty means undecided — never an implicit Yes (§6.3).
          needAutomation: automation === '' ? undefined : automation,
          precondition: lines(cell('Precondition')),
          testData: lines(cell('Test Data')),
          steps: pairSteps(cell('Steps'), cell('Expected Results'), localId),
          notes: lines(cell('Notes')),
          position: rowNumber,
        },
        storyId,
      ),
    );
  });

  if (records.length === 0) throw new ArtifactError(`No Test Cases found in ${source}.`);
  assertUniqueIds(records, source);
  return records;
}

/** One record as CSV cells, in column order. */
export function toCsvRow(record: TestCaseRecord, storyId: number): string[] {
  const values: Record<CsvColumn, string> = {
    'Test Case ID': record.localId,
    'User Story ID': String(storyId),
    Section: record.section,
    'Section Note': record.sectionNote.join('\n'),
    Summary: record.summary,
    Title: record.title,
    Project: record.project,
    Module: record.module,
    'Feature/Page': record.featurePage,
    'Test Type': record.testType,
    'Requirement Reference': record.requirementReference,
    'Decisions Applied': record.decisionsApplied,
    'Azure DevOps ID': record.adoId === null ? '' : String(record.adoId),
    'Review/Lifecycle Status': record.status,
    'Need Automation': record.needAutomation ?? '',
    Precondition: record.precondition.join('\n'),
    'Test Data': record.testData.join('\n'),
    Steps: record.steps.map((step) => `${step.index}. ${step.action}`).join('\n'),
    'Expected Results': record.steps.map((step) => `${step.index}. ${step.expected}`).join('\n'),
    Notes: record.notes.join('\n'),
  };
  return CSV_COLUMNS.map((column) => values[column]);
}

/** A whole set as CSV text, header first. */
export function formatTestCaseCsv(records: readonly TestCaseRecord[], storyId: number): string {
  return formatCsv([[...CSV_COLUMNS], ...records.map((record) => toCsvRow(record, storyId))]);
}
