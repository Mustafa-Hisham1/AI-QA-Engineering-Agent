/** The page a user without a right is sent to (`/access-denied`, US-52857 RUN-001). */

import type { Locator, Page } from '@playwright/test';

export class AccessDeniedPage {
  static readonly path = '/access-denied';

  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText('Access denied', { exact: true });
  }
}
