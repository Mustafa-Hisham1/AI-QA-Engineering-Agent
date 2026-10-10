import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { ConfirmDialog } from '../pages/ConfirmDialog.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { Toast } from '../pages/Toast.ts';
import { VALID_PAIR, createRecord, findRecord, freshName, record, rowState } from '../support/operating-country.ts';

test(
  'TC-52857-039 — [NBO][Company][Operating Country Status] Verify an Approver\'s confirmed deactivation makes the record Inactive and a confirmed Activate restores it to Active',
  testCaseDetails({ testCaseId: 'TC-52857-039', storyId: 52857, adoId: null }),
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

    await test.step('Step 2: As OPERATING_COUNTRIES_APPROVER, click Deactivate on RUN-NAME', async () => {
      await login.signOut();
      await login.signInAs(account('OPERATING_COUNTRIES_APPROVER'));
      await findRecord(page, runName, 'Active');
      await list.rowAction(list.rowByName(runName), 'Deactivate').click();
      await expect(dialog.dialog).toBeVisible();
      record(2, `warning ${await dialog.describe()}`);
    });

    await test.step('Step 3: Confirm', async () => {
      await dialog.confirm();
      const text = await toast.text();
      record(3, `result "${text}"`);
      await expect(toast.any.first()).toBeVisible();
    });

    await test.step('Step 4: Search the default (Active) list for RUN-NAME', async () => {
      await findRecord(page, runName, 'Active');
      await expect(list.rowByName(runName)).toHaveCount(0);
    });

    await test.step('Step 5: Search the Inactive list for RUN-NAME', async () => {
      await findRecord(page, runName, 'Inactive');
      const state = await rowState(list, runName);
      expect(state?.approval).toBe('Approved');
      expect(state?.status.toLowerCase()).toBe('inactive');
      expect(await list.rowActions(list.rowByName(runName))).toContain('Activate');
    });

    await test.step('Step 6: Click Activate, then confirm the activation', async () => {
      await list.rowAction(list.rowByName(runName), 'Activate').click();
      // D-18: Activate asks for a confirmation before anything changes.
      await expect(dialog.dialog).toBeVisible();
      await dialog.confirm();
      expect(await toast.text()).toMatch(/success/i);
    });

    await test.step('Step 7: Search the default list for RUN-NAME', async () => {
      await findRecord(page, runName, 'Active');
      expect(await rowState(list, runName)).toEqual({ approval: 'Approved', status: 'Active' });
    });
  },
);
