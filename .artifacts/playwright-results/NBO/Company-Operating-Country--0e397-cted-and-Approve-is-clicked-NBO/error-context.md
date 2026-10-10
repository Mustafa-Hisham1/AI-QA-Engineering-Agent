# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Company\Operating-Country\tests\TC-52857-020.spec.ts >> TC-52857-020 — [NBO][Company][Add Operating Country] Observe the result when a Currency not belonging to the chosen Country is selected and Approve is clicked
- Location: automation\NBO\Company\Operating-Country\tests\TC-52857-020.spec.ts:7:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  1  | import { expect, test, testCaseDetails } from '../../../../../src/automation/fixtures.ts';
  2  | import { LoginPage } from '../../../Authentication/pages/LoginPage.ts';
  3  | import { OperatingCountryFormPage } from '../pages/OperatingCountryFormPage.ts';
  4  | import { OperatingCountryListPage } from '../pages/OperatingCountryListPage.ts';
  5  | import { findRecord, freshName, record, saveAndConfirm } from '../support/operating-country.ts';
  6  | 
  7  | test(
  8  |   'TC-52857-020 — [NBO][Company][Add Operating Country] Observe the result when a Currency not belonging to the chosen Country is selected and Approve is clicked',
  9  |   testCaseDetails({ testCaseId: 'TC-52857-020', storyId: 52857, adoId: null }),
  10 |   async ({ page, account }) => {
  11 |     const login = new LoginPage(page);
  12 |     const form = new OperatingCountryFormPage(page);
  13 |     const list = new OperatingCountryListPage(page);
  14 | 
  15 |     let runName = '';
  16 |     let created = false;
  17 | 
  18 |     await test.step('Step 1: Log in as ADMIN_ALL, open the Add form, select Country Egypt and open the Currency list', async () => {
  19 |       await login.signInAs(account('ADMIN_ALL'));
  20 |       runName = await freshName(page);
  21 |       await list.open();
  22 |       await list.addButton.click();
  23 |       await form.waitUntilReady();
  24 |       await form.choose(form.country, 'Egypt');
> 25 |       expect(await form.offersOption(form.currency, 'Kuwaiti Dinar')).toBe(true);
     |                                                                       ^ Error: expect(received).toBe(expected) // Object.is equality
  26 |     });
  27 | 
  28 |     await test.step('Step 2: Enter RUN-NAME, select Kuwaiti Dinar and the remarks, then click Approve', async () => {
  29 |       // Observation only (D-06): created or refused, both are recorded; only no response fails.
  30 |       await form.fill({ name: runName, currency: 'Kuwaiti Dinar', remarks: 'Mapping check' });
  31 |       const text = await saveAndConfirm(page, 'Approve');
  32 |       created = /success/i.test(text);
  33 |       record(2, `${created ? 'created' : 'refused'} — message "${text}"`);
  34 |     });
  35 | 
  36 |     await test.step('Step 3: If it was created, search the list for RUN-NAME and record its Country and Currency', async () => {
  37 |       if (!created) {
  38 |         record(3, 'not created — nothing to record');
  39 |         return;
  40 |       }
  41 |       await findRecord(page, runName, 'Both');
  42 |       const row = list.rowByName(runName);
  43 |       record(3, `Country "${await list.cellText(row, 'Country')}", Currency "${await list.cellText(row, 'Currency')}"`);
  44 |     });
  45 |   },
  46 | );
  47 | 
```