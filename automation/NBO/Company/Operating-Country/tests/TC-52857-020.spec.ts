import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { findRecord, freshName, record, saveAndConfirm } from '../support/operating-country.ts';

test(
  'TC-52857-020 — [NBO][Company][Add Operating Country] Observe the result when a Currency not belonging to the chosen Country is selected and Approve is clicked',
  testCaseDetails({ testCaseId: 'TC-52857-020', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    let runName = '';
    let created = false;

    await test.step('Step 1: Log in as ADMIN_ALL, open the Add form, select Country Egypt and open the Currency list', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      runName = await freshName(page);
      await list.open();
      await list.addButton.click();
      await form.waitUntilReady();
      await form.choose(form.country, 'Egypt');
      expect(await form.offersOption(form.currency, 'Kuwaiti Dinar')).toBe(true);
    });

    await test.step('Step 2: Enter RUN-NAME, select Kuwaiti Dinar and the remarks, then click Approve', async () => {
      // Observation only (D-06): created or refused, both are recorded; only no response fails.
      await form.fill({ name: runName, currency: 'Kuwaiti Dinar', remarks: 'Mapping check' });
      const text = await saveAndConfirm(page, 'Approve');
      created = /success/i.test(text);
      record(2, `${created ? 'created' : 'refused'} — message "${text}"`);
    });

    await test.step('Step 3: If it was created, search the list for RUN-NAME and record its Country and Currency', async () => {
      if (!created) {
        record(3, 'not created — nothing to record');
        return;
      }
      await findRecord(page, runName, 'Both');
      const row = list.rowByName(runName);
      record(3, `Country "${await list.cellText(row, 'Country')}", Currency "${await list.cellText(row, 'Currency')}"`);
    });
  },
);
