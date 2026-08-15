/**
 * Maps a normalised TestCaseRecord onto the Azure DevOps Test Case work item.
 *
 * This is the ONLY place the Test Case field reference names and the TCM steps
 * XML format appear (invariant 6). `src/testcases/` stays free of Azure DevOps
 * concepts, so a process-template difference is a change to this file alone.
 */

import { escapeHtml, inlineMarkdownToHtml, linesToHtml } from '../text/markdown-to-html.ts';
import type { TestCaseRecord } from '../testcases/model.ts';
import { FIELD, HIERARCHY_PARENT_RELATION, TEST_CASE_FIELD } from './fields.ts';
import type { JsonPatchOperation } from './http-write.ts';

/**
 * Wraps HTML in the DIV/P envelope the Test Runner expects inside a step, then
 * escapes it for embedding in the steps XML document.
 *
 * The double encoding is not a mistake: `Microsoft.VSTS.TCM.Steps` is an XML
 * document whose `parameterizedString` elements contain *escaped HTML* as text.
 * Emitting raw HTML there produces a steps field that Azure DevOps accepts but
 * the Test Runner renders as markup.
 */
function stepHtml(markdown: string): string {
  const inner = `<DIV><P>${inlineMarkdownToHtml(markdown)}</P></DIV>`;
  return escapeHtml(inner);
}

/**
 * Builds the `Microsoft.VSTS.TCM.Steps` XML document.
 *
 * Step ids start at 2 — Azure DevOps reserves lower ids for the container — and
 * `last` must be the id of the final step or the runner mis-counts the steps.
 *
 * Every step here has an expected result, so all are `ValidateStep`. An
 * `ActionStep` (no expected result) would silently drop the expected result,
 * which for this project's artifacts is the most important half.
 */
export function buildStepsXml(steps: readonly { action: string; expected: string }[]): string {
  const firstId = 2;
  const parts: string[] = [];

  steps.forEach((step, offset) => {
    const id = firstId + offset;
    parts.push(
      `<step id="${id}" type="ValidateStep">` +
        `<parameterizedString isformatted="true">${stepHtml(step.action)}</parameterizedString>` +
        `<parameterizedString isformatted="true">${stepHtml(step.expected)}</parameterizedString>` +
        `<description/>` +
        `</step>`,
    );
  });

  const last = steps.length === 0 ? firstId - 1 : firstId + steps.length - 1;
  return `<steps id="0" last="${last}">${parts.join('')}</steps>`;
}

/**
 * Counts the steps in a `Microsoft.VSTS.TCM.Steps` document.
 *
 * Used to verify a published Test Case really carries the steps it was created
 * with. Matching titles only proves an item exists; a steps document Azure DevOps
 * accepted but stored empty would otherwise pass verification and be discovered
 * by whoever tried to execute it.
 */
export function countSteps(stepsXml: string): number {
  return (stepsXml.match(/<step\s/g) ?? []).length;
}

/**
 * Builds the Description HTML.
 *
 * Azure DevOps Test Cases have no field for a precondition, test data, internal
 * ID, or requirement reference, so they go here — visible on the work item and
 * preserved verbatim. Dropping them would publish a case that cannot be traced
 * back to the requirement or executed as approved.
 */
export function buildDescriptionHtml(testCase: TestCaseRecord): string {
  const sections: string[] = [];

  sections.push(
    '<p><b>Internal Test Case ID:</b> ' +
      `${escapeHtml(testCase.localId)}<br/>` +
      `<b>Project / Module / Feature-Page:</b> ${escapeHtml(testCase.project)} / ${escapeHtml(testCase.module)} / ${escapeHtml(testCase.featurePage)}<br/>` +
      `<b>Test Type:</b> ${escapeHtml(testCase.testType)}<br/>` +
      `<b>Requirement Reference:</b> ${inlineMarkdownToHtml(testCase.requirementReference)}<br/>` +
      `<b>Decisions Applied:</b> ${inlineMarkdownToHtml(testCase.decisionsApplied)}</p>`,
  );

  if (testCase.precondition.length > 0) {
    sections.push('<p><b>Precondition</b></p>', linesToHtml(testCase.precondition));
  }

  if (testCase.testData.length > 0) {
    sections.push('<p><b>Test Data</b></p>', linesToHtml(testCase.testData));
  }

  if (testCase.notes.length > 0) {
    sections.push('<p><b>Notes</b></p>', linesToHtml(testCase.notes));
  }

  return sections.join('');
}

export interface TestCasePlacement {
  /** Area path inherited from the parent User Story. */
  readonly areaPath: string | null;
  /** Iteration path inherited from the parent User Story. */
  readonly iterationPath: string | null;
  /** Absolute API URL of the parent User Story, for the hierarchy link. */
  readonly parentUrl: string;
}

/**
 * Builds the JSON Patch document that creates one Test Case as a child of a
 * User Story.
 *
 * Area and iteration are inherited from the parent rather than defaulted, so the
 * published cases land beside the story they belong to instead of in the project
 * root.
 *
 * `System.State` is deliberately not set: the process template decides the
 * initial state, and forcing one is how a create fails on a template whose Test
 * Case workflow differs.
 */
export function buildCreateTestCaseOperations(
  testCase: TestCaseRecord,
  placement: TestCasePlacement,
): JsonPatchOperation[] {
  const operations: JsonPatchOperation[] = [
    { op: 'add', path: `/fields/${FIELD.title}`, value: testCase.title },
    { op: 'add', path: `/fields/${FIELD.description}`, value: buildDescriptionHtml(testCase) },
    { op: 'add', path: `/fields/${TEST_CASE_FIELD.steps}`, value: buildStepsXml(testCase.steps) },
  ];

  if (placement.areaPath) {
    operations.push({ op: 'add', path: `/fields/${FIELD.areaPath}`, value: placement.areaPath });
  }

  if (placement.iterationPath) {
    operations.push({ op: 'add', path: `/fields/${FIELD.iterationPath}`, value: placement.iterationPath });
  }

  operations.push({
    op: 'add',
    path: '/relations/-',
    value: {
      rel: HIERARCHY_PARENT_RELATION,
      url: placement.parentUrl,
      attributes: { comment: 'Published by ai-qa-engineering-agent from the approved local Test Case artifact' },
    },
  });

  return operations;
}
