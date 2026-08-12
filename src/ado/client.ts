/**
 * Reusable read-only Azure DevOps client.
 *
 * Every future read capability (User Story, attachments, existing Test Cases)
 * builds on this. It owns auth, retries, and error mapping so callers deal only
 * with normalised results and AdoError.
 *
 * Writes are intentionally absent — see the note in ./http.ts.
 */

import type { AdoConfig } from './config.ts';
import { AdoError, registerSecret } from './errors.ts';
import { buildAuthHeader, getJson, type RequestOptions } from './http.ts';

// ---------------------------------------------------------------------------
// Raw Azure DevOps response shapes (internal — never leave this module)
// ---------------------------------------------------------------------------

interface RawIdentity {
  readonly id?: string;
  readonly providerDisplayName?: string;
}

interface RawConnectionData {
  readonly authenticatedUser?: RawIdentity;
  readonly authorizedUser?: RawIdentity;
  readonly instanceId?: string;
  readonly deploymentType?: string;
}

interface RawWorkItemType {
  readonly name?: string;
  readonly referenceName?: string;
}

interface RawWorkItemTypesResponse {
  readonly count?: number;
  readonly value?: readonly RawWorkItemType[];
}

// ---------------------------------------------------------------------------
// Normalised results (the only shapes callers see)
// ---------------------------------------------------------------------------

export interface ConnectionInfo {
  /** Display name of the identity the PAT belongs to. Never an email address. */
  readonly authenticatedAs: string;
  /** Stable organisation identifier — confirms which org answered. */
  readonly instanceId: string;
  readonly deploymentType: string;
}

export interface WorkItemTypeInfo {
  readonly name: string;
  readonly referenceName: string;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class AdoReadClient {
  readonly #config: AdoConfig;
  readonly #authHeader: string;
  readonly #requestOptions: RequestOptions;

  constructor(config: AdoConfig) {
    this.#config = config;
    this.#authHeader = buildAuthHeader(config.pat);
    this.#requestOptions = {
      timeoutMs: config.timeoutMs,
      maxAttempts: config.maxAttempts,
    };

    // The base64-encoded header is as sensitive as the PAT itself.
    registerSecret(this.#authHeader);
  }

  get organizationName(): string {
    return this.#config.orgName;
  }

  get projectName(): string {
    return this.#config.project;
  }

  /**
   * Verifies authentication and identifies the organisation.
   *
   * Deliberately touches no work items, so an auth failure is never confused
   * with a permissions or project problem.
   */
  async getConnectionData(): Promise<ConnectionInfo> {
    const url = `${this.#config.orgUrl}/_apis/connectionData`;
    const raw = await getJson<RawConnectionData>(url, this.#authHeader, this.#requestOptions);

    // Only the display name is read. The identity object also carries the
    // account email and descriptors — PII we have no need for and therefore
    // never load into memory, artifacts, or model context.
    const displayName = raw.authenticatedUser?.providerDisplayName ?? raw.authorizedUser?.providerDisplayName;

    if (!displayName) {
      throw new AdoError('AUTH_FAILED', 'Azure DevOps did not return an authenticated identity.', {
        hint: 'The credential was not accepted. Verify ADO_PAT_READ is a current, non-revoked token.',
      });
    }

    return {
      authenticatedAs: displayName,
      instanceId: raw.instanceId ?? 'unknown',
      deploymentType: raw.deploymentType ?? 'unknown',
    };
  }

  /**
   * Lists the work item types defined in the configured project.
   *
   * This doubles as the project-access probe: it is read-only, sits within the
   * "Work Items (Read)" scope the pipeline actually needs, and confirms project
   * reachability without reading a single work item.
   */
  async getProjectWorkItemTypes(): Promise<WorkItemTypeInfo[]> {
    // Project names may contain spaces and other URL-significant characters.
    const project = encodeURIComponent(this.#config.project);
    const url = `${this.#config.orgUrl}/${project}/_apis/wit/workitemtypes?api-version=7.1`;

    const raw = await getJson<RawWorkItemTypesResponse>(url, this.#authHeader, this.#requestOptions);

    return (raw.value ?? [])
      .filter((type): type is RawWorkItemType & { name: string } => typeof type.name === 'string')
      .map((type) => ({
        name: type.name,
        referenceName: type.referenceName ?? type.name,
      }));
  }
}
