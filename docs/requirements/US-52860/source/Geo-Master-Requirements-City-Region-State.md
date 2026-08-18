# Business Requirements Specification — Geo-Location Master Data
## Features: City, Region, and State

**Source system reference:** `sheenrd/old-po-java` (Geo-Location master data within the administration module)
**Document date:** 2026-07-15
**Status:** Draft for planning review
**Scope of this document:** The three master-data features **City**, **Region**, and **State**, described as raw business requirements to enable a faithful re-build of identical functionality. Technical implementation detail (classes, code paths, query syntax) is deliberately excluded. Behaviour, rules, relationships, and known inconsistencies are captured instead.

---

## 1. Purpose and Reading Guide

This document restates the existing behaviour of the City, Region, and State master-data features as formal, numbered business requirements so that the same functionality can be rebuilt exactly.

- Each requirement has a stable identifier using a per-feature prefix:
  - **REQ-CIT-###** — City
  - **REQ-REG-###** — Region
  - **REQ-STA-###** — State
  - **REQ-SHR-###** — Shared / cross-cutting rules that apply identically to all three features
  - **REQ-REL-###** — Relationships (within the three features and with other features)
- Each requirement carries one or more **Acceptance Criteria (AC)**.
- Known contradictions, ambiguities, and defects are **not silently fixed**. They are recorded as **⚠️ WARNING** items (identified **WARN-###**) and must be resolved during the planning phase. A consolidated warning register appears in Section 8.

**Terminology used throughout:**
- **Maker** — a user who creates or edits a record but cannot approve it.
- **Checker / Approver** — a user with approver rights who can approve or reject records.
- **Active / Inactive** — the operational availability state of a record.
- **Approval state** — the position of a record in the maker-checker lifecycle: *Pending*, *Approved*, or *Rejected*.

---

## 2. Shared / Cross-Cutting Requirements (REQ-SHR)

These rules apply **identically** to City, Region, and State unless a feature-specific requirement overrides them.

### REQ-SHR-001 — Master data lifecycle states
Every City, Region, and State record shall carry two independent lifecycle indicators:
- an **operational status** with the business meanings **Active** and **Inactive**; and
- an **approval state** with the business meanings **Pending for Approval**, **Approved**, and **Rejected**.

**Acceptance Criteria**
- AC1: A record can be Active only when it is also Approved.
- AC2: A newly created record is never Active before it has been approved.
- AC3: The operational status and the approval state are stored and reported separately.

### REQ-SHR-002 — Maker-checker approval workflow
Creation and modification of a record shall be separated from its approval. A user who creates or edits a record shall not, by that action alone, make it operationally available.

**Acceptance Criteria**
- AC1: When a record is **created**, its approval state is set to **Pending for Approval** and its operational status is set to **Inactive**.
- AC2: When a record is **edited by a non-approver**, its operational status is set to **Inactive** and it re-enters the approval queue; the record cannot become Active from this action.
- AC3: When a record is **approved**, its approval state becomes **Approved** and its operational status becomes **Active**.
- AC4: When a record is **rejected**, its approval state becomes **Rejected** and its operational status becomes **Inactive**.
- AC5: The identity of the approving/rejecting user and the approval date are recorded and are distinct from the identity of the creator/editor.

### REQ-SHR-003 — Editing while pending approval
A record awaiting approval shall be protected from arbitrary editing by ordinary makers.

**Acceptance Criteria**
- AC1: A record whose approval state is **Pending for Approval** is not editable by a non-approver user.
- AC2: A user with approver rights may act on a record regardless of its pending state.

### REQ-SHR-004 — Approver-privileged edit shortcut
When a user with approver rights edits a record that is already Approved, the record shall be permitted to remain Active without a further separate approval step.

**Acceptance Criteria**
- AC1: An edit performed by an approver on an already-Approved record keeps the record Active.
- AC2: An edit performed by a non-approver always returns the record to Inactive and Pending, regardless of prior state.

> ⚠️ **WARNING (WARN-001):** REQ-SHR-004 lets an approver's edit bypass a second review. This weakens the maker-checker control (the same person edits and effectively re-approves). Confirm at planning whether this behaviour is intended or should be tightened.

### REQ-SHR-005 — Audit trail on every record
Every City, Region, and State record shall retain audit information capturing who created it and when, and who last modified it and when, plus approval-related audit fields (approver identity, approval date, approval remarks).

**Acceptance Criteria**
- AC1: Creation timestamp and creating-user are captured on creation.
- AC2: Last-modified timestamp and last-modifying-user are updated on every edit.
- AC3: Approver identity, approval date, and approval remarks are captured when an approval or rejection occurs.

### REQ-SHR-006 — Uniqueness of code and name
For each feature, the record **code** and the record **name** shall be unique within the feature's scope, and duplicates shall be rejected on both creation and update.

**Acceptance Criteria**
- AC1: Attempting to create or update a record with a code that already exists is rejected with a "code already exists" message.
- AC2: Attempting to create or update a record with a name that already exists is rejected with a "name already exists" message.

> ⚠️ **WARNING (WARN-002):** The case-sensitivity of uniqueness checks is unspecified in the source (e.g., whether "Riyadh" and "riyadh" are considered duplicates). Note that *search* matching is case-insensitive, which creates a possible mismatch with uniqueness behaviour. Define the intended case rule at planning.

### REQ-SHR-007 — Case-insensitive, partial-match search
Text-based search filters for all three features shall match case-insensitively and shall support partial (contains) matching.

**Acceptance Criteria**
- AC1: A search term matches records regardless of letter case.
- AC2: A search term matches records where the term appears as any substring of the target field.

### REQ-SHR-008 — Pagination of list results
List/search results for all three features shall be paginated using a requested page number and a maximum number of records per page, and shall return the total number of matching records and the number of available pages.

**Acceptance Criteria**
- AC1: The caller may specify a page number and a page size.
- AC2: The result reports total matching count, current page, and maximum page count.
- AC3: When the administration screen does not specify a page size, the default page size is **10**.

> ⚠️ **WARNING (WARN-003):** No explicit sort order is defined for City, Region, or State list results — result ordering is therefore unstable/unspecified. (By contrast, other master lists in the same system sort by last-modified descending or by name ascending.) A deterministic default sort must be defined at planning to make pagination reproducible.

### REQ-SHR-009 — Default field values
On creation, unset system fields shall receive default values consistent across the three features: the site identifier defaults to **1**, creation and last-modified timestamps default to the current date, and creating/last-updating user identifiers default to a system default where not supplied.

**Acceptance Criteria**
- AC1: A record created without an explicit site identifier is assigned site 1.
- AC2: Creation and last-modified dates are populated automatically when not provided.

### REQ-SHR-010 — Approver-only visibility filter in search
Search shall support a filter that restricts results according to whether the requesting user is an approver, so that approver users can see records relevant to the approval queue.

**Acceptance Criteria**
- AC1: Search accepts an indicator of the requesting user's approver role.
- AC2: Results are scoped in accordance with that role.

> ⚠️ **WARNING (WARN-004):** The exact business meaning of the approver-role search filter (what is shown vs. hidden for approver vs. non-approver) is under-specified in the source. Clarify the intended filtering at planning.

### REQ-SHR-011 — Absence of hard delete, import, and export
The three features provide creation, listing/search, retrieval by identifier, update, status change, and approval. They do **not** provide hard delete, bulk import, or export.

**Acceptance Criteria**
- AC1: There is no operation that permanently removes a City, Region, or State record.
- AC2: Deactivation (setting status to Inactive) is the only mechanism for retiring a record.
- AC3: No bulk import or export operation is offered.

> ⚠️ **WARNING (WARN-005):** "Retirement by deactivation only" means codes/names of retired records remain reserved forever under REQ-SHR-006. Confirm whether reuse of a deactivated record's code/name should be allowed at planning.

---

## 3. City Feature (REQ-CIT)

A **City** is a named place belonging to a State and a Country, used as reference master data across the system.

### 3.1 City Data

### REQ-CIT-001 — City attributes
A City record shall consist of: a unique identifier, a **city code**, a **city name**, the **owning country**, the **owning state** (both an identifier and the state's code), a site identifier, an operational status, an approval state, and the shared audit fields.

**Acceptance Criteria**
- AC1: All listed attributes are captured and persisted for every City.
- AC2: A City always references exactly one country and one state.

### REQ-CIT-002 — City code rules
The city code is mandatory, unique, alphanumeric, and between 1 and 50 characters in length.

**Acceptance Criteria**
- AC1: Saving a City with an empty city code is rejected.
- AC2: Saving a City with a duplicate city code is rejected.
- AC3: A city code longer than 50 characters is rejected.
- AC4: A city code containing characters outside the allowed alphanumeric set is rejected.

### REQ-CIT-003 — City name rules
The city name is mandatory, unique, and between 1 and 125 characters in length.

**Acceptance Criteria**
- AC1: Saving a City with an empty city name is rejected.
- AC2: Saving a City with a duplicate city name is rejected.
- AC3: A city name longer than 125 characters is rejected.

> ⚠️ **WARNING (WARN-006):** The city-name format rule is contradictory in the source: the intended pattern (letters plus spaces) is disabled/commented out, while the user-facing message states "City Name is alpha" (letters only, no spaces). Real city names commonly contain spaces (e.g., "New York"). Decide the definitive rule at planning.

### REQ-CIT-004 — Create City
An authorised user shall be able to create a new City by supplying its code, name, owning country, and owning state.

**Acceptance Criteria**
- AC1: On successful creation the City is stored as Inactive and Pending for Approval (per REQ-SHR-002).
- AC2: Uniqueness of code and name is enforced (per REQ-SHR-006).
- AC3: A confirmation of success or a descriptive failure is returned.

### REQ-CIT-005 — Retrieve City by identifier
A user shall be able to retrieve the full details of a single City by its identifier.

**Acceptance Criteria**
- AC1: Supplying a valid identifier returns the complete City record.
- AC2: Supplying an unknown identifier returns a not-found outcome rather than an arbitrary record.

### REQ-CIT-006 — Search / list Cities
A user shall be able to search and list Cities by any combination of: city code, city name, owning-state code, owning-state identifier, owning-country identifier, and operational status; with case-insensitive partial matching and pagination.

**Acceptance Criteria**
- AC1: Each listed filter, alone or combined, correctly narrows the result set.
- AC2: Text filters match case-insensitively and partially (per REQ-SHR-007).
- AC3: Results are paginated with totals (per REQ-SHR-008).
- AC4: Each result row includes the resolved **country name** alongside the city's own fields for display.

### REQ-CIT-007 — Update City
An authorised user shall be able to update an existing City's editable attributes.

**Acceptance Criteria**
- AC1: A non-approver's update returns the City to Inactive and Pending (per REQ-SHR-002 AC2).
- AC2: Uniqueness of code and name continues to be enforced on update.
- AC3: A City that is Pending for Approval cannot be edited by a non-approver (per REQ-SHR-003).

### REQ-CIT-008 — Change City operational status
An authorised user shall be able to activate or deactivate a City.

**Acceptance Criteria**
- AC1: The City's operational status can be set to Active or Inactive.
- AC2: A City may only be Active when it is Approved (per REQ-SHR-001 AC1).

### REQ-CIT-009 — Approve or reject City
An approver shall be able to approve or reject a City, driving the maker-checker lifecycle.

**Acceptance Criteria**
- AC1: Approval sets the City to Approved and Active and records the approver and date.
- AC2: Rejection sets the City to Rejected and Inactive.

### REQ-CIT-010 — Hierarchical retrieval of active geography
The system shall be able to return the active geographic hierarchy (countries with their active states and, within each active state, its active cities).

**Acceptance Criteria**
- AC1: Only records with Active status appear in the hierarchy at every level (country, state, city).
- AC2: An Inactive state excludes its cities from the hierarchy even if those cities are individually Active.

> ⚠️ **WARNING (WARN-007):** There is no cross-validation guaranteeing that a City's owning state actually belongs to its owning country. A City can be linked to a country and a state that are unrelated, producing inconsistent geography. Add an integrity rule at planning (the chosen state must belong to the chosen country).

---

## 4. Region Feature (REQ-REG)

A **Region** is a grouping construct that aggregates one or more Countries (for example, for organisational or reporting grouping). A Region is *not* a level of the Country→State→City hierarchy.

### 4.1 Region Data

### REQ-REG-001 — Region attributes
A Region record shall consist of: a unique identifier, a **region code**, a **region name**, a set of associated **countries**, a site identifier, an operational status, an approval state, and the shared audit fields.

**Acceptance Criteria**
- AC1: All listed attributes are captured and persisted for every Region.
- AC2: A Region may be associated with multiple countries.

### REQ-REG-002 — Region code rules
The region code is mandatory, unique, and between 1 and 50 characters, permitting letters, digits, and spaces.

**Acceptance Criteria**
- AC1: Saving a Region with an empty region code is rejected.
- AC2: Saving a Region with a duplicate region code is rejected.
- AC3: A region code longer than 50 characters is rejected.
- AC4: A region code containing characters outside letters, digits, and spaces is rejected.

> ⚠️ **WARNING (WARN-008):** The region-code user-facing message states "Region Code is alphanumeric", but the enforced rule also permits **spaces**. The message is misleading. Reconcile the message and the rule at planning.

### REQ-REG-003 — Region name rules
The region name is mandatory, unique, and between 1 and 125 characters, permitting letters and spaces.

**Acceptance Criteria**
- AC1: Saving a Region with an empty region name is rejected.
- AC2: Saving a Region with a duplicate region name is rejected.
- AC3: A region name longer than 125 characters is rejected.
- AC4: A region name containing digits or other non-letter/space characters is rejected.

### REQ-REG-004 — Associate countries with a Region
When creating or editing a Region, the user shall be able to associate one or more countries with that Region.

**Acceptance Criteria**
- AC1: A Region can be saved with multiple associated countries.
- AC2: The set of associated countries can be changed on update.

> ⚠️ **WARNING (WARN-009):** It is unspecified whether one Country may belong to more than one Region simultaneously, and whether removing a country from a Region has downstream effects. Define country-to-region cardinality and change effects at planning.

### REQ-REG-005 — Create Region
An authorised user shall be able to create a new Region with its code, name, and associated countries.

**Acceptance Criteria**
- AC1: On successful creation the Region is stored as Inactive and Pending for Approval.
- AC2: Uniqueness of code and name is enforced.

### REQ-REG-006 — Retrieve Region by identifier
A user shall be able to retrieve the full details of a single Region, including its associated countries, by its identifier.

**Acceptance Criteria**
- AC1: A valid identifier returns the complete Region and its country associations.
- AC2: An unknown identifier returns a not-found outcome.

### REQ-REG-007 — Search / list Regions
A user shall be able to search and list Regions by region code, region name, and operational status, with case-insensitive partial matching and pagination.

**Acceptance Criteria**
- AC1: Each filter, alone or combined, correctly narrows results.
- AC2: Text filters match case-insensitively and partially.
- AC3: Results are paginated with totals.

### REQ-REG-008 — Update Region
An authorised user shall be able to update a Region's editable attributes and its associated countries.

**Acceptance Criteria**
- AC1: A non-approver's update returns the Region to Inactive and Pending.
- AC2: Uniqueness of code and name continues to be enforced on update.
- AC3: A Region Pending for Approval cannot be edited by a non-approver.

### REQ-REG-009 — Change Region operational status
An authorised user shall be able to activate or deactivate a Region.

**Acceptance Criteria**
- AC1: The Region's operational status can be set to Active or Inactive.
- AC2: A Region may only be Active when it is Approved.

### REQ-REG-010 — Approve or reject Region
An approver shall be able to approve or reject a Region.

**Acceptance Criteria**
- AC1: Approval sets the Region to Approved and Active and records the approver and date.
- AC2: Rejection sets the Region to Rejected and Inactive.

---

## 5. State Feature (REQ-STA)

A **State** (province) belongs to a Country and contains Cities. It is the middle level of the Country→State→City hierarchy.

### 5.1 State Data

### REQ-STA-001 — State attributes
A State record shall consist of: a unique identifier, a **state code**, a **state name**, the **owning country**, a site identifier, an operational status, an approval state, and the shared audit fields (including approval remarks and approval date).

**Acceptance Criteria**
- AC1: All listed attributes are captured and persisted for every State.
- AC2: A State always references exactly one country, and the country is mandatory.

### REQ-STA-002 — State code rules
The state code is mandatory, unique, and between 1 and 125-and-under limits as defined (see warnings), permitting letters and spaces.

**Acceptance Criteria**
- AC1: Saving a State with an empty state code is rejected.
- AC2: Saving a State with a duplicate state code is rejected.
- AC3: The state code respects the defined maximum length.
- AC4: The state code respects the defined character-set rule.

> ⚠️ **WARNING (WARN-010):** The **maximum length** of the state code is inconsistent between layers: the data rule allows up to **50** characters while the entry screen caps input at **4** characters. A code accepted in one layer may be rejected or truncated in the other. Choose a single authoritative maximum at planning.

> ⚠️ **WARNING (WARN-011):** The **character-set** rule for the state code is inconsistent: the data rule allows letters and spaces, the entry screen allows letters, hyphens, underscores and spaces, and the user-facing message says "alphanumeric" (implying digits). These three definitions conflict. Choose one authoritative rule at planning.

### REQ-STA-003 — State name rules
The state name is mandatory, unique, between 1 and 125 characters, permitting letters and spaces.

**Acceptance Criteria**
- AC1: Saving a State with an empty state name is rejected.
- AC2: Saving a State with a duplicate state name is rejected.
- AC3: A state name longer than 125 characters is rejected.
- AC4: A state name containing digits or other non-letter/space characters is rejected.

### REQ-STA-004 — Create State
An authorised user shall be able to create a new State with its code, name, and mandatory owning country.

**Acceptance Criteria**
- AC1: On successful creation the State is stored as Inactive and Pending for Approval.
- AC2: Creation without an owning country is rejected.
- AC3: Uniqueness of code and name is enforced.

### REQ-STA-005 — Retrieve State by identifier
A user shall be able to retrieve the full details of a single State by its identifier.

**Acceptance Criteria**
- AC1: A valid identifier returns the complete State record.
- AC2: An unknown identifier returns a not-found outcome.

### REQ-STA-006 — Search / list States
A user shall be able to search and list States by state code, state name, owning-country, and operational status, with case-insensitive partial matching and pagination.

**Acceptance Criteria**
- AC1: Each filter, alone or combined, correctly narrows results.
- AC2: Text filters match case-insensitively and partially.
- AC3: Results are paginated with totals; the default page size is 10.
- AC4: Result rows may include the resolved **country name** for display.

### REQ-STA-007 — Update State
An authorised user shall be able to update a State's editable attributes.

**Acceptance Criteria**
- AC1: A non-approver's update returns the State to Inactive and Pending.
- AC2: Uniqueness of code and name continues to be enforced on update.
- AC3: A State Pending for Approval cannot be edited by a non-approver.

### REQ-STA-008 — Change State operational status
An authorised user shall be able to activate or deactivate a State.

**Acceptance Criteria**
- AC1: The State's operational status can be set to Active or Inactive.
- AC2: A State may only be Active when it is Approved.

### REQ-STA-009 — Approve or reject State
An approver shall be able to approve or reject a State.

**Acceptance Criteria**
- AC1: Approval sets the State to Approved and Active and records the approver, approval date, and any remarks.
- AC2: Rejection sets the State to Rejected and Inactive.

### REQ-STA-010 — List cities of a State
The system shall be able to return the Cities belonging to a given State.

**Acceptance Criteria**
- AC1: Given a State identifier, its associated Cities are returned.
- AC2: Consumers relying on active geography receive only Active cities (per REQ-CIT-010).

---

## 6. Relationships (REQ-REL)

### 6.1 Relationships Among City, Region, and State

### REQ-REL-001 — Country→State→City hierarchy
The features form a strict containment hierarchy: a Country contains States, and a State contains Cities. Each City belongs to exactly one State and one Country; each State belongs to exactly one Country.

**Acceptance Criteria**
- AC1: A City cannot exist without a valid owning State and owning Country.
- AC2: A State cannot exist without a valid owning Country.
- AC3: The active hierarchy is retrievable top-down (Country → active States → active Cities).

### REQ-REL-002 — Region groups Countries (parallel to the hierarchy)
A Region groups **Countries** and does not directly contain States or Cities. Region is an aggregation dimension that sits alongside — not inside — the Country→State→City hierarchy.

**Acceptance Criteria**
- AC1: A Region references a set of Countries.
- AC2: A Region does not directly reference States or Cities.

> ⚠️ **WARNING (WARN-012):** Because Region links only to Country, there is no direct/enforced relationship between a Region and the States or Cities beneath its member countries. Any requirement to reason about "the states/cities in a region" must be derived indirectly through countries. Confirm at planning whether an explicit Region→State/City relationship is required.

### REQ-REL-003 — Cascade effect of deactivation through the hierarchy
Deactivating a higher level of the hierarchy suppresses lower levels from the active geography view.

**Acceptance Criteria**
- AC1: When a State is Inactive, its Cities do not appear in the active hierarchy even if individually Active.
- AC2: When a Country is Inactive, its States and Cities do not appear in the active hierarchy.

> ⚠️ **WARNING (WARN-013):** Deactivation only *hides* lower levels from the active-hierarchy view; it does not deactivate or otherwise flag the child records themselves, nor does it warn about dependent records elsewhere. Define the intended cascade-and-warning behaviour at planning (see WARN-014).

### 6.2 Relationships with Other Features

### REQ-REL-004 — Consumption of geography by dependent features
The City, State, Country, and Region master data are referenced by numerous other features. Rebuilding these three features must preserve their role as referenceable master data for the following known consumers:
- **Organisation / Branch management** — branches and organisation units reference **Country**.
- **Currency mapping** — currencies are mapped to **Countries**.
- **Airline & Airport configuration** — airlines and airports are mapped to **Countries** (and airports to their locations).
- **Rule engines / pricing / billing** — discount, tag, blackout/blacklist, and billing-settlement rules reference **Countries** and **Cities**.
- **Custom fields (user-controlled)** — mapped to **Cities** and **Countries**.
- **Knowledge Center** — content targeted to **Countries** and destination **Cities**.
- **User addresses** — reference **City / State / Country**.

**Acceptance Criteria**
- AC1: Each of the three features exposes stable identifiers by which other features reference them.
- AC2: Consumers that require only active geography can obtain active-only records.
- AC3: The re-built features maintain referential compatibility with these consumers.

> ⚠️ **WARNING (WARN-014):** Deactivating a State or City can leave dependent records (addresses, rules, mappings, knowledge-center targets) pointing at an Inactive geography record, with no impact analysis or user warning in the source. Define at planning whether deactivation should be blocked, warned, or cascaded when dependents exist.

> ⚠️ **WARNING (WARN-015):** Region's relationship to the *currency* feature is indirect: currency is mapped to **Country**, and Region groups **Countries**. There is no direct Region↔Currency mapping. If Region-level currency behaviour is expected in the new build, it must be defined explicitly at planning.

### REQ-REL-005 — Naming-prefix convention for the re-build
Each rebuilt feature shall retain a distinct requirement/identifier prefix consistent with this document (e.g., **CUR** for currencies, **REG** for regions, **CIT** for cities, **STA** for states), so cross-feature requirements remain traceable.

**Acceptance Criteria**
- AC1: Every feature's requirements use a unique, feature-specific prefix.
- AC2: Cross-feature relationships cite the identifiers of both related features.

---

## 7. Operation Coverage Matrix

| Operation | City | Region | State |
|---|---|---|---|
| Create | ✔ | ✔ | ✔ |
| Retrieve by identifier | ✔ | ✔ | ✔ |
| Search / list (paginated) | ✔ | ✔ | ✔ |
| Update | ✔ | ✔ | ✔ |
| Activate / deactivate | ✔ | ✔ | ✔ |
| Approve / reject | ✔ | ✔ | ✔ |
| Hard delete | ✘ (not provided) | ✘ | ✘ |
| Bulk import / export | ✘ | ✘ | ✘ |
| Associate countries | — | ✔ | — |
| List child records | Cities via State (REQ-STA-010) | Countries (REQ-REG-006) | Cities (REQ-STA-010) |

---

## 8. Consolidated Warning Register (to be resolved at planning)

| ID | Feature(s) | Summary | Requirement link |
|---|---|---|---|
| WARN-001 | Shared | Approver's own edit re-activates a record without a second review, weakening maker-checker. | REQ-SHR-004 |
| WARN-002 | Shared | Case-sensitivity of code/name uniqueness undefined; may conflict with case-insensitive search. | REQ-SHR-006 |
| WARN-003 | Shared | No default sort order for list results → non-reproducible pagination. | REQ-SHR-008 |
| WARN-004 | Shared | Approver-role search filter semantics under-specified. | REQ-SHR-010 |
| WARN-005 | Shared | Deactivated codes/names stay reserved forever; reuse policy undefined. | REQ-SHR-011 |
| WARN-006 | City | City-name format contradictory: intended letters+spaces disabled, message says "alpha" (no spaces). | REQ-CIT-003 |
| WARN-007 | City | No integrity check that a City's state belongs to its country. | REQ-CIT-010 |
| WARN-008 | Region | Region-code message says "alphanumeric" but rule also allows spaces. | REQ-REG-002 |
| WARN-009 | Region | Country-to-Region cardinality and removal effects undefined. | REQ-REG-004 |
| WARN-010 | State | State-code max length inconsistent: data rule 50 vs. entry screen 4. | REQ-STA-002 |
| WARN-011 | State | State-code character set inconsistent across data rule, entry screen, and message. | REQ-STA-002 |
| WARN-012 | Relationships | Region links only to Country; no direct Region→State/City relationship. | REQ-REL-002 |
| WARN-013 | Relationships | Deactivation only hides children from active view; no true cascade or flagging. | REQ-REL-003 |
| WARN-014 | Relationships | Deactivating geography can orphan dependent records with no impact warning. | REQ-REL-004 |
| WARN-015 | Relationships | Region↔Currency link is only indirect (via Country); Region-level currency undefined. | REQ-REL-004 |

---

## 9. Assumptions and Notes

- This specification captures behaviour as observed in the source system reference; where the source itself is contradictory, the contradiction is preserved as a **WARNING** rather than resolved.
- Numeric encodings used internally by the source (for status and approval state) have been expressed here in business terms (Active/Inactive; Pending/Approved/Rejected).
- Country is referenced throughout as a related feature but is **out of scope** for detailed requirements in this document; it should receive its own specification (suggested prefix **CTR** or **CNT**) using the same conventions.
- All requirements are written to be independently testable via their acceptance criteria.
