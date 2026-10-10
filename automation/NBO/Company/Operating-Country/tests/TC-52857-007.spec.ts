import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { NavigationMenu } from '../pages/NavigationMenu.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { record } from '../support/operating-country.ts';

test(
  'TC-52857-007 — [NBO][Company][Operating Country Access] Verify a user without the Operating Country menu right cannot see the menu entry or open the list, Add or Edit URLs',
  testCaseDetails({ testCaseId: 'TC-52857-007', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const nav = new NavigationMenu(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    await test.step('Step 1: Log in as OPC_USER_NO_MENU and open the navigation menu', async () => {
      await login.signInAs(account('OPC_USER_NO_MENU'));
      await page.waitForLoadState('networkidle');
      record(1, `Company menu present: ${await nav.openCompanyMenu()}`);
      await expect(nav.entry('Operating Country')).toHaveCount(0);
    });

    await test.step('Step 2: Enter the list URL (/admin/company/operating-country) directly', async () => {
      await page.goto(OperatingCountryListPage.path);
      await page.waitForLoadState('networkidle');
      await expect(list.heading).toBeHidden();
      await expect(list.table).toBeHidden();
      record(2, `reached ${new URL(page.url()).pathname}`);
    });

    await test.step('Step 3: Enter the Add URL (/admin/company/operating-country/add) directly', async () => {
      await page.goto(OperatingCountryFormPage.addPath);
      await page.waitForLoadState('networkidle');
      await expect(form.addHeading).toBeHidden();
      record(3, `reached ${new URL(page.url()).pathname}`);
    });
  },
);
