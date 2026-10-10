import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { VALID_PAIR, createRecord, findRecord, freshName, openEdit, rowState, saveAndConfirm } from '../support/operating-country.ts';

test(
  'TC-52857-024 — [NBO][Company][Edit Operating Country] Verify no duplicate error appears when a Maker updates only the Remarks and keeps the existing name',
  testCaseDetails({ testCaseId: 'TC-52857-024', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    let runName = '';

    await test.step('Step 1: As ADMIN_ALL, create RUN-NAME with Approve', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      runName = await freshName(page);
      expect(await createRecord(page, { name: runName, ...VALID_PAIR, remarks: 'Created by QA' }, 'Approve')).toMatch(/success/i);
      await findRecord(page, runName, 'Active');
      expect(await rowState(list, runName)).toEqual({ approval: 'Approved', status: 'Active' });
    });

    await test.step('Step 2: As OPERATING_COUNTRIES_MAKER, open its Edit form, replace the remarks, leave the name unchanged, and click Update', async () => {
      await login.signOut();
      await login.signInAs(account('OPERATING_COUNTRIES_MAKER'));
      await openEdit(page, runName, 'Active');
      await form.typeInto(form.remarks, 'Remarks updated by QA');
      const text = await saveAndConfirm(page, 'Update');
      expect(text).not.toContain('Already Exists');
      expect(text).toMatch(/success/i);
      await expect(page).toHaveURL(/\/admin\/company\/operating-country$/);
    });

    await test.step('Step 3: Reopen the Edit form', async () => {
      await openEdit(page, runName, 'Active');
      await expect(form.name).toHaveValue(runName);
      await expect(form.remarks).toHaveValue('Remarks updated by QA');
    });
  },
);
