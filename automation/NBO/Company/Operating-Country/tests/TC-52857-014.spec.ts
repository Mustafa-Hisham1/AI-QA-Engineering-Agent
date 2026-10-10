import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { VALID_PAIR, freshName, record, saveAndConfirm } from '../support/operating-country.ts';

test(
  'TC-52857-014 — [NBO][Company][Add Operating Country] Verify a new Operating Country is Approved and Active at the top of the list when an all-permission user approves it on creation',
  testCaseDetails({ testCaseId: 'TC-52857-014', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    let runName = '';

    await test.step('Step 1: Log in as ADMIN_ALL and open the Add form', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      runName = await freshName(page);
      await list.open();
      await list.addButton.click();
      await form.waitUntilReady();
      await expect(form.addHeading).toBeVisible();
    });

    await test.step('Step 2: Enter RUN-NAME, select Egypt and Egyptian Pound, enter the remarks', async () => {
      await form.fill({ name: runName, ...VALID_PAIR, remarks: 'Created by QA' });
      for (const field of [form.name, form.country, form.currency, form.remarks]) await expect(field).not.toHaveAttribute('aria-invalid', 'true');
    });

    await test.step('Step 3: Click Approve', async () => {
      const text = await saveAndConfirm(page, 'Approve');
      record(3, `confirmation "${text}"`);
      expect(text).toMatch(/success/i);
      await expect(page).toHaveURL(/\/admin\/company\/operating-country$/);
    });

    await test.step('Step 4: Look at the default list (Active filter, page 1)', async () => {
      await list.open();
      const first = list.rows.first();
      expect(await list.cellText(first, 'Name')).toBe(runName);
      expect(await list.cellText(first, 'Country')).toBe('Egypt');
      expect(await list.cellText(first, 'Currency')).toBe('Egyptian Pound');
      expect(await list.cellText(first, 'Approval Status')).toBe('Approved');
      expect(await list.cellText(first, 'Status')).toBe('Active');
    });
  },
);
