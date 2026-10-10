import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { record } from '../support/operating-country.ts';

test(
  'TC-52857-009 — [NBO][Company][Add Operating Country] Verify a Maker\'s Add form requires Remarks, offers only Send For Approval and blocks an empty submission',
  testCaseDetails({ testCaseId: 'TC-52857-009', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    await test.step('Step 1: Log in as OPERATING_COUNTRIES_MAKER and click Add Operating Country', async () => {
      await login.signInAs(account('OPERATING_COUNTRIES_MAKER'));
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
      expect(await form.actions()).toEqual(['Cancel', 'Send For Approval']);
    });

    await test.step('Step 4: Leave every field empty and click Send For Approval', async () => {
      await form.click('Send For Approval');
      await expect(form.attentionSummary).toBeVisible();
      await expect(form.addHeading).toBeVisible();
      for (const message of ['Operating Country Name is required.', 'Country is required.', 'Currency is required.']) {
        await expect(form.message(message)).toBeVisible();
      }
      // The Remarks text for a Maker is not stated by the case: feedback only.
      await expect(form.remarks).toHaveAttribute('aria-invalid', 'true');
      record(4, `Remarks message "Remarks is required." visible: ${await form.message('Remarks is required.').isVisible()}`);
    });
  },
);
