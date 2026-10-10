# Automation Plan — NBO · Company › Operating Country

**Approved by the human on 2026-10-10** (explicit approval in session), with these decisions:

1. **Module structure:** Operating Country is a module under Company — paths are
   `Company/Operating-Country/` (declared in `profile.md` → *Module hierarchy for automation*;
   the CSV's Module field stays `Company`).
2. **Locators:** proceed with the plan's locators and the RUN-001 evidence; fix what proves wrong.
3. **Scope:** every case whose CSV `Need Automation` is exactly `Yes` — Notes and other fields
   never exclude a case (answers Q-3: TC-52857-051 is automated).
4. **Test data** accumulates on STG; no cleanup steps (answers Q-1).
5. **Known limitations** (inactive Country/Currency precondition checks, the 32 `#NAME?`
   Precondition cells) are accepted; handled if they cause problems.

Q-2 (TC-52857-044 step 3) and Q-4 (framework additions) were approved as proposed with the plan.
Q-5 was answered by decision 2: no further exploration — locators were corrected from the
automated runs themselves. Rows of the case table are never removed once added.

## 1. Provenance

| Field | Value |
|---|---|
| Project | NBO |
| Module | Company › Operating Country (directory `Company/Operating-Country`) |
| Source | `docs/projects/NBO/test-cases/US-52857/test-cases.csv` — sha256 `7a20f01e673a1a4fdee0a5b8cad46c84bc7c9d5280b51fd4abb9412646d22ec9` (read with `npm run testcases:show`, 2026-10-10) |
| Scope | `npm run automation:scope -- 52857 --project NBO`: **51 of 51 in scope** (Need Automation `Yes`, status `Approved`), 0 excluded |
| Environment label | `STG` (`APP_ENV`, on the profile's allow-list) |
| Host explored | `ndc-apis-nbo-frontend-dev-epf8graxc0cudjd9.northeurope-01.azurewebsites.net` (STG by human decision, `decisions.md` §12.1) |
| Date | 2026-10-10 |
| Artifact safety | `npm run automation:verify-artifacts` — **PASS** (2026-10-10, before exploration) |
| Test data | Every handle the 51 cases use is set in `.env` (checked by variable name only): `ADMIN_ALL`, `OPERATING_COUNTRIES_MAKER`, `OPERATING_COUNTRIES_APPROVER`, `OPERATING_COUNTRIES_VIEW_ONLY`, `OPC_USER_NO_MENU`, `OPC_COUNTRY_INACTIVE`, `OPC_CURRENCY_INACTIVE` |

### Exploration — what was and was not seen

| Source | Pages | Used for |
|---|---|---|
| **Explored this session** (Playwright MCP, unauthenticated) | `/auth/staff-login` — and a deep link to `/admin/company/operating-country` while logged out redirects there | Login locators (verbatim accessible names below) |
| **Not explored this session** | Every authenticated page | Authenticated MCP exploration was **refused by the session's permission classifier** (it would have put credential values into the browser). Not worked around |
| **US-52857 RUN-001** (manual MCP run, same host, 2026-10-10, 51 cases) | List, filters, pagination, Add/Edit forms, every dialog, toasts, access-denied page | Accessible names, dialog titles, button names, toast and validation texts — quoted verbatim from `executions/US-52857/RUN-001/execution-results.md` |

Consequence: the **authenticated locators below are taken from accessible names RUN-001 observed,
not from a DOM inspected for automation.** Role and name are known; *structure* (whether the list
is a `table` with `row`/`cell` roles, how a row's actions are grouped, where the toast lives) is
**assumed** and marked **(confirm)**. Every generated spec stays `GENERATED — NOT VERIFIED` until it
runs green on STG; a locator that proves wrong is a `TEST_SCRIPT_ISSUE`, fixed in the Page Object
and never forwarded as a Bug Candidate.

## 2. Case table

Spec root: `automation/NBO/Company/Operating-Country/tests/`. Handles abbreviated: **ALL** `ADMIN_ALL`, **MK**
`OPERATING_COUNTRIES_MAKER`, **AP** `OPERATING_COUNTRIES_APPROVER`, **VO**
`OPERATING_COUNTRIES_VIEW_ONLY`, **NM** `OPC_USER_NO_MENU`, **CI** `OPC_COUNTRY_INACTIVE`, **XI**
`OPC_CURRENCY_INACTIVE`. Page Objects: **L** Login, **N** NavigationMenu, **OL** OperatingCountryList,
**OF** OperatingCountryForm, **D** ConfirmDialog, **T** Toast, **AD** AccessDenied.

| Test Case | User Story | ADO ID | Title | Status | Need Automation | Spec | Page Objects | Handles | Automation Status | Reason |
|---|---|---|---|---|---|---|---|---|---|---|
| TC-52857-001 | 52857 | — | View-only user sees the list with no Add button and no row actions | Approved | Yes | `TC-52857-001.spec.ts` | L, OL | VO | AUTOMATED | Passed on STG: RUN-008 |
| TC-52857-002 | 52857 | — | View-only user kept off the Add and Edit forms via direct URLs | Approved | Yes | `TC-52857-002.spec.ts` | L, OL, OF | ALL (record id), VO | AUTOMATED | Passed on STG: RUN-008, RUN-013 |
| TC-52857-003 | 52857 | — | Maker sees Add, and Edit + Deactivate on an approved active row | Approved | Yes | `TC-52857-003.spec.ts` | L, OL | MK | AUTOMATED | Passed on STG: RUN-008 |
| TC-52857-004 | 52857 | — | Approver sees no Add and only Reject + Deactivate on an approved active row | Approved | Yes | `TC-52857-004.spec.ts` | L, OL | AP | AUTOMATED | Passed on STG: RUN-008 |
| TC-52857-005 | 52857 | — | Approver cannot create or amend via direct Add/Edit URLs | Approved | Yes | `TC-52857-005.spec.ts` | L, OL, OF | ALL (record id), AP | AUTOMATED | Passed on STG: RUN-015. RUN-008 FAIL was a script defect — the check counted the list rows' Reject icons after the expected redirect; now only a displayed form is checked |
| TC-52857-006 | 52857 | — | All-permission user sees Add, and Edit + Reject + Deactivate | Approved | Yes | `TC-52857-006.spec.ts` | L, OL | ALL | AUTOMATED | Passed on STG: RUN-002, RUN-008 |
| TC-52857-007 | 52857 | — | User without the menu right sees no menu entry and cannot open list/Add | Approved | Yes | `TC-52857-007.spec.ts` | L, N, AD | NM | AUTOMATED | Passed on STG: RUN-008 |
| TC-52857-008 | 52857 | — | All-permission Add form: four required fields, only Cancel and Approve | Approved | Yes | `TC-52857-008.spec.ts` | L, OL, OF | ALL | AUTOMATED | Passed on STG: RUN-004, RUN-008 |
| TC-52857-009 | 52857 | — | Maker Add form requires Remarks, only Send For Approval, blocks empty submit | Approved | Yes | `TC-52857-009.spec.ts` | L, OL, OF | MK | AUTOMATED | Passed on STG: RUN-008 |
| TC-52857-010 | 52857 | — | Required-field messages on an empty Approve | Approved | Yes | `TC-52857-010.spec.ts` | L, OL, OF | ALL | AUTOMATED | Passed on STG: RUN-007 |
| TC-52857-011 | 52857 | — | Name length boundaries 2/3 and 100/101, trimmed length | Approved | Yes | `TC-52857-011.spec.ts` | L, OL, OF | ALL | GENERATED — NOT VERIFIED | RUN-008: sign-in timed out — STG session cap reached by abandoned sessions (§7.1.3); not a result. Not yet re-run |
| TC-52857-012 | 52857 | — | Name character rules | Approved | Yes | `TC-52857-012.spec.ts` | L, OL, OF | ALL | GENERATED — NOT VERIFIED | RUN-008: sign-in timed out — STG session cap reached by abandoned sessions (§7.1.3); not a result. Not yet re-run |
| TC-52857-013 | 52857 | — | Remarks 250/251 boundary and free text | Approved | Yes | `TC-52857-013.spec.ts` | L, OL, OF | ALL | GENERATED — NOT VERIFIED | RUN-008: sign-in timed out — STG session cap reached by abandoned sessions (§7.1.3); not a result. Not yet re-run |
| TC-52857-014 | 52857 | — | All-permission create → Approved / Active, first row | Approved | Yes | `TC-52857-014.spec.ts` | L, OL, OF, D, T | ALL | AUTOMATED | Passed on STG: RUN-007 |
| TC-52857-015 | 52857 | — | Maker create → Pending / Inactive, only under Inactive | Approved | Yes | `TC-52857-015.spec.ts` | L, OL, OF, D, T | MK | AUTOMATED | Passed on STG: RUN-008 |
| TC-52857-016 | 52857 | — | Trailing space removed from the saved name | Approved | Yes | `TC-52857-016.spec.ts` | L, OL, OF, D, T | ALL | GENERATED — NOT VERIFIED | RUN-008: sign-in timed out — STG session cap reached by abandoned sessions (§7.1.3); not a result. Not yet re-run |
| TC-52857-017 | 52857 | — | Duplicate name refused, exact and different case | Approved | Yes | `TC-52857-017.spec.ts` | L, OL, OF, D, T | ALL | GENERATED — NOT VERIFIED | RUN-008: sign-in timed out — STG session cap reached by abandoned sessions (§7.1.3); not a result. Not yet re-run |
| TC-52857-018 | 52857 | — | Name held by a Pending record refused | Approved | Yes | `TC-52857-018.spec.ts` | L, OL, OF, D, T | MK, ALL | GENERATED — NOT VERIFIED | RUN-008: step 2 sign-in timed out (session cap); not a result |
| TC-52857-019 | 52857 | — | Inactive Country / Currency listed on Add, creation refused | Approved | Yes | `TC-52857-019.spec.ts` | L, OL, OF, D, T | ALL, CI, XI | GENERATED — NOT VERIFIED | RUN-008: sign-in timed out — STG session cap reached by abandoned sessions (§7.1.3); not a result. Not yet re-run. Plan note: See R-6 |
| TC-52857-020 | 52857 | — | Observe: Currency not mapped to the Country | Approved | Yes | `TC-52857-020.spec.ts` | L, OL, OF, D, T | ALL | GENERATED — NOT VERIFIED | RUN-008: sign-in timed out — STG session cap reached by abandoned sessions (§7.1.3); not a result. Not yet re-run. Plan note: Observation-only step 2 |
| TC-52857-021 | 52857 | — | Cancelled Add form creates nothing | Approved | Yes | `TC-52857-021.spec.ts` | L, OL, OF | ALL | GENERATED — NOT VERIFIED | RUN-008: sign-in timed out — STG session cap reached by abandoned sessions (§7.1.3); not a result. Not yet re-run |
| TC-52857-022 | 52857 | — | Edit form pre-fills, locks Country/Currency, Cancel/Approve/Reject | Approved | Yes | `TC-52857-022.spec.ts` | L, OL, OF | ALL | AUTOMATED | Passed on STG: RUN-008 |
| TC-52857-023 | 52857 | — | Maker rename of an Approved record stays Approved / Active | Approved | Yes | `TC-52857-023.spec.ts` | L, OL, OF, D, T | ALL, MK | AUTOMATED | Passed on STG: RUN-015. RUN-008 FAIL was a script defect — the list was read before its headers rendered; `open()` now waits for the data and headers |
| TC-52857-024 | 52857 | — | Maker remarks-only update, no duplicate error | Approved | Yes | `TC-52857-024.spec.ts` | L, OL, OF, D, T | ALL, MK | AUTOMATED | Passed on STG: RUN-015. RUN-008 FAIL was a script defect — the PrimeNG Country select ignored a click made while the form initialised; `choose()` reopens until expanded |
| TC-52857-025 | 52857 | — | Maker rename to another record's name (other case) refused | Approved | Yes | `TC-52857-025.spec.ts` | L, OL, OF, D, T | ALL, MK | GENERATED — NOT VERIFIED | RUN-008: test timeout (180 s) during setup while logins were failing; not a result |
| TC-52857-026 | 52857 | — | Edit form name validation messages | Approved | Yes | `TC-52857-026.spec.ts` | L, OL, OF | MK | AUTOMATED | Passed on STG: RUN-015. RUN-008/RUN-013 FAIL was a script defect — the Name field was `inert` while loading, so the clear was ignored; `waitUntilReady()` now waits until it accepts input |
| TC-52857-027 | 52857 | — | Maker update of a Pending record stays Pending / Inactive | Approved | Yes | `TC-52857-027.spec.ts` | L, OL, OF, D, T | MK | AUTOMATED | Passed on STG: RUN-008 |
| TC-52857-028 | 52857 | — | Rejected record amended by Maker returns to Pending | Approved | Yes | `TC-52857-028.spec.ts` | L, OL, OF, D, T | MK, AP | AUTOMATED | Passed on STG: RUN-015. RUN-008 FAIL was a script defect — the toast reader read the list's record count ("1 operating country", a live status region); it now reads only Success/Error/Warning/Info notifications |
| TC-52857-029 | 52857 | — | Maker edits then Cancel leaves the record unchanged | Approved | Yes | `TC-52857-029.spec.ts` | L, OL, OF, D, T | ALL, MK | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran) |
| TC-52857-030 | 52857 | — | Approver approves a Pending record from the list | Approved | Yes | `TC-52857-030.spec.ts` | L, OL, OF, D, T | MK, AP | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran) |
| TC-52857-031 | 52857 | — | Approver rejects a Pending record from the list | Approved | Yes | `TC-52857-031.spec.ts` | L, OL, OF, D, T | MK, AP | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran) |
| TC-52857-032 | 52857 | — | Observe: reject with empty remarks | Approved | Yes | `TC-52857-032.spec.ts` | L, OL, OF, D, T | MK, AP | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran). Plan note: Observation-only steps 2–3 |
| TC-52857-033 | 52857 | — | Approve blocked with empty or 251-character remarks | Approved | Yes | `TC-52857-033.spec.ts` | L, OL, OF, D, T | MK, AP | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran) |
| TC-52857-034 | 52857 | — | Approve dialog cancelled leaves the record Pending | Approved | Yes | `TC-52857-034.spec.ts` | L, OL, OF, D, T | MK, AP | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran) |
| TC-52857-035 | 52857 | — | Maker sees no Approve / Reject on a Pending record | Approved | Yes | `TC-52857-035.spec.ts` | L, OL, OF, D, T | MK | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran) |
| TC-52857-036 | 52857 | — | All-permission approves a Pending record from the Edit form | Approved | Yes | `TC-52857-036.spec.ts` | L, OL, OF, D, T | MK, ALL | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran) |
| TC-52857-037 | 52857 | — | Rejected record's Edit form offers Cancel/Approve/Reject; approve it | Approved | Yes | `TC-52857-037.spec.ts` | L, OL, OF, D, T | MK, AP, ALL | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran). Plan note: First execution of the D-19 expectation |
| TC-52857-038 | 52857 | — | All-permission rejects an Approved record | Approved | Yes | `TC-52857-038.spec.ts` | L, OL, OF, D, T | ALL | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran) |
| TC-52857-039 | 52857 | — | Approver deactivates then activates, both confirmed | Approved | Yes | `TC-52857-039.spec.ts` | L, OL, OF, D, T | ALL, AP | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran). Plan note: First execution of the D-18 expectation |
| TC-52857-040 | 52857 | — | Maker deactivates and activates an Approved record | Approved | Yes | `TC-52857-040.spec.ts` | L, OL, OF, D, T | ALL, MK | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran) |
| TC-52857-041 | 52857 | — | Deactivate cancelled leaves the record Active | Approved | Yes | `TC-52857-041.spec.ts` | L, OL, OF, D, T | ALL, AP | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran) |
| TC-52857-042 | 52857 | — | No Activate on Pending or Rejected records, any role | Approved | Yes | `TC-52857-042.spec.ts` | L, OL, OF, D, T | MK, AP, ALL | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran) |
| TC-52857-043 | 52857 | — | List heading, columns and filter labels | Approved | Yes | `TC-52857-043.spec.ts` | L, OL | ALL | AUTOMATED | Passed on STG: RUN-002, RUN-009…012 |
| TC-52857-044 | 52857 | — | List opens on Active, 10 per page, page 1, most recent first | Approved | Yes | `TC-52857-044.spec.ts` | L, OL | ALL | AUTOMATED | Passed on STG: RUN-014 (step 3 records the first row, plan Q-2) |
| TC-52857-045 | 52857 | — | Case-insensitive partial name search | Approved | Yes | `TC-52857-045.spec.ts` | L, OL | ALL | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran) |
| TC-52857-046 | 52857 | — | `_` and `%` are not wildcards | Approved | Yes | `TC-52857-046.spec.ts` | L, OL | ALL | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran) |
| TC-52857-047 | 52857 | — | Country filter lists only that Country's records | Approved | Yes | `TC-52857-047.spec.ts` | L, OL | ALL | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran). Plan note: See R-5 |
| TC-52857-048 | 52857 | — | Inactive and Both filters | Approved | Yes | `TC-52857-048.spec.ts` | L, OL, OF, D, T | MK, ALL | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran) |
| TC-52857-049 | 52857 | — | No-results message | Approved | Yes | `TC-52857-049.spec.ts` | L, OL | ALL | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran) |
| TC-52857-050 | 52857 | — | Inactive Country absent from the list filter, offered on Add | Approved | Yes | `TC-52857-050.spec.ts` | L, OL, OF | ALL, CI | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran). Plan note: See R-6 |
| TC-52857-051 | 52857 | — | Page 2 keeps criteria and continues the order | Approved | Yes | `TC-52857-051.spec.ts` | L, OL | ALL | GENERATED — NOT VERIFIED | Not executed yet — RUN-008 was stopped before it (worker killed; the report shows FAIL, but nothing ran). Plan note: **Q-3**: the case's Notes contradict its Need Automation value |

## Run history

| Run | Date | Scope | Result | Valid? |
|---|---|---|---|---|
| RUN-001 … RUN-007 | 2026-10-10 | Single-case locator probes while generating | Locators corrected (headers via `textContent`, native `<select>`, login refill, 180 s timeout) | Probes only |
| **RUN-008** | 2026-10-10 | All 51 | 11 PASS · 17 FAIL executed (TC-001…028) · 23 never executed (TC-029…051, worker killed when the agent stopped the run) — the report shows 40 FAIL | **No** — no session was logged out; STG's 15-session cap made 12 `ADMIN_ALL` sign-ins time out |
| RUN-009 … RUN-012 | 2026-10-10 | TC-52857-043 | PASS each time; logout fixed step by step (account menu label, confirmation dialog). RUN-009…011 left up to 3 `ADMIN_ALL` sessions open | Logout verification |
| RUN-013 | 2026-10-10 | TC-52857-002, -026 | 002 PASS (two accounts, both logged out) · 026 FAIL (script issue), session still logged out, failure screenshot intact | Logout verification |
| RUN-014 | 2026-10-10 | TC-52857-002, -026, -043, -044 | **Logout API verified**: every session (switch and teardown, pass and fail) → `logout API HTTP 200; old token now rejected (HTTP 401)`; 044 logged in right after 043's session ended. 026 still FAIL (script) | Logout verification |
| RUN-015 | 2026-10-10 | TC-52857-002, -005, -023, -024, -026, -028 | **6 PASS** after the five script fixes; every session ended through the API (028: three sessions) | Fix verification |

Reports: `.artifacts/reports/NBO/RUN-<NNN>/automation-report.html` (gitignored, append-only).

## 3. Page Objects (all new — `automation/NBO/` holds no code yet)

Locators and actions only: no assertion, no test data, no credential. Locator preference:
`getByRole` + accessible name → `getByLabel` → `getByTestId` → `getByText` for static copy.
**No CSS or XPath is planned.**

### `automation/NBO/Authentication/pages/LoginPage.ts` — *explored this session*

Lives in the Authentication Module because it models the login page. US 53717 specs will reuse it,
and Company specs import it instead of copying it.

| Element | Locator | Source |
|---|---|---|
| User name | `getByRole('textbox', { name: 'User Name (required)' })` | explored |
| Password | `getByRole('textbox', { name: 'Password (required)' })` | explored |
| Login | `getByRole('button', { name: 'Login' })` | explored |
| Route | `/auth/staff-login`; a logged-out deep link is redirected there | explored |

Actions: `open()`, `signIn(account)` (fills, re-fills a value the initialising form dropped, submits,
and **registers the session**), `signInAs()`, `logout()` and `signOut()`.

**Sessions (`docs/product-decisions.md` §7.1.3).** From the moment a login is submitted, the Page
Object watches the application's own backend requests and keeps that session's latest bearer
token and backend origin (in memory, registered for redaction). Each session is ended through the
**logout API** — `POST <origin>/api/v1/Auth/logout?api-version=1`, `allSessions: false`, its own
token — before another login on the page (`signOut()`, which then clears the browser and reopens
the login page) and by the `endSessions` fixture at test end, passed or failed. Each logout is
confirmed by repeating one of the app's read-only GETs with the old token (401 = ended). Never a
saved session: `storageState` is forbidden.

**Left as found:** the login page's **API** toggle (`Development` / `Testing` / `Local`, default
`Development`) selects the backend. No spec touches it. Its default backend is the one RUN-001
exercised.

### `automation/NBO/Company/Operating-Country/pages/OperatingCountryListPage.ts`

| Element | Locator | Source |
|---|---|---|
| Route | `/admin/company/operating-country` | RUN-001 |
| Heading | `getByRole('heading', { name: 'Operating Country', exact: true })` | RUN-001 |
| Add button | `getByRole('button' \| 'link', { name: 'Add Operating Country' })` — role (confirm) | RUN-001 |
| Name filter | `getByLabel('Operating Country Name')` | RUN-001 |
| Country filter | `getByRole('combobox', { name: 'Country' })` scoped to the filter area — type-ahead, then `getByRole('option', { name })` (confirm) | RUN-001 |
| Status toggle | `getByRole('radio' \| 'button', { name: 'Active' / 'Inactive' / 'Both' })` (confirm role) | RUN-001 |
| Search / Reset | `getByRole('button', { name: 'Search' })`, `getByRole('button', { name: 'Reset' })` | RUN-001 |
| Rows | `getByRole('row')` minus the header row; cells by column index from the header `columnheader`s *Name, Country, Currency, Approval Status, Status, Actions* (confirm table roles) | RUN-001 |
| Row by name | the row whose Name cell has the exact text | — |
| Row actions | within the row: `getByRole('button', { name: 'Edit' \| 'Approve' \| 'Reject' \| 'Activate' \| 'Deactivate' \| 'View All Branches' })`; a View-only row shows the text `-` | RUN-001 |
| Summary / count | `getByText(/^Showing \d+ to \d+ of \d+$/)`, `getByText(/^\d+ operating countr(y\|ies)$/)` | RUN-001 |
| Pagination | `getByRole('button', { name: 'Next Page' })`, `{ name: 'First Page' }`; rows-per-page control showing `10` (confirm) | RUN-001 |
| No results | `getByText('No operating countries match these filters')` | RUN-001 |

Actions: `open()`, `search({ name?, country?, status? })` (waits for the list to settle on the
response), `rowByName(name)`, `rowActions(row)` (returns the action names, so a spec can assert
the **exact** set), `cell(row, column)`, `goToNextPage()`, `goToFirstPage()`, `reset()`.

### `automation/NBO/Company/Operating-Country/pages/OperatingCountryFormPage.ts` — Add and Edit share one form

| Element | Locator | Source |
|---|---|---|
| Heading | `getByRole('heading', { name: 'Add Operating Country' \| 'Edit Operating Country' })` | RUN-001 |
| Name | `getByRole('textbox', { name: /Operating Country Name/ })` | RUN-001 |
| Country / Currency | `getByRole('combobox', { name: /^Country/ })`, `{ name: /^Currency/ }` — type-ahead (Currency renders 16 of 211 options until typed), then `getByRole('option', { name, exact: true })`; locked state = `aria-disabled="true"` | RUN-001 |
| Remarks | `getByRole('textbox', { name: /Remarks/ })` | RUN-001 |
| Required marker | the label text `(required)` beside each field | RUN-001 |
| Field invalid state | `aria-invalid="true"` on the field — **not** the message text, which can linger in a hidden live region (TC-52857-011 / -012 notes) | RUN-001 |
| Field message | the field's accessible description, or visible text below it: `getByText(<message>)` (confirm) | RUN-001 |
| Counters | `getByText(/^\d+ \/ 100$/)` for Name, `/^\d+ \/ 250$/` for Remarks, scoped to the field | RUN-001 |
| Summary | `getByText(/\d+ fields? need(s)? attention/)` | RUN-001 |
| Actions | `getByRole('button', { name: 'Cancel' \| 'Approve' \| 'Reject' \| 'Send For Approval' \| 'Update' })`; `formActions()` returns the set | RUN-001 |

Actions: `openAdd()` (via the list's Add button), `openEdit(name)` (Edit on that row), `fill({ name,
country, currency, remarks })`, which **types and then presses Tab** per field. RUN-001 saw a
programmatic fill without blur report success yet not persist (TC-52857-024); typing plus Tab is
what persisted. `waitUntilReady()` waits for the form to initialise before typing, because RUN-001
saw a value typed too early dropped. Also `clickAction(name)` and `currentUrlPath()`.

### `automation/NBO/Company/Operating-Country/pages/ConfirmDialog.ts`

| Dialog | Title | Confirm button | Source |
|---|---|---|---|
| Approve on create / edit | `Approve this operating country?` | `Approve` (confirm name) | RUN-001 |
| Send for approval | `Submit this operating country for approval?` | `Send For Approval` | RUN-001 |
| Update | `Save changes to this operating country?` | `Update` | RUN-001 |
| Approve from list | `Approve <name>?` + field `Reason (required)` | `Approve Operating country` (disabled until a reason) | RUN-001 |
| Reject from list | `Reject <name>?` + field `Reason (required)` | `Reject Operating country` | RUN-001 |
| Deactivate | `Deactivate <name>?` | `Deactivate Operating country` | RUN-001 |
| Activate | `Activate <name>?` | `Activate Operating country` | RUN-001 (D-18) |

Locator: `getByRole('dialog')` filtered by its heading. Actions: `title()`, `bodyText()`,
`reasonField()`, `confirm()`, `cancel()`.

### `automation/NBO/Company/Operating-Country/pages/Toast.ts`

`getByRole('status' | 'alert')` containing the message (confirm). Seen: *"Operating Country approved
successfully"*, *"…sent for approval successfully"*, *"…updated successfully"*, *"Operating country
approved / rejected / activated / deactivated successfully"*, *"Operating Country Already
Exists."*, *"The selected country is not active."*, *"The selected currency is not active."* —
each with a `Success —` / `Error —` prefix. **Short-lived**: RUN-001 missed two, so the spec starts
waiting before the click that triggers it. `text()` returns the message for recording.

### `automation/NBO/Company/Operating-Country/pages/NavigationMenu.ts` and `AccessDeniedPage.ts`

The menu's entries by `getByRole('link' | 'menuitem', { name })` (confirm); RUN-001 saw only
*Dashboard* for `OPC_USER_NO_MENU`. Access denied: route `/access-denied`, text *"Access denied"* and
*"You do not have access to this page."*

### Proposed framework additions — part of this approval

1. **`automation/NBO/Company/Operating-Country/support/operating-country.ts`** generates the run-time names (D-17): `AUT Opc
   <8 random letters>`. That is letters only, contains `AUT`, and is the RUN-001 convention. Before
   use, the name is checked unused by a Both-filter search. This is the one non-`pages/`,
   non-`tests/` file. The Skill and `CLAUDE.md` layout would be updated to name a Module's
   `support/` directory.
2. **Recorded observations in the HTML report.** 19 steps say *"record its exact text"* or are
   observation-only (TC-52857-014, -015, -019, -020, -023, -027, -030, -031, -032, -033, -036,
   -038, -039 and more). Today the report shows only the Test Case, story and ADO annotations, so a
   recorded text would be **lost**. Proposal: the spec records with
   `test.info().annotations.push({ type: 'observation', description: 'Step N: …' })`, and the
   reporter renders those under the step, through the shared sanitizer. This changes
   `src/automation/reporting/` (build, model, generator) and needs tests. It would also need
   `docs/product-decisions.md` §7.2 and the Skill updated. **Without it, those steps would assert
   only what the case asserts and record nothing.**

## 4. Per-case mapping

Common to every case: **Step 1 "Log in as H"** → `LoginPage.open()` → `signIn(account('H'))`, then
it **settles** on `expect(page).toHaveURL(/\/admin|\/dashboard/)` before judging anything. A
role switch mid-case is `signOut()` + `signIn()` inside the step that names the new role.
**"Create RUN-NAME"** setup steps use the same form actions as TC-52857-014 / -015, with the
dialog confirmed, and settle on the toast plus the list. "Record" means an observation annotation
(§3, addition 2); it is never an assertion.

| Case | Step → assertion (each traced to that step's Expected Result) |
|---|---|
| 001 | 1 heading + Search visible · 2 Add button count 0 · 3 every row's actions set is empty (`-`) · 4 search `Egy` → ≥ 1 row, each name contains `egy` (case-insensitive) |
| 002 | setup in step 1 (as ALL): read a record's Edit URL path, sign out, sign in as VO · 1 goto `/add` → URL is the list, no Add heading · 2 goto Edit path → no button Update/Approve/Reject/Send For Approval visible; record the URL reached |
| 003 | 1 Add visible · 2 first Approved/Active row: actions exactly {Edit, Deactivate} · 3 none of Approve, Reject, View All Branches |
| 004 | 1 list loaded, Add count 0 · 2 actions exactly {Reject, Deactivate} · 3 no Edit, no View All Branches |
| 005 | as 002 for AP: 1 no save action on `/add`; record URL · 2 no Update/Approve/Reject/Send For Approval on the Edit URL; record URL. **Nothing is submitted** |
| 006 | 1 Add visible · 2 exactly {Edit, Reject, Deactivate} · 3 no View All Branches |
| 007 | 1 no `Operating Country` entry in the menu · 2 goto list → list heading not visible (access-denied page expected by RUN-001, not asserted beyond the case) · 3 goto `/add` → Add heading not visible |
| 008 | 1 Add heading · 2 four fields visible, each with `(required)` · 3 actions exactly {Cancel, Approve} |
| 009 | 1 heading · 2 four required fields · 3 exactly {Cancel, Send For Approval} · 4 click; form still open; the three exact messages; Remarks `aria-invalid` |
| 010 | 1 heading, fields empty · 2 click Approve; form still open; summary `need attention` visible · 3 the four exact messages |
| 011 | 2 `Ab` → invalid + length message · 3 `Abc` → not invalid · 4 100 chars → not invalid · 5 101 chars → invalid + message · 6 `Ab ` → invalid + message · 7 Cancel → list URL |
| 012 | 2–4 invalid + "Latin letters" message · 5 invalid + "may not start with a space" message · 6 invalid; record the message · 7 each valid value not invalid · 8 Cancel → list |
| 013 | 2 not invalid, counter `250 / 250` · 3 invalid, message, counter `251 / 250` · 4 not invalid · 5 Cancel → list |
| 014 | 2 no field invalid · 3 confirm the dialog; a toast is shown (record its text); list URL · 4 default list, first row = RUN-NAME, Egypt, Egyptian Pound, Approved, Active |
| 015 | 1 no field invalid · 2 dialog title `Submit this operating country for approval?`; confirm; toast (record); list · 3 Active search → no RUN-NAME row · 4 Inactive search → row; Status Inactive (`InActive` as rendered, compared case-insensitively); record the Approval Status label |
| 016 | 1 name not invalid · 2 confirm; list shown · 3 Edit: name value = RUN-NAME, counter = its length · 4 Cancel → list |
| 017 | 1 created (toast + row) · 2 RUN-NAME + Tab: no `Operating Country Already Exists.` text · 3 confirm → `Operating Country Already Exists.`; form still open · 4 lower case → same message · 5 Cancel; Both search → exactly 1 row |
| 018 | 1 (MK) created Pending · 2 (ALL) refused with the D-12 message · 3 Both search → 1 row, Inactive, Pending |
| 019 | 1 the Country option CI is offered · 2 confirm → `The selected country is not active.`; form open · 3 confirm → an error toast is shown; record its text · 4 Both search for each name → no results |
| 020 | 1 Egypt chosen; the Currency list offers `Kuwaiti Dinar` · 2 **observation**: a toast or a field message appears within the timeout (fails only on no response); record created/refused + text · 3 if created: record the row's Country and Currency |
| 021 | 1 no field invalid · 2 Cancel → list · 3 Both search → no results |
| 022 | 1 Edit heading · 2 Name/Country/Currency equal the row's cells · 3 Country and Currency `aria-disabled="true"` · 4 Remarks non-empty and editable · 5 exactly {Cancel, Approve, Reject} · 6 Cancel → list, row unchanged |
| 023 | 1 (ALL) created · 2 (MK) exactly {Cancel, Update} · 3 confirm; toast (record); list · 4 first row RUN-NAME-2, Approved, Active |
| 024 | 1 created · 2 (MK) remarks typed + Tab, Update, confirm; no duplicate message; list · 3 reopen: name unchanged, Remarks = `Remarks updated by QA` |
| 025 | 1 two created · 2 rename to upper-case RUN-NAME → `Operating Country Already Exists.`; form open · 3 Cancel; search → RUN-NAME-2 row exists |
| 026 | 2 empty → required message · 3 `Ab` → length message · 4 `Abc1` → Latin-letters message (a different appropriate message is recorded, not failed — case note) · 5 Cancel → list |
| 027 | 1 Pending · 2 Edit: no Approve, no Reject; ≥ 1 save action; record the set · 3 save + confirm; toast; list · 4 Inactive search: Pending, Inactive |
| 028 | 1 Pending · 2 (AP) Reject from list with reason → row Rejected, Inactive · 3 (MK) save actions exactly {Send For Approval}, no Approve/Reject · 4 confirm; toast · 5 Inactive search: Pending, Inactive |
| 029 | 1 created with remarks `Original` · 2 fields show new values · 3 Cancel → list · 4 reopen: name RUN-NAME, remarks `Original`; row Approved / Active |
| 030 | 1 Pending · 2 (AP, Inactive) actions include Approve and Reject, no Edit · 3 dialog visible; record title, field, buttons · 4 reason + confirm; toast (record) · 5 Active search: Approved, Active |
| 031 | 1 Pending · 2 dialog visible; record title, field, buttons, required marker · 3 confirm; toast (record) · 4 Inactive: Rejected, Inactive · 5 Active: no results |
| 032 | 1 Pending · 2 **observation**: record whether the confirm is disabled / a message shows / it is recorded · 3 **observation**: record the Both-filter Approval Status and Status |
| 033 | 1 Pending · 2 empty reason: confirm disabled **or** field invalid; record the message · 3 251 chars: same check; record · 4 cancel; Inactive: Pending, Inactive |
| 034 | 1 Pending · 2 reason, Cancel → dialog hidden; no success toast · 3 Inactive: Pending, Inactive |
| 035 | 1 Pending · 2 Inactive row: no Approve, no Reject; record the set · 3 Edit form: no Approve, no Reject |
| 036 | 1 Pending · 2 (ALL) exactly {Cancel, Approve, Reject}, no Send For Approval · 3 confirm; toast (record) · 4 Active: Approved, Active |
| 037 | 1 Pending · 2 (AP) rejected → Rejected / Inactive · 3 (ALL) exactly {Cancel, Approve, Reject} (D-19) · 4 Remarks = `Rejected by QA` · 5 confirm; toast · 6 Active: Approved, Active |
| 038 | 1 created · 2 Reject + reason + confirm; toast (record) · 3 Active: no results · 4 Inactive: Rejected, Inactive |
| 039 | 1 created · 2 (AP) Deactivate → dialog visible before any change; record its text · 3 confirm; toast (record) · 4 Active: no results · 5 Inactive: Approved, Inactive, Activate offered · 6 Activate → dialog visible (D-18); confirm · 7 Active: Approved, Active |
| 040 | 1 created · 2 (MK) Deactivate + confirm; success toast, no error toast · 3 Inactive: Approved, Inactive, Activate offered · 4 Activate (+ confirm — D-18, not asserted here); success toast · 5 Active: Approved, Active |
| 041 | 1 created · 2 (AP) Deactivate → Cancel → dialog hidden · 3 Active: Approved, Active |
| 042 | 1 two Pending · 2 (AP) RUN-NAME-2 rejected · 3 (AP) neither row offers Activate · 4 (MK, then ALL) neither row offers Activate |
| 043 | 1 heading `Operating Country` · 2 column headers exactly the six · 3 filter labels and the three toggle options |
| 044 | 1 Active selected; every row Status Active · 2 rows-per-page `10`, page 1 current, summary and count visible · 3 **Q-2** |
| 045 | 1 `GYP` → ≥ 1 row, every name contains `gyp` (case-insensitive) · 2 count = the summary total, and equals the rows listed when it is ≤ 10 |
| 046 | 1 `_` → every row's name contains `_` · 2 `%` → every row contains `%`, or the no-results message |
| 047 | 1 Egypt → every row's Country is Egypt · 2 Reset + Search → a row with another Country exists, paging if page 1 is all Egypt (**R-5**) |
| 048 | 1 (MK) Pending · 2 (ALL; Active count read first) Inactive: every row Inactive; RUN-NAME found by name search · 3 Both: total ≥ Active total + 1, and both statuses appear |
| 049 | 1 `zzqx` → no rows, the message |
| 050 | 1 list Country filter: option CI is not offered · 2 Add form Country: CI offered · 3 Cancel → list |
| 051 | precondition: Both total > 10, else `NOT RUN — TEST_DATA_UNAVAILABLE` (records are not created automatically — D-09 asks for confirmation first) · 1 10 rows, summary, Next enabled · 2 summary `Showing 11 to …`, Both still selected, no name repeated from page 1 · 3 the same 10 names in the same order |

## 5. Risks

- **R-1 — Permanent data on STG.** One full run creates about **31 permanent records**. Records
  cannot be deleted and names are never released. By status: Approved / Active ≈ 15, Pending ≈ 12,
  Rejected ≈ 4. RUN-001 left 28. The cases suggest deactivating leftovers afterwards, but no case
  step does that. **Proposed: the specs do no cleanup**, as RUN-001 did (Q-1).
- **R-2 — The default list grows** with every run: about 15 more Active Egypt records each time.
  This affects TC-52857-044 / -045 / -047 / -051. The assertions above use whole-set rules or names
  found by search, never "page 1 holds X".
- **R-3 — Role switching and sessions.** A case may switch accounts up to three times in one page.
  Each switch ends the session through the logout API first; the fixture ends the last one. Clearing
  storage alone left sessions open in Redis and hit STG's 15-session cap in RUN-008 (fixed, §7.1.3).
- **R-4 — Session expiry.** RUN-001 saw a 401 after about 3½ hours idle. Each spec signs in fresh,
  so this does not apply.
- **R-5 — TC-52857-047 step 2.** With many recent Egypt records, page 1 after Reset can be all
  Egypt. The spec pages forward, bounded by the total, to find another Country. This reads the
  expected result *"records bound to other countries are listed again"* as the whole result set,
  not page 1.
- **R-6 — TC-52857-019 / -050 preconditions** require confirming in the Country and Currency
  masters that CI and XI are still inactive. Those master pages were never explored, so **the
  specs do not perform that check**. If either record is ever activated, TC-52857-050 step 1 fails
  as a false product failure. Classify any such failure `TEST_DATA_ISSUE` and check the masters by
  hand.
- **R-7 — TC-52857-024** once reported a successful update that did not persist (RUN-001, cause
  unknown). The form actions type and Tab, which is the path that persisted. A recurrence fails
  step 3 and is reported as found.
- **R-8 — 32 Precondition cells read `#NAME?`** (TC-52857-004, -006, -008 … -043; known open item).
  The steps carry every setup these specs need. The originals still need restoring by a human. This
  skill never edits the CSV.
- **R-9 — No finite or lockout accounts.** No case burns an account. Order hazards: none; every spec
  creates its own records, and `workers: 1`.
- **R-10 — Unexplored DOM.** See *Exploration*. Expect some `TEST_SCRIPT_ISSUE` locator fixes on
  the first run.

## 6. Questions for the human

- **Q-1 — Cleanup.** Should specs leave their records as the steps leave them (proposed, as RUN-001
  did), or add a final deactivation that no Test Case step states?
- **Q-2 — TC-52857-044 step 3** (*"most recently changed first — practical check: the most recently
  created or changed record is the first row"*) is read-only, so a spec cannot know which record
  changed last. Options:
  - (a) Record the first row as an observation, and assert nothing. The ordering is asserted end to
    end by TC-52857-014 step 4 and TC-52857-023 step 4.
  - (b) Mark the case `NOT AUTOMATED — FRAMEWORK_CAPABILITY_MISSING`.

  Proposed: (a), stated in the report.
- **Q-3 — TC-52857-051.** Its Notes say *"Need Automation stays `No` … depends on the volume of
  shared data"*, but its Need Automation cell is **`Yes`**. The cell decides scope, so it is
  planned. This skill does not edit either value. Please confirm `Yes` is intended.
- **Q-4 — Framework additions** (§3): the `support/run-data.ts` file and observation annotations in
  the HTML report. Both are needed for the plan as written.
- **Q-5 — Authenticated exploration** was refused this session. Either:
  - approve generation with the locators above, and fix them on the first STG run; or
  - allow authenticated MCP exploration first. The login must then run in the MCP server from
    `.env`, and the denied permission must be granted.
