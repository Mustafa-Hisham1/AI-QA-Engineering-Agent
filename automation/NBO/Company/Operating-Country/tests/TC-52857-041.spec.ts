import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { ConfirmDialog } from '../pages/ConfirmDialog.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { VALID_PAIR, createRecord, findRecord, freshName, rowState } from '../support/operating-country.ts';

test(
  'TC-52857-041 — [NBO][Company][Operating Country Status] Verify an Approved record stays Active when Deactivate is clicked and the confirmation is cancelled',
  testCaseDetails({ testCaseId: 'TC-52857-041', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const dialog = new ConfirmDialog(page);
    const list = new OperatingCountryListPage(page);

    let runName = '';

    await test.step('Step 1: As ADMIN_ALL, create RUN-NAME with Approve', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      runName = await freshName(page);
      expect(await createRecord(page, { name: runName, ...VALID_PAIR, remarks: 'Created by QA' }, 'Approve')).toMatch(/success/i);
      await findRecord(page, runName, 'Active');
      expect(await rowState(list, runName)).toEqual({ approval: 'Approved', status: 'Active' });
    });

    await test.step('Step 2: As OPERATING_COUNTRIES_APPROVER, click Deactivate on RUN-NAME, then cancel the confirmation', async () => {
      await login.signOut();
      await login.signInAs(account('OPERATING_COUNTRIES_APPROVER'));
      await findRecord(page, runName, 'Active');
      await list.rowAction(list.rowByName(runName), 'Deactivate').click();
      await expect(dialog.dialog).toBeVisible();
      await dialog.cancel();
      await expect(dialog.dialog).toBeHidden();
    });

    await test.step('Step 3: Search the default list for RUN-NAME', async () => {
      await findRecord(page, runName, 'Active');
      expect(await rowState(list, runName)).toEqual({ approval: 'Approved', status: 'Active' });
    });
  },
);
