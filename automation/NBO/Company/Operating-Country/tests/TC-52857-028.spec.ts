import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { VALID_PAIR, createRecord, decideFromList, findRecord, freshName, openEdit, rowState, saveAndConfirm } from '../support/operating-country.ts';

test(
  'TC-52857-028 — [NBO][Company][Edit Operating Country] Verify a Rejected record returns to Pending for Approval and stays Inactive when a Maker amends it and sends it for approval',
  testCaseDetails({ testCaseId: 'TC-52857-028', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    let runName = '';
    let runName2 = '';

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

    await test.step('Step 2: As OPERATING_COUNTRIES_APPROVER, reject RUN-NAME from the list, giving the reject remarks', async () => {
      await login.signOut();
      await login.signInAs(account('OPERATING_COUNTRIES_APPROVER'));
      expect(await decideFromList(page, runName, 'Reject', 'Rejected by QA')).toMatch(/success/i);
      await findRecord(page, runName, 'Inactive');
      const state = await rowState(list, runName);
      expect(state?.approval).toBe('Rejected');
      expect(state?.status.toLowerCase()).toBe('inactive');
    });

    await test.step('Step 3: As OPERATING_COUNTRIES_MAKER, open RUN-NAME\'s Edit form', async () => {
      await login.signOut();
      await login.signInAs(account('OPERATING_COUNTRIES_MAKER'));
      await openEdit(page, runName, 'Inactive');
      expect((await form.actions()).filter((action) => action !== 'Cancel')).toEqual(['Send For Approval']);
    });

    await test.step('Step 4: Rename to RUN-NAME-2 and click Send For Approval', async () => {
      await form.typeInto(form.name, runName2);
      expect(await saveAndConfirm(page, 'Send For Approval')).toMatch(/success/i);
    });

    await test.step('Step 5: Search the Inactive list for RUN-NAME-2', async () => {
      await findRecord(page, runName2, 'Inactive');
      const state = await rowState(list, runName2);
      expect(state?.approval).toMatch(/^Pending/);
      expect(state?.status.toLowerCase()).toBe('inactive');
    });
  },
);
