import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';

test(
  'TC-52857-049 — [NBO][Company][Operating Country List] Verify the no-results message appears when the name search matches no Operating Country',
  testCaseDetails({ testCaseId: 'TC-52857-049', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const list = new OperatingCountryListPage(page);

    await test.step('Step 1: Log in as ADMIN_ALL, type zzqx in the name filter and click Search', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      await list.search({ name: 'zzqx' });
      await expect(list.noResults.first()).toBeVisible();
      await expect(list.rows).toHaveCount(0);
    });
  },
);
