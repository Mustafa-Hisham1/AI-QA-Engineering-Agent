import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { Toast } from '../pages/Toast.ts';
import { VALID_PAIR, cancelForm, createRecord, findRecord, freshName, saveAndConfirm } from '../support/operating-country.ts';

test(
  'TC-52857-017 — [NBO][Company][Add Operating Country] Verify creation is refused when the name matches an existing Operating Country exactly or in different letter case',
  testCaseDetails({ testCaseId: 'TC-52857-017', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);
    const toast = new Toast(page);

    const exists = 'Operating Country Already Exists.';
    let runName = '';

    await test.step('Step 1: Log in as ADMIN_ALL and create RUN-NAME (Egypt, Egyptian Pound, remarks) with Approve', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      runName = await freshName(page);
      expect(await createRecord(page, { name: runName, ...VALID_PAIR, remarks: 'Created by QA' }, 'Approve')).toMatch(/success/i);
      await findRecord(page, runName, 'Both');
      await expect(list.rowByName(runName)).toHaveCount(1);
    });

    await test.step('Step 2: Open the Add form, type RUN-NAME exactly, and press Tab', async () => {
      await list.open();
      await list.addButton.click();
      await form.waitUntilReady();
      await form.typeInto(form.name, runName);
      await page.waitForLoadState('networkidle');
      await expect(form.message(exists)).toHaveCount(0);
      await expect(toast.withText(exists)).toHaveCount(0);
    });

    await test.step('Step 3: Complete Country, Currency and Remarks and click Approve', async () => {
      await form.fill({ ...VALID_PAIR, remarks: 'Duplicate check' });
      await saveAndConfirm(page, 'Approve');
      await expect(toast.withText(exists).or(form.message(exists)).first()).toBeVisible();
      await expect(form.addHeading).toBeVisible();
    });

    await test.step('Step 4: Change the name to RUN-NAME in lower case and click Approve', async () => {
      await toast.waitUntilClear();
      await form.typeInto(form.name, runName.toLowerCase());
      await saveAndConfirm(page, 'Approve');
      await expect(toast.withText(exists).or(form.message(exists)).first()).toBeVisible();
      await expect(form.addHeading).toBeVisible();
    });

    await test.step('Step 5: Click Cancel and search the list for RUN-NAME (Both filter)', async () => {
      await cancelForm(page);
      await findRecord(page, runName, 'Both');
      await expect(list.rows).toHaveCount(1);
      await expect(list.rowByName(runName)).toHaveCount(1);
    });
  },
);
