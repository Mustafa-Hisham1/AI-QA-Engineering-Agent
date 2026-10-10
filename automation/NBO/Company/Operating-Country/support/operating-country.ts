/**
 * Run-time test data and the setup flows many Operating Country specs share.
 *
 * Actions only — every assertion belongs to the spec, against its Test Case's
 * Expected Results. Names follow decision D-17 (US 52857): every name created
 * by automation contains `AUT`, is letters-and-spaces only (the Name rule), is
 * unique, and is checked unused before it is used. Records are permanent: STG
 * cannot delete them, and by human decision (2026-10-10) no spec cleans up.
 */

import { randomInt } from 'node:crypto';

import type { Page } from '@playwright/test';

import { test } from '../../../../../src/automation/fixtures.ts';

import { ConfirmDialog } from '../pages/ConfirmDialog.ts';
import { OperatingCountryFormPage, type OperatingCountryValues } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage, type StatusFilter } from '../pages/OperatingCountryListPage.ts';
import { Toast } from '../pages/Toast.ts';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

/** `AUT Opc Xxxxxxxx` — the convention of US-52857 RUN-001. */
export function generateName(): string {
  const word = Array.from({ length: 8 }, () => LETTERS[randomInt(LETTERS.length)]).join('');
  return `AUT Opc ${word[0]!.toUpperCase()}${word.slice(1)}`;
}

/** A generated name that no record uses yet (Both filter). Leaves the list on Both. */
export async function freshName(page: Page): Promise<string> {
  const list = new OperatingCountryListPage(page);
  for (let attempt = 0; attempt < 5; attempt++) {
    const name = generateName();
    await list.open();
    await list.search({ name, status: 'Both' });
    if ((await list.rowByName(name).count()) === 0) return name;
  }
  throw new Error('Could not find an unused generated name in 5 attempts.');
}

/** The pair STG accepts (US-52857 RUN-001, D-06). */
export const VALID_PAIR = { country: 'Egypt', currency: 'Egyptian Pound' } as const;

export type SaveMode = 'Approve' | 'Send For Approval' | 'Update';

/**
 * Opens the Add form from the list, fills it, saves with `mode` and confirms
 * the dialog. Returns the result notification's text. Does not judge it.
 */
export async function createRecord(page: Page, values: OperatingCountryValues, mode: 'Approve' | 'Send For Approval'): Promise<string> {
  const list = new OperatingCountryListPage(page);
  const form = new OperatingCountryFormPage(page);
  await list.open();
  await list.addButton.click();
  await form.waitUntilReady();
  await form.fill(values);
  return saveAndConfirm(page, mode);
}

/** Clicks a save action, confirms its dialog, and returns the notification's text. */
export async function saveAndConfirm(page: Page, mode: SaveMode | 'Reject'): Promise<string> {
  const form = new OperatingCountryFormPage(page);
  const dialog = new ConfirmDialog(page);
  const toast = new Toast(page);
  await toast.waitUntilClear();
  await form.click(mode);
  await dialog.dialog.waitFor();
  await dialog.confirm();
  return toast.text();
}

/** Finds a record by exact name under a status filter. */
export async function findRecord(page: Page, name: string, status: StatusFilter): Promise<OperatingCountryListPage> {
  const list = new OperatingCountryListPage(page);
  await list.open();
  await list.search({ name, status });
  return list;
}

/** Opens a record's Edit form from the list. */
export async function openEdit(page: Page, name: string, status: StatusFilter): Promise<OperatingCountryFormPage> {
  const list = await findRecord(page, name, status);
  await list.rowAction(list.rowByName(name), 'Edit').click();
  const form = new OperatingCountryFormPage(page);
  await form.waitUntilReady();
  return form;
}

/**
 * Approves or rejects a record from its list row with a reason, and returns
 * the notification's text.
 */
export async function decideFromList(page: Page, name: string, decision: 'Approve' | 'Reject', reason: string): Promise<string> {
  const list = await findRecord(page, name, 'Both');
  const dialog = new ConfirmDialog(page);
  const toast = new Toast(page);
  await toast.waitUntilClear();
  await list.rowAction(list.rowByName(name), decision).click();
  await dialog.dialog.waitFor();
  await dialog.enterReason(reason);
  await dialog.confirm();
  return toast.text();
}

/**
 * Records what a step's Expected Result says to record ("record its exact
 * text"). Shown under that step in the HTML report, through the sanitizer.
 * Never an assertion.
 */
export function record(step: number, text: string): void {
  test.info().annotations.push({ type: 'observation', description: `Step ${step}: ${text}` });
}

/** A record's Approval Status and Status as listed, or null when it is not on the page. */
export async function rowState(list: OperatingCountryListPage, name: string): Promise<{ approval: string; status: string } | null> {
  const row = list.rowByName(name);
  if ((await row.count()) === 0) return null;
  return { approval: await list.cellText(row.first(), 'Approval Status'), status: await list.cellText(row.first(), 'Status') };
}

/** Clicks Cancel on a form and confirms leaving when the app asks. */
export async function cancelForm(page: Page): Promise<void> {
  const form = new OperatingCountryFormPage(page);
  const dialog = new ConfirmDialog(page);
  await form.click('Cancel');
  const asked = await dialog.dialog
    .first()
    .waitFor({ timeout: 1_500 })
    .then(() => true)
    .catch(() => false);
  if (asked) await dialog.confirm();
  await page.waitForURL(/\/admin\/company\/operating-country$/);
}
