# Confirmed Human Decisions — US 52857

**Human authority.** This file outranks the agent's reading of the requirement and
**survives every regeneration** of `requirement-analysis.md`. The agent may cite these
decisions; it may never add to this file on its own.

---

## D-01 — The current implementation is the source of truth where sources conflict

**Decided by:** human · **Date:** 2026-10-09 · **Source:** explicit session instruction,
given when requesting the `/analyze-story 52857` run

Where the **current implementation** — the behaviour observed in the STG Admin Panel UI, or
in the API's actual behaviour — **conflicts** with the User Story's acceptance criteria, its
attached Business Requirements Specification, or the Swagger/OpenAPI specification, **the
implementation is the expected behaviour** for this story's analysis.

Verbatim: *"For this analysis, the current implementation (UI/API behavior) is the source of
truth when it conflicts with the Swagger or User Story."*

**How it is applied (agent's reading, for the human to correct):**

- Every conflict is still **recorded with all sides visible** — `[E]`, `[API]`, `[UI]` — so the
  divergence from the written requirement stays traceable. D-01 decides which side is
  expected; it does not erase the others.
- D-01 resolves a conflict only where the implementation's behaviour was **actually
  observed**. Where it was not observed (server-side behaviour behind a submit that was not
  performed), the conflict stays an open question.
- Where the **UI and the API disagree with each other**, the implementation is not one
  thing, and D-01 cannot pick a side: the conflict stays a blocking open question.
- Swagger text is documentation of the API, not observed API behaviour. A Swagger statement
  that conflicts with the story is resolved by D-01 only once the API's real behaviour has
  been seen.

---

## D-02 — Makers activate and deactivate; they never approve or reject (closes OQ-01)

**Decided by:** human · **Date:** 2026-10-09 · **Source:** explicit session instruction

Maker users (edit right, no approval authority) **can Activate and Deactivate** Operating
Countries. Maker users **cannot Approve or Reject**. The current UI behaviour is correct and is
the source of truth.

Verbatim: *"Maker users can Activate and Deactivate Operating Countries. Maker users cannot
Approve or Reject. The current UI behavior is correct and is the source of truth."*

**Conflicting evidence, kept beside the decision:** REQ-OPC-030 AC-5/AC-6 and story Lifecycle AC-2
reserve activation/deactivation for approval authority; the Swagger for
`PATCH /api/v1/operatingcountries/{id}/status` says *"Requires approval authority, enforced
here on the back end"* (403 otherwise). The decision was taken with this conflict shown
(analysis C-14).

---

## D-03 — Approvers cannot Add or Edit (closes OQ-02)

**Decided by:** human · **Date:** 2026-10-09 · **Source:** explicit session instruction

Approver users **cannot Add or Edit** Operating Countries. The current UI behaviour is correct
and is the source of truth.

Verbatim: *"Approver users cannot Add or Edit Operating Countries. The current UI behavior is
correct and is the source of truth."*

**Conflicting evidence, kept beside the decision:** REQ-OPC-002 AC-5, REQ-OPC-039 AC-1 and
REQ-OPC-040 AC-3 give approval authority the Add action and the Edit form. The Swagger for
`PATCH …/{id}/approval-status` is consistent with the decision (*"Requires Approve alone, so a
caller with approval authority but no edit right can still decide"*). The decision was taken with
the conflict shown (analysis C-15).

---

## D-04 — The View-only account is corrected (closes OQ-03)

**Decided by:** human · **Date:** 2026-10-09 · **Source:** explicit session instruction

The human supplied the correct View-only username, to be used with the password already
supplied for the View-only account; the previously supplied username (the Maker's) was
incorrect. Stored in `.env` as handle `OPERATING_COUNTRIES_VIEW_ONLY` — usernames and passwords
never appear in this file. The account was validated by logging in on STG the same day.

---

## D-05 — Reject remarks follow the current UI and API (closes OQ-04)

**Decided by:** human · **Date:** 2026-10-09 · **Source:** explicit session instruction

For Reject remarks, **the current UI and API behaviour are the source of truth.**

Verbatim: *"For Reject Remarks, the current UI and API behavior are the source of truth."*

---

## D-06 — Currency/Country mapping follows the current UI and API (closes OQ-05)

**Decided by:** human · **Date:** 2026-10-09 · **Source:** explicit session instruction

For Currency/Country mapping, **the current UI and API behaviour are the source of truth.**

Verbatim: *"For Currency/Country mapping, the current UI and API behavior are the source of
truth."*

---

## Decisions of 2026-10-10 (D-07 … D-17)

**Decided by:** human · **Date:** 2026-10-10 · **Source:** explicit session instruction.

The human labelled several decisions with OQ numbers that do not match this story's analysis
IDs. On being asked, the human confirmed they are applied **by content**. The mapping is
recorded on each decision; the human's own label is kept in brackets.

### D-07 — Account without the Operating Country menu right (test data for TC-52857-007)

A "View Dashboard Only" account is supplied for TC-52857-007 and stored in `.env` as handle
`OPC_USER_NO_MENU`. Credentials are never written anywhere else.

### D-08 — Inactive master data (test data for TC-52857-019 and TC-52857-050)

An inactive Country and an inactive Currency are supplied, stored in `.env` as handles
`OPC_COUNTRY_INACTIVE` and `OPC_CURRENCY_INACTIVE`. Verify they are still inactive before use;
never change their status. *Verified read-only on 2026-10-10: both Inactive — and both Rejected.*

### D-09 — Pagination data may be created (TC-52857-051)

Create enough Operating Country records to test pagination, with unique names containing `AUT`;
never reuse a name; records cannot be deleted; confirm the intended records and the minimum
before creating. *Confirmed in session: 4 records, created as Maker → Pending / Inactive.*

### D-10 — TC-52857-052 is invalid and is deleted from the CSV

Verbatim: *"This test case is invalid. Remove it from the authoritative CSV and regenerate
Markdown from CSV."* Asked whether to mark it `Rejected` (the method rule,
`docs/product-decisions.md` §6.1) or delete the row, the human chose **delete the row**.
**This overrides §6.1 for this one case.** The ID `TC-52857-052` is retired and never reused.
It was never published, executed or automated.

### D-11 — Message for an inactive selected Country [human label: OQ-06]

Verbatim: *"For an inactive selected country, the expected error message is: 'The selected
country is not active.'"* Closes the inactive-country part of analysis **OQ-06**. The messages
for an inactive **Currency** and an unmapped Country/Currency pair are **not** decided.

### D-12 — Message for a duplicate Operating Country name [human label: OQ-07]

Verbatim: *"For a duplicate Operating Country name, the expected error message is: 'Operating
Country Already Exists.'"* Closes analysis **OQ-07**.

### D-13 — No standalone API test cases for US-52857 [human label: OQ-09]

Verbatim: *"Standalone API testing is not required for US-52857."* Answers analysis **OQ-12**
for this story.

### D-14 — Audit History is out of scope for US-52857 [human label: OQ-11]

Verbatim: *"Audit History verification is outside the scope of US-52857."* Closes analysis
**OQ-09**. No Audit History case is written.

### D-15 — API testing is in scope for the Operating Country module generally [human label: OQ-12]

Verbatim: *"API testing is in scope for the Operating Country module generally. Keep this distinct
from the decision that standalone API test cases are not required for this User Story."* Together
with D-13, closes analysis **OQ-12**: no API cases under US-52857; API testing of the module is
not excluded elsewhere.

### D-16 — Test data may be created on STG [human label: OQ-13]

Verbatim: *"You may create the required test data on the allowed STG environment, subject to the
existing safety controls."* Closes analysis **OQ-14** (who may create permanent records), with D-17.

### D-17 — Names created by automation contain AUT and are unique [human label: OQ-14]

Verbatim: *"Names created by automation must contain AUT and must be unique. Never reuse an
existing name."* Closes the naming part of analysis **OQ-14**.

Not answered by any decision, and still open: analysis **OQ-06** (inactive-currency and
unmapped-pair messages), **OQ-08** (hierarchy ACs), **OQ-10** (dialog contents), **OQ-11**
(View All Branches), **OQ-13** (`ApprovalStatus = 3`).

## Decisions of 2026-10-10 from the RUN-001 Bug Candidate review (D-18, D-19)

**Decided by:** human · **Date:** 2026-10-10 · **Source:** explicit session instruction, given
after reviewing the Bug Candidates of manual execution run RUN-001.

Verbatim: *"I reviewed BUG-001 and BUG-002 from the US-52857 manual execution, and I confirm that
neither is a product bug. The observed behaviors are correct."*

Both decisions apply D-01 to behaviour first observed in RUN-001. Each records only what RUN-001
observed; nothing beyond it is decided.

### D-18 — Activate asks for a confirmation (resolves RUN-001 BUG-001)

Clicking **Activate** on an *Approved / Inactive* Operating Country opens a confirmation dialog —
*"Activate &lt;name&gt;?"*, *"The record becomes active immediately. You can deactivate it again
later."*, with **Cancel** and **Activate Operating country** — and the record becomes Active only
when it is confirmed. This is **correct**. It overrides the specification's *"activation needs
none"* (REQ-OPC-030 AC-10, story Lifecycle AC-5). Observed for `OPERATING_COUNTRIES_APPROVER`
(TC-52857-039) and `OPERATING_COUNTRIES_MAKER` (TC-52857-040).

### D-19 — A Rejected record's Edit form offers Reject to an all-permission user (resolves RUN-001 BUG-002)

For `ADMIN_ALL`, the Edit form of a *Rejected* Operating Country offers **Cancel**, **Approve** and
**Reject**. This is **correct**. It overrides the *Rejected* column of the specification's action
matrix, *"Approve / Cancel"* (REQ-OPC-046 AC-2), for the all-permission user. Not decided: what
Reject does when used on an already *Rejected* record — RUN-001 did not click it.
