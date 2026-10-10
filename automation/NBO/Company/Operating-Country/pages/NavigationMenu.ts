/**
 * The Admin Panel's top navigation (Admin Module · Company · Branch · Agency ·
 * Staff for a full-rights user). Locators and actions only.
 */

import type { Locator, Page } from '@playwright/test';

export class NavigationMenu {
  readonly page: Page;
  readonly companyMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.companyMenu = page.getByRole('button', { name: 'Company' }).or(page.getByRole('link', { name: 'Company', exact: true }));
  }

  /** A navigation entry by name, wherever the menu renders it. */
  entry(name: string): Locator {
    return this.page
      .getByRole('link', { name, exact: true })
      .or(this.page.getByRole('menuitem', { name, exact: true }))
      .or(this.page.getByRole('button', { name, exact: true }));
  }

  /** Opens the Company menu when the user has one; a user without it has nothing to open. */
  async openCompanyMenu(): Promise<boolean> {
    if ((await this.companyMenu.count()) === 0) return false;
    await this.companyMenu.first().click();
    return true;
  }
}
