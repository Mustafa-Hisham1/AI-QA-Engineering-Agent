import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { VALID_PAIR, cancelForm, createRecord, findRecord, freshName, openEdit, rowState } from '../support/operating-country.ts';

test(
  'TC-52857-029 — [NBO][Company][Edit Operating Country] Verify name and remarks stay unchanged when a Maker edits them and clicks Cancel',
  testCaseDetails({ testCaseId: 'TC-52857-029', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    let runName = '';
    let runName2 = '';

    await test.step('Step 1: As ADMIN_ALL, create RUN-NAME with Approve and remarks Original', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      runName = await freshName(page);
      runName2 = await freshName(page);
      expect(await createRecord(page, { name: runName, ...VALID_PAIR, remarks: 'Original' }, 'Approve')).toMatch(/success/i);
      await findRecord(page, runName, 'Active');
      await expect(list.rowByName(runName)).toHaveCount(1);
    });

    await test.step('Step 2: As OPERATING_COUNTRIES_MAKER, open its Edit form, change the name to RUN-NAME-2 and the remarks to Changed', async () => {
      await login.signOut();
      await login.signInAs(account('OPERATING_COUNTRIES_MAKER'));
      await openEdit(page, runName, 'Active');
      await form.fill({ name: runName2, remarks: 'Changed' });
      await expect(form.name).toHaveValue(runName2);
      await expect(form.remarks).toHaveValue('Changed');
    });

    await test.step('Step 3: Click Cancel (confirm leaving if asked)', async () => {
      await cancelForm(page);
      await expect(list.heading).toBeVisible();
    });

    await test.step('Step 4: Reopen RUN-NAME\'s Edit form', async () => {
      await openEdit(page, runName, 'Active');
      await expect(form.name).toHaveValue(runName);
      await expect(form.remarks).toHaveValue('Original');
      await cancelForm(page);
      await findRecord(page, runName, 'Active');
      expect(await rowState(list, runName)).toEqual({ approval: 'Approved', status: 'Active' });
    });
  },
);
