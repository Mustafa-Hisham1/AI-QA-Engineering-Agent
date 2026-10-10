import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { ConfirmDialog } from '../pages/ConfirmDialog.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { Toast } from '../pages/Toast.ts';
import { VALID_PAIR, findRecord, freshName, record, rowState } from '../support/operating-country.ts';

test(
  'TC-52857-015 — [NBO][Company][Add Operating Country] Verify a Maker\'s new Operating Country is Pending for Approval and Inactive and appears only under the Inactive filter',
  testCaseDetails({ testCaseId: 'TC-52857-015', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const dialog = new ConfirmDialog(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);
    const toast = new Toast(page);

    let runName = '';

    await test.step('Step 1: Log in as OPERATING_COUNTRIES_MAKER, open the Add form and fill in every field', async () => {
      await login.signInAs(account('OPERATING_COUNTRIES_MAKER'));
      runName = await freshName(page);
      await list.open();
      await list.addButton.click();
      await form.waitUntilReady();
      await form.fill({ name: runName, ...VALID_PAIR, remarks: 'Please approve' });
      for (const field of [form.name, form.country, form.currency, form.remarks]) await expect(field).not.toHaveAttribute('aria-invalid', 'true');
    });

    await test.step('Step 2: Click Send For Approval, then confirm Send For Approval in the dialog', async () => {
      await form.click('Send For Approval');
      await expect(dialog.dialog).toContainText('Submit this operating country for approval?');
      await dialog.confirm();
      const text = await toast.text();
      record(2, `confirmation "${text}"`);
      expect(text).toMatch(/success/i);
      await expect(page).toHaveURL(/\/admin\/company\/operating-country$/);
    });

    await test.step('Step 3: Search the default (Active) list by name RUN-NAME', async () => {
      await findRecord(page, runName, 'Active');
      await expect(list.rowByName(runName)).toHaveCount(0);
    });

    await test.step('Step 4: Select the Inactive filter and search by RUN-NAME', async () => {
      await findRecord(page, runName, 'Inactive');
      const state = await rowState(list, runName);
      expect(state).not.toBeNull();
      record(4, `Approval Status label "${state!.approval}", Status "${state!.status}"`);
      expect(state!.approval).toMatch(/^Pending/);
      expect(state!.status.toLowerCase()).toBe('inactive');
    });
  },
);
