# NBO — Engagement State

Where the NBO work actually stands. This is **project state**, not methodology:
it changes as the engagement progresses and says nothing about how the agent
works.

Nothing enters this file until it has actually been run.

---

## Delivered

| Item | Status |
|---|---|
| Requirement analysis — US 53717 | 12 decisions, artifact produced |
| Requirement analysis — US 52860 | 5 decisions, requirement + Change Request read together |
| Test Cases — US 53717 | 52 cases, AI self-reviewed, **human-approved and published** |
| Test Cases — US 52860 | 35 cases, AI self-reviewed, **human-approved and published** |
| Publishing — US 53717 | Azure DevOps **55294–55345**, verified |
| Publishing — US 52860 | Azure DevOps **55648–55683**, verified |
| Execution — RUN-001 | TC-53717-006 executed against STG, **PASS** (2026-08-16) |
| Execution — RUN-002 | TC-53717-002 executed, found a real defect |
| Bug 55482 | Created under US 53717 from RUN-002 |
| Bug 56329 | Created under US 56109 as a **workflow test** of the disjoint field mapping |

87 Test Cases created across two stories, 0 failures, 0 duplicates.

## Next

Execute the remaining approved **Admin Panel** cases. `ADMIN_LOCKOUT` and
`ADMIN_DISABLED` are **not yet configured** in `.env`, so cases needing them are
`BLOCKED` / `TEST_DATA_ISSUE` until they are.

Only Admin Panel cases are in scope for manual execution (human decision,
2026-08-13). The Agent Portal cases are published but not queued.

## Open items

- **US 53717: no blocking questions remain.** Twelve decisions (D-01…D-12)
  closed them; 17 non-blocking questions stay recorded in
  `requirements/US-53717/requirement-analysis.md` §12. Two are **deliberately
  undecided** — whether pre-authentication validation failures move the lockout
  counter (OQ-26) and the disabled-plus-expired precedence (OQ-27). Cover those
  scenarios and report observed behaviour; **never assert an expectation for
  them**, and do not resolve any remaining question by inference.
- **Login test scope is UI only** (D-09), even though the requirement scope is
  UI + API (D-01).
- **US 53717's parent (53119) is unread** — the reader accepts `User Story`
  only, and the parent is another type.
- **TC-53717-051 and TC-53717-052 are observation-only** and stay that way. They
  exist to produce the evidence that would close OQ-26 and OQ-27. Approval does
  **not** convert them into assertions — that needs a human decision on the
  questions themselves.
- **Server-side validation re-enforcement (REQ-LOG-018 AC-2) has no coverage** in
  the UI-only scope. Recorded as a known gap in the test case artifact, not
  dropped.
- **No `Remember Me` control was visible on the Admin Panel login form** during
  RUN-001, though TC-53717-002 expects one. **Unverified** — this is an
  observation, not a result and not a bug. Execute that case before drawing any
  conclusion.
- **US 52860 is not yet executed** — none of its 12 test-data prerequisites is
  confirmed in STG, and the City screen's location is unknown (OQ-12).
- **US 52860 has four open questions that block coverage, not publication.**
  **OQ-06** (the Change Request's button matrix has no *Update / authority=Yes /
  Inactive* row) and **OQ-07** ("Inactive" means Pending, Rejected, *or*
  Approved-but-deactivated) are the source's own High-severity warnings. By human
  decision **D-05** they produce **no test case at all** — not even
  observation-only — and no invented Expected Result. **OQ-02** (is the
  deliverable UI, API, or both?) leaves `REQ-CIT-015` and `REQ-CIT-017` — the
  Change Request's back-end enforcement requirements — **uncoverable by the
  UI-only scope**. **OQ-01**: the CR names a `City-Change-Request.md` full-detail
  document that was never attached, so only its summary was available.
- **US 52860 has 10 open Bugs under the same story** that describe behaviour its
  new test cases assert (54370, 54589, 54591, 54604, 55040, 55043, 55054, 55056
  among them). Several cases are therefore **expected to FAIL on first
  execution** — that is the test working, not a defect in the test. Bug 54591
  (City Code `ALEX` treated as equal to `AL I`) points at a real case/space
  comparison defect touching **WARN-002**, which no source defines and which
  decision D-03 deliberately did **not** settle — D-03 fixed uniqueness *scope*,
  not its *case rule*.
- **Bug 56329 is a test artifact in a real Azure DevOps project** (US 56109,
  created 2026-08-23 to validate the disjoint field mapping). Whether to close,
  delete, or keep it is undecided. It also links Test Case **55295**, which
  belongs to US 53717 rather than 56109 — accepted for the test, but wrong for a
  real Bug.
- **Bug 55482 still carries the pre-§5.4 layout** (whole candidate in Repro
  Steps). Azure DevOps is the record for it, so whether to remap it is a human
  call.

**Settled 2026-08-13:** the allowed *Review/Lifecycle Status* values and the
rejected-item rule, defined with the first test case artifact and recorded in
`docs/product-decisions.md` §6.1.
