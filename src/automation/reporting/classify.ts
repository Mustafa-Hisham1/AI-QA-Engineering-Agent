/**
 * Automatic, PROVISIONAL failure classification for automated runs, using the
 * vocabulary of `docs/product-decisions.md` §9.
 *
 * Deterministic rules over the (sanitised) error text. It never decides that a
 * defect exists — it decides what a human should look at first. Where torn it
 * prefers the classification that keeps a human looking (§9): an Expected
 * Result assertion that failed is a suspected PRODUCT_BUG, even when the
 * element was simply not found, because a real defect filed as a script
 * problem disappears silently.
 */

import type { FailureClassification } from './model.ts';

export interface Classification {
  readonly classification: FailureClassification;
  readonly note: string;
}

const RULES: readonly { readonly test: (error: string, inStep: boolean) => boolean; readonly result: Classification }[] = [
  {
    test: (error) => /net::ERR_|ECONNREFUSED|ENOTFOUND|ECONNRESET|EAI_AGAIN|socket hang up/.test(error),
    result: { classification: 'NETWORK_ISSUE', note: 'A network or connection error, not an application response.' },
  },
  {
    test: (error) => /TEST_DATA_UNAVAILABLE|HANDLE_NOT_DECLARED/.test(error),
    result: { classification: 'TEST_DATA_ISSUE', note: 'A test-data handle is missing or undeclared. Missing data is never a product failure.' },
  },
  {
    test: (error) => /ENVIRONMENT_NOT_(CONFIGURED|ALLOWED)/.test(error),
    result: { classification: 'ENVIRONMENT_ISSUE', note: 'The environment is not configured or not allowed.' },
  },
  {
    test: (_error, inStep) => !inStep,
    result: {
      classification: 'UNKNOWN',
      note: 'The failure happened outside every Test Case step (setup or teardown), so no Expected Result was evaluated.',
    },
  },
  {
    test: (error) => /element\(s\) not found/.test(error) && /\bexpect\(/.test(error),
    result: {
      classification: 'PRODUCT_BUG',
      note: 'Suspected: the element the Expected Result names was not found. Confirm the locator is still valid before publishing — a stale locator is a TEST_SCRIPT_ISSUE.',
    },
  },
  {
    test: (error) => /\bexpect\(/.test(error),
    result: {
      classification: 'PRODUCT_BUG',
      note: 'Suspected: an Expected Result assertion failed. A human must confirm before anything is published.',
    },
  },
  {
    test: (error) => /\blocator\.\w+:|strict mode violation|Timeout \d+ms exceeded/.test(error),
    result: {
      classification: 'TEST_SCRIPT_ISSUE',
      note: 'A UI action could not be performed — usually a stale locator or a missing wait. It can also be a defect that removed or disabled the control.',
    },
  },
];

const FALLBACK: Classification = { classification: 'UNKNOWN', note: 'No rule matched. Classify by hand.' };

/**
 * @param error  the failure's error text, already sanitised
 * @param inStep whether the failure occurred inside a Test Case step
 */
export function classifyFailure(error: string, inStep: boolean): Classification {
  return RULES.find((rule) => rule.test(error, inStep))?.result ?? FALLBACK;
}
