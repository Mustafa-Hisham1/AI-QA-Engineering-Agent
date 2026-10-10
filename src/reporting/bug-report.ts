/**
 * The "Bug Report" section shared by the two QA execution reports
 * (`docs/product-decisions.md` §10.6).
 *
 * Presentation only, like `./html.ts`: each report maps the Bug Candidates of
 * ITS OWN run into `BugReportEntry` values and passes them here. Nothing in
 * this module knows a project, a story, or where a run's data came from, so
 * one run's bugs can never appear in another run's report.
 *
 * A Bug Candidate carries a disposition. A human may resolve a Draft as a
 * confirmed bug or as NOT A BUG; the candidate, its observations and its
 * evidence stay in the report either way — resolution is shown, never used to
 * hide history. The section is separate from the Execution Summary: resolving a
 * candidate never changes the counts the run recorded.
 *
 * Pure: no file system. Every value is HTML-escaped.
 */

import { badge, escapeHtml, renderGallery, type GalleryItem } from './html.ts';

/** A Bug Candidate's status. Only a human moves it off `Draft`. */
export type BugCandidateStatus = 'Draft' | 'Confirmed' | 'Not a Bug';
export const BUG_CANDIDATE_STATUSES: readonly BugCandidateStatus[] = ['Draft', 'Confirmed', 'Not a Bug'];

/** What a human decided about a Bug Candidate, after the run. */
export type BugDisposition = 'CONFIRMED_BUG' | 'NOT_A_BUG';
export const BUG_DISPOSITIONS: readonly BugDisposition[] = ['CONFIRMED_BUG', 'NOT_A_BUG'];

/** The status a disposition puts a candidate in. */
export const STATUS_FOR_DISPOSITION: Record<BugDisposition, BugCandidateStatus> = {
  CONFIRMED_BUG: 'Confirmed',
  NOT_A_BUG: 'Not a Bug',
};

/** The human review of a Bug Candidate. Never written by the agent on its own judgement. */
export interface BugResolution {
  readonly disposition: BugDisposition;
  /** Who decided — a human (invariant 1). */
  readonly decidedBy: string;
  /** ISO 8601 date or date-time. */
  readonly decidedAt: string;
  /** The recorded decision, e.g. a `decisions.md` ID, or null. */
  readonly decisionRef: string | null;
  /** Why — in the human's terms. */
  readonly rationale: string;
}

/** One related Test Case; `href` is an in-page anchor when the case is in this report. */
export interface BugTestCaseLink {
  readonly id: string;
  readonly href: string | null;
}

/** A labelled fact shown in the entry's metadata (ADO IDs, classification notes…). */
export interface BugFact {
  readonly label: string;
  readonly value: string;
}

/** Everything the section shows for one Bug Candidate. Absent fields are omitted, never invented. */
export interface BugReportEntry {
  readonly id: string;
  readonly title: string;
  readonly status: BugCandidateStatus;
  /** The classification assigned during the run — kept as recorded, even when resolved as not a bug. */
  readonly classification: string;
  readonly testCases: readonly BugTestCaseLink[];
  readonly userStory: string | null;
  readonly runId: string;
  readonly requirementReference: string | null;
  readonly description: string | null;
  readonly preconditions: readonly string[];
  readonly stepsToReproduce: readonly string[];
  /** By handle only (invariant 7). */
  readonly testData: readonly string[];
  readonly expectedResult: string | null;
  /** The confirmed observation: what the application actually did. */
  readonly actualResult: string | null;
  readonly environment: { readonly label: string; readonly host: string } | null;
  readonly facts: readonly BugFact[];
  /** A suspected root cause — unconfirmed — or null. */
  readonly suspectedCause: string | null;
  readonly notes: readonly string[];
  readonly resolution: BugResolution | null;
  readonly evidence: readonly GalleryItem[];
  /** The local Bug Candidate file, relative to the report, or null. */
  readonly file: string | null;
}

export interface BugReportOptions {
  /** Only evidence paths matching this are referenced (each report decides its own directory). */
  readonly safeEvidence: RegExp;
  /** How a human publishes a Draft from this kind of run. */
  readonly publishHint: string;
  /**
   * Whether the local Bug Candidate file is a link. The automation report may link
   * only into its run's attachments/ (`npm run automation:verify-artifacts`), so
   * it names the file as text instead.
   */
  readonly linkLocalFile: boolean;
}

const STATUS_CSS: Record<BugCandidateStatus, string> = { Draft: 'draft', Confirmed: 'confirmed', 'Not a Bug': 'notabug' };
const STATUS_LABEL: Record<BugCandidateStatus, string> = {
  Draft: 'Draft — awaiting human review',
  Confirmed: 'Confirmed bug',
  'Not a Bug': 'Resolved — NOT A BUG',
};

function list(items: readonly string[], ordered: boolean): string {
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</${tag}>`;
}

function row(label: string, html: string, kind?: string): string {
  return `<dt>${escapeHtml(label)}</dt><dd${kind ? ` data-field="${kind}"` : ''}>${html}</dd>`;
}

function renderResolution(resolution: BugResolution): string {
  const ref = resolution.decisionRef ? ` · decision <b>${escapeHtml(resolution.decisionRef)}</b>` : '';
  return `<div class="resolution ${resolution.disposition === 'NOT_A_BUG' ? 'notabug' : 'confirmed'}" data-disposition="${escapeHtml(resolution.disposition)}"><h4>Resolution — ${escapeHtml(STATUS_LABEL[STATUS_FOR_DISPOSITION[resolution.disposition]])}</h4>
<p>${escapeHtml(resolution.rationale)}</p>
<p class="muted">Decided by ${escapeHtml(resolution.decidedBy)} on ${escapeHtml(resolution.decidedAt)}${ref}. The observation below is kept exactly as recorded during the run; the run's results are unchanged.</p></div>`;
}

function renderEntry(entry: BugReportEntry, options: BugReportOptions): string {
  const css = STATUS_CSS[entry.status];
  const cases = entry.testCases
    .map((link) => (link.href ? `<a href="${escapeHtml(link.href)}">${escapeHtml(link.id)}</a>` : escapeHtml(link.id)))
    .join(', ');

  const rows: string[] = [
    row('Bug ID', `<code>${escapeHtml(entry.id)}</code>`, 'id'),
    row('Status', `${badge(STATUS_LABEL[entry.status], css)}`, 'status'),
    row(`Related Test Case${entry.testCases.length > 1 ? 's' : ''}`, cases || '—', 'test-cases'),
  ];
  if (entry.userStory) rows.push(row('Related User Story', escapeHtml(entry.userStory), 'user-story'));
  rows.push(row('Execution run', escapeHtml(entry.runId), 'run'));
  if (entry.requirementReference) rows.push(row('Requirement', escapeHtml(entry.requirementReference), 'requirement'));
  if (entry.description) rows.push(row('Description', escapeHtml(entry.description), 'description'));
  if (entry.preconditions.length > 0) rows.push(row('Preconditions', list(entry.preconditions, false), 'preconditions'));
  if (entry.stepsToReproduce.length > 0) rows.push(row('Steps to Reproduce', list(entry.stepsToReproduce, true), 'steps'));
  if (entry.testData.length > 0) rows.push(row('Test Data', list(entry.testData, false), 'test-data'));
  if (entry.expectedResult) rows.push(row('Expected Result', escapeHtml(entry.expectedResult), 'expected'));
  if (entry.actualResult) rows.push(row('Actual Result — observed (confirmed)', escapeHtml(entry.actualResult), 'actual'));
  if (entry.environment) {
    rows.push(row('Environment', `${escapeHtml(entry.environment.label)} · <code>${escapeHtml(entry.environment.host)}</code>`, 'environment'));
  }
  rows.push(row('Failure Classification', `${badge(entry.classification, 'class')} <span class="muted">as assigned during the run</span>`, 'classification'));
  for (const fact of entry.facts) rows.push(row(fact.label, escapeHtml(fact.value)));
  if (entry.suspectedCause) rows.push(row('Suspected root cause (unconfirmed)', escapeHtml(entry.suspectedCause), 'suspected'));
  if (entry.notes.length > 0) rows.push(row('Notes', list(entry.notes, false), 'notes'));
  rows.push(row('Evidence', renderGallery(entry.evidence, options.safeEvidence, 'None attached.'), 'evidence'));
  if (entry.file) {
    const file = options.linkLocalFile ? `<a href="${escapeHtml(entry.file)}">${escapeHtml(entry.file)}</a>` : `<code>${escapeHtml(entry.file)}</code>`;
    rows.push(row('Local file', file, 'file'));
  }

  return `<article class="bug ${css}" id="${escapeHtml(entry.id)}" data-bug-status="${escapeHtml(entry.status)}">
<header><span class="bug-id">${escapeHtml(entry.id)}</span>${badge(STATUS_LABEL[entry.status], css)}${badge(entry.classification, 'class')}</header>
<h3>${escapeHtml(entry.title)}</h3>
${entry.resolution ? renderResolution(entry.resolution) : ''}<dl class="kv">${rows.join('\n')}</dl></article>`;
}

/**
 * Renders the whole "Bug Report" section for one run's Bug Candidates:
 * open and confirmed bugs first, then those resolved as not a bug.
 */
export function renderBugReportSection(entries: readonly BugReportEntry[], options: BugReportOptions): string {
  const head = '<h2>Bug Report</h2>';
  if (entries.length === 0) {
    return `<section class="bug-report" id="bug-report" data-section="bug-report">${head}
<p class="muted" data-empty="bug-report">No Bug Candidates in this run — no failure was classified PRODUCT_BUG.</p></section>`;
  }

  const count = (status: BugCandidateStatus): number => entries.filter((entry) => entry.status === status).length;
  const active = entries.filter((entry) => entry.status !== 'Not a Bug');
  const resolved = entries.filter((entry) => entry.status === 'Not a Bug');

  const summary = `<p class="bug-counts" data-bug-counts>${escapeHtml(entries.length)} Bug Candidate(s): <span data-count="Draft">${escapeHtml(count('Draft'))}</span> awaiting review · <span data-count="Confirmed">${escapeHtml(count('Confirmed'))}</span> confirmed · <span data-count="Not a Bug">${escapeHtml(count('Not a Bug'))}</span> resolved as not a bug.</p>`;
  const notice = `<p class="notice">Local Bug Candidates only — <b>nothing here was created in Azure DevOps</b>. A Draft waits for a human; publishing is a separate, explicitly approved step: <code>${escapeHtml(options.publishHint)}</code>. A candidate resolved as not a bug is never published. Resolving a candidate does not change the Execution Summary — the counts record the run as it happened.</p>`;

  const group = (title: string, items: readonly BugReportEntry[], kind: string): string =>
    items.length === 0 ? '' : `<h3 class="bug-group" data-bug-group="${kind}">${escapeHtml(title)} (${escapeHtml(items.length)})</h3>${items.map((entry) => renderEntry(entry, options)).join('\n')}`;

  return `<section class="bug-report" id="bug-report" data-section="bug-report">${head}
${summary}
${notice}
${group('Bugs and open Bug Candidates', active, 'active')}
${group('Resolved — NOT A BUG (invalid bug reports, kept for traceability)', resolved, 'not-a-bug')}
</section>`;
}
