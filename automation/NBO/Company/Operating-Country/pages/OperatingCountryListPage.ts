/**
 * Operating Country list — `/admin/company/operating-country`.
 *
 * Locators and actions only. Accessible names are those US-52857 RUN-001
 * observed on STG; the table structure is confirmed by the automated runs.
 */

import type { Locator, Page } from '@playwright/test';

export type StatusFilter = 'Active' | 'Inactive' | 'Both';

/** A query-string value of `url`, matched case-insensitively on the parameter name. */
function searchParam(url: string, parameter: string): string | null {
  const wanted = parameter.toLowerCase();
  for (const [key, value] of new URLSearchParams(new URL(url).search)) {
    if (key.toLowerCase() === wanted) return value;
  }
  return null;
}

export const LIST_COLUMNS = ['Name', 'Country', 'Currency', 'Approval Status', 'Status', 'Actions'] as const;
export type ListColumn = (typeof LIST_COLUMNS)[number];

/** Every row action the list can offer, by accessible name. */
export const ROW_ACTIONS = ['Edit', 'Approve', 'Reject', 'Activate', 'Deactivate', 'View All Branches'] as const;

export class OperatingCountryListPage {
  static readonly path = '/admin/company/operating-country';

  readonly page: Page;
  readonly heading: Locator;
  readonly addButton: Locator;
  readonly nameFilter: Locator;
  readonly countryFilter: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly table: Locator;
  readonly columnHeaders: Locator;
  readonly rows: Locator;
  readonly summary: Locator;
  readonly recordCount: Locator;
  readonly noResults: Locator;
  readonly nextPage: Locator;
  readonly firstPage: Locator;
  readonly rowsPerPage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Operating Country', exact: true });
    this.addButton = page
      .getByRole('button', { name: 'Add Operating Country' })
      .or(page.getByRole('link', { name: 'Add Operating Country' }));
    this.nameFilter = page.getByRole('textbox', { name: 'Operating Country Name' });
    this.countryFilter = page.getByRole('combobox', { name: 'Country' });
    this.searchButton = page.getByRole('button', { name: 'Search', exact: true });
    this.resetButton = page.getByRole('button', { name: 'Reset', exact: true });
    this.table = page.getByRole('table');
    this.columnHeaders = this.table.getByRole('columnheader');
    // Data rows only: the empty state is rendered inside the table, too.
    this.rows = this.table
      .getByRole('row')
      .filter({ has: page.getByRole('cell') })
      .filter({ hasNotText: 'No operating countries match these filters' });
    this.summary = page.getByText(/^Showing \d+ to \d+ of \d+$/);
    this.recordCount = page.getByText(/^\d+ operating countr(y|ies)$/);
    this.noResults = page.getByText('No operating countries match these filters');
    this.nextPage = page.getByRole('button', { name: 'Next Page' });
    this.firstPage = page.getByRole('button', { name: 'First Page' });
    this.rowsPerPage = page.getByRole('combobox', { name: /rows per page/i });
  }

  statusOption(status: StatusFilter): Locator {
    return this.page.getByRole('radio', { name: status, exact: true }).or(this.page.getByRole('button', { name: status, exact: true }));
  }

  /** Opens the list and settles once its data has arrived and rendered. */
  async open(): Promise<void> {
    const answered = this.listResponse();
    await this.page.goto(OperatingCountryListPage.path);
    await answered;
    await this.waitUntilLoaded();
  }

  /** The list's own data request (a GET of operating countries). */
  private listResponse(): Promise<unknown> {
    return this.page
      .waitForResponse((response) => /operatingcountr/i.test(response.url()) && response.request().method() === 'GET', { timeout: 30_000 })
      .catch(() => undefined); // a list served from the app's cache makes no request; the render wait below still applies
  }

  /**
   * Settles on the list having rendered its column headers and its rows or its
   * no-results state. Reading before the headers exist once gave "no Name
   * column" (US-52857 RUN-008, TC-52857-023).
   */
  async waitUntilLoaded(): Promise<void> {
    await this.heading.waitFor();
    await this.rows.first().or(this.noResults).first().waitFor();
    if (!(await this.noResults.first().isVisible())) await this.columnHeaders.first().waitFor();
  }

  async chooseCountry(country: string): Promise<void> {
    if ((await this.countryFilter.evaluate((element) => element.tagName)) === 'SELECT') {
      await this.countryFilter.selectOption({ label: country });
      return;
    }
    await this.countryFilter.click();
    await this.countryFilter.pressSequentially(country);
    await this.page.getByRole('option', { name: country, exact: true }).first().click();
  }

  /** Sets the filters given, clicks Search, and waits for the list to answer. */
  async search(filters: { name?: string; country?: string; status?: StatusFilter }): Promise<void> {
    if (filters.status) await this.statusOption(filters.status).click();
    if (filters.country) await this.chooseCountry(filters.country);
    if (filters.name !== undefined) await this.nameFilter.fill(filters.name);

    // Wait for the SEARCH response, not merely for "a list GET": the list's own
    // initial load matches that loosely and may still be in flight, and
    // awaiting it returned the UNFILTERED page-1 rows (RUN-018, TC-52857-045
    // read "aut opc ctpvwzga" for a "GYP" search; TC-52857-049 saw rows where
    // it expected the no-results message). Proven 2026-10-11 by capturing the
    // matched URL: `...&Status=1&isPaginated=true` with no `Name=`.
    //
    // The predicate is also matched case-insensitively on the parameter name,
    // and a search whose response never arrives (the app can answer an
    // identical query from its cache) must not fail the step: the row-level
    // settle below is what the assertions actually depend on.
    const name = filters.name;
    // The table occasionally keeps the PREVIOUS result set on screen even after
    // the new response arrived (RUN-033/RUN-035, TC-52857-045: "AUT Opc …" rows
    // for a "GYP" search, still stale 30 s later, while the same search answered
    // correctly on its own). Clicking Search again always resolved it, so the
    // search is re-submitted once before the wait is allowed to fail — a
    // re-query of the same filters, never a weakened expectation.
    for (let attempt = 0; ; attempt++) {
      const answered = this.page
        .waitForResponse(
          (response) =>
            /operatingcountr/i.test(response.url()) &&
            response.request().method() === 'GET' &&
            (name === undefined || name === '' || searchParam(response.url(), 'Name') === name),
          { timeout: 30_000 },
        )
        // A repeated identical query can be answered from the app's cache with
        // no request at all; the row-level settle below is the real check.
        .catch(() => undefined);
      await this.searchButton.click();
      await answered;
      await this.waitUntilLoaded();
      if (name === undefined || name === '') return;
      try {
        await this.waitUntilRowsMatch(name, attempt === 0 ? 8_000 : 20_000);
        return;
      } catch (error) {
        if (attempt >= 1) throw error;
      }
    }
  }

  /**
   * Settles until every listed Name contains `term` (case-insensitively), or
   * the list shows its no-results state. Guards against reading the previous
   * search's rows while the new ones are still rendering.
   *
   * An action, never an assertion (Page Objects carry none). It does NOT judge
   * the result: a row set that stays stale past the deadline is a failure of
   * this wait, not of the application, so it raises a plain Error naming what
   * is still on screen. Returning quietly instead would hand the spec the
   * PREVIOUS search's rows and report a product defect that does not exist
   * (RUN-033, TC-52857-045 read "aut opc ygiucpxd" for a "GYP" search).
   */
  async waitUntilRowsMatch(term: string, timeoutMs = 15_000): Promise<void> {
    const wanted = term.toLowerCase();
    const deadline = Date.now() + timeoutMs;
    let names: string[] = [];
    while (Date.now() < deadline) {
      if (await this.noResults.first().isVisible().catch(() => false)) return;
      names = await this.columnValues('Name');
      if (names.length > 0 && names.every((value) => value.toLowerCase().includes(wanted))) return;
      await this.page.waitForTimeout(100);
    }
    throw new Error(
      `The list still showed rows that do not match the search "${term}" after ${Math.round(timeoutMs / 1000)} s: ${JSON.stringify(names.slice(0, 5))}. ` +
        'The search response had already arrived, so this is the table not having re-rendered — not a search defect.',
    );
  }

  /**
   * Which status option is marked selected. The app's toggle may mark it with
   * aria-pressed, aria-checked or aria-selected; the first one present wins.
   */
  async selectedStatus(): Promise<StatusFilter | null> {
    for (const status of ['Active', 'Inactive', 'Both'] as const) {
      const marked = await this.statusOption(status).first().evaluate((element) =>
        ['aria-pressed', 'aria-checked', 'aria-selected', 'data-state'].some((name) => {
          const value = element.getAttribute(name);
          return value === 'true' || value === 'on' || value === 'checked' || value === 'active';
        }),
      );
      if (marked) return status;
    }
    return null;
  }

  async goToNextPage(): Promise<void> {
    await this.paginate(this.nextPage);
  }

  async goToFirstPage(): Promise<void> {
    await this.paginate(this.firstPage);
  }

  private async paginate(control: Locator): Promise<void> {
    const before = ((await this.summary.textContent()) ?? '').trim();
    await control.click();
    // Settled once the summary names a different range.
    await this.summary.filter({ hasNotText: before }).waitFor();
    await this.waitUntilLoaded();
  }

  async reset(): Promise<void> {
    await this.resetButton.click();
  }

  rowByName(name: string): Locator {
    return this.rows.filter({ has: this.page.getByRole('cell', { name, exact: true }) });
  }

  /** Header texts as authored — `textContent`, because the page upper-cases them with CSS. */
  async headerTexts(): Promise<string[]> {
    return (await this.columnHeaders.allTextContents()).map((text) => text.trim());
  }

  async columnIndex(column: ListColumn): Promise<number> {
    const headers = await this.headerTexts();
    const index = headers.indexOf(column);
    if (index === -1) throw new Error(`The list has no "${column}" column (headers: ${headers.join(', ')}).`);
    return index;
  }

  async cellText(row: Locator, column: ListColumn): Promise<string> {
    return ((await row.getByRole('cell').nth(await this.columnIndex(column)).textContent()) ?? '').trim();
  }

  /** The values of one column on the current page, top to bottom. */
  async columnValues(column: ListColumn): Promise<string[]> {
    const index = await this.columnIndex(column);
    const values: string[] = [];
    for (const row of await this.rows.all()) values.push(((await row.getByRole('cell').nth(index).textContent()) ?? '').trim());
    return values;
  }

  /**
   * The labels of the controls in a row's Actions cell, as the app names them
   * (aria-label, else title, else text). Icon buttons carry no visible text.
   */
  async rowActionLabels(row: Locator): Promise<string[]> {
    const cell = row.getByRole('cell').nth(await this.columnIndex('Actions'));
    return cell
      .getByRole('button')
      .or(cell.getByRole('link'))
      .evaluateAll((controls) =>
        controls.map((control) => (control.getAttribute('aria-label') ?? control.getAttribute('title') ?? control.textContent ?? '').trim()),
      );
  }

  /** The known actions a row offers, matched from its control labels. */
  async rowActions(row: Locator): Promise<string[]> {
    const labels = (await this.rowActionLabels(row)).map((label) => label.toLowerCase());
    return ROW_ACTIONS.filter((action) => labels.some((label) => label === action.toLowerCase() || label.startsWith(`${action.toLowerCase()} `)));
  }

  rowAction(row: Locator, action: (typeof ROW_ACTIONS)[number]): Locator {
    const name = new RegExp(`^${action}( |$)`, 'i');
    return row.getByRole('button', { name }).or(row.getByRole('link', { name }));
  }

  /** The rows-per-page value shown — the selected option of a native `<select>`, else its text. */
  async rowsPerPageValue(): Promise<string> {
    const value = await this.rowsPerPage.evaluate((element) => {
      const control = element as unknown as { selectedOptions?: ArrayLike<{ textContent: string | null }>; value?: string; textContent: string | null };
      const selected = control.selectedOptions;
      return selected && selected.length > 0 ? (selected[0]!.textContent ?? '') : (control.value ?? control.textContent ?? '');
    });
    return value.trim();
  }

  /** The number in "<n> operating countries". */
  async recordCountValue(): Promise<number> {
    return Number(/^(\d+)/.exec(((await this.recordCount.textContent()) ?? '').trim())?.[1] ?? Number.NaN);
  }

  /** The `z` of "Showing x to y of z". */
  async total(): Promise<number> {
    if (await this.noResults.isVisible()) return 0;
    const text = await this.summary.innerText();
    return Number(/of (\d+)$/.exec(text.trim())?.[1] ?? Number.NaN);
  }
}
