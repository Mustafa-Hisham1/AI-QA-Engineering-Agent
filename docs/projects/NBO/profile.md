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
| Authentication | Login - Admin Panel | US 53717 |
| Authentication | Login - Agent Portal | US 53717 |
| City | Add City, Edit City, City List, City Details, City Status, City Approval | US 52860 |

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

### Authentication (US 53717)

| Handle | Purpose | Configured in STG |
|---|---|---|
| `ADMIN_VALID` | Valid Admin Panel account | **Yes** |
| `ADMIN_LOCKOUT` | Account for lockout scenarios | **No — not yet configured** |
| `ADMIN_DISABLED` | Disabled account | **No — not yet configured** |
| `ADMIN_LEGACY_EMAIL` | Legacy email-format account | Unconfirmed |
| `ADMIN_UNLOCKER` | Account able to unlock another | Unconfirmed |
| `AGENT_VALID` | Valid Agent Portal account | Unconfirmed |
| `AGENT_LOCKOUT` | Agent lockout account | Unconfirmed |
| `AGENT_DISABLED` | Disabled agent account | Unconfirmed |
| `AGENT_EXPIRED` | Expired agent account | Unconfirmed |
| `AGENT_DISABLED_EXPIRED` | Disabled **and** expired agent account | Unconfirmed |
| `AGENT_OTP` | Agent OTP scenario data | Unconfirmed |
| `AGENCY_CODE_VALID` | Valid agency code | Unconfirmed |
| `AGENCY_CODE_WRONG` | Incorrect agency code | Unconfirmed |
| `CAPTCHA_STATUS` | Whether CAPTCHA is enabled | Unconfirmed |

### City / Geo Master (US 52860)

| Handle | Purpose | Configured in STG |
|---|---|---|
| `CITY_EXISTING` | An existing City record | **No — unconfirmed** |
| `CITY_LIST_10PLUS` | A list with more than ten Cities | **No — unconfirmed** |
| `CITY_USER_MAKER` | User with maker authority | **No — unconfirmed** |
| `CITY_USER_APPROVER` | User with approver authority | **No — unconfirmed** |
| `COUNTRY_A`, `COUNTRY_B` | Countries used as parent data | **No — unconfirmed** |
| `STATE_A1`, `STATE_A2`, `STATE_B1` | States used as parent data | **No — unconfirmed** |
| `STATE_INACTIVE` | An inactive State | **No — unconfirmed** |

**None of US 52860's test-data prerequisites is confirmed in STG.** Cases needing
them are `BLOCKED` / `TEST_DATA_ISSUE` until a human configures them.

**Handles that consume state** — lockout accounts and single-use data — are
destructive. Confirm with the human before executing cases that burn them, and
never reuse such an account across cases in one run without saying so.

## Terminology

| Term | Meaning in this project |
|---|---|
| Admin Panel | The internal administration web application |
| Agent Portal | The agent-facing web application |
| Geo Master | The City / Region / State reference-data module |
| Maker / Approver | The two-person authority model used by City workflows |

## Artifacts

```
docs/projects/NBO/profile.md                    this file
docs/projects/NBO/decisions.md                  NBO-specific decisions
docs/projects/NBO/state.md                      current engagement state
docs/projects/NBO/requirements/US-<id>/         analysis, decisions, source snapshot
docs/projects/NBO/test-cases/US-<id>/           the Test Case set
docs/projects/NBO/executions/US-<id>/RUN-<nnn>/ execution runs, evidence, bug candidates
```
