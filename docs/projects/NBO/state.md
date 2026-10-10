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
| Requirement analysis — US 52857 | First analysis using **all three sources** — story + BRS, OpenAPI (Swagger v1), STG UI explored as `ADMIN_ALL`, Maker and Approver (2026-10-09). 17 decisions (D-01…D-17, 2026-10-09/10); **no blocking open question** |
| Test Cases — US 53717 | 52 cases, AI self-reviewed, **human-approved and published** |
| Test Cases — US 52860 | 35 cases, AI self-reviewed, **human-approved and published** |
| Test Cases — US 52857 | 51 cases (TC-52857-052 deleted, D-10), AI self-reviewed; **all 51 `Approved` in the CSV by the human** (2026-10-10). Need Automation in the CSV: 51 Yes. UI only. Not published |
| CSV migration — all NBO stories | `test-cases.csv` created for US 53717 (52), US 52860 (35), US 52857 (52) on 2026-10-10 — lossless; the CSV is now the source of truth (`docs/product-decisions.md` §6.4). **Review and edit the CSV**, not the Markdown |
| Publishing — US 53717 | Azure DevOps **55294–55345**, verified |
| Publishing — US 52860 | Azure DevOps **55648–55683**, verified |
| Execution — RUN-001 | TC-53717-006 executed against STG, **PASS** (2026-08-16) |
| Execution — RUN-002 | TC-53717-002 executed, found a real defect |
| Bug 55482 | Created under US 53717 from RUN-002 |
| Execution — US 52857 RUN-001 | All 51 approved cases executed manually against STG (2026-10-10): **49 PASS, 2 FAIL, 0 BLOCKED, 0 SKIPPED**, run COMPLETED. FAIL: TC-52857-039 → BUG-001, TC-52857-037 → BUG-002. Both Bug Candidates **resolved by the human as NOT A BUG** (2026-10-10, D-18, D-19); the run's results stay as executed. `manual-report.html` in the run directory — the first real manual report, with its Bug Report section |
| Test Case correction — US 52857 | TC-52857-039 step 6 now expects Activate to ask for a confirmation (D-18); TC-52857-037 step 3 now expects Cancel, Approve and Reject on a Rejected record's all-permission Edit form (D-19). CSV first, Markdown re-rendered; both still `Approved` |
| Bug 56329 | Created under US 56109 as a **workflow test** of the disjoint field mapping |
| Automation — Company › Operating Country (US 52857) | Plan **approved** 2026-10-10 (`automation/Company/Operating-Country/automation-plan.md`); **specs for all 51 cases**. **20 have passed once on STG** (001–010, 014, 015, 022–024, 026–028, 043, 044). RUN-008 (first full run) is **not a valid baseline**: it abandoned every session, hit STG's 15-session cap, and was stopped at case 28 — TC-52857-029…051 never executed though the report counts them as FAIL. Its five non-login failures (005, 023, 024, 026, 028) were all **automation defects**, fixed and passing in RUN-015. Session cleanup now ends every session through the **logout API** (`allSessions: false`, own token), verified on STG with a 401 on the old token (RUN-014/015). **31 cases still unverified** (011–013, 016–021, 025, 029–042, 045–051): a full run awaits the human's approval |

87 Test Cases created across two stories, 0 failures, 0 duplicates.

## Next

Execute the remaining approved **Admin Panel** cases. `ADMIN_LOCKOUT` and
`ADMIN_DISABLED` are **not yet configured** in `.env`, so cases needing them are
`BLOCKED` / `TEST_DATA_ISSUE` until they are.

Only Admin Panel cases are in scope for manual execution (human decision,
2026-08-13). The Agent Portal cases are published but not queued.

## Open items

- **TC-53717-024 diverges from Azure DevOps** (found 2026-10-10 by a read-only
  `testcases:publish -- 53717 --verify`): work item **55317** has **6** steps; the
  local case has **5** — and so did the committed Markdown before the CSV migration,
  so the divergence predates it. Azure DevOps is the record (`docs/product-decisions.md`
  §13); which side is right is a human decision. Nothing was changed on either side.
- **Published descriptions may carry mangled bold** (found 2026-10-10). The legacy
  Markdown reader turned `**D-04**, D-01` into `D-04**, D-01` in Test Type,
  Requirement Reference and Decisions Applied, and those fields go into the Azure
  DevOps description of each published Test Case of US 53717 and US 52860. Fixed in
  the reader; the published items were not touched. Correcting them is a human
  decision.

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
- **US 52857 automation — next:** the full 51-case run, only with the human's approval. Expected
  outcome per the manual run and the fixed defects: all 51 pass; any failure is investigated as an
  automation defect first.
- **US 52857 — no blocking questions.** D-07…D-17 (2026-10-10) closed OQ-07, OQ-09,
  OQ-12, OQ-14 and part of OQ-06. Open, non-blocking: OQ-06 (inactive-currency and
  unmapped-pair messages), OQ-08, OQ-10, OQ-11, OQ-13. Every created name contains
  `AUT` and is unique (D-17).
- **Neither Test Case artifact has Need Automation values yet** (automation
  Phase 1, `docs/product-decisions.md` §6.3). Both US 53717 (52 cases) and
  US 52860 (35 cases) predate the field, so every case parses as *undecided*.
  `npm run testcases:check -- 53717 --project NBO` reports all 52 as missing.
  Run `/write-test-cases` on each story to add recommendations for human review.
  Nothing else in either artifact changes.
- **Playwright automation is ready but has nothing to automate** (automation
  Phase 2, `docs/product-decisions.md` §7.1, 2026-10-09).
  `npm run automation:scope -- 53717 --project NBO` puts **0 of 52** cases in
  scope — all undecided. Before `/automate-test-cases` can produce anything:
  1. Need Automation values on the cases, human-reviewed (item above).
  2. In `.env` (updated 2026-10-09, names only): `APP_ENV=STG`,
     `APP_STG_ADMIN_URL` and the US 52857 handles (`ADMIN_ALL`,
     `OPERATING_COUNTRIES_MAKER`, `OPERATING_COUNTRIES_APPROVER`,
     `OPERATING_COUNTRIES_VIEW_ONLY`) are set;
     **every US 53717 / US 52860 handle value is still absent**. Account handles use `<HANDLE>_USERNAME` /
     `<HANDLE>_PASSWORD`, e.g. `ADMIN_VALID` reads `ADMIN_VALID_USERNAME` and
     `ADMIN_VALID_PASSWORD`.
  3. Agent Portal cases cannot be automated until an Agent Portal URL is
     configured: the profile names one base URL, the Admin Panel's.
  The artifact-safety check passes (`npm run automation:verify-artifacts`).
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
