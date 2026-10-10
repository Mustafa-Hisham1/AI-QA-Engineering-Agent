import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { cancelForm } from '../support/operating-country.ts';

test(
  'TC-52857-013 — [NBO][Company][Add Operating Country] Verify Remarks accept 250 characters and show the 250-character message for 251 characters',
  testCaseDetails({ testCaseId: 'TC-52857-013', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    await test.step('Step 1: Log in as ADMIN_ALL and open the Add form', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      await list.addButton.click();
      await form.waitUntilReady();
      await expect(form.addHeading).toBeVisible();
    });

    await test.step('Step 2: Type 250 characters in Remarks and press Tab', async () => {
      await form.typeInto(form.remarks, 'R'.repeat(250));
      await expect(form.remarks).not.toHaveAttribute('aria-invalid', 'true');
      await expect(form.counter(250)).toHaveText('250 / 250');
    });

    await test.step('Step 3: Add one character (251) and press Tab', async () => {
      await form.typeInto(form.remarks, 'R'.repeat(251));
      await expect(form.remarks).toHaveAttribute('aria-invalid', 'true');
      await expect(form.message('Remarks must not exceed 250 characters.')).toBeVisible();
      await expect(form.counter(250)).toHaveText('251 / 250');
    });

    await test.step('Step 4: Replace with Ok 123 #$% (test) and press Tab', async () => {
      await form.typeInto(form.remarks, 'Ok 123 #$% (test)');
      await expect(form.remarks).not.toHaveAttribute('aria-invalid', 'true');
    });

    await test.step('Step 5: Click Cancel', async () => {
      await cancelForm(page);
      await expect(page).toHaveURL(/\/admin\/company\/operating-country$/);
    });
  },
);
