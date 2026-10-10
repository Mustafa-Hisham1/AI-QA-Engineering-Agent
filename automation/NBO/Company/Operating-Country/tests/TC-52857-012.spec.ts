import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
import { cancelForm, record } from '../support/operating-country.ts';

test(
  'TC-52857-012 — [NBO][Company][Add Operating Country] Verify the Name rejects digits, symbols, a leading space and double spaces and accepts letters, accents, hyphens, apostrophes and underscores',
  testCaseDetails({ testCaseId: 'TC-52857-012', storyId: 52857, adoId: null }),
  async ({ page, account }) => {
    const login = new LoginPage(page);
    const form = new OperatingCountryFormPage(page);
    const list = new OperatingCountryListPage(page);

    const latin = 'Operating Country Name may contain Latin letters only, joined by single spaces, apostrophes, hyphens or underscores.';
    const spaces = 'Operating Country Name may not start with a space or contain consecutive spaces.';

    await test.step('Step 1: Log in as ADMIN_ALL and open the Add form', async () => {
      await login.signInAs(account('ADMIN_ALL'));
      await list.open();
      await list.addButton.click();
      await form.waitUntilReady();
      await expect(form.addHeading).toBeVisible();
    });

    for (const [step, value] of [[2, '1abc'], [3, 'Abc1'], [4, 'Abc@Def']] as const) {
      await test.step(step === 2 ? 'Step 2: Type 1abc in Name and press Tab' : step === 3 ? 'Step 3: Replace with Abc1, press Tab' : 'Step 4: Replace with Abc@Def, press Tab', async () => {
        await form.typeInto(form.name, value);
        await expect(form.name).toHaveAttribute('aria-invalid', 'true');
        await expect(form.message(latin)).toBeVisible();
      });
    }

    await test.step('Step 5: Replace with  Abcd (leading space), press Tab', async () => {
      await form.typeInto(form.name, ' Abcd');
      await expect(form.name).toHaveAttribute('aria-invalid', 'true');
      await expect(form.message(spaces)).toBeVisible();
    });

    await test.step('Step 6: Replace with Ab  Cd, press Tab', async () => {
      await form.typeInto(form.name, 'Ab  Cd');
      await expect(form.name).toHaveAttribute('aria-invalid', 'true');
      const shown = (await form.message(latin).isVisible()) ? latin : (await form.message(spaces).isVisible()) ? spaces : 'another message';
      record(6, `message shown: "${shown}"`);
    });

    await test.step('Step 7: Enter each valid value in turn, pressing Tab after each', async () => {
      for (const value of ["Côte d'Ivoire", 'Guinea-Bissau', 'Trinidad and Tobago', 'Abc_Def']) {
        await form.typeInto(form.name, value);
        await expect(form.name).not.toHaveAttribute('aria-invalid', 'true');
      }
    });

    await test.step('Step 8: Click Cancel', async () => {
      await cancelForm(page);
      await expect(page).toHaveURL(/\/admin\/company\/operating-country$/);
    });
  },
);
