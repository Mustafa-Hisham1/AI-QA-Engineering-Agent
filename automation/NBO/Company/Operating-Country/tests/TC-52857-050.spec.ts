import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage, offersOption } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { cancelForm } from '../support/operating-country.ts';

test(
  'TC-52857-050 — [NBO][Company][Operating Country List] Verify an inactive Country is absent from the list page\'s Country filter while it is offered on the Add form',
  testCaseDetails({ testCaseId: 'TC-52857-050', storyId: 52857, adoId: null }),
  async ({ page, account, dataValue }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    let inactiveCountry = '';

    await test.step('Step 1: Log in as ADMIN_ALL, open the list page\'s Country filter and type the inactive Country\'s name', async () => {
      inactiveCountry = dataValue('OPC_COUNTRY_INACTIVE');
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      expect(await offersOption(page, list.countryFilter, inactiveCountry)).toBe(false);
    });

    await test.step('Step 2: Open the Add form\'s Country list and type the same name', async () => {
      await list.addButton.click();
      await form.waitUntilReady();
      expect(await form.offersOption(form.country, inactiveCountry)).toBe(true);
    });

    await test.step('Step 3: Click Cancel', async () => {
      await cancelForm(page);
      await expect(list.heading).toBeVisible();
    });
  },
);
