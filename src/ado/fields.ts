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

/** Relation type of a file attached directly to a work item. */
export const ATTACHED_FILE_RELATION = 'AttachedFile';

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
