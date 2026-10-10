import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';

test(
  'TC-52857-010 — [NBO][Company][Add Operating Country] Verify required-field messages appear for Name, Country, Currency and Remarks when an all-permission user clicks Approve on an empty form',
  testCaseDetails({ testCaseId: 'TC-52857-010', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    await test.step('Step 1: Log in as ADMIN_ALL and open the Add form', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      await list.addButton.click();
      await form.waitUntilReady();
      await expect(form.name).toHaveValue('');
      await expect(form.remarks).toHaveValue('');
    });

    await test.step('Step 2: Click Approve', async () => {
      await form.click('Approve');
      await expect(form.attentionSummary).toBeVisible();
      await expect(form.addHeading).toBeVisible();
    });

    await test.step('Step 3: Read each field\'s message', async () => {
      for (const message of ['Operating Country Name is required.', 'Country is required.', 'Currency is required.', 'Remarks is required.']) {
        await expect(form.message(message)).toBeVisible();
      }
    });
  },
);
