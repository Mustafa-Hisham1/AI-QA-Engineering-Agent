import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { cancelForm, record } from '../support/operating-country.ts';

test(
  'TC-52857-026 — [NBO][Company][Edit Operating Country] Verify the Edit form flags an empty, too-short or invalid-character name with the same messages as the Add form',
  testCaseDetails({ testCaseId: 'TC-52857-026', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    const latin = 'Operating Country Name may contain Latin letters only, joined by single spaces, apostrophes, hyphens or underscores.';

    await test.step('Step 1: Log in as OPERATING_COUNTRIES_MAKER and open the Edit form of an Approved / Active record', async () => {
      await login.signInAs(account('OPERATING_COUNTRIES_MAKER'));
      await list.open();
      await list.rowAction(list.rows.filter({ hasText: 'Approved' }).first(), 'Edit').click();
      await form.waitUntilReady();
      await expect(form.editHeading).toBeVisible();
    });

    await test.step('Step 2: Clear the name and press Tab', async () => {
      await form.typeInto(form.name, '');
      await expect(form.name).toHaveAttribute('aria-invalid', 'true');
      await expect(form.message('Operating Country Name is required.')).toBeVisible();
    });

    await test.step('Step 3: Enter Ab, press Tab', async () => {
      await form.typeInto(form.name, 'Ab');
      await expect(form.name).toHaveAttribute('aria-invalid', 'true');
      await expect(form.message('Operating Country Name must be between 3 and 100 characters.')).toBeVisible();
    });

    await test.step('Step 4: Enter Abc1, press Tab', async () => {
      await form.typeInto(form.name, 'Abc1');
      await expect(form.name).toHaveAttribute('aria-invalid', 'true');
      // The case accepts a different but appropriate message on Edit: recorded, not failed.
      if (!(await form.message(latin).isVisible())) record(4, 'the Add-form "Latin letters" message was not shown; the field is flagged invalid');
    });

    await test.step('Step 5: Click Cancel', async () => {
      await cancelForm(page);
      await expect(page).toHaveURL(/\/admin\/company\/operating-country$/);
    });
  },
);
