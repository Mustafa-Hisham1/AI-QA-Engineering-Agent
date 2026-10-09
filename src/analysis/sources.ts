/**
 * The sources of a Requirement Analysis and their provenance
 * (`docs/product-decisions.md` §14.1).
 *
 *   User Story + Markdown attachments   REQUIRED — the business source of truth
 *   API specification                   optional — OpenAPI, Swagger or Postman
 *   UI exploration                      optional — opt-in, through Playwright MCP
 *
 * An optional source that is absent or unusable NEVER blocks an analysis: it is
 * recorded as `Not provided` / `Not performed — <reason>`, and the analysis
 * proceeds from the User Story. This module decides those statuses, renders
 * the provenance rows the analysis carries, reads them back, and reports which
 * source changed since the analysis was written.
 *
 * No Azure DevOps access, no writes. The story's content fingerprint is
 * computed by the reader (`src/ado/user-story.ts`) and passed in unchanged.
 */

import { ApiSpecError, readApiSpec, type ApiSpec } from './api-spec.ts';
import { AutomationConfigError, accountHandleStatus, resolveAutomationEnvironment, type EnvSource } from '../automation/config.ts';
import type { ActiveProject } from '../projects/active-project.ts';

// ---------------------------------------------------------------------------
// API source
// ---------------------------------------------------------------------------

export type ApiSourceStatus =
  | { readonly status: 'provided'; readonly spec: ApiSpec }
  | { readonly status: 'not-provided' }
  /** A path was given but could not be used. Recorded; never blocks the analysis. */
  | { readonly status: 'unusable'; readonly path: string; readonly reason: string };

/** Reads the optional API source. Absent or unusable is a status, not an error. */
export function loadApiSource(path: string | null, read: (path: string) => ApiSpec = readApiSpec): ApiSourceStatus {
  if (!path) return { status: 'not-provided' };
  try {
    return { status: 'provided', spec: read(path) };
  } catch (error) {
    if (error instanceof ApiSpecError) return { status: 'unusable', path, reason: error.message };
    throw error;
  }
}

// ---------------------------------------------------------------------------
// UI exploration
// ---------------------------------------------------------------------------

export interface UiRequest {
  /** UI exploration is opt-in: `--ui`. */
  readonly requested: boolean;
  /** Account handle to log in with: `--ui-account <HANDLE>`. Null: unauthenticated pages only. */
  readonly account: string | null;
}

export type UiDecision =
  | { readonly perform: true; readonly label: string; readonly host: string; readonly account: string | null }
  | { readonly perform: false; readonly reason: string };

/**
 * Decides whether UI exploration may run. Reuses the automation environment
 * guard, so exploration obeys exactly the same rules: an explicit label on the
 * active profile's allow-list, never PROD, a configured base URL. Never throws
 * for an unavailable UI — that is a reason, recorded, and the analysis goes on.
 */
export function decideUiExploration(project: ActiveProject, request: UiRequest, env?: EnvSource): UiDecision {
  if (!request.requested) return { perform: false, reason: 'not requested (add --ui to explore the application UI)' };

  let label: string;
  let host: string;
  try {
    const environment = env ? resolveAutomationEnvironment(project, env) : resolveAutomationEnvironment(project);
    label = environment.label;
    host = environment.host;
  } catch (error) {
    if (!(error instanceof AutomationConfigError)) throw error;
    const why = error.code === 'ENVIRONMENT_NOT_ALLOWED' ? 'environment not allowed' : 'no environment or base URL configured';
    return { perform: false, reason: `${why} — ${error.message}` };
  }

  if (request.account) {
    const status = env ? accountHandleStatus(project, request.account, env) : accountHandleStatus(project, request.account);
    if (!status.declared) {
      return { perform: false, reason: `credentials unavailable — ${request.account} is not a handle ${project.key} declares` };
    }
    if (status.missing.length > 0) {
      return { perform: false, reason: `credentials unavailable — ${status.missing.join(', ')} not set` };
    }
  }

  return { perform: true, label, host, account: request.account };
}

// ---------------------------------------------------------------------------
// Provenance — written into the analysis, read back on the next run
// ---------------------------------------------------------------------------

/** The provenance table keys this module owns. Stable: renaming one breaks change detection. */
export const PROVENANCE_KEYS = {
  storyFingerprint: 'Content fingerprint',
  apiSource: 'API source',
  apiSha256: 'API source sha256',
  uiExploration: 'UI exploration',
} as const;

/** Rows for the analysis's provenance table, for the API and UI sources. */
export function renderSourceProvenanceRows(api: ApiSourceStatus, ui: UiDecision): string[] {
  const rows: string[] = [];

  if (api.status === 'provided') {
    rows.push(`| ${PROVENANCE_KEYS.apiSource} | ${api.spec.type} ${api.spec.version} — \`${api.spec.path}\` |`);
    rows.push(`| ${PROVENANCE_KEYS.apiSha256} | \`${api.spec.sha256}\` |`);
  } else if (api.status === 'unusable') {
    rows.push(`| ${PROVENANCE_KEYS.apiSource} | Not used — \`${api.path}\`: ${escapeCell(api.reason)} |`);
  } else {
    rows.push(`| ${PROVENANCE_KEYS.apiSource} | Not provided |`);
  }

  rows.push(
    ui.perform
      ? `| ${PROVENANCE_KEYS.uiExploration} | Performed — environment **${ui.label}**, host \`${ui.host}\`${ui.account ? `, as \`${ui.account}\`` : ', unauthenticated'} |`
      : `| ${PROVENANCE_KEYS.uiExploration} | Not performed — ${escapeCell(ui.reason)} |`,
  );

  return rows;
}

function escapeCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/** The `Source Coverage` table rows for the API and UI sources. */
export function renderSourceCoverageRows(api: ApiSourceStatus, ui: UiDecision): string[] {
  const apiRow =
    api.status === 'provided'
      ? `| API Specification | ${api.spec.type} ${api.spec.version} | \`${api.spec.path}\` — ${api.spec.operations.length} operation(s)${api.spec.title ? `, "${escapeCell(api.spec.title)}"` : ''} |`
      : api.status === 'unusable'
        ? `| API Specification | Not used | \`${api.path}\` — ${escapeCell(api.reason)} |`
        : '| API Specification | Not provided | — |';
  const uiRow = ui.perform
    ? `| UI Exploration | Performed | ${ui.label} — \`${ui.host}\`${ui.account ? `, as \`${ui.account}\`` : ', unauthenticated pages only'} |`
    : `| UI Exploration | Not performed | ${escapeCell(ui.reason)} |`;
  return [apiRow, uiRow];
}

/** What a previous analysis recorded about its sources. */
export interface RecordedSources {
  readonly storyFingerprint: string | null;
  /** null: the analysis predates API provenance (treated as Not provided). */
  readonly api: { readonly provided: boolean; readonly sha256: string | null; readonly text: string } | null;
  readonly ui: string | null;
}

const ROW = /^\|\s*\**([^|*]+?)\**\s*\|\s*(.*?)\s*\|\s*$/;

/** Reads the provenance rows back out of an analysis — new or pre-existing format. */
export function parseRecordedSources(markdown: string): RecordedSources {
  const rows = new Map<string, string>();
  for (const line of markdown.split(/\r?\n/)) {
    const match = ROW.exec(line);
    if (match && !rows.has(match[1]!.trim())) rows.set(match[1]!.trim(), match[2]!);
  }

  const fingerprint = /([0-9a-f]{64})/.exec(rows.get(PROVENANCE_KEYS.storyFingerprint) ?? '')?.[1] ?? null;
  const apiText = rows.get(PROVENANCE_KEYS.apiSource);
  const apiSha = /([0-9a-f]{64})/.exec(rows.get(PROVENANCE_KEYS.apiSha256) ?? '')?.[1] ?? null;

  return {
    storyFingerprint: fingerprint,
    api: apiText === undefined ? null : { provided: apiSha !== null, sha256: apiSha, text: apiText },
    ui: rows.get(PROVENANCE_KEYS.uiExploration) ?? null,
  };
}

export interface SourceChange {
  readonly source: 'User Story' | 'API specification';
  readonly change: string;
  /** True when the analysis should be refreshed. */
  readonly refresh: boolean;
}

/**
 * Compares a previous analysis with the sources available now.
 *
 * The story's fingerprint comparison is exactly the existing rule (§14): a
 * different fingerprint means the requirement changed. API: a different sha256,
 * or a specification supplied where none was before, means refresh. A
 * specification simply not supplied this time is noted, not a change — the
 * earlier API analysis stays, marked as such. UI exploration is live
 * observation, re-run only on request, so it never triggers a refresh.
 */
export function findSourceChanges(
  recorded: RecordedSources,
  current: { readonly storyFingerprint: string | null; readonly api: ApiSourceStatus },
): SourceChange[] {
  const changes: SourceChange[] = [];

  if (current.storyFingerprint && recorded.storyFingerprint && current.storyFingerprint !== recorded.storyFingerprint) {
    changes.push({ source: 'User Story', change: 'content fingerprint changed — the requirement changed', refresh: true });
  }

  const previous = recorded.api;
  if (current.api.status === 'provided') {
    if (!previous || !previous.provided) {
      changes.push({ source: 'API specification', change: 'newly supplied — not yet analysed', refresh: true });
    } else if (previous.sha256 !== current.api.spec.sha256) {
      changes.push({ source: 'API specification', change: 'sha256 changed — the specification changed', refresh: true });
    }
  } else if (previous?.provided) {
    changes.push({
      source: 'API specification',
      change: 'analysed previously but not supplied this run — keep the earlier API analysis, marked as not re-verified',
      refresh: false,
    });
  }

  return changes;
}
