import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { record } from '../support/operating-country.ts';

test(
  'TC-52857-044 — [NBO][Company][Operating Country List] Verify the list opens on Active records, 10 rows per page, page 1, ordered by last change, with the record count shown',
  testCaseDetails({ testCaseId: 'TC-52857-044', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    await test.step('Step 1: Log in as ADMIN_ALL and open the list page', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      expect(await list.selectedStatus()).toBe('Active');
      for (const status of await list.columnValues('Status')) expect(status).toBe('Active');
    });

    await test.step('Step 2: Inspect the pagination area', async () => {
      await expect(list.rowsPerPage).toBeVisible();
      expect(await list.rowsPerPageValue()).toBe('10');
      await expect(list.summary).toHaveText(/^Showing 1 to \d+ of \d+$/);
      await expect(list.recordCount).toBeVisible();
      expect(await list.rows.count()).toBeLessThanOrEqual(10);
    });

    await test.step('Step 3: Open each record\'s Edit form in turn, or compare with a record just changed', async () => {
      // Human decision 2026-10-10 (plan Q-2): a read-only check cannot know which record
      // changed last, so the first row is recorded, not asserted. Ordering is asserted
      // end to end by TC-52857-014 and TC-52857-023 (a changed record is the first row).
      record(3, `first row "${await list.cellText(list.rows.first(), 'Name')}"`);
    });
  },
);
