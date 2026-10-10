import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';

test(
  'TC-52857-047 — [NBO][Company][Operating Country List] Verify choosing a Country in the filter lists only the Operating Countries bound to that Country',
  testCaseDetails({ testCaseId: 'TC-52857-047', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const list = new OperatingCountryListPage(page);

    await test.step('Step 1: Log in as ADMIN_ALL, select Egypt in the Country filter and click Search', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      await list.search({ country: 'Egypt' });
      const countries = await list.columnValues('Country');
      expect(countries.length).toBeGreaterThan(0);
      for (const country of countries) expect(country).toBe('Egypt');
    });

    await test.step('Step 2: Click Reset and Search', async () => {
      await list.reset();
      await list.search({});
      // Page 1 can hold only recent Egypt records; the whole result set is what counts.
      const pages = Math.ceil((await list.total()) / 10);
      let other = (await list.columnValues('Country')).find((country) => country !== 'Egypt');
      for (let pageNo = 2; !other && pageNo <= pages; pageNo++) {
        await list.goToNextPage();
        other = (await list.columnValues('Country')).find((country) => country !== 'Egypt');
      }
      expect(other).toBeDefined();
    });
  },
);
