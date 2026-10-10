/**
 * The confirmation dialogs of the Operating Country module (US-52857 RUN-001):
 *
 *   Approve this operating country?           confirm "Approve"
 *   Submit this operating country for approval? confirm "Send For Approval"
 *   Save changes to this operating country?   confirm "Update"
 *   Approve <name>? / Reject <name>?          field "Reason (required)",
 *                                             confirm "Approve|Reject Operating country"
 *   Deactivate <name>? / Activate <name>?     confirm "Deactivate|Activate Operating country"
 *
 * Locators and actions only.
 */

import type { Locator, Page } from '@playwright/test';

export class ConfirmDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly title: Locator;
  readonly reason: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog').or(page.getByRole('alertdialog'));
    this.title = this.dialog.getByRole('heading');
    this.reason = this.dialog.getByRole('textbox', { name: /^Reason/ });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel', exact: true });
  }

  /** The dialog's confirm button: the one button that is not Cancel or a close control. */
  get confirmButton(): Locator {
    return this.dialog.getByRole('button').filter({ hasNotText: /^(Cancel|Close)$/ }).filter({ hasText: /\S/ }).last();
  }

  async text(): Promise<string> {
    return ((await this.dialog.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  /** Title, body text and button names, for the steps that say "record". */
  async describe(): Promise<string> {
    const buttons = (await this.dialog.getByRole('button').allTextContents()).map((text) => text.trim()).filter(Boolean);
    return `"${await this.text()}" — buttons: ${buttons.join(', ')}`;
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async enterReason(reason: string): Promise<void> {
    await this.reason.fill(reason);
    await this.reason.press('Tab');
  }
}
