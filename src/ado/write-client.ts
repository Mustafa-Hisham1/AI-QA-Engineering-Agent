/**
 * Azure DevOps WRITE client.
 *
 * Separate from AdoReadClient and built on ./http-write.ts, which has no GET and
 * no retries. Loading a write-scoped credential is the caller's decision, made
 * explicitly via loadWriteConfig() — the read path cannot reach this class's
 * credential.
 *
 * Every method here performs an IRREVERSIBLE external action. None of them may be
 * called without explicit human approval immediately beforehand (invariant 2);
 * that gate lives in the CLI, which is the only thing a human drives.
 */

import type { AdoWriteConfig } from './config.ts';
import { registerSecret } from './errors.ts';
import { TEST_CASE_WORK_ITEM_TYPE } from './fields.ts';
import { buildAuthHeader } from './http.ts';
import { postJsonPatch, type JsonPatchOperation, type WriteRequestOptions } from './http-write.ts';
import { buildCreateTestCaseOperations, type TestCasePlacement } from './test-case.ts';
import type { TestCaseRecord } from '../testcases/model.ts';

/** Minimal shape of a created work item — only what the caller needs. */
interface RawCreatedWorkItem {
  readonly id?: number;
  readonly _links?: { readonly html?: { readonly href?: string } };
}

export interface CreatedTestCase {
  readonly localId: string;
  readonly adoId: number;
  /** Browser URL of the created work item, when Azure DevOps returned one. */
  readonly htmlUrl: string | null;
}

export class AdoWriteClient {
  readonly #config: AdoWriteConfig;
  readonly #authHeader: string;
  readonly #options: WriteRequestOptions;

  constructor(config: AdoWriteConfig) {
    this.#config = config;
    this.#authHeader = buildAuthHeader(config.writePat);
    this.#options = { timeoutMs: config.timeoutMs };

    // The base64-encoded header is as sensitive as the PAT itself.
    registerSecret(this.#authHeader);
  }

  get organizationName(): string {
    return this.#config.orgName;
  }

  get projectName(): string {
    return this.#config.project;
  }

  /** The URL a create would POST to. Exposed so a dry run can show it exactly. */
  createTestCaseUrl(): string {
    const project = encodeURIComponent(this.#config.project);
    const type = encodeURIComponent(`$${TEST_CASE_WORK_ITEM_TYPE}`);
    return `${this.#config.orgUrl}/${project}/_apis/wit/workitems/${type}?api-version=7.1`;
  }

  /**
   * Builds the exact operations a create would send, without sending anything.
   *
   * The dry run and the real write share this one function deliberately: a
   * preview built by different code than the write is a preview of nothing.
   */
  planCreateTestCase(testCase: TestCaseRecord, placement: TestCasePlacement): JsonPatchOperation[] {
    return buildCreateTestCaseOperations(testCase, placement);
  }

  /**
   * Creates ONE Test Case work item as a child of a User Story.
   *
   * One item per call, by design: the caller records the returned ID locally
   * before creating the next one, so an interruption can never lose the record of
   * something that was really created.
   *
   * @throws {AdoError} on any failure. The write is NOT retried.
   */
  async createTestCase(testCase: TestCaseRecord, placement: TestCasePlacement): Promise<CreatedTestCase> {
    const operations = this.planCreateTestCase(testCase, placement);

    const created = await postJsonPatch<RawCreatedWorkItem>(
      this.createTestCaseUrl(),
      this.#authHeader,
      this.#options,
      operations,
    );

    if (typeof created.id !== 'number' || !Number.isInteger(created.id) || created.id <= 0) {
      // Something was very likely created but its ID is unusable, so the local
      // artifact cannot record it. Surfacing this loudly is the only safe move:
      // treating it as a failure would invite a duplicate on the next run.
      throw new Error(
        `${testCase.localId}: Azure DevOps accepted the create but returned no usable work item ID. ` +
          'Check Azure DevOps for a Test Case with this title and record its ID manually before re-running.',
      );
    }

    return {
      localId: testCase.localId,
      adoId: created.id,
      htmlUrl: created._links?.html?.href ?? null,
    };
  }
}
