# Project Profile — NBO

**This file is project knowledge, not methodology.** It records what the agent
needs to know about *this* project. How the agent works — the invariants, the
approval gates, the PROD block, the evidence rules, the execution statuses and
the failure classification — lives in `CLAUDE.md` and `docs/product-decisions.md`
and is **shared by every project**. Nothing in this file may weaken a rule
defined there.

Anything not stated here is not configured. A skill that needs a value which is
absent must **stop and say so**, never assume one.

---

## Settings

| Setting | Value |
|---|---|
| Project Key | NBO |
| Project Name | NBO |
| Tracker | Azure DevOps |
| Tracker Project | Set by `ADO_PROJECT` in `.env` |
| Supported Work Item Type | User Story |
| Title Project Token | NBO |
| Allowed Environments | STG |
| Environment Label Variable | APP_ENV |
| Automation Base URL Variable | APP_{ENV}_ADMIN_URL |
| Artifact Root | docs/projects/NBO |

The tracker project name is deliberately **not** duplicated here: it lives in
`.env` as `ADO_PROJECT`, and `src/ado/config.ts` is the only module that reads it
(invariant 7). Recording it in two places is how the two drift apart.

## Environments

**STG is the only allowed environment for this project.** UAT and PROD are not
configured. PROD is blocked by the shared methodology and **cannot be enabled by
editing this file** — see `docs/product-decisions.md` §12 and invariant 5.

| Environment | Status | URL variable |
|---|---|---|
| STG (Admin Panel) | Allowed | `APP_STG_ADMIN_URL` |
| STG (Agent Portal) | Not configured | — |
| UAT | Not configured | — |
| PROD | **Blocked** | — |

**The environment is STG by human decision, never by inference from the
hostname.** This project's STG Admin Panel host contains `-dev-`; the human
confirmed on 2026-08-16 that this host **is** the intended STG target and that
the `-dev-` in the name is naming only. `APP_ENV=STG` in `.env` is what the
allow-list checks; the hostname carries no authority in either direction. Full
record: `docs/projects/NBO/decisions.md` §12.1.

Every execution artifact records the environment label **and** the target host
verbatim, because they can legitimately disagree.

## Modules in scope

| Module | Feature / Page | Story |
|---|---|---|
| Authentication | Login - Admin Panel | shared - login used by every module |
| Authentication | Login - Agent Portal | **Not currently in scope** — no story covers it and no Agent Portal URL is configured |
| Company | Operating Country List, Add Operating Country, Edit Operating Country, Operating Country Approval, Operating Country Status, Operating Country Access (all under `/admin/company/operating-country`) | US 52857 |

### Module hierarchy for automation

**Operating Country is a module under Company** (human decision, 2026-10-10). The Test Cases keep
`Company` as their Module field — the CSV is not changed — and every case whose Feature/Page
contains `Operating Country` is planned and coded under `Company/Operating-Country/`
(read by `automation:scope` and the automation report).

| Module | Sub-Module | Feature/Page Contains |
|---|---|---|
| Company | Operating Country | Operating Country |

## Title convention

```
[NBO][<Module>][<Feature/Page>] <Test Scenario>
```

The shape is defined by the shared methodology (`docs/product-decisions.md` §3);
only the `NBO` token is project-specific. Project, Module and Feature/Page are
stored as structured fields and the title is generated from them — the parser
rejects a title that disagrees with its fields.

## Test data handles

Test Cases reference test data by **handle**, never by value. A handle resolves
from `.env` at execution time, into memory only. **A missing handle is
`BLOCKED` / `TEST_DATA_ISSUE`, never a FAIL** — missing test data is not a
product failure.

Credentials never appear in this file, in a test case, in an execution artifact,
or in a bug (invariant 7). Only handle **names** are listed.

### Authentication

The Authentication module is shared: every automated spec logs in through
`automation/NBO/Authentication/pages/LoginPage.ts`, and
`automation/NBO/Authentication/support/session-api.ts` implements the logout API
used by the session-cleanup fixture.

Its former login-scenario handles were declared for US 53717, whose artifacts
have been removed from the repository. **None of them is referenced by any
automation file or by `test-cases/US-52857/test-cases.csv`**, so none is listed
here. A future login story declares the handles it needs.

### Company / Operating Country (US 52857)

| Handle | Purpose | Configured in STG |
|---|---|---|
| `ADMIN_ALL` | Admin Panel account with all permissions | **Yes** (2026-10-09) |
| `OPERATING_COUNTRIES_MAKER` | Operating Countries View & Edit — Maker | **Yes** (2026-10-09) |
| `OPERATING_COUNTRIES_APPROVER` | Operating Countries View & Edit — Approver | **Yes** (2026-10-09) |
| `OPERATING_COUNTRIES_VIEW_ONLY` | Operating Countries View only | **Yes** (2026-10-09; username corrected by the human the same day) |
| `OPC_USER_NO_MENU` | Admin Panel account **without** the Operating Country menu right ("View Dashboard Only") | **Yes** (2026-10-10, D-07) — login not yet exercised |
| `OPC_USER_OTHER_SITE` | Account with Operating Country rights on a **different administrative site** | **No — not configured.** No case uses it since TC-52857-052 was deleted (D-10) |
| `OPC_COUNTRY_INACTIVE` | Name of an **inactive** Country in the Country master (single value) | **Yes** (2026-10-10, D-08) — verified Inactive (and Rejected) that day; never change its status |
| `OPC_CURRENCY_INACTIVE` | Name of an **inactive** Currency in the Currency master (single value) | **Yes** (2026-10-10, D-08) — verified Inactive (and Rejected) that day; never change its status |

Every US 52857 write case **permanently** consumes an Operating Country name (names are never
released and records cannot be deleted — REQ-OPC-010 AC-6, REQ-OPC-030 AC-11). Cases generate
unique letters-only names at run time, and **every name created by automation or test data
contains `AUT`** and is checked unused first (US 52857 D-17). Pagination seed data: four
*Pending / Inactive* records `AUT Pagination Alpha … Delta` (created 2026-10-10, D-09).

**Handles that consume state** — lockout accounts and single-use data — are
destructive. Confirm with the human before executing cases that burn them, and
never reuse such an account across cases in one run without saying so.

## Automation

Playwright automation is shared methodology (`docs/product-decisions.md` §7.1);
this section records only what is NBO-specific. Nothing here may weaken a rule
defined there.

| | |
|---|---|
| Automated application | **Admin Panel (STG) only.** The base URL is `APP_{ENV}_ADMIN_URL`, so `APP_ENV=STG` reads `APP_STG_ADMIN_URL`. The Agent Portal has no configured URL, so Agent Portal cases are `NOT AUTOMATED — ENVIRONMENT_UNAVAILABLE` until one is |
| Code | `automation/NBO/<Module>/` — Page Objects in `pages/`, one spec per Test Case in `tests/` |
| Plans | `docs/projects/NBO/automation/<Module>/automation-plan.md` |
| Login | Username + password, no MFA, SSO or CAPTCHA on STG (`decisions.md` → *Login flow*). Route `/auth/staff-login`; a logged-out deep link is redirected there. Fields `User Name (required)` / `Password (required)`, button `Login`. The page also has an **API** backend toggle (`Development` / `Testing` / `Local`, default `Development`) — automation leaves it at its default (explored 2026-10-10) |
| Logout | **Logout API** (human instruction 2026-10-10): `POST <backend>/api/v1/Auth/logout?api-version=1`, headers `accept: application/json`, `Language: En`, `Content-Type: application/json`, `Authorization: Bearer <that session's token>`, body `{"allSessions": false}`. The backend is the Development backend the login page's API toggle selects by default; automation takes its origin from the app's own requests. Sessions live server-side in **Redis**, capped at **15 per account** on STG; clearing cookies or storage does not end one (abandoned sessions blocked every `ADMIN_ALL` login on 2026-10-10 — the Login specification's "an Admin Panel login invalidates the prior session", US 53717 REQ-LOG-016 AC-2, did not hold). Verified: logout answers HTTP 200 and the old token is then rejected with HTTP 401. The UI also offers Account menu → Log out → confirmation |
| Handle values | By the shared convention: an account handle reads `<HANDLE>_USERNAME` and `<HANDLE>_PASSWORD`; a single-value handle such as an agency code reads `<HANDLE>`. Values live in `.env` only |

**Automation state:** US 52857 has all 51 cases in scope (Need Automation `Yes`,
`Approved`); its plan is `docs/projects/NBO/automation/Company/Operating-Country/automation-plan.md`
(approved 2026-10-10; code for all 51 cases in `automation/NBO/Company/Operating-Country/`).
All 51 passed on STG in RUN-040 (commit 75ec5dd), after six automation defects were fixed.
`.env` holds `APP_ENV=STG`, the Admin Panel URL and every US 52857 handle. No other
story has automation in this repository. See `state.md`.

## Terminology

| Term | Meaning in this project |
|---|---|
| Admin Panel | The internal administration web application |
| Agent Portal | The agent-facing web application |
| Maker / Approver | The two-person authority model: a Maker submits a record for approval, an Approver approves or rejects it. Used by the Operating Country workflows (`OPERATING_COUNTRIES_MAKER` / `OPERATING_COUNTRIES_APPROVER`) |

## Artifacts

```
docs/projects/NBO/profile.md                    this file
docs/projects/NBO/decisions.md                  NBO-specific decisions
docs/projects/NBO/state.md                      current engagement state
docs/projects/NBO/requirements/US-<id>/         analysis, decisions, source snapshot
docs/projects/NBO/test-cases/US-<id>/           the Test Case set
docs/projects/NBO/executions/US-<id>/RUN-<nnn>/ execution runs, evidence, bug candidates
```
