import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { ConfirmDialog } from '../pages/ConfirmDialog.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { Toast } from '../pages/Toast.ts';
import { VALID_PAIR, createRecord, findRecord, freshName, record, rowState } from '../support/operating-country.ts';

test(
  'TC-52857-033 — [NBO][Company][Operating Country Approval] Verify an Approver cannot approve a Pending record when Remarks are empty or longer than 250 characters',
  testCaseDetails({ testCaseId: 'TC-52857-033', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const dialog = new ConfirmDialog(page);
    const list = new OperatingCountryListPage(page);
    const toast = new Toast(page);

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

    await test.step('Step 2: As OPERATING_COUNTRIES_APPROVER, click Approve on RUN-NAME, leave Remarks empty, and confirm', async () => {
      await login.signOut();
      await login.signInAs(account('OPERATING_COUNTRIES_APPROVER'));
      await findRecord(page, runName, 'Inactive');
      await list.rowAction(list.rowByName(runName), 'Approve').click();
      await expect(dialog.dialog).toBeVisible();
      await dialog.enterReason('');
      if (await dialog.confirmButton.isEnabled()) await dialog.confirm();
      // Not recorded: the dialog is still open and asks for the reason.
      await expect(dialog.dialog).toBeVisible();
      await expect(toast.success()).toHaveCount(0);
      record(2, `feedback ${await dialog.describe()}`);
    });

    await test.step('Step 3: Enter 251 characters in Remarks and confirm', async () => {
      await dialog.enterReason('R'.repeat(251));
      if (await dialog.confirmButton.isEnabled()) await dialog.confirm();
      await expect(dialog.dialog).toBeVisible();
      await expect(toast.success()).toHaveCount(0);
      record(3, `feedback ${await dialog.describe()}`);
    });

    await test.step('Step 4: Cancel the dialog and search the Inactive list for RUN-NAME', async () => {
      await dialog.cancel();
      await findRecord(page, runName, 'Inactive');
      const state = await rowState(list, runName);
      expect(state?.approval).toMatch(/^Pending/);
      expect(state?.status.toLowerCase()).toBe('inactive');
    });
  },
);
