import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';

test(
  'TC-52857-001 — [NBO][Company][Operating Country Access] Verify a View-only user sees the Operating Country list with no Add button and no row actions',
  testCaseDetails({ testCaseId: 'TC-52857-001', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const list = new OperatingCountryListPage(page);

    await test.step('Step 1: Log in as OPERATING_COUNTRIES_VIEW_ONLY and open the Operating Country list page', async () => {
      await login.signInAs(account('OPERATING_COUNTRIES_VIEW_ONLY'));
      await list.open();
      await expect(list.nameFilter).toBeVisible();
      await expect(list.searchButton).toBeVisible();
      await expect(list.rows.first()).toBeVisible();
    });

    await test.step('Step 2: Look for the Add Operating Country button', async () => {
      await expect(list.addButton).toHaveCount(0);
    });

    await test.step('Step 3: Inspect the Actions column of every row', async () => {
      for (const row of await list.rows.all()) expect(await list.rowActions(row)).toEqual([]);
    });

    await test.step('Step 4: Type Egy in the name filter and click Search', async () => {
      await list.search({ name: 'Egy' });
      const names = await list.columnValues('Name');
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) expect(name.toLowerCase()).toContain('egy');
    });
  },
);
