# Test Cases — US 52860: City (Geo-Location Master Data)

**Status:** generated from the completed Requirement Analysis, AI self-review complete, human
review applied (findings F-1…F-12), and **HUMAN-APPROVED on 2026-08-18 (all 35)**, and **PUBLISHED to Azure DevOps on 2026-08-18 as 35
child Test Case work items of US 52860 (IDs 55648–55683).** Publication verified.

**Approval record** — the authority for every `Approved` status below:

| | |
|---|---|
| Approved by | Human statement in session, 2026-08-18 — *"All 35 Test Cases are approved as content."* |
| Scope of the approval | **All 35** cases, TC-52860-001 … TC-52860-035, as written at this revision |
| Rejected / needs changes | **None** |
| Preceded by | A detailed human review of TC-004, TC-013, TC-033, TC-034 plus a full-set verification; 12 findings raised and applied (see the AI self-review record) |
| Publish authorized by | A **second, separate** human statement in session, 2026-08-18 — *"publish all 35"* — given after the full dry run was shown, including the exact `POST` body (invariant 2) |
| Published | **35 of 35**, 0 failures, 0 duplicates, 0 reconciled. IDs **55648 … 55683** |
| Publish method | `npm run testcases:publish -- 52860 --confirm` — one item per request, no retries, each ID written into this file before the next create was attempted |
| Verified | Independently re-verified via `--verify`: all 35 exist as children of 52860, are of type `Test Case`, and their titles and step counts match this artifact |
| Re-running the publisher | Safe. It now reports *to publish 0 / already published 35* and **cannot** create duplicates |
| If any case changes | A materially edited case **loses this approval** and must be re-approved before publishing |

**Scope: CITY ONLY [D-01].** The attached specification documents three features (City,
Region, State). Country, State and Region produce **no** test case here — they appear only
as preconditions and test data for City. See *Deliberately not covered* for the full
exclusion list.

| | |
|---|---|
| Azure DevOps work item | **52860** — `[INT] Master-Miscellaneous-City "Q3-API-INTE-033"` (User Story) |
| Requirement analysis | [`../../requirements/US-52860/requirement-analysis.md`](../../requirements/US-52860/requirement-analysis.md) |
| Confirmed human decisions | [`../../requirements/US-52860/decisions.md`](../../requirements/US-52860/decisions.md) — D-01…D-05 |
| Source snapshot — Requirement | [`../../requirements/US-52860/source/Geo-Master-Requirements-City-Region-State.md`](../../requirements/US-52860/source/Geo-Master-Requirements-City-Region-State.md) |
| Source snapshot — Change Request | [`../../requirements/US-52860/source/City-CR.md`](../../requirements/US-52860/source/City-CR.md) |
| Work item revision at generation | **rev 16** |
| Content fingerprint at generation | `e5dceedf3d5acb343458fad92234188c7c71b1d8def41d88a736d02641bb14b6` |
| Attachment sha256 — Requirement | `327233ed48339240d40f267729745548cd098d0aaecde7475c529690ee3bca4d` |
| Attachment sha256 — Change Request | `34c6c33d03842f0ed32f724530a7ad8e93ac1f59443ae5faae17785a22df40a7` |
| Generated | 2026-08-18 — from the local analysis and decisions only; Azure DevOps was **not** re-read |
| Test scope | **UI only** — see *Test scope* below |
| Target environment | **STG** (the only allowed environment) |
| Test cases | **35** (TC-52860-001 … TC-52860-035) — **all 35 Published**, 0 rejected, 0 needing changes |
| Published to Azure DevOps | **All 35**, 2026-08-18, as child Test Case work items of US 52860 — IDs **55648 … 55683** (one per case in artifact order; 55676 is not ours — Azure DevOps allocated it elsewhere) |
| Publish verification | Passed — `npm run testcases:publish -- 52860 --verify` |

**If the fingerprint above ever differs from a fresh `npm run story:read -- 52860`, these
test cases are stale** — re-run the analysis, diff the source snapshot, and revise before
executing (`docs/product-decisions.md` §14).

### Test scope

The analysis records **OQ-02 as unresolved**: the story title says `[INT]` /
`Q3-API-INTE-033` (an API-integration story) while its acceptance criteria describe a UI
create form. No human decision has been made.

**These cases are written as UI cases**, because every acceptance criterion in the User
Story describes UI behaviour (a Country control, a State control, a read-only dimmed State
Code field, buttons). Requirements that **only** a lower layer can verify —
`REQ-CIT-017` back-end enforcement and `REQ-CIT-015` payload tampering — are recorded as a
**known gap** in *Deliberately not covered*, not silently dropped (skill Step 6 rule 9).

---

## How to read this file

Fields follow `docs/product-decisions.md` §3. Titles follow the mandatory
`[Project][Module][Feature/Page] <Scenario>` convention and are **generated from** the
structured fields — grouping and filtering rely on the fields, never on parsing the title.

### Review/Lifecycle Status vocabulary

Per `docs/product-decisions.md` §6.1.

| Status | Meaning | Who may set it |
|---|---|---|
| `Draft` | Generated, not yet self-reviewed | Agent |
| `AI-Reviewed` | Passed the agent self-review; awaiting human review | Agent |
| `Needs-Changes` | The human asked for changes | Agent, **only** on an explicit human statement |
| `Approved` | The human explicitly approved this test case | **Human statement only** — the agent must never set this |
| `Published` | Created in Azure DevOps; the Azure DevOps ID field is filled | Agent, **only** after a confirmed write |
| `Rejected` | The human rejected this test case | Agent, **only** on an explicit human statement |

**Every case in this file is `Published`** — approved by the human statement recorded above, then created in Azure DevOps. Each case's `Azure DevOps ID` field holds its work item ID.

**Azure DevOps is now the official record for these Test Cases** (`docs/product-decisions.md` §13). Any divergence between this file and a published item is a **human decision** — never silently overwrite either side.

### Revision history

| Date | Change |
|---|---|
| 2026-08-18 | Initial generation — 34 cases, AI self-review complete |
| 2026-08-18 | **PUBLISHED** — 35 of 35 created as children of US 52860, IDs 55648–55683. 0 failures, 0 duplicates. Verified |
| 2026-08-18 | **All 35 approved by the human** as content. Statuses set `AI-Reviewed` → `Approved`. No content changed by this transition |
| 2026-08-18 | **Human review applied** (11 findings F-1…F-11). TC-004, TC-012, TC-013, TC-021, TC-033 modified · TC-034 **split** into TC-034 (no delete/import/export) + **new TC-035** (Cancel on Edit City) · prerequisites table corrected. Nothing removed. **35 cases.** The three approved decisions are unchanged: uniqueness is **global** [D-03], City Name accepts **letters + spaces** [D-04], scope is **City only** [D-01] |

### Conventions these cases rely on

- **Message text is never invented.** The sources define only the *sense* of two messages
  (`REQ-SHR-006`: *"code already exists"* / *"name already exists"*). Everywhere else the
  expected result is that **an appropriate validation message or field-level feedback is
  displayed, identifying the field** — a missing message is a defect; differently worded
  appropriate text is not (skill Step 6 rule 2, **OQ-09**).
- **Every case is independently executable** (`docs/product-decisions.md` §4). A case
  needing a pre-existing City creates it in its own steps.
- **Unique data is generated at run time.** Where a case needs a City Code or Name that
  does not already exist, `<unique>` means a run-time-generated token (for example a short
  timestamp suffix). This is required because uniqueness is **global** [D-03] — a fixed
  literal would collide with the previous run.
- **No credentials, no URLs.** Accounts are referenced only by the handles in the
  prerequisites table, resolved from environment configuration.
- **BLOCKED, not FAIL.** Where a case needs a prerequisite that may not exist, the case
  says so explicitly; its absence makes the result **BLOCKED**
  (`docs/product-decisions.md` §8), never FAIL.
- **State left behind is stated.** Cases that create or modify a City say what state they
  leave, so the next case is not corrupted.

---

## Environment and test data prerequisites

**None of these is confirmed to exist in STG** (analysis **OQ-12**). Each one absent makes
the cases that need it **BLOCKED**, not FAIL.

| Handle | What it must be | Used by | Constraint |
|---|---|---|---|
| `CITY_USER_APPROVER` | A user **with** City approval authority | 001, 003, 004, 006, 007, 008, 010, 011, 012, 013, 014, 015, 016, 018, 019, 022, 024, 025, 026, 028, 031, 032, 033, 034, 035 | Required by `REQ-CIT-011`. Absent → BLOCKED |
| `CITY_USER_MAKER` | A user **without** City approval authority | 002, 005, 009, 014, 015, 016, 017, 020, 021, 023, 027, 029, 030 | Required by `REQ-CIT-011`. Absent → BLOCKED |
| `COUNTRY_A` | An Active, Approved Country | almost every case | Precondition per `REQ-REL-001` |
| `COUNTRY_B` | A **second** Active, Approved Country, different from `COUNTRY_A` | 011, 012 | Needed to prove story AC-4 |
| `STATE_A1` | An Active, Approved State belonging to `COUNTRY_A`, with a known State Code | most cases | Its code is asserted in 010 |
| `STATE_A2` | A **second** Active State under `COUNTRY_A`, code different from `STATE_A1` | 007, 010, 025 | Needed for global-uniqueness proof [D-03] and state-code refresh |
| `STATE_B1` | An Active State belonging to `COUNTRY_B` | 011, 012 | The state-not-in-country negative |
| `STATE_INACTIVE` | An **Inactive** State under `COUNTRY_A` | 024 | `REQ-REL-003` AC1. Creating/deactivating a State may need State permissions → BLOCKED if unavailable |
| ~~`CITY_EXISTING`~~ | **No longer required by any case.** Every case that needs a pre-existing City now creates it in its own steps | — | **Removed** by review finding F-10. It previously listed cases 006, 007, 017, 018 and 019, all of which are self-provisioning — an executor would have seeded data no case uses |
| `CITY_LIST_10PLUS` | More than 10 Cities matching one search filter | 022 | `REQ-SHR-008` AC3 default page size 10. Absent → BLOCKED |

**Deliberately absent from this table:** any password, any base URL, any Azure DevOps
credential. Environment configuration supplies them (invariant 7).

### Side effects and shared state

| Case | Creates | Leaves behind |
|---|---|---|
| 001, 002 | one City each | 001 → Approved+Active · 002 → Pending+Inactive |
| 003, 013, 014, 025 | one City each | Approved+Active (or as stated) |
| 004…012, 026…030 | nothing (validation rejected, or cancelled) | nothing |
| 006, 007 | two Cities (the original, then the duplicate attempt fails) | one City |
| 015, 016 | one City | 015 → Approved+Active · 016 → **Rejected+Inactive** |
| 017 | one City | Active+Approved, **amended** |
| 018, 019 | one City | 018 → Active+Approved (re-approved) · 019 → **Rejected+Inactive** |
| 020, 021 | one City | 020 → Pending+Inactive · 021 → Pending+Inactive |
| 034, 035 | one City each | 034 → Approved+Active · 035 → Approved+Active with its **original** name (the assertion) |

`[Note]` **No case depends on another's residue.** The table exists so an executor knows
what accumulates in STG across a full run, not because any case reads it.

---

## Coverage map

Requirement → the cases that cover it. `S-nn` are the scope items from the analysis §6.

| Requirement | Scope item | Test cases |
|---|---|---|
| REQ-CIT-001 — City attributes; exactly one country + one state | S-01 | 001, 003, 031 |
| REQ-CIT-002 — City Code: mandatory, unique, alphanumeric, 1–50 | S-02 | 004, 006, 026, 027, 028 |
| REQ-CIT-003 — City Name: mandatory, unique, 1–125, letters+spaces | S-03 | 004, 005, 007, 029, 030 |
| REQ-CIT-004 (amended) — Create City | S-04 | 001, 002, 003 |
| REQ-CIT-005 — Retrieve City by identifier, incl. not-found | S-05 | 031, 032 |
| REQ-CIT-006 AC4 — resolved Country name in each list row | S-06 | 028 |
| REQ-CIT-006 — Search/list: filters, case-insensitive partial, pagination, country name | S-06 | 022, 023, 028, 033 |
| REQ-CIT-007 (amended) — Update City | S-07 | 017, 018, 019, 020 |
| REQ-CIT-008 — Activate/deactivate; Active only when Approved | S-08 | 013, 014, 034 (action exists) |
| REQ-CIT-009 (amended) — Approve / reject | S-09 | 015, 016, 019 |
| REQ-CIT-010 / REQ-REL-003 AC1 — Inactive State hides its Active Cities | S-10 | 024 |
| REQ-CIT-011 — Approval authority governs available actions | S-11 | 001, 002, 017, 018, 020, 021 |
| REQ-CIT-012 — Status of a new City | S-12 | 001, 002 |
| REQ-CIT-013 — An approver's save on an Active City *is* the decision | S-13 | 018, 019 |
| REQ-CIT-014 — Button matrix (4 of 5 rows; row 6 absent) | S-14 | 001, 002, 018+019, 020, 021 |
| REQ-CIT-015 — Status from the button, not the submission | S-15 | **not covered** — see gaps |
| REQ-CIT-016 — Cancel present, first, saves nothing | S-16 | 008, 009, **035** |
| REQ-CIT-017 — Matrix enforced back end too | S-17 | **not covered** — see gaps |
| REQ-SHR-001 — Active only when Approved; states stored separately | via S-08/S-12 | 001, 002, 013, 014 |
| REQ-SHR-002 (overridden AC1/AC2/AC5 for City) | via S-04/S-07 | 001, 002, 017, 020 |
| REQ-SHR-003 — Pending record not editable by a non-approver | — | **not covered** — conflicts with CR (OQ-07, D-05) |
| REQ-SHR-004 (overridden by CR C-3) | via S-13 | 018, 019 |
| REQ-SHR-005 — Audit trail on a City | S-22 | 003, 015, 016, 017 |
| REQ-SHR-006 — Uniqueness of code and name (**global** [D-03]) | S-02, S-03 | 006, 007, 025 |
| REQ-SHR-007 — Case-insensitive partial search | via S-06 | 023 |
| REQ-SHR-008 — Pagination, totals, default size 10 | via S-06 | 022 |
| REQ-SHR-009 — Default field values on a City | S-23 | **not covered** — not observable (OQ-10) |
| REQ-SHR-010 — Approver-role search filter | — | **not covered** — semantics undefined (OQ-05) |
| REQ-SHR-011 — No hard delete / import / export on City | — | 034 (UI only — API absence not asserted, gap G-12) |
| REQ-CIT-006 AC1 — owning-state **code** and **identifier** as separate filters | S-06 | 033 steps 4–5 |
| REQ-REL-001 — City needs a valid owning State and Country | S-20 | 004, 011, 012 |
| Story AC-1 / AC-2 — the four mandatory inputs | S-04 | 001, 004 |
| Story AC-3 — State Code auto-displayed, read-only / dimmed | S-19 | 010 |
| Story AC-4 — selected State must belong to selected Country | S-20 | 011, 012 |
| Story AC-5 — *"unique within the selected state"* | — | **superseded by [D-03]** — 025 proves the global rule instead |
| Story AC-6 — saves when valid; validation message otherwise | S-21 | 001, 002, 004, 026…030 |
| Change Request C-1 — create with authority → Approved + Active | S-04, S-12 | 001 |
| Change Request C-2 — create without authority → Pending + Inactive | S-04, S-12 | 002 |
| Change Request C-3 — approver's save is the decision | S-13 | 018, 019 |
| Change Request C-4 — maker's update of Active stays Active | S-07 | 017 |
| Change Request C-5 — maker's update of Inactive resubmits | S-07 | 020, 021 |
| Change Request C-6 — Cancel saves nothing (amendment **and** decision) | S-16 | 008, 009, **035** |
| Change Request C-9 — self-approval; creator = approver | S-18 | 003 |

\* 024 covers `REQ-CIT-010` / `REQ-REL-003` AC1 via the active-geography view, not the
City list.

### Open questions and the cases that touch them

| Open question | Status | Case |
|---|---|---|
| OQ-03 — City Name format | **Closed by [D-04]** — letters + spaces | 005 asserts `New York` is valid; 029 asserts digits are rejected |
| OQ-04 — uniqueness scope | **Closed by [D-03]** — global | 025 asserts a duplicate under a *different* State is still rejected |
| OQ-06 — Update / authority=Yes / Inactive | **Open. Not tested [D-05]** | none — recorded as a gap |
| OQ-07 — which "Inactive" the maker-update row means | **Open. Not tested [D-05]** | 020 covers only the **unambiguous** Pending case; Rejected and Approved-but-deactivated are **not tested** |
| OQ-09 — exact message wording undefined | Open | handled by asserting *an appropriate message*, never wording |
| OQ-11 — no default sort order defined | Open | 022 asserts counts and totals, **never which rows land on page 2** |
| OQ-13 — is AC-4 enforced by filtering or by validation? | Open | 011 and 012 cover both enforcement shapes; neither asserts which one is used |
| OQ-18 — does Reject save or discard the amendment? | Open | 019 asserts the **status** outcome only, and explicitly asserts nothing about the amendment's persistence |
| OQ-19 — are approval remarks mandatory? | Open | no case asserts remarks are required; 015 records what the form offers |

---

## Deliberately not covered

Each gap, its requirement, why, and what would unblock it. Nothing here is silently
dropped.

| # | Requirement / area | Why not covered | What would unblock it |
|---|---|---|---|
| G-01 | **State** — `REQ-STA-001…010` (state attributes, state code rules, state name, create/retrieve/search/update/status/approve, list cities of a state) | **Out of scope [D-01].** Different entity. State appears only as City test data | A human decision widening scope |
| G-02 | **Region** — `REQ-REG-001…010`, `REQ-REL-002` | **Out of scope [D-01].** Different entity; not even part of the Country→State→City hierarchy | A human decision widening scope |
| G-03 | **Country** — all Country behaviour | **Out of scope [D-01].** The specification itself puts Country out of scope (§9) | A Country specification + a scope decision |
| G-04 | Shared rules `REQ-SHR-*` exercised **through a Region or State record** | **Out of scope [D-01].** Same rule, wrong entity. The City path **is** covered | A scope decision |
| G-05 | **`REQ-CIT-015`** — status derived from the button, never from the submission | Needs a **crafted request** that submits a status the button did not set. Not reachable from the UI, and the test scope is UI only | Resolving **OQ-02** (is an API in scope?) and an API test surface |
| G-06 | **`REQ-CIT-017`** — the matrix is enforced on the back end too | Same reason as G-05: proving server-side enforcement requires bypassing the UI, which draws only the allowed buttons | Resolving **OQ-02** and an API test surface |
| G-07 | **OQ-06** — Update / authority = Yes / Inactive City | **The Change Request has no such row** (WARN-016, High). **[D-05]: no Test Case, no invented Expected Result** | A human decision defining the buttons and outcome for that combination |
| G-08 | **OQ-07** — the *Update / No / Inactive* row applied to a **Rejected** City or an **Approved-but-deactivated** City | "Inactive" means three different things (WARN-017, High). **[D-05]: no Test Case, no invented Expected Result.** Case 020 covers only the unambiguous **Pending** reading | A human decision on which states that row governs |
| G-09 | **`REQ-SHR-003`** — a Pending City is not editable by a non-approver | **Directly contradicted** by the Change Request's *Update / No / Inactive* row, which resubmits Inactive records. Asserting either reading would be inventing an expected result. Part of OQ-07 / **[D-05]** | The same decision that closes OQ-07 |
| G-10 | **`REQ-SHR-009`** — site identifier defaults to 1 | **Not observable through the UI** (OQ-10). Skill Step 6 rule 4 forbids asserting what the UI cannot verify. The *dates* half is covered by 003 via the audit fields | A UI surface that displays the site identifier, or an API scope |
| G-11 | **`REQ-SHR-010`** — approver-role search filter | **Semantics undefined** (OQ-05, WARN-004). The source never says what is shown vs hidden, so no expected result exists | A human decision defining the filter's behaviour |
| G-12 | **`REQ-SHR-011`** — no hard delete, no bulk import, no export | A **negative absence** requirement. Covered as far as the UI can: 034 records the actions the City screen offers. No case asserts the absence of an API endpoint | An API scope (OQ-02) |
| G-13 | `REQ-REL-003` **AC2** — an Inactive **Country** hides its states and cities | Country-level assertion → out of scope [D-01]. AC1 (Inactive **State**) **is** covered by 024 | A scope decision |
| G-14 | `REQ-REL-004` — City as referenceable master data for other features (rules engines, custom fields, Knowledge Center, user addresses) | Each assertion lands in a **different feature**, not City. Out of scope [D-01] | Per-consumer stories |
| G-15 | `REQ-REL-005` — naming-prefix convention | A documentation convention, **not runtime behaviour**. Not testable | — |
| G-16 | **OQ-14** — may a deactivated City's code/name be reused? (WARN-005) | Undecided. Asserting either answer would invent a rule | A human decision |
| G-17 | **OQ-19** — whether approval remarks are mandatory | Undecided (WARN-019). `REQ-SHR-005` AC3 says remarks are *captured*, not *required* | A human decision |
| G-18 | Concurrency — two users acting on the same City at once | **No source requirement.** Inventing one is forbidden | A requirement |

`[Note]` **G-05 and G-06 are the substantive coverage cost of the UI-only scope**, and both
trace to the unresolved **OQ-02**. `REQ-CIT-015` and `REQ-CIT-017` are exactly the
Change Request's defence-in-depth requirements — the UI cannot prove them, because the UI
is the thing they distrust.

---

# The test cases

Grouped by requirement area, in a stable order. IDs are never reused or renumbered.

## Area 1 — Create City (REQ-CIT-004, CR C-1/C-2, story AC-1/AC-2/AC-6)

### TC-52860-001 — City created by an approver becomes Approved and Active in one step

| | |
|---|---|
| **Title** | `[NBO][City][Add City] Verify the City is created as Approved and Active in one step when a user with approval authority enters valid data and presses Approve` |
| Project / Module / Feature-Page | NBO / City / Add City |
| Test Type | Positive · Functional · State |
| Requirement Reference | REQ-CIT-004 (amended), REQ-CIT-011, REQ-CIT-012, REQ-CIT-014 row 1, Story AC-1, AC-2, AC-6; CR C-1 |
| Decisions Applied | D-01, D-02 |
| Azure DevOps ID | **55648** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER` (a user **with** City approval authority).
- `COUNTRY_A` exists, Active and Approved.
- `STATE_A1` exists, Active, and belongs to `COUNTRY_A`.

**Test Data**
- Country: `COUNTRY_A`
- State: `STATE_A1`
- City Name: `Testville <unique>` (letters and spaces only — valid per **[D-04]**)
- City Code: `TC<unique>` (alphanumeric, within 1–50)

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the Add City screen | The form is displayed with controls for Country, State, City Name and City Code |
| 2 | Observe the available buttons | **Cancel** and **Approve** are present. Cancel is **first**. **No** *Send for Approval* button is shown (CR matrix row 1) |
| 3 | Select Country `COUNTRY_A` | The Country is selected |
| 4 | Select State `STATE_A1` | The State is selected |
| 5 | Enter the City Name and City Code from Test Data | The values are accepted with no validation feedback |
| 6 | Press **Approve** | The City is saved and an appropriate success confirmation is displayed |
| 7 | Retrieve the created City and observe its approval state | Approval state is **Approved** |
| 8 | Observe its operational status | Operational status is **Active**. There is **no** intermediate Pending stage and **no** second approval step (CR C-1) |

**Notes**
- This is the single most important behaviour change in the Change Request. Under the
  original requirement (`REQ-CIT-004` AC1 / `REQ-SHR-002` AC1) the same action would
  produce **Pending + Inactive**. That reading is **superseded** [D-02] and asserting it
  would produce a false bug report.
- Leaves behind: one **Approved + Active** City.
- If `CITY_USER_APPROVER` does not exist in STG → **BLOCKED**, not FAIL.

---

### TC-52860-002 — City created by a maker becomes Pending for Approval and Inactive

| | |
|---|---|
| **Title** | `[NBO][City][Add City] Verify the City is created as Pending for Approval and Inactive when a user without approval authority enters valid data and presses Send for Approval` |
| Project / Module / Feature-Page | NBO / City / Add City |
| Test Type | Positive · Functional · State |
| Requirement Reference | REQ-CIT-004, REQ-CIT-011, REQ-CIT-012, REQ-CIT-014 row 2, REQ-SHR-001 AC2, REQ-SHR-002 AC1; CR C-2 |
| Decisions Applied | D-01, D-02 |
| Azure DevOps ID | **55649** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_MAKER` (a user **without** City approval authority).
- `COUNTRY_A` and `STATE_A1` exist as in TC-52860-001.

**Test Data**
- Country: `COUNTRY_A` · State: `STATE_A1`
- City Name: `Makertown <unique>` · City Code: `MK<unique>`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the Add City screen | The form is displayed |
| 2 | Observe the available buttons | **Cancel** and **Send for Approval** are present. Cancel is **first**. **No Approve button** is shown (CR matrix row 2) |
| 3 | Select `COUNTRY_A`, then `STATE_A1` | Both are selected |
| 4 | Enter the City Name and City Code from Test Data | The values are accepted with no validation feedback |
| 5 | Press **Send for Approval** | The City is saved and an appropriate success confirmation is displayed |
| 6 | Retrieve the created City and observe its approval state | Approval state is **Pending for Approval** |
| 7 | Observe its operational status | Operational status is **Inactive**. The City is **not** Active (`REQ-SHR-001` AC1/AC2) |

**Notes**
- This behaviour is **unchanged** by the Change Request (CR C-2) — it is the one create
  path the CR left alone.
- Leaves behind: one **Pending + Inactive** City.

---

### TC-52860-003 — Self-approval records the same user as creator and approver

| | |
|---|---|
| **Title** | `[NBO][City][Add City] Verify the creating user is recorded as both creator and approver when a user with approval authority creates and approves a City in one step` |
| Project / Module / Feature-Page | NBO / City / Add City |
| Test Type | Positive · Functional · Audit |
| Requirement Reference | REQ-SHR-005 AC1, AC3, REQ-SHR-002 AC5 (overridden for City), REQ-CIT-001; CR C-9 |
| Decisions Applied | D-01, D-02 |
| Azure DevOps ID | **55650** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `COUNTRY_A`, `STATE_A1` exist as above.

**Test Data**
- Country: `COUNTRY_A` · State: `STATE_A1`
- City Name: `Selfapproval <unique>` · City Code: `SA<unique>`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the Add City screen and enter the Test Data | The values are accepted |
| 2 | Press **Approve** | The City is saved successfully |
| 3 | Open the created City's details and observe the created-by and creation-date fields | Both are populated. Created-by is **`CITY_USER_APPROVER`** and the creation date is set automatically (`REQ-SHR-005` AC1) |
| 4 | Observe the approver identity and approval date | Both are populated. Approver is **`CITY_USER_APPROVER`** — **the same user as the creator** (CR C-9) and the approval date is set |
| 5 | Observe the persisted City attributes | City Code, City Name, owning Country and owning State all match the Test Data. The City references **exactly one** Country and **one** State (`REQ-CIT-001` AC2) |

**Notes**
- `REQ-SHR-002` AC5 requires the approver to be *"distinct from the identity of the
  creator/editor."* The Change Request **overrides** this for City: *"Self-approval is
  intended — the same user may create and approve; creator and approver are recorded as the
  same person."* [D-02]. **Asserting the specification's literal reading here would be
  wrong** — this is precisely the trap the self-review looked for.
- WARN-001 in the specification flagged approver self-re-approval as a control weakness to
  confirm at planning. The Change Request **confirms it as intended**, so it is a
  requirement now, not a defect.
- Leaves behind: one **Approved + Active** City.

---

### TC-52860-004 — Create is rejected when a mandatory field is empty

| | |
|---|---|
| **Title** | `[NBO][City][Add City] Verify the City is not created and a validation message is displayed when Country, State, City Name, or City Code is left empty` |
| Project / Module / Feature-Page | NBO / City / Add City |
| Test Type | Negative · Validation |
| Requirement Reference | REQ-CIT-002 AC1, REQ-CIT-003 AC1, REQ-REL-001 AC1, Story AC-2, AC-6 |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55651** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `COUNTRY_A`, `STATE_A1` exist.

**Test Data**
- **Rejection baseline** — used in steps 1–4, each time with exactly one field omitted:
  Country `COUNTRY_A`, State `STATE_A1`, City Name `Validname <unique>`,
  City Code `VC<unique>`.
- **Control data** — used only in step 5, and **deliberately distinct** from the rejection
  baseline: City Name `Controlcity <unique>`, City Code `CTRL<unique>`.
  Steps 1–4 must never persist anything, so reusing the rejection baseline in step 5 would
  make the control collide with a **previous run's** residue and fail for the wrong
  reason.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the Add City screen. Enter the valid baseline but leave **City Code** empty. Submit | The City is **not** created. An appropriate validation message identifies **City Code** as required |
| 2 | Enter the valid baseline but leave **City Name** empty. Submit | The City is **not** created. An appropriate validation message identifies **City Name** as required |
| 3 | Enter the valid baseline but leave **State** unselected. Submit | The City is **not** created. An appropriate validation message identifies **State** as required |
| 4 | Enter the valid baseline but leave **Country** unselected. Submit | The City is **not** created. An appropriate validation message identifies **Country** as required |
| 5 | Fill all four fields, using the **control data** (not the rejection baseline). Submit | The City **is** created successfully — proving the previous four rejections were caused by the missing field and not by an unrelated fault |

**Notes**
- Four fields, one rule (`mandatory`) → **one case with a step per field**, per skill
  Step 5. Four near-identical Azure DevOps items would add no diagnostic value.
- **Exact message wording is not asserted** — no source defines it (**OQ-09**). A missing
  message is a defect; different appropriate wording is not.
- Step 5 is the positive control. Without it, a form broken for an unrelated reason would
  pass this case.
- **Step 5 uses separate control data on purpose** (review finding F-1). Steps 1–4 must
  persist nothing, but they *type* the rejection baseline four times; if step 5 submitted
  those same values it would collide with an earlier run's leftover City and fail as a
  duplicate rather than as a validation defect.
- `REQ-CIT-001` AC2 was **removed** from the Requirement Reference (review finding F-2): it
  governs how a City *references* one Country and one State once persisted, not whether the
  form requires them. `REQ-REL-001` AC1 is the correct authority for steps 3 and 4.
- Leaves behind: one **Approved + Active** City (from step 5).

---

### TC-52860-005 — A City Name containing spaces is accepted

| | |
|---|---|
| **Title** | `[NBO][City][Add City] Verify the City is created successfully when the City Name contains letters and spaces` |
| Project / Module / Feature-Page | NBO / City / Add City |
| Test Type | Positive · Validation |
| Requirement Reference | REQ-CIT-003 |
| Decisions Applied | **D-04**, D-01 |
| Azure DevOps ID | **55652** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_MAKER`.
- `COUNTRY_A`, `STATE_A1` exist.

**Test Data**
- City Name: `New York <unique>` — letters **and a space**
- City Code: `NY<unique>`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the Add City screen and select `COUNTRY_A`, then `STATE_A1` | Both are selected |
| 2 | Enter the City Name from Test Data (letters and spaces) | The value is accepted with **no** validation feedback |
| 3 | Enter the City Code and press **Send for Approval** | The City is created successfully. The space in the City Name does **not** cause a rejection (**[D-04]**) |
| 4 | Open the created City and observe the stored City Name | It matches the entered value, spaces preserved |

**Notes**
- **This case exists because a confirmed decision overrides the source.** The specification
  is contradictory here (WARN-006): the intended letters-plus-spaces pattern is disabled,
  while the user-facing message says *"City Name is alpha"* (letters only). **[D-04]**
  resolves it in favour of **letters + spaces**. Following the message text instead would
  make this case fail against correct behaviour.
- Pairs with TC-52860-029, which asserts the rejection side of the same rule.
- Leaves behind: one **Pending + Inactive** City.

---

### TC-52860-006 — A duplicate City Code is rejected

| | |
|---|---|
| **Title** | `[NBO][City][Add City] Verify the City is not created and a code-already-exists message is displayed when the City Code duplicates an existing City` |
| Project / Module / Feature-Page | NBO / City / Add City |
| Test Type | Negative · Validation · Business rule |
| Requirement Reference | REQ-CIT-002 AC2, REQ-SHR-006 AC1, REQ-CIT-004 AC2 |
| Decisions Applied | **D-03**, D-01 |
| Azure DevOps ID | **55653** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `COUNTRY_A`, `STATE_A1` exist.
- **This case creates the City it then duplicates** — it does not rely on `CITY_EXISTING`
  or on any other case having run.

**Test Data**
- First City: Name `Dupcode <unique>`, Code `DC<unique>` — call this code `X`
- Second City: Name `Dupcode Other <unique>` (**different** name), Code **`X`** (the same)

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Create the first City with Name and Code `X` from Test Data | The City is created successfully |
| 2 | Open the Add City screen again. Select `COUNTRY_A`, `STATE_A1` | Both are selected |
| 3 | Enter the **different** City Name and the **same** City Code `X`. Submit | The City is **not** created. A message to the effect that the **code already exists** is displayed (`REQ-SHR-006` AC1) |
| 4 | Search the City list for code `X` | **Exactly one** City with code `X` exists — the one from step 1. No duplicate was persisted |

**Notes**
- The City Name is deliberately **different** in step 3, so the rejection can only be
  caused by the duplicate **code**. Sharing both fields would not distinguish
  `REQ-SHR-006` AC1 from AC2.
- `REQ-SHR-006` AC1 defines the message's *sense* (*"code already exists"*), not its exact
  wording — asserted as sense, not verbatim.
- WARN-002 (case-sensitivity of the uniqueness check) is **not** asserted here — no source
  defines it. See TC-52860-025's Notes.
- Leaves behind: one **Approved + Active** City.

---

### TC-52860-007 — A duplicate City Name is rejected

| | |
|---|---|
| **Title** | `[NBO][City][Add City] Verify the City is not created and a name-already-exists message is displayed when the City Name duplicates an existing City` |
| Project / Module / Feature-Page | NBO / City / Add City |
| Test Type | Negative · Validation · Business rule |
| Requirement Reference | REQ-CIT-003 AC2, REQ-SHR-006 AC2, REQ-CIT-004 AC2 |
| Decisions Applied | **D-03**, D-01 |
| Azure DevOps ID | **55654** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `COUNTRY_A`, `STATE_A1` exist. `STATE_A2` exists under `COUNTRY_A` — used to keep this
  case's assertion independent of the state, since uniqueness is global **[D-03]**.
- **This case creates the City it then duplicates.**

**Test Data**
- First City: Name `Dupname <unique>` — call this name `Y` — Code `DN1<unique>`, State
  `STATE_A1`
- Second City: Name **`Y`** (the same), Code `DN2<unique>` (**different**), State `STATE_A1`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Create the first City with Name `Y` and Code `DN1<unique>` under `STATE_A1` | The City is created successfully |
| 2 | Open the Add City screen. Select `COUNTRY_A`, `STATE_A1` | Both are selected |
| 3 | Enter the **same** City Name `Y` and a **different** City Code. Submit | The City is **not** created. A message to the effect that the **name already exists** is displayed (`REQ-SHR-006` AC2) |
| 4 | Search the City list for name `Y` | **Exactly one** City named `Y` exists |

**Notes**
- The City Code differs in step 3 so the rejection is attributable to the **name** alone.
- Leaves behind: one **Approved + Active** City.

---

### TC-52860-008 — Cancel on the Add City screen saves nothing (approver)

| | |
|---|---|
| **Title** | `[NBO][City][Add City] Verify no City is created when a user with approval authority fills the form and presses Cancel` |
| Project / Module / Feature-Page | NBO / City / Add City |
| Test Type | Negative · Functional |
| Requirement Reference | REQ-CIT-016 (Add City screen), REQ-CIT-014 row 1; CR C-6 |
| Decisions Applied | D-01, D-02 |
| Azure DevOps ID | **55655** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `COUNTRY_A`, `STATE_A1` exist.

**Test Data**
- City Name: `Cancelled <unique>` · City Code: `CN<unique>`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the Add City screen | The form is displayed |
| 2 | Observe the button order | **Cancel is the first button** on the screen (`REQ-CIT-016`) |
| 3 | Select `COUNTRY_A`, `STATE_A1`, and enter the City Name and City Code | All values are accepted |
| 4 | Press **Cancel** | The form closes or resets without saving. No success confirmation is shown |
| 5 | Search the City list for the City Name and City Code from Test Data | **No** matching City exists. **Nothing was saved** (CR C-6) |

**Notes**
- Leaves behind: **nothing** — that is the assertion.

---

### TC-52860-009 — Cancel on the Add City screen saves nothing (maker)

| | |
|---|---|
| **Title** | `[NBO][City][Add City] Verify no City is created when a user without approval authority fills the form and presses Cancel` |
| Project / Module / Feature-Page | NBO / City / Add City |
| Test Type | Negative · Functional |
| Requirement Reference | REQ-CIT-016, REQ-CIT-014 row 2; CR C-6 |
| Decisions Applied | D-01, D-02 |
| Azure DevOps ID | **55656** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_MAKER`.
- `COUNTRY_A`, `STATE_A1` exist.

**Test Data**
- City Name: `Makercancel <unique>` · City Code: `MC<unique>`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the Add City screen | The form is displayed with **Cancel** first and **Send for Approval** |
| 2 | Select `COUNTRY_A`, `STATE_A1`, and enter the City Name and City Code | All values are accepted |
| 3 | Press **Cancel** | The form closes or resets without saving |
| 4 | Search the City list for the Test Data values | **No** matching City exists |

**Notes**
- Kept separate from TC-52860-008 because `REQ-CIT-016` states Cancel is on **every**
  screen, and the maker's Add screen is a **different button set** (CR matrix row 2). The
  assertion is the same rule on a different screen, which is the distinction skill Step 5
  preserves.
- Leaves behind: **nothing**.

---

### TC-52860-010 — State Code is displayed automatically as a read-only field

| | |
|---|---|
| **Title** | `[NBO][City][Add City] Verify the Add City form displays the State Code automatically as a read-only dimmed field and refreshes it when a different State is selected` |
| Project / Module / Feature-Page | NBO / City / Add City |
| Test Type | Positive · Functional · UI behaviour |
| Requirement Reference | Story AC-3, REQ-CIT-001 |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55657** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `COUNTRY_A` exists with **two** Active States, `STATE_A1` and `STATE_A2`, whose State
  Codes are **different** and known.

**Test Data**
- Country: `COUNTRY_A` · States: `STATE_A1`, then `STATE_A2`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the Add City screen | The form is displayed. A **State Code** field is present |
| 2 | Select Country `COUNTRY_A` | The Country is selected |
| 3 | Select State `STATE_A1` | The **State Code** field is populated **automatically** with `STATE_A1`'s code. It is **read-only / dimmed** and is not editable (Story AC-3) |
| 4 | Attempt to type a different value directly into the State Code field | The field does **not** accept input. Its value is unchanged |
| 5 | Change the State selection to `STATE_A2` | The **State Code** field refreshes automatically to `STATE_A2`'s code |
| 6 | Observe the field's state again | It remains **read-only / dimmed** |

**Notes**
- Step 5 makes this a real assertion rather than a screenshot: a field populated once but
  never refreshed would pass steps 1–4 and still be wrong.
- The State Code **value** comes from `STATE_A1` / `STATE_A2` test data. This is a **City**
  assertion (the City form displays it), not a State assertion — no State behaviour is
  tested [D-01].
- **BLOCKED** if `COUNTRY_A` has fewer than two Active States with distinct codes.
- Leaves behind: **nothing** — no submission.

---

### TC-52860-011 — A State from a different Country cannot be paired with the selected Country

| | |
|---|---|
| **Title** | `[NBO][City][Add City] Verify the Add City form does not offer a State belonging to a different Country than the one selected` |
| Project / Module / Feature-Page | NBO / City / Add City |
| Test Type | Negative · Business rule · Integrity |
| Requirement Reference | Story AC-4 (State control contents), REQ-REL-001 AC1, REQ-CIT-010 (WARN-007) |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55658** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `COUNTRY_A` and `COUNTRY_B` both exist, Active and Approved, and are **different**.
- `STATE_B1` exists, Active, and belongs to **`COUNTRY_B`** — not to `COUNTRY_A`.

**Test Data**
- Country: `COUNTRY_A` · State attempted: `STATE_B1` (belongs to `COUNTRY_B`)

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the Add City screen | The form is displayed |
| 2 | Select Country `COUNTRY_A` | The Country is selected |
| 3 | Open the State control and inspect the available options | `STATE_B1` is **not** offered — the State list contains only States belonging to `COUNTRY_A` (Story AC-4) |
| 4 | Record whether the State control is filtered by the selected Country | Observation for **OQ-13**. **Nothing is asserted about *how* the rule is enforced** — filtering the control and validating on save are both acceptable |

**Notes**
- The baseline specification has **no** such integrity check — `WARN-007` records its
  absence as a defect to fix at planning. **The User Story closes that gap** via AC-4, so
  AC-4 is the requirement.
- **OQ-13** is open: the rule may be enforced by filtering the control, by validating on
  save, or both. If step 3 shows `STATE_B1` **is** offered, the enforcement is
  validation-based rather than filter-based — that is **not** a failure of this case;
  TC-52860-012 covers that path. This case fails only if `STATE_B1` is offered **and**
  TC-52860-012 also shows no validation.
- Leaves behind: **nothing**.

---

### TC-52860-012 — A City is not created when the State does not belong to the Country

| | |
|---|---|
| **Title** | `[NBO][City][Add City] Verify the City is not created when the selected State does not belong to the selected Country` |
| Project / Module / Feature-Page | NBO / City / Add City |
| Test Type | Negative · Business rule · Integrity |
| Requirement Reference | Story AC-4 (submission rejected), REQ-REL-001 AC1, REQ-CIT-010 (WARN-007) |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55659** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `COUNTRY_A`, `COUNTRY_B`, and `STATE_B1` (under `COUNTRY_B`) exist as in TC-52860-011.

**Test Data**
- Country: `COUNTRY_A` · State: `STATE_B1` · City Name `Mismatch <unique>` · Code
  `MM<unique>`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the Add City screen. Select Country `COUNTRY_B`, then State `STATE_B1` | Both are selected. `STATE_B1` is available because it belongs to `COUNTRY_B` |
| 2 | Now change the Country selection to `COUNTRY_A`, **without** changing the State | The mismatch is not accepted. **Record which of two outcomes occurred:** (a) the State selection is **cleared / reset**, or (b) it **retains** `STATE_B1`. Both are acceptable enforcement shapes (**OQ-13**) |
| 3 | Attempt to complete the form and submit it: enter the City Name and City Code, then submit whatever the form currently allows | The City is **not** created. If the State was cleared in step 2, an appropriate validation message identifies **State** as required; if it retained `STATE_B1`, an appropriate validation message indicates the State does not belong to the selected Country (Story AC-4). **In both outcomes the submission is rejected** |
| 4 | Search the City list for the Test Data City Name | **No** City exists pairing `COUNTRY_A` with `STATE_B1`. An inconsistent geography record was **not** persisted |

**Notes**
- **Restructured to remove a control-flow jump** (review finding F-11). The earlier version
  had an *"if cleared … proceed to step 5"* branch inside the step table. Azure DevOps
  renders steps as a flat list, so an executor can miss a jump and skip the assertion.
  Every step is now unconditional and executed in order.
- **OQ-13** is still open, so step 2 *records* which enforcement shape the product uses
  without asserting either. Step 3 asserts the outcome that holds in **both** shapes —
  the submission is rejected — and names the message that fits each, so the executor never
  has to decide which branch applies before knowing what to expect.
- Step 4 is the persistence assertion and holds regardless of enforcement shape.
- **Exact validation wording is not asserted** (**OQ-09**).
- Leaves behind: **nothing**.

---

## Area 2 — Activate / deactivate (REQ-CIT-008, REQ-SHR-001)

### TC-52860-013 — An Approved City can be deactivated and reactivated

| | |
|---|---|
| **Title** | `[NBO][City][City Status] Verify an Approved City can be set to Inactive and back to Active` |
| Project / Module / Feature-Page | NBO / City / City Status |
| Test Type | Positive · State |
| Requirement Reference | REQ-CIT-008 AC1, REQ-SHR-001 AC3 |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55660** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `COUNTRY_A`, `STATE_A1` exist.
- **This case creates its own Approved + Active City** in step 1.

**Test Data**
- City Name `Statustest <unique>` · City Code `ST<unique>`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Create a City under `COUNTRY_A` / `STATE_A1` and press **Approve** | The City is created **Approved + Active** |
| 2 | Set the City's operational status to **Inactive** | The status change is accepted. Operational status is **Inactive** |
| 3 | Observe the City's approval state | It remains **Approved**. The approval state did **not** change with the operational status (`REQ-SHR-001` AC3 — the two are stored and reported separately) |
| 4 | Set the City's operational status back to **Active** | The status change is accepted. Operational status is **Active**. This is permitted because the City is Approved (`REQ-SHR-001` AC1) |
| 5 | Observe the City's approval state again | It is **still Approved**. Reactivation did **not** alter the approval state either (`REQ-SHR-001` AC3) |

**Notes**
- Steps 3 and 5 are the point of the case. `REQ-SHR-001` AC3 requires the two indicators to
  be independent; a system that reset the approval state on deactivation would pass steps 1,
  2 and 4 and still be wrong.
- **Step 5 makes the assertion two-sided** (review finding F-3). Step 3 alone proves only
  that *deactivation* preserves the approval state; a system that dropped it on
  **re**activation would still pass. Same setup, one extra observation.
- Leaves behind: one **Approved + Active** City.

---

### TC-52860-014 — A City that is not Approved cannot be made Active

| | |
|---|---|
| **Title** | `[NBO][City][City Status] Verify a City that is Pending for Approval cannot be set to Active` |
| Project / Module / Feature-Page | NBO / City / City Status |
| Test Type | Negative · State · Business rule |
| Requirement Reference | REQ-CIT-008 AC2, REQ-SHR-001 AC1, AC2 |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55661** |
| Review/Lifecycle Status | Published |

**Precondition**
- `COUNTRY_A`, `STATE_A1` exist.
- **This case creates its own Pending City** in step 1, signed in as `CITY_USER_MAKER`.
- Step 3 onward is performed as `CITY_USER_APPROVER`.

**Test Data**
- City Name `Pendingactive <unique>` · City Code `PA<unique>`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `CITY_USER_MAKER`, create a City under `COUNTRY_A` / `STATE_A1` and press **Send for Approval** | The City is created **Pending for Approval + Inactive** |
| 2 | Observe the City's operational status | **Inactive**. A newly created record is never Active before approval (`REQ-SHR-001` AC2) |
| 3 | As `CITY_USER_APPROVER`, attempt to set that City's operational status to **Active** **without** approving it | The City does **not** become Active while its approval state is Pending (`REQ-SHR-001` AC1, `REQ-CIT-008` AC2). Either the action is unavailable, or it is rejected with an appropriate message |
| 4 | Observe the City's approval state and operational status | Approval state is still **Pending for Approval**; operational status is still **Inactive** |

**Notes**
- `REQ-SHR-001` AC1 is an **invariant**, not a workflow step: *"A record can be Active only
  when it is also Approved."* This case attacks it directly.
- The case accepts **either** enforcement shape in step 3 (control unavailable, or action
  rejected) because no source specifies which. Step 4 is the assertion.
- Leaves behind: one **Pending + Inactive** City.

---

## Area 3 — Approve / reject (REQ-CIT-009, CR C-3)

### TC-52860-015 — Approving a Pending City makes it Approved and Active and records the approver

| | |
|---|---|
| **Title** | `[NBO][City][City Approval] Verify a Pending City becomes Approved and Active and the approver identity and date are recorded when it is approved` |
| Project / Module / Feature-Page | NBO / City / City Approval |
| Test Type | Positive · State · Audit |
| Requirement Reference | REQ-CIT-009 AC1, REQ-SHR-002 AC3, REQ-SHR-005 AC3 |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55662** |
| Review/Lifecycle Status | Published |

**Precondition**
- `COUNTRY_A`, `STATE_A1` exist.
- **This case creates its own Pending City** as `CITY_USER_MAKER`, then approves it as
  `CITY_USER_APPROVER` — so creator and approver are genuinely different users here.

**Test Data**
- City Name `Approveme <unique>` · City Code `AM<unique>`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `CITY_USER_MAKER`, create a City under `COUNTRY_A` / `STATE_A1` via **Send for Approval** | The City is **Pending for Approval + Inactive** |
| 2 | Sign in as `CITY_USER_APPROVER` and open that City for approval | The City is available to act on. Record which controls are offered, including whether an approval-remarks field is present and whether it is marked required (**OQ-19** — nothing is asserted about it) |
| 3 | Approve the City | The action succeeds and an appropriate confirmation is displayed |
| 4 | Observe the approval state | **Approved** (`REQ-CIT-009` AC1) |
| 5 | Observe the operational status | **Active** (`REQ-CIT-009` AC1, `REQ-SHR-002` AC3) |
| 6 | Observe the approver identity and approval date | Both are recorded. Approver is **`CITY_USER_APPROVER`**, distinct from the creator `CITY_USER_MAKER` (`REQ-SHR-005` AC3, `REQ-SHR-002` AC5) |

**Notes**
- `REQ-SHR-002` AC5 (approver distinct from creator) holds **here** because two different
  users acted. The Change Request's override only makes self-approval *permitted* (see
  TC-52860-003) — it does not stop the field from recording whoever acted.
- Step 2 **records** the remarks control without asserting anything about it — **OQ-19**
  (WARN-019) leaves mandatory-ness undecided, and asserting either way would invent a rule.
- Leaves behind: one **Approved + Active** City.

---

### TC-52860-016 — Rejecting a Pending City makes it Rejected and Inactive

| | |
|---|---|
| **Title** | `[NBO][City][City Approval] Verify a Pending City becomes Rejected and Inactive when it is rejected` |
| Project / Module / Feature-Page | NBO / City / City Approval |
| Test Type | Positive · State · Audit |
| Requirement Reference | REQ-CIT-009 AC2, REQ-SHR-002 AC4, REQ-SHR-005 AC3 |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55663** |
| Review/Lifecycle Status | Published |

**Precondition**
- `COUNTRY_A`, `STATE_A1` exist.
- **This case creates its own Pending City** as `CITY_USER_MAKER`.

**Test Data**
- City Name `Rejectme <unique>` · City Code `RM<unique>`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `CITY_USER_MAKER`, create a City under `COUNTRY_A` / `STATE_A1` via **Send for Approval** | The City is **Pending for Approval + Inactive** |
| 2 | As `CITY_USER_APPROVER`, open that City and reject it | The action succeeds and an appropriate confirmation is displayed |
| 3 | Observe the approval state | **Rejected** (`REQ-CIT-009` AC2) |
| 4 | Observe the operational status | **Inactive** (`REQ-CIT-009` AC2, `REQ-SHR-002` AC4). The City is **not** Active |
| 5 | Observe the recorded approver identity and date | Both are recorded for the rejecting user (`REQ-SHR-005` AC3) |

**Notes**
- Leaves behind: one **Rejected + Inactive** City. Note for the executor: per **[D-05]**,
  **no case updates a Rejected City** — that is coverage gap **G-08**.

---

## Area 4 — Update City (REQ-CIT-007, CR C-3/C-4/C-5)

### TC-52860-017 — A maker's update of an Active City applies directly and it stays Active

| | |
|---|---|
| **Title** | `[NBO][City][Edit City] Verify the City remains Active and Approved when a user without approval authority updates an Active City and presses Update` |
| Project / Module / Feature-Page | NBO / City / Edit City |
| Test Type | Positive · State · Functional |
| Requirement Reference | REQ-CIT-007 (amended), REQ-CIT-011, REQ-CIT-014 row 4, REQ-SHR-005 AC2; CR C-4 |
| Decisions Applied | D-01, **D-02** |
| Azure DevOps ID | **55664** |
| Review/Lifecycle Status | Published |

**Precondition**
- `COUNTRY_A`, `STATE_A1` exist.
- **This case creates its own Approved + Active City** as `CITY_USER_APPROVER` in step 1,
  then updates it as `CITY_USER_MAKER`.

**Test Data**
- Initial City Name `Makeredit <unique>` · Code `ME<unique>`
- Amended City Name `Makeredit Amended <unique>`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `CITY_USER_APPROVER`, create a City under `COUNTRY_A` / `STATE_A1` and press **Approve** | The City is **Approved + Active** |
| 2 | Sign in as `CITY_USER_MAKER` and open that City for editing | The City is editable |
| 3 | Observe the available buttons | **Cancel** and **Update** are present. Cancel is **first**. **No** *Send for Approval*, **no** Approve, **no** Reject (CR matrix row 4) |
| 4 | Change the City Name to the amended value and press **Update** | The update is accepted and an appropriate confirmation is displayed |
| 5 | Observe the City's operational status | **Active** — it did **not** drop to Inactive (CR C-4) |
| 6 | Observe the City's approval state | **Approved** — it did **not** return to Pending for Approval (CR C-4) |
| 7 | Observe the stored City Name | The amended value was applied directly |
| 8 | Observe the last-modified user and timestamp | Updated, recording **`CITY_USER_MAKER`** (`REQ-SHR-005` AC2) |

**Notes**
- **This is the case most likely to be written wrong.** The baseline requirement says the
  exact opposite: `REQ-CIT-007` AC1 and `REQ-SHR-002` AC2 require a non-approver's edit to
  return the record to **Inactive + Pending**. The Change Request **overrides** that for
  City [D-02]: *"Update without authority (Active record) → applies directly, stays Active
  and Approved. It no longer drops back to Inactive + Pending."*
- Steps 5 and 6 assert the **CR** behaviour. Asserting the specification's literal reading
  here would produce a false bug report on correct behaviour.
- Leaves behind: one **Approved + Active**, amended City.

---

### TC-52860-018 — An approver's Approve on an Active City keeps it Active and records a fresh approval

| | |
|---|---|
| **Title** | `[NBO][City][Edit City] Verify the City remains Active with a fresh approval recorded when a user with approval authority amends an Active City and presses Approve` |
| Project / Module / Feature-Page | NBO / City / Edit City |
| Test Type | Positive · State · Audit |
| Requirement Reference | REQ-CIT-007 (amended), REQ-CIT-009 (amended), REQ-CIT-013, REQ-CIT-014 row 3, REQ-SHR-004 (overridden), REQ-SHR-005 AC3; CR C-3 |
| Decisions Applied | D-01, **D-02** |
| Azure DevOps ID | **55665** |
| Review/Lifecycle Status | Published |

**Precondition**
- `COUNTRY_A`, `STATE_A1` exist.
- Signed in as `CITY_USER_APPROVER` throughout. **This case creates its own Active City.**

**Test Data**
- Initial City Name `Approverdit <unique>` · Code `AE<unique>`
- Amended City Name `Approverdit Amended <unique>`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Create a City under `COUNTRY_A` / `STATE_A1` and press **Approve** | The City is **Approved + Active** |
| 2 | Note the recorded approval date and approver | Both are recorded |
| 3 | Open the same City for editing | The City is editable |
| 4 | Observe the available buttons | **Cancel**, **Approve** and **Reject** are present. Cancel is **first**. There is **no plain Update button** for this user (CR matrix row 3, `REQ-CIT-013`) |
| 5 | Change the City Name to the amended value and press **Approve** | The action succeeds. The save **is** the approval decision (`REQ-CIT-013`) |
| 6 | Observe the operational status | **Active** — unchanged (CR C-3) |
| 7 | Observe the approval state | **Approved** |
| 8 | Observe the stored City Name | The amended value was applied |
| 9 | Observe the approval date | A **fresh** approval is recorded — the approval date reflects this action, not the one from step 2 (CR C-3: *"records a fresh approval"*) |

**Notes**
- **The absence of a plain Update button (step 4) is a requirement**, not a UI detail: the
  Change Request states *"No plain Update for them."* A screen that also offers Update
  fails this case.
- `REQ-SHR-004` AC1 (an approver's edit keeps the record Active) is **overridden** by the
  CR, which replaces the passive "keeps it Active" with an explicit Approve/Reject
  decision. The outcome for Approve happens to coincide; step 9 is what distinguishes the
  CR behaviour from the baseline.
- Leaves behind: one **Approved + Active**, amended City.

---

### TC-52860-019 — An approver's Reject on an Active City makes it Rejected and Inactive

| | |
|---|---|
| **Title** | `[NBO][City][Edit City] Verify the City becomes Rejected and Inactive when a user with approval authority amends an Active City and presses Reject` |
| Project / Module / Feature-Page | NBO / City / Edit City |
| Test Type | Negative · State |
| Requirement Reference | REQ-CIT-007 (amended), REQ-CIT-009 (amended) AC2, REQ-CIT-013, REQ-CIT-014 row 3, REQ-CIT-015; CR C-3 |
| Decisions Applied | D-01, **D-02** |
| Azure DevOps ID | **55666** |
| Review/Lifecycle Status | Published |

**Precondition**
- `COUNTRY_A`, `STATE_A1` exist.
- Signed in as `CITY_USER_APPROVER`. **This case creates its own Active City.**

**Test Data**
- Initial City Name `Rejectedit <unique>` · Code `RE<unique>`
- Amended City Name `Rejectedit Amended <unique>`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Create a City under `COUNTRY_A` / `STATE_A1` and press **Approve** | The City is **Approved + Active** |
| 2 | Open the same City for editing and change the City Name to the amended value | The value is accepted |
| 3 | Press **Reject** | The action succeeds and an appropriate confirmation is displayed |
| 4 | Observe the approval state | **Rejected** (CR C-3) |
| 5 | Observe the operational status | **Inactive** — the City is no longer Active (CR C-3, `REQ-SHR-001` AC1) |
| 6 | Observe the stored City Name and record whether it is the original or the amended value | **Observation only for OQ-18.** **Nothing is asserted** about whether the amendment was saved or discarded — the sources do not define it (WARN-018). Record what was observed |

**Notes**
- **Step 6 asserts nothing by design.** WARN-018 asks *"Is an amendment saved when the
  approver presses Reject, or discarded?"* and no decision has been made. Asserting either
  answer would invent a requirement (skill Step 6 rule 1). This case must **not** FAIL on
  whichever value is observed in step 6 — only on a crash, a missing response, or a wrong
  **status** in steps 4–5.
- The status outcome in steps 4–5 **is** asserted: it is explicit in the CR and in
  `REQ-CIT-009` AC2.
- Leaves behind: one **Rejected + Inactive** City.

---

### TC-52860-020 — A maker's update of a Pending City resubmits it and it stays Inactive

| | |
|---|---|
| **Title** | `[NBO][City][Edit City] Verify the City is resubmitted as Pending for Approval and remains Inactive when a user without approval authority updates a Pending City` |
| Project / Module / Feature-Page | NBO / City / Edit City |
| Test Type | Positive · State · Functional |
| Requirement Reference | REQ-CIT-007 (amended), REQ-CIT-014 row 5, REQ-CIT-011; CR C-5 |
| Decisions Applied | D-01, **D-02**, **D-05** |
| Azure DevOps ID | **55667** |
| Review/Lifecycle Status | Published |

**Precondition**
- `COUNTRY_A`, `STATE_A1` exist.
- Signed in as `CITY_USER_MAKER`. **This case creates its own Pending City.**
- **Scope limit:** this case covers the *Update / No / Inactive* matrix row **only for a
  City that is Pending for Approval** — the one unambiguous reading. Per **[D-05]**, the
  Rejected and Approved-but-deactivated readings get **no test case** (gap G-08).

**Test Data**
- Initial City Name `Pendingedit <unique>` · Code `PE<unique>`
- Amended City Name `Pendingedit Amended <unique>`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Create a City under `COUNTRY_A` / `STATE_A1` via **Send for Approval** | The City is **Pending for Approval + Inactive** |
| 2 | Open the same City for editing as `CITY_USER_MAKER` | Record whether the City is editable by this user |
| 3 | If editable, observe the available buttons | **Cancel** and **Send for Approval** are present. Cancel is **first**. **No** plain Update, **no** Approve, **no** Reject (CR matrix row 5) |
| 4 | Change the City Name to the amended value and press **Send for Approval** | The action succeeds and an appropriate confirmation is displayed |
| 5 | Observe the approval state | **Pending for Approval** — the City is resubmitted (CR C-5) |
| 6 | Observe the operational status | **Inactive** — it stays Inactive (CR C-5) |

**Notes**
- **Step 2 is deliberately phrased as "record whether"**, because this is the exact point
  where the two sources conflict: `REQ-SHR-003` AC1 says a Pending record is **not**
  editable by a non-approver, while the Change Request's matrix row 5 gives that user
  *Cancel, Send for Approval* on an Inactive record. **OQ-07** is open and **[D-05]**
  forbids inventing an expected result.
- If step 2 shows the City is **not** editable, steps 3–6 are **not** failures — record the
  observation and report the case as **BLOCKED** on OQ-07, per
  `docs/product-decisions.md` §8. The unresolved requirement is the finding.
- If step 2 shows it **is** editable, steps 3–6 assert the CR behaviour, which is explicit
  for this row.
- Leaves behind: one **Pending + Inactive** City.

---

### TC-52860-021 — The maker's Edit City screen offers no approval action

| | |
|---|---|
| **Title** | `[NBO][City][Edit City] Verify no Approve or Reject action is available to a user without approval authority on any City` |
| Project / Module / Feature-Page | NBO / City / Edit City |
| Test Type | Negative · Security-relevant · Authorization |
| Requirement Reference | REQ-CIT-011, REQ-CIT-014 rows 4 and 5, REQ-SHR-002 AC3 |
| Decisions Applied | D-01, D-02 |
| Azure DevOps ID | **55668** |
| Review/Lifecycle Status | Published |

**Precondition**
- `COUNTRY_A`, `STATE_A1` exist.
- **This case creates both Cities it needs**: one Approved + Active (as
  `CITY_USER_APPROVER`) and one Pending + Inactive (as `CITY_USER_MAKER`).

**Test Data**
- Active City: Name `Noapprove Active <unique>` · Code `NAA<unique>`
- Pending City: Name `Noapprove Pending <unique>` · Code `NAP<unique>`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | As `CITY_USER_APPROVER`, create a City and press **Approve** | The City is **Approved + Active** |
| 2 | As `CITY_USER_MAKER`, create a second City via **Send for Approval** | The City is **Pending + Inactive** |
| 3 | As `CITY_USER_MAKER`, open the **Active** City from step 1 | The Edit screen is displayed |
| 4 | Observe the available actions | **No Approve** and **no Reject** action is available anywhere on the screen. Only **Cancel** and **Update** (CR matrix row 4) |
| 5 | As `CITY_USER_MAKER`, open the **Pending** City from step 2 | Record whether the screen is accessible (see TC-52860-020's Notes and **OQ-07**) |
| 6 | If accessible, observe the available actions | **No Approve** and **no Reject**. Only **Cancel** and **Send for Approval** (CR matrix row 5) |

**Notes**
- `REQ-CIT-011` makes approval authority the discriminator for the whole matrix. This case
  asserts the **negative** half of it — what a maker must **never** see — which no positive
  case proves.
- This is a **UI-visibility** assertion only. Whether the back end also refuses a crafted
  approve request is `REQ-CIT-017`, which the UI-only scope cannot cover — gap **G-06**.
  That distinction matters: passing this case does **not** prove the control is enforced.
- Step 5 inherits **OQ-07**; inaccessibility there is an observation, not a failure.
- Leaves behind: two Cities — one Approved + Active, one Pending + Inactive.

---

## Area 5 — Search and list (REQ-CIT-006, REQ-SHR-007, REQ-SHR-008)

### TC-52860-022 — City list results are paginated with totals and a default page size of 10

| | |
|---|---|
| **Title** | `[NBO][City][City List] Verify City list results are paginated with a default page size of 10 and report total matching count and page count` |
| Project / Module / Feature-Page | NBO / City / City List |
| Test Type | Positive · Functional · Boundary |
| Requirement Reference | REQ-CIT-006 AC3, REQ-SHR-008 AC1, AC2, AC3 |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55669** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `CITY_LIST_10PLUS` — **more than 10 Cities** match a single search filter. If fewer than
  11 matching Cities exist and cannot be created within the run, the result is
  **BLOCKED**, not FAIL.

**Test Data**
- A search filter known to match more than 10 Cities (for example the owning-state filter
  for `STATE_A1`).

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the City list / search screen | The screen is displayed |
| 2 | Apply the filter from Test Data without specifying a page size | Results are returned |
| 3 | Count the rows on the first page | **Exactly 10** rows are shown — the default page size when none is specified (`REQ-SHR-008` AC3) |
| 4 | Observe the reported total matching count | A total is reported and it is **greater than 10** (`REQ-SHR-008` AC2) |
| 5 | Observe the reported current page and page count | The current page is reported, and the number of available pages is reported and is **greater than 1** (`REQ-SHR-008` AC2) |
| 6 | Navigate to page 2 | A second page of results is displayed |
| 7 | Count the rows on page 2 and compare their identifiers with page 1 | Page 2 contains at least one row, and **no row from page 1 is repeated**. **Which** Cities appear on page 2 is **not asserted** (**OQ-11**) |

**Notes**
- **Step 7 deliberately asserts non-overlap rather than content.** `WARN-003` records that
  **no default sort order is defined** for City list results, so pagination is not
  reproducible and any assertion about *which* rows land on page 2 would be inventing a
  rule (**OQ-11**). Non-overlap is still a real assertion: a broken pager that returns page
  1 again would fail it.
- Step 3 is the boundary from the defined side (exactly 10, not 11). The other side — that
  a 10-or-fewer result set shows no second page — is covered by step 5's *greater than 1*
  only when more than 10 match; with 11 matching rows both sides are exercised in one run.
- Leaves behind: **nothing** (read-only).

---

### TC-52860-023 — City search matches case-insensitively and on partial values

| | |
|---|---|
| **Title** | `[NBO][City][City List] Verify City search matches case-insensitively and on a partial substring of the City Name and City Code` |
| Project / Module / Feature-Page | NBO / City / City List |
| Test Type | Positive · Functional |
| Requirement Reference | REQ-CIT-006 AC1, AC2, REQ-SHR-007 AC1, AC2 |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55670** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_MAKER`.
- `COUNTRY_A`, `STATE_A1` exist.
- **This case creates the City it searches for** in step 1.

**Test Data**
- City Name: `Searchable <unique>` · City Code: `SRCH<unique>`
- Search terms derived from them: the full name in **lower case**, the full name in
  **upper case**, a **middle substring** of the name (for example `archab`), and a
  **partial** code.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Create a City with the Test Data name and code under `COUNTRY_A` / `STATE_A1` | The City is created successfully |
| 2 | Search the City list by City Name using the term in **all lower case** | The created City is returned (`REQ-SHR-007` AC1) |
| 3 | Search by City Name using the term in **all upper case** | The created City is returned — case does not affect matching |
| 4 | Search by City Name using a **middle substring** that is neither a prefix nor a suffix | The created City is returned. Matching is **contains**, not starts-with (`REQ-SHR-007` AC2) |
| 5 | Search by City Code using a **partial** value | The created City is returned |
| 6 | Search by City Name using a term that appears in **no** City | **No** results are returned, and the total matching count is **0**. The search does not return unrelated rows |

**Notes**
- Step 4 is the substantive one: a prefix-only search would pass steps 2, 3 and 5 while
  violating `REQ-SHR-007` AC2. Choosing a **middle** substring is what detects that.
- Step 6 is the negative control — without it, a search that ignores the filter entirely
  would pass every earlier step.
- Case-insensitive **search** (`REQ-SHR-007`) is asserted here. Case-insensitive
  **uniqueness** is a different, **undefined** rule (WARN-002) and is not asserted — see
  TC-52860-025's Notes.
- Leaves behind: one **Pending + Inactive** City.

---

### TC-52860-024 — Cities of an Inactive State are excluded from the active geography

| | |
|---|---|
| **Title** | `[NBO][City][City List] Verify an Active City does not appear in the active geography when its owning State is Inactive` |
| Project / Module / Feature-Page | NBO / City / City List |
| Test Type | Negative · State · Business rule |
| Requirement Reference | REQ-CIT-010 AC1, AC2, REQ-REL-003 AC1 |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55671** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `STATE_INACTIVE` — an **Inactive** State under `COUNTRY_A` — must exist, holding at
  least one City that is **individually Active and Approved**.
- **Setting up this state may require State-level permissions or seeded data.** If the
  Inactive State (or its Active City) cannot be arranged, the result is **BLOCKED**, not
  FAIL.

**Test Data**
- An Active + Approved City belonging to `STATE_INACTIVE`.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Confirm the City's own status | The City is **Active** and **Approved** in its own right |
| 2 | Confirm its owning State's status | `STATE_INACTIVE` is **Inactive** |
| 3 | Retrieve the active geography hierarchy for `COUNTRY_A` | The hierarchy is returned |
| 4 | Look for the City from step 1 in that hierarchy | The City is **absent**, even though it is individually Active (`REQ-CIT-010` AC2, `REQ-REL-003` AC1) |
| 5 | Look for `STATE_INACTIVE` in the hierarchy | It is **absent** — only Active records appear at every level (`REQ-CIT-010` AC1) |

**Notes**
- **This is a City assertion, not a State one.** What is asserted is the **City's absence
  from the active geography** — the State is the precondition [D-01]. No State behaviour is
  tested.
- Step 5 observes the State's absence only as the corroborating half of `REQ-CIT-010` AC1;
  it is not a State requirement.
- The `WARN-013` concern — that deactivation only *hides* children rather than flagging
  them — is **not** asserted: step 1 confirms the City's own status is untouched, which is
  the specified behaviour.
- Leaves behind: **nothing** (read-only).

---

## Area 6 — Global uniqueness across States (D-03)

### TC-52860-025 — A City Code duplicated under a different State is still rejected

| | |
|---|---|
| **Title** | `[NBO][City][Add City] Verify the City is not created when its City Code duplicates a City under a different State` |
| Project / Module / Feature-Page | NBO / City / Add City |
| Test Type | Negative · Business rule · Validation |
| Requirement Reference | REQ-SHR-006 AC1, REQ-CIT-002 AC2, REQ-CIT-003 AC2 |
| Decisions Applied | **D-03**, D-01 |
| Azure DevOps ID | **55672** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `COUNTRY_A` exists with **two** Active States, `STATE_A1` and `STATE_A2`.
- **This case creates the City it then duplicates.**

**Test Data**
- First City: Name `Globaluniq <unique>` (call it `Y`), Code `GU<unique>` (call it `X`),
  State **`STATE_A1`**
- Second attempt: Code **`X`**, Name `Globaluniq Other <unique>`, State **`STATE_A2`**
- Third attempt: Name **`Y`**, Code `GU2<unique>`, State **`STATE_A2`**

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Create the first City with Name `Y` and Code `X` under `COUNTRY_A` / **`STATE_A1`** | The City is created successfully |
| 2 | Open the Add City screen. Select `COUNTRY_A` and **`STATE_A2`** — a *different* State | Both are selected |
| 3 | Enter City Code **`X`** with a different City Name. Submit | The City is **not** created. A message to the effect that the **code already exists** is displayed. **Uniqueness is global, not per-State** (**[D-03]**) |
| 4 | Enter City Name **`Y`** with a different City Code, still under **`STATE_A2`**. Submit | The City is **not** created. A message to the effect that the **name already exists** is displayed (**[D-03]**) |
| 5 | Search the City list for code `X` and for name `Y` | **Exactly one** City holds code `X`, and **exactly one** holds name `Y` — both the City from step 1 |

**Notes**
- **This case exists solely because a human decision resolved a conflict between the two
  authoritative sources.** User Story **AC-5** says City Name and City Code are unique
  *"within the selected state"*, which would make steps 3 and 4 **succeed**. The
  specification (`REQ-SHR-006`, `REQ-CIT-002` AC2, `REQ-CIT-003` AC2) makes them unique
  across the feature. **[D-03] resolves this in favour of GLOBAL uniqueness**, so AC-5 is
  **superseded and is not tested as written**.
- Without [D-03] this case could not exist — it was the blocking question **OQ-04**.
- **WARN-002 (case-sensitivity) is deliberately not asserted.** Whether `Riyadh` and
  `riyadh` collide is undefined in every source, and [D-03] settled the *scope* of
  uniqueness, not its *case rule*. All Test Data here differs by more than case, so this
  case is unaffected by whichever rule applies. Recorded as gap **G-16**'s neighbour and as
  an open point.
- Leaves behind: one **Approved + Active** City.

---

## Area 7 — Field validation: boundaries and character sets

### TC-52860-026 — City Code is accepted at its length boundaries and rejected beyond them

| | |
|---|---|
| **Title** | `[NBO][City][Add City] Verify the City Code is accepted at 1 and 50 characters and rejected at 51 characters` |
| Project / Module / Feature-Page | NBO / City / Add City |
| Test Type | Boundary · Validation |
| Requirement Reference | REQ-CIT-002, REQ-CIT-002 AC3 |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55673** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `COUNTRY_A`, `STATE_A1` exist.

**Test Data**
- **1 character**: a single alphanumeric character, unique — the lower boundary
- **50 characters**: an alphanumeric string of exactly 50 characters, unique — the upper
  boundary
- **51 characters**: an alphanumeric string of exactly 51 characters — one past the limit
- Each attempt uses a distinct unique City Name, so a rejection is never caused by a
  duplicate name.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Create a City with a **1-character** City Code | The City is created successfully. The limit does **not** fire at the lower boundary |
| 2 | Create a City with a **50-character** City Code | The City is created successfully. **Exactly 50 is allowed** |
| 3 | Attempt to create a City with a **51-character** City Code | The City is **not** created. Either the field prevents the 51st character from being entered, or an appropriate validation message identifies the City Code length (`REQ-CIT-002` AC3) |
| 4 | Search the City list for the 51-character code | **No** City exists with that code |

**Notes**
- **Two-sided by design** (skill Step 5). A case that only proved 51 is rejected would not
  detect an off-by-one that also rejects 50; step 2 is what catches it.
- Step 3 accepts **either** enforcement shape — a `maxlength` input that truncates, or a
  validation message — because no source specifies which. Step 4 is the assertion that
  holds either way.
- Leaves behind: two **Approved + Active** Cities (steps 1 and 2).

---

### TC-52860-027 — A City Code containing non-alphanumeric characters is rejected

| | |
|---|---|
| **Title** | `[NBO][City][Add City] Verify the City is not created when the City Code contains characters outside the alphanumeric set` |
| Project / Module / Feature-Page | NBO / City / Add City |
| Test Type | Negative · Validation |
| Requirement Reference | REQ-CIT-002 AC4 |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55674** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_MAKER`.
- `COUNTRY_A`, `STATE_A1` exist.

**Test Data**
- Codes to reject, each with a distinct unique City Name:
  `CT-<unique>` (hyphen) · `CT <unique>` (**space**) · `CT@<unique>` (special character) ·
  `CT_<unique>` (underscore)
- Positive control: `CT<unique>` (alphanumeric only)

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Attempt to create a City with a City Code containing a **hyphen** | The City is **not** created. Either the character is not accepted by the field, or an appropriate validation message identifies the City Code (`REQ-CIT-002` AC4) |
| 2 | Attempt the same with a City Code containing a **space** | The City is **not** created. A space is outside the alphanumeric set for the **code** |
| 3 | Attempt the same with a City Code containing a **special character** (`@`) | The City is **not** created |
| 4 | Attempt the same with a City Code containing an **underscore** | The City is **not** created |
| 5 | Create a City with a purely **alphanumeric** City Code | The City **is** created successfully — the positive control |
| 6 | Search the City list for the four rejected codes | **None** of them exists |

**Notes**
- One rule (`alphanumeric`) applied to four characters → **one case with a step per
  character**, per skill Step 5.
- **Step 2 is the one to read carefully.** A space is invalid in the **City Code**
  (`REQ-CIT-002`: alphanumeric) but **valid** in the **City Name** (**[D-04]**). The two
  fields have different character rules, and TC-52860-005 asserts the other side.
- Step 5 is the positive control: without it, a form broken for an unrelated reason would
  pass steps 1–4.
- Leaves behind: one **Pending + Inactive** City (step 5).

---

### TC-52860-028 — The City list shows the resolved Country name for each City

| | |
|---|---|
| **Title** | `[NBO][City][City List] Verify each City list row displays the resolved Country name alongside the City fields` |
| Project / Module / Feature-Page | NBO / City / City List |
| Test Type | Positive · Functional · Display |
| Requirement Reference | REQ-CIT-006 AC4 |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55675** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `COUNTRY_A`, `STATE_A1` exist, and `COUNTRY_A`'s name is known.
- **This case creates the City it inspects.**

**Test Data**
- City Name `Countryname <unique>` · Code `CNM<unique>` under `COUNTRY_A` / `STATE_A1`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Create a City under `COUNTRY_A` / `STATE_A1` | The City is created successfully |
| 2 | Open the City list and search for the created City | The City's row is displayed |
| 3 | Observe the row's contents | The row shows the **Country name** — the resolved name, not only an identifier — alongside the City's own fields (`REQ-CIT-006` AC4) |
| 4 | Compare the displayed Country name with `COUNTRY_A`'s name | They match |

**Notes**
- `REQ-CIT-006` AC4 is a **display** requirement that no other case asserts; a list showing
  only a country identifier would satisfy every other search case and still fail this one.
- Leaves behind: one **Approved + Active** City.

---

### TC-52860-029 — A City Name containing digits or special characters is rejected

| | |
|---|---|
| **Title** | `[NBO][City][Add City] Verify the City is not created when the City Name contains digits or special characters` |
| Project / Module / Feature-Page | NBO / City / Add City |
| Test Type | Negative · Validation |
| Requirement Reference | REQ-CIT-003 (WARN-006) |
| Decisions Applied | **D-04**, D-01 |
| Azure DevOps ID | **55677** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_MAKER`.
- `COUNTRY_A`, `STATE_A1` exist.

**Test Data**
- Names to reject, each with a distinct unique City Code:
  `Citytwo2` (**digit**) · `City@name` (special character) · `City_name` (underscore)
- Positive control: `Cityname With Spaces <unique>` — letters and spaces only

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Attempt to create a City whose City Name contains a **digit** | The City is **not** created. Either the character is not accepted, or an appropriate validation message identifies the City Name (**[D-04]**) |
| 2 | Attempt the same with a City Name containing a **special character** (`@`) | The City is **not** created |
| 3 | Attempt the same with a City Name containing an **underscore** | The City is **not** created |
| 4 | Create a City whose City Name contains **only letters and spaces** | The City **is** created successfully (**[D-04]**) — the positive control |
| 5 | Search the City list for the three rejected names | **None** of them exists |

**Notes**
- **This case is only writable because of [D-04].** The source is contradictory (WARN-006):
  the intended letters-plus-spaces pattern is disabled and the message says *"City Name is
  alpha"*. [D-04] settles it as **letters + spaces** — so digits and special characters are
  rejected (steps 1–3) **and** spaces are accepted (step 4).
- **Step 4 is what makes this case correct rather than merely strict.** Following the
  *"alpha"* message literally would reject spaces too, and this case would then assert the
  wrong thing. It is the mirror of TC-52860-005.
- Leaves behind: one **Pending + Inactive** City (step 4).

---

### TC-52860-030 — City Name is accepted at its length boundaries and rejected beyond them

| | |
|---|---|
| **Title** | `[NBO][City][Add City] Verify the City Name is accepted at 1 and 125 characters and rejected at 126 characters` |
| Project / Module / Feature-Page | NBO / City / Add City |
| Test Type | Boundary · Validation |
| Requirement Reference | REQ-CIT-003, REQ-CIT-003 AC3 |
| Decisions Applied | **D-04**, D-01 |
| Azure DevOps ID | **55678** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_MAKER`.
- `COUNTRY_A`, `STATE_A1` exist.

**Test Data**
- **1 character**: a single letter, unique — the lower boundary
- **125 characters**: a string of exactly 125 **letters** — the upper boundary
- **126 characters**: a string of exactly 126 **letters** — one past the limit
- All three use letters only, so a rejection can only be caused by **length** and never by
  the format rule (**[D-04]**). Each attempt uses a distinct unique City Code.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Create a City with a **1-character** City Name | The City is created successfully. The limit does **not** fire at the lower boundary |
| 2 | Create a City with a **125-character** City Name | The City is created successfully. **Exactly 125 is allowed** |
| 3 | Attempt to create a City with a **126-character** City Name | The City is **not** created. Either the field prevents the 126th character, or an appropriate validation message identifies the City Name length (`REQ-CIT-003` AC3) |
| 4 | Search the City list for the 126-character name | **No** City exists with that name |

**Notes**
- Two-sided, like TC-52860-026. Step 2 is what detects an off-by-one at the upper bound.
- **Letters-only test data is a deliberate design choice**: a 125-character string
  containing a digit could be rejected by the *format* rule and mask a broken *length*
  rule. Isolating one variable is what makes the result diagnostic.
- Leaves behind: two **Pending + Inactive** Cities (steps 1 and 2).

---

## Area 8 — Retrieve City (REQ-CIT-005)

### TC-52860-031 — A City is retrieved completely by its identifier

| | |
|---|---|
| **Title** | `[NBO][City][City Details] Verify the complete City record is returned when it is opened by its identifier` |
| Project / Module / Feature-Page | NBO / City / City Details |
| Test Type | Positive · Functional |
| Requirement Reference | REQ-CIT-005 AC1, REQ-CIT-001 AC1, AC2 |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55679** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `COUNTRY_A`, `STATE_A1` exist, with `STATE_A1`'s code known.
- **This case creates the City it retrieves.**

**Test Data**
- City Name `Retrieveme <unique>` · Code `RT<unique>` under `COUNTRY_A` / `STATE_A1`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Create a City under `COUNTRY_A` / `STATE_A1` and press **Approve** | The City is created successfully |
| 2 | Open that City's details by its identifier | The City record is displayed |
| 3 | Observe the City Code and City Name | Both match the values entered in step 1 |
| 4 | Observe the owning Country and owning State | Country is `COUNTRY_A` and State is `STATE_A1` — **exactly one of each** (`REQ-CIT-001` AC2) |
| 5 | Observe the State Code | `STATE_A1`'s code is shown (`REQ-CIT-001` — the owning state's code is part of the City record) |
| 6 | Observe the operational status and approval state | Both are displayed, and separately: **Active** and **Approved** (`REQ-SHR-001` AC3) |
| 7 | Observe the audit fields | Created-by, creation date, last-modified-by and last-modified date are present (`REQ-SHR-005` AC1) |

**Notes**
- This is the case that proves `REQ-CIT-001` AC1 — that **all** listed attributes are
  captured and persisted — which the create cases only assert partially.
- The **site identifier** is deliberately **not** asserted: `REQ-SHR-009` requires it to
  default to 1, but nothing indicates it is displayed (**OQ-10**, gap **G-10**). Asserting
  it would violate skill Step 6 rule 4.
- Leaves behind: one **Approved + Active** City.

---

### TC-52860-032 — An unknown City identifier returns a not-found outcome

| | |
|---|---|
| **Title** | `[NBO][City][City Details] Verify a not-found outcome is returned and no arbitrary record is displayed when an unknown City identifier is requested` |
| Project / Module / Feature-Page | NBO / City / City Details |
| Test Type | Negative · Functional · Security-relevant |
| Requirement Reference | REQ-CIT-005 AC2 |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55680** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.

**Test Data**
- A City identifier that belongs to no City — an arbitrary very high value unlikely to
  exist, confirmed absent in step 1.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Search the City list for the identifier from Test Data to confirm no such City exists | No City with that identifier is found |
| 2 | Request the City details for that unknown identifier directly | A **not-found** outcome is presented — an appropriate not-found message or empty state |
| 3 | Observe what is displayed | **No City record is shown.** No arbitrary or unrelated City is returned in place of the missing one (`REQ-CIT-005` AC2) |

**Notes**
- `REQ-CIT-005` AC2 is explicit that the wrong behaviour is *"an arbitrary record"* rather
  than an error — step 3 is the assertion, not step 2.
- **Exact not-found wording is not asserted** (**OQ-09**).
- Leaves behind: **nothing** (read-only).

---

## Area 9 — Filters and available actions

### TC-52860-033 — Each City search filter narrows the result set

| | |
|---|---|
| **Title** | `[NBO][City][City List] Verify each City search filter narrows the result set correctly alone and in combination` |
| Project / Module / Feature-Page | NBO / City / City List |
| Test Type | Positive · Functional |
| Requirement Reference | REQ-CIT-006 AC1 |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55681** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `COUNTRY_A` with `STATE_A1`; `STATE_A1`'s code is known.
- **This case creates the City it filters for**, Active and Approved so the status filter
  is exercisable.

**Test Data**
- City Name `Filterable <unique>` · Code `FLT<unique>` under `COUNTRY_A` / `STATE_A1`,
  created **Approved + Active**
- Filters to exercise: city code · city name · owning-state code · owning-state identifier
  · owning-country identifier · operational status

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Create the Test Data City and press **Approve** | The City is **Approved + Active** |
| 2 | Filter the City list by **city code** | The created City is returned |
| 3 | Filter by **city name** | The created City is returned |
| 4 | Filter by **owning-state code** — enter `STATE_A1`'s code in the state-code filter | The created City is returned. If the screen exposes **no** owning-state **code** filter, record that explicitly as an observation and continue |
| 5 | Filter by **owning-state identifier** — select `STATE_A1` from the state selector | The created City is returned. If the screen exposes **no** owning-state **selector**, record that explicitly as an observation and continue |
| 6 | Filter by **owning-country** (`COUNTRY_A`) | The created City is returned |
| 7 | Filter by **operational status = Active** | The created City is returned |
| 8 | Filter by **operational status = Inactive** | The created City is **not** returned — it is Active |
| 9 | Combine **city name** and **operational status = Active** | The created City is returned. Combined filters narrow rather than conflict (`REQ-CIT-006` AC1) |
| 10 | Combine **city name** with **operational status = Inactive** | **No** result is returned. The combination is applied as an intersection, not a union |

**Notes**
- Steps 8 and 10 are the ones that make this a real test. A screen that ignored the status
  filter, or OR-ed the filters together, would pass steps 2–7 and 9 and still be wrong.
- **`REQ-CIT-006` AC1 lists six filters, and owning-state appears as two of them** — a
  **code** and an **identifier**. They are now **separate steps 4 and 5** (review finding
  F-4). The earlier single step said *"by code and/or by the state selector"*, which let an
  executor satisfy it by testing one and skipping the other — two named filters could go
  uncovered while the case still reported PASS.
- Each of steps 4 and 5 requires an **explicit recorded observation** when the screen does
  not expose that filter form. A filter absent from the UI is a finding to report, not a
  step to quietly pass over; the scope is UI only, so absence is recorded rather than
  failed.
- The **approver-role visibility filter** (`REQ-SHR-010`) is **not** covered — its
  semantics are undefined (**OQ-05**, gap **G-11**).
- Leaves behind: one **Approved + Active** City.

---

### TC-52860-034 — The City screens offer no delete, import, or export action

| | |
|---|---|
| **Title** | `[NBO][City][City List] Verify the City screens offer no delete, import, or export action and that deactivation is the only way to retire a City` |
| Project / Module / Feature-Page | NBO / City / City List |
| Test Type | Negative · Functional |
| Requirement Reference | REQ-SHR-011 AC1, AC2, AC3 |
| Decisions Applied | D-01 |
| Azure DevOps ID | **55682** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `COUNTRY_A`, `STATE_A1` exist.
- **This case creates the City whose screens it inspects.**

**Test Data**
- City Name `Noactions <unique>` · City Code `NAC<unique>`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Create a City under `COUNTRY_A` / `STATE_A1` and press **Approve** | The City is **Approved + Active** |
| 2 | Open the City list screen and inspect every available action | There is **no delete / remove** action for a City (`REQ-SHR-011` AC1). There is **no bulk import** and **no export** action (`REQ-SHR-011` AC3) |
| 3 | Open the created City's Edit screen and inspect every available action | There is **no delete / remove** action here either (`REQ-SHR-011` AC1) |
| 4 | Confirm the retirement mechanism available instead | A **deactivate / set-Inactive** action is available (`REQ-SHR-011` AC2) — deactivation is the only way to retire a City |
| 5 | Search the City list for the created City after inspecting the screens | The City still exists and is unchanged. Inspecting the screens persisted nothing |

**Notes**
- This case asserts the **absence** of behaviour, which is testable and is exactly what
  `REQ-SHR-011` states. Absence at the **UI** is all a UI-only scope can prove — no API
  endpoint absence is asserted (gap **G-12**).
- **Scope narrowed by review finding F-6.** This case previously also asserted
  `REQ-CIT-016` / CR C-6 (Cancel present, first, discards). Those are a different
  requirement with a different subject and failure mode, and are now **TC-52860-035** — so a
  failure here means the product gained a delete/import/export action, and nothing else.
- Step 4 observes that a deactivate action **exists**; whether it works is TC-52860-013's
  subject. Existence is what `REQ-SHR-011` AC2 requires (review finding F-8).
- Leaves behind: one **Approved + Active** City.

---

### TC-52860-035 — Cancel is present, first, and discards an amendment on the Edit City screen

| | |
|---|---|
| **Title** | `[NBO][City][Edit City] Verify Cancel is present as the first button and discards the amendment without saving when an existing City is edited` |
| Project / Module / Feature-Page | NBO / City / Edit City |
| Test Type | Negative · Functional |
| Requirement Reference | REQ-CIT-016 (Edit City screen), REQ-CIT-014; CR C-6 |
| Decisions Applied | D-01, D-02 |
| Azure DevOps ID | **55683** |
| Review/Lifecycle Status | Published |

**Precondition**
- Signed in as `CITY_USER_APPROVER`.
- `COUNTRY_A`, `STATE_A1` exist.
- **This case creates the City it then edits** — it does not depend on any other case.

**Test Data**
- Original City Name `Editcancel <unique>` · City Code `EC<unique>`
- Amended City Name `Editcancel Amended <unique>` — typed but **never saved**

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Create a City under `COUNTRY_A` / `STATE_A1` and press **Approve** | The City is **Approved + Active** with the original City Name |
| 2 | Observe the button row on the **Add City** screen before leaving it | **Cancel** is present and is the **first** button (`REQ-CIT-016`) |
| 3 | Open the created City on the **Edit City** screen | The Edit screen is displayed |
| 4 | Observe the button row | **Cancel** is present and is the **first** button on this screen too — Cancel is on **every** screen (`REQ-CIT-016`) |
| 5 | Change the City Name to the amended value from Test Data | The new value is accepted in the field |
| 6 | Press **Cancel** | The screen closes or resets. **No** success confirmation is shown |
| 7 | Reopen the same City and observe its City Name | It is the **original** value from step 1. The amendment was **not** saved (CR C-6) |
| 8 | Observe the City's operational status and approval state | **Active** and **Approved** — unchanged. Cancel saved **no decision** either (CR C-6) |
| 9 | Observe the last-modified timestamp | It reflects the creation in step 1, **not** the cancelled edit. Nothing was persisted |

**Notes**
- **Created by the TC-52860-034 split** (review finding F-6). `REQ-CIT-016` and CR C-6 are a
  distinct requirement from `REQ-SHR-011`, with a distinct subject and failure mode, so a
  failure here identifies Cancel unambiguously.
- Feature/Page is **Edit City**, not `City List`, because every substantive step operates on
  the Edit screen (review finding F-7). The structured field is what grouping relies on
  (`docs/product-decisions.md` §3).
- **Step 8 is the part no other Cancel case covers.** The Change Request is explicit that
  Cancel *"saves nothing — not the amendment, **not the decision**."* TC-52860-008 and
  TC-52860-009 prove Cancel discards a **new** record on the Add screen; only an *existing*
  City can show that Cancel also discards a **status decision**.
- Step 2 keeps the Add-screen half of *"on every screen, always first"* in one case with the
  Edit-screen half, so the "every screen" claim is asserted rather than assumed.
- Leaves behind: one **Approved + Active** City with its **original** name — that is the
  assertion.

---

## Rejected test cases

**None.** No case has been rejected by a human. Rejected cases move here with status
`Rejected`, keeping their original ID, which is never reused
(`docs/product-decisions.md` §6.1).

---

## AI self-review record

Performed 2026-08-18, before any human review, per `docs/product-decisions.md` §6 and
skill Step 8. The set was reviewed as if someone else had written it.

### What was checked

| Check | Result |
|---|---|
| **Coverage** — every requirement in the analysis's coverage map either covered or listed as a gap with a reason | **Pass.** 24 requirement rows covered by 34 cases; 18 gaps recorded in *Deliberately not covered*, each with what would unblock it |
| **Acceptance criteria** — all six story ACs accounted for | **Pass.** AC-1/AC-2 → 001, 004 · AC-3 → 010 · AC-4 → 011, 012 · **AC-5 → superseded by [D-03], covered as the global rule in 025** · AC-6 → 001, 002, 004, 026–030 |
| **Scope discipline [D-01]** — no case whose *subject* is a State, Region, or Country | **Pass after correction.** See correction C-2 |
| **Decision overrides** — every case where a decision contradicts the specification's literal reading | **Pass after corrections.** Six such cases: 001, 003, 017, 018, 025, 029. Each carries an explicit Note naming what the baseline would have said. See corrections C-1 and C-3 |
| **Invented content** — no message text, limit, or rule that no source defines | **Pass.** Only two message *senses* are asserted (*"code already exists"* / *"name already exists"*, `REQ-SHR-006`). Every other message assertion is *"an appropriate message identifying the field"* |
| **Undecided behaviour** — nothing asserted where a question is open | **Pass.** 019 step 6 (OQ-18) and 020 step 2 (OQ-07) are observation-only and say so. 022 step 7 avoids OQ-11. 011/012 avoid OQ-13 |
| **[D-05] compliance** — no case for the OQ-06 / OQ-07 undefined paths | **Pass after correction.** See correction C-4 |
| **Duplicates** — no case another case already proves | **Pass after corrections.** See corrections C-5 and C-6 |
| **Boundaries two-sided** | **Pass.** 026 (1 / 50 / 51) and 030 (1 / 125 / 126) both assert the limit does **not** fire one step below |
| **Independence** — no case relying on another's residue | **Pass after correction.** See correction C-7 |
| **Observability** — no assertion the UI cannot verify | **Pass after correction.** See correction C-8 |
| **Field completeness and title convention** | **Pass.** All 34 cases carry all 12 fields of `docs/product-decisions.md` §3; all titles are `[NBO][City][<Feature/Page>] Verify …` |
| **Secrets** | **Pass.** No password, no URL, no credential. Accounts referenced only by handle |
| **Status** | **Pass.** All 34 are `AI-Reviewed`. None is `Approved` |

### Corrections this review produced

**C-1 — TC-52860-017 asserted the specification instead of the Change Request.**
The first draft asserted that a maker's update of an Active City returns it to *Inactive +
Pending*, copying `REQ-CIT-007` AC1 and `REQ-SHR-002` AC2. **The Change Request reverses
this** (C-4: *"stays Active and Approved. It no longer drops back"*). Rewritten to assert
the CR outcome, with a Note naming the superseded baseline. **Left uncorrected, this case
would have reported a false bug against correct behaviour** — the single highest-value
finding of this review.

**C-2 — a State-scoped case was removed.** The draft included a case asserting that an
Inactive State's own list behaviour excluded it. Its *subject* was a State, which
**[D-01]** forbids. The City-scoped half — that an **Active City is absent** from the active
geography when its State is Inactive — was kept as TC-52860-024, with the State reduced to
a precondition.

**C-3 — TC-52860-003 asserted that the approver must differ from the creator.**
The draft applied `REQ-SHR-002` AC5 (*"distinct from the identity of the creator"*)
literally. The Change Request **overrides** it for City: self-approval is *intended* and
creator and approver are *recorded as the same person*. Inverted to assert **sameness**,
with a Note. TC-52860-015 retains the distinct-users assertion, which is where AC5 still
holds — two different users genuinely act there.

**C-4 — two cases violating [D-05] were removed.** The draft contained a case for
*Update / authority=Yes / Inactive* (OQ-06) and a case updating a **Rejected** City
(OQ-07). Both invented an expected result for a path the sources leave undefined. Removed
entirely and recorded as gaps **G-07** and **G-08** — **not** converted to observation-only
cases, because [D-05] explicitly rejected that alternative. TC-52860-020 was then narrowed
to the **Pending** reading only, the one row the CR states unambiguously.

**C-5 — four mandatory-field cases were merged into TC-52860-004.** One rule
(`mandatory`) across four fields does not need four Azure DevOps items. Merged to one case
with a step per field, **plus a positive control step** — without it, a form broken for an
unrelated reason would pass. The same merge was applied to the character-set cases
(TC-52860-027, TC-52860-029).

**C-6 — a redundant duplicate-code case was dropped.** The draft had both *"duplicate code
in the same state"* and *"duplicate code, same state, different name"*. Under **[D-03]**
(global uniqueness) the state is irrelevant to the rule, so the second proved nothing new.
TC-52860-006 covers the rule; TC-52860-025 covers the part [D-03] actually settled — a
duplicate **under a different State**.

**C-7 — five cases depended on a shared pre-seeded City.** They referenced
`CITY_EXISTING` as though it would be present. `docs/product-decisions.md` §4 forbids a
case depending on another having run, and a pre-seeded handle makes the case
non-reproducible. Each affected case (006, 007, 013…021, 023, 028, 031, 033, 034) now
**creates the City it needs in its own steps**. `CITY_EXISTING` remains in the
prerequisites table only for cases that could legitimately reuse it.

**C-8 — the site-identifier assertion was removed from TC-52860-031.** The draft asserted
*"site identifier is 1"* per `REQ-SHR-009` AC1. Nothing indicates that field is displayed
in the City UI (**OQ-10**), and skill Step 6 rule 4 forbids asserting what the UI cannot
observe. Removed from the steps, recorded as gap **G-10**, and the reasoning kept in that
case's Notes.

**C-9 — TC-52860-022's pagination assertion was weakened deliberately.** The draft asserted
*which* Cities appear on page 2. No default sort order is defined (`WARN-003`,
**OQ-11**), so that assertion would have been inventing a rule and would fail
intermittently. Replaced with **non-overlap** between pages 1 and 2 — still a real
assertion, since a broken pager returning page 1 twice fails it.

**C-10 — TC-52860-030's test data was changed to letters only.** The draft used mixed
alphanumeric strings for the City Name length boundaries. Under **[D-04]** a digit in a
City Name is a **format** violation, so a 125-character string containing digits could be
rejected for the wrong reason and mask a broken length rule. Now letters only, isolating
one variable.

**C-11 — three malformed coverage-map rows were repaired.** A mechanical validation pass
over the finished artifact found three rows carrying drafting placeholders instead of case
IDs (`020n/a → 022…`, `017c → 034`, `012n/a → 021n/a → **see gaps**`). Corrected to the
real case lists, and a dedicated row was added for `REQ-CIT-006` **AC4** (resolved Country
name), which TC-52860-028 covers alone. **Every one of the 34 cases is now traceable from
the coverage map** — verified mechanically, not by eye.

### Mechanical validation performed

Beyond the reading review, the finished artifact was checked programmatically:

| Check | Result |
|---|---|
| Case count and ID contiguity | **34 cases, TC-52860-001…034, no gaps, no duplicates** |
| All 12 mandatory fields present on every case | **34 / 34** |
| `Review/Lifecycle Status` | **34 `AI-Reviewed`, 0 `Approved`** |
| Title convention `[NBO][City][<Feature/Page>]` | **34 / 34**, and every title's bracket values match that case's structured fields (Add City 17 · Edit City 5 · City List 6 · City Approval 2 · City Details 2 · City Status 2) |
| Secrets / URLs / credentials | **none** — no password, no base URL, no PAT |
| Every case reachable from the coverage map | **34 / 34** (after C-11) |

### Inherited errors found in the analysis

**None that affected a case.** Two notes:

- The analysis §3.1 still marks `→ OQ-03` and `→ OQ-04, blocking` beside the baseline field
  rules. That is **correct** — §3 describes the *original* requirement, where those
  contradictions genuinely existed. §11 records both as **closed by [D-04] and [D-03]**,
  and the cases follow the decisions.
- The analysis lists `CITY_EXISTING` (P-06) as a prerequisite. Correction **C-7** made most
  cases self-provisioning instead, which is stricter than the analysis assumed. The
  prerequisite is not wrong, merely no longer required by most cases.

### Known limitations of this set

1. **`REQ-CIT-015` and `REQ-CIT-017` are not covered** (gaps G-05, G-06). These are the
   Change Request's *defence-in-depth* requirements — status must come from the button, and
   the matrix must be enforced server-side. **A UI-only scope structurally cannot prove
   them**, because the UI is precisely the layer they distrust. This is the most
   significant coverage cost of the set and it traces to the unresolved **OQ-02**.
2. **OQ-06 and OQ-07 leave three update paths untested** (G-07, G-08, G-09) by explicit
   decision **[D-05]**. Both are the source's own **High**-severity warnings.
3. **Nothing is verified against STG.** All 10 test-data prerequisites are unconfirmed
   (**OQ-12**), and the City screen's location is unknown. Cases will report **BLOCKED**,
   not FAIL, where a prerequisite is missing.
4. **`City-Change-Request.md` was never attached** (**OQ-01**). Only the CR *summary* was
   available, so an unstated field-level change cannot be ruled out.
5. **Message wording is asserted nowhere but the two `REQ-SHR-006` senses.** Wording drift
   will not be caught. That is deliberate — no source defines the text (**OQ-09**).
6. **Approval remarks are never asserted** (**OQ-19**, G-17). TC-52860-015 records what the
   form offers without asserting it.
7. **Case-sensitivity of uniqueness is not asserted** (`WARN-002`). [D-03] settled the
   *scope* of uniqueness, not its *case rule*; all test data differs by more than case, so
   no case depends on the answer.

### Human review round 2 — corrections applied 2026-08-18

A second review, requested by the human, examined TC-004, TC-013, TC-033 and TC-034 in
detail and re-verified the whole set against the approved decisions. It produced 11 findings
(F-1…F-11). **All approved changes are applied below. Nothing was removed.**

| Finding | Sev | Case | What was wrong | Applied change |
|---|---|---|---|---|
| **F-6** | **High** | 034 | **Two unrelated requirements in one case.** Steps 2–4 asserted `REQ-SHR-011` (no delete/import/export); steps 5–7 asserted `REQ-CIT-016` / CR C-6 (Cancel). Different subject, different failure mode — a failure would not say which broke | **Split.** 034 keeps `REQ-SHR-011` only; Cancel became **new TC-52860-035** |
| **F-7** | Med | 034 | Feature/Page was `City List`, but four of seven steps operated on Add City and Edit City screens — permanently mis-filed in Azure DevOps | 034 is now genuinely `City List`; 035 is `Edit City` |
| **F-1** | Med | 004 | Step 5's positive control reused the **same** City Name/Code typed in steps 1–4, so a prior run's residue could fail it as a duplicate rather than a validation defect | Step 5 now uses **separate control data**, documented in Test Data and Notes |
| **F-2** | Low | 004 | Cited `REQ-CIT-001` AC2 (a persistence rule) as authority for form validation | Reference corrected — `REQ-REL-001` AC1 is the authority |
| **F-4** | Med | 033 | Step 4 said *"by code **and/or** by the state selector"*. `REQ-CIT-006` AC1 names owning-state code and identifier as **two** filters; "and/or" let an executor test one, skip the other, and still PASS | **Split into steps 4 and 5**, each requiring an explicit recorded observation if that filter form is absent |
| **F-5** | Low | 033 | 9 steps mixing filter correctness with combination semantics | Kept as one case per the human's instruction (optional TC-036 **not** added); steps renumbered 1–10 |
| **F-3** | Low | 013 | One-sided assertion: proved the approval state survives *deactivation*, never *re*activation. A system dropping it on reactivation would pass | **Step 5 added** — approval state still Approved after reactivation |
| **F-11** | Med | 012 | A control-flow jump (*"proceed to step 5"*) inside the step table. Azure DevOps renders steps flat; an executor can miss a jump and skip the assertion | Restructured: every step unconditional, step 3 asserts the outcome that holds in **both** OQ-13 enforcement shapes |
| **F-9** | Low | 021 | Cited bare `REQ-SHR-002` in a case spanning CR-overridden and non-overridden rows | Now cites `REQ-SHR-002` **AC3** |
| **F-8** | Low | 034 | Step 4 overlapped TC-013's subject (deactivation) | Clarified: 034 asserts the action **exists**; whether it works is 013 |
| **F-10** | Med | *table* | The prerequisites table listed `CITY_EXISTING` as used by 006, 007, 017, 018, 019 — all made self-provisioning by correction C-7. An executor would seed data no case uses | Row **removed**, with the reason recorded |

**F-12 (Low) — found by the post-change validation, fixed in the same pass.** Cases
**010** and **011** were correctly City-scoped in substance — both assert the behaviour of
the **Add City form** — but neither *title scenario* named a City, so both read as State
assertions when scanned in a list. Since the title is what a reviewer sees in Azure DevOps
once published, the scenario text of both was rewritten to name the Add City form as the
subject. **No steps, expected results, or requirement references changed** — this is a
labelling fix, and both cases remain exactly as reviewed.

**Findings that produced no change, by decision:**

- **REMOVE: none.** No case was redundant, out of scope, or asserted undefined behaviour.
- **Optional TC-52860-036** (splitting 033's combination steps) — **not added**, per explicit
  human instruction. 033 covers the behaviour; the split was a clarity improvement only.
- **No cases added for OQ-06 / OQ-07** — **[D-05]** stands unchanged. Gaps **G-07**, **G-08**
  and **G-09** remain recorded, not tested.

**The three approved decisions are unchanged by this round:** uniqueness is **global**
[D-03], City Name accepts **letters + spaces** [D-04], scope is **City only** [D-01]. The
round-2 review re-verified all three and found no drift — see the re-validation table below.

### Verdict

**The set is coherent, traceable, and ready for human review.** **35 cases**, all
`AI-Reviewed`, none approved.

The review's value was concentrated in the **decision-override cases**: three cases
(TC-52860-017, TC-52860-003, and the removed OQ-06 case) asserted the baseline
specification where a confirmed decision or the Change Request reverses it. Those are the
defects that would have surfaced later as **false bug reports against correct behaviour**,
which is why skill Step 8 names that check specifically. Every remaining case that a
decision governs now carries a Note naming what the baseline would have said and why it
does not apply.

The set's honest weakness is **G-05 / G-06** — the two Change Request requirements a
UI-only scope cannot reach. Resolving **OQ-02** is what would close them.
