# BUG CANDIDATE 001 — Admin Panel login form has no Remember Me option

| | |
|---|---|
| **Status** | **`Published`** — human-approved and created in Azure DevOps on 2026-08-16 |
| Raised by | `execute-test-cases` skill, RUN-002, 2026-08-16 |
| **Azure DevOps Bug ID** | **[55482](https://dev.azure.com/tilde-technology/b1763c9b-14e8-46ae-9683-8947457e8c81/_workitems/edit/55482)** |

> Created under an **explicit human authorization given immediately before the write**
> (invariant 2). Verified against Azure DevOps after creation.

**Duplicate check scope (human decision, 2026-08-16):** duplicate checking for this workflow is
limited to **the User Story that owns the executed Test Cases** — here US 53717, which held
**0 Bugs** before this one. A broader project-wide search surfaced Bug **43084**
*"Missing 'Remember Me' Checkbox in Design and Implementation"* (Closed, under a different parent
and area path); the human ruled it **out of scope for this workflow** and it is deliberately not
treated as a duplicate.

---

## Title

```
[NBO][Authentication][Login - Admin Panel] Remember Me option is missing from the Admin Panel login form
```

## Description

**REQ-LOG-002 AC-2** requires the Admin Panel login form to present **Username, Password, and a
Remember Me option**. On STG the form presents Username, Password and a working View Password
toggle, but **the Remember Me option is absent entirely** — it is not merely non-functional or
mis-labelled, it does not exist on the page.

The requirement is explicit and corroborated in two further places in the same specification:

- **REQ-LOG-002 AC-2** — *"The Admin Panel's login form presents Username, Password, and a
  Remember Me option."*
- **REQ-LOG-019** — *"The system shall, when Remember Me is selected on either portal, remember
  the user's login identifier details for prefill on future login attempts…"*
- **REQ-LOG-015 AC-3** — *"The 'Remember Me' option, **on either portal**, is unrelated to
  trusted-device creation; it instead remembers login identifier details for prefill."*

Because the control does not exist, the **entire REQ-LOG-019 capability is unreachable from the
Admin Panel** — not just the checkbox, but identifier prefill on subsequent logins.

## Preconditions

- The Admin Panel login URL is reachable.
- The visitor is **not** authenticated.
- No test data or account is required.

## Steps to reproduce

1. Open the Admin Panel login URL in a clean browser session as an unauthenticated visitor.
2. Wait for the login form to render fully.
3. Inspect the login form and the whole page for a **Remember Me** option.

**Reproducibility:** consistent — observed on a fully rendered, error-free page.

## Test data

**None.** This defect requires no account and no test data to reproduce.

## Expected Result

The Admin Panel login form presents a **Remember Me** option, and that option is **not
mandatory** (TC-53717-002 step 3; REQ-LOG-002 AC-2).

## Actual Result

**No Remember Me option is present anywhere on the login form or the page.** The form contains
only:

- `Email / User name` field (required)
- `Password` field (required)
- View Password toggle on the Password field — present and functional
- `Forgot password?` link
- `Login` button

The region between the Password field and the Login button — where the option would normally sit
— contains only the `Forgot password?` link.

Because the control is absent, its "not mandatory" sub-assertion **could not be evaluated at
all**.

## Environment

| | |
|---|---|
| Environment label | **STG** |
| Target host | `https://ndc-apis-nbo-frontend-dev-epf8graxc0cudjd9.northeurope-01.azurewebsites.net/login` |
| Note | The hostname contains `-dev-` but **is** the team's STG environment (`docs/product-decisions.md` §12.1) |
| Application | NDC Back Office — Admin Panel |
| Observed | 2026-08-16 |
| Console | 0 errors, 0 warnings — the page rendered cleanly |

## Severity / Priority — **proposed by AI, human decides**

| | Proposed | Reasoning |
|---|---|---|
| **Severity** | **Medium** | A specified feature is entirely missing, and REQ-LOG-019 (identifier prefill) is unreachable on this portal as a result. It is **not** High: login itself works, no data is lost, no security control is bypassed, and there is no workaround needed to authenticate |
| **Priority** | **Medium** | Worth fixing within the story's scope since it is an explicit acceptance criterion, but it does not block Admin Panel login or release-critical flows |

These are **proposals only.** Severity and Priority are the human's call
(`docs/product-decisions.md` §5).

## Evidence

Under `docs/executions/US-53717/RUN-002/evidence/` — **gitignored, local only**.
No credentials appear in any file; this case entered none.

| File | Shows |
|---|---|
| `tc-002-login-form-fullpage.png` | Full-page render — **no Remember Me control anywhere on the page** |
| `tc-002-form-fields-detail.png` | The form card in detail — every control that *is* present |

## Related Test Case

- **`TC-53717-002`** — *Admin Panel login form presents the specified fields* (Azure DevOps
  **55295**). Result: **FAIL** at step 3.

## Related User Story

- **US 53717** (Azure DevOps). Requirement references: **REQ-LOG-002 AC-2**, and consequently
  **REQ-LOG-019**, **REQ-LOG-015 AC-3**.

## Failure classification

**`PRODUCT_BUG`** — the application behaves contrary to an explicit, stated acceptance criterion.

Chosen only after eliminating every alternative:

| Classification | Ruled out because |
|---|---|
| `TEST_SCRIPT_ISSUE` | Confirmed by **two independent methods** — accessibility tree (plus a targeted text/regex search returning no matches) and a rendered full-page screenshot. Every other control on the same form was located and operated successfully |
| `ENVIRONMENT_ISSUE` | Page fully rendered, 0 console errors, 0 warnings, other controls functional |
| `NETWORK_ISSUE` | Page and assets loaded completely |
| `TEST_DATA_ISSUE` | The case requires no test data |
| `AUTHENTICATION_ISSUE` | Unauthenticated by design; no authentication attempted |
| `UNKNOWN` | The cause is determined and reproducible |

The finding rests on an **`[E]` explicit requirement**, not a QA inference.

## Duplicate check — performed 2026-08-16

**Scope: US 53717 only**, per the human decision recorded above.

US 53717 had **61 children before this Bug** — 52 Test Cases, 7 Tasks, 2 Meetings, and
**0 Bugs**. No duplicate existed within the workflow's scope, so creation proceeded.

## Impact beyond this test case — unverified

Other Test Cases assert Remember Me behaviour and are **likely affected on the Admin Panel side**.
They were **not executed** and their status is **not assumed**:

- `TC-53717-050` — Remember Me identifier prefill
- `TC-53717-046` — Remember Me vs OTP / trusted device (**Agent Portal**)
- `TC-53717-001` — Agent Portal form fields, which also expects Remember Me (**Agent Portal**)

**Whether the Agent Portal is also affected is unknown** — no Agent Portal case was executed in
this run. That is worth checking, since REQ-LOG-002 AC-1 requires Remember Me there too.
