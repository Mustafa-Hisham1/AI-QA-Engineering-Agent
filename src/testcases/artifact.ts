/**
 * Reads and updates the local Test Case artifact
 * (`docs/test-cases/US-<id>/test-cases.md`).
 *
 * The artifact is the approved, human-reviewed source. This module therefore
 * treats it as authoritative and STRICT: anything it cannot parse confidently is
 * an error, never a guess. Publishing a silently mis-parsed test case would put
 * content into Azure DevOps that no human approved.
 *
 * It has no Azure DevOps knowledge (invariant 6) and never reaches the network.
 */

import { readFileSync, writeFileSync } from 'node:fs';

import { isReviewStatus, type ReviewStatus, type TestCaseArtifact, type TestCaseRecord, type TestCaseStep } from './model.ts';

/** Raised for a malformed artifact. Distinct from AdoError: nothing external failed. */
export class ArtifactError extends Error {
  readonly details: readonly string[];

  constructor(message: string, details: readonly string[] = []) {
    super(message);
    this.name = 'ArtifactError';
    this.details = details;
  }
}

export function artifactPathFor(storyId: number): string {
  return `docs/test-cases/US-${storyId}/test-cases.md`;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const CASE_HEADING = /^### (TC-\d+-\d+)\s+—\s+(.+?)\s*$/;
const METADATA_ROW = /^\|\s*(?:\*\*)?([^|*]+?)(?:\*\*)?\s*\|\s*(.*?)\s*\|\s*$/;
const STEP_ROW = /^\|\s*(\d+)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$/;
const SECTION_HEADING = /^\*\*(Precondition|Test Data|Steps|Notes)\*\*\s*$/;
const FINGERPRINT_ROW = /^\|\s*Content fingerprint at generation\s*\|\s*`?([0-9a-f]{64})`?\s*\|/;

/** Strips the backticks and bold markers a table cell may wrap its value in. */
function cleanCell(value: string): string {
  return value.replace(/^`+|`+$/g, '').replace(/^\*\*|\*\*$/g, '').trim();
}

/** Metadata keys expected on every case, mapped to their record property. */
const METADATA_KEYS = {
  Title: 'title',
  'Project / Module / Feature-Page': 'projectModuleFeature',
  'Test Type': 'testType',
  'Requirement Reference': 'requirementReference',
  'Decisions Applied': 'decisionsApplied',
  'Azure DevOps ID': 'adoId',
  'Review/Lifecycle Status': 'status',
} as const;

/** Splits `NBO / Authentication / Login - Agent Portal` into its three fields. */
function splitScope(value: string, localId: string): { project: string; module: string; featurePage: string } {
  const parts = value.split('/').map((part) => part.trim());
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new ArtifactError(
      `${localId}: "Project / Module / Feature-Page" must have exactly three slash-separated values.`,
      [`Found: "${value}"`],
    );
  }
  return { project: parts[0]!, module: parts[1]!, featurePage: parts[2]! };
}

/**
 * Parses the Azure DevOps ID cell.
 *
 * An em dash means "not published". Anything else must be a positive integer —
 * a value this function cannot understand must never be read as "unpublished",
 * because that is exactly how a duplicate gets created.
 */
function parseAdoId(value: string, localId: string): number | null {
  const cleaned = cleanCell(value);
  if (!cleaned || cleaned === '—' || cleaned === '-') return null;

  const parsed = Number(cleaned);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ArtifactError(`${localId}: could not read the Azure DevOps ID cell.`, [
      `Found: "${value}"`,
      'Expected a positive whole number, or "—" when the case is not published.',
    ]);
  }
  return parsed;
}

function parseStatus(value: string, localId: string): ReviewStatus {
  const cleaned = cleanCell(value);
  if (!isReviewStatus(cleaned)) {
    throw new ArtifactError(`${localId}: unknown Review/Lifecycle Status "${cleaned}".`, [
      'Allowed values are defined in docs/product-decisions.md §6.1.',
    ]);
  }
  return cleaned;
}

/** Accumulator for one case while its lines are being consumed. */
interface CaseDraft {
  localId: string;
  headingLine: number;
  metadata: Map<string, string>;
  precondition: string[];
  testData: string[];
  notes: string[];
  steps: TestCaseStep[];
}

function finaliseCase(draft: CaseDraft): TestCaseRecord {
  const { localId } = draft;

  const required = Object.keys(METADATA_KEYS);
  const missing = required.filter((key) => !draft.metadata.has(key));
  if (missing.length > 0) {
    throw new ArtifactError(`${localId}: missing required field(s) in the metadata table.`, missing);
  }

  const title = cleanCell(draft.metadata.get('Title')!);
  if (!title) {
    throw new ArtifactError(`${localId}: the Title field is empty.`);
  }

  const scope = splitScope(draft.metadata.get('Project / Module / Feature-Page')!, localId);

  // The title convention is mandatory (docs/product-decisions.md §3), and the
  // structured fields are the source it is generated from. Checking they agree
  // catches an artifact edited in one place but not the other before it reaches
  // Azure DevOps, where the mismatch would be permanent.
  const expectedPrefix = `[${scope.project}][${scope.module}][${scope.featurePage}] `;
  if (!title.startsWith(expectedPrefix)) {
    throw new ArtifactError(`${localId}: the Title does not match its structured fields.`, [
      `Title:    ${title}`,
      `Expected it to start with: ${expectedPrefix.trimEnd()}`,
    ]);
  }

  if (draft.steps.length === 0) {
    throw new ArtifactError(`${localId}: no steps found.`, [
      'A Test Case with no steps cannot be executed and must not be published.',
    ]);
  }

  const stepWithoutExpected = draft.steps.find((step) => !step.expected.trim());
  if (stepWithoutExpected) {
    throw new ArtifactError(`${localId}: step ${stepWithoutExpected.index} has no expected result.`, [
      'Every step carries its own expected result (docs/product-decisions.md §3).',
    ]);
  }

  return {
    localId,
    title,
    project: scope.project,
    module: scope.module,
    featurePage: scope.featurePage,
    testType: cleanCell(draft.metadata.get('Test Type')!),
    requirementReference: cleanCell(draft.metadata.get('Requirement Reference')!),
    decisionsApplied: cleanCell(draft.metadata.get('Decisions Applied')!),
    adoId: parseAdoId(draft.metadata.get('Azure DevOps ID')!, localId),
    status: parseStatus(draft.metadata.get('Review/Lifecycle Status')!, localId),
    precondition: draft.precondition,
    testData: draft.testData,
    steps: draft.steps,
    notes: draft.notes,
    headingLine: draft.headingLine,
  };
}

/**
 * Parses a Test Case artifact file.
 *
 * @throws {ArtifactError} when the file is missing, has no cases, or any case is
 *                         malformed.
 */
export function parseArtifact(filePath: string, storyId: number): TestCaseArtifact {
  let text: string;
  try {
    text = readFileSync(filePath, 'utf8');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      throw new ArtifactError(`No Test Case artifact at ${filePath}`, [
        `Generate it first with /write-test-cases ${storyId}`,
      ]);
    }
    throw new ArtifactError(`Could not read ${filePath}`, [error instanceof Error ? error.message : String(error)]);
  }

  const lines = text.split(/\r?\n/);
  const cases: TestCaseRecord[] = [];
  let fingerprint: string | null = null;

  let draft: CaseDraft | undefined;
  // Which `**Section**` block the reader is currently inside.
  let section: 'precondition' | 'testData' | 'steps' | 'notes' | 'metadata' | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (!fingerprint) {
      const fingerprintMatch = FINGERPRINT_ROW.exec(line);
      if (fingerprintMatch) fingerprint = fingerprintMatch[1]!;
    }

    const heading = CASE_HEADING.exec(line);
    if (heading) {
      if (draft) cases.push(finaliseCase(draft));
      draft = {
        localId: heading[1]!,
        headingLine: i + 1,
        metadata: new Map(),
        precondition: [],
        testData: [],
        notes: [],
        steps: [],
      };
      section = 'metadata';
      continue;
    }

    if (!draft) continue;

    // A `##` heading ends the current case: the sections after the cases
    // (Rejected, self-review) must not be absorbed into the last one.
    if (line.startsWith('## ')) {
      cases.push(finaliseCase(draft));
      draft = undefined;
      section = undefined;
      continue;
    }

    const sectionHeading = SECTION_HEADING.exec(line);
    if (sectionHeading) {
      switch (sectionHeading[1]) {
        case 'Precondition':
          section = 'precondition';
          break;
        case 'Test Data':
          section = 'testData';
          break;
        case 'Steps':
          section = 'steps';
          break;
        case 'Notes':
          section = 'notes';
          break;
      }
      continue;
    }

    if (section === 'metadata') {
      const row = METADATA_ROW.exec(line);
      if (row) {
        const key = row[1]!.trim();
        if (key in METADATA_KEYS) {
          draft.metadata.set(key, row[2]!);
        }
      }
      continue;
    }

    if (section === 'steps') {
      const step = STEP_ROW.exec(line);
      if (step) {
        draft.steps.push({
          index: Number(step[1]),
          action: step[2]!.trim(),
          expected: step[3]!.trim(),
        });
      }
      continue;
    }

    if (section === 'precondition' || section === 'testData' || section === 'notes') {
      const trimmed = line.trim();
      if (trimmed) draft[section].push(trimmed);
      continue;
    }
  }

  if (draft) cases.push(finaliseCase(draft));

  if (cases.length === 0) {
    throw new ArtifactError(`No Test Cases found in ${filePath}`, [
      'Expected sections headed "### TC-<storyId>-NNN — <scenario>".',
    ]);
  }

  const duplicates = cases
    .map((entry) => entry.localId)
    .filter((id, index, all) => all.indexOf(id) !== index);
  if (duplicates.length > 0) {
    throw new ArtifactError('Duplicate Test Case IDs in the artifact.', [...new Set(duplicates)]);
  }

  return { filePath, storyId, contentFingerprint: fingerprint, testCases: cases };
}

// ---------------------------------------------------------------------------
// Write-back
// ---------------------------------------------------------------------------

/**
 * Records a published Azure DevOps ID and flips the status to `Published`,
 * for ONE case, in place.
 *
 * Called immediately after each successful creation and flushed to disk before
 * the next one is attempted. Batching these updates would mean an interrupted run
 * loses the IDs of items that were really created, and the next run would create
 * them again — the exact duplicate this design exists to prevent.
 *
 * Only the two cells of the named case are touched; the file is otherwise
 * byte-identical, so an approved case's content cannot drift here.
 *
 * @throws {ArtifactError} when the expected cells are not found, rather than
 *                         writing a file that no longer records the truth.
 */
export function recordPublishedId(filePath: string, localId: string, adoId: number): void {
  const text = readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);

  const headingIndex = lines.findIndex((line) => CASE_HEADING.exec(line)?.[1] === localId);
  if (headingIndex === -1) {
    throw new ArtifactError(`Could not find ${localId} in ${filePath} to record its Azure DevOps ID.`, [
      `Azure DevOps work item ${adoId} WAS created. Record it manually before re-running, or the next run will duplicate it.`,
    ]);
  }

  // Search only this case's metadata table — the next `###`/`##` heading bounds it.
  let end = lines.length;
  for (let i = headingIndex + 1; i < lines.length; i++) {
    if (lines[i]!.startsWith('### ') || lines[i]!.startsWith('## ')) {
      end = i;
      break;
    }
  }

  let idWritten = false;
  let statusWritten = false;

  for (let i = headingIndex + 1; i < end; i++) {
    const line = lines[i]!;

    if (!idWritten && /^\|\s*Azure DevOps ID\s*\|/.test(line)) {
      lines[i] = `| Azure DevOps ID | **${adoId}** |`;
      idWritten = true;
      continue;
    }

    if (!statusWritten && /^\|\s*Review\/Lifecycle Status\s*\|/.test(line)) {
      lines[i] = '| Review/Lifecycle Status | Published |';
      statusWritten = true;
    }
  }

  if (!idWritten || !statusWritten) {
    throw new ArtifactError(`Could not update ${localId} in ${filePath}.`, [
      !idWritten ? 'The "Azure DevOps ID" row was not found.' : '',
      !statusWritten ? 'The "Review/Lifecycle Status" row was not found.' : '',
      `Azure DevOps work item ${adoId} WAS created. Record it manually before re-running.`,
    ].filter(Boolean));
  }

  writeFileSync(filePath, lines.join('\n'), 'utf8');
}
