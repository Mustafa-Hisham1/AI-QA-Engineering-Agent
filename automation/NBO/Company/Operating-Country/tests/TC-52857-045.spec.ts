import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { record } from '../support/operating-country.ts';

test(
  'TC-52857-045 — [NBO][Company][Operating Country List] Verify searching by part of a name in any letter case lists every Operating Country containing it',
  testCaseDetails({ testCaseId: 'TC-52857-045', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const list = new OperatingCountryListPage(page);

    await test.step('Step 1: Log in as ADMIN_ALL, type GYP in the name filter and click Search', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      await list.search({ name: 'GYP' });
      const names = await list.columnValues('Name');
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) expect(name.toLowerCase()).toContain('gyp');
    });

    await test.step('Step 2: Read the record count', async () => {
      const total = await list.total();
      expect(await list.recordCountValue()).toBe(total);
      if (total <= 10) expect(await list.rows.count()).toBe(total);
    });
  },
);
