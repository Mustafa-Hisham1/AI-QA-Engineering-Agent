# Requirement Analysis — US 52857

> Agent-generated QA analysis. Regenerable. Human decisions live in `decisions.md` and
> outrank this document.
>
> **Every statement carries exactly one tag:** `[E]` explicit (with reference) ·
> `[D]` confirmed human decision (with decision ID) · `[API]` what the API specification
> says (with the operation) · `[UI]` observed current behaviour (with the page) ·
> `[I]` QA inference · `[?]` open question.
>
> **Read this document through D-01:** where the current implementation conflicts with the
> story, its specification or the Swagger, **the implementation is the expected behaviour**
> — but only where it was actually observed, and only where UI and API agree (§11).
> D-02…D-06 then settled every remaining blocking question (§15, §16).

### Changes in this revision (update 2026-10-10, third run)

- **Decisions D-07…D-17 applied** (human, 2026-10-10). The human's OQ labels did not all match
  this artifact's IDs; applied by content on the human's confirmation (mapping in `decisions.md`).
  Closed: **OQ-07**, **OQ-09**, **OQ-12**, **OQ-14**; **OQ-06** partly (inactive-country message).
  Still open: OQ-06 (inactive-currency and unmapped-pair messages), OQ-08, OQ-10, OQ-11, OQ-13.
- **Test data supplied and verified** (D-07, D-08); **pagination data created** on STG (D-09) — §5.6b, §13.
- **Story unchanged** — rev 17, same fingerprint. API specification not re-supplied (§4 kept).

### Changes in the previous revision (update 2026-10-09, second run)

- **Story unchanged** — rev 17, same fingerprint; no re-analysis of the requirement.
- **Decisions D-02…D-06 applied** — closed OQ-01…OQ-05; BR-22…BR-25 now carry expected
  behaviour; C-12, C-14, C-15, C-19 resolved (§6, §11, §15, §16).
- **UI re-explored only to validate the corrected View-only account** (D-04) — §5.6a.
- **API specification not re-supplied** — the §4 API analysis is kept, *not re-verified this run*.

---

## 1. Provenance

| Field | Value |
|---|---|
| Work item ID | 52857 |
| Title | `[INT] Admin-Company-Operating Country "Q3-API-INTE-033"` |
| Verified work item type | **User Story** (verified by reader) |
| Project | NBO |
| Area path | `NBO\NBO 1 (Zay)` |
| Iteration | `NBO\Sprint 40 (Zay)` |
| State | Closed (Acceptance tests pass) |
| Revision | 17 |
| Parent work item | 52668 (type unread — reader accepts `User Story` only) |
| Assigned to | Mahmoud Ayman |
| Tags | Dev+Testing |
| Priority | 2 |
| **Content fingerprint** | `bfa440e329745df499185b73b98afd85bde3e956f2d90c1902c8a23868719848` |
| Read at | 2026-10-09 |
| Local snapshot | `docs/projects/NBO/requirements/US-52857/source/` |
| Work item URL | https://dev.azure.com/tilde-technology/b1763c9b-14e8-46ae-9683-8947457e8c81/_workitems/edit/52857 |
| API source | OpenAPI 3.0.0 — `C:/Users/SPEED/AppData/Local/Temp/claude/d--AI-QA-Engineering-Agent/f28b449f-0fdf-46b4-b10f-2bb985a1c218/scratchpad/api-spec/nbo-backend-swagger-v1.json` |
| API source sha256 | `5ed0487b43d1284a80da20135e8caad698034123b1cc23def363553ca624d1ce` |
| API source (this run) | Not provided — the earlier API analysis above is kept, not re-verified this run |
| UI exploration | Performed — environment **STG**, host `ndc-apis-nbo-frontend-dev-epf8graxc0cudjd9.northeurope-01.azurewebsites.net`, as `ADMIN_ALL` |
| UI exploration (this run) | Performed — environment **STG**, host `ndc-apis-nbo-frontend-dev-epf8graxc0cudjd9.northeurope-01.azurewebsites.net`, as `OPERATING_COUNTRIES_VIEW_ONLY` |
| Analysis date | 2026-10-09 (first analysis); updated 2026-10-09 with D-02…D-06 |

`[I]` The API source file is a session-local download of
`https://ndc-apis-nbo-backend-dev-2.azurewebsites.net/swagger/v1/swagger.json` — the document
behind the Swagger UI link the human supplied. It is **not** copied into the repository; the
sha256 above identifies the exact version analysed. A future run should download it again and
compare hashes.

`[I]` UI exploration additionally used `OPERATING_COUNTRIES_MAKER` and
`OPERATING_COUNTRIES_APPROVER` (same environment, same host) to compare what each role is
offered. `OPERATING_COUNTRIES_VIEW_ONLY` was not used in the first run (its supplied username
was wrong — OQ-03); after the human corrected it (D-04) it was used in the second run, §5.6a.

### Attachments read

| # | Name | Size | sha256 | Role |
|---|---|---|---|---|
| 1 | `operating-country-business-requirements-init.md` | 100529 B | `aaafc3ca940e2d75e5154c020b0a80bcd7862c1e1796d95a39f45ec3f52a3b8d` | **Business Requirements Specification** (`REQ-OPC-*`), already revised by CR-OPC-001…016 |

`[E]` There is **no separate Change Request attachment.** The specification states it was
*"revised per change requests CR-OPC-001 … CR-OPC-016"* (header) and records the resolved
warnings in §5. The change requests are already folded into the requirement text; there is no
baseline/CR split to keep apart.

---

## Source Coverage

| Source | Status | Details |
|---|---|---|
| User Story | Available | US-52857, rev 17 |
| Markdown Attachments | Available | `operating-country-business-requirements-init.md` |
| API Specification | OpenAPI 3.0.0 | `C:/Users/SPEED/AppData/Local/Temp/claude/d--AI-QA-Engineering-Agent/f28b449f-0fdf-46b4-b10f-2bb985a1c218/scratchpad/api-spec/nbo-backend-swagger-v1.json` — 273 operation(s), "NDC.WT.NBO API" — first run; this run: Not provided (kept, not re-verified) |
| UI Exploration | Performed | STG — `ndc-apis-nbo-frontend-dev-epf8graxc0cudjd9.northeurope-01.azurewebsites.net`, as `ADMIN_ALL` (plus Maker, Approver) — first run |
| UI Exploration | Performed | STG — `ndc-apis-nbo-frontend-dev-epf8graxc0cudjd9.northeurope-01.azurewebsites.net`, as `OPERATING_COUNTRIES_VIEW_ONLY` — this run |

---

## 2. Scope determination

`[I]` **This User Story's scope is one feature — Operating Country — inside the Company
master-data area of the Admin Panel** (`Admin › Company › Operating Country`). Evidence:

- `[E]` Title `[INT] Admin-Company-Operating Country`; every acceptance-criteria group
  (Creation, Validation, Editing, Listing, Approval, Lifecycle, Hierarchy, Access Control,
  Messaging, Naming) concerns the Operating Country entity.
- `[E]` The specification's feature line: *"Operating Country (Admin › Company › Operating
  Country)"*, module *"Administration Portal — Company & Organization Master Data"*.
- `[E]` REQ-OPC-038 AC-3: the entry sits beneath the **Company** menu group.
- `[UI]` The screen is at `/admin/company/operating-country`; breadcrumb *Admin Module ›
  Operating Country*.

`[E]` The specification explicitly **excludes** (§1.2): the rules that consume the operating
country list (airline configuration, markup, discount, service charge, UCCF, GDS deal codes,
airport exclusions); the Branch and Agency features; the Country and Currency masters; the
Staff / User feature; booking, reporting and finance.

`[I]` Consequently the **Organization Hierarchy & Dependencies** acceptance criteria (story
AC-2…AC-7; REQ-OPC-031, 034, 035, 036) are *about other features' behaviour* towards an
Operating Country. Following the method rule — *a record used as test data is in scope; an
assertion about another entity is not* — they are recorded as **dependencies**, not as
Operating Country requirements to assert here, until the human says otherwise (OQ-08).
REQ-OPC-037 (*View All Branches* on the Operating Country list) is on this feature's screen
and **is** in scope.

### Human-facing surface

| Surface | Where | Observed |
|---|---|---|
| Operating Country list + search | `/admin/company/operating-country` | `[UI]` yes |
| Add Operating Country | `/admin/company/operating-country/add` | `[UI]` yes (not submitted) |
| Edit Operating Country | `/admin/company/operating-country/<id>` | `[UI]` yes (not submitted) |
| Reject / Deactivate from the list | list row actions | `[UI]` buttons seen; **not clicked** (§3.3) |
| API | `/api/v1/operatingcountries…` on `ndc-apis-nbo-backend-dev-2` | `[API]` spec; `[UI]` GET calls seen in the browser |

---

## 3. Business / Functional Requirements (story + specification)

Requirement IDs refer to the attached specification; *story AC* references name the story's
AC group.

### 3.1 Information model (REQ-OPC-001)

- `[E]` Attributes: Operating Country Name (required, maker), Country (required, creation only,
  immutable), Currency (required, creation only, immutable), Approval Status
  (*Pending for Approval* / *Approved* / *Rejected*, system), Approval Remarks (conditional),
  Approval Date, Approved/Rejected By, Lifecycle Status (*Active* / *Inactive*), Hierarchy
  Position (root), Site Attribution, Audit Data (REQ-OPC-001).
- `[E]` One country and one currency per Operating Country — neither is a list (REQ-OPC-001 AC-4).
- `[E]` System-managed attributes cannot be edited through the form (REQ-OPC-001 AC-2).

### 3.2 Creation (REQ-OPC-002…005; story *Creation*)

- `[E]` Add form available to users with the edit right **or** approval authority
  (REQ-OPC-002 AC-1, AC-5; story Creation AC-1).
- `[E]` Mandatory fields Name, Country, Currency; Approval Remarks **only for a user with
  approval authority**, mandatory when shown (REQ-OPC-002 AC-2, AC-4; story Creation AC-2).
- `[E]` Country list: **active countries only** on the Add form (REQ-OPC-002 AC-6). Currency
  list: **active currencies only** (REQ-OPC-002 AC-3; story Creation AC-3).
- `[E]` Success: *"Operating Country Created Successfully."*, redirect to the list
  (REQ-OPC-003 AC-1, AC-4; story Creation AC-4). System failure: *"Unable To Create Operating
  Country. Please try again."* (REQ-OPC-003 AC-3).
- `[E]` Name stored trimmed (REQ-OPC-003 AC-5; story Creation AC-6).
- `[E]` Creator with approval authority: submission **is** an Approve; remarks mandatory;
  *"Required!"* when empty; result *Approved* + *Active*, Approved By = Created By
  (REQ-OPC-003 AC-6, REQ-OPC-004 AC-2, AC-4; story Creation AC-7).
- `[E]` Creator without approval authority: Remarks not presented, action is **Send For
  Approval**, result *Pending for Approval* + *Inactive* (REQ-OPC-003 AC-7, REQ-OPC-004 AC-1).
- `[E]` Creation makes a root record only — no branch, agency, user, financial record or
  airline mapping (REQ-OPC-005; story Creation AC-9).

### 3.3 Validation & uniqueness (REQ-OPC-006…013; story *Validation & Uniqueness*)

- `[E]` Mandatory messages: *"Operating Country Name Cannot Be Empty."*, *"Country Must Be
  Selected."*, *"Currency Must Be Selected."* (REQ-OPC-006 AC-1…3).
- `[E]` Length 3–100 after trim; message *"Operating Country Name Should Be Min 3 and Max 100
  characters."* (REQ-OPC-007 AC-4, AC-5).
- `[E]` Characters: letters (accented included), space, `-`, `'`, `_`; must begin with a
  letter; leading space invalid; trailing space removed (REQ-OPC-008, 009).
- `[E]` Unique per administrative site, case-insensitive, across every approval and lifecycle
  state; never released for reuse; message *"Operating Country Already Exists."*
  (REQ-OPC-010; story Validation AC-3, AC-4).
- `[E]` Duplicate reported **during data entry, as the user leaves the name field**
  (REQ-OPC-010 AC-1, REQ-OPC-041 AC-2; story Messaging AC-1).
- `[E]` Edit without a name change raises no duplicate error; the check compares against the
  **stored** name (REQ-OPC-011).
- `[E]` Approval re-checks uniqueness: *"Another Operating Country With The Same Name Already
  Exists."*, status unchanged; **rejection is never blocked** by it (REQ-OPC-012).
- `[E]` Every rule on both client and server; server authoritative (REQ-OPC-013; story
  Validation AC-6).

### 3.4 Editing (REQ-OPC-014…018; story *Editing*)

- `[E]` Edit form pre-filled with name, country, currency, remarks; previous remarks shown in
  full and editable (REQ-OPC-014; story Editing AC-2).
- `[E]` Country and Currency read-only; the server ignores them on update (REQ-OPC-015; story
  Editing AC-3).
- `[E]` Success *"Operating Country Updated Successfully."* + redirect; failure *"Unable To
  Update Operating Country. Please try again."* (REQ-OPC-016 AC-1, AC-2).
- `[E]` Outcome by action (REQ-OPC-017 AC-1): Update keeps *Approved* as *Approved/Active*,
  *Pending* as *Pending*, turns *Rejected* into *Pending*; Send For Approval → *Pending/Inactive*;
  Approve → *Approved/Active*; Reject → *Rejected/Inactive*; Cancel → nothing.
- `[E]` The approval status is **never taken from the submission** (REQ-OPC-017 AC-2; story
  Editing AC-8).
- `[E]` Remarks: one attribute everywhere — mandatory when shown, max 250, no other rule,
  every change audited (REQ-OPC-018; story Editing AC-7).

### 3.5 Listing, search & pagination (REQ-OPC-019…023; story *Listing*)

- `[E]` Columns: Operating Country Name, Country, Currency, Lifecycle Status, Approval Status;
  only permitted actions per row; total shown (REQ-OPC-019).
- `[E]` Search by name (partial, literal — `%` and `_` not wildcards), by country, by lifecycle
  status; site-scoped (REQ-OPC-020 AC-1…6).
- `[E]` Search Country list contains **every** country, inactive ones visually marked
  (REQ-OPC-020 AC-7, AC-8).
- `[E]` No results: *"No Operating Country found. Please try again."* (REQ-OPC-020 AC-4).
- `[E]` Default: Active only, last-modified descending, page 1, size 10 — applied by the
  **server** whatever the request (REQ-OPC-021 AC-1…3).
- `[E]` Pagination keeps criteria; invalid page → page 1; totals shown (REQ-OPC-022).
- `[E]` Order applied to the whole set before paging (REQ-OPC-023).

### 3.6 Approval workflow (REQ-OPC-024…027, 029, 046; story *Approval Workflow*)

- `[E]` No assigned approver; any approval-authority holder decides (REQ-OPC-025 AC-1).
- `[E]` Approve → *Approved/Active*, *"Operating Country Approved Successfully."*; Reject →
  *Rejected/Inactive*, *"Operating Country Rejected Successfully."* (REQ-OPC-026 AC-1, AC-2).
- `[E]` Remarks mandatory on **both** approve and reject, max 250, *"Required!"*
  (REQ-OPC-027; story Approval AC-5).
- `[E]` Action matrix (REQ-OPC-039 AC-1; REQ-OPC-046 AC-2):

  | User | New | *Approved* | *Rejected* | *Pending* |
  |---|---|---|---|---|
  | Approval authority | Approve | Cancel / Approve / Reject | Approve / Cancel | Approve / Reject |
  | Edit right only | Send For Approval | Update / Cancel | Send For Approval | Update |
  | View only | — | — | — | — |

  Both acting rows also carry **Add** and **View All Branches** (REQ-OPC-039 AC-1).
- `[D]` **Effective matrix for this story** (D-02, D-03, D-01 over C-16), replacing the one above
  wherever they differ — this is what Test Cases assert:

  | User | Add | Edit form actions | List actions on *Approved/Active* | Activate / Deactivate | Approve / Reject |
  |---|---|---|---|---|---|
  | All permissions (`ADMIN_ALL`) | Yes — Approve | Cancel / Approve / Reject | Edit, Reject, Deactivate | Yes | Yes |
  | Maker | Yes — Send For Approval | Cancel / Update | Edit, Deactivate | **Yes** (D-02) | **No** (D-02) |
  | Approver | **No** (D-03) | **No Edit** (D-03) | Reject, Deactivate | Yes | Yes (list / dialog) |
  | View only | No | No | none | No | No |

  No role is offered *View All Branches* (D-01, C-16). Actions on *Pending*, *Rejected* and
  *Inactive* records were not observed — no such record exists in STG (§13).
- `[D]` **D-19** (2026-10-10, from the RUN-001 Bug Candidate review): for `ADMIN_ALL`, the Edit form
  of a *Rejected* record offers **Cancel / Approve / Reject**, and that is correct. It replaces the
  *Rejected* column (*"Approve / Cancel"*) of the specification matrix above for the all-permission
  user. What Reject does on an already *Rejected* record is not decided.
- `[E]` One operating country list for every consumer: *Approved* **and** *Active* only,
  ordered by name, site-scoped (REQ-OPC-029).

### 3.7 Lifecycle (REQ-OPC-030, 031; story *Lifecycle*)

- `[E]` Activate/Deactivate: **approved records only, approval authority only**, enforced on
  both sides (REQ-OPC-030 AC-5, AC-6; story Lifecycle AC-2).
- `[E]` Deactivation shows a warning and needs confirmation; cancel changes nothing; activation
  needs none (REQ-OPC-030 AC-8…10; story Lifecycle AC-5).
- `[D]` **D-18** (2026-10-10, from the RUN-001 Bug Candidate review): **activation also asks for a
  confirmation** — *"Activate &lt;name&gt;?"* with Cancel / Activate Operating country — and that is
  correct. It replaces *"activation needs none"* above; Test Cases assert D-18.
- `[E]` No cascade to branches, agencies or users (REQ-OPC-031) — dependency, see §2.

### 3.8 Access control (REQ-OPC-038…040; story *Access Control*)

- `[E]` No menu right → no Operating Country screen (REQ-OPC-038 AC-1).
- `[E]` View right → read only; Edit right → create/edit/send for approval; Approval authority
  → create/approve/reject/activate/deactivate (story Access AC-2…4).
- `[E]` Approval authority via the Approve right **or** the Approver user type — identical
  action sets, Add included (REQ-OPC-040 AC-3; story Access AC-6).
- `[E]` Every permission enforced server-side as well; refused actions change nothing
  (REQ-OPC-039 AC-5, AC-6; story Access AC-5).

### 3.9 Naming (REQ-OPC-045; story *Naming*)

- `[E]` Labels read **"Operating Country (POS)"**; name field **"Operating Country (POS) Name"**;
  selection controls **"Select Operating Country (POS)"**; messages say plain "Operating
  Country" (REQ-OPC-045; story Naming AC-1…3).

---

## 4. API Analysis

Operations matching `OperatingCountr` — 10 of 273. All require **Bearer** auth. Error bodies
are RFC-7807-style (`errorCode`, `errorMsg`, `businessErrorCode`, …).

| Operation | What the specification says |
|---|---|
| `GET /api/v1/operatingcountries` | `[API]` *The single list endpoint* for the admin grid **and** point-of-sale selection. Filters `Name`, `CountryId`, `Status`, `ApprovalStatus`, `OpCountryIds`, `IsPaginated`, `PageNumber`, `PageSize`. **Every filter is opt-in: an unfiltered call returns markets in any approval and lifecycle state.** Callers wanting selectable POS targets pass `approvalStatus=1&status=1`. Name matching is literal (`%`, `_` not wildcards). **An oversized `pageSize` is silently clamped, never rejected.** Item: `id`, `name`, `countryId/Name/Code`, `currencyId/Code/Name`, `status`, `approvalStatus`, `isCountryActive`, `lastModifiedAt`. |
| `POST /api/v1/operatingcountries` | `[API]` Body `name`, `countryId`, `currencyId`, `approvalStatus`, `remarks`. `approvalStatus` omitted/0 → *Pending/Inactive*, edit right only; 1 → approve-on-create, needs approval authority **and** remarks → *Approved/Active*, caller recorded as approver; 2 → **400**. Unauthorized approval → **403**, nothing created, never downgraded to pending. Lifecycle status, code and creator are server-derived. **409**: duplicate name, **inactive country/currency, or the currency is not mapped to the country.** |
| `GET /api/v1/operatingcountries/{id}` | `[API]` For the Edit form: id, code, name, country, currency, both statuses, remarks in full. Country/currency are display-only. **No audit block** and no `approvalRemarks` member. 404 for unknown id. |
| `PUT /api/v1/operatingcountries/{id}` | `[API]` *The single write path* for amendments and decisions. Partial: `name`, `approvalStatus`, `remarks` each optional, **empty body 400**. Omitted `approvalStatus` = ordinary edit preserving statuses, approver and approval date; 0 resubmits; 1 approves (authority + remarks); **2 rejects — authority required, remarks optional.** Unauthorized decision 403, nothing persisted. Country, currency, code and lifecycle status are not on the request. 409 duplicate name on a name change or approval. |
| `PATCH /api/v1/operatingcountries/{id}/approval-status` | `[API]` Approve/reject without amending: `approvalStatus` 1/2, `approvalRemarks` **mandatory, max 250**. **"Requires Approve alone, so a caller with approval authority but no edit right can still decide."** 403 without authority; 409 duplicate on approval. |
| `PATCH /api/v1/operatingcountries/{id}/status` | `[API]` Activate/deactivate — lifecycle only, explicit target `{status: 0\|1}`, idempotent. Only an *Approved* market may be activated (else **409**, nothing changed); `status: 0` accepted from any approval state. **Requires approval authority, enforced on the back end.** Never changes `approvalStatus`. |
| `GET /api/v1/operatingcountries/listof` | `[API]` Filters `Name`, `CountryId`, `Status`, `ApprovalStatus`, `IsAssingedOnly`. **No description.** |
| `POST /api/v1/operatingcountries/with-branches` | `[API]` Operating countries with their branches; optional `countryIds` (≤ 500, each > 0, else 400); **no status filter, no paging**; markets with no branches carry an empty array. |
| `GET /api/v1/Staff/assignable-operating-countries` | `[API]` Operating countries eligible and within the caller's scope (Staff feature). |
| `GET /api/v1/country/with-operating-countries` | `[API]` Countries with at least one operating country (Country feature). |

`[API]` Enums: `ApprovalStatusEnum` = 0 `NotApproved`, 1 `Approved`, 2 `Rejected`, 3 `Other`.
Lifecycle `status` = 0 `InActive`, 1 `Active` (`PATCH …/status` description).

`[I]` The Swagger cites its own requirement numbering (`FR-019`, `FR-025`), not `REQ-OPC-*`.
Traceability between the two is not stated.

`[I]` The API expresses the user's *action* through the `approvalStatus` field, then
authorises it — in substance consistent with REQ-OPC-017 AC-2 (status derived from the action
and permission, never accepted blindly), though not in form.

`[I]` Tool note: `npm run api:read` prints only the first line of a multi-line operation
summary. The full summaries above were read from the same file; no value, example or
credential was read or recorded.

---

## 5. UI Exploration Findings

STG, host `ndc-apis-nbo-frontend-dev-epf8graxc0cudjd9.northeurope-01.azurewebsites.net`,
2026-10-09. Read-only: **nothing was saved, approved, rejected, activated or deactivated.**

### 5.1 Login and environment

- `[UI]` Login page (`/auth/staff-login`): User Name, Password, Remember me, Forgot password,
  Login. An **API selector** (Development / Testing / Local) defaults to *Development*,
  displaying `ndc-apis-nbo-backend-dev-2.azurewebsites.net` — the same backend the Swagger
  describes. Username + password only; no OTP, CAPTCHA or SSO.

### 5.2 List page — `ADMIN_ALL`

- `[UI]` Heading **"Operating Country"**, button **"Add Operating Country"**.
- `[UI]` Filters: text **"Operating Country Name"**, dropdown **"Country"** (placeholder
  *"Select"*), lifecycle toggle **Active** (default, pressed) / **Inactive** / **Both**;
  **Reset**, **Search**. No Approval Status filter.
- `[UI]` Columns: **Name**, **Country**, **Currency**, **Approval Status**, **Status**,
  **Actions**.
- `[UI]` On load the browser called
  `GET /api/v1/Operatingcountries?PageNumber=1&PageSize=10&Status=1&isPaginated=true`. "Both"
  sent the same call **without** `Status`.
- `[UI]` STG holds **7** records, all *Approved / Active*: Egypt_WT_NBO, EgyptWTNBO, Kuwait,
  WT-USD, Dubai, Saudi Arabia, Egypt. "Both" returned the same 7 — **no Inactive, Pending or
  Rejected record exists** for this user's view.
- `[UI]` Footer: *"Showing 1 to 7 of 7"*, status *"7 operating countries"*, First / Previous /
  Next / Last, page buttons, **Rows per page** dropdown (default 10).
- `[UI]` Row actions on every *Approved/Active* row: **Edit** (link to `/…/operating-country/<id>`),
  **Reject**, **Deactivate**. No Approve and **no View All Branches** action.
- `[UI]` Search Country dropdown is loaded from `GET /api/v1/country/listof?Status=1` and
  holds **260** options; none is marked inactive.
- `[UI]` Name search `GYP` returned Egypt_WT_NBO, EgyptWTNBO, Egypt — **partial and
  case-insensitive**. `_` returned only `Egypt_WT_NBO` — **literal**. `%` is URL-encoded and
  sent as-is.
- `[UI]` No results: **"No operating countries match these filters"** with *"Nothing matches
  the current filters. Change them, or clear them to see all operating countries."*

### 5.3 Add form — `ADMIN_ALL` (approval authority)

- `[UI]` Heading **"Add Operating Country"**, subtitle *"Fill in the details to add a new
  operating country. It is approved as soon as you save it."*
- `[UI]` Section *Operating details*: **Operating Country Name**, **Country**, **Currency** —
  all *(required)*. Section **Remarks** *(required)*: *"Context for the approver. Stored with
  the approval record."*
- `[UI]` Actions: **Cancel**, **Approve**.
- `[UI]` Country list: `GET /api/v1/country/listof` **without** a status filter — **265**
  options. Currency list: `GET /api/v1/Currency/listof` without a filter — **211** options.
  Choosing a Country (*Egypt*) did **not** narrow the Currency list.
- `[UI]` Pressing Approve with everything empty: no request was sent; banner *"4 fields need
  attention — Fix the highlighted fields below, then approve."*; field messages
  **"Operating Country Name is required."**, **"Country is required."**, **"Currency is
  required."**, **"Remarks is required."**
- `[UI]` Name, validated on leaving the field:

  | Typed | Result |
  |---|---|
  | `ab` | **"Operating Country Name must be between 3 and 100 characters."** |
  | 101 letters | same message (the input has no `maxlength`; 101 characters can be typed) |
  | `1abc`, `Abc@Def`, `Ab  Cd` | **"Operating Country Name may contain Latin letters only, joined by single spaces, apostrophes, hyphens or underscores."** |
  | ` Abcd` (leading space) | **"Operating Country Name may not start with a space or contain consecutive spaces."** |
  | `Côte d'Ivoire` | accepted (field no longer invalid) |
  | `Guinea-Bissau_O'Test ` (trailing space) | accepted |
  | `kuwait` (existing *Kuwait*) | **accepted — no duplicate message, no request sent** |

- `[UI]` After a valid value replaced an invalid one, the previous message text was still
  present and rendered in the field's status region while the field was no longer marked
  invalid. Seen during rapid re-typing; whether a user sees it in normal use is unconfirmed.
- `[UI]` Remarks: no `maxlength`; a counter shows *"256 / 250"*; message **"Remarks must not
  exceed 250 characters."**

### 5.4 Edit form — `ADMIN_ALL`, *Approved/Active* record (Kuwait, id 19969)

- `[UI]` Heading **"Edit Operating Country"**, subtitle *"You decide on this operating country
  when you save."*
- `[UI]` Name editable with counter *"6 / 100"*; **Country and Currency disabled**, showing
  *Kuwait* / *Kuwaiti Dinar*; Remarks pre-filled with the stored text (counter *"1 / 250"*).
- `[UI]` Actions: **Cancel**, **Approve**, **Reject** — no plain Update.

### 5.5 `OPERATING_COUNTRIES_MAKER` (View & Edit — Maker)

- `[UI]` List: **Add Operating Country** shown; row actions **Edit**, **Deactivate**.
- `[UI]` Add form subtitle *"It goes to the approval queue when you save."*; **Remarks
  (required) is shown**; actions **Cancel**, **Send For Approval**.
- `[UI]` Edit form on an *Approved* record: subtitle *"Your changes are saved and this operating
  country keeps its current approval status."*; Remarks shown; actions **Cancel**, **Update**.

### 5.6 `OPERATING_COUNTRIES_APPROVER` (View & Edit — Approver)

- `[UI]` List: **no Add button**; row actions **Reject**, **Deactivate** only — **no Edit**.

### 5.6a `OPERATING_COUNTRIES_VIEW_ONLY` (View only) — second run, 2026-10-09

- `[UI]` Login with the corrected account (D-04) **succeeded** — username/password, landed on
  `/dashboard`; the Operating Country menu entry is reachable.
- `[UI]` List: same filters (name, Country, Active/Inactive/Both, Reset, Search), same columns,
  same 7 records; **no "Add Operating Country" button**; the **Actions column is empty on every
  row** — no Edit, Approve, Reject, Activate or Deactivate.
- `[UI]` Navigating directly to `/admin/company/operating-country/add` **redirects back to the
  list** — the Add form is not reachable by URL.
- `[UI]` Not checked: a direct Edit URL (`/…/operating-country/<id>`) as View-only.

### 5.6b Observed while preparing test data — 2026-10-10

- `[UI]` As `OPERATING_COUNTRIES_MAKER`, **Send For Approval** on the Add form opens a dialog
  *"Submit this operating country for approval?"* — *"It goes to an approver and takes effect once
  approved."* — with **Cancel** and **Send For Approval**. Nothing is sent until it is confirmed.
- `[UI]` After confirming, the list is shown and a toast reads *"Operating Country sent for approval
  successfully"*. Four records were created this way (`POST /api/v1/Operatingcountries` → 201).
- `[UI]` **Egypt / Egyptian Pound** is accepted as a pair — the server did not refuse it.
- `[UI]` Read-only check of the supplied master data (D-08), through the app's own GET calls:
  the inactive Country and the inactive Currency both have lifecycle status **Inactive (0)** and
  approval status **Rejected (2)**.

### 5.7 Not observed, deliberately

- `[UI]` No Reject, Deactivate, Approve, Update or Send For Approval was performed: each changes
  shared STG data. The deactivation warning/confirmation dialog, the reject remarks dialog,
  every success/failure toast, server-side validation and duplicate detection on submit, the
  audit log and site scoping therefore remain **unobserved**.
- `[UI]` Pagination beyond one page could not be seen — only 7 records exist.

### 5.8 Locator notes for later automation

- `[I]` Stable accessible names exist: `textbox "Operating Country Name (required)"`,
  `combobox "Country (required)"`, `combobox "Currency (required)"`, `textbox "Remarks
  (required)"`, buttons by visible name, `table "Operating countries"`, `region "Operating
  countries"`, `navigation "Pagination"`, `combobox "Rows per page"`. Dropdown triggers use
  generated ids (`#pn_id_…`) — avoid them. Dropdowns are **virtual-scrolled** (`aria-setsize`
  carries the full count). No `data-testid` was seen.

---

## 6. Business Rules — expected behaviour after D-01

`[D]` D-01: where the implementation was observed to differ, the implementation is expected.
The rule table below is what a later Test Case should assert.

| # | Rule | Expected | Basis |
|---|---|---|---|
| BR-01 | Name mandatory | Blocked; *"Operating Country Name is required."* | `[D]` D-01 over REQ-OPC-006 AC-1 (C-03) |
| BR-02 | Country mandatory | *"Country is required."* | `[D]` D-01 (C-03) |
| BR-03 | Currency mandatory | *"Currency is required."* | `[D]` D-01 (C-03) |
| BR-04 | Remarks mandatory where shown | *"Remarks is required."* (form) | `[D]` D-01 over *"Required!"* (C-04) — dialogue text unobserved, OQ-10 |
| BR-05 | Name length 3–100 | *"Operating Country Name must be between 3 and 100 characters."* | `[D]` D-01 (C-05) |
| BR-06 | Name characters | letters incl. accented, single spaces, `'`, `-`, `_`; begins with a letter; **no consecutive spaces**; message *"…may contain Latin letters only, joined by single spaces, apostrophes, hyphens or underscores."* | `[D]` D-01 (C-06) |
| BR-07 | Leading space | *"Operating Country Name may not start with a space or contain consecutive spaces."* | `[D]` D-01 (C-06) |
| BR-08 | Trailing space | accepted at entry; **trimmed on save** | `[E]` REQ-OPC-009 — save not observed |
| BR-09 | Remarks ≤ 250 | *"Remarks must not exceed 250 characters."* | `[D]` D-01 (C-04) |
| BR-10 | Duplicate name | **No check at data entry**; on submit the save is refused with *"Operating Country Already Exists."* | `[D]` D-01 for the data-entry half (C-08); `[D]` **D-12** for the message (closed OQ-07) |
| BR-11 | Country/Currency immutable | disabled on Edit; not on the PUT request | `[UI]` + `[API]` agree with `[E]` REQ-OPC-015 |
| BR-12 | Approver creates | Add form: Remarks + **Approve** only → *Approved/Active* | `[UI]` + `[API]` agree with `[E]` |
| BR-13 | Maker creates | Add form shows **Remarks (required)** + **Send For Approval** → *Pending/Inactive* | `[D]` D-01 over REQ-OPC-003 AC-7 (C-13) |
| BR-14 | Approver edits an *Approved* record | Cancel / Approve / Reject | `[UI]` agrees with `[E]` REQ-OPC-046 AC-2 |
| BR-15 | Maker edits an *Approved* record | Cancel / Update; statuses kept | `[UI]` agrees with `[E]` REQ-OPC-016 AC-5 |
| BR-16 | Default list | Active only, page 1, size 10 — **requested by the front end**; an unfiltered API call returns every state | `[D]` D-01 for UI; `[API]` documents the API half (C-17) |
| BR-17 | Search Country list | **Active countries only**, no inactive marking | `[D]` D-01 over REQ-OPC-020 AC-7 (C-10) |
| BR-18 | Add-form Country/Currency lists | **Unfiltered** in the UI; the server refuses an inactive country with *"The selected country is not active."* and an inactive currency with a refusal whose message is undecided | `[D]` D-01 for the UI (C-11); `[D]` **D-11** for the inactive-country message; inactive-currency message still OQ-06 |
| BR-19 | Name search | partial, case-insensitive, literal `_` and `%` | `[UI]` + `[API]` agree with `[E]` |
| BR-20 | No results | *"No operating countries match these filters"* | `[D]` D-01 (C-09) |
| BR-21 | Labels | "Operating Country", column "Name", field "Operating Country Name", lifecycle column "Status", section "Remarks" | `[D]` D-01 over REQ-OPC-045 (C-01, C-02) |
| BR-22 | Activate / Deactivate | **Maker and Approver** may activate and deactivate; the Maker is offered Deactivate on an *Approved/Active* record. A Maker activating/deactivating is expected to **succeed** — a server refusal would be a defect against D-02 | `[D]` D-02 over REQ-OPC-030 AC-5 and the Swagger for `PATCH …/status` (C-14) |
| BR-22a | Maker decisions | The Maker is **never** offered Approve or Reject — Add form: Send For Approval; Edit: Update / Cancel | `[D]` D-02, matches `[UI]` §5.5 |
| BR-23 | Approver's Add/Edit | The Approver is offered **no Add and no Edit** — list actions Reject / Deactivate (on *Approved/Active*) | `[D]` D-03 over REQ-OPC-002 AC-5, 039 AC-1, 040 AC-3 (C-15) |
| BR-23a | View-only | List visible; **no Add, no row action**; direct `/add` URL redirects to the list | `[UI]` §5.6a, agrees with `[E]` REQ-OPC-039 AC-1/AC-2 |
| BR-24 | Reject remarks | **The implementation decides** (D-05). Its behaviour: `PATCH …/approval-status` — remarks **required**, max 250 `[API]`; `PUT …/{id}` with `approvalStatus=2` — remarks **optional** `[API]`; UI — the Remarks field is marked *(required)* on the Edit form an Approver uses to reject `[UI]` §5.4, but Reject with empty remarks was **not exercised**. Test Cases **observe and record** the UI outcome of Reject-without-remarks rather than assert a side | `[D]` D-05 (C-19) |
| BR-25 | Currency mapped to country | **The implementation decides** (D-06). Its behaviour: the Add form offers **every** currency whatever Country is chosen `[UI]` §5.3; the server refuses an unmapped pair with **409** `[API]` `POST /api/v1/operatingcountries`. The on-screen message for that refusal is unobserved — record it (OQ-06) | `[D]` D-06 (C-12) |

Rules with no conflict keep their `[E]` form from §3: the action outcome table
(REQ-OPC-017 AC-1), uniqueness scope and approval re-check (REQ-OPC-010, 012), the approval
messages (REQ-OPC-026), the one Operating Country list (REQ-OPC-029), activation preconditions
(REQ-OPC-030 AC-5 — `[API]` agrees), and server-side enforcement (REQ-OPC-013, 039 AC-5).

---

## 7. Fields and Validations

| Field | Add | Edit | Rules (expected) |
|---|---|---|---|
| Operating Country Name | text, required | text, required, counter `n / 100` | BR-01, 05, 06, 07, 08, 10 |
| Country | dropdown, required, unfiltered (265) | disabled | BR-02, 11, 18 |
| Currency | dropdown, required, unfiltered (211), not narrowed by Country | disabled | BR-03, 11, 18, 25 |
| Remarks | textarea, required, counter `n / 250` — shown to **both** roles | pre-filled, required | BR-04, 09, 13 |
| Search: name | text | — | BR-19 |
| Search: Country | dropdown, active only (260) | — | BR-17 |
| Search: lifecycle | Active (default) / Inactive / Both | — | `[UI]` §5.2 |
| Rows per page | dropdown, default 10 | — | `[UI]` §5.2 |

---

## 8. State Transitions

`[E]` (REQ-OPC-017 AC-1, 026, 030, 046), unchanged by D-01 — no transition was observed, so no
conflict exists:

```
(new) --Send For Approval [edit only]--------> Pending / Inactive
(new) --Approve [authority + remarks]--------> Approved / Active
Pending  --Update [edit only]----------------> Pending / Inactive
Pending  --Approve [authority + remarks]-----> Approved / Active
Pending  --Reject [authority, remarks ?]-----> Rejected / Inactive
Approved --Update [edit only]----------------> Approved / Active (unchanged)
Approved --Approve [authority + remarks]-----> Approved / Active (fresh decision)
Approved --Reject [authority, remarks ?]-----> Rejected / Inactive
Rejected --Send For Approval [edit only]-----> Pending / Inactive
Rejected --Approve [authority + remarks]-----> Approved / Active
Approved+Active   --Deactivate [maker or authority]--> Approved / Inactive    [D] D-02
Approved+Inactive --Activate [maker or authority]----> Approved / Active      [D] D-02
Pending/Rejected  --Activate------------------> refused (409), unchanged     [API]
any --Cancel------------------------------------> unchanged
```

`remarks ?` → BR-24 (D-05): required on the PATCH route, optional on the PUT route, UI outcome
to be observed. Activate/Deactivate by a Maker → D-02 (closed OQ-01).

---

## 9. User Flows

1. `[E]` Maker creates → *Pending* → Approver approves (remarks) → *Approved/Active*, listed by
   default.
2. `[E]` Maker creates → Approver rejects → *Rejected/Inactive* → Maker amends → *Pending* →
   approve.
3. `[E]` Approver creates directly → *Approved/Active* (Approved By = Created By).
4. `[E]` Approver deactivates (with confirmation) → *Inactive*, gone from the default list and
   every selection list → activates → back.
5. `[E]` Search by name / country / lifecycle → paginate → criteria kept.
6. `[UI]` Maker edits an *Approved* record → Update → statuses kept.

---

## 10. Positive and Negative Scenarios

### 10.1 Positive

- `[I]` Create as Maker (remarks given) → *Pending/Inactive*; appears under Inactive/Both only.
- `[I]` Create as `ADMIN_ALL` → *Approved/Active*; top of the default list.
- `[I]` Accented name (`Côte d'Ivoire`), name with `-`, `'`, `_`; boundary lengths 3 and 100;
  trailing space trimmed on save.
- `[I]` Edit name only, unchanged name saves without a duplicate error.
- `[I]` Approve / reject a *Pending* record; approve a *Rejected* record; reject an *Approved* one.
- `[I]` Deactivate (confirm) and activate an *Approved* record — as Approver **and as Maker**
  (D-02).
- `[I]` View-only sees the list and searches, with no action anywhere (BR-23a).
- `[I]` Search partial / case-insensitive / literal `_` and `%`; filter by Country and lifecycle;
  pagination with criteria kept (needs > 10 records).

### 10.2 Negative

- `[I]` Each mandatory field empty; length 2 and 101; digit, symbol, leading space,
  consecutive spaces.
- `[I]` Duplicate name — same case, different case, against a *Rejected* / *Inactive* record;
  on create, on rename, at approval (*"Another Operating Country With The Same Name Already
  Exists."*).
- `[I]` Remarks empty / 251 characters on approve, reject, create-as-approver, edit.
- `[I]` Maker is offered no Approve/Reject (D-02); Approver is offered no Add/Edit and `/add`
  by URL (D-03 — URL behaviour for the Approver not yet observed); view-only user sees no
  actions and is redirected from `/add`; user without menu right
  cannot reach any screen (direct URL included).
- `[I]` Activate a *Pending* / *Rejected* record → refused, unchanged (`[API]` 409).
- `[I]` Cancel on deactivation confirm → unchanged.

---

## 11. Current Behaviour vs Required Behaviour

| # | Required `[E]` | `[API]` | `[UI]` | Outcome |
|---|---|---|---|---|
| C-01 | Labels "Operating Country (POS)", "Operating Country (POS) Name" (REQ-OPC-045) | — | "Operating Country", column "Name", field "Operating Country Name" | `[D]` D-01 → implementation |
| C-02 | Columns "Lifecycle Status", "Approval Status" (REQ-OPC-019) | — | "Status", "Approval Status" | `[D]` D-01 → implementation |
| C-03 | *"…Cannot Be Empty."*, *"Country Must Be Selected."*, *"Currency Must Be Selected."* (REQ-OPC-006) | — | *"… is required."* ×3 | `[D]` D-01 → implementation |
| C-04 | Remarks *"Required!"* (REQ-OPC-018 AC-1, 027 AC-2); section "Approval Remarks" | max 250 | *"Remarks is required."*, *"Remarks must not exceed 250 characters."*; section "Remarks" | `[D]` D-01 → implementation **for the form**; the decision dialogue is unobserved (OQ-10) |
| C-05 | *"…Should Be Min 3 and Max 100 characters."* (REQ-OPC-007 AC-4) | — | *"…must be between 3 and 100 characters."* | `[D]` D-01 → implementation |
| C-06 | Letters incl. accented, space, `-` `'` `_`; begins with a letter (REQ-OPC-008) | — | adds **no consecutive spaces**; wording "Latin letters only"; accented accepted | `[D]` D-01 → implementation (extra rule becomes expected) |
| C-07 | Trailing space trimmed (REQ-OPC-009) | — | accepted at entry; storage unobserved | no conflict seen; verify on save |
| C-08 | Duplicate reported as the user leaves the field (REQ-OPC-041 AC-2; story Messaging AC-1) | 409 on create / rename / approve | **no check at data entry** | `[D]` D-01 → no data-entry check; `[D]` D-12 → message *"Operating Country Already Exists."* |
| C-09 | *"No Operating Country found. Please try again."* (REQ-OPC-020 AC-4) | — | *"No operating countries match these filters"* | `[D]` D-01 → implementation |
| C-10 | Search Country list = **all** countries, inactive marked (REQ-OPC-020 AC-7) | — | `country/listof?Status=1`, 260, none marked | `[D]` D-01 → implementation |
| C-11 | Add-form Country and Currency lists **active only** (REQ-OPC-002 AC-3, AC-6) | 409 on an inactive country/currency | lists **unfiltered** (265 / 211) | `[D]` D-01 → unfiltered lists; `[D]` D-11 → inactive-country message; inactive-currency message open (OQ-06) |
| C-12 | — (no rule) | 409 when the currency is **not mapped to the country** | Currency list not narrowed by Country | `[D]` **D-06** → implementation: list unfiltered, server refuses an unmapped pair (BR-25); closed OQ-05 |
| C-13 | Maker's Add form has **no** Remarks (REQ-OPC-002 AC-4, 003 AC-7) | `remarks` optional on send-for-approval | Remarks **shown and required** for the Maker | `[D]` D-01 → implementation |
| C-14 | Activate/Deactivate: **approval authority only**, both sides (REQ-OPC-030 AC-5, AC-6) | `PATCH …/status` requires approval authority | **Maker is offered Deactivate** | `[D]` **D-02** → the UI is correct: Makers activate and deactivate, never approve/reject (BR-22). The Swagger's "approval authority" statement stays recorded as conflicting evidence; closed OQ-01 |
| C-15 | Approval authority carries **Add** and Edit (REQ-OPC-002 AC-5, 039 AC-1, 040 AC-3) | decision possible with Approve right alone, no edit right | Approver account: **no Add, no Edit** | `[D]` **D-03** → the UI is correct (BR-23); closed OQ-02 |
| C-16 | Each row carries **View All Branches** (REQ-OPC-037, 039 AC-1) | `POST …/with-branches` exists | **no such action** | `[D]` D-01 → not offered; `[?]` OQ-11 to confirm |
| C-17 | Server applies the default whatever the request (REQ-OPC-021 AC-2, AC-3) | unfiltered call returns **every** state | front end sends `Status=1` | `[D]` D-01 → implementation (default is client-side) |
| C-18 | Invalid paging → page 1, size 10 (REQ-OPC-022 AC-3; story Listing AC-6) | oversized `pageSize` **clamped** | not observable in the UI | `[?]` OQ-12 (API-route only) |
| C-19 | Reject remarks **mandatory** (REQ-OPC-027) | PUT: reject remarks **optional**; PATCH: mandatory | Remarks marked *(required)* on the Edit form; Reject-without-remarks not exercised | `[D]` **D-05** → implementation: PATCH required, PUT optional, UI outcome recorded on first execution (BR-24); closed OQ-04 |
| C-20 | Audit history of every change (REQ-OPC-017 AC-5, 018 AC-7) | GET by id has **no audit block** | no audit view seen | `[D]` **D-14** → out of scope for US-52857 (closed OQ-09) |

---

## 12. Contradictions / Gaps in the sources

- `[E]` The story's *Approval Workflow* AC-3 / AC-4 text is garbled in Azure DevOps: the
  *Rejected/Inactive* line sits under AC-3 and AC-4's outcome is empty. REQ-OPC-026 AC-1/AC-2
  states both outcomes clearly; this analysis uses the specification.
- `[E]` The story's *Listing* AC-1 renders its column list **above** the AC heading, and the
  AC body reads "Only actions permitted…". REQ-OPC-019 AC-1 is used.
- `[E]` REQ-OPC-026 has **two AC-5s** (Cancel; duplicate refusal). Both are kept.
- `[E]` REQ-OPC-026 AC-5 says *"A decision is refused"* on a duplicate name; REQ-OPC-012 AC-3
  says **rejection is never blocked**. REQ-OPC-012 is the specific rule; `[I]` read AC-5 as
  approval only. `[API]` agrees: 409 *"Approval blocked by another market with the same name."*
- `[E]` §6 still describes the code-to-label mapping as *"to be confirmed in planning"*.
  `[API]` adds a fourth approval value, `3 Other`, that the specification never mentions
  (OQ-13).
- `[E]` `WARN-OPC-030` (two hierarchy encodings) and `WARN-OPC-035` (residual labels) are
  open **by choice** in the specification. Neither is ours to decide; neither blocks this story.

---

## 13. Test Environment / Test Data Prerequisites

| Need | Status | Handle |
|---|---|---|
| STG Admin Panel URL + `APP_ENV=STG` | **Configured** 2026-10-09 | — |
| All-permission account | **Configured** | `ADMIN_ALL` |
| Maker (edit, no approval authority) | **Configured** | `OPERATING_COUNTRIES_MAKER` |
| Approver | **Configured** — no Add/Edit by design (D-03) | `OPERATING_COUNTRIES_APPROVER` |
| View-only | **Configured and validated** 2026-10-09 (D-04) | `OPERATING_COUNTRIES_VIEW_ONLY` |
| User with **no** Operating Country menu right | **Configured** 2026-10-10 (D-07); login not yet exercised | `OPC_USER_NO_MENU` |
| Approver **user type** (vs Approve right) — to test equivalence | **Missing** | — |
| User on a **different administrative site** | **Missing** — no case needs it since TC-52857-052 was deleted (D-10) | `OPC_USER_OTHER_SITE` |
| Records *Pending*, *Rejected*, *Approved+Inactive* | **None exist in STG** — must be created by the cases themselves | — |
| > 10 records (pagination, ordering across pages) | **11 exist** since 2026-10-10: 7 originals + 4 *Pending / Inactive* `AUT Pagination Alpha … Delta` (D-09) | — |
| An inactive Country and an inactive Currency | **Configured and verified** 2026-10-10 (D-08) — both Inactive **and** Rejected | `OPC_COUNTRY_INACTIVE`, `OPC_CURRENCY_INACTIVE` |
| An Approved-but-Inactive Country | Not available — the supplied one is also Rejected | — |
| Test-data naming | Every created name contains `AUT` and is unique; never reuse a name (D-17) | — |
| A **mapped** Country/Currency pair | `[I]` The 7 existing records were created with Egypt / Egyptian Pound, Kuwait / Kuwaiti Dinar, United States / United States Dollar, United Arab Emirates / United Arab Emirates Dirham, Saudi Arabia / Saudi Riyal — likely mapped; unconfirmed | — |
| A currency **not mapped** to a country (D-06) | Unconfirmed — which pairs the server rejects is not known | — |

`[I]` **Almost every case writes STG data.** Creating, approving, rejecting and deactivating
are the feature. Names must be unique forever (REQ-OPC-010 AC-6) and records cannot be deleted
(REQ-OPC-030 AC-11), so every run consumes names permanently — cases need a unique-name
convention per run. Deactivating one of the 7 existing *live* markets could affect other
teams — use records the cases create.

### Not practically testable as stated

- `[I]` Audit history (C-20) — no UI view, no API member.
- `[I]` Server-side re-validation through the UI alone — the front end blocks first; needs the
  API route.
- `[I]` System-failure messages (*"Unable To Create/Update…"*) — need a fault.
- `[I]` Consumer screens (Branch, Staff, rules) — out of scope, §2.

---

## 14. Requirement → Coverage Map

| Requirement | Area | Covered by | Note |
|---|---|---|---|
| REQ-OPC-001 | Model | BR-11; §7 | AC-3 audit → C-20 |
| REQ-OPC-002 | Add form access & lists | BR-12, 13, 17, 18, 23, 25 | C-11, C-13, C-15 → D-03 |
| REQ-OPC-003 | Create | BR-01…07, 12, 13 | success toast unobserved |
| REQ-OPC-004 | State at creation | §8 | |
| REQ-OPC-005 | No side effects | §8 | observable only through Branch/User data — dependency |
| REQ-OPC-006 | Mandatory | BR-01…03 | C-03 |
| REQ-OPC-007 | Length | BR-05 | C-05 |
| REQ-OPC-008 | Characters | BR-06, 07 | C-06 |
| REQ-OPC-009 | Trim | BR-08 | C-07 |
| REQ-OPC-010 | Uniqueness | BR-10 | C-08 |
| REQ-OPC-011 | Edit self-exclusion | §10 | |
| REQ-OPC-012 | Approval re-check | §10.2 | |
| REQ-OPC-013 | Both sides | §13 | API route needed |
| REQ-OPC-014 | Edit form | BR-14, 15 | |
| REQ-OPC-015 | Immutable country/currency | BR-11 | |
| REQ-OPC-016 | Update | BR-15; §8 | |
| REQ-OPC-017 | Status from action | §8 | AC-5 audit → C-20 |
| REQ-OPC-018 | Remarks rules | BR-04, 09 | C-04 |
| REQ-OPC-019 | List | BR-21 | C-02 |
| REQ-OPC-020 | Search | BR-17, 19, 20 | C-09, C-10; site scope needs data |
| REQ-OPC-021 | Default | BR-16 | C-17 |
| REQ-OPC-022 | Pagination | §10 | needs > 10 records; C-18 |
| REQ-OPC-023 | Order | §10 | needs > 10 records |
| REQ-OPC-024 | Maker–checker | §8 | |
| REQ-OPC-025 | Send for approval | BR-13 | |
| REQ-OPC-026 | Approve/Reject | §8 | toasts unobserved |
| REQ-OPC-027 | Decision remarks | BR-04, 24 | C-19 → D-05 |
| REQ-OPC-029 | One list | §3.6 | consumers out of scope; the list endpoint is in scope |
| REQ-OPC-030 | Activate/Deactivate | BR-22; §8 | C-14 → D-02; confirm dialog unobserved |
| REQ-OPC-031 | No cascade | — | dependency, OQ-08 |
| REQ-OPC-033 | Root | — | not observable in the UI |
| REQ-OPC-034…036 | Branch/Staff/rules | — | dependency, OQ-08 |
| REQ-OPC-037 | View All Branches | — | C-16 |
| REQ-OPC-038 | Menu gating | §10.2 | needs a no-right user |
| REQ-OPC-039 | Action matrix | BR-12…15, 22, 22a, 23, 23a; effective matrix §3.6 | C-14 → D-02, C-15 → D-03 |
| REQ-OPC-040 | Two routes to authority | BR-23 | AC-3 superseded by D-03 for Add/Edit; Approver-type user still missing |
| REQ-OPC-041 | Data-entry feedback | BR-10 | C-08 |
| REQ-OPC-042 | Messages | BR-* | C-03, 04, 05, 09; toasts unobserved |
| REQ-OPC-043 | Return to list | §10 | |
| REQ-OPC-045 | Labels | BR-21 | C-01 |
| REQ-OPC-046 | Direct decision | BR-12, 14 | |
| REQ-OPC-028, 032, 044 | — | — | **withdrawn** in the specification |

---

## 15. Open Questions

**No blocking question remains.** OQ-01…OQ-05 are closed by D-02…D-06 and kept below for
traceability. The open ones are non-blocking: each either asks for an on-screen text to be
recorded at first execution, or concerns scope and test data rather than an expected result.

| ID | Question | Impact | Blocks |
|---|---|---|---|
| ~~OQ-01~~ | ~~The Maker is offered **Deactivate** while the Swagger reserves `PATCH …/status` for approval authority (C-14).~~ **Closed by D-02:** Makers activate and deactivate; they never approve or reject. | — | Closed |
| ~~OQ-02~~ | ~~The Approver sees **no Add and no Edit** (C-15).~~ **Closed by D-03:** correct by design. | — | Closed |
| ~~OQ-03~~ | ~~The View-only username duplicated the Maker's.~~ **Closed by D-04:** corrected; login validated on STG (§5.6a). | — | Closed |
| ~~OQ-04~~ | ~~Are remarks mandatory on **Reject** (C-19)?~~ **Closed by D-05:** the implementation decides — PATCH required, PUT optional, UI outcome recorded (BR-24). | — | Closed |
| ~~OQ-05~~ | ~~Must the Currency be mapped to the Country (C-12)?~~ **Closed by D-06:** the implementation decides — UI unfiltered, server 409 (BR-25). | — | Closed |
| OQ-06 | Which message does the user see when the server refuses a create for an **inactive Currency** or a Currency **not mapped** to the Country (BR-25)? *(The inactive-Country message is decided — D-11.)* | Negative create cases | No — record observed text |
| ~~OQ-07~~ | ~~Duplicate-name message on submit.~~ **Closed by D-12:** *"Operating Country Already Exists."* | — | Closed |
| OQ-08 | Are the *Organization Hierarchy & Dependencies* ACs (Branch selection, Staff scope, commercial rules) in scope for this story's testing, or only as dependencies (§2)? | Scope of ~6 ACs | No |
| ~~OQ-09~~ | ~~How is the audit history verified?~~ **Closed by D-14:** Audit History is out of scope for US-52857. | — | Closed |
| OQ-10 | The reject/approve and deactivate **dialogs** were not opened. What do they show (remarks rule, warning text)? Observable only by acting on a record. | Decision and deactivation cases | No — record observed |
| OQ-11 | **View All Branches** (REQ-OPC-037) is absent. Confirm it is intentionally not provided (D-01 reads it so). | REQ-OPC-037 | No |
| ~~OQ-12~~ | ~~Is the API route in scope?~~ **Closed by D-13 + D-15:** no standalone API test cases for US-52857; API testing of the Operating Country module in general remains in scope. | — | Closed |
| OQ-13 | What does `ApprovalStatus = 3 (Other)` mean for an Operating Country? | Status display | No |
| ~~OQ-14~~ | ~~Who may create permanent records, under what naming?~~ **Closed by D-16 + D-17:** test data may be created on STG under the safety controls; every created name contains `AUT` and is unique. | — | Closed |

### Warnings from the specification that are NOT open questions here

- `WARN-OPC-030`, `WARN-OPC-035` — open in the specification by choice; outside this story's
  testable behaviour.

---

## 16. Confirmed decisions

| ID | Decision | Effect here |
|---|---|---|
| D-01 | Current implementation is the source of truth where it conflicts with the story or the Swagger (2026-10-09) | Resolved C-01…C-11, C-13, C-16, C-17 in favour of the observed implementation (§6, §11). Did **not** resolve C-12, C-14, C-15, C-18…C-20: implementation unobserved, or UI and API disagree |
| D-02 | Makers can Activate and Deactivate; Makers cannot Approve or Reject; the UI is correct (2026-10-09) | Closed **OQ-01**; resolved C-14; BR-22, BR-22a; §3.6 effective matrix; §8. Conflicting evidence kept: REQ-OPC-030 AC-5/AC-6, Swagger `PATCH …/status` |
| D-03 | Approvers cannot Add or Edit; the UI is correct (2026-10-09) | Closed **OQ-02**; resolved C-15; BR-23; §3.6. Conflicting evidence kept: REQ-OPC-002 AC-5, 039 AC-1, 040 AC-3 |
| D-04 | Corrected View-only account (2026-10-09) | Closed **OQ-03**; handle configured and validated (§5.6a, §13); BR-23a |
| D-05 | Reject remarks follow the current UI and API (2026-10-09) | Closed **OQ-04**; resolved C-19; BR-24 |
| D-06 | Currency/Country mapping follows the current UI and API (2026-10-09) | Closed **OQ-05**; resolved C-12; BR-25 |
| D-07 | Account without the menu right supplied (2026-10-10) | §13; unblocks TC-52857-007 |
| D-08 | Inactive Country and Currency supplied; verify, never change (2026-10-10) | §13, §5.6b; unblocks TC-52857-019, -050 |
| D-09 | Pagination data may be created, `AUT` names, confirmed first (2026-10-10) | §13; 4 records created; unblocks TC-52857-051 |
| D-10 | TC-52857-052 invalid — deleted from the CSV (2026-10-10) | Overrides §6.1 for that case; REQ-OPC-020 AC-5 now uncovered |
| D-11 | Inactive-Country message *"The selected country is not active."* (2026-10-10) | Closed OQ-06 in part; BR-18, C-11 |
| D-12 | Duplicate-name message *"Operating Country Already Exists."* (2026-10-10) | Closed **OQ-07**; BR-10, C-08 |
| D-13 | No standalone API test cases for US-52857 (2026-10-10) | Closed **OQ-12** with D-15 |
| D-14 | Audit History out of scope for US-52857 (2026-10-10) | Closed **OQ-09**; C-20 |
| D-15 | API testing in scope for the module generally (2026-10-10) | Closed **OQ-12** with D-13 |
| D-16 | Test data may be created on STG (2026-10-10) | Closed **OQ-14** with D-17 |
| D-17 | Created names contain `AUT`, unique, never reused (2026-10-10) | Closed **OQ-14** with D-16 |

`[I]` **Why D-02 and D-03 raise no new blocking question.** Step 5 of the Skill says a decision
that conflicts with the specification or the API specification keeps the decision, records the
conflicting evidence and raises a blocking question. Both conflicts were put to the human as
OQ-01/OQ-02 *with* that evidence, and the human decided with it in view. The evidence is kept in
`decisions.md` and in §11. Asking the same question again would re-open a decision, not surface
a hidden conflict. If execution shows the server refusing a Maker's deactivation (the Swagger's
403), that is a **finding against D-02** to classify, not an open requirement.
