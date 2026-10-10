import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { VALID_PAIR, cancelForm, findRecord, freshName } from '../support/operating-country.ts';

test(
  'TC-52857-021 — [NBO][Company][Add Operating Country] Verify no Operating Country is created when a filled Add form is cancelled',
  testCaseDetails({ testCaseId: 'TC-52857-021', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    let runName = '';

    await test.step('Step 1: Log in as ADMIN_ALL, open the Add form and fill in every field', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      runName = await freshName(page);
      await list.open();
      await list.addButton.click();
      await form.waitUntilReady();
      await form.fill({ name: runName, ...VALID_PAIR, remarks: 'Cancel check' });
      for (const field of [form.name, form.country, form.currency, form.remarks]) await expect(field).not.toHaveAttribute('aria-invalid', 'true');
    });

    await test.step('Step 2: Click Cancel (confirm leaving if asked)', async () => {
      await cancelForm(page);
      await expect(list.heading).toBeVisible();
    });

    await test.step('Step 3: Search the list (Both filter) by RUN-NAME', async () => {
      await findRecord(page, runName, 'Both');
      await expect(list.rowByName(runName)).toHaveCount(0);
    });
  },
);
