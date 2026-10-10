import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { AccessDeniedPage } from '../pages/AccessDeniedPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { record } from '../support/operating-country.ts';

test(
  'TC-52857-005 — [NBO][Company][Operating Country Access] Verify an Approver cannot create or amend a record when opening the Add and Edit URLs directly',
  testCaseDetails({ testCaseId: 'TC-52857-005', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const denied = new AccessDeniedPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    let editPath = '';

    await test.step('Step 1: Log in as OPERATING_COUNTRIES_APPROVER and enter the Add form URL directly', async () => {
      // Precondition: the id of an existing record, from a row's Edit link as ADMIN_ALL.
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      await list.rowAction(list.rows.first(), 'Edit').click();
      await form.waitUntilReady();
      editPath = new URL(page.url()).pathname;
      await login.signOut();

      await login.signInAs(account('OPERATING_COUNTRIES_APPROVER'));
      await page.goto(OperatingCountryFormPage.addPath);
      await page.waitForLoadState('networkidle');
      await expect(list.heading.or(form.heading).or(denied.heading).first()).toBeVisible();
      // Nothing is submitted, whatever is shown. Only a displayed form can offer a save.
      if (await form.heading.isVisible()) {
        for (const action of ['Approve', 'Send For Approval', 'Update'] as const) await expect(form.action(action)).toHaveCount(0);
      }
      record(1, `reached ${new URL(page.url()).pathname}`);
    });

    await test.step('Step 2: Enter the Edit URL of the known record directly', async () => {
      await page.goto(editPath);
      await page.waitForLoadState('networkidle');
      await expect(list.heading.or(form.heading).or(denied.heading).first()).toBeVisible();
      // Only a displayed form can offer a save: the list the user is returned to has its own
      // row buttons (e.g. Reject), which are not a form (RUN-008, TC-52857-005).
      const formShown = await form.heading.isVisible();
      if (formShown) {
        for (const action of ['Update', 'Approve', 'Reject', 'Send For Approval'] as const) await expect(form.action(action)).toHaveCount(0);
      }
      record(2, `reached ${new URL(page.url()).pathname}; ${formShown ? 'a form was shown, with no save action' : 'no form was shown'}`);
    });
  },
);
