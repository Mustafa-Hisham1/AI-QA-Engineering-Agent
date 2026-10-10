import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { VALID_PAIR, createRecord, findRecord, freshName, record, rowState } from '../support/operating-country.ts';

test(
  'TC-52857-035 — [NBO][Company][Operating Country Approval] Verify a Maker sees no Approve or Reject on a Pending record in the list or on its Edit form',
  testCaseDetails({ testCaseId: 'TC-52857-035', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    let runName = '';

    await test.step('Step 1: As OPERATING_COUNTRIES_MAKER, create RUN-NAME with Send For Approval', async () => {
      await login.signInAs(account('OPERATING_COUNTRIES_MAKER'));
      runName = await freshName(page);
      expect(await createRecord(page, { name: runName, ...VALID_PAIR, remarks: 'Please approve' }, 'Send For Approval')).toMatch(/success/i);
      await findRecord(page, runName, 'Inactive');
      const state = await rowState(list, runName);
      expect(state?.approval).toMatch(/^Pending/);
      expect(state?.status.toLowerCase()).toBe('inactive');
    });

    await test.step('Step 2: Find RUN-NAME in the Inactive list and inspect its row actions', async () => {
      await findRecord(page, runName, 'Inactive');
      const actions = await list.rowActions(list.rowByName(runName));
      record(2, `row actions offered: ${actions.join(', ') || 'none'}`);
      expect(actions).not.toContain('Approve');
      expect(actions).not.toContain('Reject');
    });

    await test.step('Step 3: Open RUN-NAME\'s Edit form and inspect its actions', async () => {
      await list.rowAction(list.rowByName(runName), 'Edit').click();
      await form.waitUntilReady();
      const actions = await form.actions();
      expect(actions).not.toContain('Approve');
      expect(actions).not.toContain('Reject');
    });
  },
);
