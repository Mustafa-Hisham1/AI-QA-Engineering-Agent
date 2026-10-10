import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';

test(
  'TC-52857-008 — [NBO][Company][Add Operating Country] Verify an all-permission user\'s Add form shows Name, Country, Currency and Remarks as required with only Cancel and Approve actions',
  testCaseDetails({ testCaseId: 'TC-52857-008', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    await test.step('Step 1: Log in as ADMIN_ALL, open the list page and click Add Operating Country', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      await list.addButton.click();
      await expect(form.addHeading).toBeVisible();
    });

    await test.step('Step 2: Inspect the fields', async () => {
      for (const field of [form.name, form.country, form.currency, form.remarks]) {
        await expect(field).toBeVisible();
        await expect(field).toHaveAccessibleName(/\(required\)/);
      }
    });

    await test.step('Step 3: Inspect the action buttons', async () => {
      await form.waitUntilReady();
      expect(await form.actions()).toEqual(['Cancel', 'Approve']);
    });
  },
);
