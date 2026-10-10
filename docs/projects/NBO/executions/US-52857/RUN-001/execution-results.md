# Execution results — US-52857 · RUN-001

| Field | Value |
|---|---|
| User Story | 52857 — [INT] Admin-Company-Operating Country "Q3-API-INTE-033" |
| Project | NBO |
| Run ID | RUN-001 |
| Execution type | MANUAL (Playwright MCP) |
| Date | 2026-10-10, 13:13Z – 17:29Z (paused ~13:35Z – 17:13Z) |
| Environment label | `STG` |
| Target host | `ndc-apis-nbo-frontend-dev-epf8graxc0cudjd9.northeurope-01.azurewebsites.net` |
| Application | NDC Back Office — Admin Module → Operating Country |
| Test Case source | `docs/projects/NBO/test-cases/US-52857/test-cases.csv` (sha256 `4a1190e17c8f9d11a56e5351d67a796a244f875f18a965d7ddbb0477e9fdc2dd`) — read through `npm run testcases:show` |
| Scope | All 51 Approved Web UI cases of US-52857 |
| Completion | COMPLETED — no stop condition occurred |
| Azure DevOps writes | **none** |

## Test data (handles only)

`ADMIN_ALL`, `OPERATING_COUNTRIES_MAKER`, `OPERATING_COUNTRIES_APPROVER`, `OPERATING_COUNTRIES_VIEW_ONLY`, `OPC_USER_NO_MENU`, `OPC_COUNTRY_INACTIVE`, `OPC_CURRENCY_INACTIVE`. Values live only in `.env`. Records created by the run are named `AUT Opc <8 letters>`.

## Summary

| PASS | FAIL | BLOCKED | SKIPPED | Executed | Bug Candidates |
|---|---|---|---|---|---|
| 49 | 2 | 0 | 0 | 51 | 2 |

| Test Case | Status | Classification | Bug Candidate |
|---|---|---|---|
| TC-52857-001 | PASS | — | — |
| TC-52857-002 | PASS | — | — |
| TC-52857-003 | PASS | — | — |
| TC-52857-004 | PASS | — | — |
| TC-52857-005 | PASS | — | — |
| TC-52857-006 | PASS | — | — |
| TC-52857-007 | PASS | — | — |
| TC-52857-008 | PASS | — | — |
| TC-52857-009 | PASS | — | — |
| TC-52857-010 | PASS | — | — |
| TC-52857-011 | PASS | — | — |
| TC-52857-012 | PASS | — | — |
| TC-52857-013 | PASS | — | — |
| TC-52857-014 | PASS | — | — |
| TC-52857-015 | PASS | — | — |
| TC-52857-016 | PASS | — | — |
| TC-52857-017 | PASS | — | — |
| TC-52857-018 | PASS | — | — |
| TC-52857-019 | PASS | — | — |
| TC-52857-020 | PASS (observation) | — | — |
| TC-52857-021 | PASS | — | — |
| TC-52857-022 | PASS | — | — |
| TC-52857-023 | PASS | — | — |
| TC-52857-024 | PASS | — | — |
| TC-52857-025 | PASS | — | — |
| TC-52857-026 | PASS | — | — |
| TC-52857-027 | PASS | — | — |
| TC-52857-028 | PASS | — | — |
| TC-52857-029 | PASS | — | — |
| TC-52857-030 | PASS | — | — |
| TC-52857-031 | PASS | — | — |
| TC-52857-032 | PASS (observation) | — | — |
| TC-52857-033 | PASS | — | — |
| TC-52857-034 | PASS | — | — |
| TC-52857-035 | PASS | — | — |
| TC-52857-036 | PASS | — | — |
| TC-52857-037 | FAIL | PRODUCT_BUG | BUG-002 |
| TC-52857-038 | PASS | — | — |
| TC-52857-039 | FAIL | PRODUCT_BUG | BUG-001 |
| TC-52857-040 | PASS | — | — |
| TC-52857-041 | PASS | — | — |
| TC-52857-042 | PASS | — | — |
| TC-52857-043 | PASS | — | — |
| TC-52857-044 | PASS | — | — |
| TC-52857-045 | PASS | — | — |
| TC-52857-046 | PASS | — | — |
| TC-52857-047 | PASS | — | — |
| TC-52857-048 | PASS | — | — |
| TC-52857-049 | PASS | — | — |
| TC-52857-050 | PASS | — | — |
| TC-52857-051 | PASS | — | — |

## Bug Candidates (Draft — awaiting human review)

- **BUG-001** — [NBO][Company][Operating Country Status] Activate asks for a confirmation before an inactive Approved record becomes Active — TC-52857-039 — `bug-candidates/BUG-001.md`
- **BUG-002** — [NBO][Company][Operating Country Approval] Edit form of a Rejected record offers Reject to an all-permission user — TC-52857-037 — `bug-candidates/BUG-002.md`

## Results per case

### TC-52857-001 — PASS

[NBO][Company][Operating Country Access] Verify a View-only user sees the Operating Country list with no Add button and no row actions

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-039 AC-1, AC-2; story Access Control AC-2
- Failure classification: —
- Precondition check: Operating Countries exist (22 Active on STG at 17:27Z).

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `OPERATING_COUNTRIES_VIEW_ONLY` and open the Operating Country list page | The list loads with its filters and records | Logged in as OPERATING_COUNTRIES_VIEW_ONLY (17:27Z). List loaded with filters (Operating Country Name, Country, Active/Inactive/Both, Reset, Search) and records — "Showing 1 to 10 of 22". | PASS |
| 2 | Look for the *Add Operating Country* button | The button is **not** shown | No "Add Operating Country" button is shown. | PASS |
| 3 | Inspect the Actions column of every row | No row offers any action — no Edit, Approve, Reject, Activate or Deactivate | Every row's Actions cell shows "-" — no Edit, Approve, Reject, Activate or Deactivate. | PASS |
| 4 | Type `Egy` in the name filter and click Search | Matching records are listed — the View-only user can search | Typed "Egy" and clicked Search (GET …Name=Egy&Status=1 → 200): Egypt_WT_NBO, EgyptWTNBO and Egypt listed, Actions "-". | PASS |

### TC-52857-002 — PASS

[NBO][Company][Operating Country Access] Verify a View-only user is kept off the Add and Edit forms when opening their URLs directly

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-038 AC-1, REQ-OPC-039 AC-2
- Failure classification: —
- Precondition check: Record id 20026 (AUT Opc Rokkqmxm, created in this run by ADMIN_ALL) used as the known id.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `OPERATING_COUNTRIES_VIEW_ONLY` and enter the Add form URL (`/admin/company/operating-country/add`) in the address bar | The user is returned to the Operating Country list; no Add form is shown | Opened /admin/company/operating-country/add as OPERATING_COUNTRIES_VIEW_ONLY: the app returned to the Operating Country list; no Add form. | PASS |
| 2 | Enter the Edit URL of the known record (`/admin/company/operating-country/<id>`) | No editable form with a save, Approve or Reject action is available to the user. Record what is shown (redirect, read-only view or error) | Opened /admin/company/operating-country/20026: returned to the list; the record was not even requested (no GET …/20026); no form, no save/Approve/Reject action. | PASS |

### TC-52857-003 — PASS

[NBO][Company][Operating Country Access] Verify a Maker sees Add, and Edit plus Deactivate on an approved active row, with no Approve or Reject

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-039 AC-1, AC-3; story Access Control AC-3
- Failure classification: —
- Precondition check: Approved / Active records exist (19 Active at 13:28Z).

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `OPERATING_COUNTRIES_MAKER` and open the Operating Country list page | The *Add Operating Country* button is shown | Logged in as OPERATING_COUNTRIES_MAKER (13:28Z); the list shows "Add Operating Country". | PASS |
| 2 | Inspect the Actions column of an *Approved / Active* row | Exactly **Edit** and **Deactivate** are offered | Every Approved / Active row offers exactly Edit and Deactivate. | PASS |
| 3 | Check the same row for Approve, Reject and View All Branches | None of them is offered | No Approve, Reject or View All Branches on any row. | PASS |

### TC-52857-004 — PASS

[NBO][Company][Operating Country Access] Verify an Approver sees no Add button and only Reject plus Deactivate on an approved active row

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-039 AC-1; story Access Control AC-4
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps. Approved / Active records exist.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `OPERATING_COUNTRIES_APPROVER` and open the Operating Country list page | The list loads; the *Add Operating Country* button is **not** shown | Logged in as OPERATING_COUNTRIES_APPROVER (17:17Z); list loaded ("Showing 1 to 10 of 19"); no "Add Operating Country" button. | PASS |
| 2 | Inspect the Actions column of an *Approved / Active* row | Exactly **Reject** and **Deactivate** are offered | Every Approved / Active row offers exactly Reject and Deactivate. | PASS |
| 3 | Check the same row for Edit and View All Branches | Neither is offered | No Edit and no View All Branches on any row. | PASS |

### TC-52857-005 — PASS

[NBO][Company][Operating Country Access] Verify an Approver cannot create or amend a record when opening the Add and Edit URLs directly

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-039 AC-5
- Failure classification: —
- Precondition check: Record id 20026 known (created in this run).

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `OPERATING_COUNTRIES_APPROVER` and enter the Add form URL directly | No Add form with a save action is available. Record what is shown (redirect, empty page or error) | Opened /operating-country/add as OPERATING_COUNTRIES_APPROVER: redirected to the list — no form, no message. Nothing submitted. | PASS |
| 2 | Enter the Edit URL of the known record directly | No form allowing the name or remarks to be saved is available. Record what is shown | Opened /operating-country/20026: redirected to the list without requesting the record; no form allowing a save. | PASS |

### TC-52857-006 — PASS

[NBO][Company][Operating Country Access] Verify an all-permission user sees Add, and Edit plus Reject plus Deactivate on an approved active row

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-039 AC-1, REQ-OPC-037
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps. Approved / Active records exist (7 on STG at 13:13Z).

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL` and open the Operating Country list page | The *Add Operating Country* button is shown | Logged in as ADMIN_ALL (13:13Z); "Add Operating Country" is shown. | PASS |
| 2 | Inspect the Actions column of an *Approved / Active* row | Exactly **Edit**, **Reject** and **Deactivate** are offered | Approved / Active rows offer exactly Edit, Reject and Deactivate. | PASS |
| 3 | Check the row for View All Branches | Not offered (D-01, analysis C-16) | View All Branches is not offered. | PASS |

### TC-52857-007 — PASS

[NBO][Company][Operating Country Access] Verify a user without the Operating Country menu right cannot see the menu entry or open the list, Add or Edit URLs

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-038 AC-1, AC-3; story Access Control AC-1
- Failure classification: —
- Precondition check: OPC_USER_NO_MENU logged in successfully (17:28Z) → /dashboard.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `OPC_USER_NO_MENU` and open the navigation menu | No Operating Country entry is present under Company | Navigation menu lists only Module "Dashboard" → Dashboard; no Company / Operating Country entry. | PASS |
| 2 | Enter the list URL (`/admin/company/operating-country`) directly | The Operating Country list is not displayed | Direct /admin/company/operating-country → /access-denied: "Access denied — You do not have access to this page. Ask your administrator if you need it." No Operating Country request was made. | PASS |
| 3 | Enter the Add URL (`/admin/company/operating-country/add`) directly | The Add form is not displayed | Direct /admin/company/operating-country/add → /access-denied (same page); no Add form. | PASS |

### TC-52857-008 — PASS

[NBO][Company][Add Operating Country] Verify an all-permission user's Add form shows Name, Country, Currency and Remarks as required with only Cancel and Approve actions

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-002 AC-2, AC-4; REQ-OPC-046 AC-1, AC-7
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL`, open the list page and click *Add Operating Country* | The *Add Operating Country* form opens | ADMIN_ALL opened the Add form (13:16Z): heading "Add Operating Country", subtitle "Fill in the details to add a new operating country. It is approved as soon as you save it." | PASS |
| 2 | Inspect the fields | **Operating Country Name**, **Country**, **Currency** and **Remarks** are present, each marked *(required)* | Fields Operating Country Name, Country, Currency and Remarks are all marked "(required)". | PASS |
| 3 | Inspect the action buttons | Exactly **Cancel** and **Approve**; no *Send For Approval* | Actions are exactly Cancel and Approve; no Send For Approval. | PASS |

### TC-52857-009 — PASS

[NBO][Company][Add Operating Country] Verify a Maker's Add form requires Remarks, offers only Send For Approval and blocks an empty submission

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-002 AC-1, AC-2; REQ-OPC-003 AC-7; REQ-OPC-006
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `OPERATING_COUNTRIES_MAKER` and click *Add Operating Country* | The Add form opens | OPERATING_COUNTRIES_MAKER clicked Add (13:28Z): form opened, subtitle "…It goes to the approval queue when you save." | PASS |
| 2 | Inspect the fields | Name, Country, Currency **and Remarks** are present, each marked *(required)* | Name, Country, Currency and Remarks are present, each marked "(required)". | PASS |
| 3 | Inspect the action buttons | Exactly **Cancel** and **Send For Approval**; no Approve | Actions are exactly Cancel and Send For Approval; no Approve. | PASS |
| 4 | Leave every field empty and click *Send For Approval* | Nothing is saved and the form stays open. Name shows *"Operating Country Name is required."*, Country *"Country is required."*, Currency *"Currency is required."*, and Remarks shows validation feedback | Empty Send For Approval: no POST; form stayed open with "4 fields need attention / Fix the highlighted fields below, then send for approval."; "Operating Country Name is required.", "Country is required.", "Currency is required."; Remarks shows "Remarks is required." | PASS |

### TC-52857-010 — PASS

[NBO][Company][Add Operating Country] Verify required-field messages appear for Name, Country, Currency and Remarks when an all-permission user clicks Approve on an empty form

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-006 AC-1…AC-3; REQ-OPC-003 AC-2, AC-6; REQ-OPC-041 AC-1
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL` and open the Add form | The form opens with every field empty | Add form opened as ADMIN_ALL with every field empty (13:16Z). | PASS |
| 2 | Click **Approve** | Nothing is saved; the form stays open with a summary saying fields need attention | Approve on the empty form sent no request; the form stayed open with "4 fields need attention / Fix the highlighted fields below, then approve." | PASS |
| 3 | Read each field's message | Name: *"Operating Country Name is required."* · Country: *"Country is required."* · Currency: *"Currency is required."* · Remarks: *"Remarks is required."* | Name: "Operating Country Name is required." · Country: "Country is required." · Currency: "Currency is required." · Remarks: "Remarks is required." | PASS |

### TC-52857-011 — PASS

[NBO][Company][Add Operating Country] Verify the Name accepts 3 and 100 characters and shows the length message for 2 and 101 characters

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-007 AC-1, AC-2, AC-5; REQ-OPC-041 AC-1
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL` and open the Add form | The form opens | Add form opened (13:17Z). | PASS |
| 2 | Type `Ab` in Name and press Tab | The field is flagged with *"Operating Country Name must be between 3 and 100 characters."* | "Ab" + Tab → invalid, "Operating Country Name must be between 3 and 100 characters.", counter 2 / 100. | PASS |
| 3 | Replace with `Abc` and press Tab | The field is not flagged invalid | "Abc" + Tab → not invalid. | PASS |
| 4 | Replace with the 100-character value and press Tab | The field is not flagged invalid | 100 characters + Tab → not invalid. | PASS |
| 5 | Replace with the 101-character value and press Tab | The field is flagged with the same length message | 101 characters + Tab → invalid, same length message, counter 101 / 100. | PASS |
| 6 | Replace with `Ab ` (trailing space) and press Tab | The field is flagged with the length message — length is measured after trimming (REQ-OPC-007 AC-5) | "Ab " + Tab → invalid with the length message; counter 2 / 100 (length measured after trimming). | PASS |
| 7 | Click Cancel | The form closes; nothing is created | Cancel → list; no POST sent. | PASS |

### TC-52857-012 — PASS

[NBO][Company][Add Operating Country] Verify the Name rejects digits, symbols, a leading space and double spaces and accepts letters, accents, hyphens, apostrophes and underscores

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-008 AC-1, AC-3, AC-5; REQ-OPC-009 AC-3
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL` and open the Add form | The form opens | Add form opened (13:18Z). | PASS |
| 2 | Type `1abc` in Name and press Tab | Flagged with *"Operating Country Name may contain Latin letters only, joined by single spaces, apostrophes, hyphens or underscores."* | "1abc" → invalid, "Operating Country Name may contain Latin letters only, joined by single spaces, apostrophes, hyphens or underscores." | PASS |
| 3 | Replace with `Abc1`, press Tab | Flagged with the same message | "Abc1" → invalid, same message. | PASS |
| 4 | Replace with `Abc@Def`, press Tab | Flagged with the same message | "Abc@Def" → invalid, same message. | PASS |
| 5 | Replace with ` Abcd` (leading space), press Tab | Flagged with *"Operating Country Name may not start with a space or contain consecutive spaces."* | " Abcd" → invalid, "Operating Country Name may not start with a space or contain consecutive spaces." | PASS |
| 6 | Replace with `Ab  Cd`, press Tab | The field is flagged invalid with a message. Record which message is shown | "Ab  Cd" → invalid; message shown: "Operating Country Name may contain Latin letters only, joined by single spaces, apostrophes, hyphens or underscores." | PASS |
| 7 | Enter each valid value in turn, pressing Tab after each | None is flagged invalid | "Côte d'Ivoire", "Guinea-Bissau", "Trinidad and Tobago", "Abc_Def" → none flagged invalid. | PASS |
| 8 | Click Cancel | Nothing is created | Cancel → list; no POST sent. | PASS |

Observations (unverified, not results):
- After a valid value replaced an invalid one, the previous message text remained in the accessibility tree (a hidden live region); a rendered screenshot showed no visible message under Name. Not a result.

### TC-52857-013 — PASS

[NBO][Company][Add Operating Country] Verify Remarks accept 250 characters and show the 250-character message for 251 characters

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-018 AC-2, AC-3, AC-4
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL` and open the Add form | The form opens | Add form opened (13:19Z). | PASS |
| 2 | Type 250 characters in Remarks and press Tab | Not flagged invalid; the counter reads *250 / 250* | 250 characters + Tab → not invalid, counter 250 / 250. | PASS |
| 3 | Add one character (251) and press Tab | Flagged with *"Remarks must not exceed 250 characters."*; the counter reads *251 / 250* | 251 characters + Tab → invalid, "Remarks must not exceed 250 characters.", counter 251 / 250. | PASS |
| 4 | Replace with `Ok 123 #$% (test)` and press Tab | Not flagged invalid — no character rule applies to Remarks (REQ-OPC-018 AC-3) | "Ok 123 #$% (test)" + Tab → not invalid, counter 17 / 250. | PASS |
| 5 | Click Cancel | Nothing is created | Cancel → list; no POST sent. | PASS |

Observations (unverified, not results):
- Operator slip, corrected: the first paste was 255 characters (counter 255 / 250, message shown). The 250/251 boundary was then set by the app counter (Backspace from 251 to 250, one key to 251).

### TC-52857-014 — PASS

[NBO][Company][Add Operating Country] Verify a new Operating Country is Approved and Active at the top of the list when an all-permission user approves it on creation

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-003 AC-1, AC-4, AC-6; REQ-OPC-004 AC-2; REQ-OPC-021 AC-1; REQ-OPC-023 AC-1; REQ-OPC-043 AC-3; REQ-OPC-046 AC-1
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL` and open the Add form | The form opens | Add form opened as ADMIN_ALL (13:19Z). | PASS |
| 2 | Enter RUN-NAME, select Egypt and Egyptian Pound, enter the remarks | No field is flagged invalid | AUT Opc Rokkqmxm / Egypt / Egyptian Pound / "Created by QA": no field invalid; footer "Ready to approve". | PASS |
| 3 | Click **Approve** | A success confirmation is displayed — record its exact text — and the user is returned to the Operating Country list | Approve (+ dialog confirm) → POST 201; toast "Success — Operating Country approved successfully" (captured from the MCP snapshot taken immediately after the click, 13:20:14Z); returned to the list. | PASS |
| 4 | Look at the default list (Active filter, page 1) | RUN-NAME is the **first** row, with Country Egypt, Currency Egyptian Pound, Approval Status **Approved**, Status **Active** | Default list (Active, page 1): AUT Opc Rokkqmxm is the first row — Egypt, Egyptian Pound, Approved, Active (id 20026). | PASS |

Observations (unverified, not results):
- Approve opens a confirmation dialog "Approve this operating country?" / "Your changes are saved and approved in one step." before saving — not part of the case.

### TC-52857-015 — PASS

[NBO][Company][Add Operating Country] Verify a Maker's new Operating Country is Pending for Approval and Inactive and appears only under the Inactive filter

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-003 AC-1, AC-7; REQ-OPC-004 AC-1, AC-3; REQ-OPC-025 AC-1, AC-2; REQ-OPC-043 AC-3
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `OPERATING_COUNTRIES_MAKER`, open the Add form and fill in every field | No field is flagged invalid | Maker filled AUT Opc Sapodsyv / Egypt / Egyptian Pound / "Please approve": no field invalid; footer "Ready to send for approval". | PASS |
| 2 | Click **Send For Approval**, then confirm **Send For Approval** in the dialog | A dialog *"Submit this operating country for approval?"* asks for confirmation; after confirming, a success confirmation is displayed — record its exact text — and the list is shown | Dialog "Submit this operating country for approval?" ("It goes to an approver and takes effect once approved.") → confirm → toast "Success — Operating Country sent for approval successfully"; list shown. | PASS |
| 3 | Search the default (Active) list by name RUN-NAME | RUN-NAME is **not** listed | Active search "Sapodsyv" (Status=1) → no match. | PASS |
| 4 | Select the **Inactive** filter and search by RUN-NAME | RUN-NAME is listed with Approval Status **Pending for Approval** (record the exact label) and Status **Inactive** | Inactive search → AUT Opc Sapodsyv, Approval Status label "Pending", Status "InActive" (id 20039). | PASS |

### TC-52857-016 — PASS

[NBO][Company][Add Operating Country] Verify the saved name has its trailing space removed when the name is entered with a trailing space

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-009 AC-1; REQ-OPC-003 AC-5; story Creation AC-6
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL`, open the Add form, enter RUN-NAME with a trailing space and the other fields | The name is not flagged invalid | "AUT Opc Isyklodt " (trailing space) with Egypt / Egyptian Pound / "Trim check": not invalid; counter 16 / 100. | PASS |
| 2 | Click Approve | The record is created and the list is shown | Approve (+ confirm) → POST 201, toast "Operating Country approved successfully", list shown (id 20027). | PASS |
| 3 | Open the new record's Edit form and read the Name value and its character counter | The name equals RUN-NAME with no trailing space; the counter equals the length of RUN-NAME | Edit form Name "AUT Opc Isyklodt", counter 16 / 100; GET …/20027 returns name "AUT Opc Isyklodt" with no trailing space. | PASS |
| 4 | Click Cancel | Nothing changes | Cancel → list; no write sent. | PASS |

### TC-52857-017 — PASS

[NBO][Company][Add Operating Country] Verify creation is refused when the name matches an existing Operating Country exactly or in different letter case

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-010 AC-1, AC-2, AC-5; REQ-OPC-041 AC-2
- Failure classification: —
- Precondition check: As stated: - A record named RUN-NAME exists. Create it in step 1.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL` and create RUN-NAME (Egypt, Egyptian Pound, remarks) with Approve | RUN-NAME is created | Created AUT Opc Huuxhlei with Approve → POST 201, toast "Operating Country approved successfully" (id 20028). | PASS |
| 2 | Open the Add form, type RUN-NAME exactly, and press Tab | No duplicate message is shown on leaving the field (D-01) | New Add form, typed AUT Opc Huuxhlei + Tab (2 s wait) → no duplicate message. | PASS |
| 3 | Complete Country, Currency and Remarks and click Approve | The save is refused; the form stays open and the message *"Operating Country Already Exists."* is shown (D-12) | Completed fields, Approve (+ confirm) → POST 409; form stayed open; toast "Error — Operating Country Already Exists." | PASS |
| 4 | Change the name to RUN-NAME in lower case and click Approve | The save is refused and the message *"Operating Country Already Exists."* is shown (D-12) | "aut opc huuxhlei", Approve (+ confirm) → POST 409; "Operating Country Already Exists." | PASS |
| 5 | Click Cancel and search the list for RUN-NAME (Both filter) | Exactly **one** record named RUN-NAME exists | Cancel; Both + "Huuxhlei" → "1 operating country" (id 20028). | PASS |

### TC-52857-018 — PASS

[NBO][Company][Add Operating Country] Verify a name already held by a Pending for Approval record is refused when another record is created with it

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-010 AC-6
- Failure classification: —
- Precondition check: As stated: - A *Pending* record named RUN-NAME exists. Create it in step 1.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME (Egypt, Egyptian Pound, remarks) with Send For Approval | RUN-NAME exists as *Pending / Inactive* | Maker created AUT Opc Dmnelxxy with Send For Approval (13:34Z) → toast "Operating Country sent for approval successfully"; Pending / Inactive (id 20042). | PASS |
| 2 | Log in as `ADMIN_ALL`, open the Add form, enter RUN-NAME with the other fields, and click Approve | The save is refused and the message *"Operating Country Already Exists."* is shown (D-12) | ADMIN_ALL Add form with AUT Opc Dmnelxxy, Egypt, Egyptian Pound, remarks, Approve (+ confirm) → POST 409; toast "Error — Operating Country Already Exists." | PASS |
| 3 | Search the list (Both filter) by RUN-NAME | Exactly one record, still *Pending / Inactive* | Both + "Dmnelxxy" → "Showing 1 to 1 of 1": AUT Opc Dmnelxxy, Pending / InActive. | PASS |

Observations (unverified, not results):
- First Approve attempt (17:24Z) was refused client-side ("Could not save — 1 field needs attention.") because the name was filled before the freshly loaded form initialised — an execution slip; nothing was sent. The name was re-entered.

### TC-52857-019 — PASS

[NBO][Company][Add Operating Country] Verify an inactive Country or Currency is listed on the Add form and creation with it is refused, recording the message

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-002 AC-3, AC-6
- Failure classification: —
- Precondition check: OPC_COUNTRY_INACTIVE and OPC_CURRENCY_INACTIVE verified read-only at 13:14–13:15Z in the Country and Currency masters: both Rejected / InActive (statuses never changed). The Currency list API also returned the currency with status 0.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL`, open the Add form and open the Country list | The inactive Country is listed (the Add-form lists are unfiltered — D-01) | The inactive Country (OPC_COUNTRY_INACTIVE) is listed in the Add form's Country list. | PASS |
| 2 | Enter RUN-NAME, select the inactive Country, Egyptian Pound and remarks, then click Approve | The record is **not** created and the message *"The selected country is not active."* is shown (D-11) | AUT Opc Qazgtuxr + inactive Country + Egyptian Pound + remarks, Approve (+ confirm) → POST 409; not created; toast "Error — The selected country is not active." | PASS |
| 3 | Enter RUN-NAME-2, select Egypt, the inactive Currency and remarks, then click Approve | The record is **not** created and an error is shown — record its exact text | AUT Opc Nsuutima + Egypt + inactive Currency (OPC_CURRENCY_INACTIVE) + remarks, Approve (+ confirm) → POST 409; not created; toast "Error — The selected currency is not active." | OBSERVED |
| 4 | Search the list (Both filter) for RUN-NAME and RUN-NAME-2 | Neither exists | Both filter: "Qazgtuxr" and "Nsuutima" → "No operating countries match these filters" for each. | PASS |

Observations (unverified, not results):
- The Currency dropdown renders only the first 16 of 211 options; the inactive currency was reached through the dropdown's type-ahead filter.

### TC-52857-020 — PASS (observation-only)

[NBO][Company][Add Operating Country] Observe the result when a Currency not belonging to the chosen Country is selected and Approve is clicked

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-001 AC-4
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL`, open the Add form, select Country **Egypt** and open the Currency list | The list is **not** narrowed to Egypt — currencies such as Kuwaiti Dinar are offered (D-06, observed behaviour) | Country Egypt selected; the Currency list is not narrowed — Kuwaiti Dinar, Euro, Saudi Riyal and others offered. | PASS |
| 2 | Enter RUN-NAME, select Kuwaiti Dinar and the remarks, then click Approve | **Observation only:** record whether the record is created or refused, and the exact message shown | AUT Opc Nyzsjzmv + Egypt + Kuwaiti Dinar + "Mapping check", Approve (+ confirm) → CREATED: toast "Success — Operating Country approved successfully"; no refusal or message. | OBSERVED |
| 3 | If it was created, search the list for RUN-NAME and record its Country and Currency | Recorded | List: AUT Opc Nyzsjzmv — Country Egypt, Currency Kuwaiti Dinar, Approved / Active (id 20029). | OBSERVED |

### TC-52857-021 — PASS

[NBO][Company][Add Operating Country] Verify no Operating Country is created when a filled Add form is cancelled

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-046 AC-3
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL`, open the Add form and fill in every field | No field is flagged invalid | AUT Opc Qtzckbky / Egypt / Egyptian Pound / "Cancel check": no field invalid, "Ready to approve". | PASS |
| 2 | Click **Cancel** (confirm leaving if asked) | The Operating Country list is shown | Cancel → list shown directly (no leave confirmation asked). | PASS |
| 3 | Search the list (Both filter) by RUN-NAME | No record named RUN-NAME exists | Both + "Qtzckbky" → "No operating countries match these filters"; no POST was sent. | PASS |

### TC-52857-022 — PASS

[NBO][Company][Edit Operating Country] Verify the Edit form pre-fills name and remarks, locks Country and Currency, and offers Cancel, Approve and Reject to an all-permission user

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-014 AC-1, AC-4; REQ-OPC-015 AC-1; REQ-OPC-046 AC-2
- Failure classification: —
- Precondition check: Approved / Active record AUT Opc Rokkqmxm (20026, created in TC-52857-014). Nothing saved.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL` and click **Edit** on an *Approved / Active* row | The *Edit Operating Country* form opens | Edit on the row → "Edit Operating Country" ("You decide on this operating country when you save."). | PASS |
| 2 | Compare Name, Country and Currency with the row | All three match the row | Name AUT Opc Rokkqmxm, Country Egypt, Currency Egyptian Pound — all match the row. | PASS |
| 3 | Try to open the Country and Currency dropdowns | Both are disabled and cannot be changed | Country and Currency comboboxes are aria-disabled; clicking was refused ("element is not enabled"); no option list opened. | PASS |
| 4 | Inspect Remarks | Pre-filled with the stored remarks and editable | Remarks pre-filled "Created by QA" in an editable textbox. | PASS |
| 5 | Inspect the actions | Exactly **Cancel**, **Approve** and **Reject** — no plain Update | Actions exactly Cancel, Approve and Reject; no plain Update. | PASS |
| 6 | Click Cancel | The list is shown; nothing changed | Cancel → list; only GET …/20026 sent; row unchanged. | PASS |

### TC-52857-023 — PASS

[NBO][Company][Edit Operating Country] Verify an Approved Operating Country stays Approved and Active when a Maker renames it and clicks Update

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-016 AC-1, AC-4, AC-5; REQ-OPC-017 AC-1, AC-4; REQ-OPC-039 AC-4
- Failure classification: —
- Precondition check: As stated: - An *Approved / Active* record created by this case (step 1).

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `ADMIN_ALL`, create RUN-NAME (Egypt, Egyptian Pound, remarks) with Approve | RUN-NAME is *Approved / Active* | ADMIN_ALL created AUT Opc Jlzuzhen with Approve (13:25Z) → Approved / Active (id 20031). | PASS |
| 2 | Log in as `OPERATING_COUNTRIES_MAKER` and open RUN-NAME's Edit form | The actions are exactly **Cancel** and **Update** | Maker opened its Edit form: actions exactly Cancel and Update. | PASS |
| 3 | Change the name to RUN-NAME-2, keep the remarks, and click Update | A success confirmation is displayed — record its exact text — and the list is shown | Renamed to AUT Opc Auzfaiut, Update → dialog "Save changes to this operating country?" → Update → PUT 200; toast "Success — Operating Country updated successfully"; list shown. | PASS |
| 4 | Find RUN-NAME-2 in the default (Active) list | Approval Status **Approved**, Status **Active**; it is the first row | Default list: AUT Opc Auzfaiut first row, Approved / Active. | PASS |

### TC-52857-024 — PASS

[NBO][Company][Edit Operating Country] Verify no duplicate error appears when a Maker updates only the Remarks and keeps the existing name

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-011 AC-1, AC-3; REQ-OPC-018 AC-6
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `ADMIN_ALL`, create RUN-NAME with Approve | Created, *Approved / Active* | ADMIN_ALL created AUT Opc Rqiuybio with Approve (13:25Z) → Approved / Active (id 20032). | PASS |
| 2 | As `OPERATING_COUNTRIES_MAKER`, open its Edit form, replace the remarks, leave the name unchanged, and click Update | The update is saved with no duplicate-name error; the list is shown | Maker replaced remarks with "Remarks updated by QA", name unchanged, Update (+ confirm) → PUT 200 (request body remarks "Remarks updated by QA"); no duplicate-name error; list shown. (Passed on retry — see observation.) | PASS |
| 3 | Reopen the Edit form | Name is unchanged; Remarks show `Remarks updated by QA` in full | Reopened Edit: Name AUT Opc Rqiuybio unchanged; Remarks "Remarks updated by QA" (21 / 250). | PASS |

Observations (unverified, not results):
- UNVERIFIED, cause UNKNOWN: on the first attempt (13:29:33Z, remarks set with a programmatic fill and no blur) Update returned PUT 200 and "Operating Country updated successfully", yet the record kept remarks "Created by QA" (Edit form and GET …/20032). That PUT body was not captured. The retry (typed + Tab) sent remarks "Remarks updated by QA" and persisted. Not reproduced; recorded for a human to judge.

### TC-52857-025 — PASS

[NBO][Company][Edit Operating Country] Verify an update is refused when a Maker renames a record to another Operating Country's name in different letter case

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-010 AC-2; REQ-OPC-011 AC-2, AC-7; story Validation AC-4
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `ADMIN_ALL`, create RUN-NAME and RUN-NAME-2, both with Approve | Both exist | ADMIN_ALL created AUT Opc Ustqndtg and AUT Opc Ussruvab with Approve (13:26Z); both Approved / Active (ids 20033, 20034). | PASS |
| 2 | As `OPERATING_COUNTRIES_MAKER`, open RUN-NAME-2's Edit form, change the name to RUN-NAME in upper case, and click Update | The update is refused; the form stays open and the message *"Operating Country Already Exists."* is shown (D-12) | Maker renamed AUT Opc Ussruvab to "AUT OPC USTQNDTG", Update (+ confirm) → PUT 409; form stayed open; toast "Error — Operating Country Already Exists." | PASS |
| 3 | Click Cancel and search for RUN-NAME-2 | It still exists under its original name | Cancel; search "Ussruvab" → AUT Opc Ussruvab still listed, Approved / Active. | PASS |

### TC-52857-026 — PASS

[NBO][Company][Edit Operating Country] Verify the Edit form flags an empty, too-short or invalid-character name with the same messages as the Add form

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-016 AC-3; story Editing AC-6
- Failure classification: —
- Precondition check: Approved / Active record AUT Opc Huuxhlei (20028). Nothing saved.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `OPERATING_COUNTRIES_MAKER` and open the Edit form of an *Approved / Active* record | The form opens | Maker opened the Edit form (actions Cancel, Update). | PASS |
| 2 | Clear the name and press Tab | Flagged with *"Operating Country Name is required."* | Cleared name + Tab → "Operating Country Name is required." | PASS |
| 3 | Enter `Ab`, press Tab | Flagged with *"Operating Country Name must be between 3 and 100 characters."* | "Ab" + Tab → "Operating Country Name must be between 3 and 100 characters." (2 / 100). | PASS |
| 4 | Enter `Abc1`, press Tab | Flagged with *"Operating Country Name may contain Latin letters only, joined by single spaces, apostrophes, hyphens or underscores."* | "Abc1" + Tab → "Operating Country Name may contain Latin letters only, joined by single spaces, apostrophes, hyphens or underscores." | PASS |
| 5 | Click Cancel | Nothing is saved; the record is unchanged | Cancel → list; only GET …/20028; record unchanged. | PASS |

### TC-52857-027 — PASS

[NBO][Company][Edit Operating Country] Verify a Pending for Approval record stays Pending and Inactive when a Maker updates it

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-016 AC-7; REQ-OPC-017 AC-1, AC-4; REQ-OPC-039 AC-1
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* | Maker created AUT Opc Anlodsmq with Send For Approval → Pending / InActive (id 20041). | PASS |
| 2 | Open RUN-NAME's Edit form (Inactive filter) | The form offers an update action and **no** Approve or Reject. Record the action names shown | Edit form (from the Inactive filter): actions Cancel and "Send For Approval"; no Approve or Reject. | PASS |
| 3 | Rename to RUN-NAME-2 and save with the update action | A success confirmation is displayed; the list is shown | Renamed to AUT Opc Aqsubnkt, Send For Approval (+ confirm) → PUT 200; toast "Success — Operating Country sent for approval successfully" (MCP snapshot 13:34:04Z); list shown. | PASS |
| 4 | Search the Inactive list for RUN-NAME-2 | Approval Status still *Pending for Approval*; Status **Inactive** | Inactive search "Aqsubnkt" → Pending / InActive. | PASS |

### TC-52857-028 — PASS

[NBO][Company][Edit Operating Country] Verify a Rejected record returns to Pending for Approval and stays Inactive when a Maker amends it and sends it for approval

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-016 AC-6; REQ-OPC-017 AC-4; REQ-OPC-025 AC-4; REQ-OPC-039 AC-1
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* | Maker created AUT Opc Gcdpihkx with Send For Approval (13:34Z) → Pending / Inactive (id 20043). | PASS |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, reject RUN-NAME from the list, giving the reject remarks | *Rejected / Inactive* | Approver rejected it from the list with "Rejected by QA" (17:20Z) → toast "Operating country rejected successfully"; Rejected / InActive. | PASS |
| 3 | As `OPERATING_COUNTRIES_MAKER`, open RUN-NAME's Edit form | The only save action is **Send For Approval** (REQ-OPC-039 AC-1); no Approve or Reject | Maker Edit form (17:23Z): only save action "Send For Approval" (+ Cancel); no Approve or Reject; Remarks pre-filled "Rejected by QA". | PASS |
| 4 | Rename to RUN-NAME-2 and click Send For Approval | A success confirmation is displayed | Renamed to AUT Opc Dkiiyhmi, Send For Approval (+ confirm) → PUT 200; toast "Success — Operating Country sent for approval successfully". | PASS |
| 5 | Search the Inactive list for RUN-NAME-2 | Approval Status *Pending for Approval*; Status **Inactive** | Inactive search → AUT Opc Dkiiyhmi, Pending / InActive. | PASS |

### TC-52857-029 — PASS

[NBO][Company][Edit Operating Country] Verify name and remarks stay unchanged when a Maker edits them and clicks Cancel

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-016 AC-5; REQ-OPC-017 AC-1 (Cancel)
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `ADMIN_ALL`, create RUN-NAME with Approve and remarks `Original` | Created | ADMIN_ALL created AUT Opc Hbvdwbny with remarks "Original" (13:26Z) → Approved / Active (id 20035). | PASS |
| 2 | As `OPERATING_COUNTRIES_MAKER`, open its Edit form, change the name to RUN-NAME-2 and the remarks to `Changed` | Fields show the new values | Maker Edit: name AUT Opc Tgfwtles and remarks "Changed" shown; footer "Ready to update". | PASS |
| 3 | Click **Cancel** (confirm leaving if asked) | The list is shown | Cancel → list shown directly (no confirmation); no PUT sent. | PASS |
| 4 | Reopen RUN-NAME's Edit form | Name RUN-NAME, remarks `Original`, still *Approved / Active* | Reopened Edit: Name AUT Opc Hbvdwbny, remarks "Original"; list row Approved / Active. | PASS |

### TC-52857-030 — PASS

[NBO][Company][Operating Country Approval] Verify a Pending record becomes Approved and Active when an Approver approves it from the list with remarks

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-025 AC-1; REQ-OPC-026 AC-1; REQ-OPC-027 AC-1; REQ-OPC-030 AC-1
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* | Maker created AUT Opc Owkqucho with Send For Approval (17:14Z, after re-login) → Pending / Inactive (id 20044). | PASS |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, find RUN-NAME (Inactive filter) and inspect its actions | **Approve** and **Reject** are offered; no Edit | Approver, Inactive filter: row offers Approve and Reject; no Edit. | PASS |
| 3 | Click **Approve** | A dialog asking for remarks is shown — record its title, fields and buttons | Approve → dialog title "Approve AUT Opc Owkqucho?", text "The record is marked approved. Add a short reason — it is kept with the decision.", field "Reason (required)", buttons Cancel and "Approve Operating country" (disabled until a reason is entered). | PASS |
| 4 | Enter the remarks and confirm | A success confirmation is displayed — record its exact text | Reason "Approved by QA" → PUT 200; toast "Success — Operating country approved successfully". | PASS |
| 5 | Search the default (Active) list for RUN-NAME | Approval Status **Approved**, Status **Active** | Active search → AUT Opc Owkqucho, Approved / Active. | PASS |

### TC-52857-031 — PASS

[NBO][Company][Operating Country Approval] Verify a Pending record becomes Rejected and Inactive when an Approver rejects it from the list with remarks

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-026 AC-2; REQ-OPC-030 AC-2
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* | Maker created AUT Opc Qfkdpedm with Send For Approval → Pending / Inactive (id 20045). | PASS |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, click **Reject** on RUN-NAME | A reject dialog is shown — record its title, fields and buttons, and whether Remarks is marked required | Approver Reject → dialog title "Reject AUT Opc Qfkdpedm?", text "The record is marked rejected. Add a short reason — it is kept with the decision.", field "Reason (required)" (marked required), buttons Cancel and "Reject Operating country" (disabled until a reason is entered). | PASS |
| 3 | Enter the remarks and confirm | A success confirmation is displayed — record its exact text | Reason "Rejected by QA" → PUT 200; toast "Success — Operating country rejected successfully". | PASS |
| 4 | Search the Inactive list for RUN-NAME | Approval Status **Rejected**, Status **Inactive** | Inactive search → Rejected / InActive. | PASS |
| 5 | Search the default (Active) list for RUN-NAME | Not listed | Active search → "No operating countries match these filters". | PASS |

### TC-52857-032 — PASS (observation-only)

[NBO][Company][Operating Country Approval] Observe whether a Pending record can be rejected from the list when the Remarks field is left empty

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-027 AC-2
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* | Maker created AUT Opc Fxbugniz with Send For Approval → Pending / Inactive (id 20046). | PASS |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, click **Reject** on RUN-NAME, leave Remarks empty, and confirm | **Observation only:** record whether the rejection is blocked (and the exact message) or recorded | Approver Reject with Reason empty: the confirm button "Reject Operating country" stays disabled; leaving the field shows "Reason is required." The rejection is blocked in the UI — no request sent. Dialog cancelled. | OBSERVED |
| 3 | Search the list (Both filter) for RUN-NAME | Record its Approval Status and Status | Both search → AUT Opc Fxbugniz: Approval Status Pending, Status InActive. | OBSERVED |

### TC-52857-033 — PASS

[NBO][Company][Operating Country Approval] Verify an Approver cannot approve a Pending record when Remarks are empty or longer than 250 characters

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-027 AC-2, AC-5; REQ-OPC-018 AC-1, AC-2
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* | Maker created AUT Opc Wrtfoypv with Send For Approval → Pending / Inactive (id 20047). | PASS |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, click **Approve** on RUN-NAME, leave Remarks empty, and confirm | The approval is not recorded; validation feedback is shown for Remarks — record its exact text | Approver Approve with Reason empty: confirm "Approve Operating country" disabled; field invalid with "Reason is required." — approval not recorded. | PASS |
| 3 | Enter 251 characters in Remarks and confirm | The approval is not recorded; validation feedback is shown — record its exact text | Reason of 251 characters (counter 251 / 250): field invalid with "Reason must not exceed 250 characters."; confirm stays disabled — approval not recorded. | PASS |
| 4 | Cancel the dialog and search the Inactive list for RUN-NAME | Still *Pending for Approval / Inactive* | Dialog cancelled; Inactive search → Pending / InActive; no PUT sent. | PASS |

Observations (unverified, not results):
- Operator slip, corrected: the first 251-character entry reached 252 (counter 252 / 250); one Backspace set it to 251 / 250.

### TC-52857-034 — PASS

[NBO][Company][Operating Country Approval] Verify a Pending record stays Pending when an Approver opens the Approve dialog, enters remarks and cancels

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-026 AC-5; REQ-OPC-027 AC-4; REQ-OPC-046 AC-3
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* | Maker created AUT Opc Uediodof with Send For Approval → Pending / Inactive (id 20048). | PASS |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, click **Approve** on RUN-NAME, enter the remarks, then cancel the dialog | The dialog closes; no confirmation is shown | Approver Approve, Reason "Will be cancelled", Cancel → dialog closed; no confirmation toast; no PUT/PATCH sent. | PASS |
| 3 | Search the Inactive list for RUN-NAME | Still *Pending for Approval / Inactive* | Inactive search → Pending / InActive. | PASS |

### TC-52857-035 — PASS

[NBO][Company][Operating Country Approval] Verify a Maker sees no Approve or Reject on a Pending record in the list or on its Edit form

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-039 AC-3; REQ-OPC-046 AC-8; story Access Control AC-7
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* | Maker created AUT Opc Cdnohiej with Send For Approval → Pending / Inactive (id 20040). | PASS |
| 2 | Find RUN-NAME in the Inactive list and inspect its row actions | No Approve and no Reject. Record the actions that are offered | Inactive list row actions for the Maker: Edit only — no Approve, no Reject. | PASS |
| 3 | Open RUN-NAME's Edit form and inspect its actions | No Approve and no Reject | Edit form ("Goes to the approval queue when you save."): actions Cancel and Send For Approval — no Approve, no Reject. | PASS |

### TC-52857-036 — PASS

[NBO][Company][Operating Country Approval] Verify a Pending record becomes Approved and Active when an all-permission user approves it from the Edit form

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-046 AC-2 (Pending), AC-5; REQ-OPC-016 AC-8
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* | Maker created AUT Opc Frpwmqqc with Send For Approval → Pending / Inactive (id 20049). | PASS |
| 2 | As `ADMIN_ALL`, open RUN-NAME's Edit form | The actions are **Approve** and **Reject** (and Cancel); no Send For Approval | ADMIN_ALL Edit form: actions Cancel, Approve and Reject; no Send For Approval. | PASS |
| 3 | Replace the remarks and click **Approve** | A success confirmation is displayed — record its exact text | Remarks "Approved in edit", Approve → dialog "Approve this operating country?" → confirm → PUT 200; toast "Success — Operating Country approved successfully". | PASS |
| 4 | Search the default (Active) list for RUN-NAME | **Approved / Active** | Active search → AUT Opc Frpwmqqc, Approved / Active. | PASS |

### TC-52857-037 — FAIL

[NBO][Company][Operating Country Approval] Verify a Rejected record's Edit form offers only Approve and Cancel and approving it makes it Approved and Active

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-046 AC-2 (Rejected); REQ-OPC-026 AC-4; REQ-OPC-039 AC-1
- Failure classification: PRODUCT_BUG
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.
- Expected vs actual (observed): Step 3: the Edit form of a Rejected record offers Cancel, Approve AND Reject to ADMIN_ALL; the case expects exactly Approve and Cancel, with no Reject. The list row of the same record offers only Approve.
- Suspected cause (unconfirmed): The Edit form appears to choose its actions from the user's permissions only, not from the record's approval status (unconfirmed).
- Bug Candidate: BUG-002

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | *Pending / Inactive* | Maker created AUT Opc Syhidmpu with Send For Approval → Pending / Inactive (id 20050). | PASS |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, reject RUN-NAME with the reject remarks | *Rejected / Inactive* | Approver rejected it with "Rejected by QA" → Rejected / InActive. | PASS |
| 3 | As `ADMIN_ALL`, open RUN-NAME's Edit form | The actions are exactly **Approve** and **Cancel** — **no Reject** | ADMIN_ALL Edit form: actions are Cancel, Approve AND Reject (subtitle "You decide on this operating country when you save."). Reject should not be offered. | FAIL |
| 4 | Check the Remarks field | Pre-filled with `Rejected by QA` (REQ-OPC-018 AC-5) | Remarks pre-filled with "Rejected by QA". | PASS |
| 5 | Replace the remarks and click Approve | A success confirmation is displayed | Remarks "Re-approved by QA", Approve (+ confirm) → toast "Success — Operating Country approved successfully". | PASS |
| 6 | Search the default list for RUN-NAME | **Approved / Active** | Default list → AUT Opc Syhidmpu, Approved / Active. | PASS |

Evidence:
- `evidence/TC-52857-037-step3-rejected-edit-offers-reject.png` — Step 3 — Edit form of the Rejected record showing Cancel / Approve / Reject

### TC-52857-038 — PASS

[NBO][Company][Operating Country Approval] Verify an Approved record becomes Rejected and Inactive and leaves the default list when an all-permission user rejects it

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-026 AC-2, AC-4; REQ-OPC-046 AC-2 (Approved)
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `ADMIN_ALL`, create RUN-NAME with Approve | *Approved / Active* | ADMIN_ALL created AUT Opc Okifhaxt with Approve → Approved / Active (id 20030). | PASS |
| 2 | Click **Reject** on RUN-NAME's row, enter the remarks, and confirm | A success confirmation is displayed — record its exact text | Row Reject → dialog "Reject AUT Opc Okifhaxt?" with "Reason (required)"; reason "Withdrawn by QA", confirm → PUT 200; toast "Success — Operating country rejected successfully". | PASS |
| 3 | Search the default (Active) list for RUN-NAME | Not listed | Active search "Okifhaxt" → not listed. | PASS |
| 4 | Search the Inactive list for RUN-NAME | **Rejected / Inactive** | Inactive search → Rejected / InActive. | PASS |

### TC-52857-039 — FAIL

[NBO][Company][Operating Country Status] Verify an Approver's confirmed deactivation makes the record Inactive and Activate restores it to Active without a confirmation

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-030 AC-4, AC-5, AC-7, AC-8, AC-9, AC-10; story Lifecycle AC-3…AC-5
- Failure classification: PRODUCT_BUG
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.
- Expected vs actual (observed): Step 6: clicking Activate opens a confirmation dialog "Activate AUT Opc Mnyftfxg?" ("The record becomes active immediately. You can deactivate it again later.") with Cancel / "Activate Operating country"; the record becomes Active only after confirming. The case expects activation without a confirmation step (REQ-OPC-030 AC-10).
- Suspected cause (unconfirmed): The Activate action appears to reuse the Deactivate confirmation pattern; whether it is a deliberate UI decision is undecided (unconfirmed).
- Bug Candidate: BUG-001

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `ADMIN_ALL`, create RUN-NAME with Approve | *Approved / Active* | ADMIN_ALL created AUT Opc Mnyftfxg with Approve (13:26Z) → Approved / Active (id 20036). | PASS |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, click **Deactivate** on RUN-NAME | A confirmation is requested before anything changes — record the full warning text | Approver Deactivate → confirmation requested before any change: "Deactivate AUT Opc Mnyftfxg?" — "The operating country stops appearing for selection. You can reactivate it later." (Cancel / "Deactivate Operating country"). | PASS |
| 3 | Confirm | A result message is shown — record its text | Confirmed → PATCH …/status 200; toast "Success — Operating country deactivated successfully". | PASS |
| 4 | Search the default (Active) list for RUN-NAME | Not listed | Active search → not listed. | PASS |
| 5 | Search the Inactive list for RUN-NAME | Approval Status **Approved**, Status **Inactive**; an **Activate** action is offered | Inactive search → Approved / InActive; actions Reject and Activate. | PASS |
| 6 | Click **Activate** | The record becomes Active **without** a confirmation step (REQ-OPC-030 AC-10) | Activate → a confirmation dialog "Activate AUT Opc Mnyftfxg?" appeared (Cancel / "Activate Operating country"); nothing changed until it was confirmed. | FAIL |
| 7 | Search the default list for RUN-NAME | **Approved / Active** | After confirming: toast "Success — Operating country activated successfully"; default list → Approved / Active. | PASS |

Evidence:
- `evidence/TC-52857-039-step6-activate-confirmation.png` — Step 6 — confirmation dialog shown on Activate

### TC-52857-040 — PASS

[NBO][Company][Operating Country Status] Verify a Maker can deactivate an Approved record to Inactive and activate it back to Active

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-030 AC-4
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `ADMIN_ALL`, create RUN-NAME with Approve | *Approved / Active* | ADMIN_ALL created AUT Opc Fybfrrhp with Approve (13:26Z) → Approved / Active (id 20037). | PASS |
| 2 | As `OPERATING_COUNTRIES_MAKER`, click **Deactivate** on RUN-NAME and confirm | The deactivation succeeds — no permission error | Maker Deactivate + confirm → PATCH …/status 200; toast "Success — Operating country deactivated successfully"; no permission error. | PASS |
| 3 | Search the Inactive list for RUN-NAME | **Approved / Inactive**; **Activate** is offered to the Maker | Inactive search → Approved / InActive; Activate offered to the Maker. | PASS |
| 4 | Click **Activate** | The activation succeeds | Activate (+ confirm) → PATCH 200; toast "Success — Operating country activated successfully". | PASS |
| 5 | Search the default list for RUN-NAME | **Approved / Active** | Default list → Approved / Active. | PASS |

Observations (unverified, not results):
- Activate asked for confirmation ("Activate AUT Opc Fybfrrhp?") — this case does not assert it; the same behaviour fails TC-52857-039 (BUG-001).

### TC-52857-041 — PASS

[NBO][Company][Operating Country Status] Verify an Approved record stays Active when Deactivate is clicked and the confirmation is cancelled

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-030 AC-9; story Lifecycle AC-5
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `ADMIN_ALL`, create RUN-NAME with Approve | *Approved / Active* | ADMIN_ALL created AUT Opc Owpbmnnx with Approve (13:26Z) → Approved / Active (id 20038). | PASS |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, click **Deactivate** on RUN-NAME, then cancel the confirmation | The confirmation closes | Approver Deactivate → dialog "Deactivate AUT Opc Owpbmnnx?" → Cancel → dialog closed; no PATCH sent. | PASS |
| 3 | Search the default list for RUN-NAME | Still **Approved / Active** | Default list → still Approved / Active. | PASS |

### TC-52857-042 — PASS

[NBO][Company][Operating Country Status] Verify no Activate action is offered on a Pending or a Rejected record to any role

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-030 AC-5, AC-6; story Lifecycle AC-2
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME and RUN-NAME-2 with Send For Approval | Both *Pending / Inactive* | Maker created AUT Opc Pbeutfmx and AUT Opc Hpkbyyez with Send For Approval → both Pending / Inactive (ids 20051, 20052). | PASS |
| 2 | As `OPERATING_COUNTRIES_APPROVER`, reject RUN-NAME-2 with remarks | RUN-NAME-2 *Rejected / Inactive* | Approver rejected AUT Opc Hpkbyyez with "Rejected by QA" → Rejected / InActive. | PASS |
| 3 | In the Inactive list, inspect both rows as `OPERATING_COUNTRIES_APPROVER` | Neither row offers **Activate** | Approver, Inactive list: Pbeutfmx (Pending) offers Approve, Reject; Hpkbyyez (Rejected) offers Approve; neither offers Activate. | PASS |
| 4 | Repeat as `OPERATING_COUNTRIES_MAKER` and as `ADMIN_ALL` | Neither row offers **Activate** to either role | Maker: both rows offer only Edit. ADMIN_ALL: Pbeutfmx offers Edit, Approve, Reject; Hpkbyyez offers Edit, Approve. No Activate for either role. | PASS |

### TC-52857-043 — PASS

[NBO][Company][Operating Country List] Verify the list page shows the Operating Country heading and the Name, Country, Currency, Approval Status, Status and Actions columns

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-019 AC-1, AC-4; REQ-OPC-045
- Failure classification: —
- Precondition check: The CSV Precondition cell reads "#NAME?" (spreadsheet formula corruption) — no precondition could be read; the case was run on its Test Data and steps.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL` and open the list page | The page heading reads **Operating Country** | ADMIN_ALL list page heading reads "Operating Country". | PASS |
| 2 | Read the column headings | **Name**, **Country**, **Currency**, **Approval Status**, **Status**, **Actions** | Columns: Name, Country, Currency, Approval Status, Status, Actions. | PASS |
| 3 | Read the filter labels | **Operating Country Name**, **Country**, and the Active / Inactive / Both toggle | Filters: "Operating Country Name", "Country", and the Active / Inactive / Both toggle. | PASS |

### TC-52857-044 — PASS

[NBO][Company][Operating Country List] Verify the list opens on Active records, 10 rows per page, page 1, ordered by last change, with the record count shown

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-021 AC-1; REQ-OPC-022 AC-1, AC-4; REQ-OPC-023 AC-1; REQ-OPC-019 AC-3
- Failure classification: —
- Precondition check: As stated: - None (read-only).

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL` and open the list page | The **Active** toggle is selected; every row's Status is **Active** | Active toggle selected; all 7 rows Active (13:13Z). | PASS |
| 2 | Inspect the pagination area | Rows per page is **10**; page **1** is current; a *"Showing x to y of z"* summary and a record count are shown | Rows per page 10; page 1 current; "Showing 1 to 7 of 7" and the count "7 operating countries" shown. | PASS |
| 3 | Open each record's Edit form in turn, or compare with a record just changed | Rows are ordered most recently changed first. **Practical check:** the most recently created or changed record is the first row | After TC-52857-014 created AUT Opc Rokkqmxm (13:20Z) it was the first row of the default list — most recently changed first. | PASS |

### TC-52857-045 — PASS

[NBO][Company][Operating Country List] Verify searching by part of a name in any letter case lists every Operating Country containing it

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-020 AC-1; story Listing AC-2
- Failure classification: —
- Precondition check: As stated: - Records whose names contain "gyp" exist (STG: Egypt, EgyptWTNBO, Egypt_WT_NBO).

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL`, type `GYP` in the name filter and click Search | Every Active record whose name contains "gyp" in any case is listed, and only those | "GYP" → Egypt_WT_NBO, EgyptWTNBO, Egypt — every Active name containing "gyp" in any case, and only those. | PASS |
| 2 | Read the record count | It equals the number of rows listed | Count "3 operating countries" equals the 3 rows listed. | PASS |

### TC-52857-046 — PASS

[NBO][Company][Operating Country List] Verify searching for an underscore or a percent sign returns only names that actually contain that character

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-020 AC-6
- Failure classification: —
- Precondition check: As stated: - At least one Active record name contains `_` (STG: Egypt_WT_NBO), and at least one does not.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL`, search for `_` | Only names containing an underscore are listed | "_" → only Egypt_WT_NBO. | PASS |
| 2 | Search for `%` | Only names containing `%` are listed — none on STG today, so the "no results" state is shown | "%" (sent as Name=%25) → "No operating countries match these filters". | PASS |

### TC-52857-047 — PASS

[NBO][Company][Operating Country List] Verify choosing a Country in the filter lists only the Operating Countries bound to that Country

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-020 AC-2
- Failure classification: —
- Precondition check: As stated: - Records bound to Egypt and to other countries exist (STG: yes).

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL`, select **Egypt** in the Country filter and click Search | Every listed row shows Country **Egypt** | Country filter Egypt → 3 rows, every one with Country Egypt. | PASS |
| 2 | Click Reset and Search | Records bound to other countries are listed again | Reset + Search → 7 rows including records bound to Kuwait, United States, United Arab Emirates and Saudi Arabia. | PASS |

### TC-52857-048 — PASS

[NBO][Company][Operating Country List] Verify the Inactive filter lists only Inactive records and Both lists Active and Inactive records together

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-020 AC-3
- Failure classification: —
- Precondition check: As stated: - At least one Inactive record exists. Create one in step 1.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | As `OPERATING_COUNTRIES_MAKER`, create RUN-NAME with Send For Approval | A *Pending / Inactive* record exists | Maker created AUT Opc Wjwmnnpm with Send For Approval → Pending / Inactive (id 20053). | PASS |
| 2 | As `ADMIN_ALL`, select **Inactive** and click Search | Every listed row's Status is **Inactive**; RUN-NAME is included | ADMIN_ALL Inactive + Search → 17 records; every row on page 1 InActive; AUT Opc Wjwmnnpm included. | PASS |
| 3 | Select **Both** and click Search | Active and Inactive rows are both listed; the count is at least the Active count plus one | Both + Search → 39 records (Active 22 + Inactive 17, ≥ Active + 1); Active and InActive rows listed together. | PASS |

### TC-52857-049 — PASS

[NBO][Company][Operating Country List] Verify the no-results message appears when the name search matches no Operating Country

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-020 AC-4; REQ-OPC-042 AC-5
- Failure classification: —
- Precondition check: As stated: - No record name contains `zzqx`.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL`, type `zzqx` in the name filter and click Search | No rows; the message *"No operating countries match these filters"* is shown | "zzqx" → no rows; "No operating countries match these filters" (+ "Nothing matches the current filters. Change them, or clear them to see all operating countries."). | PASS |

### TC-52857-050 — PASS

[NBO][Company][Operating Country List] Verify an inactive Country is absent from the list page's Country filter while it is offered on the Add form

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-020 AC-7
- Failure classification: —
- Precondition check: OPC_COUNTRY_INACTIVE verified read-only at 13:14–13:15Z: Rejected / InActive in the Country master.

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL`, open the list page's Country filter and type the inactive Country's name | It is **not** offered | List-page Country filter: the inactive Country (OPC_COUNTRY_INACTIVE) is not offered; type-ahead lands on a different entry. | PASS |
| 2 | Open the Add form's Country list and type the same name | It **is** offered (contrast — the Add form lists are unfiltered) | Add form Country list: the inactive Country is offered and type-ahead lands on it. | PASS |
| 3 | Click Cancel | Nothing is created | Cancel → list, still 7 records; nothing created. | PASS |

### TC-52857-051 — PASS

[NBO][Company][Operating Country List] Verify moving to page 2 keeps the search criteria and continues the most-recent-first order from page 1

- Azure DevOps ID: —
- Requirement reference: REQ-OPC-022 AC-1, AC-2, AC-4; REQ-OPC-023 AC-2, AC-3
- Failure classification: —
- Precondition check: 39 records match Both (more than 10) — no records created (D-09).

| # | Action | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Log in as `ADMIN_ALL`, select **Both** and click Search | Page 1 shows 10 rows; the summary shows the total and Next is enabled | Both + Search → page 1: 10 rows, "Showing 1 to 10 of 39", Next enabled. | PASS |
| 2 | Click **Next Page** | Page 2 is current; the **Both** filter is still applied; rows continue the order from page 1, with no row repeated | Next Page → "Showing 11 to 20"; Both still applied (no Status parameter); 10 rows, none repeated from page 1; order continues most-recent-first. | PASS |
| 3 | Click **First Page** | Page 1 shows the same 10 rows as before | First Page → "Showing 1 to 10"; the same 10 rows in the same order. | PASS |

## Run observations (unverified, not results)

- The CSV Precondition cell of 32 cases reads "#NAME?" — a spreadsheet turned lines beginning "- " into formulas: TC-52857-004, TC-52857-006, TC-52857-008, TC-52857-009, TC-52857-010, TC-52857-011, TC-52857-012, TC-52857-013, TC-52857-014, TC-52857-015, TC-52857-016, TC-52857-020, TC-52857-021, TC-52857-024, TC-52857-025, TC-52857-027, TC-52857-028, TC-52857-029, TC-52857-030, TC-52857-031, TC-52857-032, TC-52857-033, TC-52857-034, TC-52857-035, TC-52857-036, TC-52857-037, TC-52857-038, TC-52857-039, TC-52857-040, TC-52857-041, TC-52857-042, TC-52857-043. The CSV was not modified; the content needs restoring by a human.
- Execution paused from about 13:35Z to 17:13Z. The first action after the pause (TC-52857-030 step-1 setup) got HTTP 401 on create and on token refresh and returned to the login page; no record was written. After a fresh login the create was repeated. Session expiry after inactivity — not a result for any case.
- Every Approve, Send For Approval, Update, Deactivate and Activate opens a confirmation dialog before anything is saved; only TC-52857-039 asserts the absence of one (BUG-001).
- Labels as rendered: Approval Status "Pending" (not "Pending for Approval"), Status "InActive".
- Short-lived toasts that had closed before they could be read (TC-52857-014 step 3, TC-52857-027 step 3) were read from the MCP page snapshot taken immediately after the click; the text is quoted as captured.
- Durations are not recorded per case: setup and verification spanned several account sessions (null in this record).
- Records left on STG (created in this run, never deleted — records cannot be deleted; no cleanup was requested). Approved / Active: AUT Opc Rokkqmxm 20026, Isyklodt 20027, Huuxhlei 20028, Nyzsjzmv 20029, Auzfaiut 20031, Rqiuybio 20032, Ustqndtg 20033, Ussruvab 20034, Hbvdwbny 20035, Mnyftfxg 20036, Fybfrrhp 20037, Owpbmnnx 20038, Owkqucho 20044, Frpwmqqc 20049, Syhidmpu 20050. Pending / Inactive: Sapodsyv 20039, Cdnohiej 20040, Aqsubnkt 20041, Dmnelxxy 20042, Dkiiyhmi 20043, Fxbugniz 20046, Wrtfoypv 20047, Uediodof 20048, Pbeutfmx 20051, Wjwmnnpm 20053. Rejected / Inactive: Okifhaxt 20030, Qfkdpedm 20045, Hpkbyyez 20052.
## Post-run review — Bug Candidates resolved as NOT A BUG (2026-10-10)

Added after the run. **Nothing above this section was changed:** the case results, step tables,
classifications and counts are the run as executed (49 PASS, 2 FAIL).

The human reviewed both Bug Candidates of this run. Verbatim: *"I reviewed BUG-001 and BUG-002
from the US-52857 manual execution, and I confirm that neither is a product bug. The observed
behaviors are correct."*

| Bug Candidate | Test Case | Result in this run (unchanged) | Disposition | Decision | Corrected expectation now in the CSV |
|---|---|---|---|---|---|
| BUG-001 | TC-52857-039 | FAIL (`PRODUCT_BUG`) at step 6 | **NOT A BUG** — invalid bug report | D-18 | Activate asks for a confirmation; once confirmed, the record becomes Active |
| BUG-002 | TC-52857-037 | FAIL (`PRODUCT_BUG`) at step 3 | **NOT A BUG** — invalid bug report | D-19 | The all-permission Edit form of a Rejected record offers Cancel, Approve and Reject |

- The two FAILs stand as recorded: each was a correct execution of the expectation the CSV held at
  the time. They are **not** re-graded as PASS — the corrected expectations have not been executed.
  A new run (RUN-002 or later) is needed to execute them.
- Both Bug Candidate files keep their original content below a Resolution section, with their
  evidence. Their status is *Resolved — NOT A BUG*; neither is ever passed to `/publish-bug`.
- `execution-results.json` records the same resolution on each Bug Candidate entry (status
  `Not a Bug`, with the human's resolution). Its `results` are byte-identical to the run's.
- The CSV changed after the run (TC-52857-037 and -039 only), so `manual-report.html` flags the CSV
  as changed since this run; its step tables show the cases as executed.
