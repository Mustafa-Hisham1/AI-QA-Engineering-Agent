/**
 * Test Case <-> Playwright traceability (`docs/product-decisions.md` §7.1).
 *
 * Uses Playwright's own tags and annotations rather than a separate mapping
 * file, so the answer cannot drift from the code:
 *
 *   Which test implements TC-X?      npm run automation:list -- --grep @TC-X
 *   Which case does a test belong to? its @TC tag, its title, its file name
 *
 * Pure: no Playwright import, so `node --test` covers it directly.
 */

const TEST_CASE_ID = /^TC-(\d+)-(\d+)$/;

export interface TestCaseReference {
  readonly testCaseId: string;
  readonly storyId: number;
  /** Azure DevOps work item ID, when the case is published. */
  readonly adoId?: number | null;
}

export interface TestCaseDetails {
  readonly tag: string[];
  readonly annotation: { type: string; description: string }[];
}

/**
 * The tag and annotation set every generated test carries.
 *
 * Validates that the ID's story segment matches `storyId`: a spec copied from
 * a neighbour with only one of the two edited would otherwise trace to the
 * wrong case — the automation equivalent of a reused Test Case ID.
 *
 * @throws {Error} on a malformed ID or a story mismatch.
 */
export function testCaseDetails(reference: TestCaseReference): TestCaseDetails {
  const match = TEST_CASE_ID.exec(reference.testCaseId);
  if (!match) {
    throw new Error(`"${reference.testCaseId}" is not a Test Case ID (expected TC-<storyId>-NNN).`);
  }
  if (Number(match[1]) !== reference.storyId) {
    throw new Error(`${reference.testCaseId} does not belong to User Story ${reference.storyId}.`);
  }

  const annotation = [
    { type: 'test-case', description: reference.testCaseId },
    { type: 'user-story', description: String(reference.storyId) },
  ];
  if (reference.adoId) annotation.push({ type: 'ado-id', description: String(reference.adoId) });

  return { tag: [`@${reference.testCaseId}`, `@US-${reference.storyId}`], annotation };
}
