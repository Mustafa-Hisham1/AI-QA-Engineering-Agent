# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Company\Operating-Country\tests\TC-52857-019.spec.ts >> TC-52857-019 — [NBO][Company][Add Operating Country] Verify an inactive Country or Currency is listed on the Add form and creation with it is refused, recording the message
- Location: automation\NBO\Company\Operating-Country\tests\TC-52857-019.spec.ts:8:1

# Error details

```
Error: Option "[REDACTED]" was not offered by SPAN role=combobox expanded=true. Options present: ["Franc","Franc","Djibouti Franc","Dinar","Dominican Republic Peso","Dutch Guilder","Ekwele","Ethiopian Birr","Escudo Caboverdiano","Eritrean Nakfa","Dollar","Dollar","Dong","Dram","Australian Dollar","Aruban Guilder"]
```

# Test source

```ts
  19  |   readonly remarks?: string;
  20  | }
  21  | 
  22  | export class OperatingCountryFormPage {
  23  |   static readonly addPath = '/admin/company/operating-country/add';
  24  | 
  25  |   readonly page: Page;
  26  |   readonly addHeading: Locator;
  27  |   readonly editHeading: Locator;
  28  |   readonly name: Locator;
  29  |   readonly country: Locator;
  30  |   readonly currency: Locator;
  31  |   readonly remarks: Locator;
  32  |   readonly attentionSummary: Locator;
  33  | 
  34  |   constructor(page: Page) {
  35  |     this.page = page;
  36  |     this.addHeading = page.getByRole('heading', { name: 'Add Operating Country', exact: true });
  37  |     this.editHeading = page.getByRole('heading', { name: 'Edit Operating Country', exact: true });
  38  |     this.name = page.getByRole('textbox', { name: /^Operating Country Name/ });
  39  |     this.country = page.getByRole('combobox', { name: /^Country/ });
  40  |     this.currency = page.getByRole('combobox', { name: /^Currency/ });
  41  |     this.remarks = page.getByRole('textbox', { name: /^Remarks/ });
  42  |     // The error notification repeats the phrase ("Could not save — 4 fields need attention.").
  43  |     this.attentionSummary = page.getByText(/\d+ fields? needs? attention/).filter({ hasNotText: 'Could not save' });
  44  |   }
  45  | 
  46  |   /** Either heading — the form is open. */
  47  |   get heading(): Locator {
  48  |     return this.addHeading.or(this.editHeading);
  49  |   }
  50  | 
  51  |   action(action: FormAction): Locator {
  52  |     return this.page.getByRole('button', { name: action, exact: true });
  53  |   }
  54  | 
  55  |   /** The form's action buttons that are present, in vocabulary order. */
  56  |   async actions(): Promise<FormAction[]> {
  57  |     const present: FormAction[] = [];
  58  |     for (const action of FORM_ACTIONS) if ((await this.action(action).count()) > 0) present.push(action);
  59  |     return present;
  60  |   }
  61  | 
  62  |   message(text: string): Locator {
  63  |     return this.page.getByText(text, { exact: true }).filter({ visible: true });
  64  |   }
  65  | 
  66  |   /** The character counter of a field, e.g. `16 / 100` for Name or `250 / 250` for Remarks. */
  67  |   counter(limit: 100 | 250): Locator {
  68  |     return this.page.getByText(new RegExp(`^\\d+ / ${limit}$`));
  69  |   }
  70  | 
  71  |   /**
  72  |    * Waits until the form has initialised and accepts input. While it loads, the
  73  |    * fields sit inside an `inert` subtree and silently ignore typing (US-52857
  74  |    * RUN-008, TC-52857-026: a cleared Name kept its value).
  75  |    */
  76  |   async waitUntilReady(): Promise<void> {
  77  |     await this.heading.waitFor();
  78  |     await this.page.waitForLoadState('networkidle');
  79  |     await this.name.waitFor();
  80  |     await this.page.waitForFunction(
  81  |       (element) => element !== null && (element as unknown as { closest(selector: string): unknown }).closest('[inert]') === null,
  82  |       await this.name.elementHandle(),
  83  |       { timeout: 15_000 },
  84  |     );
  85  |   }
  86  | 
  87  |   /**
  88  |    * Types a value and leaves the field with Tab. Re-types when the form
  89  |    * swallowed the value (seen in RUN-001 on a freshly loaded form).
  90  |    */
  91  |   async typeInto(field: Locator, value: string): Promise<void> {
  92  |     for (let attempt = 0; attempt < 5; attempt++) {
  93  |       await field.fill(value);
  94  |       if ((await field.inputValue()) === value) break;
  95  |       await this.page.waitForTimeout(500); // the form gives no event when it starts accepting input
  96  |     }
  97  |     await field.press('Tab');
  98  |   }
  99  | 
  100 |   /** Opens a dropdown, types to filter, and picks the exact option. */
  101 |   async choose(field: Locator, option: string): Promise<void> {
  102 |     if ((await field.evaluate((element) => element.tagName)) === 'SELECT') {
  103 |       await field.selectOption({ label: option });
  104 |       return;
  105 |     }
  106 |     // A custom select (PrimeNG): a click made while the form initialises is
  107 |     // swallowed and the list never opens (RUN-008, TC-52857-024) — reopen until expanded.
  108 |     for (let attempt = 0; attempt < 3 && (await field.getAttribute('aria-expanded')) !== 'true'; attempt++) {
  109 |       await field.click();
  110 |       await this.page.waitForTimeout(300); // the overlay animates open with no event to wait on
  111 |     }
  112 |     await field.pressSequentially(option);
  113 |     const wanted = this.page.getByRole('option', { name: option, exact: true });
  114 |     try {
  115 |       await wanted.first().waitFor({ timeout: 10_000 });
  116 |     } catch {
  117 |       const offered = (await this.page.getByRole('option').allTextContents()).map((text) => text.trim()).slice(0, 20);
  118 |       const tag = await field.evaluate((element) => `${element.tagName} role=${element.getAttribute('role') ?? ''} expanded=${element.getAttribute('aria-expanded') ?? ''}`);
> 119 |       throw new Error(`Option "${option}" was not offered by ${tag}. Options present: ${JSON.stringify(offered)}`);
      |             ^ Error: Option "[REDACTED]" was not offered by SPAN role=combobox expanded=true. Options present: ["Franc","Franc","Djibouti Franc","Dinar","Dominican Republic Peso","Dutch Guilder","Ekwele","Ethiopian Birr","Escudo Caboverdiano","Eritrean Nakfa","Dollar","Dollar","Dong","Dram","Australian Dollar","Aruban Guilder"]
  120 |     }
  121 |     await wanted.first().click();
  122 |   }
  123 | 
  124 |   /** Whether a dropdown offers an option, by its exact label. */
  125 |   async offersOption(field: Locator, option: string): Promise<boolean> {
  126 |     return offersOption(this.page, field, option);
  127 |   }
  128 | 
  129 |   /** The label a dropdown shows as chosen — the selected option of a native `<select>`, else its text. */
  130 |   async selectedLabel(field: Locator): Promise<string> {
  131 |     const label = await field.evaluate((element) => {
  132 |       const control = element as unknown as {
  133 |         selectedOptions?: ArrayLike<{ textContent: string | null }>;
  134 |         textContent: string | null;
  135 |       };
  136 |       const selected = control.selectedOptions;
  137 |       return selected && selected.length > 0 ? (selected[0]!.textContent ?? '') : (control.textContent ?? '');
  138 |     });
  139 |     return label.trim();
  140 |   }
  141 | 
  142 |   async fill(values: OperatingCountryValues): Promise<void> {
  143 |     if (values.name !== undefined) await this.typeInto(this.name, values.name);
  144 |     if (values.country !== undefined) await this.choose(this.country, values.country);
  145 |     if (values.currency !== undefined) await this.choose(this.currency, values.currency);
  146 |     if (values.remarks !== undefined) await this.typeInto(this.remarks, values.remarks);
  147 |   }
  148 | 
  149 |   async click(action: FormAction): Promise<void> {
  150 |     await this.action(action).click();
  151 |   }
  152 | }
  153 | 
  154 | /**
  155 |  * Whether a dropdown offers `option`. A native `<select>` is read directly; a
  156 |  * custom one is opened, filtered by typing, read, and closed again.
  157 |  */
  158 | export async function offersOption(page: Page, field: Locator, option: string): Promise<boolean> {
  159 |   if ((await field.evaluate((element) => element.tagName)) === 'SELECT') {
  160 |     return (await field.getByRole('option', { name: option, exact: true }).count()) > 0;
  161 |   }
  162 |   await field.click();
  163 |   await field.pressSequentially(option);
  164 |   const offered = await page
  165 |     .getByRole('option', { name: option, exact: true })
  166 |     .first()
  167 |     .waitFor({ timeout: 5_000 })
  168 |     .then(() => true)
  169 |     .catch(() => false);
  170 |   await page.keyboard.press('Escape');
  171 |   return offered;
  172 | }
  173 | 
  174 | /** All option labels of a dropdown (native `<select>` only; custom lists render a window of them). */
  175 | export async function optionLabels(field: Locator): Promise<string[]> {
  176 |   return (await field.getByRole('option').allTextContents()).map((text) => text.trim());
  177 | }
  178 | 
```