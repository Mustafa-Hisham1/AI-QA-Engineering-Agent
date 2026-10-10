import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { ConfirmDialog } from '../pages/ConfirmDialog.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { Toast } from '../pages/Toast.ts';
import { VALID_PAIR, createRecord, findRecord, freshName, rowState } from '../support/operating-country.ts';

test(
  'TC-52857-034 — [NBO][Company][Operating Country Approval] Verify a Pending record stays Pending when an Approver opens the Approve dialog, enters remarks and cancels',
  testCaseDetails({ testCaseId: 'TC-52857-034', storyId: 52857, adoId: null }),
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

    await test.step('Step 2: As OPERATING_COUNTRIES_APPROVER, click Approve on RUN-NAME, enter the remarks, then cancel the dialog', async () => {
      await login.signOut();
      await login.signInAs(account('OPERATING_COUNTRIES_APPROVER'));
      await findRecord(page, runName, 'Inactive');
      await list.rowAction(list.rowByName(runName), 'Approve').click();
      await expect(dialog.dialog).toBeVisible();
      await dialog.enterReason('Will be cancelled');
      await dialog.cancel();
      await expect(dialog.dialog).toBeHidden();
      await expect(toast.success()).toHaveCount(0);
    });

    await test.step('Step 3: Search the Inactive list for RUN-NAME', async () => {
      await findRecord(page, runName, 'Inactive');
      const state = await rowState(list, runName);
      expect(state?.approval).toMatch(/^Pending/);
      expect(state?.status.toLowerCase()).toBe('inactive');
    });
  },
);
