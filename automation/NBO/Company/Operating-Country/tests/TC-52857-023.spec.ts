import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { VALID_PAIR, createRecord, findRecord, freshName, openEdit, record, rowState, saveAndConfirm } from '../support/operating-country.ts';

test(
  'TC-52857-023 — [NBO][Company][Edit Operating Country] Verify an Approved Operating Country stays Approved and Active when a Maker renames it and clicks Update',
  testCaseDetails({ testCaseId: 'TC-52857-023', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    let runName = '';
    let runName2 = '';

    await test.step('Step 1: As ADMIN_ALL, create RUN-NAME (Egypt, Egyptian Pound, remarks) with Approve', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      runName = await freshName(page);
      runName2 = await freshName(page);
      expect(await createRecord(page, { name: runName, ...VALID_PAIR, remarks: 'Created by QA' }, 'Approve')).toMatch(/success/i);
      await findRecord(page, runName, 'Active');
      expect(await rowState(list, runName)).toEqual({ approval: 'Approved', status: 'Active' });
    });

    await test.step('Step 2: Log in as OPERATING_COUNTRIES_MAKER and open RUN-NAME\'s Edit form', async () => {
      await login.signOut();
      await login.signInAs(account('OPERATING_COUNTRIES_MAKER'));
      await openEdit(page, runName, 'Active');
      expect(await form.actions()).toEqual(['Cancel', 'Update']);
    });

    await test.step('Step 3: Change the name to RUN-NAME-2, keep the remarks, and click Update', async () => {
      await form.typeInto(form.name, runName2);
      const text = await saveAndConfirm(page, 'Update');
      record(3, `confirmation "${text}"`);
      expect(text).toMatch(/success/i);
      await expect(page).toHaveURL(/\/admin\/company\/operating-country$/);
    });

    await test.step('Step 4: Find RUN-NAME-2 in the default (Active) list', async () => {
      await list.open();
      const first = list.rows.first();
      expect(await list.cellText(first, 'Name')).toBe(runName2);
      expect(await list.cellText(first, 'Approval Status')).toBe('Approved');
      expect(await list.cellText(first, 'Status')).toBe('Active');
    });
  },
);
