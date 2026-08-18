/**
 * Azure DevOps field reference names.
 *
 * FIELD-NAME BOUNDARY
 * -------------------
 * `System.*` and `Microsoft.VSTS.*` identifiers appear here and nowhere else
 * outside `src/ado/`. Everything downstream works with normalised property
 * names, so a process-template change is a change to this file only.
 * See invariant 6 in CLAUDE.md.
 */

export const FIELD = {
  workItemType: 'System.WorkItemType',
  title: 'System.Title',
  state: 'System.State',
  reason: 'System.Reason',
  areaPath: 'System.AreaPath',
  iterationPath: 'System.IterationPath',
  teamProject: 'System.TeamProject',
  tags: 'System.Tags',
  description: 'System.Description',
  createdDate: 'System.CreatedDate',
  changedDate: 'System.ChangedDate',
  createdBy: 'System.CreatedBy',
  changedBy: 'System.ChangedBy',
  assignedTo: 'System.AssignedTo',
  rev: 'System.Rev',
  acceptanceCriteria: 'Microsoft.VSTS.Common.AcceptanceCriteria',
  reproSteps: 'Microsoft.VSTS.TCM.ReproSteps',
  systemInfo: 'Microsoft.VSTS.TCM.SystemInfo',
  priority: 'Microsoft.VSTS.Common.Priority',
  severity: 'Microsoft.VSTS.Common.Severity',
  valueArea: 'Microsoft.VSTS.Common.ValueArea',
  storyPoints: 'Microsoft.VSTS.Scheduling.StoryPoints',
  effort: 'Microsoft.VSTS.Scheduling.Effort',
  activatedDate: 'Microsoft.VSTS.Common.ActivatedDate',
  resolvedDate: 'Microsoft.VSTS.Common.ResolvedDate',
  closedDate: 'Microsoft.VSTS.Common.ClosedDate',
} as const;

/**
 * Fields that only Test Case work items carry.
 *
 * Deliberately a separate map from FIELD: MAPPED_FIELDS below is derived from
 * FIELD to decide which fields the *reader* has already normalised, and adding
 * write-only Test Case fields there would quietly change what the User Story
 * reader reports as an extra field.
 */
export const TEST_CASE_FIELD = {
  /** Test steps, as the TCM steps XML document. See buildStepsXml in ./test-case.ts. */
  steps: 'Microsoft.VSTS.TCM.Steps',
  automationStatus: 'Microsoft.VSTS.TCM.AutomationStatus',
} as const;

/** Work item type created by the publisher. */
export const TEST_CASE_WORK_ITEM_TYPE = 'Test Case';

/** Work item type created by the bug reporter. */
export const BUG_WORK_ITEM_TYPE = 'Bug';

/**
 * Severity values, exactly as this process template spells them.
 *
 * The picklist is NOT exposed by the work item type API, and the values carry a
 * numeric prefix — sending a bare `'Low'` is rejected. These strings were read
 * back from Bugs that already exist in the project.
 *
 * Severity is `alwaysRequired` on Bug and has no default, so a create must set it.
 * Priority, by contrast, defaults to "2" and is deliberately NOT written here:
 * leaving a field unset is how the template's default is honoured.
 */
export const SEVERITY = {
  critical: '1 - Critical',
  high: '2 - High',
  medium: '3 - Medium',
  low: '4 - Low',
} as const;

/** Relation type of a file attached directly to a work item. */
export const ATTACHED_FILE_RELATION = 'AttachedFile';

/**
 * Non-hierarchical association between two work items.
 *
 * Used to point a Bug at the Test Case that found it. Deliberately NOT a
 * hierarchy link: a Test Case does not own a Bug, and making one the other's
 * parent would corrupt the story's child tree.
 */
export const RELATED_RELATION = 'System.LinkTypes.Related';

/**
 * Hierarchy link types.
 *
 * `-Reverse` points from a child to its parent, which is the direction used when
 * creating a work item under a parent. `-Forward` is the parent-to-child
 * direction seen when reading a parent's relations. Getting these the wrong way
 * round produces a link that appears to work but inverts the hierarchy.
 */
export const HIERARCHY_PARENT_RELATION = 'System.LinkTypes.Hierarchy-Reverse';
export const HIERARCHY_CHILD_RELATION = 'System.LinkTypes.Hierarchy-Forward';

/**
 * Fields carrying HTML rich text, which must be converted before use.
 * Kept as reference names because it is consumed inside this module boundary.
 */
export const HTML_FIELDS: readonly string[] = [
  FIELD.description,
  FIELD.acceptanceCriteria,
  FIELD.reproSteps,
  FIELD.systemInfo,
];

/**
 * Fields already represented by a normalised property. Anything *not* listed
 * here is surfaced as an extra field rather than dropped: custom process
 * templates carry requirement detail in fields this project cannot predict, and
 * silently discarding them would lose requirements.
 */
export const MAPPED_FIELDS: readonly string[] = Object.values(FIELD);
