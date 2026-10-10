/**
 * Reads the Markdown rendering of a Test Case set
 * (`docs/projects/<KEY>/test-cases/US-<id>/test-cases.md`), and holds the
 * validation every Test Case must pass whichever file it was read from.
 *
 * **The Markdown is not the source of truth** (`docs/product-decisions.md`
 * §6.4). Test-case content lives in `test-cases.csv`; consumers read it through
 * `./store.ts`. This reader exists for three jobs only: migrating a legacy
 * Markdown-only artifact to CSV, checking that the rendered Markdown still
 * matches the CSV, and reading the provenance fingerprint from the Markdown
 * header.
 *
 * It is STRICT: anything it cannot parse confidently is an error, never a guess.
 * It has no Azure DevOps knowledge (invariant 6) and never reaches the network.
 */

import { readFileSync } from 'node:fs';

import {
  isNeedAutomation,
  isReviewStatus,
  type NeedAutomation,
  type ReviewStatus,
  type TestCaseArtifact,
  type TestCaseRecord,
  type TestCaseStep,
} from './model.ts';

/** Raised for a malformed artifact. Distinct from AdoError: nothing external failed. */
export class ArtifactError extends Error {
  readonly details: readonly string[];

  constructor(message: string, details: readonly string[] = []) {
    super(message);
    this.name = 'ArtifactError';
    this.details = details;
  }
}

/**
 * Path to a story's Markdown rendering within its owning project.
 *
 * `projectRoot` is the active project's directory (`docs/projects/<KEY>`), so
 * two projects can never resolve to the same file. Consumers of test-case
 * content use the CSV path in `./store.ts` instead.
 */
export function artifactPathFor(projectRoot: string, storyId: number): string {
  return `${projectRoot}/test-cases/US-${storyId}/test-cases.md`;
}

/** Marks where the rendered cases begin and end; text outside is narrative. */
export const GENERATED_BEGIN =
  '<!-- BEGIN GENERATED TEST CASES: rendered from test-cases.csv. Edit the CSV, then run `npm run testcases:render`. -->';
export const GENERATED_END = '<!-- END GENERATED TEST CASES -->';

/** The heading the renderer puts rejected cases under (§6.1). */
export const REJECTED_SECTION = 'Rejected test cases';

// ---------------------------------------------------------------------------
// Shared validation
// ---------------------------------------------------------------------------

/** Test Case IDs are `TC-<storyId>-NNN` (CLAUDE.md, Layout). */
const LOCAL_ID = /^TC-(\d+)-(\d{3,})$/;

/** The raw values a case is built from, already stripped of Markdown or CSV syntax. */
export interface RawCase {
  readonly localId: string;
  readonly summary: string;
  readonly section: string;
  readonly sectionNote: readonly string[];
  readonly title: string;
  readonly project: string;
  readonly module: string;
  readonly featurePage: string;
  readonly testType: string;
  readonly requirementReference: string;
  readonly decisionsApplied: string;
  readonly adoId: string;
  readonly status: string;
  /** Undefined when the source records no decision at all. */
  readonly needAutomation: string | undefined;
  readonly precondition: readonly string[];
  readonly testData: readonly string[];
  readonly steps: readonly TestCaseStep[];
  readonly notes: readonly string[];
  readonly position: number;
}

/**
 * Parses the Azure DevOps ID.
 *
 * Empty or a dash means "not published". Anything else must be a positive
 * integer — a value this function cannot understand must never be read as
 * "unpublished", because that is exactly how a duplicate gets created.
 */
function parseAdoId(value: string, localId: string): number | null {
  const cleaned = value.trim();
  if (!cleaned || cleaned === '—' || cleaned === '-') return null;

  const parsed = Number(cleaned);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ArtifactError(`${localId}: could not read the Azure DevOps ID.`, [
      `Found: "${value}"`,
      'Expected a positive whole number, or empty / "—" when the case is not published.',
    ]);
  }
  return parsed;
}

function parseStatus(value: string, localId: string): ReviewStatus {
  const cleaned = value.trim();
  if (!isReviewStatus(cleaned)) {
    throw new ArtifactError(`${localId}: unknown Review/Lifecycle Status "${cleaned}".`, [
      'Allowed values are defined in docs/product-decisions.md §6.1.',
    ]);
  }
  return cleaned;
}

/**
 * Parses Need Automation. No value -> null (no decision recorded). A present
 * value must be exactly `Yes` or `No`: a half-edited cell is not a decision,
 * and guessing one would put a case in or out of automation scope without
 * anyone having chosen it.
 */
function parseNeedAutomation(value: string | undefined, localId: string): NeedAutomation | null {
  if (value === undefined) return null;

  const cleaned = value.trim();
  if (!isNeedAutomation(cleaned)) {
    throw new ArtifactError(`${localId}: unknown Need Automation value "${cleaned}".`, [
      'Allowed values are "Yes" and "No" (docs/product-decisions.md §6.3).',
    ]);
  }
  return cleaned;
}

/**
 * Validates one case and builds its record. Every rule here applies to the CSV
 * and to the Markdown alike, so a case cannot be valid in one and not the other.
 */
export function buildRecord(raw: RawCase, storyId: number): TestCaseRecord {
  const { localId } = raw;

  const idMatch = LOCAL_ID.exec(localId);
  if (!idMatch) {
    throw new ArtifactError(`"${localId}" is not a valid Test Case ID.`, [
      'Test Case IDs are TC-<storyId>-NNN, at least three digits, e.g. TC-53717-001.',
    ]);
  }
  if (Number(idMatch[1]) !== storyId) {
    throw new ArtifactError(`${localId}: the ID belongs to User Story ${idMatch[1]}, not ${storyId}.`);
  }

  const title = raw.title.trim();
  if (!title) throw new ArtifactError(`${localId}: the Title is empty.`);
  if (/[`\n]/.test(title)) {
    throw new ArtifactError(`${localId}: the Title may not contain a backtick or a line break.`, [`Title: ${title}`]);
  }

  const scope = { project: raw.project.trim(), module: raw.module.trim(), featurePage: raw.featurePage.trim() };
  for (const [name, value] of Object.entries(scope)) {
    if (!value) throw new ArtifactError(`${localId}: ${name} is empty.`);
    // "/" separates the three values in the Markdown and in the title convention.
    if (/[/\n]/.test(value)) {
      throw new ArtifactError(`${localId}: ${name} may not contain "/" or a line break.`, [`Found: "${value}"`]);
    }
  }

  // The title convention is mandatory (docs/product-decisions.md §3), and the
  // structured fields are the source it is generated from. Checking they agree
  // catches a file edited in one place but not the other before it reaches
  // Azure DevOps, where the mismatch would be permanent.
  const expectedPrefix = `[${scope.project}][${scope.module}][${scope.featurePage}] `;
  if (!title.startsWith(expectedPrefix)) {
    throw new ArtifactError(`${localId}: the Title does not match its structured fields.`, [
      `Title:    ${title}`,
      `Expected it to start with: ${expectedPrefix.trimEnd()}`,
    ]);
  }

  if (raw.steps.length === 0) {
    throw new ArtifactError(`${localId}: no steps found.`, [
      'A Test Case with no steps cannot be executed and must not be published.',
    ]);
  }
  const stepWithoutAction = raw.steps.find((step) => !step.action.trim());
  if (stepWithoutAction) throw new ArtifactError(`${localId}: step ${stepWithoutAction.index} has no action.`);
  const stepWithoutExpected = raw.steps.find((step) => !step.expected.trim());
  if (stepWithoutExpected) {
    throw new ArtifactError(`${localId}: step ${stepWithoutExpected.index} has no expected result.`, [
      'Every step carries its own expected result (docs/product-decisions.md §3).',
    ]);
  }

  return {
    localId,
    summary: raw.summary.trim(),
    section: raw.section.trim(),
    sectionNote: raw.sectionNote,
    title,
    project: scope.project,
    module: scope.module,
    featurePage: scope.featurePage,
    testType: raw.testType.trim(),
    requirementReference: raw.requirementReference.trim(),
    decisionsApplied: raw.decisionsApplied.trim(),
    adoId: parseAdoId(raw.adoId, localId),
    status: parseStatus(raw.status, localId),
    needAutomation: parseNeedAutomation(raw.needAutomation, localId),
    precondition: raw.precondition,
    testData: raw.testData,
    steps: raw.steps,
    notes: raw.notes,
    headingLine: raw.position,
  };
}

/** Rejects a set with repeated IDs. */
export function assertUniqueIds(cases: readonly TestCaseRecord[], source: string): void {
  const duplicates = cases.map((entry) => entry.localId).filter((id, index, all) => all.indexOf(id) !== index);
  if (duplicates.length > 0) {
    throw new ArtifactError(`Duplicate Test Case IDs in ${source}.`, [...new Set(duplicates)]);
  }
}

// ---------------------------------------------------------------------------
// Markdown parsing
// ---------------------------------------------------------------------------

const CASE_HEADING = /^### (TC-\d+-\d+)\s+—\s+(.+?)\s*$/;
const SECTION_HEADING = /^\*\*(Precondition|Test Data|Steps|Notes)\*\*\s*$/;
const FINGERPRINT_ROW = /^\|\s*Content fingerprint at generation\s*\|\s*`?([0-9a-f]{64})`?\s*\|/;
const SEPARATOR_ROW = /^\|[\s|:-]+\|$/;

/**
 * Splits a Markdown table row into trimmed cells, honouring `\|` as a literal
 * pipe. Returns null for a line that is not a table row.
 */
export function splitTableRow(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|') || trimmed.length < 2) return null;

  const cells: string[] = [];
  let cell = '';
  for (let i = 1; i < trimmed.length - 1; i++) {
    const char = trimmed[i]!;
    if (char === '\\' && trimmed[i + 1] === '|') {
      cell += '|';
      i++;
    } else if (char === '|') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

/**
 * Strips the backticks or bold markers that wrap a WHOLE metadata value — the
 * title's backticks, the bold around a published ID. A value that merely
 * starts or ends with bold text (`**D-04**, D-01`) is not wrapped and is kept
 * verbatim: stripping one end of it would corrupt it.
 */
function unwrapCell(value: string): string {
  const trimmed = value.trim();
  const backticked = /^`([^`]*)`$/.exec(trimmed);
  if (backticked) return backticked[1]!.trim();
  const bold = /^\*\*((?:(?!\*\*).)*)\*\*$/.exec(trimmed);
  if (bold) return bold[1]!.trim();
  return trimmed;
}

/** A step cell: `<br>` is a line break inside the step. */
function stepCell(value: string): string {
  return value.replace(/<br\s*\/?>/gi, '\n').trim();
}

/** Metadata keys expected on every case. */
const REQUIRED_METADATA = [
  'Title',
  'Project / Module / Feature-Page',
  'Test Type',
  'Requirement Reference',
  'Decisions Applied',
  'Azure DevOps ID',
  'Review/Lifecycle Status',
] as const;

/**
 * `Need Automation` is optional only so that artifacts generated before it
 * existed still parse. `findCasesWithoutAutomationDecision` reports the gap.
 */
const OPTIONAL_METADATA = ['Need Automation'] as const;

function isMetadataKey(key: string): boolean {
  return (REQUIRED_METADATA as readonly string[]).includes(key) || (OPTIONAL_METADATA as readonly string[]).includes(key);
}

/** Accumulator for one case while its lines are being consumed. */
interface CaseDraft {
  localId: string;
  summary: string;
  section: string;
  sectionNote: string[];
  headingLine: number;
  metadata: Map<string, string>;
  precondition: string[];
  testData: string[];
  notes: string[];
  steps: TestCaseStep[];
}

function finaliseDraft(draft: CaseDraft, storyId: number): TestCaseRecord {
  const missing = REQUIRED_METADATA.filter((key) => !draft.metadata.has(key));
  if (missing.length > 0) {
    throw new ArtifactError(`${draft.localId}: missing required field(s) in the metadata table.`, missing);
  }

  const scopeValue = draft.metadata.get('Project / Module / Feature-Page')!;
  const parts = scopeValue.split('/').map((part) => part.trim());
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new ArtifactError(
      `${draft.localId}: "Project / Module / Feature-Page" must have exactly three slash-separated values.`,
      [`Found: "${scopeValue}"`],
    );
  }

  const automation = draft.metadata.get('Need Automation');
  return buildRecord(
    {
      localId: draft.localId,
      summary: draft.summary,
      section: draft.section,
      sectionNote: draft.sectionNote,
      title: unwrapCell(draft.metadata.get('Title')!),
      project: parts[0]!,
      module: parts[1]!,
      featurePage: parts[2]!,
      // Free text: kept exactly as written, inline Markdown included.
      testType: draft.metadata.get('Test Type')!.trim(),
      requirementReference: draft.metadata.get('Requirement Reference')!.trim(),
      decisionsApplied: draft.metadata.get('Decisions Applied')!.trim(),
      adoId: unwrapCell(draft.metadata.get('Azure DevOps ID')!),
      status: unwrapCell(draft.metadata.get('Review/Lifecycle Status')!),
      needAutomation: automation === undefined ? undefined : unwrapCell(automation),
      precondition: draft.precondition,
      testData: draft.testData,
      steps: draft.steps,
      notes: draft.notes,
      position: draft.headingLine,
    },
    storyId,
  );
}

function readText(filePath: string, storyId: number): string {
  try {
    return readFileSync(filePath, 'utf8');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      throw new ArtifactError(`No Test Case artifact at ${filePath}`, [`Generate it first with /write-test-cases ${storyId}`]);
    }
    throw new ArtifactError(`Could not read ${filePath}`, [error instanceof Error ? error.message : String(error)]);
  }
}

/** The provenance fingerprint from a Markdown file's header, or null. */
export function readMarkdownFingerprint(text: string): string | null {
  for (const line of text.split(/\r?\n/)) {
    const match = FINGERPRINT_ROW.exec(line);
    if (match) return match[1]!;
  }
  return null;
}

/**
 * Parses the cases out of a Markdown rendering. Where the file carries the
 * generated-block markers, only the text between them is read as cases.
 *
 * @throws {ArtifactError} when the file is missing, has no cases, or any case is
 *                         malformed.
 */
export function parseArtifact(filePath: string, storyId: number): TestCaseArtifact {
  return parseArtifactText(readText(filePath, storyId), storyId, filePath);
}

/** Parses Markdown text already in memory; `source` names it in errors. */
export function parseArtifactText(text: string, storyId: number, source: string): TestCaseArtifact {
  const filePath = source;
  const lines = text.split(/\r?\n/);

  const begin = lines.indexOf(GENERATED_BEGIN);
  const end = lines.indexOf(GENERATED_END);
  const from = begin !== -1 && end > begin ? begin + 1 : 0;
  const to = begin !== -1 && end > begin ? end : lines.length;

  const cases: TestCaseRecord[] = [];
  let draft: CaseDraft | undefined;
  let section = '';
  // Narrative lines between a `##` heading and the first case under it.
  let pendingNote: string[] = [];
  let block: 'precondition' | 'testData' | 'steps' | 'notes' | 'metadata' | undefined;

  for (let i = from; i < to; i++) {
    const line = lines[i]!;

    const heading = CASE_HEADING.exec(line);
    if (heading) {
      if (draft) cases.push(finaliseDraft(draft, storyId));
      draft = {
        localId: heading[1]!,
        summary: heading[2]!,
        section,
        sectionNote: pendingNote,
        headingLine: i + 1,
        metadata: new Map(),
        precondition: [],
        testData: [],
        notes: [],
        steps: [],
      };
      pendingNote = [];
      block = 'metadata';
      continue;
    }

    // A `##` heading ends the current case and starts a new group. Sections
    // after the cases (self-review) must not be absorbed into the last one.
    if (line.startsWith('## ')) {
      if (draft) cases.push(finaliseDraft(draft, storyId));
      draft = undefined;
      block = undefined;
      section = line.slice(3).trim();
      pendingNote = [];
      continue;
    }

    if (!draft) {
      const trimmed = line.trim();
      if (section && trimmed && trimmed !== '---') pendingNote.push(line.trimEnd());
      continue;
    }

    const blockHeading = SECTION_HEADING.exec(line);
    if (blockHeading) {
      block = ({ Precondition: 'precondition', 'Test Data': 'testData', Steps: 'steps', Notes: 'notes' } as const)[
        blockHeading[1] as 'Precondition' | 'Test Data' | 'Steps' | 'Notes'
      ];
      continue;
    }

    if (block === 'metadata') {
      const cells = splitTableRow(line);
      if (cells && cells.length === 2 && !SEPARATOR_ROW.test(line.trim())) {
        const key = cells[0]!.replace(/^\*\*|\*\*$/g, '').trim();
        if (isMetadataKey(key)) draft.metadata.set(key, cells[1]!);
      }
      continue;
    }

    if (block === 'steps') {
      const cells = splitTableRow(line);
      if (cells && cells.length === 3 && /^\d+$/.test(cells[0]!)) {
        draft.steps.push({ index: Number(cells[0]), action: stepCell(cells[1]!), expected: stepCell(cells[2]!) });
      }
      continue;
    }

    if (block === 'precondition' || block === 'testData' || block === 'notes') {
      const trimmed = line.trim();
      // A separator closes the case visually; it is layout, not content. Leading
      // whitespace is kept: it is how a wrapped bullet continues.
      if (trimmed && trimmed !== '---') draft[block].push(line.trimEnd());
      continue;
    }
  }

  if (draft) cases.push(finaliseDraft(draft, storyId));

  if (cases.length === 0) {
    throw new ArtifactError(`No Test Cases found in ${filePath}`, ['Expected sections headed "### TC-<storyId>-NNN — <scenario>".']);
  }
  assertUniqueIds(cases, filePath);

  return { filePath, storyId, contentFingerprint: readMarkdownFingerprint(text), testCases: cases };
}
