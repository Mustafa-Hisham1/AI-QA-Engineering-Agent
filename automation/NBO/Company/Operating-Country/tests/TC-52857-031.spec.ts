import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { ConfirmDialog } from '../pages/ConfirmDialog.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { Toast } from '../pages/Toast.ts';
import { VALID_PAIR, createRecord, findRecord, freshName, record, rowState } from '../support/operating-country.ts';

test(
  'TC-52857-031 — [NBO][Company][Operating Country Approval] Verify a Pending record becomes Rejected and Inactive when an Approver rejects it from the list with remarks',
  testCaseDetails({ testCaseId: 'TC-52857-031', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const dialog = new ConfirmDialog(page);
    const list = new OperatingCountryListPage(page);
    const toast = new Toast(page);

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

    await test.step('Step 2: As OPERATING_COUNTRIES_APPROVER, click Reject on RUN-NAME', async () => {
      await login.signOut();
      await login.signInAs(account('OPERATING_COUNTRIES_APPROVER'));
      await findRecord(page, runName, 'Inactive');
      await list.rowAction(list.rowByName(runName), 'Reject').click();
      await expect(dialog.dialog).toBeVisible();
      await expect(dialog.reason).toBeVisible();
      const reasonName = (await dialog.reason.getAttribute('aria-label')) ?? '';
      const required = (await dialog.reason.getAttribute('aria-required')) === 'true' || /required/i.test(await dialog.text());
      record(2, `dialog ${await dialog.describe()} — Remarks marked required: ${required}${reasonName ? ` (${reasonName})` : ''}`);
    });

    await test.step('Step 3: Enter the remarks and confirm', async () => {
      await dialog.enterReason('Rejected by QA');
      await dialog.confirm();
      const text = await toast.text();
      record(3, `confirmation "${text}"`);
      expect(text).toMatch(/success/i);
    });

    await test.step('Step 4: Search the Inactive list for RUN-NAME', async () => {
      await findRecord(page, runName, 'Inactive');
      const state = await rowState(list, runName);
      expect(state?.approval).toBe('Rejected');
      expect(state?.status.toLowerCase()).toBe('inactive');
    });

    await test.step('Step 5: Search the default (Active) list for RUN-NAME', async () => {
      await findRecord(page, runName, 'Active');
      await expect(list.rowByName(runName)).toHaveCount(0);
    });
  },
);
