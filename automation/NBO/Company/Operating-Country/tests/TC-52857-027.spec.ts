import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { VALID_PAIR, createRecord, findRecord, freshName, openEdit, record, rowState, saveAndConfirm } from '../support/operating-country.ts';

test(
  'TC-52857-027 — [NBO][Company][Edit Operating Country] Verify a Pending for Approval record stays Pending and Inactive when a Maker updates it',
  testCaseDetails({ testCaseId: 'TC-52857-027', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    let runName = '';
    let runName2 = '';
    let saveAction: 'Update' | 'Send For Approval' = 'Update';

    await test.step('Step 1: As OPERATING_COUNTRIES_MAKER, create RUN-NAME with Send For Approval', async () => {
      await login.signInAs(account('OPERATING_COUNTRIES_MAKER'));
      runName = await freshName(page);
      expect(await createRecord(page, { name: runName, ...VALID_PAIR, remarks: 'Please approve' }, 'Send For Approval')).toMatch(/success/i);
      await findRecord(page, runName, 'Inactive');
      const state = await rowState(list, runName);
      expect(state?.approval).toMatch(/^Pending/);
      expect(state?.status.toLowerCase()).toBe('inactive');
      runName2 = await freshName(page);
    });

    await test.step('Step 2: Open RUN-NAME\'s Edit form (Inactive filter)', async () => {
      await openEdit(page, runName, 'Inactive');
      const actions = await form.actions();
      record(2, `actions ${actions.join(', ')}`);
      expect(actions).not.toContain('Approve');
      expect(actions).not.toContain('Reject');
      expect(actions.some((action) => action === 'Update' || action === 'Send For Approval')).toBe(true);
      saveAction = actions.includes('Send For Approval') ? 'Send For Approval' : 'Update';
    });

    await test.step('Step 3: Rename to RUN-NAME-2 and save with the update action', async () => {
      await form.typeInto(form.name, runName2);
      expect(await saveAndConfirm(page, saveAction)).toMatch(/success/i);
      await expect(page).toHaveURL(/\/admin\/company\/operating-country$/);
    });

    await test.step('Step 4: Search the Inactive list for RUN-NAME-2', async () => {
      await findRecord(page, runName2, 'Inactive');
      const state = await rowState(list, runName2);
      expect(state?.approval).toMatch(/^Pending/);
      expect(state?.status.toLowerCase()).toBe('inactive');
    });
  },
);
