import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { cancelForm, findRecord } from '../support/operating-country.ts';

test(
  'TC-52857-022 — [NBO][Company][Edit Operating Country] Verify the Edit form pre-fills name and remarks, locks Country and Currency, and offers Cancel, Approve and Reject to an all-permission user',
  testCaseDetails({ testCaseId: 'TC-52857-022', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    const row = list.rows.filter({ hasText: 'Approved' }).first();
    let listed = { name: '', country: '', currency: '' };

    await test.step('Step 1: Log in as ADMIN_ALL and click Edit on an Approved / Active row', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      listed = {
        name: await list.cellText(row, 'Name'),
        country: await list.cellText(row, 'Country'),
        currency: await list.cellText(row, 'Currency'),
      };
      await list.rowAction(row, 'Edit').click();
      await form.waitUntilReady();
      await expect(form.editHeading).toBeVisible();
    });

    await test.step('Step 2: Compare Name, Country and Currency with the row', async () => {
      await expect(form.name).toHaveValue(listed.name);
      expect(await form.selectedLabel(form.country)).toBe(listed.country);
      expect(await form.selectedLabel(form.currency)).toBe(listed.currency);
    });

    await test.step('Step 3: Try to open the Country and Currency dropdowns', async () => {
      await expect(form.country).toBeDisabled();
      await expect(form.currency).toBeDisabled();
    });

    await test.step('Step 4: Inspect Remarks', async () => {
      await expect(form.remarks).not.toHaveValue('');
      await expect(form.remarks).toBeEditable();
    });

    await test.step('Step 5: Inspect the actions', async () => {
      expect(await form.actions()).toEqual(['Cancel', 'Approve', 'Reject']);
    });

    await test.step('Step 6: Click Cancel', async () => {
      await cancelForm(page);
      await findRecord(page, listed.name, 'Active');
      const after = list.rowByName(listed.name);
      expect(await list.cellText(after, 'Country')).toBe(listed.country);
      expect(await list.cellText(after, 'Currency')).toBe(listed.currency);
    });
  },
);
