import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { Toast } from '../pages/Toast.ts';
import { VALID_PAIR, createRecord, findRecord, freshName, rowState, saveAndConfirm } from '../support/operating-country.ts';

test(
  'TC-52857-018 — [NBO][Company][Add Operating Country] Verify a name already held by a Pending for Approval record is refused when another record is created with it',
  testCaseDetails({ testCaseId: 'TC-52857-018', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);
    const toast = new Toast(page);

    const exists = 'Operating Country Already Exists.';
    let runName = '';

    await test.step('Step 1: As OPERATING_COUNTRIES_MAKER, create RUN-NAME (Egypt, Egyptian Pound, remarks) with Send For Approval', async () => {
      await login.signInAs(account('OPERATING_COUNTRIES_MAKER'));
      runName = await freshName(page);
      expect(await createRecord(page, { name: runName, ...VALID_PAIR, remarks: 'Please approve' }, 'Send For Approval')).toMatch(/success/i);
      await findRecord(page, runName, 'Inactive');
      const state = await rowState(list, runName);
      expect(state?.approval).toMatch(/^Pending/);
      expect(state?.status.toLowerCase()).toBe('inactive');
    });

    await test.step('Step 2: Log in as ADMIN_ALL, open the Add form, enter RUN-NAME with the other fields, and click Approve', async () => {
      await login.signOut();
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      await list.addButton.click();
      await form.waitUntilReady();
      await form.fill({ name: runName, ...VALID_PAIR, remarks: 'Duplicate check' });
      await saveAndConfirm(page, 'Approve');
      await expect(toast.withText(exists).or(form.message(exists)).first()).toBeVisible();
    });

    await test.step('Step 3: Search the list (Both filter) by RUN-NAME', async () => {
      await findRecord(page, runName, 'Both');
      await expect(list.rows).toHaveCount(1);
      const state = await rowState(list, runName);
      expect(state?.approval).toMatch(/^Pending/);
      expect(state?.status.toLowerCase()).toBe('inactive');
    });
  },
);
