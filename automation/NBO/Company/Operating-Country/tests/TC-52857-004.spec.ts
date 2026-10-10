import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';

test(
  'TC-52857-004 — [NBO][Company][Operating Country Access] Verify an Approver sees no Add button and only Reject plus Deactivate on an approved active row',
  testCaseDetails({ testCaseId: 'TC-52857-004', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const list = new OperatingCountryListPage(page);

    const approvedActive = list.rows.filter({ hasText: 'Approved' }).first();

    await test.step('Step 1: Log in as OPERATING_COUNTRIES_APPROVER and open the Operating Country list page', async () => {
      await login.signInAs(account('OPERATING_COUNTRIES_APPROVER'));
      await list.open();
      await expect(list.heading).toBeVisible();
      await expect(list.addButton).toHaveCount(0);
    });

    await test.step('Step 2: Inspect the Actions column of an Approved / Active row', async () => {
      await expect(approvedActive).toBeVisible();
      expect(await list.cellText(approvedActive, 'Status')).toBe('Active');
      expect(await list.rowActions(approvedActive)).toEqual(['Reject', 'Deactivate']);
    });

    await test.step('Step 3: Check the same row for Edit and View All Branches', async () => {
      const offered = await list.rowActions(approvedActive);
      for (const action of ['Edit', 'View All Branches']) expect(offered).not.toContain(action);
    });
  },
);
