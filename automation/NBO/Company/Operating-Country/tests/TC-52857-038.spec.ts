import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { ConfirmDialog } from '../pages/ConfirmDialog.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { Toast } from '../pages/Toast.ts';
import { VALID_PAIR, createRecord, findRecord, freshName, record, rowState } from '../support/operating-country.ts';

test(
  'TC-52857-038 — [NBO][Company][Operating Country Approval] Verify an Approved record becomes Rejected and Inactive and leaves the default list when an all-permission user rejects it',
  testCaseDetails({ testCaseId: 'TC-52857-038', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const dialog = new ConfirmDialog(page);
    const list = new OperatingCountryListPage(page);
    const toast = new Toast(page);

    let runName = '';

    await test.step('Step 1: As ADMIN_ALL, create RUN-NAME with Approve', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      runName = await freshName(page);
      expect(await createRecord(page, { name: runName, ...VALID_PAIR, remarks: 'Created by QA' }, 'Approve')).toMatch(/success/i);
      await findRecord(page, runName, 'Active');
      expect(await rowState(list, runName)).toEqual({ approval: 'Approved', status: 'Active' });
    });

    await test.step('Step 2: Click Reject on RUN-NAME\'s row, enter the remarks, and confirm', async () => {
      await list.rowAction(list.rowByName(runName), 'Reject').click();
      await expect(dialog.dialog).toBeVisible();
      await dialog.enterReason('Withdrawn by QA');
      await dialog.confirm();
      const text = await toast.text();
      record(2, `confirmation "${text}"`);
      expect(text).toMatch(/success/i);
    });

    await test.step('Step 3: Search the default (Active) list for RUN-NAME', async () => {
      await findRecord(page, runName, 'Active');
      await expect(list.rowByName(runName)).toHaveCount(0);
    });

    await test.step('Step 4: Search the Inactive list for RUN-NAME', async () => {
      await findRecord(page, runName, 'Inactive');
      const state = await rowState(list, runName);
      expect(state?.approval).toBe('Rejected');
      expect(state?.status.toLowerCase()).toBe('inactive');
    });
  },
);
