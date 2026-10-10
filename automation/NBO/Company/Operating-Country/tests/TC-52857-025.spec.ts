import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { Toast } from '../pages/Toast.ts';
import { VALID_PAIR, cancelForm, createRecord, findRecord, freshName, openEdit, saveAndConfirm } from '../support/operating-country.ts';

test(
  'TC-52857-025 — [NBO][Company][Edit Operating Country] Verify an update is refused when a Maker renames a record to another Operating Country\'s name in different letter case',
  testCaseDetails({ testCaseId: 'TC-52857-025', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);
    const toast = new Toast(page);

    const exists = 'Operating Country Already Exists.';
    let runName = '';
    let runName2 = '';

    await test.step('Step 1: As ADMIN_ALL, create RUN-NAME and RUN-NAME-2, both with Approve', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      runName = await freshName(page);
      runName2 = await freshName(page);
      for (const name of [runName, runName2]) {
        expect(await createRecord(page, { name, ...VALID_PAIR, remarks: 'Created by QA' }, 'Approve')).toMatch(/success/i);
      }
      for (const name of [runName, runName2]) {
        await findRecord(page, name, 'Both');
        await expect(list.rowByName(name)).toHaveCount(1);
      }
    });

    await test.step('Step 2: As OPERATING_COUNTRIES_MAKER, open RUN-NAME-2\'s Edit form, change the name to RUN-NAME in upper case, and click Update', async () => {
      await login.signOut();
      await login.signInAs(account('OPERATING_COUNTRIES_MAKER'));
      await openEdit(page, runName2, 'Active');
      await form.typeInto(form.name, runName.toUpperCase());
      await saveAndConfirm(page, 'Update');
      await expect(toast.withText(exists).or(form.message(exists)).first()).toBeVisible();
      await expect(form.editHeading).toBeVisible();
    });

    await test.step('Step 3: Click Cancel and search for RUN-NAME-2', async () => {
      await cancelForm(page);
      await findRecord(page, runName2, 'Both');
      await expect(list.rowByName(runName2)).toHaveCount(1);
    });
  },
);
