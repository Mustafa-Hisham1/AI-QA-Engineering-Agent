import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { VALID_PAIR, createRecord, findRecord, freshName, rowState } from '../support/operating-country.ts';

test(
  'TC-52857-048 — [NBO][Company][Operating Country List] Verify the Inactive filter lists only Inactive records and Both lists Active and Inactive records together',
  testCaseDetails({ testCaseId: 'TC-52857-048', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const list = new OperatingCountryListPage(page);

    let runName = '';
    let activeTotal = 0;

    await test.step('Step 1: As OPERATING_COUNTRIES_MAKER, create RUN-NAME with Send For Approval', async () => {
      await login.signInAs(account('OPERATING_COUNTRIES_MAKER'));
      runName = await freshName(page);
      expect(await createRecord(page, { name: runName, ...VALID_PAIR, remarks: 'Please approve' }, 'Send For Approval')).toMatch(/success/i);
      await findRecord(page, runName, 'Inactive');
      const state = await rowState(list, runName);
      expect(state?.approval).toMatch(/^Pending/);
      expect(state?.status.toLowerCase()).toBe('inactive');
    });

    await test.step('Step 2: As ADMIN_ALL, select Inactive and click Search', async () => {
      await login.signOut();
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      activeTotal = await list.total();
      await list.search({ status: 'Inactive' });
      for (const status of await list.columnValues('Status')) expect(status.toLowerCase()).toBe('inactive');
      await list.search({ name: runName, status: 'Inactive' });
      await expect(list.rowByName(runName)).toHaveCount(1);
    });

    await test.step('Step 3: Select Both and click Search', async () => {
      await list.search({ name: '', status: 'Both' });
      const total = await list.total();
      expect(total).toBeGreaterThanOrEqual(activeTotal + 1);
      // Both statuses appear across the result set (page 1 may hold only recent records).
      const seen = new Set((await list.columnValues('Status')).map((status) => status.toLowerCase()));
      for (let pageNo = 2; seen.size < 2 && pageNo <= Math.ceil(total / 10); pageNo++) {
        await list.goToNextPage();
        for (const status of await list.columnValues('Status')) seen.add(status.toLowerCase());
      }
      expect([...seen].sort()).toEqual(['active', 'inactive']);
    });
  },
);
