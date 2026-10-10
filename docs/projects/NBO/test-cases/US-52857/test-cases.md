# Test Cases — US 52857

| Provenance | Value |
|---|---|
| Work item | US 52857 — `[INT] Admin-Company-Operating Country "Q3-API-INTE-033"` |
| Requirement analysis | `docs/projects/NBO/requirements/US-52857/requirement-analysis.md` |
| Decisions | `docs/projects/NBO/requirements/US-52857/decisions.md` (D-01…D-17) |
| Source snapshot | `docs/projects/NBO/requirements/US-52857/source/operating-country-business-requirements-init.md` |
| Revision | 17 |
| Content fingerprint at generation | `bfa440e329745df499185b73b98afd85bde3e956f2d90c1902c8a23868719848` |
| Test case source | `test-cases.csv` beside this file — **the single source of truth** (`docs/product-decisions.md` §6.4). The cases below are rendered from it; edit the CSV, then `npm run testcases:render`. Migrated from Markdown-only on 2026-10-10 |
| Generated | 2026-10-09; revised 2026-10-10 for D-07…D-17 |
| Test scope | **Admin Panel UI only.** No standalone API test cases for this story (D-13); API testing of the Operating Country module in general is in scope elsewhere (D-15). Audit History is out of scope (D-14). |
| Target environment | STG Admin Panel (`APP_ENV=STG`, base URL from `APP_STG_ADMIN_URL`) |
| Case count | 51 — `TC-52857-052` was deleted by human decision D-10; its ID is retired and never reused |
| Published to Azure DevOps | Nothing yet |

---

## How to read this file

**Review/Lifecycle Status** (`docs/product-decisions.md` §6.1): `Draft` · `AI-Reviewed` (passed
the AI self-review, awaiting human review) · `Needs-Changes` · `Approved` (**human statement
only**) · `Published` · `Rejected`. Every case below is `AI-Reviewed`; none is approved.

**Need Automation** (`docs/product-decisions.md` §6.3): `Yes` / `No` — an **AI recommendation for
human review**, independent of the status. `Yes` is not approval. The value after human review
decides automation scope.

**Source of truth.** Where the current implementation was observed to differ from the story or
the specification, the implementation is expected (**D-01**). D-02…D-06 settle the role model,
reject remarks and currency mapping; D-11 and D-12 fix the inactive-country and duplicate-name
messages; D-07…D-09 and D-16…D-17 supply test data. Every expected result traces to the specification
(`REQ-OPC-*`), a decision (`D-*`) or a business rule in the analysis (`BR-*`, §6 there).

**Conventions the cases rely on**

- **Roles.** *All permissions* = `ADMIN_ALL` (edit right **and** approval authority). *Maker* =
  `OPERATING_COUNTRIES_MAKER`. *Approver* = `OPERATING_COUNTRIES_APPROVER` (decides, activates,
  deactivates; **cannot Add or Edit** — D-03). *View only* = `OPERATING_COUNTRIES_VIEW_ONLY`.
- **List page** = Admin Module › Operating Country. **Add form** = the *Add Operating Country*
  button. **Edit form** = a row's *Edit* link.
- **Unique names.** Every write case generates a fresh name at run time: `AUT Opc ` followed by 8
  random letters (letters and single spaces only — digits are invalid in a name). **Every created
  name contains `AUT`** (D-17); before using one, search the list (**Both** filter) to confirm no
  record already holds it — never reuse an existing name. It is written as **RUN-NAME** below; a
  second one in the same case is **RUN-NAME-2**. Record each in the execution results.
- **Country / Currency pair** for creation: **Egypt** / **Egyptian Pound** — confirmed valid on
  2026-10-10, when STG accepted it for four new records.
- **Send For Approval asks for confirmation.** A dialog *"Submit this operating country for
  approval?"* follows the button (observed 2026-10-10); confirming it is part of every
  *"…with Send For Approval"* step.
- **Record-then-assert.** A step reading *"record the exact text"* captures wording the sources do
  not fix (OQ-06 for an inactive currency or an unmapped pair, OQ-10 for dialogs, and success
  confirmations). The step passes whatever the wording is; it fails only when no feedback appears.
  The inactive-country and duplicate-name messages are decided (D-11, D-12) and asserted.
- **Settle** after every save, decision and search: wait for the list or the confirmation to
  render before judging the result.
- **Permanent side effects.** Records cannot be deleted and names are never released (REQ-OPC-010
  AC-6, REQ-OPC-030 AC-11). Each write case states what it leaves behind. **Cleanup:** any record a
  case leaves *Approved / Active* must be deactivated afterwards as `ADMIN_ALL`, so test markets
  do not appear in selection lists across the platform.

---

## Environment and test data prerequisites

| Handle | What it must be | Used by | Configured in STG |
|---|---|---|---|
| `ADMIN_ALL` | Account holding every Operating Country right | 006, 008, 010–014, 016–022, 025, 026, 036–038, 043–049 + setup in many | **Yes** |
| `OPERATING_COUNTRIES_MAKER` | View + Edit, no approval authority | 003, 009, 015, 018, 019, 023–025, 027–029, 035, 040 + setup | **Yes** |
| `OPERATING_COUNTRIES_APPROVER` | Approval authority, **no** Add/Edit (D-03) | 004, 005, 028, 030–034, 037, 039, 041, 042 | **Yes** |
| `OPERATING_COUNTRIES_VIEW_ONLY` | View right only | 001, 002 | **Yes** (validated 2026-10-09) |
| `OPC_USER_NO_MENU` | Account without the Operating Country menu right ("View Dashboard Only") | 007 | **Yes** (2026-10-10, D-07) |
| `OPC_COUNTRY_INACTIVE` | An inactive Country's name | 019, 050 | **Yes** (2026-10-10, D-08) — verified Inactive and Rejected; re-check before use |
| `OPC_CURRENCY_INACTIVE` | An inactive Currency's name | 019 | **Yes** (2026-10-10, D-08) — verified Inactive and Rejected; re-check before use |

**Practical constraints**

- On 2026-10-10 STG holds **11** Operating Countries: the 7 original *Approved / Active* markets
  and four *Pending / Inactive* pagination records `AUT Pagination Alpha … Delta` (D-09). Cases that
  need a *Rejected* or *Approved / Inactive* record still create it in their own steps.
- **Pagination (051)** needs more than 10 records under **Both** — satisfied by the seed data; 051
  creates only a shortfall, with `AUT` names.
- Never deactivate, reject or rename one of the 7 pre-existing records: they are live markets.
  Never change the status of the supplied inactive Country or Currency. Write cases act only on
  records they create.

---

## Coverage map

| Requirement | Test Cases |
|---|---|
| REQ-OPC-001 AC-4, REQ-OPC-015 (country/currency immutable) | 022 |
| REQ-OPC-002 (Add form access, fields, lists) | 008, 009, 019 |
| REQ-OPC-003 (create) | 010, 014, 015, 021 |
| REQ-OPC-004 (state at creation) | 014, 015 |
| REQ-OPC-006 (mandatory) | 009, 010, 026 |
| REQ-OPC-007 (length) | 011, 026 |
| REQ-OPC-008 (characters) | 012, 026 |
| REQ-OPC-009 (trim) | 016 |
| REQ-OPC-010 (uniqueness) | 017, 018, 025 |
| REQ-OPC-011 (edit self-exclusion) | 024, 025 |
| REQ-OPC-014 (Edit form) | 022, 023 |
| REQ-OPC-016 (update by role/state) | 023, 027, 028 |
| REQ-OPC-017 AC-1 (status from action) | 023, 027, 028, 030, 031, 036–038 |
| REQ-OPC-018 (remarks rules) | 013, 033 |
| REQ-OPC-019 (list) | 043, 044 |
| REQ-OPC-020 (search) | 045–050 (AC-5 site scoping: see *Deliberately not covered*) |
| REQ-OPC-021, 023 (default, order) | 014, 044, 051 |
| REQ-OPC-022 (pagination) | 044, 051 |
| REQ-OPC-024, 025 (maker–checker, no assigned approver) | 015, 030, 035 |
| REQ-OPC-026, 027 (approve / reject, remarks) | 030–034, 038 |
| REQ-OPC-030 (activate / deactivate) | 039–042 |
| REQ-OPC-037 (View All Branches — absent by D-01) | 003, 004, 006 |
| REQ-OPC-038 (menu gating) | 007 |
| REQ-OPC-039 (action matrix) | 001–006, 035–037, 042 |
| REQ-OPC-041 (data-entry feedback) | 010–013, 017 |
| REQ-OPC-042, 043 (messages, return to list) | 014, 015, 023, 030, 031 |
| REQ-OPC-045 (labels — implementation wording by D-01) | 043 |
| REQ-OPC-046 (direct decision) | 014, 036–038 |
| D-02 (Maker activates/deactivates, never decides) | 003, 035, 040 |
| D-03 (Approver cannot Add/Edit) | 004, 005 |
| D-04 (View-only account) | 001, 002 |
| D-05 (reject remarks follow the implementation) | 032 |
| D-06 (currency/country mapping follows the implementation) | 020 |
| D-07 (no-menu account) | 007 |
| D-08 (inactive Country / Currency) | 019, 050 |
| D-09, D-16, D-17 (pagination data, `AUT` names) | 051; naming convention for every write case |
| D-11 (inactive-country message) | 019 |
| D-12 (duplicate-name message) | 017, 018, 025 |

| Open question | Cases that record the answer |
|---|---|
| OQ-06 — message for an inactive **currency** or an unmapped pair (the inactive-country message is decided, D-11) | 019 step 3, 020 |
| ~~OQ-07 — duplicate-name message~~ | Closed by D-12 — asserted in 017, 018, 025 |
| OQ-10 — content of the decision and deactivation dialogs | 030, 031, 033, 039 |

---

## Deliberately not covered

| Requirement | Why | What would unblock it |
|---|---|---|
| REQ-OPC-012 (uniqueness re-checked at approval; rejection never blocked by it) | Defensive check: uniqueness is enforced at create and rename across every state, so no duplicate can reach approval through the UI (REQ-OPC-012 AC-5) | Seeded duplicate data, or API testing of the module (D-15) — not as a US-52857 case (D-13) |
| REQ-OPC-013, REQ-OPC-017 AC-2, REQ-OPC-039 AC-5/AC-6 (server-side enforcement, submitted status ignored, refused actions) | Only reachable by sending requests that bypass the UI. **No standalone API test cases for this story (D-13)**; API testing of the Operating Country module remains in scope elsewhere (D-15) | Module-level API testing (D-15) |
| REQ-OPC-022 AC-3, REQ-OPC-021 AC-3 (invalid or tampered paging values) | The UI never sends invalid paging values; no API cases for this story (D-13) | Module-level API testing (D-15) |
| REQ-OPC-017 AC-5, REQ-OPC-018 AC-7, REQ-OPC-026 AC-3 (audit history, decider identity, decision date) | **Out of scope for US-52857 (D-14).** No Audit History case is written | — |
| REQ-OPC-004 AC-4, REQ-OPC-046 AC-6 (Approved By = Created By) | System attribute not displayed; part of audit data, out of scope (D-14) | — |
| REQ-OPC-020 AC-5, REQ-OPC-010 AC-4 (search and uniqueness scoped by administrative site) | The only case covering it, TC-52857-052, was ruled invalid by the human and deleted (D-10). No replacement was requested | A human decision on whether site scoping is tested for this story |
| REQ-OPC-005 (no branch, agency, user or financial record created) | Observable only on Branch / Agency / Staff screens, which are out of scope | OQ-08 |
| REQ-OPC-029, 031, 033–036 (one list for every consumer, no cascade, hierarchy, Branch/Staff/rule dependencies) | Assertions about other features | OQ-08 |
| REQ-OPC-040 (Approver *user type* equivalent to the Approve right) | No Approver-type account exists, and D-03 changes what approval authority carries | An Approver-type account plus a decision on how D-03 applies to it |
| REQ-OPC-003 AC-3, REQ-OPC-016 AC-2 (system-failure messages) | Need an injected backend fault | A fault-injection facility in STG |
| REQ-OPC-020 AC-7 (inactive countries marked in search) | **Superseded by D-01** (BR-17): the search list holds active countries only, so there is nothing to mark. 050 asserts the implemented behaviour | — |

---

<!-- BEGIN GENERATED TEST CASES: rendered from test-cases.csv. Edit the CSV, then run `npm run testcases:render`. -->

## Operating Country Access

### TC-52857-001 — View-only user sees the list with no Add and no row actions

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Access] Verify a View-only user sees the Operating Country list with no Add button and no row actions` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Access |
| Test Type | Positive · Security · UI |
| Requirement Reference | REQ-OPC-039 AC-1, AC-2; story Access Control AC-2 |
| Decisions Applied | D-04 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- At least one Operating Country exists (STG has 7).

**Test Data**
- Account handle: `OPERATING_COUNTRIES_VIEW_ONLY`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `OPERATING_COUNTRIES_VIEW_ONLY` and open the Operating Country list page | The list loads with its filters and records |
| 2 | Look for the *Add Operating Country* button | The button is **not** shown |
| 3 | Inspect the Actions column of every row | No row offers any action — no Edit, Approve, Reject, Activate or Deactivate |
| 4 | Type `Egy` in the name filter and click Search | Matching records are listed — the View-only user can search |

---

### TC-52857-002 — View-only user cannot reach the Add or Edit form by URL

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Access] Verify a View-only user is kept off the Add and Edit forms when opening their URLs directly` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Access |
| Test Type | Negative · Security · UI |
| Requirement Reference | REQ-OPC-038 AC-1, REQ-OPC-039 AC-2 |
| Decisions Applied | D-04 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- The id of any existing Operating Country is known — take it from a row's Edit link while logged
  in as `ADMIN_ALL`.

**Test Data**
- Account handle: `OPERATING_COUNTRIES_VIEW_ONLY`
- Record id: any existing Operating Country id

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `OPERATING_COUNTRIES_VIEW_ONLY` and enter the Add form URL (`/admin/company/operating-country/add`) in the address bar | The user is returned to the Operating Country list; no Add form is shown |
| 2 | Enter the Edit URL of the known record (`/admin/company/operating-country/<id>`) | No editable form with a save, Approve or Reject action is available to the user. Record what is shown (redirect, read-only view or error) |

**Notes**
- Step 1 matches the behaviour observed on 2026-10-09. Step 2 was not observed; only the outcome
  (no way to change the record) is asserted, not how it is achieved.

---

### TC-52857-003 — Maker is offered Add, Edit and Deactivate but never Approve or Reject

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Access] Verify a Maker sees Add, and Edit plus Deactivate on an approved active row, with no Approve or Reject` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Access |
| Test Type | Positive · Security · UI |
| Requirement Reference | REQ-OPC-039 AC-1, AC-3; story Access Control AC-3 |
| Decisions Applied | D-02, D-01 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- At least one *Approved / Active* Operating Country exists (STG has 7).

**Test Data**
- Account handle: `OPERATING_COUNTRIES_MAKER`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `OPERATING_COUNTRIES_MAKER` and open the Operating Country list page | The *Add Operating Country* button is shown |
| 2 | Inspect the Actions column of an *Approved / Active* row | Exactly **Edit** and **Deactivate** are offered |
| 3 | Check the same row for Approve, Reject and View All Branches | None of them is offered |

---

### TC-52857-004 — Approver is offered Reject and Deactivate but no Add and no Edit

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Access] Verify an Approver sees no Add button and only Reject plus Deactivate on an approved active row` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Access |
| Test Type | Positive · Security · UI |
| Requirement Reference | REQ-OPC-039 AC-1; story Access Control AC-4 |
| Decisions Applied | D-03, D-01 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Account handle: `OPERATING_COUNTRIES_APPROVER`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `OPERATING_COUNTRIES_APPROVER` and open the Operating Country list page | The list loads; the *Add Operating Country* button is **not** shown |
| 2 | Inspect the Actions column of an *Approved / Active* row | Exactly **Reject** and **Deactivate** are offered |
| 3 | Check the same row for Edit and View All Branches | Neither is offered |

**Notes**
- D-03 overrides REQ-OPC-002 AC-5 / REQ-OPC-039 AC-1, which give approval authority the Add action.
  Seeing Add or Edit here is a FAIL against D-03.

---

### TC-52857-005 — Approver cannot reach the Add or Edit form by URL

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Access] Verify an Approver cannot create or amend a record when opening the Add and Edit URLs directly` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Access |
| Test Type | Negative · Security · UI |
| Requirement Reference | REQ-OPC-039 AC-5 |
| Decisions Applied | D-03 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- The id of any existing Operating Country is known (from a row's Edit link as `ADMIN_ALL`).

**Test Data**
- Account handle: `OPERATING_COUNTRIES_APPROVER`
- Record id: any existing Operating Country id

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `OPERATING_COUNTRIES_APPROVER` and enter the Add form URL directly | No Add form with a save action is available. Record what is shown (redirect, empty page or error) |
| 2 | Enter the Edit URL of the known record directly | No form allowing the name or remarks to be saved is available. Record what is shown |

**Notes**
- Not observed during analysis. **Do not submit anything** if a form does appear: record it and
  report the case FAIL against D-03, without creating data.

---

### TC-52857-006 — All-permission user is offered Add, Edit, Reject and Deactivate

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Access] Verify an all-permission user sees Add, and Edit plus Reject plus Deactivate on an approved active row` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Access |
| Test Type | Positive · UI |
| Requirement Reference | REQ-OPC-039 AC-1, REQ-OPC-037 |
| Decisions Applied | D-01 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Account handle: `ADMIN_ALL`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL` and open the Operating Country list page | The *Add Operating Country* button is shown |
| 2 | Inspect the Actions column of an *Approved / Active* row | Exactly **Edit**, **Reject** and **Deactivate** are offered |
| 3 | Check the row for View All Branches | Not offered (D-01, analysis C-16) |

---

### TC-52857-007 — User without the menu right cannot reach any Operating Country screen

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Access] Verify a user without the Operating Country menu right cannot see the menu entry or open the list, Add or Edit URLs` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Access |
| Test Type | Negative · Security · UI |
| Requirement Reference | REQ-OPC-038 AC-1, AC-3; story Access Control AC-1 |
| Decisions Applied | — |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- The account without the Operating Country menu right is configured as `OPC_USER_NO_MENU`
  (supplied by the human 2026-10-10, D-07). If it cannot log in, the case is BLOCKED /
  `AUTHENTICATION_ISSUE`, not FAIL.

**Test Data**
- Account handle: `OPC_USER_NO_MENU`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `OPC_USER_NO_MENU` and open the navigation menu | No Operating Country entry is present under Company |
| 2 | Enter the list URL (`/admin/company/operating-country`) directly | The Operating Country list is not displayed |
| 3 | Enter the Add URL (`/admin/company/operating-country/add`) directly | The Add form is not displayed |

---

## Add Operating Country

### TC-52857-008 — Add form for an all-permission user shows Remarks and only Approve

| | |
|---|---|
| **Title** | `[NBO][Company][Add Operating Country] Verify an all-permission user's Add form shows Name, Country, Currency and Remarks as required with only Cancel and Approve actions` |
| Project / Module / Feature-Page | NBO / Company / Add Operating Country |
| Test Type | Positive · UI |
| Requirement Reference | REQ-OPC-002 AC-2, AC-4; REQ-OPC-046 AC-1, AC-7 |
| Decisions Applied | D-01 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Account handle: `ADMIN_ALL`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL`, open the list page and click *Add Operating Country* | The *Add Operating Country* form opens |
| 2 | Inspect the fields | **Operating Country Name**, **Country**, **Currency** and **Remarks** are present, each marked *(required)* |
| 3 | Inspect the action buttons | Exactly **Cancel** and **Approve**; no *Send For Approval* |

---

### TC-52857-009 — Maker's Add form requires Remarks and offers only Send For Approval

| | |
|---|---|
| **Title** | `[NBO][Company][Add Operating Country] Verify a Maker's Add form requires Remarks, offers only Send For Approval and blocks an empty submission` |
| Project / Module / Feature-Page | NBO / Company / Add Operating Country |
| Test Type | Positive · Validation · UI |
| Requirement Reference | REQ-OPC-002 AC-1, AC-2; REQ-OPC-003 AC-7; REQ-OPC-006 |
| Decisions Applied | D-01, D-02 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Account handle: `OPERATING_COUNTRIES_MAKER`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `OPERATING_COUNTRIES_MAKER` and click *Add Operating Country* | The Add form opens |
| 2 | Inspect the fields | Name, Country, Currency **and Remarks** are present, each marked *(required)* |
| 3 | Inspect the action buttons | Exactly **Cancel** and **Send For Approval**; no Approve |
| 4 | Leave every field empty and click *Send For Approval* | Nothing is saved and the form stays open. Name shows *"Operating Country Name is required."*, Country *"Country is required."*, Currency *"Currency is required."*, and Remarks shows validation feedback |

**Notes**
- The specification hides Remarks from a Maker (REQ-OPC-003 AC-7). The implementation shows it
  as required, and D-01 makes that the expected behaviour (analysis C-13).
- The Remarks message text for a Maker was not observed; step 4 asserts only that feedback is shown.

---

### TC-52857-010 — Submitting an empty Add form shows a required message on every field

| | |
|---|---|
| **Title** | `[NBO][Company][Add Operating Country] Verify required-field messages appear for Name, Country, Currency and Remarks when an all-permission user clicks Approve on an empty form` |
| Project / Module / Feature-Page | NBO / Company / Add Operating Country |
| Test Type | Negative · Validation · UI |
| Requirement Reference | REQ-OPC-006 AC-1…AC-3; REQ-OPC-003 AC-2, AC-6; REQ-OPC-041 AC-1 |
| Decisions Applied | D-01 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Account handle: `ADMIN_ALL`
- All fields empty

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL` and open the Add form | The form opens with every field empty |
| 2 | Click **Approve** | Nothing is saved; the form stays open with a summary saying fields need attention |
| 3 | Read each field's message | Name: *"Operating Country Name is required."* · Country: *"Country is required."* · Currency: *"Currency is required."* · Remarks: *"Remarks is required."* |

**Notes**
- D-01 replaces the specification's texts (*"Operating Country Name Cannot Be Empty."*, *"Country
  Must Be Selected."*, *"Currency Must Be Selected."*, *"Required!"*) with the texts observed on STG
  (analysis C-03, C-04).

---

### TC-52857-011 — Name length is accepted from 3 to 100 characters and rejected outside

| | |
|---|---|
| **Title** | `[NBO][Company][Add Operating Country] Verify the Name accepts 3 and 100 characters and shows the length message for 2 and 101 characters` |
| Project / Module / Feature-Page | NBO / Company / Add Operating Country |
| Test Type | Boundary · Validation · UI |
| Requirement Reference | REQ-OPC-007 AC-1, AC-2, AC-5; REQ-OPC-041 AC-1 |
| Decisions Applied | D-01 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Account handle: `ADMIN_ALL`
- 2 characters: `Ab` · 3 characters: `Abc`
- 100 characters: `Abcdefghij` repeated 10 times · 101 characters: the same plus `K`
- 2 characters plus a trailing space: `Ab ` (3 typed, 2 after trimming)

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL` and open the Add form | The form opens |
| 2 | Type `Ab` in Name and press Tab | The field is flagged with *"Operating Country Name must be between 3 and 100 characters."* |
| 3 | Replace with `Abc` and press Tab | The field is not flagged invalid |
| 4 | Replace with the 100-character value and press Tab | The field is not flagged invalid |
| 5 | Replace with the 101-character value and press Tab | The field is flagged with the same length message |
| 6 | Replace with `Ab ` (trailing space) and press Tab | The field is flagged with the length message — length is measured after trimming (REQ-OPC-007 AC-5) |
| 7 | Click Cancel | The form closes; nothing is created |

**Notes**
- Two-sided boundary: 2 / 3 and 100 / 101.
- Step 6 asserts a specification rule that was not observed in the UI. If the UI accepts it, record
  that and report FAIL against REQ-OPC-007 AC-5. D-01 does not cover unobserved behaviour.
- During analysis a previous message sometimes stayed visible after a valid value was entered.
  Judge "not flagged invalid" by the field's invalid state and highlighting, not by stale text.
- **Flagged for human review (2026-10-10):** step 6 still depends on specification-only behaviour
  (trimmed length, REQ-OPC-007 AC-5) that has not been observed on STG.

---

### TC-52857-012 — Name character rules reject digits, symbols and bad spacing and accept the permitted set

| | |
|---|---|
| **Title** | `[NBO][Company][Add Operating Country] Verify the Name rejects digits, symbols, a leading space and double spaces and accepts letters, accents, hyphens, apostrophes and underscores` |
| Project / Module / Feature-Page | NBO / Company / Add Operating Country |
| Test Type | Negative · Validation · UI |
| Requirement Reference | REQ-OPC-008 AC-1, AC-3, AC-5; REQ-OPC-009 AC-3 |
| Decisions Applied | D-01 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Account handle: `ADMIN_ALL`
- Invalid: `1abc` (starts with a digit), `Abc1` (contains a digit), `Abc@Def` (symbol), ` Abcd` (leading space), `Ab  Cd` (two consecutive spaces)
- Valid: `Côte d'Ivoire`, `Guinea-Bissau`, `Trinidad and Tobago`, `Abc_Def`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL` and open the Add form | The form opens |
| 2 | Type `1abc` in Name and press Tab | Flagged with *"Operating Country Name may contain Latin letters only, joined by single spaces, apostrophes, hyphens or underscores."* |
| 3 | Replace with `Abc1`, press Tab | Flagged with the same message |
| 4 | Replace with `Abc@Def`, press Tab | Flagged with the same message |
| 5 | Replace with ` Abcd` (leading space), press Tab | Flagged with *"Operating Country Name may not start with a space or contain consecutive spaces."* |
| 6 | Replace with `Ab  Cd`, press Tab | The field is flagged invalid with a message. Record which message is shown |
| 7 | Enter each valid value in turn, pressing Tab after each | None is flagged invalid |
| 8 | Click Cancel | Nothing is created |

**Notes**
- The ban on consecutive spaces is an implementation rule beyond REQ-OPC-008; D-01 makes it expected
  (analysis C-06). On STG, `Ab  Cd` showed the "Latin letters" message rather than the
  "consecutive spaces" one — step 6 therefore asserts only that the field is flagged.
- Accented letters are accepted despite the message's wording "Latin letters only" (REQ-OPC-008 AC-5).

---

### TC-52857-013 — Remarks accept 250 characters and reject 251

| | |
|---|---|
| **Title** | `[NBO][Company][Add Operating Country] Verify Remarks accept 250 characters and show the 250-character message for 251 characters` |
| Project / Module / Feature-Page | NBO / Company / Add Operating Country |
| Test Type | Boundary · Validation · UI |
| Requirement Reference | REQ-OPC-018 AC-2, AC-3, AC-4 |
| Decisions Applied | D-01 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Account handle: `ADMIN_ALL`
- 250 characters: `R` × 250 · 251 characters: `R` × 251
- Free text with digits and symbols: `Ok 123 #$% (test)`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL` and open the Add form | The form opens |
| 2 | Type 250 characters in Remarks and press Tab | Not flagged invalid; the counter reads *250 / 250* |
| 3 | Add one character (251) and press Tab | Flagged with *"Remarks must not exceed 250 characters."*; the counter reads *251 / 250* |
| 4 | Replace with `Ok 123 #$% (test)` and press Tab | Not flagged invalid — no character rule applies to Remarks (REQ-OPC-018 AC-3) |
| 5 | Click Cancel | Nothing is created |

---

### TC-52857-014 — All-permission user creates an Operating Country that is immediately Approved and Active

| | |
|---|---|
| **Title** | `[NBO][Company][Add Operating Country] Verify a new Operating Country is Approved and Active at the top of the list when an all-permission user approves it on creation` |
| Project / Module / Feature-Page | NBO / Company / Add Operating Country |
| Test Type | Positive · State · UI |
| Requirement Reference | REQ-OPC-003 AC-1, AC-4, AC-6; REQ-OPC-004 AC-2; REQ-OPC-021 AC-1; REQ-OPC-023 AC-1; REQ-OPC-043 AC-3; REQ-OPC-046 AC-1 |
| Decisions Applied | D-06 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Account handle: `ADMIN_ALL`
- Name: RUN-NAME · Country: Egypt · Currency: Egyptian Pound · Remarks: `Created by QA`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL` and open the Add form | The form opens |
| 2 | Enter RUN-NAME, select Egypt and Egyptian Pound, enter the remarks | No field is flagged invalid |
| 3 | Click **Approve** | A success confirmation is displayed — record its exact text — and the user is returned to the Operating Country list |
| 4 | Look at the default list (Active filter, page 1) | RUN-NAME is the **first** row, with Country Egypt, Currency Egyptian Pound, Approval Status **Approved**, Status **Active** |

**Notes**
- **Leaves behind:** one *Approved / Active* record named RUN-NAME. Clean up by deactivating it as
  `ADMIN_ALL`.
- The specification's text is *"Operating Country Created Successfully."* (REQ-OPC-042 AC-1). Every
  message observed on STG differed from the specification and D-01 prefers the implementation, so
  step 3 records the text instead of asserting it.
- Egypt / Egyptian Pound is a valid pair: STG accepted it on 2026-10-10.

---

### TC-52857-015 — Maker's new Operating Country is Pending for Approval and Inactive

| | |
|---|---|
| **Title** | `[NBO][Company][Add Operating Country] Verify a Maker's new Operating Country is Pending for Approval and Inactive and appears only under the Inactive filter` |
| Project / Module / Feature-Page | NBO / Company / Add Operating Country |
| Test Type | Positive · State · UI |
| Requirement Reference | REQ-OPC-003 AC-1, AC-7; REQ-OPC-004 AC-1, AC-3; REQ-OPC-025 AC-1, AC-2; REQ-OPC-043 AC-3 |
| Decisions Applied | D-01, D-02 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Account handle: `OPERATING_COUNTRIES_MAKER`
- Name: RUN-NAME · Country: Egypt · Currency: Egyptian Pound · Remarks: `Please approve`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `OPERATING_COUNTRIES_MAKER`, open the Add form and fill in every field | No field is flagged invalid |
| 2 | Click **Send For Approval**, then confirm **Send For Approval** in the dialog | A dialog *"Submit this operating country for approval?"* asks for confirmation; after confirming, a success confirmation is displayed — record its exact text — and the list is shown |
| 3 | Search the default (Active) list by name RUN-NAME | RUN-NAME is **not** listed |
| 4 | Select the **Inactive** filter and search by RUN-NAME | RUN-NAME is listed with Approval Status **Pending for Approval** (record the exact label) and Status **Inactive** |

**Notes**
- **Leaves behind:** one *Pending / Inactive* record. It cannot be deleted; it does not appear in
  selection lists.
- Observed on STG 2026-10-10 while creating test data: the confirmation dialog, and the toast
  *"Operating Country sent for approval successfully"*. Recorded, not yet asserted.

---

### TC-52857-016 — Trailing space is removed from the saved name

| | |
|---|---|
| **Title** | `[NBO][Company][Add Operating Country] Verify the saved name has its trailing space removed when the name is entered with a trailing space` |
| Project / Module / Feature-Page | NBO / Company / Add Operating Country |
| Test Type | Validation · UI |
| Requirement Reference | REQ-OPC-009 AC-1; REQ-OPC-003 AC-5; story Creation AC-6 |
| Decisions Applied | — |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Account handle: `ADMIN_ALL`
- Name: RUN-NAME followed by one space · Country: Egypt · Currency: Egyptian Pound · Remarks: `Trim check`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL`, open the Add form, enter RUN-NAME with a trailing space and the other fields | The name is not flagged invalid |
| 2 | Click Approve | The record is created and the list is shown |
| 3 | Open the new record's Edit form and read the Name value and its character counter | The name equals RUN-NAME with no trailing space; the counter equals the length of RUN-NAME |
| 4 | Click Cancel | Nothing changes |

**Notes**
- **Leaves behind:** one *Approved / Active* record; deactivate it afterwards as `ADMIN_ALL`.

---

### TC-52857-017 — Duplicate name, in any letter case, is refused on create

| | |
|---|---|
| **Title** | `[NBO][Company][Add Operating Country] Verify creation is refused when the name matches an existing Operating Country exactly or in different letter case` |
| Project / Module / Feature-Page | NBO / Company / Add Operating Country |
| Test Type | Negative · Validation · UI |
| Requirement Reference | REQ-OPC-010 AC-1, AC-2, AC-5; REQ-OPC-041 AC-2 |
| Decisions Applied | D-01, D-12 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- A record named RUN-NAME exists. Create it in step 1.

**Test Data**
- Account handle: `ADMIN_ALL`
- RUN-NAME; the same name in lower case

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL` and create RUN-NAME (Egypt, Egyptian Pound, remarks) with Approve | RUN-NAME is created |
| 2 | Open the Add form, type RUN-NAME exactly, and press Tab | No duplicate message is shown on leaving the field (D-01) |
| 3 | Complete Country, Currency and Remarks and click Approve | The save is refused; the form stays open and the message *"Operating Country Already Exists."* is shown (D-12) |
| 4 | Change the name to RUN-NAME in lower case and click Approve | The save is refused and the message *"Operating Country Already Exists."* is shown (D-12) |
| 5 | Click Cancel and search the list for RUN-NAME (Both filter) | Exactly **one** record named RUN-NAME exists |

**Notes**
- The duplicate message is confirmed by the human (D-12, closes OQ-07).
- The specification asks for a duplicate check when leaving the field (REQ-OPC-041 AC-2). The
  implementation has none, and D-01 makes that expected (analysis C-08).
- **Leaves behind:** one *Approved / Active* record; deactivate it afterwards.

---

### TC-52857-018 — A name held by a Pending record cannot be reused

| | |
|---|---|
| **Title** | `[NBO][Company][Add Operating Country] Verify a name already held by a Pending for Approval record is refused when another record is created with it` |
| Project / Module / Feature-Page | NBO / Company / Add Operating Country |
| Test Type | Negative · State · UI |
| Requirement Reference | REQ-OPC-010 AC-6 |
| Decisions Applied | D-12 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- A *Pending* record named RUN-NAME exists. Create it in step 1.

**Test Data**
- Accounts: `OPERATING_COUNTRIES_MAKER`, `ADMIN_ALL`
- RUN-NAME

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME (Egypt, Egyptian Pound, remarks) with Send For Approval | RUN-NAME exists as *Pending / Inactive* |
| 2 | Log in as `ADMIN_ALL`, open the Add form, enter RUN-NAME with the other fields, and click Approve | The save is refused and the message *"Operating Country Already Exists."* is shown (D-12) |
| 3 | Search the list (Both filter) by RUN-NAME | Exactly one record, still *Pending / Inactive* |

**Notes**
- Uniqueness covers every approval and lifecycle state. Testing *Pending* is sufficient here:
  rejecting or deactivating first would add steps without exercising a different comparison.
- **Leaves behind:** one *Pending* record.

---

### TC-52857-019 — Inactive Country and Currency are offered but refused on save

| | |
|---|---|
| **Title** | `[NBO][Company][Add Operating Country] Verify an inactive Country or Currency is listed on the Add form and creation with it is refused, recording the message` |
| Project / Module / Feature-Page | NBO / Company / Add Operating Country |
| Test Type | Negative · Observation · UI |
| Requirement Reference | REQ-OPC-002 AC-3, AC-6 |
| Decisions Applied | D-01, D-08, D-11 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- The inactive Country `OPC_COUNTRY_INACTIVE` and inactive Currency `OPC_CURRENCY_INACTIVE` are
  configured (D-08). Before use, confirm in the Country and Currency masters that both are still
  inactive; if either has become active the case is BLOCKED / `TEST_DATA_ISSUE`. Never change
  their status.

**Test Data**
- Account handle: `ADMIN_ALL`
- `OPC_COUNTRY_INACTIVE`, `OPC_CURRENCY_INACTIVE`
- Names: RUN-NAME, RUN-NAME-2

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL`, open the Add form and open the Country list | The inactive Country is listed (the Add-form lists are unfiltered — D-01) |
| 2 | Enter RUN-NAME, select the inactive Country, Egyptian Pound and remarks, then click Approve | The record is **not** created and the message *"The selected country is not active."* is shown (D-11) |
| 3 | Enter RUN-NAME-2, select Egypt, the inactive Currency and remarks, then click Approve | The record is **not** created and an error is shown — record its exact text |
| 4 | Search the list (Both filter) for RUN-NAME and RUN-NAME-2 | Neither exists |

**Notes**
- The inactive-country message is confirmed by the human (D-11). The message for an inactive
  **currency** (step 3) is not decided — it is recorded, not asserted (OQ-06 stays open for it).
- Verified 2026-10-10 (read-only): both supplied records are Inactive **and Rejected**. A
  country that is Approved but Inactive was not available; if its behaviour matters, that needs
  other test data.
- The specification wants inactive entries hidden from the Add form (REQ-OPC-002 AC-3, AC-6).
  The UI lists them, the API documents a 409 refusal, and D-01 makes that combination expected
  (analysis C-11, BR-18).
- If a record **is** created, record it and report FAIL: the server is documented to refuse it.
  Deactivate it afterwards.

---

### TC-52857-020 — Currency list ignores the chosen Country; an unmapped pair's outcome is recorded

| | |
|---|---|
| **Title** | `[NBO][Company][Add Operating Country] Observe the result when a Currency not belonging to the chosen Country is selected and Approve is clicked` |
| Project / Module / Feature-Page | NBO / Company / Add Operating Country |
| Test Type | Observation · UI |
| Requirement Reference | REQ-OPC-001 AC-4 |
| Decisions Applied | D-06 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Account handle: `ADMIN_ALL`
- Name: RUN-NAME · Country: Egypt · Currency: Kuwaiti Dinar · Remarks: `Mapping check`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL`, open the Add form, select Country **Egypt** and open the Currency list | The list is **not** narrowed to Egypt — currencies such as Kuwaiti Dinar are offered (D-06, observed behaviour) |
| 2 | Enter RUN-NAME, select Kuwaiti Dinar and the remarks, then click Approve | **Observation only:** record whether the record is created or refused, and the exact message shown |
| 3 | If it was created, search the list for RUN-NAME and record its Country and Currency | Recorded |

**Notes**
- Observation-only for step 2: per D-06 the implementation decides, and which pairs the server
  treats as mapped is unknown. The API documents a 409 for an unmapped pair. This case fails only
  if no response or a crash occurs.
- Records the answer to the still-open part of **OQ-06** (the unmapped-pair message). D-11 decided
  only the inactive-country message.
- Egypt / Egyptian Pound is a valid pair: STG accepted it for four records on 2026-10-10.
- **May leave behind** one *Approved / Active* record with an unusual pair; deactivate it if created.

---

### TC-52857-021 — Cancelling the Add form creates nothing

| | |
|---|---|
| **Title** | `[NBO][Company][Add Operating Country] Verify no Operating Country is created when a filled Add form is cancelled` |
| Project / Module / Feature-Page | NBO / Company / Add Operating Country |
| Test Type | Negative · UI |
| Requirement Reference | REQ-OPC-046 AC-3 |
| Decisions Applied | — |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Account handle: `ADMIN_ALL`
- Name: RUN-NAME · Egypt · Egyptian Pound · Remarks: `Cancel check`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL`, open the Add form and fill in every field | No field is flagged invalid |
| 2 | Click **Cancel** (confirm leaving if asked) | The Operating Country list is shown |
| 3 | Search the list (Both filter) by RUN-NAME | No record named RUN-NAME exists |

---

## Edit Operating Country

### TC-52857-022 — Edit form shows current values with Country and Currency locked

| | |
|---|---|
| **Title** | `[NBO][Company][Edit Operating Country] Verify the Edit form pre-fills name and remarks, locks Country and Currency, and offers Cancel, Approve and Reject to an all-permission user` |
| Project / Module / Feature-Page | NBO / Company / Edit Operating Country |
| Test Type | Positive · UI |
| Requirement Reference | REQ-OPC-014 AC-1, AC-4; REQ-OPC-015 AC-1; REQ-OPC-046 AC-2 |
| Decisions Applied | D-01 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- Any *Approved / Active* record exists (read-only case — nothing is saved).

**Test Data**
- Account handle: `ADMIN_ALL`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL` and click **Edit** on an *Approved / Active* row | The *Edit Operating Country* form opens |
| 2 | Compare Name, Country and Currency with the row | All three match the row |
| 3 | Try to open the Country and Currency dropdowns | Both are disabled and cannot be changed |
| 4 | Inspect Remarks | Pre-filled with the stored remarks and editable |
| 5 | Inspect the actions | Exactly **Cancel**, **Approve** and **Reject** — no plain Update |
| 6 | Click Cancel | The list is shown; nothing changed |

---

### TC-52857-023 — Maker renames an Approved record and it stays Approved and Active

| | |
|---|---|
| **Title** | `[NBO][Company][Edit Operating Country] Verify an Approved Operating Country stays Approved and Active when a Maker renames it and clicks Update` |
| Project / Module / Feature-Page | NBO / Company / Edit Operating Country |
| Test Type | Positive · State · UI |
| Requirement Reference | REQ-OPC-016 AC-1, AC-4, AC-5; REQ-OPC-017 AC-1, AC-4; REQ-OPC-039 AC-4 |
| Decisions Applied | D-02 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- An *Approved / Active* record created by this case (step 1).

**Test Data**
- Accounts: `ADMIN_ALL` (setup), `OPERATING_COUNTRIES_MAKER`
- RUN-NAME (created), RUN-NAME-2 (new name)

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `ADMIN_ALL`, create RUN-NAME (Egypt, Egyptian Pound, remarks) with Approve | RUN-NAME is *Approved / Active* |
| 2 | Log in as `OPERATING_COUNTRIES_MAKER` and open RUN-NAME's Edit form | The actions are exactly **Cancel** and **Update** |
| 3 | Change the name to RUN-NAME-2, keep the remarks, and click Update | A success confirmation is displayed — record its exact text — and the list is shown |
| 4 | Find RUN-NAME-2 in the default (Active) list | Approval Status **Approved**, Status **Active**; it is the first row |

**Notes**
- **Leaves behind:** one *Approved / Active* record RUN-NAME-2; the name RUN-NAME stays consumed.
  Deactivate RUN-NAME-2 afterwards.

---

### TC-52857-024 — Saving without changing the name raises no duplicate error

| | |
|---|---|
| **Title** | `[NBO][Company][Edit Operating Country] Verify no duplicate error appears when a Maker updates only the Remarks and keeps the existing name` |
| Project / Module / Feature-Page | NBO / Company / Edit Operating Country |
| Test Type | Positive · Validation · UI |
| Requirement Reference | REQ-OPC-011 AC-1, AC-3; REQ-OPC-018 AC-6 |
| Decisions Applied | — |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Accounts: `ADMIN_ALL` (setup), `OPERATING_COUNTRIES_MAKER`
- RUN-NAME · new remarks: `Remarks updated by QA`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `ADMIN_ALL`, create RUN-NAME with Approve | Created, *Approved / Active* |
| 2 | As `OPERATING_COUNTRIES_MAKER`, open its Edit form, replace the remarks, leave the name unchanged, and click Update | The update is saved with no duplicate-name error; the list is shown |
| 3 | Reopen the Edit form | Name is unchanged; Remarks show `Remarks updated by QA` in full |

**Notes**
- **Leaves behind:** one *Approved / Active* record; deactivate it afterwards.

---

### TC-52857-025 — Renaming to another record's name is refused

| | |
|---|---|
| **Title** | `[NBO][Company][Edit Operating Country] Verify an update is refused when a Maker renames a record to another Operating Country's name in different letter case` |
| Project / Module / Feature-Page | NBO / Company / Edit Operating Country |
| Test Type | Negative · Validation · UI |
| Requirement Reference | REQ-OPC-010 AC-2; REQ-OPC-011 AC-2, AC-7; story Validation AC-4 |
| Decisions Applied | D-01, D-12 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Accounts: `ADMIN_ALL` (setup), `OPERATING_COUNTRIES_MAKER`
- RUN-NAME, RUN-NAME-2

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `ADMIN_ALL`, create RUN-NAME and RUN-NAME-2, both with Approve | Both exist |
| 2 | As `OPERATING_COUNTRIES_MAKER`, open RUN-NAME-2's Edit form, change the name to RUN-NAME in upper case, and click Update | The update is refused; the form stays open and the message *"Operating Country Already Exists."* is shown (D-12) |
| 3 | Click Cancel and search for RUN-NAME-2 | It still exists under its original name |

**Notes**
- The duplicate message is confirmed by the human (D-12, closes OQ-07). The legacy defect
  (duplicate saved through Edit — REQ-OPC-011 AC-4) is exactly what this case guards against.
- **Leaves behind:** two *Approved / Active* records; deactivate both afterwards.

---

### TC-52857-026 — Name validation applies on the Edit form

| | |
|---|---|
| **Title** | `[NBO][Company][Edit Operating Country] Verify the Edit form flags an empty, too-short or invalid-character name with the same messages as the Add form` |
| Project / Module / Feature-Page | NBO / Company / Edit Operating Country |
| Test Type | Negative · Validation · UI |
| Requirement Reference | REQ-OPC-016 AC-3; story Editing AC-6 |
| Decisions Applied | D-01 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- Any *Approved / Active* record (nothing is saved).

**Test Data**
- Account handle: `OPERATING_COUNTRIES_MAKER`
- Empty, `Ab`, `Abc1`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `OPERATING_COUNTRIES_MAKER` and open the Edit form of an *Approved / Active* record | The form opens |
| 2 | Clear the name and press Tab | Flagged with *"Operating Country Name is required."* |
| 3 | Enter `Ab`, press Tab | Flagged with *"Operating Country Name must be between 3 and 100 characters."* |
| 4 | Enter `Abc1`, press Tab | Flagged with *"Operating Country Name may contain Latin letters only, joined by single spaces, apostrophes, hyphens or underscores."* |
| 5 | Click Cancel | Nothing is saved; the record is unchanged |

**Notes**
- The texts were observed on the Add form; that the Edit form shares them is assumed from
  REQ-OPC-016 AC-3. A different but appropriate message on Edit is recorded, not failed.

---

### TC-52857-027 — Maker's update of a Pending record keeps it Pending

| | |
|---|---|
| **Title** | `[NBO][Company][Edit Operating Country] Verify a Pending for Approval record stays Pending and Inactive when a Maker updates it` |
| Project / Module / Feature-Page | NBO / Company / Edit Operating Country |
| Test Type | Positive · State · UI |
| Requirement Reference | REQ-OPC-016 AC-7; REQ-OPC-017 AC-1, AC-4; REQ-OPC-039 AC-1 |
| Decisions Applied | D-02 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Account handle: `OPERATING_COUNTRIES_MAKER`
- RUN-NAME, RUN-NAME-2

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* |
| 2 | Open RUN-NAME's Edit form (Inactive filter) | The form offers an update action and **no** Approve or Reject. Record the action names shown |
| 3 | Rename to RUN-NAME-2 and save with the update action | A success confirmation is displayed; the list is shown |
| 4 | Search the Inactive list for RUN-NAME-2 | Approval Status still *Pending for Approval*; Status **Inactive** |

**Notes**
- **Leaves behind:** one *Pending* record.

---

### TC-52857-028 — Maker's update of a Rejected record resubmits it as Pending

| | |
|---|---|
| **Title** | `[NBO][Company][Edit Operating Country] Verify a Rejected record returns to Pending for Approval and stays Inactive when a Maker amends it and sends it for approval` |
| Project / Module / Feature-Page | NBO / Company / Edit Operating Country |
| Test Type | Positive · State · UI |
| Requirement Reference | REQ-OPC-016 AC-6; REQ-OPC-017 AC-4; REQ-OPC-025 AC-4; REQ-OPC-039 AC-1 |
| Decisions Applied | D-02, D-03 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Accounts: `OPERATING_COUNTRIES_MAKER`, `OPERATING_COUNTRIES_APPROVER`
- RUN-NAME, RUN-NAME-2 · Reject remarks: `Rejected by QA`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, reject RUN-NAME from the list, giving the reject remarks | *Rejected / Inactive* |
| 3 | As `OPERATING_COUNTRIES_MAKER`, open RUN-NAME's Edit form | The only save action is **Send For Approval** (REQ-OPC-039 AC-1); no Approve or Reject |
| 4 | Rename to RUN-NAME-2 and click Send For Approval | A success confirmation is displayed |
| 5 | Search the Inactive list for RUN-NAME-2 | Approval Status *Pending for Approval*; Status **Inactive** |

**Notes**
- The Maker's actions on a *Rejected* record were not observed. Step 3 follows the specification
  matrix, which no decision overrides.
- **Leaves behind:** one *Pending* record.
- **Flagged for human review (2026-10-10):** step 3 still depends on the specification matrix for a
  Maker on a *Rejected* record, which has not been observed on STG.

---

### TC-52857-029 — Cancelling an edit leaves the record unchanged

| | |
|---|---|
| **Title** | `[NBO][Company][Edit Operating Country] Verify name and remarks stay unchanged when a Maker edits them and clicks Cancel` |
| Project / Module / Feature-Page | NBO / Company / Edit Operating Country |
| Test Type | Negative · UI |
| Requirement Reference | REQ-OPC-016 AC-5; REQ-OPC-017 AC-1 (Cancel) |
| Decisions Applied | — |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Accounts: `ADMIN_ALL` (setup), `OPERATING_COUNTRIES_MAKER`
- RUN-NAME, RUN-NAME-2

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `ADMIN_ALL`, create RUN-NAME with Approve and remarks `Original` | Created |
| 2 | As `OPERATING_COUNTRIES_MAKER`, open its Edit form, change the name to RUN-NAME-2 and the remarks to `Changed` | Fields show the new values |
| 3 | Click **Cancel** (confirm leaving if asked) | The list is shown |
| 4 | Reopen RUN-NAME's Edit form | Name RUN-NAME, remarks `Original`, still *Approved / Active* |

**Notes**
- **Leaves behind:** one *Approved / Active* record; deactivate it afterwards.

---

## Operating Country Approval

### TC-52857-030 — Approver approves a Pending record from the list

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Approval] Verify a Pending record becomes Approved and Active when an Approver approves it from the list with remarks` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Approval |
| Test Type | Positive · State · UI |
| Requirement Reference | REQ-OPC-025 AC-1; REQ-OPC-026 AC-1; REQ-OPC-027 AC-1; REQ-OPC-030 AC-1 |
| Decisions Applied | D-03 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Accounts: `OPERATING_COUNTRIES_MAKER`, `OPERATING_COUNTRIES_APPROVER`
- RUN-NAME · Approval remarks: `Approved by QA`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, find RUN-NAME (Inactive filter) and inspect its actions | **Approve** and **Reject** are offered; no Edit |
| 3 | Click **Approve** | A dialog asking for remarks is shown — record its title, fields and buttons |
| 4 | Enter the remarks and confirm | A success confirmation is displayed — record its exact text |
| 5 | Search the default (Active) list for RUN-NAME | Approval Status **Approved**, Status **Active** |

**Notes**
- Answers **OQ-10** for the approve dialog. The specification's confirmation is *"Operating Country
  Approved Successfully."* (REQ-OPC-026 AC-1); step 4 records the actual text.
- The record reached this Approver without being assigned to anyone (REQ-OPC-025 AC-1).
- **Leaves behind:** one *Approved / Active* record; deactivate it afterwards.

---

### TC-52857-031 — Approver rejects a Pending record from the list

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Approval] Verify a Pending record becomes Rejected and Inactive when an Approver rejects it from the list with remarks` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Approval |
| Test Type | Positive · State · UI |
| Requirement Reference | REQ-OPC-026 AC-2; REQ-OPC-030 AC-2 |
| Decisions Applied | D-03, D-05 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Accounts: `OPERATING_COUNTRIES_MAKER`, `OPERATING_COUNTRIES_APPROVER`
- RUN-NAME · Reject remarks: `Rejected by QA`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, click **Reject** on RUN-NAME | A reject dialog is shown — record its title, fields and buttons, and whether Remarks is marked required |
| 3 | Enter the remarks and confirm | A success confirmation is displayed — record its exact text |
| 4 | Search the Inactive list for RUN-NAME | Approval Status **Rejected**, Status **Inactive** |
| 5 | Search the default (Active) list for RUN-NAME | Not listed |

**Notes**
- Remarks are supplied, so this case holds whichever remarks rule applies (D-05). The no-remarks
  path is TC-52857-032.
- **Leaves behind:** one *Rejected* record.

---

### TC-52857-032 — Rejecting without remarks: the UI outcome is recorded

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Approval] Observe whether a Pending record can be rejected from the list when the Remarks field is left empty` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Approval |
| Test Type | Observation · UI |
| Requirement Reference | REQ-OPC-027 AC-2 |
| Decisions Applied | D-05 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Accounts: `OPERATING_COUNTRIES_MAKER`, `OPERATING_COUNTRIES_APPROVER`
- RUN-NAME · Remarks left empty

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, click **Reject** on RUN-NAME, leave Remarks empty, and confirm | **Observation only:** record whether the rejection is blocked (and the exact message) or recorded |
| 3 | Search the list (Both filter) for RUN-NAME | Record its Approval Status and Status |

**Notes**
- **Nothing is asserted about the outcome.** D-05 makes the implementation the source of truth,
  and the implementation is split: `PATCH …/approval-status` requires remarks, `PUT …/{id}` with
  reject does not. The list dialog has not been seen, so its rule is unknown. Fails only on a crash
  or no response.
- **Leaves behind:** one *Pending* or *Rejected* record.

---

### TC-52857-033 — Approval without remarks or with over-long remarks is blocked

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Approval] Verify an Approver cannot approve a Pending record when Remarks are empty or longer than 250 characters` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Approval |
| Test Type | Negative · Validation · UI |
| Requirement Reference | REQ-OPC-027 AC-2, AC-5; REQ-OPC-018 AC-1, AC-2 |
| Decisions Applied | D-01 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Accounts: `OPERATING_COUNTRIES_MAKER`, `OPERATING_COUNTRIES_APPROVER`
- RUN-NAME · Remarks: empty, then `R` × 251

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, click **Approve** on RUN-NAME, leave Remarks empty, and confirm | The approval is not recorded; validation feedback is shown for Remarks — record its exact text |
| 3 | Enter 251 characters in Remarks and confirm | The approval is not recorded; validation feedback is shown — record its exact text |
| 4 | Cancel the dialog and search the Inactive list for RUN-NAME | Still *Pending for Approval / Inactive* |

**Notes**
- Approval remarks are mandatory in every source (specification, both API routes), so this is
  asserted. Only the wording is recorded: the dialog was not observed (OQ-10).
- **Leaves behind:** one *Pending* record.

---

### TC-52857-034 — Cancelling a decision leaves the record unchanged

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Approval] Verify a Pending record stays Pending when an Approver opens the Approve dialog, enters remarks and cancels` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Approval |
| Test Type | Negative · UI |
| Requirement Reference | REQ-OPC-026 AC-5; REQ-OPC-027 AC-4; REQ-OPC-046 AC-3 |
| Decisions Applied | — |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Accounts: `OPERATING_COUNTRIES_MAKER`, `OPERATING_COUNTRIES_APPROVER`
- RUN-NAME · Remarks: `Will be cancelled`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, click **Approve** on RUN-NAME, enter the remarks, then cancel the dialog | The dialog closes; no confirmation is shown |
| 3 | Search the Inactive list for RUN-NAME | Still *Pending for Approval / Inactive* |

**Notes**
- **Leaves behind:** one *Pending* record.

---

### TC-52857-035 — Maker is never offered Approve or Reject on a Pending record

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Approval] Verify a Maker sees no Approve or Reject on a Pending record in the list or on its Edit form` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Approval |
| Test Type | Negative · Security · UI |
| Requirement Reference | REQ-OPC-039 AC-3; REQ-OPC-046 AC-8; story Access Control AC-7 |
| Decisions Applied | D-02 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Account handle: `OPERATING_COUNTRIES_MAKER`
- RUN-NAME

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* |
| 2 | Find RUN-NAME in the Inactive list and inspect its row actions | No Approve and no Reject. Record the actions that are offered |
| 3 | Open RUN-NAME's Edit form and inspect its actions | No Approve and no Reject |

**Notes**
- The Maker's row actions on a *Pending* record were not observed. Only the absence of decision
  actions is asserted (D-02).
- **Leaves behind:** one *Pending* record.

---

### TC-52857-036 — All-permission user approves a Pending record from its Edit form

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Approval] Verify a Pending record becomes Approved and Active when an all-permission user approves it from the Edit form` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Approval |
| Test Type | Positive · State · UI |
| Requirement Reference | REQ-OPC-046 AC-2 (Pending), AC-5; REQ-OPC-016 AC-8 |
| Decisions Applied | — |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Accounts: `OPERATING_COUNTRIES_MAKER`, `ADMIN_ALL`
- RUN-NAME · Remarks: `Approved in edit`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* |
| 2 | As `ADMIN_ALL`, open RUN-NAME's Edit form | The actions are **Approve** and **Reject** (and Cancel); no Send For Approval |
| 3 | Replace the remarks and click **Approve** | A success confirmation is displayed — record its exact text |
| 4 | Search the default (Active) list for RUN-NAME | **Approved / Active** |

**Notes**
- **Leaves behind:** one *Approved / Active* record; deactivate it afterwards.

---

### TC-52857-037 — A Rejected record's Edit form offers Approve and Reject to an all-permission user

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Approval] Verify a Rejected record's Edit form offers Cancel, Approve and Reject to an all-permission user and approving it makes it Approved and Active` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Approval |
| Test Type | Positive · State · UI |
| Requirement Reference | REQ-OPC-046 AC-2 (Rejected); REQ-OPC-026 AC-4; REQ-OPC-039 AC-1 |
| Decisions Applied | D-03, D-19 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Accounts: `OPERATING_COUNTRIES_MAKER`, `OPERATING_COUNTRIES_APPROVER`, `ADMIN_ALL`
- RUN-NAME · Reject remarks `Rejected by QA` · Approve remarks `Re-approved by QA`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, reject RUN-NAME with the reject remarks | *Rejected / Inactive* |
| 3 | As `ADMIN_ALL`, open RUN-NAME's Edit form | The actions are exactly **Cancel**, **Approve** and **Reject** (D-19) |
| 4 | Check the Remarks field | Pre-filled with `Rejected by QA` (REQ-OPC-018 AC-5) |
| 5 | Replace the remarks and click Approve | A success confirmation is displayed |
| 6 | Search the default list for RUN-NAME | **Approved / Active** |

**Notes**
- **D-19** (human, 2026-10-10) replaces the specification's *Approve / Cancel* for a *Rejected*
  record (REQ-OPC-046 AC-2): the all-permission Edit form also offers **Reject**. What Reject does
  on an already *Rejected* record is not decided and not asserted.
- RUN-001 recorded step 3 as FAIL against the earlier expectation (exactly Approve and Cancel);
  its Bug Candidate BUG-002 was resolved by the human as **not a bug**.
- **Leaves behind:** one *Approved / Active* record; deactivate it afterwards.

---

### TC-52857-038 — All-permission user rejects an Approved record

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Approval] Verify an Approved record becomes Rejected and Inactive and leaves the default list when an all-permission user rejects it` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Approval |
| Test Type | Positive · State · UI |
| Requirement Reference | REQ-OPC-026 AC-2, AC-4; REQ-OPC-046 AC-2 (Approved) |
| Decisions Applied | D-05 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Account handle: `ADMIN_ALL`
- RUN-NAME · Reject remarks: `Withdrawn by QA`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `ADMIN_ALL`, create RUN-NAME with Approve | *Approved / Active* |
| 2 | Click **Reject** on RUN-NAME's row, enter the remarks, and confirm | A success confirmation is displayed — record its exact text |
| 3 | Search the default (Active) list for RUN-NAME | Not listed |
| 4 | Search the Inactive list for RUN-NAME | **Rejected / Inactive** |

**Notes**
- **Leaves behind:** one *Rejected* record — already out of every selection list; no cleanup needed.

---

## Operating Country Status

### TC-52857-039 — Approver deactivates after confirming, then reactivates

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Status] Verify an Approver's confirmed deactivation makes the record Inactive and a confirmed Activate restores it to Active` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Status |
| Test Type | Positive · State · UI |
| Requirement Reference | REQ-OPC-030 AC-4, AC-5, AC-7, AC-8, AC-9, AC-10; story Lifecycle AC-3…AC-5 |
| Decisions Applied | D-02, D-18 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Accounts: `ADMIN_ALL` (setup), `OPERATING_COUNTRIES_APPROVER`
- RUN-NAME

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `ADMIN_ALL`, create RUN-NAME with Approve | *Approved / Active* |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, click **Deactivate** on RUN-NAME | A confirmation is requested before anything changes — record the full warning text |
| 3 | Confirm | A result message is shown — record its text |
| 4 | Search the default (Active) list for RUN-NAME | Not listed |
| 5 | Search the Inactive list for RUN-NAME | Approval Status **Approved**, Status **Inactive**; an **Activate** action is offered |
| 6 | Click **Activate**, then confirm the activation | A confirmation is requested before anything changes (D-18); once it is confirmed, the record becomes Active |
| 7 | Search the default list for RUN-NAME | **Approved / Active** |

**Notes**
- Answers **OQ-10** for the deactivation warning. REQ-OPC-030 AC-8 describes its content; its
  wording is recorded, not asserted.
- **D-18** (human, 2026-10-10) replaces the specification's *activation needs no confirmation*
  (REQ-OPC-030 AC-10): Activate asks for a confirmation, like Deactivate.
- RUN-001 recorded step 6 as FAIL against the earlier expectation (no confirmation); its Bug
  Candidate BUG-001 was resolved by the human as **not a bug**.
- **Leaves behind:** one *Approved / Active* record; deactivate it afterwards.

---

### TC-52857-040 — Maker deactivates and reactivates an Approved record

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Status] Verify a Maker can deactivate an Approved record to Inactive and activate it back to Active` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Status |
| Test Type | Positive · State · Security · UI |
| Requirement Reference | REQ-OPC-030 AC-4 |
| Decisions Applied | D-02 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Accounts: `ADMIN_ALL` (setup), `OPERATING_COUNTRIES_MAKER`
- RUN-NAME

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `ADMIN_ALL`, create RUN-NAME with Approve | *Approved / Active* |
| 2 | As `OPERATING_COUNTRIES_MAKER`, click **Deactivate** on RUN-NAME and confirm | The deactivation succeeds — no permission error |
| 3 | Search the Inactive list for RUN-NAME | **Approved / Inactive**; **Activate** is offered to the Maker |
| 4 | Click **Activate** | The activation succeeds |
| 5 | Search the default list for RUN-NAME | **Approved / Active** |

**Notes**
- **D-02 overrides** REQ-OPC-030 AC-5/AC-6 and the Swagger for `PATCH …/status`, both of which
  reserve this action for approval authority. A server refusal here is a FAIL against D-02.
- **Leaves behind:** one *Approved / Active* record; deactivate it afterwards.

---

### TC-52857-041 — Cancelling the deactivation confirmation changes nothing

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Status] Verify an Approved record stays Active when Deactivate is clicked and the confirmation is cancelled` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Status |
| Test Type | Negative · UI |
| Requirement Reference | REQ-OPC-030 AC-9; story Lifecycle AC-5 |
| Decisions Applied | — |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Accounts: `ADMIN_ALL` (setup), `OPERATING_COUNTRIES_APPROVER`
- RUN-NAME

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `ADMIN_ALL`, create RUN-NAME with Approve | *Approved / Active* |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, click **Deactivate** on RUN-NAME, then cancel the confirmation | The confirmation closes |
| 3 | Search the default list for RUN-NAME | Still **Approved / Active** |

**Notes**
- **Leaves behind:** one *Approved / Active* record; deactivate it afterwards.

---

### TC-52857-042 — Activate is not offered on Pending or Rejected records

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country Status] Verify no Activate action is offered on a Pending or a Rejected record to any role` |
| Project / Module / Feature-Page | NBO / Company / Operating Country Status |
| Test Type | Negative · State · UI |
| Requirement Reference | REQ-OPC-030 AC-5, AC-6; story Lifecycle AC-2 |
| Decisions Applied | D-02 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Accounts: `OPERATING_COUNTRIES_MAKER`, `OPERATING_COUNTRIES_APPROVER`, `ADMIN_ALL`
- RUN-NAME (stays Pending), RUN-NAME-2 (rejected)

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME and RUN-NAME-2 with Send For Approval | Both *Pending / Inactive* |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, reject RUN-NAME-2 with remarks | RUN-NAME-2 *Rejected / Inactive* |
| 3 | In the Inactive list, inspect both rows as `OPERATING_COUNTRIES_APPROVER` | Neither row offers **Activate** |
| 4 | Repeat as `OPERATING_COUNTRIES_MAKER` and as `ADMIN_ALL` | Neither row offers **Activate** to either role |

**Notes**
- Only *Approved* records may be activated, whoever acts (REQ-OPC-030 AC-5; D-02 widens *who*, not
  *which records*). The API documents a 409 for activating a non-approved record.
- **Leaves behind:** one *Pending* and one *Rejected* record.

---

## Operating Country List

### TC-52857-043 — List page heading and column labels

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country List] Verify the list page shows the Operating Country heading and the Name, Country, Currency, Approval Status, Status and Actions columns` |
| Project / Module / Feature-Page | NBO / Company / Operating Country List |
| Test Type | Positive · UI |
| Requirement Reference | REQ-OPC-019 AC-1, AC-4; REQ-OPC-045 |
| Decisions Applied | D-01 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
#NAME?

**Test Data**
- Account handle: `ADMIN_ALL`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL` and open the list page | The page heading reads **Operating Country** |
| 2 | Read the column headings | **Name**, **Country**, **Currency**, **Approval Status**, **Status**, **Actions** |
| 3 | Read the filter labels | **Operating Country Name**, **Country**, and the Active / Inactive / Both toggle |

**Notes**
- D-01 replaces the specification's "Operating Country (POS)" labels with the implementation's
  wording (analysis C-01, C-02).

---

### TC-52857-044 — Default list shows Active records, 10 per page, newest first, with totals

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country List] Verify the list opens on Active records, 10 rows per page, page 1, ordered by last change, with the record count shown` |
| Project / Module / Feature-Page | NBO / Company / Operating Country List |
| Test Type | Positive · UI |
| Requirement Reference | REQ-OPC-021 AC-1; REQ-OPC-022 AC-1, AC-4; REQ-OPC-023 AC-1; REQ-OPC-019 AC-3 |
| Decisions Applied | D-01 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- None (read-only).

**Test Data**
- Account handle: `ADMIN_ALL`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL` and open the list page | The **Active** toggle is selected; every row's Status is **Active** |
| 2 | Inspect the pagination area | Rows per page is **10**; page **1** is current; a *"Showing x to y of z"* summary and a record count are shown |
| 3 | Open each record's Edit form in turn, or compare with a record just changed | Rows are ordered most recently changed first. **Practical check:** the most recently created or changed record is the first row |

**Notes**
- Ordering is checked end to end by TC-52857-014 (a new record lands at the top). Step 3 is the
  read-only form of the same check.

---

### TC-52857-045 — Name search matches part of a name regardless of letter case

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country List] Verify searching by part of a name in any letter case lists every Operating Country containing it` |
| Project / Module / Feature-Page | NBO / Company / Operating Country List |
| Test Type | Positive · UI |
| Requirement Reference | REQ-OPC-020 AC-1; story Listing AC-2 |
| Decisions Applied | — |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- Records whose names contain "gyp" exist (STG: Egypt, EgyptWTNBO, Egypt_WT_NBO).

**Test Data**
- Account handle: `ADMIN_ALL`
- Search value: `GYP`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL`, type `GYP` in the name filter and click Search | Every Active record whose name contains "gyp" in any case is listed, and only those |
| 2 | Read the record count | It equals the number of rows listed |

---

### TC-52857-046 — Underscore and percent in the search are matched literally

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country List] Verify searching for an underscore or a percent sign returns only names that actually contain that character` |
| Project / Module / Feature-Page | NBO / Company / Operating Country List |
| Test Type | Negative · Security · UI |
| Requirement Reference | REQ-OPC-020 AC-6 |
| Decisions Applied | — |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- At least one Active record name contains `_` (STG: Egypt_WT_NBO), and at least one does not.

**Test Data**
- Account handle: `ADMIN_ALL`
- Search values: `_` and `%`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL`, search for `_` | Only names containing an underscore are listed |
| 2 | Search for `%` | Only names containing `%` are listed — none on STG today, so the "no results" state is shown |

**Notes**
- If `_` or `%` acted as a wildcard, every record would be returned (the legacy defect, REQ-OPC-020 AC-6).

---

### TC-52857-047 — Country filter lists only records bound to that Country

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country List] Verify choosing a Country in the filter lists only the Operating Countries bound to that Country` |
| Project / Module / Feature-Page | NBO / Company / Operating Country List |
| Test Type | Positive · UI |
| Requirement Reference | REQ-OPC-020 AC-2 |
| Decisions Applied | — |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- Records bound to Egypt and to other countries exist (STG: yes).

**Test Data**
- Account handle: `ADMIN_ALL`
- Country: Egypt

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL`, select **Egypt** in the Country filter and click Search | Every listed row shows Country **Egypt** |
| 2 | Click Reset and Search | Records bound to other countries are listed again |

---

### TC-52857-048 — Lifecycle filter shows Inactive and Both correctly

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country List] Verify the Inactive filter lists only Inactive records and Both lists Active and Inactive records together` |
| Project / Module / Feature-Page | NBO / Company / Operating Country List |
| Test Type | Positive · UI |
| Requirement Reference | REQ-OPC-020 AC-3 |
| Decisions Applied | D-01 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- At least one Inactive record exists. Create one in step 1.

**Test Data**
- Account handle: `OPERATING_COUNTRIES_MAKER`, then `ADMIN_ALL`
- RUN-NAME

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | A *Pending / Inactive* record exists |
| 2 | As `ADMIN_ALL`, select **Inactive** and click Search | Every listed row's Status is **Inactive**; RUN-NAME is included |
| 3 | Select **Both** and click Search | Active and Inactive rows are both listed; the count is at least the Active count plus one |

**Notes**
- "Both" is an implementation option beyond REQ-OPC-020 AC-3; D-01 makes it expected.
- **Leaves behind:** one *Pending* record.

---

### TC-52857-049 — A search with no matches shows the no-results message

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country List] Verify the no-results message appears when the name search matches no Operating Country` |
| Project / Module / Feature-Page | NBO / Company / Operating Country List |
| Test Type | Negative · UI |
| Requirement Reference | REQ-OPC-020 AC-4; REQ-OPC-042 AC-5 |
| Decisions Applied | D-01 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- No record name contains `zzqx`.

**Test Data**
- Account handle: `ADMIN_ALL`
- Search value: `zzqx`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL`, type `zzqx` in the name filter and click Search | No rows; the message *"No operating countries match these filters"* is shown |

**Notes**
- D-01 replaces the specification's *"No Operating Country found. Please try again."* with the text
  observed on STG (analysis C-09).

---

### TC-52857-050 — The search Country filter offers active Countries only

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country List] Verify an inactive Country is absent from the list page's Country filter while it is offered on the Add form` |
| Project / Module / Feature-Page | NBO / Company / Operating Country List |
| Test Type | Positive · UI |
| Requirement Reference | REQ-OPC-020 AC-7 |
| Decisions Applied | D-01, D-08 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- The inactive Country `OPC_COUNTRY_INACTIVE` is configured (D-08). Before use, confirm in the
  Country master that it is still inactive; if it has become active the case is BLOCKED /
  `TEST_DATA_ISSUE`. Never change its status.

**Test Data**
- Account handle: `ADMIN_ALL`
- `OPC_COUNTRY_INACTIVE`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL`, open the list page's Country filter and type the inactive Country's name | It is **not** offered |
| 2 | Open the Add form's Country list and type the same name | It **is** offered (contrast — the Add form lists are unfiltered) |
| 3 | Click Cancel | Nothing is created |

**Notes**
- D-01 reverses the specification, which wants the search list unrestricted with inactive entries
  marked and the Add list active-only (analysis C-10, C-11).

---

### TC-52857-051 — Pagination keeps the search criteria and continues the order across pages

| | |
|---|---|
| **Title** | `[NBO][Company][Operating Country List] Verify moving to page 2 keeps the search criteria and continues the most-recent-first order from page 1` |
| Project / Module / Feature-Page | NBO / Company / Operating Country List |
| Test Type | Positive · UI |
| Requirement Reference | REQ-OPC-022 AC-1, AC-2, AC-4; REQ-OPC-023 AC-2, AC-3 |
| Decisions Applied | D-09, D-16, D-17 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- More than 10 records match the **Both** filter. On 2026-10-10 STG had 11, including four
  *Pending / Inactive* records named `AUT Pagination Alpha`, `Bravo`, `Charlie`, `Delta` (D-09).
- If fewer than 11 match: as `OPERATING_COUNTRIES_MAKER`, create the shortfall with Send For
  Approval (Egypt / Egyptian Pound), each with a unique name containing `AUT` that no existing
  record uses (D-17). Pending records never appear in selection lists. Records cannot be deleted.

**Test Data**
- Account handle: `ADMIN_ALL`
- Only if records must be created: `OPERATING_COUNTRIES_MAKER`, names `AUT Pagination <word>`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in as `ADMIN_ALL`, select **Both** and click Search | Page 1 shows 10 rows; the summary shows the total and Next is enabled |
| 2 | Click **Next Page** | Page 2 is current; the **Both** filter is still applied; rows continue the order from page 1, with no row repeated |
| 3 | Click **First Page** | Page 1 shows the same 10 rows as before |

**Notes**
- Creates records only when fewer than 11 match, and then only the shortfall (D-09).
- Need Automation stays `No` as recorded: the case still depends on the volume of shared data.

---

## Rejected test cases

None. A case the human rejects moves here with status `Rejected` and keeps its original ID, which is never
reused (`docs/product-decisions.md` §6.1).

<!-- END GENERATED TEST CASES -->


---

## AI self-review record

**Reviewed:** 2026-10-09, as a Senior QA Engineer, against the analysis (§3–§16), decisions
D-01…D-06 and the source snapshot.

### What was checked

- **Coverage.** Every row of the analysis's coverage map (§14) maps to a case or to *Deliberately
  not covered*. Every story AC group — Creation, Validation, Editing, Listing, Approval, Lifecycle,
  Hierarchy, Access, Messaging, Naming — is accounted for. Hierarchy goes to *not covered* (OQ-08).
- **Decision overrides.** Each case where a decision overrides the specification was re-checked
  against the decision text, not the specification: D-02 in 003, 035 and 040; D-03 in 004, 005 and
  037; D-01 messages in 010, 011, 012, 026 and 049; D-01 labels in 043; D-01 lists in 019 and 050.
- **Invented content.** Every quoted message is either a D-01 text observed on STG (analysis §5) or
  is recorded rather than asserted. No limit or rule beyond the source and the decisions.
- **Undecided behaviour.** OQ-06, OQ-07 and OQ-10 wording, D-05's UI outcome and D-06's server
  outcome are recorded, never asserted. 020 and 032 are observation-only.
- **Independence.** Every write case creates its own records with run-time names. No case uses
  another's residue or touches the 7 live records.
- **Observability.** No assertion on audit data, decider identity or Approved By = Created By —
  none is displayed.
- **Boundaries.** Two-sided: name 2/3 and 100/101; remarks 250/251.
- **Secrets.** No credential, username or URL host. Accounts by handle; every handle used in Test
  Data is declared in the profile.

### Corrections the review produced

1. **Spec success texts demoted to recorded.** The draft of 014, 015, 023, 030 and 031 asserted the
   specification's success confirmations. Every message actually observed on STG differed from the
   specification, so asserting unobserved specification text would very likely produce false FAILs
   that D-01 would then overrule. The cases now record the text, and the Notes give the
   specification wording.
2. **Consecutive-space message softened (012 step 6).** The draft asserted the "consecutive spaces"
   message for `Ab  Cd`. The analysis shows STG returned the "Latin letters only" message for that
   input. The step now asserts only that the field is flagged, and records the text.
3. **Approver Edit removed from 030/031.** The draft decided via the Edit form; D-03 gives the
   Approver no Edit, so decisions now go through list actions. Edit-form decisions moved to
   `ADMIN_ALL` (036, 037).
4. **Merged duplicates.** Separate draft cases for the View-only Add URL and Edit URL became 002.
   Exact-name and different-case duplicates became 017. Separate approve-empty and approve-too-long
   cases became 033.
5. **Dropped as unreachable.** Approval-time re-check and the "rejection never blocked" rule
   (REQ-OPC-012) cannot be reached through the UI; they moved to *not covered* with the reason.
6. **Trim-before-length (011 step 6)** kept as an assertion despite being unobserved. D-01 does not
   override unobserved behaviour, and the specification is explicit (REQ-OPC-007 AC-5). Noted in
   the case.
7. **Cleanup made explicit.** Approved test markets would appear in selection lists across the
   platform, so every case leaving one says to deactivate it afterwards.

### Known limitations

- **UI only, by decision.** Server-side enforcement, ignored submitted status and invalid paging
  (REQ-OPC-013, 017 AC-2, 022 AC-3, 039 AC-5) have no case here: no standalone API test cases for
  this story (D-13); they belong to module-level API testing (D-15).
- **Flagged for human review — specification-only expectations.** TC-52857-011 step 6 (length
  measured after trimming) and TC-52857-028 step 3 (Maker's actions on a *Rejected* record) still
  assert specification behaviour that has not been observed on STG.
- **Site scoping is uncovered.** TC-52857-052 was deleted by the human (D-10) and nothing replaces it.
- **Every write case consumes names permanently** and adds records to shared STG. A full run adds
  about 40 records and uses about 50 names.
- **Specification matrix used where unobserved.** The Maker's actions on *Rejected* records (028)
  and the action sets on *Pending* records (027, 030, 035, 036) were never seen on STG. They follow
  REQ-OPC-039, which no decision overrides; an execution showing otherwise needs human review
  against D-01.
- **Country/Currency pair.** Egypt / Egyptian Pound was confirmed valid on 2026-10-10 (accepted for
  four records).
- **Inactive master data is also Rejected.** The supplied inactive Country and Currency (D-08) are
  Inactive **and** Rejected; how the server treats an Approved-but-Inactive country is not covered.

### Automation recommendation

Criteria: **F** feasibility · **R** reliability/determinism · **V** regression value · **M** maintainability.

| Test Case | Recommendation | In artifact | Reason |
|---|---|---|---|
| TC-52857-001 | Yes | Yes | V: role gating; F/R: deterministic read-only check |
| TC-52857-002 | Yes | Yes | V: URL-level access control; R: no data dependency |
| TC-52857-003 | Yes | Yes | V: D-02 action set; R: read-only |
| TC-52857-004 | Yes | Yes | V: D-03 action set; R: read-only |
| TC-52857-005 | Yes | Yes | V: access control by URL; R: read-only |
| TC-52857-006 | Yes | Yes | V: full-permission action set; R: read-only |
| TC-52857-007 | Yes | Yes | V: menu gating; F once the account exists (BLOCKED until then) |
| TC-52857-008 | Yes | Yes | V: role-dependent form; R: no write |
| TC-52857-009 | Yes | Yes | V: Maker form plus mandatory rule; R: no write |
| TC-52857-010 | Yes | Yes | V: core validation; R/M: stable field messages |
| TC-52857-011 | Yes | Yes | V: two-sided boundary; R: no write |
| TC-52857-012 | Yes | Yes | V: character rules; R: no write |
| TC-52857-013 | Yes | Yes | V: remarks boundary; R: no write |
| TC-52857-014 | Yes | Yes | V: main create flow; R: unique name per run |
| TC-52857-015 | Yes | Yes | V: maker–checker entry; R: unique name |
| TC-52857-016 | Yes | Yes | V: trim rule; R: unique name |
| TC-52857-017 | Yes | Yes | V: uniqueness is a known legacy defect area; R: self-seeded. Asserts the refusal, not the wording |
| TC-52857-018 | Yes | Yes | V: uniqueness across states; R: self-seeded |
| TC-52857-019 | No | No | F: needs inactive master data identified by hand; wording recorded |
| TC-52857-020 | No | No | Observation-only (D-06) |
| TC-52857-021 | Yes | Yes | V: cheap guard on Cancel; R: deterministic |
| TC-52857-022 | Yes | Yes | V: immutability of Country/Currency; R: read-only |
| TC-52857-023 | Yes | Yes | V: status preservation on update; R: self-seeded |
| TC-52857-024 | Yes | Yes | V: self-exclusion from the duplicate check; R: self-seeded |
| TC-52857-025 | Yes | Yes | V: the legacy edit-path duplicate defect; R: self-seeded |
| TC-52857-026 | Yes | Yes | V: validation on Edit; R: no write |
| TC-52857-027 | Yes | Yes | V: state rule; R: self-seeded |
| TC-52857-028 | Yes | Yes | V: resubmission path across two roles; R: self-seeded |
| TC-52857-029 | Yes | Yes | V: Cancel persists nothing; R: self-seeded |
| TC-52857-030 | Yes | Yes | V: main approval flow; R: self-seeded; wording recorded, not asserted |
| TC-52857-031 | Yes | Yes | V: main rejection flow; R: self-seeded |
| TC-52857-032 | No | No | Observation-only (D-05) |
| TC-52857-033 | Yes | Yes | V: mandatory-remarks control; R: self-seeded |
| TC-52857-034 | Yes | Yes | V: Cancel on a decision; R: self-seeded |
| TC-52857-035 | Yes | Yes | V: D-02 segregation; R: self-seeded |
| TC-52857-036 | Yes | Yes | V: direct decision on amendment; R: self-seeded |
| TC-52857-037 | Yes | Yes | V: asymmetric Rejected-record matrix; R: self-seeded |
| TC-52857-038 | Yes | Yes | V: withdrawing an approved market; R: self-seeded |
| TC-52857-039 | Yes | Yes | V: lifecycle with confirmation; R: self-seeded; warning wording recorded |
| TC-52857-040 | Yes | Yes | V: D-02 Maker lifecycle right; R: self-seeded |
| TC-52857-041 | Yes | Yes | V: Cancel on deactivation; R: self-seeded |
| TC-52857-042 | Yes | Yes | V: activation precondition; R: self-seeded |
| TC-52857-043 | No | No | V: low — static wording; M: breaks on any relabel |
| TC-52857-044 | Yes | Yes | V: default list contract; R: read-only |
| TC-52857-045 | Yes | Yes | V: search; R: relies on the stable Egypt records |
| TC-52857-046 | Yes | Yes | V: literal matching (legacy wildcard defect); R: read-only |
| TC-52857-047 | Yes | Yes | V: country filter; R: read-only |
| TC-52857-048 | Yes | Yes | V: lifecycle filter; R: self-seeded |
| TC-52857-049 | Yes | Yes | V: no-results handling; R: read-only |
| TC-52857-050 | Yes | Yes | V: D-01 list behaviour; F once the inactive Country is configured |
| TC-52857-051 | No | No | R: depends on accumulated data volume |
**Split: 46 Yes / 5 No** (51 cases; TC-52857-052, a `Yes`, was deleted by D-10). Mostly `Yes`
because most cases are deterministic, self-seeding rule checks. The `No` cases are the two
observation-only cases (020, 032), one that depends on data volume (051), one on static wording
(043), and one needing hand-identified master data (019). Every recorded value was kept unchanged
on the 2026-10-10 revision. With the data now supplied, 019 and 051 would be reasonable `Yes`
candidates — that is the human's call; the cells stay `No`.

### Revision of 2026-10-10 (D-07 … D-17)

Applied CSV-first: the CSV was edited cell by cell, then this file re-rendered.

| Case | Change |
|---|---|
| TC-52857-007 | Precondition: account supplied (D-07); no longer BLOCKED on data |
| TC-52857-011 | Notes: flagged for human review (specification-only step 6) |
| TC-52857-014 | Notes: Egypt / Egyptian Pound confirmed as a valid pair (was a conditional BLOCKED) |
| TC-52857-015 | Step 2: the *Send For Approval* confirmation dialog (observed); Notes: observed toast text |
| TC-52857-017 | Steps 3–4 now assert *"Operating Country Already Exists."* (D-12); Decisions Applied, Notes |
| TC-52857-018 | Step 2 asserts the duplicate message (D-12); Decisions Applied |
| TC-52857-019 | Precondition: data supplied, re-check inactive before use (D-08); step 2 asserts *"The selected country is not active."* (D-11); step 3 still records (currency message undecided); Notes |
| TC-52857-020 | Notes: still observation-only; mapping message remains OQ-06 |
| TC-52857-025 | Step 2 asserts the duplicate message (D-12); Decisions Applied, Notes |
| TC-52857-028 | Notes: flagged for human review (specification-only step 3) |
| TC-52857-050 | Precondition: data supplied (D-08); Decisions Applied |
| TC-52857-051 | Precondition: seed data exists; creates only a shortfall with `AUT` names (D-09, D-16, D-17); Test Data, Notes |
| TC-52857-052 | **Deleted** from the CSV by human decision D-10, overriding §6.1 for this case; ID retired |

Not changed: every status (`AI-Reviewed`), every Need Automation value, every other case.

### Verdict

51 cases set to `AI-Reviewed`. **Ready for human review.** None is approved, published or automated.
