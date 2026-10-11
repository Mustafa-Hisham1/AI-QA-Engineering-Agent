/**
 * Add and Edit Operating Country — one form, `/admin/company/operating-country/add`
 * and `/admin/company/operating-country/<id>`.
 *
 * Locators and actions only. Fields are typed and then left with Tab: in
 * US-52857 RUN-001 a value set without a blur was reported saved yet did not
 * persist, and a value typed before the form initialised was dropped.
 */

import type { Locator, Page } from '@playwright/test';

export const FORM_ACTIONS = ['Cancel', 'Approve', 'Reject', 'Send For Approval', 'Update'] as const;
export type FormAction = (typeof FORM_ACTIONS)[number];

export interface OperatingCountryValues {
  readonly name?: string;
  readonly country?: string;
  readonly currency?: string;
  readonly remarks?: string;
}

export class OperatingCountryFormPage {
  static readonly addPath = '/admin/company/operating-country/add';

  readonly page: Page;
  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly name: Locator;
  readonly country: Locator;
  readonly currency: Locator;
  readonly remarks: Locator;
  readonly attentionSummary: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addHeading = page.getByRole('heading', { name: 'Add Operating Country', exact: true });
    this.editHeading = page.getByRole('heading', { name: 'Edit Operating Country', exact: true });
    this.name = page.getByRole('textbox', { name: /^Operating Country Name/ });
    this.country = page.getByRole('combobox', { name: /^Country/ });
    this.currency = page.getByRole('combobox', { name: /^Currency/ });
    this.remarks = page.getByRole('textbox', { name: /^Remarks/ });
    // The error notification repeats the phrase ("Could not save — 4 fields need attention.").
    this.attentionSummary = page.getByText(/\d+ fields? needs? attention/).filter({ hasNotText: 'Could not save' });
  }

  /** Either heading — the form is open. */
  get heading(): Locator {
    return this.addHeading.or(this.editHeading);
  }

  action(action: FormAction): Locator {
    return this.page.getByRole('button', { name: action, exact: true });
  }

  /** The form's action buttons that are present, in vocabulary order. */
  async actions(): Promise<FormAction[]> {
    const present: FormAction[] = [];
    for (const action of FORM_ACTIONS) if ((await this.action(action).count()) > 0) present.push(action);
    return present;
  }

  message(text: string): Locator {
    return this.page.getByText(text, { exact: true }).filter({ visible: true });
  }

  /** The character counter of a field, e.g. `16 / 100` for Name or `250 / 250` for Remarks. */
  counter(limit: 100 | 250): Locator {
    return this.page.getByText(new RegExp(`^\\d+ / ${limit}$`));
  }

  /**
   * Waits until the form has initialised and accepts input. While it loads, the
   * fields sit inside an `inert` subtree and silently ignore typing (US-52857
   * RUN-008, TC-52857-026: a cleared Name kept its value).
   */
  async waitUntilReady(): Promise<void> {
    await this.heading.waitFor();
    await this.page.waitForLoadState('networkidle');
    await this.name.waitFor();
    await this.page.waitForFunction(
      (element) => element !== null && (element as unknown as { closest(selector: string): unknown }).closest('[inert]') === null,
      await this.name.elementHandle(),
      { timeout: 15_000 },
    );
  }

  /**
   * Types a value and leaves the field with Tab. Re-types when the form
   * swallowed the value (seen in RUN-001 on a freshly loaded form).
   */
  async typeInto(field: Locator, value: string): Promise<void> {
    for (let attempt = 0; attempt < 5; attempt++) {
      await field.fill(value);
      if ((await field.inputValue()) === value) break;
      await this.page.waitForTimeout(500); // the form gives no event when it starts accepting input
    }
    await field.press('Tab');
  }

  /** Opens a dropdown, types to filter, and picks the exact option. */
  async choose(field: Locator, option: string): Promise<void> {
    if ((await field.evaluate((element) => element.tagName)) === 'SELECT') {
      await field.selectOption({ label: option });
      return;
    }
    await openDropdown(this.page, field);
    await filterDropdown(this.page, field, option);
    const wanted = this.page.getByRole('option', { name: option, exact: true });
    try {
      await wanted.first().waitFor({ timeout: 10_000 });
    } catch {
      const offered = (await this.page.getByRole('option').allTextContents()).map((text) => text.trim()).slice(0, 20);
      const tag = await field.evaluate((element) => `${element.tagName} role=${element.getAttribute('role') ?? ''} expanded=${element.getAttribute('aria-expanded') ?? ''}`);
      throw new Error(`Option "${option}" was not offered by ${tag}. Options present: ${JSON.stringify(offered)}`);
    }
    // A virtual-scrolling list re-renders its window while it settles, which
    // detaches the option mid-click (RUN-018, TC-52857-025: "element was
    // detached from the DOM, retrying" until the test timed out). Retry the
    // click on the re-resolved option rather than waiting on a stale handle.
    for (let attempt = 0; ; attempt++) {
      try {
        await wanted.first().click({ timeout: 10_000 });
        return;
      } catch (error) {
        if (attempt >= 4) throw error;
        await wanted.first().waitFor({ timeout: 10_000 });
      }
    }
  }

  /** Whether a dropdown offers an option, by its exact label. */
  async offersOption(field: Locator, option: string): Promise<boolean> {
    return offersOption(this.page, field, option);
  }

  /** The label a dropdown shows as chosen — the selected option of a native `<select>`, else its text. */
  async selectedLabel(field: Locator): Promise<string> {
    const label = await field.evaluate((element) => {
      const control = element as unknown as {
        selectedOptions?: ArrayLike<{ textContent: string | null }>;
        textContent: string | null;
      };
      const selected = control.selectedOptions;
      return selected && selected.length > 0 ? (selected[0]!.textContent ?? '') : (control.textContent ?? '');
    });
    return label.trim();
  }

  async fill(values: OperatingCountryValues): Promise<void> {
    if (values.name !== undefined) await this.typeInto(this.name, values.name);
    if (values.country !== undefined) await this.choose(this.country, values.country);
    if (values.currency !== undefined) await this.choose(this.currency, values.currency);
    if (values.remarks !== undefined) await this.typeInto(this.remarks, values.remarks);
  }

  async click(action: FormAction): Promise<void> {
    await this.action(action).click();
  }
}

/**
 * The filter box PrimeNG renders *inside* an opened select overlay.
 *
 * Not every dropdown of this module has one, and that difference is what
 * RUN-018 tripped over (TC-52857-019/-020/-025/-050). Observed on STG
 * 2026-10-11: the Add form's **Country** list has no filter box and renders
 * every option, while the Add form's **Currency** list and the list page's
 * **Country** filter each have one and render only a ~12-row virtual window.
 * Typing on the combobox never reaches that box, so the window stays
 * unfiltered and an option that exists looks "not offered".
 */
function overlayFilter(page: Page): Locator {
  return page.locator('.p-select-overlay input, .p-dropdown-panel input, [role=listbox] input').first();
}

/** Opens a custom select, reopening while a click lands before the form is live. */
async function openDropdown(page: Page, field: Locator): Promise<void> {
  // A click made while the form initialises is swallowed and the list never
  // opens (RUN-008, TC-52857-024) — reopen until expanded.
  for (let attempt = 0; attempt < 3 && (await field.getAttribute('aria-expanded')) !== 'true'; attempt++) {
    await field.click();
    await page.waitForTimeout(300); // the overlay animates open with no event to wait on
  }
}

/**
 * Narrows an opened select to `term`: into the overlay's filter box when it has
 * one, else by typing on the combobox itself. Settles on the option list having
 * reacted, so a virtualised list is never read while it still shows the
 * unfiltered window.
 */
async function filterDropdown(page: Page, field: Locator, term: string): Promise<void> {
  const filter = overlayFilter(page);
  if (await filter.isVisible().catch(() => false)) {
    await filter.fill(term);
  } else {
    await field.pressSequentially(term);
  }
  // The list re-renders asynchronously with no event of its own; settle on it
  // no longer changing rather than on a fixed delay.
  let previous = '';
  for (let attempt = 0; attempt < 20; attempt++) {
    const current = (await page.getByRole('option').allTextContents()).join('|');
    if (current === previous) return;
    previous = current;
    await page.waitForTimeout(100);
  }
}

/**
 * Whether a dropdown offers `option`. A native `<select>` is read directly; a
 * custom one is opened, filtered, read, and closed again.
 */
export async function offersOption(page: Page, field: Locator, option: string): Promise<boolean> {
  if ((await field.evaluate((element) => element.tagName)) === 'SELECT') {
    return (await field.getByRole('option', { name: option, exact: true }).count()) > 0;
  }
  await openDropdown(page, field);
  await filterDropdown(page, field, option);
  const offered = await page
    .getByRole('option', { name: option, exact: true })
    .first()
    .waitFor({ timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  await page.keyboard.press('Escape');
  return offered;
}

/** All option labels of a dropdown (native `<select>` only; custom lists render a window of them). */
export async function optionLabels(field: Locator): Promise<string[]> {
  return (await field.getByRole('option').allTextContents()).map((text) => text.trim());
}
