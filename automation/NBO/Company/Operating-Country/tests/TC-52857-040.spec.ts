import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { ConfirmDialog } from '../pages/ConfirmDialog.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { Toast } from '../pages/Toast.ts';
import { VALID_PAIR, createRecord, findRecord, freshName, rowState } from '../support/operating-country.ts';

test(
  'TC-52857-040 — [NBO][Company][Operating Country Status] Verify a Maker can deactivate an Approved record to Inactive and activate it back to Active',
  testCaseDetails({ testCaseId: 'TC-52857-040', storyId: 52857, adoId: null }),
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

    await test.step('Step 2: As OPERATING_COUNTRIES_MAKER, click Deactivate on RUN-NAME and confirm', async () => {
      await login.signOut();
      await login.signInAs(account('OPERATING_COUNTRIES_MAKER'));
      await findRecord(page, runName, 'Active');
      await list.rowAction(list.rowByName(runName), 'Deactivate').click();
      await dialog.confirm();
      expect(await toast.text()).toMatch(/success/i);
      await expect(toast.error()).toHaveCount(0);
    });

    await test.step('Step 3: Search the Inactive list for RUN-NAME', async () => {
      await findRecord(page, runName, 'Inactive');
      const state = await rowState(list, runName);
      expect(state?.approval).toBe('Approved');
      expect(state?.status.toLowerCase()).toBe('inactive');
      expect(await list.rowActions(list.rowByName(runName))).toContain('Activate');
    });

    await test.step('Step 4: Click Activate', async () => {
      await list.rowAction(list.rowByName(runName), 'Activate').click();
      // The confirmation (D-18) is answered, not asserted, in this case.
      const asked = await dialog.dialog
        .first()
        .waitFor({ timeout: 5_000 })
        .then(() => true)
        .catch(() => false);
      if (asked) await dialog.confirm();
      expect(await toast.text()).toMatch(/success/i);
    });

    await test.step('Step 5: Search the default list for RUN-NAME', async () => {
      await findRecord(page, runName, 'Active');
      expect(await rowState(list, runName)).toEqual({ approval: 'Approved', status: 'Active' });
    });
  },
);
