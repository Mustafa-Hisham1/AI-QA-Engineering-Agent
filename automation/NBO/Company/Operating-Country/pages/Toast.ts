/**
 * The short-lived result notification ("Success — …" / "Error — …").
 *
 * RUN-001 missed two that had closed before they were read, so callers start
 * waiting before the click that triggers one (`next()`), then read it.
 * Locators and actions only.
 */

import type { Locator, Page } from '@playwright/test';

export class Toast {
  readonly page: Page;
  readonly any: Locator;

  constructor(page: Page) {
    this.page = page;
    // Only notifications: the list's record count ("1 operating country") is a live
    // `status` region too, and was once read as a toast (US-52857 RUN-008, TC-52857-028).
    this.any = page
      .getByRole('alert')
      .or(page.getByRole('status'))
      .filter({ hasText: /^\s*(Success|Error|Warning|Info)\b/ });
  }

  withText(text: string | RegExp): Locator {
    return this.any.filter({ hasText: text });
  }

  success(): Locator {
    return this.any.filter({ hasText: /success/i });
  }

  error(): Locator {
    return this.any.filter({ hasText: /error/i });
  }

  /**
   * Waits for notifications on screen to close, so the next one read is the
   * next action's — not the previous one still fading out.
   */
  async waitUntilClear(): Promise<void> {
    await this.any
      .first()
      .waitFor({ state: 'hidden', timeout: 15_000 })
      .catch(() => undefined);
  }

  /** The text of the most recent notification, whitespace collapsed. */
  async text(): Promise<string> {
    const last = this.any.last();
    await last.waitFor();
    return ((await last.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }
}
