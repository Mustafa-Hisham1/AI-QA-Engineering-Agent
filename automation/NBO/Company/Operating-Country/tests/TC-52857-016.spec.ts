import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { VALID_PAIR, cancelForm, freshName, openEdit, record, saveAndConfirm } from '../support/operating-country.ts';

test(
  'TC-52857-016 — [NBO][Company][Add Operating Country] Verify the saved name has its trailing space removed when the name is entered with a trailing space',
  testCaseDetails({ testCaseId: 'TC-52857-016', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    let runName = '';

    await test.step('Step 1: Log in as ADMIN_ALL, open the Add form, enter RUN-NAME with a trailing space and the other fields', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      runName = await freshName(page);
      await list.open();
      await list.addButton.click();
      await form.waitUntilReady();
      await form.fill({ name: `${runName} `, ...VALID_PAIR, remarks: 'Trim check' });
      await expect(form.name).not.toHaveAttribute('aria-invalid', 'true');
    });

    await test.step('Step 2: Click Approve', async () => {
      expect(await saveAndConfirm(page, 'Approve')).toMatch(/success/i);
      await expect(page).toHaveURL(/\/admin\/company\/operating-country$/);
    });

    await test.step('Step 3: Open the new record\'s Edit form and read the Name value and its character counter', async () => {
      await openEdit(page, runName, 'Active');
      await expect(form.name).toHaveValue(runName);
      await expect(form.counter(100)).toHaveText(`${runName.length} / 100`);
    });

    await test.step('Step 4: Click Cancel', async () => {
      await cancelForm(page);
      await expect(page).toHaveURL(/\/admin\/company\/operating-country$/);
    });
  },
);
