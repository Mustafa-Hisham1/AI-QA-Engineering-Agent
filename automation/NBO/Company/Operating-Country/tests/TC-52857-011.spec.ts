import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { cancelForm } from '../support/operating-country.ts';

test(
  'TC-52857-011 — [NBO][Company][Add Operating Country] Verify the Name accepts 3 and 100 characters and shows the length message for 2 and 101 characters',
  testCaseDetails({ testCaseId: 'TC-52857-011', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    const lengthMessage = 'Operating Country Name must be between 3 and 100 characters.';
    const hundred = 'Abcdefghij'.repeat(10);

    await test.step('Step 1: Log in as ADMIN_ALL and open the Add form', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      await list.addButton.click();
      await form.waitUntilReady();
      await expect(form.addHeading).toBeVisible();
    });

    await test.step('Step 2: Type Ab in Name and press Tab', async () => {
      await form.typeInto(form.name, 'Ab');
      await expect(form.name).toHaveAttribute('aria-invalid', 'true');
      await expect(form.message(lengthMessage)).toBeVisible();
    });

    await test.step('Step 3: Replace with Abc and press Tab', async () => {
      await form.typeInto(form.name, 'Abc');
      await expect(form.name).not.toHaveAttribute('aria-invalid', 'true');
    });

    await test.step('Step 4: Replace with the 100-character value and press Tab', async () => {
      await form.typeInto(form.name, hundred);
      await expect(form.name).not.toHaveAttribute('aria-invalid', 'true');
    });

    await test.step('Step 5: Replace with the 101-character value and press Tab', async () => {
      await form.typeInto(form.name, `${hundred}K`);
      await expect(form.name).toHaveAttribute('aria-invalid', 'true');
      await expect(form.message(lengthMessage)).toBeVisible();
    });

    await test.step('Step 6: Replace with Ab  (trailing space) and press Tab', async () => {
      await form.typeInto(form.name, 'Ab ');
      await expect(form.name).toHaveAttribute('aria-invalid', 'true');
      await expect(form.message(lengthMessage)).toBeVisible();
    });

    await test.step('Step 7: Click Cancel', async () => {
      await cancelForm(page);
      await expect(page).toHaveURL(/\/admin\/company\/operating-country$/);
    });
  },
);
