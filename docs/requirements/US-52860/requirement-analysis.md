# Requirement Analysis — US 52860

> Agent-generated QA analysis. Regenerable. Human decisions live in `decisions.md` and
> outrank this document.
>
> **Every statement carries exactly one tag:** `[E]` explicit (with reference) ·
> `[D]` confirmed human decision (with decision ID) · `[I]` QA inference ·
> `[?]` open question.

---

## 1. Provenance

| Field | Value |
|---|---|
| Work item ID | 52860 |
| Title | `[INT] Master-Miscellaneous-City "Q3-API-INTE-033"` |
| Verified work item type | **User Story** (verified by reader) |
| Project | NBO |
| Area path | `NBO\NBO 1 (Zay)` |
| Iteration | `NBO\Sprint 2` |
| State | Active (Reintroduced in Scope) |
| Revision | 16 |
| Parent work item | 53099 (type unread — reader accepts `User Story` only) |
| Assigned to | Zeyad Nasser |
| Tags | Dev+Testing |
| Priority | 2 |
| **Content fingerprint** | `e5dceedf3d5acb343458fad92234188c7c71b1d8def41d88a736d02641bb14b6` |
| Read at | 2026-08-18 |
| Local snapshot | `docs/requirements/US-52860/source/` |
| Work item URL | https://dev.azure.com/tilde-technology/b1763c9b-14e8-46ae-9683-8947457e8c81/_workitems/edit/52860 |

### Attachments read

| # | Name | Size | sha256 | Role |
|---|---|---|---|---|
| 1 | `Geo-Master-Requirements-City-Region-State.md` | 31388 B | `327233ed48339240d40f267729745548cd098d0aaecde7475c529690ee3bca4d` | **Main Requirement** (baseline specification) |
| 2 | `City-CR.md` | 2908 B | `34c6c33d03842f0ed32f724530a7ad8e93ac1f59443ae5faae17785a22df40a7` | **Change Request** (summary) — a requested change *to* attachment 1, City-scoped |

`[E]` Attachment 2 is explicitly a change to attachment 1, not an independent feature:
it names `Geo-Master-Requirements-City-Region-State.md` as its **Spec**, lists
*Amended* and *Overridden* requirement IDs from it, and states
*"Region and State are not changed. All shared-rule changes are City-scoped overrides."*
(`City-CR.md` header + Points).

`[E]` **A referenced document is NOT attached.** `City-CR.md` names
`City-Change-Request.md` as its *"Full detail"*. Only the **summary** is available.
Everything below derives from the summary; see **OQ-01**.

---

## 2. Scope determination

`[I]` **This User Story's scope is one feature — City — inside the Geo-Location
master-data module.** Evidence:

- `[E]` The story title is `[INT] Master-Miscellaneous-City`; description is
  *"create and maintain cities under states"*; all six acceptance criteria concern City
  only (AC-1…AC-6).
- `[E]` The attached specification covers **three** features (City §3, Region §4,
  State §5) plus shared rules (§2) and relationships (§6). It is a module-level
  document referenced by several stories, not a story-level one — its own §1 says it
  restates *"the three master-data features City, Region, and State"*.
- `[E]` The Change Request is City-only by its own statement.

`[I]` **Region and State are therefore reference context, not scope.** They are read to
understand City's dependencies (a City needs a valid Country and State) but produce no
requirement of their own here.

`[D]` **Test Case scope for this task is CITY ONLY** — human instruction, 2026-08-18
(`D-01`). Country, State, Region and shared-rule behaviour verified through those
entities produce no test case, even where the specification states a requirement.

### Human-facing surface

`[E]` The story's acceptance criteria describe a **UI create form**: selecting Country
and State from controls, State Code shown *"automatically … as a read-only (dimmed)
field"*, entering City Name and City Code (AC-1…AC-3).

`[E]` The specification is written as **behaviour, deliberately layer-agnostic** — §1
excludes technical implementation detail. `[E]` The CR requires the button matrix be
*"enforced on the back end too, not just by which buttons are drawn."*

`[?]` **OQ-02 — is the deliverable of this story UI, API, or both?** The title prefix
`[INT]` and the tag `Q3-API-INTE-033` suggest an API-integration story; the acceptance
criteria describe a UI form. This determines whether test cases are UI cases, API cases,
or both. **Blocking for test design, not for expected results.**

---

## 3. Original Requirement (baseline — before the Change Request)

Only City and the shared rules that City inherits.

### 3.1 City data and field rules

| ID | Rule | Tag |
|---|---|---|
| REQ-CIT-001 | A City record holds: unique identifier, **city code**, **city name**, **owning country**, **owning state** (identifier *and* the state's code), site identifier, operational status, approval state, shared audit fields. A City references exactly one country and one state (AC1–AC2). | `[E]` |
| REQ-CIT-002 | **City code**: mandatory, unique, **alphanumeric**, length **1–50**. Empty rejected (AC1); duplicate rejected (AC2); >50 chars rejected (AC3); non-alphanumeric rejected (AC4). | `[E]` |
| REQ-CIT-003 | **City name**: mandatory, unique, length **1–125**. Empty rejected (AC1); duplicate rejected (AC2); >125 chars rejected (AC3). | `[E]` |
| REQ-SHR-009 | On creation, site identifier defaults to **1**; creation and last-modified dates populate automatically when not supplied. | `[E]` |

`[E]` **City name format is contradictory in the source** (WARN-006): the intended
pattern (letters + spaces) is disabled, while the user-facing message says
*"City Name is alpha"* (letters only). Real names contain spaces. → **OQ-03**.

`[E]` **Uniqueness scope differs between the two sources.** REQ-SHR-006 / REQ-CIT-002 /
REQ-CIT-003 make code and name unique *"within the feature's scope"* — i.e. globally
across all Cities. The User Story AC-5 says *"City Name and City Code must be unique
**within the selected state**"*. These are different rules. → **OQ-04, blocking.**

### 3.2 City operations

| ID | Rule | Tag |
|---|---|---|
| REQ-CIT-004 | **Create City** with code, name, owning country, owning state. On success stored **Inactive + Pending for Approval** (AC1). Uniqueness enforced (AC2). A confirmation of success or a descriptive failure is returned (AC3). | `[E]` |
| REQ-CIT-005 | **Retrieve City by identifier.** Valid id returns the complete record (AC1); unknown id returns a not-found outcome, never an arbitrary record (AC2). | `[E]` |
| REQ-CIT-006 | **Search / list Cities** by any combination of city code, city name, owning-state code, owning-state identifier, owning-country identifier, operational status. Case-insensitive partial matching (AC2), paginated with totals (AC3), and every result row includes the resolved **country name** (AC4). | `[E]` |
| REQ-CIT-007 | **Update City** editable attributes. A non-approver's update returns it to **Inactive + Pending** (AC1); uniqueness still enforced (AC2); a **Pending** City cannot be edited by a non-approver (AC3). | `[E]` |
| REQ-CIT-008 | **Change operational status** — activate / deactivate (AC1). A City may be Active only when Approved (AC2). | `[E]` |
| REQ-CIT-009 | **Approve or reject.** Approval → Approved + **Active**, recording approver and date (AC1). Rejection → Rejected + **Inactive** (AC2). | `[E]` |
| REQ-CIT-010 | **Hierarchical retrieval of active geography** — only Active records appear at every level (AC1); an **Inactive state excludes its cities** even if those cities are individually Active (AC2). | `[E]` |

### 3.3 Shared rules City inherits (baseline)

| ID | Rule | Tag |
|---|---|---|
| REQ-SHR-001 | Two independent indicators: operational status (Active/Inactive) and approval state (Pending/Approved/Rejected). **Active only when Approved** (AC1); a new record is never Active before approval (AC2); the two are stored and reported separately (AC3). | `[E]` |
| REQ-SHR-002 | Maker-checker: create → Pending + Inactive (AC1); edit by non-approver → Inactive + re-enters queue (AC2); approve → Approved + Active (AC3); reject → Rejected + Inactive (AC4); approver identity and date recorded, distinct from creator/editor (AC5). | `[E]` |
| REQ-SHR-003 | A **Pending** record is not editable by a non-approver (AC1); an approver may act on it regardless (AC2). | `[E]` |
| REQ-SHR-004 | An **approver's edit of an already-Approved record keeps it Active** (AC1); a non-approver's edit always returns it to Inactive + Pending (AC2). | `[E]` |
| REQ-SHR-005 | Audit trail: creation user + timestamp (AC1); last-modified user + timestamp on every edit (AC2); approver identity, approval date, approval remarks on approve/reject (AC3). | `[E]` |
| REQ-SHR-006 | Code and name unique within the feature's scope; duplicates rejected on **create and update**, with a *"code already exists"* / *"name already exists"* message. | `[E]` |
| REQ-SHR-007 | Text search matches **case-insensitively** (AC1) and on **any substring** (AC2). | `[E]` |
| REQ-SHR-008 | Pagination: caller may specify page number and size (AC1); result reports total matching count, current page, max page count (AC2); admin-screen default page size is **10** (AC3). | `[E]` |
| REQ-SHR-010 | Search accepts an indicator of the requesting user's approver role (AC1) and scopes results accordingly (AC2). Semantics under-specified → **OQ-05**. | `[E]` |
| REQ-SHR-011 | **No hard delete, no bulk import, no export** (AC1, AC3). Deactivation is the only retirement mechanism (AC2). | `[E]` |

### 3.4 Relationship rules affecting City

| ID | Rule | Tag |
|---|---|---|
| REQ-REL-001 | Strict Country→State→City containment. A City **cannot exist without a valid owning State and owning Country** (AC1). | `[E]` |
| REQ-REL-003 | Deactivating a higher level **suppresses lower levels from the active view**: an Inactive State hides its Cities (AC1); an Inactive Country hides its States and Cities (AC2). | `[E]` |
| REQ-REL-004 | City is referenced by dependent features (rule engines / pricing / billing, custom fields, Knowledge Center, user addresses); stable identifiers and active-only retrieval must be preserved. | `[E]` |

`[E]` **The baseline specification has NO cross-validation that a City's state belongs
to its country** (WARN-007) — a City can be linked to an unrelated country/state pair.
The specification flags this as a defect to fix at planning.

`[E]` **The User Story closes that gap:** AC-4 — *"The selected state must belong to
the selected country."* `[I]` Where the story and the specification disagree, this is
the story adding a rule the specification asked to be added; the story's AC-4 is the
requirement.

---

## 4. Change Request — what is being changed

Source: `City-CR.md`, dated 2026-08-05. **All of it is City-scoped.**

### 4.1 New requirements introduced

| ID | Subject | Tag |
|---|---|---|
| REQ-CIT-011 | Approval authority (the user attribute the whole matrix keys on) | `[E]` |
| REQ-CIT-012 | Status of a new City | `[E]` |
| REQ-CIT-013 | Direct decision (an approver's save *is* the decision) | `[E]` |
| REQ-CIT-014 | Buttons matrix | `[E]` |
| REQ-CIT-015 | Status derived from the button pressed | `[E]` |
| REQ-CIT-016 | Cancel | `[E]` |
| REQ-CIT-017 | Enforced on both sides (front end and back end) | `[E]` |

`[E]` **Amended:** REQ-CIT-004 (Create), REQ-CIT-007 (Update), REQ-CIT-009
(Approve/reject).
`[E]` **Overridden for City only:** REQ-SHR-002 AC-1 / AC-2 / AC-5, and REQ-SHR-004.
`[E]` **Region and State keep the unchanged shared rules.**

### 4.2 The button matrix (verbatim)

| Action | Approval Authority | Record Status | Buttons |
|---|---|---|---|
| Create | Yes | N/A | Cancel, Approve |
| Create | No | N/A | Cancel, Send for Approval |
| Update | Yes | Active | Cancel, Approve, Reject |
| Update | No | Active | Cancel, Update |
| Update | No | Inactive | Cancel, Send for Approval |

`[E]` **The matrix has no row for Update / Yes / Inactive** — a user *with* authority
has no buttons on an Inactive City (WARN-016, severity **High**). → **OQ-06, blocking.**

### 4.3 Behaviour changes, point by point

| # | Change | Before (baseline) | After (CR) | Tag |
|---|---|---|---|---|
| C-1 | **Create with authority** | Always Pending + Inactive (REQ-CIT-004 AC1, REQ-SHR-002 AC1) | **Approved + Active in one step.** No pending stage, no second approval. Buttons: Cancel, Approve. | `[E]` |
| C-2 | **Create without authority** | Pending + Inactive | **Unchanged** — Pending for Approval + Inactive. Buttons: Cancel, Send for Approval. | `[E]` |
| C-3 | **Update with authority, Active record** | Edit keeps it Active (REQ-SHR-004 AC1); approve/reject is a separate act | **The save IS the decision.** Approve → stays Active + records a *fresh* approval. Reject → **Rejected + Inactive.** **No plain Update button for them.** | `[E]` |
| C-4 | **Update without authority, Active record** | Drops to **Inactive + Pending** (REQ-CIT-007 AC1, REQ-SHR-002 AC2) | **Applies directly; stays Active and Approved.** It no longer drops back. Buttons: Cancel, Update. | `[E]` |
| C-5 | **Update without authority, Inactive record** | Edit → Inactive + Pending | **Resubmits: Pending for Approval, stays Inactive.** Buttons: Cancel, Send for Approval. | `[E]` |
| C-6 | **Cancel** | Not specified | On **every** screen, **always first**, and **saves nothing** — not the amendment, not the decision. | `[E]` |
| C-7 | **Status source** | Implied by the operation | **Derived from the button pressed, never taken from the submission.** | `[E]` |
| C-8 | **Enforcement** | Not specified | Matrix enforced on the **back end too**, not only by which buttons are drawn. | `[E]` |
| C-9 | **Self-approval** | WARN-001 flagged approver self-re-approval as a control weakness to confirm | **Intended.** The same user may create and approve; creator and approver are **recorded as the same person**. | `[E]` |

`[I]` C-4 is the most consequential change and the easiest to get wrong: under the
baseline, an ordinary user's edit removes a City from service until re-approved; under
the CR it stays live. `[I]` C-1 and C-9 together mean maker-checker is deliberately
bypassed for authorised users — that is now the specification, not a defect.

---

## 5. Final Expected Behavior (baseline + Change Request applied)

This is the behaviour to test. Where the CR overrides the baseline, only the CR
behaviour appears.

### 5.1 Create City

`[E]` Inputs: **Country**, **State**, **City Name**, **City Code** — all four mandatory
(story AC-1, AC-2; REQ-CIT-004).
`[E]` **State Code** is displayed automatically as a **read-only, dimmed** field derived
from the selected State (story AC-3).
`[E]` The selected State must belong to the selected Country (story AC-4).
`[E]` City Code: alphanumeric, 1–50 (REQ-CIT-002). City Name: 1–125 (REQ-CIT-003),
format contradictory → **OQ-03**.
`[E]` Uniqueness enforced (REQ-SHR-006, story AC-5) — scope disputed → **OQ-04**.
`[E]` Buttons: **Cancel, Approve** with authority · **Cancel, Send for Approval**
without (CR matrix; REQ-CIT-014).
`[E]` Resulting status:

| Authority | Button | Approval state | Operational status |
|---|---|---|---|
| Yes | Approve | **Approved** | **Active** |
| No | Send for Approval | **Pending for Approval** | **Inactive** |
| either | Cancel | *nothing saved* | *nothing saved* |

`[E]` On success a confirmation is returned; on failure a descriptive validation message
(REQ-CIT-004 AC3, story AC-6).
`[E]` Site identifier defaults to 1; created-by and created-date captured automatically
(REQ-SHR-009, REQ-SHR-005 AC1).
`[E]` With authority, creator and approver are recorded as the **same person** (CR).

### 5.2 Update City

`[E]` Behaviour depends on authority **and** current record status (CR matrix):

| Authority | Record status | Buttons | Result of the primary action |
|---|---|---|---|
| Yes | Active | Cancel, **Approve**, **Reject** | Approve → stays **Active + Approved**, fresh approval recorded · Reject → **Rejected + Inactive** |
| Yes | Inactive | **undefined — OQ-06 (blocking)** | undefined |
| No | Active | Cancel, **Update** | Applies directly, **stays Active + Approved** |
| No | Inactive | Cancel, **Send for Approval** | **Pending for Approval**, stays **Inactive** |

`[E]` Uniqueness is enforced on update as well as create (REQ-CIT-007 AC2,
REQ-SHR-006).
`[E]` Last-modified user and timestamp update on every edit (REQ-SHR-005 AC2).
`[E]` Status comes from the button, never from the submitted payload
(REQ-CIT-015).
`[E]` The same matrix is enforced server-side (REQ-CIT-017) — a request that does not
match an allowed row must be refused even if the UI never drew that button.
`[?]` REQ-SHR-003 (a Pending record is not editable by a non-approver) versus the CR's
single *"Update / No / Inactive"* row, which resubmits any Inactive record including a
Pending one → **OQ-07, blocking**, and **OQ-06's twin** (WARN-017, severity High).

### 5.3 Retrieve, search, status, hierarchy — unchanged by the CR

`[E]` REQ-CIT-005 retrieve by id; REQ-CIT-006 search/list with the six filters,
case-insensitive partial match, pagination (default page size 10), resolved country name
per row; REQ-CIT-008 activate/deactivate with Active-only-when-Approved; REQ-CIT-010
active hierarchy excludes cities of an Inactive state; REQ-SHR-011 no hard delete, no
import, no export.

`[I]` REQ-CIT-008 (activate/deactivate) now sits awkwardly beside the CR: the CR makes
status a function of the button pressed on create/update, while REQ-CIT-008 is a
separate status-change operation the CR does not mention. Not a contradiction, but the
interaction is unstated → **OQ-08**.

### 5.4 Cancel

`[E]` Present on every screen, always the first button, and it persists **nothing** —
neither an amendment nor a decision (REQ-CIT-016).

---

## 6. City Scope — requirements that MAY produce Test Cases

`[D]` City only (D-01). Every item below is a City requirement or a City-scoped change.

| # | Requirement | Source | Testable now? |
|---|---|---|---|
| S-01 | REQ-CIT-001 — City attributes persisted; exactly one country and one state | spec §3.1 | Yes |
| S-02 | REQ-CIT-002 — City code: mandatory, unique (**global**, D-03), alphanumeric, 1–50 | spec §3.1 | **Yes** |
| S-03 | REQ-CIT-003 — City name: mandatory, unique (**global**, D-03), 1–125, **letters + spaces** (D-04) | spec §3.1 | **Yes** |
| S-04 | REQ-CIT-004 (amended) — Create City | spec + CR C-1, C-2 | Yes |
| S-05 | REQ-CIT-005 — Retrieve City by identifier, incl. not-found | spec §3.2 | Yes |
| S-06 | REQ-CIT-006 — Search/list Cities: 6 filters, case-insensitive partial, pagination, country name in row | spec §3.2 | Yes |
| S-07 | REQ-CIT-007 (amended) — Update City | spec + CR C-3, C-4, C-5 | Partly — *Update/Yes/Inactive* and the ambiguous *Inactive* meanings are **not tested** (D-05) |
| S-08 | REQ-CIT-008 — Activate / deactivate a City; Active only when Approved | spec §3.2 | Yes (interaction with CR → OQ-08) |
| S-09 | REQ-CIT-009 (amended) — Approve / reject City | spec + CR C-3 | Yes |
| S-10 | REQ-CIT-010 — Active geography hierarchy; Inactive state hides its Active cities | spec §3.2 | Yes — needs State test data |
| S-11 | REQ-CIT-011 — Approval authority governs the available actions | CR | Yes — needs two user roles |
| S-12 | REQ-CIT-012 — Status of a newly created City | CR | Yes |
| S-13 | REQ-CIT-013 — An approver's save on an Active City *is* the decision | CR | Yes |
| S-14 | REQ-CIT-014 — Button matrix: correct buttons per authority + status | CR | 4 of 5 rows; row 6 missing → OQ-06 |
| S-15 | REQ-CIT-015 — Status derived from the button, never from the submission | CR | Yes — needs a tampered submission |
| S-16 | REQ-CIT-016 — Cancel present, first, saves nothing | CR | Yes |
| S-17 | REQ-CIT-017 — Matrix enforced back end too | CR | Yes — **API-level; depends on OQ-02** |
| S-18 | Self-approval intended; creator and approver recorded as the same person | CR | Yes |
| S-19 | Story AC-3 — State Code auto-displayed, read-only / dimmed | story AC-3 | Yes |
| S-20 | Story AC-4 — selected State must belong to the selected Country | story AC-4 | Yes |
| S-21 | Story AC-6 — save on valid input; appropriate validation message otherwise | story AC-6 | Yes (**exact wording undefined** — OQ-09) |
| S-22 | REQ-SHR-005 applied to City — audit fields on create, edit, approve/reject | spec §2 | Yes, **via City screens only** |
| S-23 | REQ-SHR-009 applied to City — site id defaults to 1, dates auto-populated | spec §2 | `[?]` visibility unknown → OQ-10 |

`[I]` S-22 and S-23 are shared rules, but they are in City scope because they are
verified **on a City record through the City feature**. They produce City test cases,
not shared-rule test cases.

---

## 7. Out-of-Scope — MUST NOT produce Test Cases

`[D]` Excluded by human instruction D-01, regardless of being specified.

| Area | Requirements excluded | Why |
|---|---|---|
| **State** | REQ-STA-001…REQ-STA-010 (state attributes, state code rules incl. WARN-010/011, state name, create/retrieve/search/update/status/approve state, list cities of a state) | Different entity. State is only **test data** for City. |
| **Region** | REQ-REG-001…REQ-REG-010, REQ-REL-002 (region attributes, code/name rules, associate countries, create/retrieve/search/update/status/approve region) | Different entity; not even part of the Country→State→City hierarchy. |
| **Country** | All Country behaviour. The spec itself puts Country out of scope (§9) — it has no requirements here. | Different entity; only **test data** for City. |
| **Shared rules verified on Region or State** | REQ-SHR-001…REQ-SHR-011 exercised through a Region or State record | Same rule, wrong entity. Only the City-record path is in scope (see S-22, S-23). |
| **Region ↔ Currency, Region → State/City** | WARN-012, WARN-015 | Region concerns. |
| **Cascade / dependent-record impact beyond City** | REQ-REL-003 AC2 (Inactive **Country** hides states and cities), REQ-REL-004 consumers other than City, WARN-013, WARN-014 | Country-level and cross-feature. `[I]` REQ-REL-003 **AC1** (Inactive State hides its Cities) **is** in scope as S-10 — the assertion is about City visibility. |
| **REQ-REL-005** naming-prefix convention | Documentation convention, not runtime behaviour | Not testable as a City case. |
| **Hard delete / import / export** | REQ-SHR-011 for Region and State | `[I]` The City half (no delete/import/export **on City**) is in scope; Region and State are not. |

`[I]` **The trap to avoid:** the specification is a three-feature document, so most of
its requirement count is out of scope. A test case that "creates a State so a City can
exist" is a City case (State is a precondition). A test case that "verifies State code
rejects 5 characters" is a State case and must not be written.

---

## 8. Requirement → coverage-area map

| Requirement | Coverage area | In City scope |
|---|---|---|
| REQ-CIT-001 | Data persistence, City ↔ Country/State references | ✔ S-01 |
| REQ-CIT-002 | Field validation — City Code (mandatory, unique, charset, boundary 1/50/51) | ✔ S-02 |
| REQ-CIT-003 | Field validation — City Name (mandatory, unique, boundary 1/125/126, format) | ✔ S-03 (format blocked) |
| REQ-CIT-004 + CR C-1/C-2 | Create flow, status outcome per authority | ✔ S-04, S-12 |
| REQ-CIT-005 | Retrieve by id, not-found handling | ✔ S-05 |
| REQ-CIT-006 | Search/list — filters, case-insensitivity, partial match, pagination, display fields | ✔ S-06 |
| REQ-CIT-007 + CR C-3/C-4/C-5 | Update flow per authority × status | ✔ S-07 (1 row blocked) |
| REQ-CIT-008 | Status change; Active-only-when-Approved | ✔ S-08 |
| REQ-CIT-009 + CR C-3 | Approve / reject outcomes and audit | ✔ S-09 |
| REQ-CIT-010 | Active hierarchy filtering (city level) | ✔ S-10 |
| REQ-CIT-011 | Authorisation-driven behaviour | ✔ S-11 |
| REQ-CIT-012 | New-City status | ✔ S-12 |
| REQ-CIT-013 | Approver save = decision | ✔ S-13 |
| REQ-CIT-014 | Button matrix rendering | ✔ S-14 |
| REQ-CIT-015 | Status from button, not payload | ✔ S-15 |
| REQ-CIT-016 | Cancel semantics | ✔ S-16 |
| REQ-CIT-017 | Server-side enforcement | ✔ S-17 (OQ-02) |
| REQ-SHR-001 | Status/approval independence, on City | ✔ via S-08, S-12 |
| REQ-SHR-002 (overridden AC1/AC2/AC5) | Maker-checker as amended for City | ✔ via S-04, S-07, S-18 |
| REQ-SHR-003 | Pending-record edit protection | `[?]` OQ-07 — conflicts with CR |
| REQ-SHR-004 (overridden) | Approver edit shortcut — replaced by CR C-3 | ✔ via S-13 |
| REQ-SHR-005 | Audit trail on a City | ✔ S-22 |
| REQ-SHR-006 | Uniqueness of code/name | ✔ S-02, S-03 (scope OQ-04) |
| REQ-SHR-007 | Case-insensitive partial search, on City | ✔ via S-06 |
| REQ-SHR-008 | Pagination + totals, default size 10, on City | ✔ via S-06; sort undefined → OQ-11 |
| REQ-SHR-009 | Default field values on a City | ✔ S-23 (OQ-10) |
| REQ-SHR-010 | Approver-role search filter | `[?]` OQ-05 — semantics undefined |
| REQ-SHR-011 | No delete/import/export, on City | ✔ (negative assertions) |
| REQ-REL-001 | City requires valid owning State + Country | ✔ S-20 |
| REQ-REL-003 AC1 | Inactive State hides its Cities | ✔ S-10 |
| REQ-REL-003 AC2 | Inactive Country hides states + cities | ✘ out of scope |
| REQ-REL-004 | City as referenceable master data | ✘ mostly out of scope |
| REQ-REL-005 | Naming convention | ✘ not runtime behaviour |
| REQ-STA-*, REQ-REG-*, REQ-REL-002 | State / Region features | ✘ out of scope (D-01) |
| Story AC-1…AC-6 | Create-form behaviour | ✔ S-04, S-19, S-20, S-21 |

`[I]` **No City requirement is silently skipped.** Every in-scope item maps to S-01…S-23;
every excluded item is named in §7 with a reason.

---

## 9. Test environment and test data prerequisites

`[E]` **STG is the only allowed environment** (project invariant 5). Nothing here
targets UAT or PROD.

`[I]` Required before any City test case can run:

| # | Prerequisite | Needed for |
|---|---|---|
| P-01 | A **user WITH approval authority** on City | S-04, S-09, S-11, S-13, S-14, S-18 |
| P-02 | A **user WITHOUT approval authority** on City | S-04, S-07, S-11, S-14 |
| P-03 | At least one **Active, Approved Country** | every create case |
| P-04 | At least **two Active States under the same Country** | uniqueness-within-state (OQ-04), state-code display |
| P-05 | At least one **State under a DIFFERENT Country** | S-20 — the state-must-belong-to-country negative |
| P-06 | An existing **Active + Approved City** | Update/Active rows (S-07 C-3, C-4) |
| P-07 | An existing **Inactive + Pending City** | Update/No/Inactive row (C-5), OQ-07 |
| P-08 | An existing **Rejected City** | OQ-07 — the second meaning of "Inactive" |
| P-09 | An existing **Approved-but-deactivated City** | OQ-07 — the third meaning of "Inactive" |
| P-10 | An **Inactive State holding an Active City** | S-10 / REQ-REL-003 AC1 |
| P-11 | More than 10 Cities matching one filter | S-06 pagination default of 10 |
| P-12 | A way to submit a **crafted request** bypassing the UI | S-15, S-17 back-end enforcement |

`[?]` **None of P-01…P-12 is confirmed to exist in STG.** The URL of the City admin
screen is also unknown. → **OQ-12, blocking for execution** (not for writing cases).

### Not practically testable as stated

`[I]` REQ-SHR-009's site-identifier default (S-23) — no stated way to observe the site
identifier through the City UI → OQ-10.
`[I]` REQ-SHR-010's approver-role search filter (OQ-05) — no defined expected result, so
no assertion can be written.
`[I]` REQ-CIT-017 / REQ-CIT-015 back-end enforcement needs a non-UI submission path
(P-12); it cannot be covered by a pure UI case.

---

## 10. Confirmed decisions

`docs/requirements/US-52860/decisions.md` did not exist at the start of this analysis.
The following was stated by the human in this session and is recorded there.

| ID | Decision | Closes |
|---|---|---|
| D-01 | **Test Case scope for this User Story is CITY ONLY.** Country, State, Region and any other entity are out of scope and must not produce test cases even where the specification states a requirement for them. | Scope of §6 vs §7 |
| D-02 | `City-CR.md` is a **requested change to** `Geo-Master-Requirements-City-Region-State.md`, not an independent requirement. Final expected behaviour = baseline with the CR applied, and the two must stay distinguishable in the analysis. | How to combine the two attachments (§3, §4, §5) |
| D-03 | **City Code and City Name uniqueness is GLOBAL across the City feature**, not scoped to the selected State. Story AC-5 is superseded. | **OQ-04** (was blocking) |
| D-04 | **City Name accepts letters + spaces.** `New York` is valid; digits and special characters are rejected. | **OQ-03** (was blocking), WARN-006 |
| D-05 | **No Test Cases for OQ-06 and OQ-07 paths**, and no invented Expected Results. Not even observation-only cases. Both stay recorded as known coverage gaps. | Coverage decision for OQ-06 / OQ-07 |

---

## 11. Open questions

Blocking questions first. **Blocking** means an expected result cannot be stated without
a human decision.

| ID | Question | Impact | Blocks expected results? |
|---|---|---|---|
| ~~OQ-04~~ | **CLOSED by D-03** — uniqueness is **GLOBAL across the City feature**. Story AC-5's "within the selected state" is superseded and must not be tested as written. | Duplicate code/name is rejected regardless of the selected State. | **No — closed** |
| **OQ-06** | **What can a user WITH approval authority do on an Inactive City?** The CR matrix has no *Update / Yes / Inactive* row (WARN-016, High). **Still open.** Per **D-05: no Test Case is written for this path** and no Expected Result is invented. | Recorded as a known coverage gap, not tested. | **YES — untested by D-05** |
| **OQ-07** | **Which "Inactive" does the *Update / No / Inactive* row mean?** "Inactive" covers **Pending**, **Rejected**, and **Approved-but-deactivated** (WARN-017, High). One row covering all three contradicts REQ-SHR-003 and would resubmit an already-approved record. **Still open.** Per **D-05: no Test Case for the ambiguous interpretations** and no invented Expected Result. | Recorded as a known coverage gap, not tested. | **YES — untested by D-05** |
| ~~OQ-03~~ | **CLOSED by D-04** — City Name accepts **letters + spaces**. `New York` is valid; digits and special characters are rejected. | WARN-006 resolved. | **No — closed** |
| **OQ-01** | `City-CR.md` names `City-Change-Request.md` as its full detail. **That document is not attached.** | The summary may omit rules, messages, or field-level changes. Analysis could be incomplete through no fault of the sources read. | **Partly** — unknown unknowns |
| **OQ-02** | **Is this story's deliverable UI, API, or both?** Title says `[INT]` / `Q3-API-INTE-033`; acceptance criteria describe a UI form; REQ-CIT-017 requires back-end enforcement. | Determines whether test cases are UI, API, or both — and whether S-17 is coverable at all. | No, but **blocks test design** |
| **OQ-18** | **Is Reject on the *Update / Yes / Active* row supposed to save the amendment or discard it?** (WARN-018) | Expected post-reject content of the record for S-13. | **YES** for that one assertion |
| **OQ-19** | **Which buttons require approval remarks, and are remarks mandatory?** (WARN-019) | Whether a case must supply remarks; whether an empty-remarks negative exists. REQ-SHR-005 AC3 says remarks are captured, but not that they are required. | **YES** for remarks assertions |
| OQ-05 | What exactly does the approver-role search filter show and hide? (WARN-004) | No assertion can be written for it. Coverage gap, recorded not dropped. | Yes, so it is **excluded from coverage** |
| OQ-09 | **Exact validation message text is undefined.** The story says *"the appropriate validation message"* (AC-6); REQ-SHR-006 gives only the sense *"code already exists"* / *"name already exists"*. | Cases must assert that **a** relevant validation message appears and identify the field, **never invented wording**. | No — handled by not asserting wording |
| OQ-10 | Is the site identifier (default 1) observable through the City UI? | If not, S-23 is not testable at UI level. | No |
| OQ-11 | **What is the default sort order of the City list?** None is defined (WARN-003), so pagination is not reproducible. | A pagination case cannot assert *which* rows land on page 2. | No — assert counts/totals, not row order |
| OQ-08 | How does the separate activate/deactivate operation (REQ-CIT-008) interact with the CR's button-derived status? | Whether deactivating an Approved City then editing it as a non-approver follows C-4 or C-5. Overlaps OQ-07. | No — tracked under OQ-07 |
| OQ-12 | **Do P-01…P-12 exist in STG, and what is the City admin screen URL?** | Nothing can be executed. | No — blocks **execution**, not authoring |
| OQ-20 | City now differs from Region and State on the shared rules (WARN-020, Low). | Cross-feature consistency; out of scope by D-01. | No |
| OQ-13 | Is the state-belongs-to-country rule (story AC-4) enforced by filtering the State control to the selected Country, by validation on save, or both? | Whether the AC-4 negative case is even reachable through the UI. | No — observe and record |

`[I]` Question IDs are stable. OQ-18, OQ-19, OQ-20 keep the source's WARN numbering
(WARN-018/019/020) deliberately, so a reader of `City-CR.md` finds the same identifier.

### Warnings from the spec that are NOT open questions here

`[I]` WARN-008 (Region code), WARN-009 (Region↔Country cardinality), WARN-010 and
WARN-011 (State code), WARN-012, WARN-015 — all belong to out-of-scope entities (§7).
Recorded as known, deliberately not tracked.
`[I]` WARN-001 is **resolved by the CR**: self-approval is intended (CR, C-9).
`[I]` WARN-007 is **resolved by story AC-4**: the state must belong to the country.
`[I]` WARN-002 (case-sensitivity of uniqueness) is folded into OQ-04 — the scope
question must be answered before case-sensitivity is meaningful.
`[I]` WARN-005 (reuse of a deactivated record's code/name) applies to City. `[?]`
**OQ-14** — may a deactivated City's code and name be reused? Not blocking: no case
asserts reuse until decided.

---

## 12. Summary for the human

`[I]` **The requirement is readable and mostly testable, with four blocking questions.**

- The Change Request is well-formed and City-scoped; applying it is unambiguous for
  4 of the 5 matrix rows.
- **OQ-06** and **OQ-07** are the source's own High-severity warnings and cannot be
  answered by inference — one is a missing matrix row, the other is a word ("Inactive")
  meaning three different states.
- **OQ-04** is a genuine conflict *between the two authoritative sources* — the story
  and the specification state different uniqueness scopes.
- **OQ-03** is a contradiction the specification already flags.
- **OQ-01**: the CR's own full-detail document was not attached, so the change may be
  described only in summary.

`[I]` Test cases can be written for S-01, S-02 (partly), S-04, S-05, S-06, S-08, S-09,
S-10, S-11, S-12, S-13, S-14 (4 rows), S-15, S-16, S-18, S-19, S-20, S-21, S-22 without
resolving anything. The blocked paths must either wait for a decision or be written as
**observation-only** cases that record actual behaviour and assert nothing — the pattern
already used on US 53717 (TC-53717-051/052).
