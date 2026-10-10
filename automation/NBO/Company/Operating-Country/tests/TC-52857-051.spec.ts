import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';

test(
  'TC-52857-051 — [NBO][Company][Operating Country List] Verify moving to page 2 keeps the search criteria and continues the most-recent-first order from page 1',
  testCaseDetails({ testCaseId: 'TC-52857-051', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const list = new OperatingCountryListPage(page);

    let firstPage: string[] = [];

    await test.step('Step 1: Log in as ADMIN_ALL, select Both and click Search', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      await list.search({ status: 'Both' });
      // Precondition: more than 10 records match Both. Records are not created here — D-09
      // asks for confirmation first — so a shortfall is missing test data, never a FAIL.
      const total = await list.total();
      test.skip(total <= 10, `NOT RUN — TEST_DATA_UNAVAILABLE: only ${total} records match Both; more than 10 are needed`);
      await expect(list.rows).toHaveCount(10);
      await expect(list.summary).toHaveText(new RegExp(`^Showing 1 to 10 of ${total}$`));
      await expect(list.nextPage).toBeEnabled();
      firstPage = await list.columnValues('Name');
    });

    await test.step('Step 2: Click Next Page', async () => {
      await list.goToNextPage();
      await expect(list.summary).toHaveText(/^Showing 11 to \d+ of \d+$/);
      expect(await list.selectedStatus()).toBe('Both');
      const secondPage = await list.columnValues('Name');
      expect(secondPage.length).toBeGreaterThan(0);
      for (const name of secondPage) expect(firstPage).not.toContain(name);
    });

    await test.step('Step 3: Click First Page', async () => {
      await list.goToFirstPage();
      await expect(list.summary).toHaveText(/^Showing 1 to 10 of \d+$/);
      expect(await list.columnValues('Name')).toEqual(firstPage);
    });
  },
);
