import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';

test(
  'TC-52857-046 — [NBO][Company][Operating Country List] Verify searching for an underscore or a percent sign returns only names that actually contain that character',
  testCaseDetails({ testCaseId: 'TC-52857-046', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const list = new OperatingCountryListPage(page);

    await test.step('Step 1: Log in as ADMIN_ALL, search for _', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      await list.search({ name: '_' });
      const names = await list.columnValues('Name');
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) expect(name).toContain('_');
    });

    await test.step('Step 2: Search for %', async () => {
      await list.search({ name: '%' });
      const names = await list.columnValues('Name');
      if (names.length === 0) await expect(list.noResults.first()).toBeVisible();
      for (const name of names) expect(name).toContain('%');
    });
  },
);
