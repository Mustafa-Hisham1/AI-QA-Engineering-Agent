import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { ConfirmDialog } from '../pages/ConfirmDialog.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { Toast } from '../pages/Toast.ts';
import { VALID_PAIR, createRecord, findRecord, freshName, record, rowState } from '../support/operating-country.ts';

test(
  'TC-52857-030 — [NBO][Company][Operating Country Approval] Verify a Pending record becomes Approved and Active when an Approver approves it from the list with remarks',
  testCaseDetails({ testCaseId: 'TC-52857-030', storyId: 52857, adoId: null }),
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

    await test.step('Step 2: As OPERATING_COUNTRIES_APPROVER, find RUN-NAME (Inactive filter) and inspect its actions', async () => {
      await login.signOut();
      await login.signInAs(account('OPERATING_COUNTRIES_APPROVER'));
      await findRecord(page, runName, 'Inactive');
      const actions = await list.rowActions(list.rowByName(runName));
      expect(actions).toContain('Approve');
      expect(actions).toContain('Reject');
      expect(actions).not.toContain('Edit');
    });

    await test.step('Step 3: Click Approve', async () => {
      await list.rowAction(list.rowByName(runName), 'Approve').click();
      await expect(dialog.dialog).toBeVisible();
      await expect(dialog.reason).toBeVisible();
      record(3, `dialog ${await dialog.describe()}`);
    });

    await test.step('Step 4: Enter the remarks and confirm', async () => {
      await dialog.enterReason('Approved by QA');
      await dialog.confirm();
      const text = await toast.text();
      record(4, `confirmation "${text}"`);
      expect(text).toMatch(/success/i);
    });

    await test.step('Step 5: Search the default (Active) list for RUN-NAME', async () => {
      await findRecord(page, runName, 'Active');
      expect(await rowState(list, runName)).toEqual({ approval: 'Approved', status: 'Active' });
    });
  },
);
