# Execution Results — US 53717 — RUN-001 (Canary)

## Provenance

| | |
|---|---|
| User Story | 53717 |
| Run ID | RUN-001 |
| Run type | **Canary** — validates the manual web execution flow before any reusable skill is built |
| Executed | 2026-08-16 |
| Executed by | AI agent (manual step-by-step execution via Playwright MCP), human-approved plan |
| Environment | **STG** (see *Environment decision* below) |
| Target URL | `https://ndc-apis-nbo-frontend-dev-epf8graxc0cudjd9.northeurope-01.azurewebsites.net/login` |
| Application | NDC Back Office — Admin Panel |
| Test Case source | `docs/test-cases/US-53717/test-cases.md` (unmodified) |
| Azure DevOps writes | **None.** No Test Run, no Test Result, no Bug. |
| Scope | 1 of 52 cases — `TC-53717-006` only |

### Environment decision (human, 2026-08-16)

The target hostname contains **`-dev-`**, but this environment is the one the team
uses as **STG** for this project. The human confirmed this explicitly and directed
that it be recorded so the artifact is unambiguous about it.

`APP_ENV=STG` in `.env`; the host string is retained verbatim above so no future
reader mistakes which machine produced these results. This satisfies the
allow-list invariant (CLAUDE.md invariant 5) by human decision, **not** by
inference from the hostname. No PROD action was taken at any point.

### Test data

Referenced by handle only. No credential value appears in this artifact or in any
evidence file (CLAUDE.md invariant 7).

| Handle | Role in this run |
|---|---|
| `ADMIN_VALID` | Active, authorized Admin Panel account, OTP disabled for its user type |

---

## Summary

| Result | Count |
|---|---|
| **PASS** | **1** |
| FAIL | 0 |
| BLOCKED | 0 |
| SKIPPED | 0 |
| **Executed** | **1** |

**Bug Candidates raised: 0.** No failure occurred, so no bug candidate exists and
nothing is pending human bug review.

---

## TC-53717-006 — Admin Panel login succeeds with valid credentials when OTP is disabled

| | |
|---|---|
| Test Case ID | `TC-53717-006` |
| Azure DevOps ID | 55299 |
| Title | `[NBO][Authentication][Login - Admin Panel] Verify login completes and the dashboard is displayed when a valid Username and Password are submitted and OTP is disabled` |
| Requirement Reference | REQ-LOG-002 AC-2, REQ-LOG-004, REQ-LOG-006, REQ-LOG-012 AC-3, REQ-LOG-016 AC-2 |
| Test Type | Positive · Functional |
| **Execution Status** | **PASS** |
| Failure classification | N/A |

### Precondition verification

The case requires `ADMIN_VALID` to be active, authorized, non-expired, unlocked,
and OTP-disabled. These are **not independently verifiable without performing the
login itself**, so they were not pre-checked. The run was defined in advance such
that a failure tracing to any of these conditions would be recorded as **BLOCKED /
`TEST_DATA_ISSUE`**, not FAIL and not a product bug.

The login completed with no OTP challenge and no account-state error, which is
consistent with every precondition holding. Recorded as an observation, not as an
assertion the case makes.

### Step results

| # | Step | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| 1 | Open the Admin Panel login form | The form is displayed | Login form displayed at `/login`, page title `NDC Back Office`. Present: `Email / User name *` (required), `Password *` (required) with a View Password toggle, `Forgot password?` link, `Login` button | PASS |
| 2 | Enter `ADMIN_VALID`'s Username and Password | The values are accepted with no validation feedback | Both values accepted into their fields. No inline validation message, no error state, no field highlighted. Password rendered masked (`••••••••`) | PASS |
| 3 | Submit the form | Login completes. **No OTP step is presented** | Login submitted. Authentication succeeded and the app navigated away from `/login`. **No OTP step, challenge, or code entry was presented at any point** | PASS |
| 4 | Observe the resulting page | The user is authenticated and the Admin Panel dashboard / landing page is displayed. The specific route is not asserted (OQ-18) | Authenticated Admin Panel landing page displayed. Header shows the account menu bound to the signed-in admin account; page renders the `Branch` module with working search filters, `Add Branch`, a populated data table (BRN1162, BRN1153, BRN1152, …) and pagination | PASS |

### Expected vs Actual — overall

| | |
|---|---|
| **Expected** | Valid credentials with OTP disabled authenticate the user, no OTP step appears, and an authenticated Admin Panel landing page is displayed |
| **Actual** | Exactly that. Authentication succeeded, no OTP step appeared, and a fully rendered authenticated Admin Panel landing page with live data was displayed |

### Route observation (not an assertion)

The post-login route was `/admin/branch`. **OQ-18 leaves the specific landing
route undecided**, so this is recorded as observed behaviour only and is *not*
part of the pass criteria. It does not resolve OQ-18 — that needs a human
decision, not an observation from one run.

### Evidence

Stored in `evidence/` beside this file. **`evidence/` is gitignored**, so these
files are local-only and not committed.

| File | Shows |
|---|---|
| `evidence/tc-006-step2-presubmit.png` | Step 2 — both fields populated, password masked, no validation feedback |
| `evidence/tc-006-step4-landing.png` | Step 4 — authenticated Admin Panel landing page with live Branch data |

Console errors during the run: **0**.

---

## Observations recorded, not acted on

These were noticed while executing this case. They belong to **other** test cases
and were deliberately **not** treated as results, failures, or bug candidates in
this run. Recording them so they are not lost.

1. **No `Remember Me` control on the Admin Panel login form.** `TC-53717-002`
   expects the form to present Username, Password, **Remember Me**, and the View
   Password toggle. The rendered form showed no Remember Me element. This run did
   **not** execute TC-53717-002 and makes **no** claim about its result — it must
   be executed on its own before any conclusion is drawn.

2. **The accessibility tree exposes the password value in plain text.** The
   Playwright accessibility snapshot returned the typed password as readable text,
   even though the UI masks it. Consequence for this workflow: **accessibility
   snapshots must never be persisted as evidence** — rendered screenshots, where
   the field is masked, are the safe artifact. Applied in this run; no snapshot
   containing a credential was written to disk by this artifact.

---

## What this canary validated

- Manual step-by-step execution against STG via Playwright MCP works end to end.
- Step-level Expected vs Actual capture is workable at this granularity.
- Screenshot evidence is safe; accessibility snapshots are not.
- Post-submit navigation needs an explicit settle wait — the page was still on
  `/login` immediately after the click and completed navigation shortly after.
  A result read too early would have produced a **false FAIL**. Any future
  reusable execution skill must wait for the app to settle before judging.

## Open follow-ups for the human

- Whether execution evidence should stay gitignored (current behaviour) or be
  committed for traceability. Left as-is; changing it is a human decision.
- Remaining approved Admin Panel cases are not yet executed.
