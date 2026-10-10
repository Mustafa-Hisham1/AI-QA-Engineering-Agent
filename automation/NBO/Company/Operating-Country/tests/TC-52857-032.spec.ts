import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { ConfirmDialog } from '../pages/ConfirmDialog.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { Toast } from '../pages/Toast.ts';
import { VALID_PAIR, createRecord, findRecord, freshName, record, rowState } from '../support/operating-country.ts';

test(
  'TC-52857-032 — [NBO][Company][Operating Country Approval] Observe whether a Pending record can be rejected from the list when the Remarks field is left empty',
  testCaseDetails({ testCaseId: 'TC-52857-032', storyId: 52857, adoId: null }),
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

    await test.step('Step 2: As OPERATING_COUNTRIES_APPROVER, click Reject on RUN-NAME, leave Remarks empty, and confirm', async () => {
      // Observation only (D-05): whether the rejection is blocked or recorded.
      await login.signOut();
      await login.signInAs(account('OPERATING_COUNTRIES_APPROVER'));
      await findRecord(page, runName, 'Inactive');
      await list.rowAction(list.rowByName(runName), 'Reject').click();
      await expect(dialog.dialog).toBeVisible();
      await dialog.enterReason('');
      if (await dialog.confirmButton.isEnabled()) {
        await dialog.confirm();
        record(2, `confirm enabled with empty remarks — result "${await toast.text()}"`);
      } else {
        record(2, `blocked: the confirm button stays disabled — dialog ${await dialog.describe()}`);
        await dialog.cancel();
      }
    });

    await test.step('Step 3: Search the list (Both filter) for RUN-NAME', async () => {
      await findRecord(page, runName, 'Both');
      const state = await rowState(list, runName);
      record(3, state ? `Approval Status "${state.approval}", Status "${state.status}"` : 'not listed');
    });
  },
);
