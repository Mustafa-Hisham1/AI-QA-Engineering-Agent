import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';

test(
  'TC-52857-006 — [NBO][Company][Operating Country Access] Verify an all-permission user sees Add, and Edit plus Reject plus Deactivate on an approved active row',
  testCaseDetails({ testCaseId: 'TC-52857-006', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const list = new OperatingCountryListPage(page);

    const approvedActive = list.rows.filter({ hasText: 'Approved' }).first();

    await test.step('Step 1: Log in as ADMIN_ALL and open the Operating Country list page', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      await expect(list.addButton).toBeVisible();
    });

    await test.step('Step 2: Inspect the Actions column of an Approved / Active row', async () => {
      await expect(approvedActive).toBeVisible();
      expect(await list.cellText(approvedActive, 'Status')).toBe('Active');
      expect(await list.rowActions(approvedActive)).toEqual(['Edit', 'Reject', 'Deactivate']);
    });

    await test.step('Step 3: Check the row for View All Branches', async () => {
      const offered = await list.rowActions(approvedActive);
      for (const action of ['View All Branches']) expect(offered).not.toContain(action);
    });
  },
);
