# NBO — Engagement State

Where the NBO work actually stands. This is **project state**, not methodology:
it changes as the engagement progresses and says nothing about how the agent
works.

Nothing enters this file until it has actually been run.

---

## Delivered

| Item | Status |
|---|---|
| Requirement analysis — US 52857 | First analysis using **all three sources** — story + BRS, OpenAPI (Swagger v1), STG UI explored as `ADMIN_ALL`, Maker and Approver (2026-10-09). 17 decisions (D-01…D-17, 2026-10-09/10); **no blocking open question** |
| Test Cases — US 52857 | 51 cases (TC-52857-052 deleted, D-10), AI self-reviewed; **all 51 `Approved` in the CSV by the human** (2026-10-10). Need Automation in the CSV: 51 Yes. UI only. Not published |
| Execution — US 52857 RUN-001 | All 51 approved cases executed manually against STG (2026-10-10): **49 PASS, 2 FAIL, 0 BLOCKED, 0 SKIPPED**, run COMPLETED. FAIL: TC-52857-039 → BUG-001, TC-52857-037 → BUG-002. Both Bug Candidates **resolved by the human as NOT A BUG** (2026-10-10, D-18, D-19); the run's results stay as executed. `manual-report.html` in the run directory — the first real manual report, with its Bug Report section |
| Test Case correction — US 52857 | TC-52857-039 step 6 now expects Activate to ask for a confirmation (D-18); TC-52857-037 step 3 now expects Cancel, Approve and Reject on a Rejected record's all-permission Edit form (D-19). CSV first, Markdown re-rendered; both still `Approved` |
| Bug 56329 | Created under US 56109 as a **workflow test** of the disjoint field mapping |
| Automation — Company › Operating Country (US 52857) | Plan **approved** 2026-10-10 (`automation/Company/Operating-Country/automation-plan.md`); **specs for all 51 cases**. **All 51 passed on STG in RUN-040** (commit 75ec5dd), after six automation defects were found and fixed. Session cleanup ends every session through the **logout API** (`allSessions: false`, own token), verified on STG with a 401 on the old token |

## Previously delivered — artifacts removed from the repo

Two stories were taken out of this project's scope. Their `requirements/` and
`test-cases/` artifacts were **deliberately removed from the repository** and are
not to be restored. Their Test Cases remain **live work items in Azure DevOps**,
so the record of what was published survives here:

| Story | Test Cases | Azure DevOps | Status |
|---|---|---|---|
| US 53717 | 52 | **55294–55345** | published and verified |
| US 52860 | 35 | **55648–55683** | published and verified |

**Bug 55482** was created under US 53717.

87 Test Cases created across the two stories, 0 failures, 0 duplicates.

## Next

Re-execute **TC-52857-037** and **TC-52857-039** against their corrected
expectations (D-18, D-19) — RUN-001's FAILs stand until a new run proves them.

Only Admin Panel cases are in scope for manual execution (human decision,
2026-08-13). The Agent Portal has no configured URL.

## Open items

- **US 52857 RUN-001 Bug Candidates resolved — NOT A BUG** (human, 2026-10-10): **BUG-001**
  (Activate asks for a confirmation, D-18) and **BUG-002** (a Rejected record's Edit form offers
  Reject, D-19) are invalid bug reports. Neither is ever published; both files keep their
  original content under a Resolution section. **TC-52857-037 and TC-52857-039 have not yet
  been executed against their corrected expectations** — RUN-001's FAILs stand as executed; a
  new run is needed to prove the corrections.
- **US 52857 CSV: 32 Precondition cells read `#NAME?`** (a spreadsheet turned lines starting
  `- ` into formulas). The CSV was not modified; the original preconditions need restoring
  by the human. Listed in RUN-001's run observations.
- **US 52857 RUN-001 observations, not decisions:** an Egypt / Kuwaiti Dinar pair is
  accepted (no unmapped-pair message, TC-52857-020); an inactive currency is refused with
  *"The selected currency is not active."* (TC-52857-019 step 3) — both feed OQ-06. In
  TC-52857-024 a first Maker remarks update reported success but did not persist; the retry
  did — cause unknown, not reproduced.
- **STG records left by US 52857 RUN-001** (2026-10-10, never deleted; no cleanup was
  requested): 15 Approved / Active (`AUT Opc …` ids 20026–20029, 20031–20038, 20044, 20049,
  20050), 10 Pending / Inactive (20039–20043, 20046–20048, 20051, 20053), 3 Rejected
  (20030, 20045, 20052). Full list in RUN-001's `execution-results.md`.
- TC-52857-011 and -028 were flagged for review as specification-only; both **passed** in
  RUN-001.
- **STG test data created for US 52857 (2026-10-10, D-09):** four Operating Countries,
  *Pending for Approval / Inactive*, Egypt / Egyptian Pound, created as
  `OPERATING_COUNTRIES_MAKER` — `AUT Pagination Alpha` (20022), `Bravo` (20023),
  `Charlie` (20024), `Delta` (20025). Permanent; never shown in selection lists. STG now
  holds 11 Operating Countries.
- **STG sessions left open by the agent, 2026-10-10:** up to 3 `ADMIN_ALL` sessions from the UI-logout
  attempts (RUN-009…011) — the human has since cleared Redis. Since RUN-014 every session is ended
  through the logout API and confirmed (401).
- **RUN-008's three Draft Bug Candidates are automation defects, not product bugs** (evidence in the
  Automation Plan): BUG-001 (TC-52857-005), BUG-002 (TC-52857-026), BUG-003 (TC-52857-028). They are
  left as Drafts for the human to resolve (`Not a Bug`); the agent does not resolve them.
- **US 52857 automation — the full 51-case run is done:** RUN-040 executed all 51 specs on
  STG and **all 51 passed** (commit 75ec5dd), after six automation defects were found and
  fixed. Any future failure is investigated as an automation defect first.
- **US 52857 — no blocking questions.** D-07…D-17 (2026-10-10) closed OQ-07, OQ-09,
  OQ-12, OQ-14 and part of OQ-06. Open, non-blocking: OQ-06 (inactive-currency and
  unmapped-pair messages), OQ-08, OQ-10, OQ-11, OQ-13. Every created name contains
  `AUT` and is unique (D-17).

- **Bug 56329 is a test artifact in a real Azure DevOps project** (US 56109,
  created 2026-08-23 to validate the disjoint field mapping). Whether to close,
  delete, or keep it is undecided. It also links a Test Case that belongs to a
  different story — accepted for the test, but wrong for a real Bug.
- **Bug 55482 still carries the pre-§5.4 layout** (whole candidate in Repro
  Steps). Azure DevOps is the record for it, so whether to remap it is a human
  call.

**Settled 2026-08-13:** the allowed *Review/Lifecycle Status* values and the
rejected-item rule, defined with the first test case artifact and recorded in
`docs/product-decisions.md` §6.1.
