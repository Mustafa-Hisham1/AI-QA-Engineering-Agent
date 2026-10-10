import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { VALID_PAIR, createRecord, findRecord, freshName, openEdit, record, rowState, saveAndConfirm } from '../support/operating-country.ts';

test(
  'TC-52857-036 — [NBO][Company][Operating Country Approval] Verify a Pending record becomes Approved and Active when an all-permission user approves it from the Edit form',
  testCaseDetails({ testCaseId: 'TC-52857-036', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    let runName = '';

    await test.step('Step 1: As OPERATING_COUNTRIES_MAKER, create RUN-NAME with Send For Approval', async () => {
      await login.signInAs(account('OPERATING_COUNTRIES_MAKER'));
      runName = await freshName(page);
      expect(await createRecord(page, { name: runName, ...VALID_PAIR, remarks: 'Please approve' }, 'Send For Approval')).toMatch(/success/i);
      await findRecord(page, runName, 'Inactive');
      const state = await rowState(list, runName);
      expect(state?.approval).toMatch(/^Pending/);
      expect(state?.status.toLowerCase()).toBe('inactive');
    });

    await test.step('Step 2: As ADMIN_ALL, open RUN-NAME\'s Edit form', async () => {
      await login.signOut();
      await login.signInAs(account('ADMIN_ALL'));
      await openEdit(page, runName, 'Inactive');
      expect(await form.actions()).toEqual(['Cancel', 'Approve', 'Reject']);
    });

    await test.step('Step 3: Replace the remarks and click Approve', async () => {
      await form.typeInto(form.remarks, 'Approved in edit');
      const text = await saveAndConfirm(page, 'Approve');
      record(3, `confirmation "${text}"`);
      expect(text).toMatch(/success/i);
    });

    await test.step('Step 4: Search the default (Active) list for RUN-NAME', async () => {
      await findRecord(page, runName, 'Active');
      expect(await rowState(list, runName)).toEqual({ approval: 'Approved', status: 'Active' });
    });
  },
);
