import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { VALID_PAIR, createRecord, decideFromList, findRecord, freshName, openEdit, rowState, saveAndConfirm } from '../support/operating-country.ts';

test(
  'TC-52857-037 — [NBO][Company][Operating Country Approval] Verify a Rejected record\'s Edit form offers Cancel, Approve and Reject to an all-permission user and approving it makes it Approved and Active',
  testCaseDetails({ testCaseId: 'TC-52857-037', storyId: 52857, adoId: null }),
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

    await test.step('Step 2: As OPERATING_COUNTRIES_APPROVER, reject RUN-NAME with the reject remarks', async () => {
      await login.signOut();
      await login.signInAs(account('OPERATING_COUNTRIES_APPROVER'));
      expect(await decideFromList(page, runName, 'Reject', 'Rejected by QA')).toMatch(/success/i);
      await findRecord(page, runName, 'Inactive');
      const state = await rowState(list, runName);
      expect(state?.approval).toBe('Rejected');
      expect(state?.status.toLowerCase()).toBe('inactive');
    });

    await test.step('Step 3: As ADMIN_ALL, open RUN-NAME\'s Edit form', async () => {
      await login.signOut();
      await login.signInAs(account('ADMIN_ALL'));
      await openEdit(page, runName, 'Inactive');
      expect(await form.actions()).toEqual(['Cancel', 'Approve', 'Reject']);
    });

    await test.step('Step 4: Check the Remarks field', async () => {
      await expect(form.remarks).toHaveValue('Rejected by QA');
    });

    await test.step('Step 5: Replace the remarks and click Approve', async () => {
      await form.typeInto(form.remarks, 'Re-approved by QA');
      expect(await saveAndConfirm(page, 'Approve')).toMatch(/success/i);
    });

    await test.step('Step 6: Search the default list for RUN-NAME', async () => {
      await findRecord(page, runName, 'Active');
      expect(await rowState(list, runName)).toEqual({ approval: 'Approved', status: 'Active' });
    });
  },
);
