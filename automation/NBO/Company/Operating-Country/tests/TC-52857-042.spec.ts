import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { VALID_PAIR, createRecord, decideFromList, findRecord, freshName, rowState } from '../support/operating-country.ts';

test(
  'TC-52857-042 — [NBO][Company][Operating Country Status] Verify no Activate action is offered on a Pending or a Rejected record to any role',
  testCaseDetails({ testCaseId: 'TC-52857-042', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const list = new OperatingCountryListPage(page);

    let runName = '';
    let runName2 = '';

    const noActivate = async (): Promise<void> => {
      for (const name of [runName, runName2]) {
        await findRecord(page, name, 'Inactive');
        await expect(list.rowByName(name)).toHaveCount(1);
        expect(await list.rowActions(list.rowByName(name))).not.toContain('Activate');
      }
    };

    await test.step('Step 1: As OPERATING_COUNTRIES_MAKER, create RUN-NAME and RUN-NAME-2 with Send For Approval', async () => {
      await login.signInAs(account('OPERATING_COUNTRIES_MAKER'));
      runName = await freshName(page);
      runName2 = await freshName(page);
      for (const name of [runName, runName2]) {
        expect(await createRecord(page, { name, ...VALID_PAIR, remarks: 'Please approve' }, 'Send For Approval')).toMatch(/success/i);
        await findRecord(page, name, 'Inactive');
        expect((await rowState(list, name))?.approval).toMatch(/^Pending/);
      }
    });

    await test.step('Step 2: As OPERATING_COUNTRIES_APPROVER, reject RUN-NAME-2 with remarks', async () => {
      await login.signOut();
      await login.signInAs(account('OPERATING_COUNTRIES_APPROVER'));
      expect(await decideFromList(page, runName2, 'Reject', 'Rejected by QA')).toMatch(/success/i);
      await findRecord(page, runName2, 'Inactive');
      expect((await rowState(list, runName2))?.approval).toBe('Rejected');
    });

    await test.step('Step 3: In the Inactive list, inspect both rows as OPERATING_COUNTRIES_APPROVER', async () => {
      await noActivate();
    });

    await test.step('Step 4: Repeat as OPERATING_COUNTRIES_MAKER and as ADMIN_ALL', async () => {
      for (const handle of ['OPERATING_COUNTRIES_MAKER', 'ADMIN_ALL']) {
        await login.signOut();
        await login.signInAs(account(handle));
        await noActivate();
      }
    });
  },
);
