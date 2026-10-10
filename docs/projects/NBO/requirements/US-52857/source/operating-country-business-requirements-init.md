# Operating Country — Business Requirements Specification

| | |
|---|---|
| **Feature** | Operating Country (Admin › Company › Operating Country) |
| **Requirement Prefix** | `OPC` |
| **Module** | Administration Portal — Company & Organization Master Data |
| **Source System (reverse-engineered)** | `sheenrd/old-po-java` (Odeysys Travel Platform) |
| **Document Status** | Init — inconsistencies raised as warnings, all deferred to the planning phase |
| **Date** | 2026-08-01 |
| **Last Updated** | 2026-08-02 (revised per change requests CR-OPC-001 … CR-OPC-016) |

---

## 1. Introduction

### 1.1 Purpose

This document records the complete business requirements of the **Operating Country** feature exactly as it behaves in the legacy system, so that the same feature can be rebuilt from scratch. Requirements are expressed in business terms — what the system must do and what the user sees — and deliberately exclude implementation detail.

### 1.2 Scope

**In scope:** definition and maintenance of operating country records; the country and currency each operating country is bound to; the maker–checker approval workflow that governs them; listing, searching and pagination; the lifecycle (active/inactive) state; the position of an operating country at the root of the organization hierarchy; **the single operating country list that every consumer draws from wherever a point of sale is selected** (REQ-OPC-029); the dependencies that branches, agencies, staff and commercial rules place on it; access control; the naming of an operating country on every screen (REQ-OPC-045); and all user-facing messages.

**Out of scope:**

- **The rules that consume the operating country list.** Airline configuration, markup, discount and service-charge rules, UCCF configuration, GDS deal codes and airport exclusions all target an operating country as their point of sale. Each draws from the single list defined in REQ-OPC-029 and uses the label required by REQ-OPC-045; their own rules belong to their own specifications.
- The **Branch** and **Agency** features themselves. They are referenced only where they depend on an operating country (REQ-OPC-034, REQ-OPC-037).
- The **Country** master and the **Currency** master. An operating country selects from them; their own creation, validation and approval rules belong to their own specifications.
- The **Staff / User** feature. It is referenced only through the scoping relationship in REQ-OPC-035.
- **Markup, discount and service-charge rules.** They are referenced only through the scoping relationship in REQ-OPC-036.
- Booking, reporting and financial processing that operate within an operating country's context.

### 1.3 Business Domain Context

An **Operating Country** is the top level of the platform's organization hierarchy. It represents a **market the business operates in** — a country in which the platform sells, together with the **currency that market trades in**. Beneath an operating country sit **branches**, and beneath each branch sit **agencies**.

An operating country is therefore not a geographic record. The geographic record is the **Country** master; an operating country *points at* a country and adds the commercial meaning that the business trades there. A country may exist without the business operating in it; an operating country exists only where it does.

Three things follow from an operating country's position at the root of the hierarchy:

- It supplies the **base currency** of its market, which downstream pricing, exchange-rate and financial behaviour depend on.
- It is the **scope** within which branches and agencies are created, staff are assigned, and commercial rules are targeted.
- It cannot itself be nested. An operating country has no parent.

Because every branch, agency, staff assignment and commercial rule beneath an operating country inherits its market and currency, operating country records are treated as controlled master data: a newly created or amended operating country must be **approved by an authorized person** before it becomes usable.

Operating countries are maintained in the **administration portal only**.

### 1.4 Definitions & Glossary

| Term | Meaning |
|---|---|
| **Operating Country** | A market the business operates in — a country plus the currency that market trades in. The root of the organization hierarchy. |
| **Operating Country Name** | The name identifying the operating country. Freely keyed by the maker; it is not required to equal the name of the country it points at. |
| **Country** | The geographic country the operating country is bound to, selected from the Country master. |
| **Currency** | The base currency of the operating country's market, selected from the Currency master. |
| **Branch** | The second level of the organization hierarchy; a child of an operating country. |
| **Agency** | The third level of the organization hierarchy; a child of a branch. |
| **Maker** | A user who creates or amends an operating country and submits it for approval. |
| **Checker / Approver** | A user authorized to approve or reject an operating country. |
| **Approval Status** | The workflow state of an operating country: *Pending for Approval*, *Approved*, or *Rejected*. |
| **Lifecycle Status** | The operational state of an operating country: *Active* or *Inactive*. |
| **Approval Remarks** | Free-text notes recorded against an operating country when a decision is taken or an amendment is saved. |
| **Display Rights** | A per-user, per-module permission set expressing which actions the user may perform — separable into a view right, an edit right, and an approve right. |
| **Approver User Type** | A user classification carrying intrinsic approval authority over master data, independent of Display Rights. |
| **Point of Sale (POS)** | The market a sale is attributed to. A point of sale **is** an operating country — the two are one concept under two names, not two concepts. There is therefore no separate point-of-sale country list (REQ-OPC-029) and no point-of-sale attribute on an operating country. The platform denotes it **"Operating Country (POS)"** on every screen (REQ-OPC-045). |
| **Branch POS / Agency POS** | The same point-of-sale concept one and two levels further down the hierarchy — a branch, and an agency. Referenced here only to record that they are the branch and agency themselves, not separate records — see `WARN-OPC-035`. |

### 1.5 Reading Conventions

- Every requirement carries a unique identifier `REQ-OPC-NNN`, a formal statement ("The system shall…"), and testable **Acceptance Criteria**.
- The words *shall* and *must* denote mandatory behaviour.
- Defects, contradictions and ambiguities found in the legacy system are **not silently carried forward**, and equally are **not silently fixed**. Each is marked inline with ⚠️ and a warning identifier `WARN-OPC-NNN`, and set out in full in **Section 5.1**. Every one of them is **deferred to the planning phase**; nothing in this document decides them.
- **Message texts** are the one exception to the "reproduce the legacy exactly" rule. Legacy wording was corrected for grammar and consistency where it was defective, and **every text is now confirmed**. Each legacy original is recorded in **Section 5.2** for traceability against the source system. Style applied: Title Case ending with a full stop, the entity named plainly as an **"Operating Country"** and never a "Company" or a "Master", and a trailing "Please try again." left in sentence case. **Screen labels** follow a separate rule — the entity is denoted **"Operating Country (POS)"** wherever it is labelled (REQ-OPC-045); messages name it plainly without the suffix.
- **Standing platform conventions.** Several conventions have already been decided for this platform and settled in the Country specification — direct approval at the point of creation, no assigned approver, validation on both the front end and the back end, an explicit approval action matrix, and approval remarks mandatory wherever presented. Most are now adopted here as positive requirements; where the legacy Operating Country module still **departs** from one, the departure is raised as a warning rather than decided. See the note in Section 6 for which stand adopted and which remain open.

---

## 2. Information Model

**REQ-OPC-001 — Operating country information model**

The system shall maintain the following business attributes for each operating country.

| Attribute | Business Meaning | Required | Maintained By | Notes / Constraints |
|---|---|---|---|---|
| Operating Country Name | The name identifying the operating country | Yes | Maker | 3 to 100 characters (REQ-OPC-007); letters including accented letters, plus space, `-`, `'` and `_` only, beginning with a letter (REQ-OPC-008); trailing spaces removed (REQ-OPC-009); unique per site, case-insensitively, across every approval and lifecycle state so a name is never released for reuse (REQ-OPC-010) |
| Country | The geographic country this market covers | Yes | Maker (creation only) | Selected from the Country master, active countries only (REQ-OPC-002 AC-6); **immutable after creation**, enforced on both sides (REQ-OPC-015) |
| Currency | The base currency this market trades in | Yes | Maker (creation only) | Selected from the Currency master, **active currencies only** (REQ-OPC-002 AC-3); **immutable after creation**, enforced on both sides (REQ-OPC-015) |
| Approval Status | *Pending for Approval* / *Approved* / *Rejected* | System | System | *Pending for Approval* on creation by a user without approval authority; *Approved* where the creator holds it (REQ-OPC-004). On amendment, derived from the action taken and never from the submission (REQ-OPC-017) |
| Approval Remarks | Free-text notes recorded against the operating country | Conditional — **mandatory wherever presented** (REQ-OPC-002 AC-4) | Checker, the user amending the record, or the creator where they hold approval authority | **One attribute, one rule set platform-wide**: mandatory, maximum 250 characters, no other validation (REQ-OPC-018). Presented on creation only to a user holding approval authority, and on amendment and on every decision. Pre-filled with any existing text, in full, and fully editable; every version is retained in the audit log |
| Approval Date | When the approval decision was taken | System | System | Set when a decision is recorded |
| Approved / Rejected By | The user who took the approval decision | System | System | Equals Created By on direct approval at creation (REQ-OPC-046 AC-5). Reflects the most recent decision; an amendment recording no decision leaves it untouched, and every earlier decision remains in the audit log (REQ-OPC-017 AC-5, AC-6) |
| Lifecycle Status | *Active* / *Inactive* | System | System | *Inactive* on creation by a user without approval authority, *Active* where the creator holds it (REQ-OPC-004); set by the approval decision, and thereafter changeable **independently** by an activate or deactivate action on an approved record (REQ-OPC-030) |
| Hierarchy Position | The operating country's place in the organization hierarchy | System | System | Always the root: it has no parent, and its children are branches (REQ-OPC-033). ⚠️ Two different level encodings are carried for the same record — `WARN-OPC-030` |
| Site Attribution | The administrative site the record was created under | System | System | Load-bearing: name uniqueness is per site (REQ-OPC-010 AC-4), and the scope is applied consistently to search, to the operating country list and to every selection list (REQ-OPC-020 AC-5, REQ-OPC-029 AC-9) |
| Audit Data | Created by, created date, last modified by, last modified date, and an entry for **every update applied and every decision taken** | System | System | Maintained automatically. Each entry records the acting user, the action, the date, the resulting statuses and the remarks, so every version of the remarks and every prior decision is recoverable (REQ-OPC-017 AC-5, REQ-OPC-018 AC-7) |

**Acceptance Criteria**

- AC-1: Every operating country record persists all attributes listed above.
- AC-2: System-managed attributes cannot be edited directly by the maker through the create or edit form.
- AC-3: Audit data is recorded automatically on every create, update, and approval decision.
- AC-4: An operating country holds exactly one country and exactly one currency. Neither is a list.

---

## 3. Functional Requirements

### 3.1 Creation

**REQ-OPC-002 — Access the Add Operating Country form**

The system shall provide an authorized user with a dedicated form to create a new operating country.

*Acceptance Criteria*

- AC-1: Users holding the module view right together with the edit right can open the Add Operating Country form.
- AC-2: The form presents three mandatory fields — **Operating Country Name**, **Select Country**, and **Select Currency** — together with **Approval Remarks** where AC-4 requires it.
- AC-3: The Country list is populated from the Country master and the Currency list from the Currency master, both at the moment the form is opened. **The Currency list contains active currencies only**, so a new operating country cannot be bound to a currency that is pending, rejected or out of service.
- AC-4: **Approval Remarks are presented only where the creating user holds approval authority**, since only that user records a decision on creation (REQ-OPC-046). Where presented they are **mandatory**. Remarks are mandatory **wherever the system presents them** — on creation by a user holding approval authority (REQ-OPC-003 AC-6), on amendment (REQ-OPC-018 AC-3), and on an approve or reject decision (REQ-OPC-027).
- AC-5: Users holding **approval authority** can open the Add form and create an operating country, whether that authority comes from the approve right or from the approver user type. The Add action is available to every user holding the edit right or approval authority (REQ-OPC-039, REQ-OPC-040).
- AC-6: The Country list is **one list**, the same source on the Add form and on the Search screen. On the **Add form** it contains **active countries only**, so a new operating country cannot be bound to a country that is not in service. The Search screen is not so restricted — see REQ-OPC-020 AC-7.

**REQ-OPC-003 — Create an operating country**

The system shall create a new operating country when a user submits a valid, unique name together with a country and a currency.

*Acceptance Criteria*

- AC-1: Given a valid, unique name and a selected country and currency, when the user submits the form, then the operating country is created and the message "Operating Country Created Successfully." is shown.
- AC-2: If any mandatory or format validation fails, the operating country is not created and the corresponding validation message is shown.
- AC-3: If creation fails for a system reason, the message "Unable To Create Operating Country. Please try again." is shown and no operating country is created.
- AC-4: On success the user is returned to the operating country list (REQ-OPC-043).
- AC-5: The name is stored with leading and trailing spaces removed (REQ-OPC-009).
- AC-6: Where the creating user **holds approval authority**, the submission is an **Approve** action (REQ-OPC-046) and Approval Remarks are **mandatory**. Submitting with the field empty shows "Required!" and no operating country is created.
- AC-7: Where the creating user does **not** hold approval authority, Approval Remarks are **not presented** and the submission is a **Send For Approval** action (REQ-OPC-025).

**REQ-OPC-004 — State of a newly created operating country**

The system shall set a newly created operating country's approval and lifecycle status according to whether the creating user holds approval authority.

*Acceptance Criteria*

- AC-1: Where the creating user does **not** hold approval authority, the operating country is created with Approval Status = *Pending for Approval* and Lifecycle Status = *Inactive*, and becomes available for decision by any user holding approval authority (REQ-OPC-025).
- AC-2: Where the creating user **does** hold approval authority, the operating country is created directly as *Approved* and *Active* in a single step, with no intervening *Pending for Approval* state and no separate approval action required (REQ-OPC-046).
- AC-3: An operating country that is not both approved and active does not appear on the operating country list used elsewhere in the platform (REQ-OPC-029).
- AC-4: On the direct-approval path the **Approved / Rejected By** attribute is set to the **same user** as **Created By**, so an operating country approved by its own creator remains distinguishable from one decided by a second person (REQ-OPC-046 AC-4).

**REQ-OPC-005 — Records and side effects at creation**

The system shall create the organizational root record for the new market, and shall not create any subordinate record.

*Acceptance Criteria*

- AC-1: Creating an operating country establishes it as a root organization with **no parent**.
- AC-2: **No branch and no agency** is created beneath it. The market starts empty and branches are added separately (REQ-OPC-034).
- AC-3: **No user account** is created for an operating country. Account creation applies to branches and agencies only.
- AC-4: **No financial initialization** — credit limit, wallet or credit terms — is performed for an operating country. That applies to branches only.
- AC-5: **No airline-to-geography mapping is performed.** The legacy platform triggered one for the selected country as a side effect of creation; it is **withdrawn**. Creating an operating country establishes the record and does nothing else.
- AC-6: Creation writes the record and its audit entry, and shows the confirmation of REQ-OPC-042. It has no other effect.

---

### 3.2 Validation & Uniqueness

**REQ-OPC-006 — Mandatory fields**

The system shall reject creation or update of an operating country when the name, the country or the currency is missing.

*Acceptance Criteria*

- AC-1: Submitting an empty Operating Country Name shows "Operating Country Name Cannot Be Empty." and blocks the save.
- AC-2: Submitting without a country selected shows "Country Must Be Selected." and blocks the save.
- AC-3: Submitting without a currency selected shows "Currency Must Be Selected." and blocks the save.
- AC-4: All three rules are enforced on both the front end and the back end (REQ-OPC-013).

**REQ-OPC-007 — Operating country name length**

The system shall require the operating country name to be a **minimum of 3 and a maximum of 100 characters**.

*Acceptance Criteria*

- AC-1: A name of 3 to 100 characters is accepted.
- AC-2: A name of fewer than 3 characters, or of more than 100, is **rejected with a message**. The legacy Add form capped keyed input at 100 characters by silently truncating it and applied a minimum of 3 that the Update form did not, while nothing validated either limit on submission. 100 is now the validated maximum on both sides, so an over-length name is refused rather than quietly shortened.
- AC-3: This single rule applies on **both** the front end and the back end, with the same permitted range on each and the same message (REQ-OPC-013). The back end is authoritative and does not depend on the front end having run.
- AC-4: A name outside the range is rejected with the message "Operating Country Name Should Be Min 3 and Max 100 characters."
- AC-5: The rule is applied to the value with surrounding spaces removed (REQ-OPC-009).

**REQ-OPC-008 — Operating country name character format**

The system shall permit **letters, including accented letters**, together with the **space**, the **hyphen** (`-`), the **apostrophe** (`'`) and the **underscore** (`_`), and **no other character**, in the operating country name.

*Acceptance Criteria*

- AC-1: A name composed of letters, spaces, hyphens, apostrophes and underscores is accepted — for example "United Arab Emirates", "Trinidad and Tobago", "Guinea-Bissau", "Côte d'Ivoire". A digit, or any punctuation character outside that set, is rejected.
- AC-2: The rule applies on **both** the front end and the back end, using the same permitted set on each, the back end authoritative and independent of the front end having run (REQ-OPC-013).
- AC-3: The name **must begin with a letter**. A space, hyphen, apostrophe or underscore is not accepted as the first character, so a leading space makes the name invalid. **Spaces are permitted only within the name**, between other characters.
- AC-4: Any **trailing space is removed** before the name is validated and stored (REQ-OPC-009). The length rule (REQ-OPC-007), this character rule and the uniqueness rule (REQ-OPC-010) are all applied to the trimmed value, so a name differing from another only by a trailing space is treated as the same name.
- AC-5: **Accented letters are accepted**, wherever they appear in the name. "Letters" in this requirement means letters of any script or diacritical form, matching the Country specification (`REQ-COU-011` AC-2), so market names such as "Côte d'Ivoire" and "Curaçao" are valid.

**REQ-OPC-009 — Leading and trailing spaces**

The system shall remove leading and trailing spaces from the operating country name before it is validated and stored.

*Acceptance Criteria*

- AC-1: The trimmed value is what is stored.
- AC-2: The length rule (REQ-OPC-007), the character rule (REQ-OPC-008) and the uniqueness rule (REQ-OPC-010) are all applied to the trimmed value, so a name differing from another only by surrounding spaces is treated as the same name.
- AC-3: A **leading** space is not merely trimmed but makes the name invalid, since the name must begin with a letter (REQ-OPC-008 AC-3).
- AC-4: The trim is applied on both the front end and the back end (REQ-OPC-013).

**REQ-OPC-010 — Operating country name is unique**

The system shall prevent two operating countries from holding the same name.

*Acceptance Criteria*

- AC-1: Entering a name already in use is reported during data entry with "Operating Country Already Exists." and the save is blocked.
- AC-2: The comparison is **case-insensitive**. "UAE", "uae" and "Uae" are the same name and only one of them can exist.
- AC-3: Case-insensitivity is a property of the **comparison itself**, not of the entry form. A submission arriving by **any** route is compared case-insensitively, so duplicates differing only in case cannot be created whatever path the submission takes (REQ-OPC-013).
- AC-4: Uniqueness is **per administrative site**. A name already held within a site is unavailable to any other operating country of that site; the same name may exist under a different site.
- AC-5: The single message for this rule is **"Operating Country Already Exists."**, used wherever a duplicate name is reported on creation or update — at data entry and on submission alike. The legacy platform reported the same rule with three different texts, one of which named the wrong entity entirely ("Company Name already exist"); all three are superseded. The defensive re-check at the moment of approval carries its own text (REQ-OPC-012 AC-1).
- AC-6: Uniqueness applies across **every** approval and lifecycle state — *Pending for Approval*, *Approved*, *Rejected*, *Active* and *Inactive*. A name held by an operating country in any of those states is unavailable to any other within the same site, so **a name is never released for reuse** (REQ-OPC-012 AC-2).

**REQ-OPC-011 — Uniqueness check excludes the record being edited**

When editing an existing operating country, the system shall not flag that operating country's own name as a duplicate.

*Acceptance Criteria*

- AC-1: Editing an operating country and saving without changing its name does not raise a duplicate error. The record is identified and excluded from the comparison.
- AC-2: Changing the name to one already used by a different operating country raises a duplicate error.
- AC-3: The duplicate check is performed **whenever the submitted name differs from the name currently stored against the record**. Where the two are the same, nothing has changed and no check is performed.
- AC-4: The name compared against in AC-3 is the name **as currently held in the record**, retrieved for the comparison. It is **never** the name being submitted. The legacy platform populated it with the submitted name, so the two were always equal, the check concluded the name had never changed, and the duplicate check on update was never reached — a duplicate could be saved by editing an existing record.
- AC-5: On **creation** there is no stored name to compare against, so the duplicate check always runs.
- AC-6: The check runs on **both** the front end and the back end (REQ-OPC-013). The back end performs the comparison and the check itself, independently of the front end having run — the legacy platform's front-end check was unreachable on the Edit screen, and back-end enforcement does not depend on it.
- AC-7: A duplicate found on either path is reported with "Operating Country Already Exists." (REQ-OPC-010 AC-5) and the save is blocked.

**REQ-OPC-012 — Uniqueness re-checked on approval**

The system shall re-test the operating country's name for uniqueness at the moment an **approval** is recorded.

*Acceptance Criteria*

- AC-1: Where the name is found to duplicate another operating country's name, the approval is not recorded and the message "Another Operating Country With The Same Name Already Exists." is shown.
- AC-2: The duplicate check applied on **creation and on update** (REQ-OPC-010, REQ-OPC-011) considers operating countries in **every** approval and lifecycle state — *Approved*, *Pending for Approval*, *Rejected*, *Active* and *Inactive*. A name held by a record in any of those states is unavailable to any other within the same site, so **a name is never released for reuse**.
- AC-3: This check is applied to an **approval only**. A **rejection** is never blocked by a duplicate name, so a checker can always dispose of a record whose name duplicates another. The legacy platform applied it to both, which could leave a record that could be neither approved nor rejected.
- AC-4: Where an approval is refused under AC-1, the operating country's approval and lifecycle statuses are left unchanged and it remains available for a fresh decision — including rejection, which AC-3 never blocks.
- AC-5: This check is **defensive**. With uniqueness enforced on both sides across every approval and lifecycle state (REQ-OPC-010, REQ-OPC-011, REQ-OPC-013), no duplicate should reach the approval step; the check exists so that one which somehow does is caught before the record becomes usable.

**REQ-OPC-013 — Validation enforced on both the front end and the back end**

The system shall enforce every validation rule stated in this specification on **both** the front end and the back end, using the same rule on each side.

*Acceptance Criteria*

- AC-1: Every rule is applied on the front end, giving the user immediate field-level feedback before submission.
- AC-2: Every one of those same rules is applied again when the record is submitted. The back end is **authoritative**: a value it rejects is not persisted, irrespective of what the front end allowed.
- AC-3: The two sides use identical rules — the same permitted lengths, the same permitted character set, the same uniqueness comparison.
- AC-4: Back-end enforcement does not depend on the front end having run. A submission reaching the system by any route is validated in full.
- AC-5: The rules this covers are now each settled to a single definition on both sides: the mandatory-field checks (REQ-OPC-006), the length range of 3 to 100 characters (REQ-OPC-007), the permitted character set and leading-letter rule (REQ-OPC-008), the trim (REQ-OPC-009), the case-insensitive, per-site uniqueness comparison across every state (REQ-OPC-010), the changed-name duplicate check (REQ-OPC-011) and the immutability of country and currency (REQ-OPC-015). The legacy platform applied only the mandatory-field checks on submission, leaving the rest on the entry form alone — and two of them broken there; that gap is closed by this requirement.
- AC-6: Any validation rule introduced by a future requirement falls under this requirement without needing to be restated there.
- AC-7: This requirement binds **every** route into the feature. The legacy platform reached it through two interfaces that validated differently — the administration screens holding every field rule in the browser alone, the programmatic interface holding three emptiness checks and nothing else. Whichever interfaces the rebuilt system provides, each applies the same single rule set in full, and the back end validates every submission irrespective of which one it arrived through.

---

### 3.3 Editing

**REQ-OPC-014 — Access a pre-populated Edit form**

The system shall provide an Edit form pre-populated with the selected operating country's current values.

*Acceptance Criteria*

- AC-1: Opening an operating country for editing shows its current name, country and currency pre-filled.
- AC-2: Only users holding the edit right, or intrinsic approval authority, can open the Edit form (REQ-OPC-039).
- AC-3: The Edit form presents an **Approval Remarks** field that the Add form does not, unless the creating user holds approval authority (REQ-OPC-002 AC-4, REQ-OPC-018).
- AC-4: Where remarks were previously recorded against the operating country, the Edit form displays that text **in full**, pre-filled and editable, to every user who can open the form (REQ-OPC-018 AC-5). Where none were recorded, the field is presented empty.

**REQ-OPC-015 — Country and currency are not editable after creation**

The system shall not permit the country or the currency of an operating country to be changed once it has been created.

*Acceptance Criteria*

- AC-1: On the Edit form the Country and Currency selections are displayed but cannot be altered. The rule is enforced on **both** the front end and the back end, using the same rule on each (REQ-OPC-013).
- AC-2: The back end **does not update the country or the currency on any amendment**, whatever the submission contains. A country or currency value present in an update submission is **ignored**; a submission that omits them — as the Edit form does, its controls being disabled — leaves the stored values **unchanged**. Neither attribute can be erased and neither can be changed.
- AC-3: AC-2 holds irrespective of the route the submission arrived by and does not depend on the front end having withheld the values. Presenting the controls as non-editable is **never the sole means of enforcement**.
- AC-4: Updating an operating country's country or currency is **not an applicable action**. The legacy platform accepted both on update and wrote whatever it received, so an amendment could strip a market of its country and base currency and break every branch, agency and rule beneath it.

**REQ-OPC-016 — Update an operating country**

The system shall persist valid changes to an operating country.

*Acceptance Criteria*

- AC-1: Valid changes are saved and the message "Operating Country Updated Successfully." is shown.
- AC-2: If the update fails, the message "Unable To Update Operating Country. Please try again." is shown and no change is persisted.
- AC-3: The validation rules of REQ-OPC-006 through REQ-OPC-013 apply on update.
- AC-4: On success the user is returned to the operating country list (REQ-OPC-043).
- AC-5: Where a user **without** approval authority amends an *Approved* and *Active* operating country, the actions offered are **Update** or **Cancel**. Update applies the amendment **directly** and **preserves both statuses** — it is not returned to *Pending for Approval* and not made *Inactive*, and requires no approval. Cancel persists nothing.
- AC-6: Where a user **without** approval authority amends a *Rejected* operating country, the update is a **resubmission**: the operating country returns to *Pending for Approval* and awaits a fresh decision. Its lifecycle status remains *Inactive*, both states being inactive. The action presented is **Send For Approval** (REQ-OPC-025 AC-4).
- AC-7: Where a user **without** approval authority amends a *Pending for Approval* operating country, it **remains** *Pending for Approval* and *Inactive*.
- AC-8: Where the amending user **holds** approval authority, the amendment carries the decision: they approve or reject it in the same save, whatever the record's current state (REQ-OPC-046 AC-2).

**REQ-OPC-017 — Approval status and approver identity on update**

The system shall determine the approval status of an amended operating country, and shall preserve the record of who decided it.

*Acceptance Criteria*

- AC-1: The approval status an amendment yields is **determined by the system from the action the user takes**. The action is drawn from the set the matrix permits for that user's authority and the operating country's current state (REQ-OPC-039 AC-1), and each action has one defined outcome:

  | Action | Outcome |
  |---|---|
  | **Update** | *Approved* stays *Approved* and *Active*; *Pending* stays *Pending*; *Rejected* becomes *Pending for Approval* and stays *Inactive* (AC-4) |
  | **Send For Approval** | *Pending for Approval* and *Inactive* |
  | **Approve** | *Approved* and *Active* |
  | **Reject** | *Rejected* and *Inactive* |
  | **Cancel** | Nothing persisted; both statuses left exactly as they were |

- AC-2: The approval status is **never taken from the submission**. Any approval-status value present in an amendment is **ignored**; the system derives the status from the action alone. This is enforced on **both** the front end and the back end, the back end deriving the status independently of what the submission contains and refusing an action the matrix does not permit for that user and state (REQ-OPC-039 AC-5).
- AC-3: The legacy platform took the status from the submission, so an amendment could set an operating country to *Approved* with no decision taken and by a user without approval authority — defeating the maker–checker control of REQ-OPC-024. AC-1 and AC-2 close that: the status follows the action, and a submitted status is discarded.
- AC-4: Where the action is **Update**, the operating country's approval status follows its current state: an ***Approved*** record **stays *Approved*** and *Active*; a ***Rejected*** record becomes ***Pending for Approval*** and remains *Inactive*, the update being a resubmission; a ***Pending for Approval*** record stays *Pending for Approval*.
- AC-5: **The audit log is written whenever an update is applied or a decision is taken.** Each entry records the acting user, the action, the date and the resulting statuses. The current **Approved / Rejected By** value therefore reflects the most recent decision, and where a later action replaces it the earlier decision remains recoverable from the audit log. The legacy platform cleared the value to "no user" on every amendment and kept no record of it; both are corrected.
- AC-6: An amendment that records **no** new decision does not overwrite the existing Approved / Rejected By, the decision date or the remarks of the prior decision — it appends its own audit entry alongside them.

**REQ-OPC-018 — Approval remarks on the Edit form**

The system shall present a remarks field on the Edit form, governed by the same rules as every remarks field in the platform.

*Acceptance Criteria*

- AC-1: Approval Remarks are **mandatory** wherever presented (REQ-OPC-002 AC-4). Submitting with the field empty shows "Required!" and no change is persisted.
- AC-2: The field accepts free text up to a **maximum of 250 characters**.
- AC-3: **No other validation applies.** There is no minimum length, no character-set restriction and no format rule. Any content the user enters within the 250-character limit is accepted, subject only to the mandatory rule of AC-1.
- AC-4: **These rules are the same everywhere.** Approval Remarks carry one set of rules — mandatory, maximum 250 characters, nothing else — on every screen and in every module: the Edit form, the creation form where an approver records a decision (REQ-OPC-003 AC-6), and the approve/reject dialogue (REQ-OPC-027). There is **one** remarks attribute, not two. The legacy platform limited the Edit form's field to 200 characters while refusing spaces-only and left the decision dialogue's field unbounded; both are superseded.
- AC-5: **Any remarks already recorded are returned to the user**, pre-filled and in full, wherever an action requiring remarks is taken — by any user who can take that action, on any of the screens named in AC-4. A user recording a decision therefore sees what was recorded before it.
- AC-6: The field is **fully editable**. The user may add to the existing text, amend it or replace it, and the save persists whatever the field contains. Overwriting is permitted because the audit log retains every version (AC-7).
- AC-7: **Every change to the remarks is written to the audit log**, with the acting user, the action and the date (REQ-OPC-017 AC-5). An earlier version is therefore always recoverable, so overwriting the current value loses nothing.
- AC-8: The rules of AC-1 to AC-3 are enforced on both the front end and the back end (REQ-OPC-013).

---

### 3.4 Listing, Search & Pagination

**REQ-OPC-019 — Operating country list view**

The system shall present operating countries in a paginated list.

*Acceptance Criteria*

- AC-1: Each row displays the **Operating Country Name**, the **Country**, the **Currency**, the **Lifecycle Status**, and the **Approval Status**.
- AC-2: Each row exposes only the actions permitted to the current user for that operating country's current state, per the matrix in REQ-OPC-039.
- AC-3: The total number of matching operating countries is displayed alongside the list.
- AC-4: The two name columns carry **distinct headings**: the operating country's own name is headed "Operating Country (POS)" per REQ-OPC-045, and the country it is bound to is headed "Country". The legacy list rendered both under the same "Country Name" heading.

**REQ-OPC-020 — Search operating countries**

The system shall allow users to search operating countries by name, by country, and by lifecycle status.

*Acceptance Criteria*

- AC-1: Entering an operating country name filters the list to every operating country whose name **contains** the value entered. Matching is partial, not exact.
- AC-2: Choosing a country filters the list to the operating countries bound to it.
- AC-3: Choosing a lifecycle status of Active or Inactive filters the list accordingly.
- AC-4: A search returning nothing shows "No Operating Country found. Please try again." The legacy platform showed an empty list with no explanation, the only "not found" text in the source belonging to the Country master.
- AC-5: The search is **scoped by administrative site**. A user sees only the operating countries of their own site, and never those of another. The scope is applied consistently everywhere an operating country is retrieved or offered — this search, the operating country list (REQ-OPC-029 AC-9) and every selection list drawing from it. It is applied on the back end and does not depend on the front end having requested it (REQ-OPC-013).
- AC-6: The value entered in the name field is matched as **literal text**. The characters `%` and `_` carry **no special meaning** and are searched for as themselves, so a user looking for a name containing either gets only the records that actually contain it. The legacy platform placed the entered value directly into the match expression, where both behaved as wildcards.
- AC-7: The Search screen's country list is **not restricted to active countries**. It contains **every** country, so an operating country bound to a since-deactivated country remains findable. An **inactive country is visually marked as inactive** wherever it appears on the screen — in the country filter list, and against a result row whose country is inactive — so the user can tell the two apart at a glance.
- AC-8: The marking required by AC-7 is **presentational only**. **No record is filtered out, added, reordered or otherwise altered** because its country is inactive. The search returns exactly the records the criteria select, unchanged.

**REQ-OPC-021 — Default filter when no criteria are supplied**

The system shall apply a defined default when the list is opened without search criteria.

*Acceptance Criteria*

- AC-1: With no search criteria supplied, the list shows **active operating countries only**, ordered by **last modification date, descending**, at **page 1** with a page size of **10**.
- AC-2: The default is applied whenever the request supplies no criteria, and does **not** depend on the front end having supplied them. A request reaching the system by any route falls to the same default (REQ-OPC-013).
- AC-3: The same default is applied where a supplied value is **missing, invalid, out of range or otherwise unusable** — including a tampered request. The system never returns an unbounded result set.
- AC-4: The legacy platform fell to *Inactive* where no lifecycle status was chosen, so opening the list showed only inactive operating countries and hid every live market. That is superseded by AC-1.
- AC-5: This default is a **platform-wide convention** — active records only, newest modification first, page 1, size 10 — and applies to every module without being restated.

**REQ-OPC-022 — Pagination**

The system shall paginate the operating country list.

*Acceptance Criteria*

- AC-1: The list shows a bounded number of operating countries per page, defaulting to **ten**, and allows navigation between pages.
- AC-2: The current search criteria are preserved across page navigation.
- AC-3: Where the requested page is missing, negative, or beyond the last page, the system falls back to **page 1**. It never returns an unbounded result set.
- AC-4: The total record count, the total page count and the current page are reported to the user.

**REQ-OPC-023 — List order**

The system shall order the operating country list by **last modification time, descending** — most recently changed first.

*Acceptance Criteria*

- AC-1: The most recently created or amended operating country appears first.
- AC-2: The ordering is applied to the **whole result set as one**, before any page is selected — never page by page. "Most recently changed first" therefore holds **across** the entire list, so page 2 continues where page 1 ended and no record appears out of sequence between pages. The legacy platform sorted only the page already retrieved, so each page was ordered within itself while the list as a whole was not.
- AC-3: The same holds for every other criterion applied to the list. Filtering, ordering and counting are all performed over the complete matching set, and paging selects from the ordered result — never the reverse.

---

### 3.5 Approval Workflow (Maker–Checker)

**REQ-OPC-024 — Maker–checker model**

The system shall support a maker–checker model in which a newly created or amended operating country becomes usable only after an authorized user approves it.

*Acceptance Criteria*

- AC-1: An operating country awaiting a decision is *Pending for Approval* and *Inactive*.
- AC-2: The workflow supports distinct maker and checker responsibilities.
- AC-3: Approval authority is held either through the **approve right** in Display Rights or through the **approver user type** (REQ-OPC-040).
- AC-4: A user **holding** approval authority is not required to route their own work to a second person; they may approve at the point of creation (REQ-OPC-046). Approval authority is itself the control — **segregation of duties is not additionally enforced** between the maker and checker roles.
- AC-5: The control holds on the update path as well as on creation: the approval status an amendment yields is derived from the action taken and never accepted from the submission, so no amendment can approve a record on behalf of a user who lacks the authority (REQ-OPC-017 AC-1, AC-2).

**REQ-OPC-025 — Send an operating country for approval**

The system shall place a newly created or amended operating country before the approvers without routing it to any one of them.

*Acceptance Criteria*

- AC-1: An operating country created or amended by a user **without** approval authority is *Pending for Approval* and visible to **every** user holding approval authority, any one of whom may decide it. **No approver is named, recorded or routed to at any point**, so a record can never be stranded by an assigned approver being unavailable.
- AC-2: The operating country remains *Inactive* while awaiting a decision.
- AC-3: The Send For Approval action is offered to users holding the edit right **without** approval authority. Users holding approval authority are **not** offered it, since they decide directly (REQ-OPC-046).
- AC-4: A **rejected** operating country amended by a user with the edit right but without approval authority is **resubmitted** — it returns to *Pending for Approval* and awaits a fresh decision (REQ-OPC-016 AC-6). An **approved** one amended by the same user is **not** sent for approval; the amendment is applied directly and both statuses are preserved (REQ-OPC-016 AC-5).

**REQ-OPC-026 — Approve or reject an operating country**

The system shall allow an authorized checker to approve or reject an operating country from the list.

*Acceptance Criteria*

- AC-1: On approval, the Approval Status becomes *Approved*, the Lifecycle Status becomes *Active*, and the message "Operating Country Approved Successfully." is shown.
- AC-2: On rejection, the Approval Status becomes *Rejected*, the Lifecycle Status becomes *Inactive*, the operating country is not usable, and the message "Operating Country Rejected Successfully." is shown.
- AC-3: The deciding user's identity, the decision date, and the remarks are recorded against the operating country.
- AC-4: The actions offered depend on the operating country's current approval status: where it is *Pending for Approval*, **Approve** and **Reject**; where it is already *Approved*, **Approve**, **Reject** or **Cancel**, approving recording a fresh decision that keeps it approved; where it is already *Rejected*, **Approve** or **Cancel** (REQ-OPC-046 AC-2).
- AC-5: Cancelling a decision leaves the operating country unchanged (REQ-OPC-046 AC-3).
- AC-5: A decision is refused where the name is found to duplicate another (REQ-OPC-012).
- AC-6: The decision is recorded against the operating country, written to the audit log (REQ-OPC-017 AC-5), and confirmed on screen to the deciding user (REQ-OPC-042). It has no other effect.

**REQ-OPC-027 — Remarks accompany every decision**

The system shall require remarks whenever an operating country is approved or rejected.

*Acceptance Criteria*

- AC-1: The Approve and Reject actions each open a dialogue capturing remarks before the decision is recorded.
- AC-2: Submitting with the field empty shows "Required!" and no decision is recorded.
- AC-3: The remarks are stored against the operating country with the decision.
- AC-4: Where the action is **cancelled**, the remarks are discarded with it and nothing is stored (REQ-OPC-046 AC-3).
- AC-5: The field carries the **same rules as every other remarks field** — mandatory, maximum 250 characters, no other validation — and is pre-filled with any remarks already recorded (REQ-OPC-018).

**REQ-OPC-046 — Direct decision by an authorized user**

The system shall allow a user who holds approval authority to record the approval decision on an operating country **at the point of creation or amendment**, without first sending it for approval.

*Acceptance Criteria*

- AC-1: **On creation**, a user holding approval authority approves as part of the same save. The operating country becomes *Approved* and *Active* immediately and is usable by dependent features from that moment (REQ-OPC-029). **Approve** is the only submission path offered on a new record; Reject is not, since there is nothing yet to reject.
- AC-2: **On amendment**, a user holding approval authority records the decision in the same save. The actions offered depend on the operating country's current state, and **the decision the record already carries is never re-offered**:
  - On an ***Approved*** record — **Cancel**, **Approve** or **Reject**. Approve saves the amendment and keeps it *Approved* and *Active*, recording a fresh decision with fresh remarks; Reject makes it *Rejected* and *Inactive*; Cancel persists nothing. A holder of approval authority is offered **no plain Update on an approved record** — every save they make records a decision.
  - On a ***Rejected*** record — **Approve** or **Cancel**, and those two only. The user may amend the record and approve it in the same save, making it *Approved* and *Active*; or cancel, leaving it *Rejected* and unchanged. **Reject is not offered**, the record already being rejected.
  - On a ***Pending for Approval*** record — **Approve** or **Reject**.
- AC-3: **Cancel abandons the action.** Where a decision is cancelled, nothing is persisted — not the amendment, not the decision, not the remarks — and the operating country is left exactly as it was, in the same approval and lifecycle status.
- AC-4: On either path the operating country passes through **no** intervening *Pending for Approval* state, no approver is assigned, and no separate approval action is required.
- AC-5: The deciding user's identity, the decision date and the remarks are recorded exactly as for a decision taken by a second person (REQ-OPC-026 AC-3). Approval Remarks are **mandatory** on every path that records a decision (REQ-OPC-003 AC-6, REQ-OPC-018 AC-3, REQ-OPC-027).
- AC-6: On the **creation** path the **Approved / Rejected By** attribute is set to the **same user** as **Created By**. The two approval routes are therefore distinguishable after the fact by comparing the two: where they hold the same user the operating country was decided directly by its creator, and where they differ it was decided by a second person.
- AC-7: A user holding approval authority is **never** offered Send For Approval, on creation or on amendment.
- AC-8: A user who does **not** hold approval authority cannot approve or reject at any point, and submits the operating country per REQ-OPC-025.

**REQ-OPC-029 — One operating country list, used by every consumer**

The system shall maintain a **single** operating country list, shall make an operating country available on it only when it is both *Approved* and *Active*, and shall use that one list wherever an operating country is offered for selection anywhere in the platform.

*Acceptance Criteria*

- AC-1: Operating countries that are *Pending for Approval*, *Rejected* or *Inactive* do not appear on the list.
- AC-2: Approving an operating country adds it to the list; deactivating or rejecting one removes it.
- AC-3: **There is exactly one such list.** Every consuming screen draws from it — branch creation, staff assignment, airline configuration, markup, discount and service-charge rules, UCCF configuration, GDS deal codes, airport exclusions and reporting alike. **No separate point-of-sale country list exists.** A point of sale is an operating country, so the operating country list *is* the point-of-sale list.
- AC-4: Membership is decided by the **operating country's own** approval status and lifecycle status. The approval status of the underlying country is **not** the test, and neither status may be substituted for the other.
- AC-5: Each entry is identified by the operating country's **own name and own identifier**. The underlying country's name and code are **not** substituted for them, so two operating countries bound to the same country remain distinct entries and are separately selectable.
- AC-6: Each operating country appears **once**. The list contains no duplicate entries.
- AC-7: A selection made on any consuming screen records the **operating country** chosen, not the country it is bound to.
- AC-8: The list is ordered by operating country name, ascending.
- AC-9: The list is **scoped by administrative site**, as is every selection list drawing from it and the search of REQ-OPC-020 AC-5. A user is offered only the operating countries of their own site.

---

### 3.6 Lifecycle & Status Management

**REQ-OPC-030 — Lifecycle status, activation and deactivation**

The system shall set an operating country's lifecycle status from its approval decision, and shall allow an authorized user to **activate or deactivate** an approved operating country independently of that decision.

*Acceptance Criteria*

- AC-1: Approving an operating country makes it *Active*.
- AC-2: Rejecting an operating country makes it *Inactive*.
- AC-3: An operating country awaiting a decision is *Inactive*.
- AC-4: **Deactivating** an active operating country makes it *Inactive* and removes it from the operating country list and every selection list drawing from it (REQ-OPC-029). **Activating** an inactive one makes it *Active* and returns it to them.
- AC-5: The action is offered **only for operating countries that are already *Approved***, and **only to users holding approval authority**.
- AC-6: Both preconditions in AC-5 are enforced on **both** the front end and the back end (REQ-OPC-013). The front end withholds the control where they are not met; the back end re-checks both when the action is carried out and refuses it if either fails, irrespective of how the request arrived. **Hiding the control is never the sole means of enforcement.**
- AC-7: The outcome is reported to the user, distinguishing success from failure. An action refused under AC-6 leaves the lifecycle status unchanged and is reported.
- AC-8: Before a **deactivation** is applied, the system shall **warn** the user that the operating country will disappear from every selection list, that **no new branch can be created under it while it is inactive**, and that **staff holding it cannot act within that market until it is reactivated** (REQ-OPC-031 AC-3), and shall require the user to **confirm** the action explicitly.
- AC-9: The deactivation is applied **only** on confirmation. If the user declines or cancels, nothing changes.
- AC-10: **No warning or confirmation is required to activate** an operating country, since activation withdraws nothing.
- AC-11: Deactivation is the means of taking a live market out of service. Rejecting an approved operating country remains available to a holder of approval authority (REQ-OPC-039), but that records a decision on the record's validity and is a different thing. The legacy platform offered no activate/deactivate action at all, so rejection was the only route.
- AC-12: Deactivation does **not** cascade to the branches and agencies beneath the operating country — see REQ-OPC-031.

**REQ-OPC-031 — Effect of deactivation on the subtree and on staff**

The system shall leave the branches and agencies beneath an operating country **fully operational** when that operating country is deactivated or rejected, and shall **hide** it from every staff user's scope without removing it.

*Acceptance Criteria*

- AC-1: Deactivating or rejecting an operating country **does not change the status of any branch or agency beneath it**. Each keeps its own lifecycle status and continues to operate exactly as before.
- AC-2: **No user account is disabled.** The sign-in state of every user is untouched, and those users continue to work normally.
- AC-3: The operating country is **hidden from the scope of every staff user who holds it, not removed from it** (REQ-OPC-035 AC-4). Such a staff member cannot act within that market while it is out of service; the assignment itself is **retained**, their account remains active, and their other operating countries are unaffected.
- AC-4: The operating country **no longer appears in any selection list** (REQ-OPC-029). In particular, **no new branch can be created under it** while it is inactive — the Branch screen offers *Active* operating countries only (REQ-OPC-034 AC-5).
- AC-5: **Nothing needs restoring on reactivation.** Approving or activating the operating country returns it to the selection lists and to every staff scope that held it, exactly as before. The branches and agencies were never changed and the staff assignments were never removed, so the whole arrangement is restored by the act of reactivation alone.
- AC-6: The legacy platform carried a mechanism to push an organization's status change down the hierarchy, disabling the sign-in of the accounts beneath it. That mechanism was disabled in the source and is **withdrawn**: no account is disabled by a status change.

---

### 3.7 Organization Hierarchy & Dependent Records

**REQ-OPC-033 — Operating country is the root of the organization hierarchy**

The system shall treat each operating country as the root of a hierarchy containing branches, each of which contains agencies.

*Acceptance Criteria*

- AC-1: The hierarchy is Operating Country → Branch → Agency, three levels deep.
- AC-2: An operating country has **no parent** and cannot be nested beneath another operating country.
- AC-3: ⚠️ The record carries **two different level encodings** for the same position in the hierarchy, numbered inconsistently with each other, so "which level is an operating country" has two answers in the source. A single encoding must be settled in planning — `WARN-OPC-030`.

**REQ-OPC-034 — A branch is created beneath an operating country**

The system shall require every branch to belong to exactly one operating country.

*Acceptance Criteria*

- AC-1: Creating a branch requires an operating country to be nominated.
- AC-2: The branch inherits its market and base currency from that operating country.
- AC-3: Where the value supplied does not match a known operating country, the message "Please Enter A Valid Country." is shown.
- AC-4: ⚠️ The operating country is nominated on the Branch screen by **typing a name** against a suggestion list rather than by selecting from a list, so a free-text value must be matched back to a record. The legacy message also named a "Country" where an "Operating Country" was meant; the confirmed replacement is recorded in Section 5.2.
- AC-5: **Only *Active* operating countries are offered** when a branch is created. An inactive one is not selectable, so no branch can be created beneath a market that is out of service (REQ-OPC-029, REQ-OPC-031 AC-3). Branches already beneath it are unaffected.

**REQ-OPC-035 — Staff are scoped to operating countries**

The system shall allow a staff user to be associated with one or more operating countries.

*Acceptance Criteria*

- AC-1: A staff user carries a set of operating countries and, within them, a set of branches.
- AC-2: At least one operating country must be selected. Submitting none shows "Please Select At Least One Operating Country.".
- AC-3: The operating countries offered are those the assigning user is permitted to grant, drawn from the single list of REQ-OPC-029 and therefore **active ones only**.
- AC-4: When an operating country is **deactivated or rejected**, it is **hidden** from the scope of every staff user holding it — **not removed** (REQ-OPC-031 AC-3). The staff member cannot act within that market while it is out of service, but the assignment is retained and **reappears automatically** when the operating country is approved or activated again. It never has to be granted a second time.
- AC-5: Because the assignment is hidden rather than removed, a staff user always retains at least one operating country in their scope as AC-2 requires, even where every market they hold is out of service.

**REQ-OPC-036 — Currency and commercial rules are scoped by operating country**

The system shall use the operating country as the top-level scope for the base currency and for commercially targeted rules.

*Acceptance Criteria*

- AC-1: The operating country's currency is the base currency of its market.
- AC-2: Markup, discount, service-charge and offer-pricing rules may be targeted at an operating country, at a branch within it, or at an agency within that branch.
- AC-3: Selecting a target narrows the choices beneath it: choosing an operating country restricts the branch list to that market, and choosing a branch restricts the agency list to that branch.

**REQ-OPC-037 — View the branches beneath an operating country**

The system shall allow an authorized user to see the branches belonging to an operating country from the list.

*Acceptance Criteria*

- AC-1: Each row offers a **View All Branches** action that lists the branches beneath that operating country without leaving the list.
- AC-2: The action requires the edit right or intrinsic approval authority.
- AC-3: Where the operating country has no branches, that is reported rather than shown as an empty list.

---

### 3.8 Access Control & Permissions

**REQ-OPC-038 — Module access is permission-gated**

The system shall expose the Operating Country screens only to users whose role grants access to them.

*Acceptance Criteria*

- AC-1: Users without the Operating Country menu right cannot reach any Operating Country screen — search, add or edit.
- AC-2: Menu visibility reflects the user's role configuration, maintained through the Role feature.
- AC-3: The Operating Country entry sits beneath the **Company** menu group.

**REQ-OPC-039 — Action visibility follows view, edit and approve rights**

The system shall offer each action according to the user's rights for the module and the operating country's current state, as set out in the matrix below.

*Acceptance Criteria*

- AC-1: The available actions are:

  | User | On a new record | On an *Approved* record | On a *Rejected* record | On a *Pending* record |
  |---|---|---|---|---|
  | Holds **approval authority** — the approve right or the approver user type | **Approve** only | **Cancel**, **Approve** or **Reject** | **Approve**, or **Cancel** | **Approve** or **Reject** |
  | Holds the edit right, no approval authority | **Send For Approval** only | **Update**, or **Cancel** | **Send For Approval** only | **Update** only |
  | Holds only the view right | none | none | none | none |

  Both rows that can act also carry **Add** and **View All Branches**; the view-only row carries neither.

- AC-2: A user holding only the view right can see the list but neither amend nor decide.
- AC-3: A user holding approval authority is **never** offered Send For Approval, and a user without it is **never** offered Approve or Reject (REQ-OPC-046 AC-7, AC-8). The two routes to approval authority carry identical action sets, the Add action included (REQ-OPC-040 AC-3). A holder of approval authority is offered **no plain Update** on an *Approved* record: every save they make records a decision (REQ-OPC-046 AC-2).
- AC-4: The status an amendment by a user **without** approval authority yields depends on the record's state: *Approved* stays *Approved* and *Active*, *Pending* stays *Pending*, and *Rejected* returns to *Pending for Approval* as a resubmission (REQ-OPC-016 AC-5 to AC-7).
- AC-5: The matrix in AC-1 is enforced on **both** the front end and the back end (REQ-OPC-013). The front end offers only the actions the matrix permits for the user's rights and the record's current state; the back end applies the **same** matrix when the action is performed, checking that the acting user holds the rights that action requires, and **refuses any action the matrix does not permit** — irrespective of how the request arrived. **Withholding a control is never the sole means of enforcement.**
- AC-6: An action refused under AC-5 makes **no change** to the operating country and is reported to the user. This applies to every action the module offers — create, update, send for approval, approve, reject, activate, deactivate and view.
- AC-7: The legacy platform decided availability only in what it displayed: the actions themselves never re-checked the user's rights, so a request reaching the system by any other route was carried out. AC-5 closes that.

**REQ-OPC-040 — Intrinsic approval authority**

The system shall recognize a user classification that carries approval authority over operating country records independently of Display Rights.

*Acceptance Criteria*

- AC-1: A user of that classification can approve and reject operating countries without an explicitly configured approve right.
- AC-2: Approval authority may alternatively be granted through the approve right in Display Rights.
- AC-3: The two routes are **equivalent**. A user holding approval authority through the classification and a user holding it through the approve right are offered exactly the same actions, per the matrix in REQ-OPC-039 AC-1 — the Add action included (REQ-OPC-002 AC-5).

---

### 3.9 User Notifications & Messaging

**REQ-OPC-041 — Immediate data-entry feedback**

The system shall provide immediate, field-level feedback for invalid input during data entry.

*Acceptance Criteria*

- AC-1: Empty mandatory fields, a name below the minimum length, and a duplicate name are flagged against the field concerned at data-entry time.
- AC-2: The duplicate-name check is performed as the user leaves the name field, before submission.
- AC-3: Immediate feedback does not replace authoritative validation on submission (REQ-OPC-013).

**REQ-OPC-042 — Success and failure feedback**

The system shall display a clear confirmation on success and a clear error on failure for every create, update and approval action.

*Acceptance Criteria*

- AC-1: Successful creation shows "Operating Country Created Successfully." — **confirmed**
- AC-2: Failed creation shows "Unable To Create Operating Country. Please try again." — **confirmed**
- AC-3: Successful update shows "Operating Country Updated Successfully." — **confirmed**
- AC-4: Failed update shows "Unable To Update Operating Country. Please try again." — **confirmed**
- AC-5: A search returning nothing shows "No Operating Country found. Please try again." — **confirmed**. No legacy text existed for this case.
- AC-6: A duplicate name shows "Operating Country Already Exists." on creation and update (REQ-OPC-010 AC-5), and "Another Operating Country With The Same Name Already Exists." on the defensive re-check at approval (REQ-OPC-012 AC-1) — both **confirmed**.
- AC-7: **Every message text in this specification is confirmed**, the two approval confirmations included. The legacy originals they replace are recorded in Section 5.2 and the superseded screen labels in Section 5.3.

**REQ-OPC-043 — Return to list after save**

After a successful create or update, the system shall return the user to the operating country list reflecting the change.

*Acceptance Criteria*

- AC-1: Following a successful save, the operating country list is displayed.
- AC-2: The just-saved operating country is discoverable per the applicable listing and search rules.
- AC-3: The list returned to reflects the default of REQ-OPC-021 — active records, newest modification first. An operating country approved directly at creation, or an amended approved one, therefore appears at the top of that list. One created as *Pending for Approval* does not, being inactive; it is found by searching on that status (REQ-OPC-020 AC-3).

---

### 3.10 Naming & Terminology

**REQ-OPC-045 — An operating country is labelled "Operating Country (POS)" on every screen**

The system shall denote an operating country as **"Operating Country (POS)"** wherever it is labelled, on every screen in the platform.

*Acceptance Criteria*

- AC-1: The label is **"Operating Country (POS)"**. It applies on the Operating Country screens and equally on every consuming screen — branch creation, staff assignment, airline configuration, markup, discount and service-charge rules, UCCF configuration, GDS deal codes, airport exclusions and reporting.
- AC-2: It applies to **every kind of label** for the entity: page and section headings, grid column headings, and selection controls. A selection control reads **"Select Operating Country (POS)"**.
- AC-3: The entity's name field reads **"Operating Country (POS) Name"**.
- AC-4: The wording is **identical on every screen**. One label serves them all; the same entity is never labelled two different ways in two places.
- AC-5: The legacy labels **"Country POS"**, **"Select Country POS"**, **"Operating Country"**, **"Operating Country Name"**, **"Operating Country Details"**, **"Search Operating Country"**, **"Select Operating Country"** and the bare **"Name"** are all superseded by this requirement. The legacy originals are recorded in Section 5.2.
- AC-6: This governs **labels only**. User-facing messages continue to name the entity plainly as an "Operating Country", without the suffix, per Section 1.5 — "Operating Country Created Successfully.", not "Operating Country (POS) Created Successfully."
- AC-7: ⚠️ Whether the equivalent labels one and two levels down the hierarchy — "Branch POS" and "Agency POS" — take the same shape, becoming "Branch (POS)" and "Agency (POS)", is **not decided here**. Those labels belong to the Branch and Agency specifications — `WARN-OPC-035`.

---

## 4. Requirement Traceability Summary

| Area | Requirements |
|---|---|
| Information model | REQ-OPC-001 |
| Creation | REQ-OPC-002 … REQ-OPC-005 |
| Validation & uniqueness | REQ-OPC-006 … REQ-OPC-013 |
| Editing | REQ-OPC-014 … REQ-OPC-018 |
| Listing, search & pagination | REQ-OPC-019 … REQ-OPC-023 |
| Approval workflow | REQ-OPC-024 … REQ-OPC-027, REQ-OPC-029, REQ-OPC-046 |
| *Withdrawn* | *REQ-OPC-028, REQ-OPC-032, REQ-OPC-044 — see Section 5* |
| Lifecycle & status | REQ-OPC-030, REQ-OPC-031 |
| Organization hierarchy & dependent records | REQ-OPC-033 … REQ-OPC-037 |
| Access control | REQ-OPC-038 … REQ-OPC-040 |
| Messaging & post-action | REQ-OPC-041 … REQ-OPC-043 |
| Naming & terminology | REQ-OPC-045 |

---

## 5. Warnings

> Every item below is an inconsistency, contradiction, gap or defect found in the legacy source, **open and deferred to the planning phase**, where it must be closed by an explicit decision before the feature is built.
>
> **Two remain open, and both are open by choice.** 🔺 `WARN-OPC-030` (two hierarchy encodings) and 🔺 `WARN-OPC-035` (residual label consolidation) are **deliberately carried forward** and raised from Low to Medium, so that they survive review and are decided rather than quietly dropped. They are not oversights, and nothing else is unresolved.
>
> Every High-severity warning is closed, every message text is confirmed, no rule is enforced by the front end alone, and every standing platform convention is adopted.
>
> **Thirty-six are resolved.** `WARN-OPC-027`, `WARN-OPC-028` and `WARN-OPC-033` were closed under `CR-OPC-001`; `WARN-OPC-016`, `WARN-OPC-021` and `WARN-OPC-026` under `CR-OPC-002`; `WARN-OPC-023` under `CR-OPC-003`; `WARN-OPC-001` through `WARN-OPC-005` under `CR-OPC-005`; `WARN-OPC-013`, `WARN-OPC-014` and `WARN-OPC-036` under `CR-OPC-006`; `WARN-OPC-009` and `WARN-OPC-015` under `CR-OPC-007`; `WARN-OPC-006` under `CR-OPC-008`; `WARN-OPC-008` and `WARN-OPC-011` under `CR-OPC-009`; `WARN-OPC-012`, `WARN-OPC-017` and `WARN-OPC-032` under `CR-OPC-010`; `WARN-OPC-007`, `WARN-OPC-018`, `WARN-OPC-024`, `WARN-OPC-029` and `WARN-OPC-031` under `CR-OPC-011`; `WARN-OPC-019` and `WARN-OPC-020` under `CR-OPC-012`; `WARN-OPC-022`, `WARN-OPC-034` and `WARN-OPC-037` under `CR-OPC-014`; and `WARN-OPC-025` and `WARN-OPC-038` under `CR-OPC-015`. Each is now stated directly in the requirements above. Their identifiers are retired, are not reused, and are recorded at the end of this section.
>
> **Four were narrowed rather than withdrawn**, each retaining the part still genuinely open: `WARN-OPC-022` keeps single-sided rights enforcement and loses the direct-approval clause; `WARN-OPC-011` keeps that the approval status must be computed rather than accepted and loses the question of which status an amendment yields; `WARN-OPC-019` keeps the cascade to branches and agencies and loses the resubmission question; `WARN-OPC-024` keeps the decision notifications and loses the creation notification. `WARN-OPC-034` narrows as each message text is confirmed.

### 5.1 Warnings register

| ID | Sev | Affects | Description | Suggested resolution |
|---|---|---|---|---|
| **`WARN-OPC-030`** | **M** | REQ-OPC-033, REQ-OPC-001 | 🔺 **CARRY FORWARD — two inconsistent level encodings for the same record.** An operating country is stored as two records, each saying "operating country" on a different scale: the group record carries **level 2** and the organization record carries **type 1**. A branch is **level 3** and **type 2**, an agency **type 3**. The two scales are **off by one** and both are written on every record, so "which level is an operating country" has two answers. Any query, report or rule that walks the hierarchy must know which scheme it is reading, and the legacy code does mix them — the duplicate-name check passes a hardcoded `"2"` without it being determinable which scale that is. | Settle **one** encoding for the hierarchy and drop the other. Deliberately left open at the user's instruction and to be decided later; raised from Low to Medium and marked for carry-forward so it is not lost. |
| **`WARN-OPC-035`** | **M** | REQ-OPC-045, Section 1.4 | 🔺 **CARRY FORWARD — residual naming cleanup now the label is settled.** The entity is denoted by **eight** separate labels, two of them duplicate pairs reading the same text, and one — a label keyed as a country name but reading "Operating Country Name" — is **shared with the Currency module**, so changing it for one feature changes it for the other. It is separately undecided whether "Branch POS" and "Agency POS" take the same shape as REQ-OPC-045, becoming "Branch (POS)" and "Agency (POS)". | Consolidate to one label per concept and separate the label shared with Currency. Decide whether the branch and agency labels follow the same shape, and record that decision in the Branch and Agency specifications. Raised from Low to Medium and marked for carry-forward at the user's instruction. |

**Resolved and retired.** `WARN-OPC-027` recorded that the list headed two columns identically as "Country Name", one for the operating country's own name and one for the country it points at; that is settled by **REQ-OPC-045**, under which the first is headed "Operating Country (POS)". `WARN-OPC-028` recorded that a "Select Country POS" label existed with no field behind it, and left open whether an operating country was intended to carry a point-of-sale country distinct from its geographic country. That is settled: a point of sale **is** an operating country, so no separate attribute exists or is needed, and the label is settled as "Operating Country (POS)" by **REQ-OPC-045**. `WARN-OPC-033` recorded that the approved-and-active filter was applied inconsistently across consumers; the legacy platform in fact held **two** point-of-sale country lists with different membership rules, one of which ignored the operating country's own approval and lifecycle status altogether and could therefore offer a pending or rejected market as a rule target, while identifying it by its country rather than by itself. That is settled by **REQ-OPC-029**, which replaces both with a single list, filtered on the operating country's own statuses and identified by its own name. `WARN-OPC-016` left it undefined whether remarks were mandatory on a plain amendment; that is settled by **REQ-OPC-002** AC-4 and **REQ-OPC-018** AC-3, under which remarks are mandatory wherever the system presents them. `WARN-OPC-021` recorded that the approver user type could not create an operating country and that the two routes to approval authority were therefore unequal; that is settled by **REQ-OPC-002** AC-5 and **REQ-OPC-040** AC-3, which make the routes equivalent and admit both to the Add action. `WARN-OPC-026` recorded that the Add and Search screens drew their country lists from different sources; that is settled by **REQ-OPC-002** AC-6 and **REQ-OPC-020** AC-7, which make it one list, restricted to active countries on the Add form and unrestricted on the Search screen with inactive countries visually marked. `WARN-OPC-023` recorded that an unexplained airline-to-geography mapping ran when an operating country was created; that is settled by withdrawing the side effect altogether (**REQ-OPC-005** AC-5).

`WARN-OPC-001` recorded that the name had no maximum length; that is settled by **REQ-OPC-007**, which fixes the range at 3 to 100 characters. `WARN-OPC-002` recorded three incompatible character rules for the same field; that is settled by **REQ-OPC-008**, which permits letters, spaces, hyphens, apostrophes and underscores and requires the name to begin with a letter. `WARN-OPC-003` recorded that only the mandatory-field checks were applied on submission; that is settled by **REQ-OPC-007** AC-3, **REQ-OPC-008** AC-2, **REQ-OPC-009** AC-4 and **REQ-OPC-010** AC-3, which put every length, character, trim and uniqueness rule on both sides, and by **REQ-OPC-013** AC-5, which records that no rule is now enforced by the front end alone. `WARN-OPC-004` recorded that case-insensitive uniqueness depended on the entry form lowering the value; that is settled by **REQ-OPC-010** AC-3, under which case-insensitivity is a property of the comparison itself and holds on every route. `WARN-OPC-005` recorded that one rule was reported by three different messages, one naming the wrong entity; that is settled by **REQ-OPC-010** AC-5, which fixes a single text.

`WARN-OPC-013` recorded that the duplicate check on update could never run, because the "name held before" was populated with the newly submitted name so the two were always equal; that is settled by **REQ-OPC-011** AC-3 to AC-5, under which the comparison is made against the name **as currently stored** and the check runs whenever the two differ — always, on creation. `WARN-OPC-014` recorded that the Edit form's duplicate-check handler was unreachable, so no check ran on that screen either; it described the same failure and falls with it, settled by **REQ-OPC-011** AC-6, which puts the check on the back end independently of the front end having run. `WARN-OPC-036` asked whether accented letters were permitted; that is settled by **REQ-OPC-008**, which accepts them.

`WARN-OPC-009` left it undefined whether a name held by a *Rejected* or *Inactive* operating country was released for reuse; that is settled by **REQ-OPC-010** AC-6 and **REQ-OPC-012** AC-2, under which uniqueness applies across every approval and lifecycle state, so a name is never released. `WARN-OPC-015` recorded that the uniqueness re-check at decision time was applied to rejections as well as approvals, which could leave a record that could be neither approved nor rejected; that is settled by **REQ-OPC-012** AC-3, which applies the check to **approval only**.

`WARN-OPC-006` recorded that an update could **erase** an operating country's country and currency, both controls being disabled on the Edit form so submitting nothing while the system accepted and wrote whatever it received; that is settled by **REQ-OPC-015**, under which both attributes are immutable after creation, any submitted value is ignored, the stored values are left unchanged whatever route the submission arrived by, and presenting the controls as non-editable is never the sole means of enforcement.

`WARN-OPC-008` recorded that no message was defined for a search returning nothing; that is settled by **REQ-OPC-020** AC-4 and **REQ-OPC-042** AC-5, the text now confirmed. `WARN-OPC-011` recorded that the approval status was accepted from the submission on update, so an amendment could set an operating country to *Approved* with no decision taken and by a user without approval authority; that is settled by **REQ-OPC-017** AC-1 and AC-2, under which the status is derived from **the action the user takes** — each action having one defined outcome — and any approval status present in the submission is **ignored**, enforced on both sides. `WARN-OPC-012` recorded that the approver's identity was erased on every amendment, overwritten with "no user" on a routine save; that is settled by **REQ-OPC-017** AC-5 and AC-6, under which the audit log is written on every update and every decision, an amendment recording no decision leaves the prior one untouched, and any earlier decision remains recoverable. `WARN-OPC-017` recorded two remarks fields with different rules; that is settled by **REQ-OPC-018**, which makes them **one attribute** with one rule set platform-wide — mandatory, maximum 250 characters, no other validation. `WARN-OPC-032` recorded that no history of remarks changes was retained; that is settled by **REQ-OPC-018** AC-6 and AC-7, under which the field may be overwritten precisely because every version is written to the audit log.

`WARN-OPC-007` recorded that the default list filter fell to *Inactive*, hiding every live market; that is settled by **REQ-OPC-021**, which defaults to active records, newest modification first, page 1, size 10. `WARN-OPC-018` recorded that the site scope was applied to uniqueness but nowhere else; that is settled by **REQ-OPC-020** AC-5 and **REQ-OPC-029** AC-9, which apply it to search, to the operating country list and to every selection list. `WARN-OPC-024` recorded that the decision notifications had no identifiable recipient; that is settled by **REQ-OPC-044**, which withdraws every notification the module raised. `WARN-OPC-029` recorded that `%` and `_` behaved as wildcards in the name search; that is settled by **REQ-OPC-020** AC-6, which matches the entered value as literal text. `WARN-OPC-031` recorded that the list order was applied page by page; that is settled by **REQ-OPC-023** AC-2 and AC-3, which order and filter the whole result set before any page is selected.

`WARN-OPC-020` recorded that no activate/deactivate action existed, so a live market could be taken out of service only by rejecting it; that is settled by **REQ-OPC-030** AC-4 to AC-11, which add the action on the Country module's pattern — approved records only, approval authority only, both preconditions enforced on both sides, and an explicit warning and confirmation before a deactivation. `WARN-OPC-019` recorded that withdrawing a market did not withdraw its branches and agencies; that is settled by **REQ-OPC-031**, which makes the absence of a cascade the specified behaviour: the subtree stays fully operational, no user account is disabled, and the single effect is that the operating country leaves every selection list so no new branch can be created beneath it.

`WARN-OPC-022` recorded that rights were enforced only by what was displayed; that is settled by **REQ-OPC-039** AC-5 to AC-7, under which the back end applies the same matrix when the action is performed, checks that the acting user holds the rights it requires, and refuses any action the matrix does not permit whatever route the request arrived by. `WARN-OPC-034` recorded that the two approval confirmations awaited confirmation; both are now **confirmed**, so every message text in this specification is settled. `WARN-OPC-037` recorded that stripping a staff user's last operating country would breach the at-least-one rule; that is dissolved by **REQ-OPC-035** AC-4, under which the assignment is **hidden rather than removed**, so a staff user never loses one.

`WARN-OPC-025` recorded that the currency list was not restricted to active currencies; that is settled by **REQ-OPC-002** AC-3, which offers active currencies only. `WARN-OPC-038` asked which in-app notifications the module raises; that is settled by withdrawing every notification and email requirement from the specification altogether — see the withdrawn requirements below. `WARN-OPC-010` recorded that the legacy platform's two interfaces validated differently; that is settled by **REQ-OPC-013**, which binds **every** route into the feature to one rule set applied on both sides — the warning restated a defect the requirement already forbids, whichever interfaces the rebuilt system provides.

All thirty-six identifiers are retired and are not reused, so references made before these decisions remain valid.

**Withdrawn requirements.** Two requirements are withdrawn from this specification by instruction. In **both cases the rule itself stands and is unchanged**; only the numbered requirement is removed, and both identifiers are retired and not reused.

- `REQ-OPC-028` stated that no approver is assigned. That is now stated within **REQ-OPC-025** AC-1: a pending operating country is visible to every user holding approval authority, no approver is named, recorded or routed to at any point, and no record can be stranded by an assigned approver being unavailable.
- `REQ-OPC-032` stated that an operating country cannot be deleted. It became redundant once deactivation was specified. The rule is recorded at **REQ-OPC-030** AC-11 and in Section 6: a market is taken out of service by deactivating it, the record is retained, and no route removes one.
- `REQ-OPC-044` covered the notifications and emails the module raised. **Every requirement concerning email notifications and alerts is withdrawn**, and the specification now states nothing about them at all. The three legacy emails are recorded as withdrawn in Section 6. What the user is shown is the on-screen confirmation of **REQ-OPC-042**, which is not a notification requirement and stands unchanged.

### 5.2 Superseded message texts

Recorded for traceability against the source system. **Every text below is confirmed.**

| Legacy text | Replacement |
|---|---|
| "Operating Country created successfully." | "Operating Country Created Successfully." |
| "Unable to create Operating Country, Please try later." | "Unable To Create Operating Country. Please try again." |
| "Operating Country updated successfully." | "Operating Country Updated Successfully." |
| "Unable to update Operating Country, Please try later." | "Unable To Update Operating Country. Please try again." |
| "Operating country name is required" | "Operating Country Name Cannot Be Empty." |
| "Country is required" | "Country Must Be Selected." |
| "Currency is required" | "Currency Must Be Selected." |
| "Company Name already exist" | "Operating Country Already Exists." |
| "Operating country name already exist, Try again with new name" | "Operating Country Already Exists." |
| — *(no legacy text; the length rule had no maximum)* | "Operating Country Name Should Be Min 3 and Max 100 characters." |
| "One of the operating country with same name already exist." | "Another Operating Country With The Same Name Already Exists." |
| "Please enter Remarks." | "Required!" |
| Approval confirmation assembled at runtime from fragments | "Operating Country Approved Successfully." |
| Rejection confirmation assembled at runtime from fragments | "Operating Country Rejected Successfully." |
| — *(no legacy text exists)* | "No Operating Country found. Please try again." |
| "Please Enter Valid Country." *(branch screen)* | "Please Enter A Valid Country." |
| "Please select at least one Operating Country." *(staff screen)* | "Please Select At Least One Operating Country." |
| "Please enter minimum 3 characters,Please enter alphabets only with some allowed special character." *(form guidance)* | Superseded by the settled rules of REQ-OPC-007 and REQ-OPC-008; the length message replaces it |
| "Only alphabets with spaces in between allowed" *(form guidance)* | Superseded by REQ-OPC-008 |

Style applied: Title Case ending with a full stop, the entity named plainly as an "Operating Country", and a trailing "Please try again." left in sentence case. **Every text is now consistent with it**, the duplicate-name message included.

### 5.3 Superseded screen labels

Recorded for traceability against the source system. All are replaced by the single label required by **REQ-OPC-045**, which is **confirmed** — the wording was dictated rather than proposed, so no confirmation marker applies.

| Legacy label | Screen(s) | Replaced with |
|---|---|---|
| "Select Country POS" | Operating Country | "Select Operating Country (POS)" |
| "Country POS" | Airline configuration, markup rules | "Operating Country (POS)" |
| "Select Operating Country" | Branch | "Select Operating Country (POS)" |
| "Select Country" *(the operating country picker, not the geographic country)* | Markup rules | "Select Operating Country (POS)" |
| "Operating Country" | Operating Country, Branch | "Operating Country (POS)" |
| "Operating Country Name" | Operating Country, Currency | "Operating Country (POS) Name" |
| "Name" | Operating Country | "Operating Country (POS) Name" |
| "Operating Country Details" | Operating Country | "Operating Country (POS) Details" |
| "Search Operating Country" | Operating Country | "Search Operating Country (POS)" |

Two legacy labels read "Country POS" and two read "Operating Country Name"; each pair is a duplicate of one concept and collapses to a single label here. The label shared with the Currency module needs separating — see `WARN-OPC-035`.

---

## 6. Assumptions & Notes

- This specification is reverse-engineered from the legacy system's observable behaviour and configuration. Where that behaviour is defective or ambiguous, the corrected and intended behaviour is **deferred to planning** through the warnings in Section 5 rather than decided here. This is an **init**-stage document.
- **Operating Country is not the Country master.** The two are separate features with separate specifications, separate approval records and separate screens, and the legacy source reuses vocabulary and stored messages across both. Where a text or a rule in the source names a "Country", this document has taken care to establish which of the two it belongs to; the texts that named the wrong entity are superseded in Section 5.2.
- **The operating country name is independent of the country it points at.** Nothing requires the two to match, and nothing prevents two operating countries pointing at the same country under different names. Whether either should be constrained is not addressed by the legacy source and is noted here so it is not discovered late. What *is* now settled is that such records stay distinguishable: REQ-OPC-029 AC-5 requires the list to identify each by its own name, so two markets over one country are separately selectable rather than collapsed or duplicated as they were in the legacy platform.
- **A point of sale is an operating country.** The legacy platform treated "point of sale" as though it were a concept of its own, gave it its own selection lists, and stored a point-of-sale reference as the underlying *country* rather than the operating country. It is not a separate concept. REQ-OPC-029 replaces every point-of-sale country list with the one operating country list, and REQ-OPC-045 gives the entity one label — "Operating Country (POS)" — on every screen, so the two vocabularies collapse into one. Nothing about the geographic Country master changes: an operating country still points at exactly one country (REQ-OPC-001).
- **The consuming features inherit both rules.** Airline configuration, markup, discount and service-charge rules, UCCF configuration, GDS deal codes, airport exclusions and reporting all select an operating country as their point of sale. Each draws from the single list of REQ-OPC-029 and uses the label of REQ-OPC-045; neither is restated in their own specifications. **The Airport specification needs separate attention**: it is at reviewed state, its `REQ-Airport-017` describes point-of-sale country exclusions as a blacklist, and how those exclusions are actually evaluated — against the selling market or against the flight's route endpoints — has not been verified. That verification and any consequent change to the Airport specification are outside this change.
- **Standing platform conventions — all adopted.** Five conventions were settled for this platform in the Country specification, and every one is now stated here as a positive requirement: no approver is assigned and every approver sees every pending record (REQ-OPC-025 AC-1); direct decision at the point of creation or amendment, with the approval attributed to the creator (REQ-OPC-004, REQ-OPC-046); approval remarks mandatory wherever presented, one attribute, maximum 250 characters (REQ-OPC-018); validation on both sides, every length, character, trim and uniqueness rule reduced to a single definition enforced on each side (REQ-OPC-013); and the approval action matrix, identical to Country's (REQ-OPC-039, REQ-OPC-046). Two further conventions are settled here for the first time and carry to every module: the **listing default** — active records only, newest modification first, page 1, size 10 (REQ-OPC-021 AC-5) — **No convention is left unadopted and no rule is enforced by the front end alone.**
- **No email or notification behaviour is specified.** The legacy platform sent three emails for an operating country — one on creation and one on each decision — all inherited from the branch and agency flows that share the same mechanism. An operating country has no account and no user of its own, so none had an identifiable recipient. **All three are withdrawn, and every requirement covering email notifications and alerts is withdrawn with them.** The module specifies nothing about notifying anyone. What a user sees is the on-screen confirmation or error of REQ-OPC-042, and a holder of approval authority finds records awaiting a decision by searching the list (REQ-OPC-020).
- **A currency withdrawn after the fact.** The currency list offers active currencies only (REQ-OPC-002 AC-3), and the currency is immutable after creation (REQ-OPC-015). Should a currency later be deactivated, the operating countries bound to it keep an out-of-service base currency and have no route to change it. Noted here so it is not discovered late; it belongs to the Currency specification as much as to this one.
- **The *Approved* and *Rejected* rows are deliberately asymmetric.** A holder of approval authority is offered **Cancel, Approve or Reject** on an *Approved* record but **Approve or Cancel** only on a *Rejected* one (REQ-OPC-046 AC-2). Approving an already-approved record is meaningful — it saves an amendment and records a fresh decision, an approver having no plain Update — whereas rejecting an already-rejected one changes nothing. This is settled by decision, not an oversight.
- **Uniqueness is per administrative site,** which diverges from Country. Country removed its site attribution altogether and made uniqueness platform-wide (its `CR-COU-013`); an operating country's name is unique **within a site**, and the same name may exist under another (REQ-OPC-010 AC-4). This makes the site attribution load-bearing, and the scope is applied consistently: to the uniqueness check, to search, to the operating country list and to every selection list drawing from it (REQ-OPC-020 AC-5, REQ-OPC-029 AC-9).
- **The approval action matrix is a platform-wide convention**, stated identically here and in the Country specification (`REQ-COU-039`) and applied to every module without being re-decided. So are the approval-remarks rules — one attribute, mandatory, maximum 250 characters, no other validation, pre-filled in full and overwritable because the audit log retains every version (REQ-OPC-018).
- **Two implementations existed in the legacy platform** — the original administration screens and a later programmatic interface — and they did not validate identically. This document describes the union of the observable behaviour. It does **not** prescribe which interfaces the rebuilt system provides; that is an implementation decision outside a business specification. What it does require is that **every** route into the feature applies the same rule set in full, on both sides, with the back end validating whatever arrives (REQ-OPC-013 AC-7). The divergence therefore cannot survive the rebuild whichever interfaces are built.
- **Coded values are described by their business meaning.** The source stores approval status and lifecycle status as numbers. The mapping is *Pending for Approval*, *Approved*, *Rejected* for approval status, and *Inactive*, *Active* for lifecycle status; the exact code-to-label mapping is to be confirmed in planning.
- **The Branch, Agency, Staff, Country, Currency and Rules features are out of scope** and are referenced only where they depend on an operating country. Their own creation, validation and approval rules belong to their own specifications. In particular, REQ-OPC-031 — that deactivating a market leaves its branches and agencies fully operational — should be restated in the Branch and Agency specifications when those are written, so the absence of a cascade is recorded from both ends.
- **An operating country cannot be deleted.** No delete capability exists anywhere in the source, and none is introduced. A market is taken out of service by **deactivating** it (REQ-OPC-030 AC-4), and the record is retained; there is no route that removes one. This was stated as `REQ-OPC-032` until that requirement was withdrawn as redundant once deactivation was specified — the rule is unchanged, and is recorded here and at REQ-OPC-030 AC-11. The Department feature's delete action is implemented as a status change, which is a different pattern and is not treated as precedent.
- Field-level screen layout, styling and control types are implementation concerns and are intentionally omitted, except where a control's behaviour carries a business rule — for example the non-editable country and currency at REQ-OPC-015, and the free-text branch lookup at REQ-OPC-034 AC-4.
- **Migration note.** The legacy platform let duplicate names through the edit path, because its duplicate check on update could never run (now settled by REQ-OPC-011). The existing data should therefore be examined for **duplicate operating country names**, for names breaching the settled 3-to-100 range or character set (REQ-OPC-007, REQ-OPC-008), for **records whose country or currency has been erased** by an amendment — which the legacy platform permitted and REQ-OPC-015 now prevents — before any migration is planned. Branches and agencies active beneath a rejected operating country need no repair — that is now the specified behaviour (REQ-OPC-031) — but the markets themselves should be reviewed, since rejection was the legacy's only way to withdraw one and some rejected records may be markets that were merely retired rather than found invalid; those belong as *Approved* and *Inactive* under REQ-OPC-030. A record with no country or no currency has no market and no base currency, so it cannot be migrated as it stands and must be repaired or withdrawn. Records failing the new rules must be corrected or quarantined, since a stricter rule applied to unclean data blocks the migration rather than the data entry. These are data-quality consequences, not separate functional issues.
- **Migration note — existing point-of-sale references.** Legacy point-of-sale mappings on airline configurations, markup rules, UCCF configurations, GDS deal codes and flight exclusions store the **country**, not the operating country. Under REQ-OPC-029 AC-7 a selection records the operating country, so every existing mapping must be re-pointed. Where a country carries exactly one operating country the mapping resolves unambiguously; where it carries more than one, the mapping is **ambiguous and cannot be resolved automatically** and each affected rule must be decided by hand. The count of such countries should be established before migration is planned.
