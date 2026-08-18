# Execution Results — US 53717 — RUN-002

## Provenance

| | |
|---|---|
| User Story | 53717 |
| Run ID | RUN-002 |
| Run type | Single-case execution via the `execute-test-cases` skill |
| Executed | 2026-08-16 |
| Executed by | AI agent (step-by-step execution via Playwright MCP) |
| Environment label | **STG** (from `APP_ENV`; the label decides the environment, never the hostname) |
| Target host | `https://ndc-apis-nbo-frontend-dev-epf8graxc0cudjd9.northeurope-01.azurewebsites.net/login` — hostname contains `-dev-` but **is** the team's STG (`docs/product-decisions.md` §12.1) |
| Application | NDC Back Office — Admin Panel |
| Test Case source | `docs/test-cases/US-53717/test-cases.md` (**unmodified**) |
| Azure DevOps writes | **One Bug created** — #55482, under explicit human authorization on 2026-08-16, *after* this run completed. No Test Run and no Test Result were created; execution itself wrote nothing. |
| Scope | `TC-53717-002` only — 1 case, as instructed |

### Scope resolution

| | Count |
|---|---|
| In scope | 1 |
| Executable (`Approved`/`Published`) | 1 |
| Skipped | 0 |
| Refused (not approved) | 0 |

### Test data

**None required.** TC-53717-002 states *Test Data: None* and runs unauthenticated. No credential
was resolved, entered, or exposed at any point in this run.

---

## Summary

| Result | Count |
|---|---|
| PASS | 0 |
| **FAIL** | **1** |
| BLOCKED | 0 |
| SKIPPED | 0 |
| **Executed** | **1** |

**Bug Candidates raised: 1** — `bug-candidates/BUG-CANDIDATE-001.md`. Reviewed and approved by the
human, then created in Azure DevOps as **Bug [55482](https://dev.azure.com/tilde-technology/b1763c9b-14e8-46ae-9683-8947457e8c81/_workitems/edit/55482)**
on 2026-08-16, parented to US 53717 and related to Test Case 55295.

---

## TC-53717-002 — Admin Panel login form presents the specified fields

| | |
|---|---|
| Test Case ID | `TC-53717-002` |
| Azure DevOps ID | 55295 |
| Title | `[NBO][Authentication][Login - Admin Panel] Verify the login form presents Username, Password, Remember Me and the View Password toggle` |
| Requirement Reference | REQ-LOG-002 AC-2, AC-3 |
| Test Type | Positive · UI |
| **Execution Status** | **FAIL** |
| **Failure classification** | **`PRODUCT_BUG`** |

### Precondition verification

The case requires the Admin Panel STG URL to be reachable and the visitor to be
**unauthenticated**. Both held:

- The URL loaded successfully; the page rendered with **0 console errors and 0 warnings**.
- The browser session was closed before the run and the MCP server runs `--isolated`, so no
  session persisted from RUN-001. The login form was served, confirming the visitor was
  unauthenticated.

### Step results

| # | Step | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| 1 | Open the Admin Panel login URL as an unauthenticated visitor | The login form is displayed | Login form displayed at `/login`, page title `NDC Back Office`, heading "Welcome Back to NDC!" | PASS |
| 2 | Inspect the form fields | A **Username** field and a **Password** field are present. **No Agency Code field is present** | `Email / User name *` (required) and `Password *` (required) both present. **No Agency Code field** — correct, that field belongs to the Agent Portal | PASS |
| 3 | Inspect the form options | A **Remember Me** option is present and is **not** mandatory | **No Remember Me option exists anywhere on the form.** The form contains only: Email/User name, Password, View Password toggle, `Forgot password?` link, `Login` button. The area between Password and Login — where the option would sit — contains only the `Forgot password?` link | **FAIL** |
| 4 | Inspect the Password field | A **View Password** toggle is present on the Password field | View Password toggle present on the Password field as an eye icon, and **confirmed interactive** — clicking it changed the control state | PASS |

### Expected vs Actual — overall

| | |
|---|---|
| **Expected** | The Admin Panel login form presents Username, Password, **a Remember Me option that is not mandatory**, and a View Password toggle (REQ-LOG-002 AC-2, AC-3) |
| **Actual** | The form presents Username, Password and a working View Password toggle, but **the Remember Me option is entirely absent**. 3 of 4 steps passed; step 3 failed |

Step 3 is the only failing assertion. Because Remember Me is absent rather than
misbehaving, its "not mandatory" sub-assertion could not be evaluated at all.

### How the absence was confirmed (ruling out a false FAIL)

A missing control is exactly the kind of finding that can be an execution artifact rather than a
product defect, so it was verified by **two independent methods** before classification:

1. **Accessibility snapshot** of the full form tree — no Remember Me node, no checkbox of any
   kind. A targeted search for `/remember|checkbox|keep me|stay signed/i` returned **no matches**.
2. **Rendered full-page screenshot** — visually confirms no Remember Me control anywhere on the
   page, including outside the form card. This catches anything present in the DOM but not
   exposed to the accessibility tree.

The page was fully rendered and error-free when both observations were taken, and the other
controls on the same form were located and operated successfully — so the tooling was demonstrably
able to see and drive this form.

### Failure classification — alternatives ruled out

`PRODUCT_BUG` was chosen only after eliminating every other classification:

| Classification | Ruled out because |
|---|---|
| `TEST_SCRIPT_ISSUE` | Two independent observation methods agree. Every other control on the same form was found and operated correctly |
| `ENVIRONMENT_ISSUE` | App healthy — 0 console errors, 0 warnings, page fully rendered, controls functional |
| `NETWORK_ISSUE` | Page and assets loaded completely; no failed or pending loads |
| `TEST_DATA_ISSUE` | The case requires no test data |
| `AUTHENTICATION_ISSUE` | The case is unauthenticated by design; no authentication was attempted |
| `UNKNOWN` | The cause is determined and reproducible, not ambiguous |

The requirement is **explicit**, not inferred — REQ-LOG-002 **AC-2**: *"The Admin Panel's login
form presents Username, Password, and a Remember Me option."*

### Evidence

Stored in `evidence/` beside this file. **`evidence/` is gitignored** — local only, not committed.
**No credential appears in any evidence file**: this case entered no credentials at all.

| File | Shows |
|---|---|
| `evidence/tc-002-login-form-fullpage.png` | Full-page render — the complete login form with **no Remember Me control anywhere on the page** |
| `evidence/tc-002-form-fields-detail.png` | The form card in detail — Username, Password + View Password toggle, Forgot password, Login |

Console errors: **0**. Console warnings: **0**.

---

## Observations recorded, not acted on

1. **The identifier field is labelled `Email / User name`, and its placeholder reads
   `Enter email / user name`.** TC-53717-002 asserts only that *a Username field is present*,
   which is satisfied, so this is **not** part of this case's result.

   It is flagged because **REQ-LOG-004** requires the Admin Panel Username to contain no spaces
   and no `@` character, and to **reject an email address supplied in place of a username** — a UI
   inviting an email may conflict with that rule. **Unverified.** `TC-53717-013` covers
   REQ-LOG-004 and must be executed before any conclusion is drawn. **No bug is raised for this.**

2. **The View Password toggle is exposed as a bare `img` with no accessible name.** The case
   asserts presence only (satisfied), so this is not a result. Recorded as a potential
   accessibility concern, **unverified** and outside this run's scope.

---

## Scope note

Execution **stopped after this case**, as the skill requires when a `PRODUCT_BUG` is found. No
other Test Case was executed. Four other cases in the artifact depend on Remember Me
(`TC-53717-001` Agent Portal, `TC-53717-046`, `TC-53717-050`) and their outcome is likely affected
on the Admin Panel side — **not executed, not assumed**.
