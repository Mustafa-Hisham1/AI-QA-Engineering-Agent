import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { Toast } from '../pages/Toast.ts';
import { findRecord, freshName, record, saveAndConfirm } from '../support/operating-country.ts';

test(
  'TC-52857-019 — [NBO][Company][Add Operating Country] Verify an inactive Country or Currency is listed on the Add form and creation with it is refused, recording the message',
  testCaseDetails({ testCaseId: 'TC-52857-019', storyId: 52857, adoId: null }),
  async ({ page, account, dataValue }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);
    const toast = new Toast(page);

    let runName = '';
    let runName2 = '';
    let inactiveCountry = '';
    let inactiveCurrency = '';

    await test.step('Step 1: Log in as ADMIN_ALL, open the Add form and open the Country list', async () => {
      inactiveCountry = dataValue('OPC_COUNTRY_INACTIVE');
      inactiveCurrency = dataValue('OPC_CURRENCY_INACTIVE');
      await login.signInAs(account('ADMIN_ALL'));
      runName = await freshName(page);
      runName2 = await freshName(page);
      await list.open();
      await list.addButton.click();
      await form.waitUntilReady();
      expect(await form.offersOption(form.country, inactiveCountry)).toBe(true);
    });

    await test.step('Step 2: Enter RUN-NAME, select the inactive Country, Egyptian Pound and remarks, then click Approve', async () => {
      await form.fill({ name: runName, country: inactiveCountry, currency: 'Egyptian Pound', remarks: 'Inactive country check' });
      await saveAndConfirm(page, 'Approve');
      await expect(toast.withText('The selected country is not active.')).toBeVisible();
      await expect(form.addHeading).toBeVisible();
    });

    await test.step('Step 3: Enter RUN-NAME-2, select Egypt, the inactive Currency and remarks, then click Approve', async () => {
      await toast.waitUntilClear();
      await form.fill({ name: runName2, country: 'Egypt', currency: inactiveCurrency, remarks: 'Inactive currency check' });
      const text = await saveAndConfirm(page, 'Approve');
      record(3, `message "${text}"`);
      await expect(toast.error()).toBeVisible();
      await expect(form.addHeading).toBeVisible();
    });

    await test.step('Step 4: Search the list (Both filter) for RUN-NAME and RUN-NAME-2', async () => {
      for (const name of [runName, runName2]) {
        await findRecord(page, name, 'Both');
        await expect(list.rowByName(name)).toHaveCount(0);
      }
    });
  },
);
