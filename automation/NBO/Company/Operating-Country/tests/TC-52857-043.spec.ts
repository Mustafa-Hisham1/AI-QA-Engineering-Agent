import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { LIST_COLUMNS, OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';

test(
  'TC-52857-043 — [NBO][Company][Operating Country List] Verify the list page shows the Operating Country heading and the Name, Country, Currency, Approval Status, Status and Actions columns',
  testCaseDetails({ testCaseId: 'TC-52857-043', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const list = new OperatingCountryListPage(page);

    await test.step('Step 1: Log in as ADMIN_ALL and open the list page', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      await expect(list.heading).toBeVisible();
    });

    await test.step('Step 2: Read the column headings', async () => {
      expect(await list.headerTexts()).toEqual([...LIST_COLUMNS]);
    });

    await test.step('Step 3: Read the filter labels', async () => {
      await expect(list.nameFilter).toBeVisible();
      await expect(list.countryFilter).toBeVisible();
      for (const option of ['Active', 'Inactive', 'Both'] as const) await expect(list.statusOption(option)).toBeVisible();
    });
  },
);
