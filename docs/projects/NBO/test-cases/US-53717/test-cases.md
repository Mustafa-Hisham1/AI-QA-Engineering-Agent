# Test Cases — US 53717: Login (Authentication)

**Status:** generated from the completed Requirement Analysis, AI self-review complete,
**APPROVED by the human on 2026-08-13 (all 52)**, and **PUBLISHED to Azure DevOps on 2026-08-13
as 52 child Test Case work items of US 53717 (IDs 55294–55345).** Publication verified.

**Approval and publication record** — the authority for every `Published` status below:

| | |
|---|---|
| Approved by | Human statement in session, 2026-08-13 — *"All 52 test cases are approved"* |
| Scope of the approval | **All 52** cases, TC-53717-001 … TC-53717-052, as written at this revision |
| Rejected / needs changes | **None** |
| Publish authorized by | A **second, separate** human statement in session, 2026-08-13, explicitly authorizing the write; the exact `POST` operation was shown and approved immediately beforehand (invariant 2) |
| Published | **52 of 52**, 0 failures, 0 duplicates. IDs **55294 … 55345** |
| Publish method | `npm run testcases:publish -- 53717 --confirm` — one item per request, no retries, each ID written into this file before the next create was attempted |
| Verified | Every case is a child of 53717, of type `Test Case`, with a title and step count matching this artifact |
| Re-running the publisher | Safe. It skips any case with a recorded Azure DevOps ID, and matches remaining cases against the story's existing children by title, so it **cannot** create duplicates |
| If any case changes | A materially edited case **loses this approval**. Its published Azure DevOps item is now the official record (`docs/product-decisions.md` §13), so a divergence between this file and Azure DevOps needs a human decision — the agent must not silently overwrite either side |

| | |
|---|---|
| Azure DevOps work item | **53717** — `[INT] Authentication-Login Screen"Q3-API-INTE-033"` (User Story) |
| Requirement analysis | [`../../requirements/US-53717/requirement-analysis.md`](../../requirements/US-53717/requirement-analysis.md) |
| Confirmed human decisions | [`../../requirements/US-53717/decisions.md`](../../requirements/US-53717/decisions.md) — D-01…D-12 |
| Source snapshot | [`../../requirements/US-53717/source/login-business-requirements.md`](../../requirements/US-53717/source/login-business-requirements.md) |
| Work item revision at generation | **rev 8** |
| Content fingerprint at generation | `334a9561b7cb81fbaf6e6f2c9975044bcd3c702f838008052a67cb4c948d78d0` |
| Attachment sha256 | `a5c687d444935c1284da925bbc307e2786968cde4fcdd51014a0e9c96b95e826` |
| Generated | 2026-08-13 — from the local analysis only; Azure DevOps was **not** re-read |
| Test scope | **UI only** **[D-09]** — no API test cases |
| Target environment | **STG** (the only allowed environment) |
| Test cases | **52** (TC-53717-001 … TC-53717-052) — **52 Published, 0 rejected, 0 needing changes** |
| Published to Azure DevOps | **All 52**, 2026-08-13, as child Test Case work items of US 53717 — IDs **55294 … 55345** (contiguous, one per case in artifact order) |
| Publish verification | Passed — every case exists as a child of 53717, is of type `Test Case`, and its title and step count match this artifact (`npm run testcases:publish -- 53717 --verify`) |

**If the fingerprint above ever differs from a fresh `npm run story:read -- 53717`, these test
cases are stale** — re-run the analysis, diff the source snapshot, and revise before executing
(`docs/product-decisions.md` §14).

---

## How to read this file

Fields follow `docs/product-decisions.md` §3. Titles follow the mandatory
`[Project][Module][Feature/Page] <Scenario>` convention and are **generated from** the
structured fields — grouping and filtering rely on the fields, never on parsing the title.

### Review/Lifecycle Status vocabulary

Defined here because this is the first test case artifact (`CLAUDE.md` → *Open items*).
Recorded in `docs/product-decisions.md` §6.1.

| Status | Meaning | Who may set it |
|---|---|---|
| `Draft` | Generated, not yet self-reviewed | Agent |
| `AI-Reviewed` | Passed the agent self-review; awaiting human review | Agent |
| `Needs-Changes` | The human asked for changes | Agent, **only** on an explicit human statement |
| `Approved` | The human explicitly approved this test case | **Human statement only** — the agent must never set this |
| `Published` | Created in Azure DevOps; the Azure DevOps ID field is filled | Agent, **only** after a confirmed write |
| `Rejected` | The human rejected it; the case moves to §17 and its ID is never reused | Agent, **only** on an explicit human statement |

Writing a status value **is not approval** (`docs/product-decisions.md` §6). Every Azure DevOps
write still needs explicit human approval immediately before that write.

### Conventions used in every case below

- **Independence.** No case depends on another having run (`docs/product-decisions.md` §4).
  Cases that need a failed-attempt or lockout state create it inside their own steps.
- **The Failed Attempt Count is not displayed in the UI** (REQ-LOG-001 AC-2). No step asserts a
  counter value directly. Counter behaviour is asserted only through its one observable
  consequence: **whether the lockout occurs on a given attempt.**
- **Exact message text is asserted only for the nine strings the specification defines** (§8.1
  of the analysis). Everywhere else the expected result is *an appropriate message or
  field-level feedback is displayed* — a missing message is a defect, different but appropriate
  wording is not **[D-03]**.
- **Landing route is not asserted.** "Dashboard" is the stated target but no route is specified
  (OQ-18); steps assert that the user is authenticated and the portal's landing page is shown.
- **Observation-only steps** say so explicitly. They record what happened and assert nothing —
  used only where a decision is deliberately absent (OQ-26, OQ-27, OQ-03, OQ-11).
- **Credentials never appear here.** Accounts are referenced by handle and resolved from
  environment configuration (`docs/product-decisions.md` §4, §12).
- **Invalid literal values used in negative cases are arbitrary strings that belong to no
  account** — never a real password with a character inserted.

---

## Environment and test data prerequisites

Resolved from environment configuration for **STG**. The two portal URLs are environment
configuration, not test data (REQ-LOG-002).

| Handle | Account required | Used by |
|---|---|---|
| `AGENT_VALID` | Active, authorized Agent Portal account; valid password; **OTP disabled** for its user type | Positive Agent flows |
| `AGENT_LOCKOUT` | **Dedicated, expendable** Agent Portal account — will be locked repeatedly. **OTP disabled** for its user type, so that the successful logins inside the lockout cases complete without diverting into an OTP flow | Lockout cases |
| `AGENT_DISABLED` | Disabled / unauthorized Agent Portal account whose **correct password is known** | Authorization cases |
| `AGENT_EXPIRED` | Agent Portal account with an **expired** password, expendable | Password-expiry cases |
| `AGENT_OTP` | Agent Portal account whose user type has **OTP enabled**, with access to its OTP delivery channel | OTP cases |
| `AGENT_DISABLED_EXPIRED` | Agent Portal account that is **both** disabled **and** password-expired | TC-052 (OQ-27) only |
| `ADMIN_VALID` | Active, authorized Admin Panel account; **OTP disabled** for its user type | Positive Admin flows |
| `ADMIN_LOCKOUT` | **Dedicated, expendable** Admin Panel account. **OTP disabled** for its user type, for the same reason | Admin lockout cases |
| `ADMIN_DISABLED` | Disabled Admin Panel account whose correct password is known | Authorization parity |
| `ADMIN_LEGACY_EMAIL` | **Legacy** Admin account whose Username is an email address | TC-016 only — **may not exist on STG (OQ-15)** |
| `ADMIN_UNLOCKER` | Admin account authorized to view lock status and unlock accounts | Unlock cases — **owner/location unknown (OQ-13)** |
| `AGENCY_CODE_VALID` | The Agency Code of `AGENT_VALID` / `AGENT_LOCKOUT` | Agent flows |
| `AGENCY_CODE_WRONG` | A different existing Agency Code, or a well-formed non-existent one | Wrong-Agency-Code cases |

**Counter reset mechanism used in preconditions.** Because an administrative unlock resets the
Failed Attempt Count to zero **[D-12]**, unlocking via `ADMIN_UNLOCKER` is the standard way to
return a lockout account to a known state (count 0, not locked) before a case runs. Where that
function is unavailable (OQ-13), the alternative is to wait out any active lockout, which also
resets the counter **[D-08]**.

**Practical constraints, carried into the affected cases:**

- The **30-minute** lockout cannot be waited out inside a normal run. TC-037 and TC-038 need
  either the real 30 minutes or a controlled manipulation of the lockout state. If neither is
  available the result is **BLOCKED**, never FAIL (`docs/product-decisions.md` §8).
- Lockout cases are **destructive to account state**. They must run only against
  `AGENT_LOCKOUT` / `ADMIN_LOCKOUT`.
- Any failing attempt consumes one of the five allowed attempts **[D-04, D-05, D-10]**, so
  negative cases sharing an account must be budgeted. Each case below states the number of
  attempts it consumes when that number is greater than one.

---

## Coverage map — requirement → test cases

Every requirement in the analysis §14 appears here, or appears in *Deliberately not covered* with
a reason.

| Requirement | Test cases | Note |
|---|---|---|
| REQ-LOG-001 | (no direct case) | Business data model; its behaviour is verified through the cases for REQ-LOG-009/010 |
| REQ-LOG-002 | 001, 002, 003, 004 | Form contents and the View Password toggle |
| REQ-LOG-003 | 009, 010, 011, 012 | AC-2 server half **not coverable** — see *Deliberately not covered* |
| REQ-LOG-004 | 013, 014, 015, 016, 017 | AC-4 depends on a legacy account (OQ-15) |
| REQ-LOG-005 | 018, 019, 020, 023 | Space-in-password on this portal is **[D-02]** |
| REQ-LOG-006 | 021, 022, 023, 024, 025 | Generic message and no information leakage |
| REQ-LOG-007 | 026, 027, 028 | 028 is the **[D-11]** split |
| REQ-LOG-008 | 029, 030, 031, 052 | 030 crosses into the PWD spec (OQ-14) |
| REQ-LOG-009 | 032, 033, 034, 035, 036, 037 | 4-vs-5 boundary, message, duration, per-user, both portals, lock-first |
| REQ-LOG-010 | 038, 040, 041, 042 | Reset on success, on expiry **[D-08]**, on unlock **[D-12]**; OTP failure does not increment |
| REQ-LOG-011 | 039, 040 | AC-3 (unlock clears OTP lockout) **excluded** — see *Deliberately not covered* |
| REQ-LOG-012 | 005, 006, 043, 044, 045 | AC-3 (OTP disabled) is verified by the happy paths |
| REQ-LOG-015 | 044, 046 | 15-day boundary **excluded** — see *Deliberately not covered* |
| REQ-LOG-016 | 005, 006, 007, 008 | Redirect per portal; Admin invalidates, Agent does not |
| REQ-LOG-017 | 047 | Negative requirement, four points in the flow |
| REQ-LOG-018 | 009, 010, 011, 012, 013, 014, 015, 019, 020 | AC-1 data-entry feedback; AC-2 **not coverable** — see *Deliberately not covered* |
| REQ-LOG-019 | 048, 049, 050 | Prefill per portal, password never prefilled, no OTP bypass (046) |
| **OQ-26** (undecided) | 051 | Observation only — asserts nothing about the counter |
| **OQ-27** (undecided) | 052 | Observation only — asserts no precedence |
| **OQ-03** (open) | 017 | Observation only — asserts no trimming behaviour |
| **OQ-11** (open) | 050 step 3 | Observation only |

---

## Deliberately not covered

Recorded rather than dropped, each with the reason and what would unblock it.

| Not covered | Requirement | Why | Unblocked by |
|---|---|---|---|
| Server-side re-enforcement of every validation rule regardless of the client | REQ-LOG-018 AC-2, REQ-LOG-003 AC-2 | Needs a request that bypasses the client. **Impossible in the UI-only test scope [D-09]** | Adding API test cases (D-01, OQ-25) |
| Administrative unlock clearing the **OTP** attempt/resend lockout | REQ-LOG-011 AC-3 | Reaching OTP lockout needs the OTP spec's retry/resend thresholds, which are **not attached** (OQ-14). An expectation here would be invented | The OTP specification |
| Trusted-device **15-day expiry** boundary | REQ-LOG-015 AC-4 | Cannot be reached in a normal run, and the record's semantics (per user+device, renewal, effect of clearing browser data) are undefined (OQ-12) | Data/clock manipulation plus an answer to OQ-12 |
| Remember Me **retention period** and survival across browser restart | REQ-LOG-019 | No retention period is stated (OQ-11). TC-050 covers the observable part only | An answer to OQ-11 |
| OTP delivery channels, retries, resend, TTL, OTP lockout | REQ-LOG-012 AC-6 | Explicitly out of scope of this specification; owned by the OTP spec | The OTP specification |
| Change Password flow internals | REQ-LOG-008 AC-2 | Owned by the PWD spec (`REQ-PWD-011/012`), not attached (OQ-14). TC-030 asserts only the login-completion boundary | The Change Password specification |
| Password composition / length / character rules, Agency Code and email format rules | REQ-LOG-004, REQ-LOG-005 | No limits exist in any available source (OQ-06, OQ-22). Boundary values would be invented | Admin Settings / PWD spec values |
| Session timeout, idle expiry, logout | — | Not mentioned in the sources; outside Login (OQ-20) | A requirement that covers them |
| API-level login | D-01 | Test scope is UI only **[D-09]**, and no API contract was supplied (OQ-25) | An API contract + a scope change |

---

## 1. Login form and UI — REQ-LOG-002

### TC-53717-001 — Agent Portal login form presents the specified fields

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify the login form presents Agency Code, Email, Password, Remember Me and the View Password toggle` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Positive · UI |
| Requirement Reference | REQ-LOG-002 AC-1, AC-3 |
| Decisions Applied | — |
| Azure DevOps ID | **55294** |
| Review/Lifecycle Status | Published |

**Precondition**
- The Agent Portal STG URL is reachable and the user is **not** authenticated.

**Test Data**
- None.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the Agent Portal login URL as an unauthenticated visitor | The login form is displayed |
| 2 | Inspect the form fields | An **Agency Code** field, an **Email** field and a **Password** field are all present |
| 3 | Inspect the form options | A **Remember Me** option is present and is **not** mandatory |
| 4 | Inspect the Password field | A **View Password** toggle is present on the Password field |

---

### TC-53717-002 — Admin Panel login form presents the specified fields

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify the login form presents Username, Password, Remember Me and the View Password toggle` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | Positive · UI |
| Requirement Reference | REQ-LOG-002 AC-2, AC-3 |
| Decisions Applied | — |
| Azure DevOps ID | **55295** |
| Review/Lifecycle Status | Published |

**Precondition**
- The Admin Panel STG URL is reachable and the user is **not** authenticated.

**Test Data**
- None.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the Admin Panel login URL as an unauthenticated visitor | The login form is displayed |
| 2 | Inspect the form fields | A **Username** field and a **Password** field are present. **No Agency Code field is present** — that field belongs to the Agent Portal |
| 3 | Inspect the form options | A **Remember Me** option is present and is **not** mandatory |
| 4 | Inspect the Password field | A **View Password** toggle is present on the Password field |

---

### TC-53717-003 — Agent Portal View Password toggle shows and hides the entered password

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify the View Password toggle shows and hides the entered password` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Positive · UI |
| Requirement Reference | REQ-LOG-002 AC-3 |
| Decisions Applied | — |
| Azure DevOps ID | **55296** |
| Review/Lifecycle Status | Published |

**Precondition**
- The Agent Portal login form is open.

**Test Data**
- Password field input: `Toggle#Check1` (an arbitrary string belonging to no account — this case never submits the form).

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Type `Toggle#Check1` into the Password field | The characters are **masked** by default |
| 2 | Activate the View Password toggle | The password is displayed in **plain text** and reads exactly `Toggle#Check1` |
| 3 | Activate the View Password toggle again | The password is **masked** again |
| 4 | Do not submit the form | No login attempt is made and no error message is shown |

**Notes**
- This toggle is a confirmed product enhancement, not legacy behaviour (REQ-LOG-002 AC-3), and it
  is absent from the User Story's own acceptance criteria — it exists only in the specification.

---

### TC-53717-004 — Admin Panel View Password toggle shows and hides the entered password

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify the View Password toggle shows and hides the entered password` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | Positive · UI |
| Requirement Reference | REQ-LOG-002 AC-3 |
| Decisions Applied | — |
| Azure DevOps ID | **55297** |
| Review/Lifecycle Status | Published |

**Precondition**
- The Admin Panel login form is open.

**Test Data**
- Password field input: `Toggle#Check1` (arbitrary; the form is never submitted).

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Type `Toggle#Check1` into the Password field | The characters are **masked** by default |
| 2 | Activate the View Password toggle | The password is displayed in **plain text** and reads exactly `Toggle#Check1` |
| 3 | Activate the View Password toggle again | The password is **masked** again |
| 4 | Do not submit the form | No login attempt is made and no error message is shown |

---

## 2. Successful login — REQ-LOG-016, REQ-LOG-012 AC-3

### TC-53717-005 — Agent Portal login succeeds with valid credentials when OTP is disabled

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify login completes and the dashboard is displayed when valid Agency Code, Email and Password are submitted and OTP is disabled` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Positive · Functional |
| Requirement Reference | REQ-LOG-002 AC-1, REQ-LOG-005 AC-1/AC-2, REQ-LOG-006, REQ-LOG-012 AC-3, REQ-LOG-016 AC-1 |
| Decisions Applied | — |
| Azure DevOps ID | **55298** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_VALID` is active, authorized, its password is **not** expired, and it is **not** locked.
- **OTP is disabled** for `AGENT_VALID`'s user type (Admin Settings configuration).

**Test Data**
- `AGENT_VALID` Agency Code, Email and Password from environment configuration.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the Agent Portal login form | The form is displayed |
| 2 | Enter `AGENT_VALID`'s Agency Code, Email and Password | The values are accepted with no validation feedback |
| 3 | Submit the form | Login completes. **No OTP step is presented** (OTP is disabled for this user type) |
| 4 | Observe the resulting page | The user is authenticated and the Agent Portal dashboard / landing page is displayed. The specific route is not asserted (OQ-18) |
| 5 | Observe the login form | The login form is no longer presented for this session |

---

### TC-53717-006 — Admin Panel login succeeds with valid credentials when OTP is disabled

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify login completes and the dashboard is displayed when a valid Username and Password are submitted and OTP is disabled` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | Positive · Functional |
| Requirement Reference | REQ-LOG-002 AC-2, REQ-LOG-004, REQ-LOG-006, REQ-LOG-012 AC-3, REQ-LOG-016 AC-2 |
| Decisions Applied | — |
| Azure DevOps ID | **55299** |
| Review/Lifecycle Status | Published |

**Precondition**
- `ADMIN_VALID` is active, authorized, its password is **not** expired, and it is **not** locked.
- **OTP is disabled** for `ADMIN_VALID`'s user type.

**Test Data**
- `ADMIN_VALID` Username and Password from environment configuration.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the Admin Panel login form | The form is displayed |
| 2 | Enter `ADMIN_VALID`'s Username and Password | The values are accepted with no validation feedback |
| 3 | Submit the form | Login completes. **No OTP step is presented** |
| 4 | Observe the resulting page | The user is authenticated and the Admin Panel dashboard / landing page is displayed. The specific route is not asserted (OQ-18) |

---

### TC-53717-007 — Admin Panel login invalidates any prior session for the same account

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify a new login invalidates the account's prior session` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | State · Functional |
| Requirement Reference | REQ-LOG-016 AC-2 |
| Decisions Applied | — |
| Azure DevOps ID | **55300** |
| Review/Lifecycle Status | Published |

**Precondition**
- `ADMIN_VALID` is usable for a positive login (as TC-006).
- Two **independent browser contexts** (separate cookie/storage jars) are available — call them
  **Context A** and **Context B**.

**Test Data**
- `ADMIN_VALID` Username and Password.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | In **Context A**, log in as `ADMIN_VALID` | Login completes; the dashboard is displayed |
| 2 | In **Context B**, log in as `ADMIN_VALID` with the same credentials | Login completes; a new session is established and the dashboard is displayed |
| 3 | Return to **Context A** and navigate to or reload an authenticated page | The **Context A session is no longer valid** — the user is no longer authenticated and is returned to the login form (or otherwise denied access) |
| 4 | In **Context B**, reload an authenticated page | Context B remains authenticated |

**Notes**
- This is the behaviour that deliberately **differs** from the Agent Portal (TC-008). The two
  cases are a matched pair; if both portals behave the same way, one of them is a defect.

---

### TC-53717-008 — Agent Portal permits concurrent sessions and does not invalidate a prior session

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify a new login does not invalidate the account's prior session and concurrent sessions are permitted` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | State · Functional |
| Requirement Reference | REQ-LOG-016 AC-1, AC-2a |
| Decisions Applied | — |
| Azure DevOps ID | **55301** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_VALID` is usable for a positive login (as TC-005).
- Two independent browser contexts, **Context A** and **Context B**.

**Test Data**
- `AGENT_VALID` Agency Code, Email and Password.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | In **Context A**, log in as `AGENT_VALID` | Login completes; the dashboard is displayed |
| 2 | In **Context B**, log in as `AGENT_VALID` with the same credentials | Login completes; the dashboard is displayed |
| 3 | Return to **Context A** and navigate to or reload an authenticated page | **Context A is still authenticated** — the prior session was **not** invalidated |
| 4 | In **Context B**, reload an authenticated page | Context B is still authenticated. Both sessions are active at the same time |

---

## 3. Mandatory credentials — REQ-LOG-003, REQ-LOG-018 AC-1

### TC-53717-009 — Admin Panel rejects submission with both Username and Password empty

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify the specified message is shown when the form is submitted with both Username and Password empty` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | Negative · Validation |
| Requirement Reference | REQ-LOG-003 AC-1, REQ-LOG-018 AC-1 |
| Decisions Applied | — |
| Azure DevOps ID | **55302** |
| Review/Lifecycle Status | Published |

**Precondition**
- The Admin Panel login form is open, with both fields empty.

**Test Data**
- Username: *(empty)*, Password: *(empty)*.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Leave Username and Password empty and submit the form | Login is not attempted and the message `Please enter Username and Password!` is displayed **verbatim** |
| 2 | Observe the page | The user remains on the login form and is not authenticated |

**Notes**
- Whether this validation failure moves the Failed Attempt Count is **deliberately undecided**
  (OQ-26) — this case asserts nothing about it. See TC-051.

---

### TC-53717-010 — Admin Panel rejects submission with a Username but an empty Password

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify the specified message is shown when a Username is entered and the Password is left empty` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | Negative · Validation |
| Requirement Reference | REQ-LOG-003 AC-1, REQ-LOG-018 AC-1 |
| Decisions Applied | — |
| Azure DevOps ID | **55303** |
| Review/Lifecycle Status | Published |

**Precondition**
- The Admin Panel login form is open.

**Test Data**
- Username: `ADMIN_VALID`'s Username. Password: *(empty)*.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter `ADMIN_VALID`'s Username and leave the Password empty | The Username is accepted |
| 2 | Submit the form | Login is not attempted and the message `Password is required.` is displayed **verbatim** — note the trailing full stop, which differs from TC-009's exclamation mark, exactly as specified |
| 3 | Observe the page | The user remains on the login form and is not authenticated |

**Notes**
- Counter effect deliberately undecided (OQ-26) — not asserted.

---

### TC-53717-011 — Admin Panel rejects submission with an empty Username and a Password supplied

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify an appropriate message is shown when the Username is left empty and a Password is entered` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | Negative · Validation |
| Requirement Reference | REQ-LOG-003 AC-1, REQ-LOG-018 AC-1 |
| Decisions Applied | **D-03** |
| Azure DevOps ID | **55304** |
| Review/Lifecycle Status | Published |

**Precondition**
- The Admin Panel login form is open.

**Test Data**
- Username: *(empty)*. Password: `NotARealPass1` (arbitrary; belongs to no account).

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Leave the Username empty, enter the Password and submit the form | Login is not attempted and **an appropriate message or field-level validation feedback is displayed**. **Exact wording is not asserted** — the specification defines text only for "both empty" and "Password empty" **[D-03]** |
| 2 | Observe the page | The user remains on the login form and is not authenticated |
| 3 | Record which message appeared | Observation. `Please enter Username and Password!` would satisfy the requirement, but the specification does not name this case, so no exact text is required |

**Notes**
- The specification is internally loose here: REQ-LOG-003 AC-1 reads "an empty Username **or**
  Password shows `Please enter Username and Password!`" and then defines a different text for
  the Password-empty case. Absence of a message is a defect; a differing appropriate message is
  not **[D-03]**.

---

### TC-53717-012 — Agent Portal enforces all three mandatory fields

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify field-level validation feedback is shown when mandatory Agency Code, Email or Password are missing` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · Validation |
| Requirement Reference | REQ-LOG-003 AC-3, REQ-LOG-018 AC-1 |
| Decisions Applied | **D-03** |
| Azure DevOps ID | **55305** |
| Review/Lifecycle Status | Published |

**Precondition**
- The Agent Portal login form is open.

**Test Data**
- `AGENT_VALID` Agency Code, Email and Password, used to fill only the fields a given step
  requires.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Submit the form with **all three** fields empty | Login is not attempted and **all three** fields — Agency Code, Email, Password — are highlighted with field-level validation feedback. Exact wording not asserted **[D-03]** |
| 2 | Enter a valid Email and Password, leave **Agency Code** empty, submit | Login is not attempted; **Agency Code** is flagged with field-level feedback |
| 3 | Enter a valid Agency Code and Password, leave **Email** empty, submit | Login is not attempted; **Email** is flagged with field-level feedback |
| 4 | Enter a valid Agency Code and Email, leave **Password** empty, submit | Login is not attempted; **Password** is flagged with field-level feedback |
| 5 | Observe the page after each step | The user stays on the login form and is never authenticated |

**Notes**
- Combined into one case deliberately: the assertion is *presence of feedback on the missing
  field*, which is the same rule four times. Splitting it would produce four near-identical
  Azure DevOps items with no extra diagnostic value.
- No message texts are specified for this portal **[D-03]**. Counter effect undecided (OQ-26).

---

## 4. Admin Panel identifier format — REQ-LOG-004

### TC-53717-013 — Admin Panel rejects a Username containing a space

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify the specified message is shown when the Username contains a space` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | Negative · Validation |
| Requirement Reference | REQ-LOG-004 AC-1, REQ-LOG-018 AC-1 |
| Decisions Applied | — |
| Azure DevOps ID | **55306** |
| Review/Lifecycle Status | Published |

**Precondition**
- The Admin Panel login form is open.

**Test Data**
- Username: `admin user` (a space between two words — belongs to no account).
- Password: `NotARealPass1`.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter `admin user` as the Username and any password, then submit | Login is not attempted and the message `Spaces not allowed in user name!` is displayed **verbatim** |
| 2 | Observe the page | The user remains on the login form and is not authenticated |

---

### TC-53717-014 — Admin Panel rejects a Password containing a space

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify the specified message is shown when the Password contains a space` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | Negative · Validation |
| Requirement Reference | REQ-LOG-004 AC-2, REQ-LOG-018 AC-1 |
| Decisions Applied | — |
| Azure DevOps ID | **55307** |
| Review/Lifecycle Status | Published |

**Precondition**
- The Admin Panel login form is open.

**Test Data**
- Username: `ADMIN_VALID`'s Username.
- Password: `Not A Pass1` (contains spaces; an arbitrary string, **not** a real password with a
  space inserted).

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter a valid Username and the password `Not A Pass1`, then submit | Login is not attempted and the message `Spaces not allowed in Password` is displayed **verbatim** — no trailing punctuation, exactly as specified |
| 2 | Observe the page | The user remains on the login form and is not authenticated |

---

### TC-53717-015 — Admin Panel rejects a Username containing '@'

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify the specified message is shown when the Username contains the '@' character` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | Negative · Validation |
| Requirement Reference | REQ-LOG-004 AC-3, REQ-LOG-018 AC-1 |
| Decisions Applied | — |
| Azure DevOps ID | **55308** |
| Review/Lifecycle Status | Published |

**Precondition**
- The Admin Panel login form is open.

**Test Data**
- Username: `admin@user` (contains `@`, is not a full email address, belongs to no account).
- Password: `NotARealPass1`.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter `admin@user` as the Username and any password, then submit | Login is not attempted and the message `Please enter a valid user without '@'` is displayed **verbatim**, including the single quotes around `@` |
| 2 | Observe the page | The user remains on the login form and is not authenticated |

**Notes**
- `admin@user` is used rather than a full email address so this case tests the `@` rule alone.
  The email-as-username rule is a separate requirement (AC-4) covered by TC-016.

---

### TC-53717-016 — Admin Panel rejects an email address used as the Username (legacy account)

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify the specified message is shown when a legacy account's email address is used as the Username` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | Negative · Validation |
| Requirement Reference | REQ-LOG-004 AC-4 |
| Decisions Applied | **D-03** |
| Azure DevOps ID | **55309** |
| Review/Lifecycle Status | Published |

**Precondition**
- `ADMIN_LEGACY_EMAIL` exists on STG — an account created **before** the Create User `@`
  restriction, whose Username is an email address.
- **If no such account exists, the result is BLOCKED, not FAIL** (OQ-15). Current Create User
  validation can no longer produce one.

**Test Data**
- Username: the email-address username of `ADMIN_LEGACY_EMAIL`.
- Password: that account's password from environment configuration.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter the legacy account's email address as the Username, with its correct Password, and submit | Login is **refused**. The message `Sorry, you cannot use your email. Please use your username.` is displayed **verbatim** |
| 2 | Observe the page | The user remains on the login form and is not authenticated |
| 3 | Record the message actually shown | Observation. If `Please enter a valid user without '@'` (AC-3) appears instead, **report it** — the two requirements overlap for any input containing `@` and the specification does not state which wins. Do not mark the case FAIL on wording alone **[D-03]**; report the ambiguity |

---

### TC-53717-017 — Admin Panel whitespace-edge handling in Username and Password (observation only)

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify and record how leading, trailing and tab whitespace in the Username and Password are handled` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | Boundary · Observation |
| Requirement Reference | REQ-LOG-004 AC-1, AC-2 — **edge behaviour undefined (OQ-03)** |
| Decisions Applied | **D-02**, **D-03** |
| Azure DevOps ID | **55310** |
| Review/Lifecycle Status | Published |

**Precondition**
- The Admin Panel login form is open.
- `ADMIN_VALID` is usable for a positive login and is **not** locked.

**Test Data**
- A leading space, a trailing space and a tab character, applied around `ADMIN_VALID`'s
  Username and Password.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter `ADMIN_VALID`'s Username with a **leading** space, plus the correct Password, and submit | **Observation only.** Record whether the input was trimmed and login succeeded, or the space rule rejected it. The specification does not define whether "contains a space" includes leading whitespace (OQ-03) — assert nothing |
| 2 | Repeat with a **trailing** space on the Username | Observation only — record the outcome |
| 3 | Repeat with a **tab** character inside the Username | Observation only — record the outcome |
| 4 | Repeat steps 1–3 on the **Password** field | Observation only — record the outcome. **D-02** confirms the space rule itself; only these whitespace edges are undefined |
| 5 | Across all steps | The only assertion: the application **must not** crash, hang, or expose a server error page. Any user-facing outcome is acceptable and is recorded |

**Notes**
- This case exists to **produce the evidence that answers OQ-03**, not to pass or fail behaviour.
  Its recorded outcome should feed a human decision, after which the case can become assertive.
- Steps 1–4 may consume failed attempts on `ADMIN_VALID` if the input is treated as a credential
  attempt. Run it against `ADMIN_LOCKOUT` instead if `ADMIN_VALID` must stay usable — up to 6
  attempts may be consumed.

---

## 5. Agent Portal identifier — REQ-LOG-005, D-02

### TC-53717-018 — Agency Code is capitalized regardless of how it was typed

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify an Agency Code typed in lower case is displayed capitalized and login succeeds` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Positive · Functional |
| Requirement Reference | REQ-LOG-005 AC-2, AC-3 |
| Decisions Applied | — |
| Azure DevOps ID | **55311** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_VALID` is usable for a positive login (as TC-005), OTP disabled, not locked.

**Test Data**
- `AGENT_VALID`'s Agency Code typed entirely in **lower case**, plus its valid Email and
  Password.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the Agent Portal login form and type the Agency Code in lower case | The field **displays the value capitalized**, regardless of the case typed (REQ-LOG-005 AC-3) |
| 2 | Enter the valid Email and Password and submit | Login completes — a lower-case Agency Code is **not** treated as a wrong Agency Code |
| 3 | Observe the resulting page | The user is authenticated and the dashboard is displayed |
| 4 | Where the Agency Code is displayed after login | The stored/displayed value is capitalized (AC-3, "displayed and saved as a capitalized value") |

**Notes**
- Step 4 is only assertable if the Agency Code is visible somewhere after login; if it is not
  exposed in the UI, record that the saved-value half is unverifiable at the UI level and treat
  steps 1–3 as the result.

---

### TC-53717-019 — Agent Portal rejects a Password containing a space

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify login is refused with an appropriate message when the Password contains a space` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · Validation |
| Requirement Reference | REQ-LOG-004 AC-2 extended to this portal, REQ-LOG-018 AC-1 |
| Decisions Applied | **D-02**, **D-03** |
| Azure DevOps ID | **55312** |
| Review/Lifecycle Status | Published |

**Precondition**
- The Agent Portal login form is open.

**Test Data**
- Agency Code + Email: `AGENT_VALID`'s values. Password: `Not A Pass1` (contains spaces;
  arbitrary).

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter a valid Agency Code and Email with the password `Not A Pass1`, then submit | Login is **refused** and **an appropriate message or field-level feedback is displayed**. Exact wording is **not** asserted — the specification states this rule only for the Admin Panel and defines no Agent Portal text **[D-02, D-03]** |
| 2 | Observe the page | The user remains on the login form and is not authenticated |
| 3 | Record which message appeared | Observation — useful for deciding later whether the Admin text `Spaces not allowed in Password` was reused here |

**Notes**
- The rule itself is human-confirmed **[D-02]**; only the wording is undefined. A password with
  a space being **accepted** on this portal is a defect.

---

### TC-53717-020 — Agent Portal refuses a malformed email address

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify login is refused with an appropriate message when the Email is malformed` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · Validation |
| Requirement Reference | REQ-LOG-005 AC-1, REQ-LOG-018 AC-1 — **no format rule is stated (OQ-06)** |
| Decisions Applied | **D-03** |
| Azure DevOps ID | **55313** |
| Review/Lifecycle Status | Published |

**Precondition**
- The Agent Portal login form is open.

**Test Data**
- Agency Code: `AGENT_VALID`'s Agency Code.
- Email values: `agentexample.com` (no `@`) and `agent@` (no domain).
- Password: `NotARealPass1`.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter the Agency Code, the Email `agentexample.com` and any password, then submit | Login is **refused** and **an appropriate message is displayed** — either field-level format feedback or the generic credential error. Exact wording is not asserted **[D-03]**, and no specific format rule exists to assert (OQ-06) |
| 2 | Repeat with the Email `agent@` | Login is refused with an appropriate message |
| 3 | Observe the page after each step | The user remains on the login form and is not authenticated. **No message may reveal whether the email was unrecognized or merely malformed** if the generic error path is taken (REQ-LOG-006, **D-11**) |
| 4 | Record which layer rejected each value | Observation — field-level format validation or the credential check. The specification does not state which, and either is acceptable |

**Notes**
- Boundary/format coverage beyond these two values would require length and character rules that
  no source defines (OQ-06, OQ-22) — see *Deliberately not covered*.
- Counter effect is undecided if the rejection is pre-authentication (OQ-26) — not asserted.

---

## 6. Credential verification and information leakage — REQ-LOG-006, D-04, D-11

### TC-53717-021 — Agent Portal refuses an unrecognized Email with the generic credential message

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify the specified generic message is shown when the Email is unrecognized` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · Functional |
| Requirement Reference | REQ-LOG-006 AC-1 |
| Decisions Applied | **D-11** |
| Azure DevOps ID | **55314** |
| Review/Lifecycle Status | Published |

**Precondition**
- The Agent Portal login form is open.
- No account exists for the email used below.

**Test Data**
- Agency Code: `AGENCY_CODE_VALID`. Email: `no.such.agent.53717@example.com`.
  Password: `NotARealPass1`.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter the valid Agency Code, the unrecognized Email and any password, then submit | Login is refused and the message `Invalid credentials. Please try again.` is displayed **verbatim** |
| 2 | Read the message carefully | It **does not** reveal that the Email was unrecognized, and does not distinguish this case from a wrong password (REQ-LOG-006, **D-11**) |
| 3 | Observe the page | The user remains on the login form and is not authenticated |

---

### TC-53717-022 — Agent Portal refuses a wrong Password with the identical generic message

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify the specified generic message is shown when a valid Email is submitted with an incorrect Password` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · Functional |
| Requirement Reference | REQ-LOG-006 AC-1, AC-3 |
| Decisions Applied | **D-10**, **D-11** |
| Azure DevOps ID | **55315** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_LOCKOUT` is **not locked** and its Failed Attempt Count is **0** (reset by an
  administrative unlock — **D-12**).

**Test Data**
- Agency Code + Email: `AGENT_LOCKOUT`'s values. Password: `WrongPass1` (arbitrary, incorrect).

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter the valid Agency Code and Email with an incorrect Password, then submit | Login is refused and the message `Invalid credentials. Please try again.` is displayed **verbatim** — identical to the unrecognized-identifier message (TC-021) |
| 2 | Read the message carefully | It does **not** indicate that the identifier was valid and only the password was wrong |
| 3 | Observe the page | The user remains on the login form and is not authenticated |

**Notes**
- Consumes **1** failed attempt against `AGENT_LOCKOUT` (REQ-LOG-006 AC-3, **D-10**). The counter
  increment itself is not observable here; it is asserted through the lockout cases (TC-032 ff.).
- Uses `AGENT_LOCKOUT` rather than `AGENT_VALID` so no positive-flow account is pushed toward
  lockout.

---

### TC-53717-023 — Agent Portal refuses a wrong Agency Code with a valid Email and Password

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify login is refused with a generic message when the Agency Code is wrong and the Email and Password are valid` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · Functional |
| Requirement Reference | REQ-LOG-005 AC-2, REQ-LOG-006 |
| Decisions Applied | **D-04**, **D-10**, **D-11**, **D-03** |
| Azure DevOps ID | **55316** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_LOCKOUT` is not locked and its Failed Attempt Count is 0.

**Test Data**
- Agency Code: `AGENCY_CODE_WRONG` (a different existing code, or a well-formed non-existent one).
- Email + Password: `AGENT_LOCKOUT`'s **correct** values.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter the **wrong** Agency Code with the correct Email and Password, then submit | Login is **refused** — a wrong Agency Code is a failed login attempt **[D-04]** |
| 2 | Read the message | **An appropriate generic message** is displayed that does **not** reveal which of the three values was wrong **[D-11, D-03]**. `Invalid credentials. Please try again.` satisfies this, but the specification does not name this case, so exact text is **not** asserted |
| 3 | Observe the page | The user remains on the login form and is not authenticated |

**Notes**
- Consumes **1** failed attempt **[D-04, D-10]**. That this attempt counts toward lockout is
  verified in TC-034 (mixed failure kinds), which is where it becomes observable.
- A message naming the Agency Code specifically would be an information-leakage defect **[D-11]**.

---

### TC-53717-024 — Admin Panel produces the identical generic message for an unknown Username and a wrong Password

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify an unrecognized Username and an incorrect Password produce the same specified generic message` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | Negative · Functional · Security |
| Requirement Reference | REQ-LOG-006 AC-1, AC-2, AC-3 |
| Decisions Applied | **D-10**, **D-11** |
| Azure DevOps ID | **55317** |
| Review/Lifecycle Status | Published |

**Precondition**
- `ADMIN_LOCKOUT` is not locked and its Failed Attempt Count is 0.

**Test Data**
- Unknown Username: `nosuchadmin53717`. Wrong password: `WrongPass1`.
- `ADMIN_LOCKOUT`'s correct Username.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Submit the unknown Username `nosuchadmin53717` with any password | Login is refused with `Invalid credentials. Please try again.` **verbatim** |
| 2 | Record the exact message text | Observation for comparison in step 4 |
| 3 | Submit `ADMIN_LOCKOUT`'s correct Username with the incorrect password `WrongPass1` | Login is refused with `Invalid credentials. Please try again.` **verbatim** |
| 4 | Compare the two messages, and any other visible difference (field highlighting, response wording, page state) | The two outcomes are **indistinguishable** — no signal reveals that the Username in step 3 exists (REQ-LOG-006 AC-1) |
| 5 | Compare with the Agent Portal result (TC-021, TC-022) | The behaviour is identical across both portals (REQ-LOG-006 AC-2) |

**Notes**
- Consumes **1** failed attempt against `ADMIN_LOCKOUT` (step 3). Step 1 targets no real account.

---

### TC-53717-025 — Agent Portal error messages do not reveal which condition caused the failure

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify the failure message is indistinguishable for an unknown Email, a wrong Password, a wrong Agency Code and a disabled account with a wrong Password` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · Security |
| Requirement Reference | REQ-LOG-006 AC-1, REQ-LOG-007 |
| Decisions Applied | **D-11**, **D-04** |
| Azure DevOps ID | **55318** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_LOCKOUT` is not locked, Failed Attempt Count 0.
- `AGENT_DISABLED` exists, is disabled, and is **not locked**.

**Test Data**
- Unknown Email `no.such.agent.53717@example.com`; `AGENT_LOCKOUT`'s valid Email;
  `AGENCY_CODE_WRONG`; `AGENT_DISABLED`'s Email; wrong password `WrongPass1`.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Submit a valid Agency Code with the **unknown Email** and any password. Record the exact message | Login refused; message recorded |
| 2 | Submit `AGENT_LOCKOUT`'s valid Agency Code and Email with the **wrong password**. Record the exact message | Login refused; message recorded |
| 3 | Submit the **wrong Agency Code** with `AGENT_LOCKOUT`'s correct Email and Password. Record the exact message | Login refused; message recorded |
| 4 | Submit `AGENT_DISABLED`'s Agency Code and Email with the **wrong password**. Record the exact message | Login refused with the **generic credential message**, **not** the authorization message — credential validation precedes the authorization check **[D-11]** |
| 5 | Compare all four recorded messages and page states | All four are **identical**. No difference in wording, field highlighting or page state reveals which condition failed **[D-11]** |

**Notes**
- Consumes **2** failed attempts on `AGENT_LOCKOUT` (steps 2 and 3) and **1** on `AGENT_DISABLED`
  (step 4) — within the allowance of 5 on each **[D-05, D-10]**.
- Individual exact texts are asserted in TC-021/TC-022; this case asserts only that the four are
  **mutually indistinguishable**, which is the security property and cannot be verified by any
  single-condition case.

---

## 7. Account authorization — REQ-LOG-007

### TC-53717-026 — Agent Portal refuses a disabled account even with the correct Password

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify the specified authorization message is shown when a disabled account submits its correct Password` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · State |
| Requirement Reference | REQ-LOG-007 AC-1 |
| Decisions Applied | **D-05**, **D-11** |
| Azure DevOps ID | **55319** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_DISABLED` is **disabled / not authorized**, is **not locked**, and its password is
  correct and **not expired**.

**Test Data**
- `AGENT_DISABLED`'s Agency Code, Email and **correct** Password.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter `AGENT_DISABLED`'s Agency Code, Email and correct Password, then submit | Login is **refused despite the correct password** (REQ-LOG-007 AC-1) |
| 2 | Read the message | `Sorry, Your account is not authorized. Please contact the system administrator.` is displayed **verbatim** — including the capital `Y` in `Your`, as specified |
| 3 | Observe the page | The user remains on the login form, is not authenticated, and is **not** routed to any OTP step |

**Notes**
- Consumes **1** failed attempt on `AGENT_DISABLED` **[D-05]** — the refusal counts toward
  lockout, so repeated runs of this case can eventually lock the disabled account. Budget 5.
- The **correct** password is essential. With a wrong password this case would produce the generic
  credential error instead — that is TC-028, and confusing the two is the single most easily
  mis-specified behaviour in this feature **[D-11]**.

---

### TC-53717-027 — Admin Panel refuses a disabled account even with the correct Password

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify the specified authorization message is shown when a disabled account submits its correct Password` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | Negative · State |
| Requirement Reference | REQ-LOG-007 AC-1, AC-2 |
| Decisions Applied | **D-05**, **D-11** |
| Azure DevOps ID | **55320** |
| Review/Lifecycle Status | Published |

**Precondition**
- `ADMIN_DISABLED` is disabled / not authorized, **not locked**, password correct and not expired.

**Test Data**
- `ADMIN_DISABLED`'s Username and **correct** Password.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter `ADMIN_DISABLED`'s Username and correct Password, then submit | Login is refused despite the correct password |
| 2 | Read the message | `Sorry, Your account is not authorized. Please contact the system administrator.` is displayed **verbatim** |
| 3 | Compare with TC-026 | The behaviour and the text are **identical to the Agent Portal** (REQ-LOG-007 AC-2) |

**Notes**
- Consumes **1** failed attempt on `ADMIN_DISABLED` **[D-05]**.

---

### TC-53717-028 — A disabled account with a wrong Password gets the generic credential error, not the authorization message

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify a disabled account submitting an incorrect Password receives the generic credential message and not the authorization message` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · State · Security |
| Requirement Reference | REQ-LOG-006 AC-1, REQ-LOG-007 AC-1 |
| Decisions Applied | **D-11**, **D-10** |
| Azure DevOps ID | **55321** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_DISABLED` is disabled and **not locked**.

**Test Data**
- `AGENT_DISABLED`'s Agency Code and Email. Password: `WrongPass1` (incorrect, arbitrary).

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter `AGENT_DISABLED`'s Agency Code and Email with an **incorrect** Password, then submit | Login is refused |
| 2 | Read the message | The **generic credential message** `Invalid credentials. Please try again.` is displayed. The authorization message `Sorry, Your account is not authorized...` **must not** appear — credential validation runs first, so the account's disabled state is not revealed **[D-11]** |
| 3 | Observe the page | The user remains on the login form and is not authenticated |

**Notes**
- This asserts the **evaluation order** decided in D-11, which overrides a literal reading of
  REQ-LOG-007 AC-1 ("rejected ... independently of whether the credentials were correct").
  Showing the authorization message here would leak that the account exists and is disabled.
- Consumes **1** failed attempt on `AGENT_DISABLED` **[D-10]**.
- Rule is portal-identical (REQ-LOG-007 AC-2); covered on one portal deliberately, since TC-026
  and TC-027 already establish the parity of the authorization path.

---

## 8. Password expiry — REQ-LOG-008, D-10

### TC-53717-029 — A correct but expired Password routes into the forced change-password flow

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify login does not complete and the forced change-password flow is presented when the correct Password has expired` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · State |
| Requirement Reference | REQ-LOG-008 AC-1 |
| Decisions Applied | **D-10**, **D-11** |
| Azure DevOps ID | **55322** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_EXPIRED` is active and authorized, **not locked**, and its password is **expired** per
  the configured expiry rule (`REQ-PWD-011`).

**Test Data**
- `AGENT_EXPIRED`'s Agency Code, Email and **correct (expired)** Password.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter `AGENT_EXPIRED`'s Agency Code, Email and correct expired Password, then submit | The credentials are accepted as valid, but **login does not complete** (REQ-LOG-008 AC-1) |
| 2 | Observe the resulting page | The user is **routed into the forced change-password flow** (`REQ-PWD-012`). The dashboard is **not** displayed |
| 3 | Observe whether the user is authenticated | The user has **no authenticated session** for the portal's protected pages — the login is incomplete until the password is changed |
| 4 | Attempt to navigate away to a protected page without changing the password | Access is not granted. **Observation** if the behaviour differs — the routing-escape behaviour is not specified |

**Notes**
- Consumes **1** failed attempt on `AGENT_EXPIRED` **[D-10]** — an expired password with
  otherwise valid credentials increments the counter. Not observable here; verified in TC-031.
- The internals of the change-password flow are out of scope (PWD spec, OQ-14). This case asserts
  only the routing, which is the in-scope trigger point.

---

### TC-53717-030 — A successful forced password change completes the login without re-entering credentials

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify login completes after a successful forced password change without the credentials being submitted again` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Positive · State |
| Requirement Reference | REQ-LOG-008 AC-2 |
| Decisions Applied | **D-10** |
| Azure DevOps ID | **55323** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_EXPIRED` is active, authorized, not locked, password expired.
- A new password can be set that satisfies the password policy. **The policy values are owned by
  Admin Settings / the PWD spec and are not available (OQ-14, OQ-22)** — if the new password is
  rejected for policy reasons the result is **BLOCKED**, not FAIL.
- The account's password will change: update environment configuration afterwards, or use an
  account provisioned for this purpose.

**Test Data**
- `AGENT_EXPIRED`'s Agency Code, Email, expired Password, and a new valid password generated at
  run time (never recorded in this file).

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in with the expired Password | The forced change-password flow is presented (as TC-029) |
| 2 | Complete the change-password flow successfully with a new valid password | The change is accepted |
| 3 | Observe the resulting page | **Login completes automatically** — the user is authenticated and the dashboard is displayed. The user is **not** returned to the login form and is **not** asked to submit credentials a second time (REQ-LOG-008 AC-2) |
| 4 | Log out and log in again with the **new** password | Login succeeds normally, confirming the new password is in effect |

**Notes**
- Crosses the boundary into the Change Password specification, which is not attached (OQ-14). Only
  the login-completion assertion belongs to this requirement; the change-password form's own
  validation is not asserted here.
- **Derived and not asserted [I]:** because REQ-LOG-010 resets the counter on full successful
  authentication, the increment from step 1 should be cleared once login completes. That is
  verified only indirectly and is not an expected result of this case.

---

### TC-53717-031 — Repeated expired-password logins reach the lockout threshold

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify five consecutive logins with an expired Password lock the account when the forced change is not completed` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · State · Boundary |
| Requirement Reference | REQ-LOG-008 AC-1, REQ-LOG-009 AC-1, AC-3 |
| Decisions Applied | **D-10**, **D-06**, **D-07** |
| Azure DevOps ID | **55324** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_EXPIRED` is expendable, **not locked**, Failed Attempt Count **0** (reset by an
  administrative unlock — **D-12**), and its password is expired.
- The account will end this case **locked for 30 minutes**.

**Test Data**
- `AGENT_EXPIRED`'s Agency Code, Email and correct expired Password.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in with the expired Password, then **abandon** the forced change-password flow and return to the login form | The forced change flow is presented; login does not complete |
| 2 | Repeat step 1 three more times (attempts 2, 3 and 4) | Each attempt routes into the forced change flow. **No lockout message appears** after the 4th attempt — the threshold is 5 (REQ-LOG-009 AC-1) |
| 3 | Perform a **5th** login attempt with the expired Password | The account is **locked**: `Your account has been locked due to too many failed login attempts. Please contact the system administrator.` is displayed **verbatim**, and the forced change flow is **not** presented |
| 4 | Attempt a 6th login with the same correct expired Password | The **lockout message** is shown again; the credentials are not evaluated and no change-password routing occurs **[D-06, D-07]** |

**Notes**
- This case exists because **D-10** overrides the specification's literal reading, in which an
  expired password is a routing outcome rather than a failed attempt. If the account is **not**
  locked at step 3, D-10 is not implemented — a genuine finding, not a test defect.
- Consumes **5** attempts and leaves the account locked. Unlock via `ADMIN_UNLOCKER` afterwards.
- Whether the lockout occurs on exactly the 5th attempt is the assertion; if it occurs earlier or
  later, record the actual count in the failure evidence.

---

## 9. Failed-attempt lockout — REQ-LOG-009, REQ-LOG-010, REQ-LOG-011

### TC-53717-032 — Agent Portal locks the account on the 5th consecutive failed attempt and not before

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify four consecutive failed attempts do not lock the account and the fifth locks it with the specified message` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · Boundary · State |
| Requirement Reference | REQ-LOG-009 AC-1, AC-2, AC-3 |
| Decisions Applied | **D-10** |
| Azure DevOps ID | **55325** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_LOCKOUT` is **not locked** and its Failed Attempt Count is **0** (reset by an
  administrative unlock — **D-12**).
- The account ends this case **locked for 30 minutes**.

**Test Data**
- `AGENT_LOCKOUT`'s Agency Code and Email, with the incorrect password `WrongPass1`.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Submit attempt **1** with the wrong password | Login refused with `Invalid credentials. Please try again.`. **No lockout message** |
| 2 | Submit attempts **2**, **3** and **4** with the wrong password | Each is refused with `Invalid credentials. Please try again.`. **No lockout message after the 4th** — the account is still not locked (boundary: 4 ≠ locked) |
| 3 | Immediately submit the **correct** password | **Login succeeds** — the account was not locked after 4 failures. This also resets the counter (REQ-LOG-010 AC-1) |
| 4 | Log out, then submit **5 consecutive** wrong-password attempts | Attempts 1–4 are refused with the generic credential message; on the **5th** attempt the account is locked and `Your account has been locked due to too many failed login attempts. Please contact the system administrator.` is displayed **verbatim** (REQ-LOG-009 AC-1, AC-3) |
| 5 | Submit the **correct** password immediately after the lock | The **lockout message** is shown again; login is refused even though the credentials are correct **[D-06, D-07]** |

**Notes**
- Steps 1–3 prove the *lower* side of the boundary (4 does not lock) and step 4 the *upper* side
  (5 locks). Step 3 deliberately resets the counter so that step 4 starts from 0 without depending
  on any other case.
- Consumes up to **9** attempts across two counter cycles; ends locked. Unlock afterwards.
- Step 5 is the minimal short-circuit check; the full locked-account behaviour is TC-035.

---

### TC-53717-033 — Admin Panel applies the same lockout threshold, message and duration

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify the account is locked on the fifth consecutive failed attempt with the specified message` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | Negative · Boundary · State |
| Requirement Reference | REQ-LOG-009 AC-1, AC-3, AC-5 |
| Decisions Applied | **D-10** |
| Azure DevOps ID | **55326** |
| Review/Lifecycle Status | Published |

**Precondition**
- `ADMIN_LOCKOUT` is not locked and its Failed Attempt Count is 0.
- The account ends this case **locked for 30 minutes**.

**Test Data**
- `ADMIN_LOCKOUT`'s Username with the incorrect password `WrongPass1`.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Submit **4** consecutive wrong-password attempts | Each is refused with `Invalid credentials. Please try again.`. **No lockout message** after the 4th |
| 2 | Submit the **5th** consecutive wrong-password attempt | The account is locked and `Your account has been locked due to too many failed login attempts. Please contact the system administrator.` is displayed **verbatim** |
| 3 | Compare the threshold and the message with the Agent Portal result (TC-032) | **Identical** — both portals share one lockout mechanism, threshold and duration (REQ-LOG-009 AC-5) |

**Notes**
- Consumes **5** attempts; ends locked. Unlock via `ADMIN_UNLOCKER` afterwards.
- The 30-minute duration is asserted in TC-037, not here, to avoid a second 30-minute wait.

---

### TC-53717-034 — Mixed kinds of failed attempts accumulate toward the same lockout threshold

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify wrong Password and wrong Agency Code attempts accumulate together and lock the account on the fifth failure` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · State · Boundary |
| Requirement Reference | REQ-LOG-009 AC-1, AC-3, REQ-LOG-005 AC-2 |
| Decisions Applied | **D-04**, **D-05**, **D-10** |
| Azure DevOps ID | **55327** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_LOCKOUT` is not locked and its Failed Attempt Count is 0.
- The account ends this case **locked for 30 minutes**.

**Test Data**
- `AGENT_LOCKOUT`'s Email (constant across all attempts — the account being counted).
- Correct Agency Code `AGENCY_CODE_VALID`, wrong Agency Code `AGENCY_CODE_WRONG`.
- Wrong password `WrongPass1`, correct Password from environment configuration.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Attempt **1**: correct Agency Code + correct Email + **wrong password** | Refused with the generic credential message; not locked |
| 2 | Attempt **2**: correct Agency Code + correct Email + **wrong password** | Refused; not locked |
| 3 | Attempt **3**: **wrong Agency Code** + correct Email + **correct password** | Refused with a generic message that does not reveal which value was wrong **[D-04, D-11]**; not locked |
| 4 | Attempt **4**: **wrong Agency Code** + correct Email + **correct password** | Refused; **still not locked** — 4 mixed failures do not reach the threshold |
| 5 | Attempt **5**: correct Agency Code + correct Email + **wrong password** | The account is **locked** and `Your account has been locked due to too many failed login attempts. Please contact the system administrator.` is displayed **verbatim** — the two failure kinds accumulated into one counter **[D-04, D-05]** |
| 6 | Attempt **6**: correct Agency Code, Email and **correct password** | The lockout message is shown; login is refused **[D-06, D-07]** |

**Notes**
- This is the observable proof of **D-04** and **D-05**: if only wrong passwords counted, the
  account would not be locked at step 5 (only 3 wrong-password attempts occurred).
- The analysis §10 example lists "1 unrecognized identifier" as one of the five contributing
  kinds. **That kind cannot contribute to a specific account's counter** — an unrecognized
  identifier addresses no account, so there is no counter to increment. This case therefore uses
  wrong-password and wrong-Agency-Code attempts against **one constant Email**. Worth raising
  with the author of the analysis; it does not change any decision.
- Consumes **5** attempts; ends locked. Unlock afterwards.

---

### TC-53717-035 — A locked account is refused without its credentials being evaluated

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify a locked account shows the lockout message for correct and incorrect credentials alike and its credentials are never evaluated` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · State · Security |
| Requirement Reference | REQ-LOG-009 AC-3 |
| Decisions Applied | **D-06**, **D-07**, **D-11** |
| Azure DevOps ID | **55328** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_LOCKOUT` is not locked and its Failed Attempt Count is 0 at the start.
- The account ends this case **locked**.

**Test Data**
- `AGENT_LOCKOUT`'s Agency Code, Email and correct Password; wrong password `WrongPass1`;
  `AGENCY_CODE_WRONG`.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Lock the account: submit 5 consecutive wrong-password attempts | The 5th attempt shows the lockout message **verbatim** |
| 2 | Submit the **correct** Agency Code, Email and **correct Password** | The **lockout message** is shown. Login is **refused** and the dashboard is **not** displayed, even though the credentials are valid **[D-06, D-07]** |
| 3 | Submit the correct Email with a **wrong password** | The **same lockout message** is shown — **not** the generic credential error. The response is indistinguishable from step 2 **[D-07]** |
| 4 | Submit a **wrong Agency Code** with the correct Email and Password | The **same lockout message** is shown |
| 5 | Compare steps 2, 3 and 4 | All three are **identical** — while locked, no other login outcome is observable |
| 6 | Wait 2–3 minutes, then submit the correct credentials again | The lockout message is still shown — the lock persists for its full 30 minutes and the attempts in steps 2–5 have **not** extended or reset anything observable |

**Notes**
- Steps 2–5 are the observable evidence that the **lock check precedes credential
  authentication [D-06]**. If step 2 succeeded, D-06 is not implemented.
- **D-07** also states these attempts do **not** increment the counter. That is not directly
  observable — the counter is invisible and the account is already locked. The check available at
  UI level is TC-038: after the lockout expires, the counter must be 0 regardless of how many
  attempts were made while locked.
- Consumes 5 attempts plus 4 blocked attempts; ends locked.

---

### TC-53717-036 — The lockout is tracked per user and survives a change of device or browser context

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify a locked account remains locked from a different browser context or device` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · State · Security |
| Requirement Reference | REQ-LOG-009 AC-4 |
| Decisions Applied | **D-06**, **D-07** |
| Azure DevOps ID | **55329** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_LOCKOUT` is not locked, counter 0.
- Two independent browser contexts, **Context A** and **Context B**. A different network or device
  for Context B if available.
- The account ends this case **locked**.

**Test Data**
- `AGENT_LOCKOUT`'s Agency Code, Email, correct Password; wrong password `WrongPass1`.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | In **Context A**, submit 5 consecutive wrong-password attempts | The account is locked; the lockout message is shown |
| 2 | In **Context B** (fresh cookies and storage, different device or network if available), submit the **correct** credentials | The **lockout message** is shown. The lock is **not** bypassed by the new context — it is tracked per user, not per device or IP (REQ-LOG-009 AC-4) |
| 3 | In Context B, submit a wrong password | The lockout message is shown |
| 4 | Record the network/device used for Context B | Observation — note whether a genuinely different IP was used, since a shared IP weakens the per-IP half of the assertion |

**Notes**
- Consumes 5 attempts plus 2 blocked attempts; ends locked.
- Where a second device or network is unavailable, a fresh isolated browser context still verifies
  the per-device half. Record the limitation rather than claiming full AC-4 coverage.

---

### TC-53717-037 — The lockout expires after 30 minutes and a successful login leaves no residual effect

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify the account can log in successfully after the 30-minute lockout period expires` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Positive · State · Boundary |
| Requirement Reference | REQ-LOG-009 AC-2, REQ-LOG-010 AC-2 |
| Decisions Applied | **D-08** |
| Azure DevOps ID | **55330** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_LOCKOUT` is not locked, counter 0.
- **30 minutes of wall-clock time**, or a controlled way to advance/expire the lockout, must be
  available. **If neither is available the result is BLOCKED, not FAIL.**

**Test Data**
- `AGENT_LOCKOUT`'s Agency Code, Email, correct Password; wrong password `WrongPass1`.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Lock the account with 5 consecutive wrong-password attempts and record the **timestamp** of the 5th | The lockout message is shown; the lock start time is recorded |
| 2 | Attempt a login with the correct credentials after ~25 minutes | The **lockout message** is still shown — the lock has not expired early (REQ-LOG-009 AC-2) |
| 3 | Wait until **more than 30 minutes** have passed since the timestamp in step 1, then submit the **correct** credentials | **Login succeeds** — the lockout expired automatically without any administrative action, and the user reaches the dashboard |
| 4 | Observe the session and the account after login | The login is fully normal; no residual restriction from the earlier lockout remains (REQ-LOG-010 AC-2) |

**Notes**
- Step 2 is the lower boundary (still locked before 30 minutes); step 3 the upper (unlocked
  after). A single attempt inside the window is enough — attempts while locked change nothing
  **[D-07]**.
- The **counter reset** on expiry is a separate assertion, verified in TC-038 — a successful login
  in step 3 would reset the counter anyway and so cannot distinguish D-08's behaviour.
- Consumes 5 attempts plus 1 blocked attempt. Ends **unlocked and logged in**.

---

### TC-53717-038 — The Failed Attempt Count resets to zero when the lockout expires

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify four further failed attempts do not re-lock the account after a lockout expires and the fifth does` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · State · Boundary |
| Requirement Reference | REQ-LOG-009 AC-1, AC-2, REQ-LOG-010 |
| Decisions Applied | **D-08**, **D-07** |
| Azure DevOps ID | **55331** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_LOCKOUT` is not locked, counter 0.
- **30 minutes of wall-clock time**, or a controlled way to expire the lockout. **Otherwise
  BLOCKED, not FAIL.**
- The account ends this case **locked again**.

**Test Data**
- `AGENT_LOCKOUT`'s Agency Code and Email with the wrong password `WrongPass1`.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Lock the account with 5 consecutive wrong-password attempts | The lockout message is shown |
| 2 | While locked, make 2 further attempts with the wrong password | The lockout message is shown each time; these attempts must **not** affect the counter **[D-07]** |
| 3 | Wait for the 30-minute lockout to expire | The lock lifts (verified by the attempt in step 4 no longer showing the lockout message) |
| 4 | Submit **4** consecutive wrong-password attempts, **without** any successful login in between | Each is refused with `Invalid credentials. Please try again.` and the account is **not** re-locked — the counter restarted from **zero** on expiry, giving a full allowance of 5 **[D-08]** |
| 5 | Submit a **5th** wrong-password attempt | The account is locked again with the lockout message **verbatim** |

**Notes**
- This is the observable proof of **D-08**, which overrides the specification's literal reading
  (REQ-LOG-010 reset the counter only on full success). Under that literal reading the account
  would re-lock on the **first** attempt in step 4 — if it does, D-08 is not implemented.
- Step 2 also gives the only UI-level check of **D-07**'s "no further increment": if attempts made
  while locked were counted, step 4 would re-lock early.
- No successful login may occur between steps 3 and 5, or the reset being verified would be
  REQ-LOG-010's success reset instead of D-08's expiry reset.
- Consumes 5 + 2 blocked + 5 attempts; ends locked.

---

### TC-53717-039 — An administrator can view an account's lock status and unlock it on demand

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify an authorized administrator can view a locked account's status and unlock it before the lockout expires` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | Positive · State |
| Requirement Reference | REQ-LOG-011 AC-1, AC-2 |
| Decisions Applied | **D-12** |
| Azure DevOps ID | **55332** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_LOCKOUT` is not locked, counter 0.
- `ADMIN_UNLOCKER` can sign in and is authorized to view lock status and unlock accounts.
  **Where that function lives in the Admin Panel is not documented (OQ-13)** — if it cannot be
  located, the result is **BLOCKED, not FAIL**, and the location found should be recorded so
  OQ-13 can be closed.

**Test Data**
- `AGENT_LOCKOUT`'s Agency Code, Email, correct Password; wrong password `WrongPass1`.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Lock `AGENT_LOCKOUT` with 5 consecutive wrong-password attempts | The lockout message is shown |
| 2 | Sign in to the Admin Panel as `ADMIN_UNLOCKER` and locate the account's lock status | The administrator can see that `AGENT_LOCKOUT` is **currently locked** (REQ-LOG-011 AC-1) |
| 3 | Unlock the account | The unlock action succeeds and the account is shown as **not locked** |
| 4 | **Well within the original 30-minute window**, log in as `AGENT_LOCKOUT` with the correct credentials | **Login succeeds** — the unlock took effect before the natural expiry (REQ-LOG-011 AC-2) |
| 5 | Record where the unlock function was found | Observation — this closes OQ-13 for future runs |

**Notes**
- Step 4 must happen inside the 30 minutes, otherwise a natural expiry would produce the same
  result and the case would prove nothing.
- The counter reset caused by the unlock is asserted separately in TC-040; the successful login in
  step 4 resets the counter anyway and cannot distinguish it.
- Consumes 5 attempts; ends unlocked.

---

### TC-53717-040 — An administrative unlock resets the Failed Attempt Count to zero

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify four further failed attempts do not re-lock the account after an administrative unlock and the fifth does` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · State · Boundary |
| Requirement Reference | REQ-LOG-009 AC-1, REQ-LOG-011 AC-2, REQ-LOG-010 |
| Decisions Applied | **D-12** |
| Azure DevOps ID | **55333** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_LOCKOUT` is not locked, counter 0.
- `ADMIN_UNLOCKER` can unlock accounts (OQ-13 — **BLOCKED** if the function cannot be located).
- The account ends this case **locked again**.

**Test Data**
- `AGENT_LOCKOUT`'s Agency Code and Email with the wrong password `WrongPass1`.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Lock `AGENT_LOCKOUT` with 5 consecutive wrong-password attempts | The lockout message is shown |
| 2 | As `ADMIN_UNLOCKER`, unlock the account | The account is unlocked |
| 3 | **Without any successful login**, submit **4** consecutive wrong-password attempts | Each is refused with `Invalid credentials. Please try again.` and the account is **not** re-locked — the unlock reset the counter to zero **[D-12]** |
| 4 | Submit a **5th** wrong-password attempt | The account is locked again with the lockout message **verbatim** |
| 5 | Compare with TC-038 | The post-unlock behaviour is **identical** to the post-expiry behaviour — both reset paths give a full allowance of 5 **[D-08, D-12]** |

**Notes**
- Observable proof of **D-12**, which the specification does not state. Under the specification's
  literal reading, the account would re-lock on the first attempt in step 3.
- No successful login may occur between steps 2 and 4, or REQ-LOG-010's success reset would be
  what is verified instead.
- Consumes 5 + 5 attempts; ends locked. Unlock afterwards.

---

### TC-53717-041 — The Failed Attempt Count resets after a fully successful login

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify prior failed attempts are cleared by a successful login so four further failures do not lock the account` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Positive · State · Boundary |
| Requirement Reference | REQ-LOG-010 AC-1 |
| Decisions Applied | **D-10** |
| Azure DevOps ID | **55334** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_LOCKOUT` is not locked, counter 0.
- **OTP is disabled** for its user type, so a successful password login is a *fully* successful
  login (REQ-LOG-010 AC-1). The OTP variant is covered by TC-042.
- The account ends this case **locked**.

**Test Data**
- `AGENT_LOCKOUT`'s Agency Code, Email, correct Password; wrong password `WrongPass1`.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Submit **4** consecutive wrong-password attempts | Each is refused with the generic credential message; the account is not locked |
| 2 | Submit the **correct** credentials | Login completes and the dashboard is displayed |
| 3 | Log out and submit **4** consecutive wrong-password attempts | Each is refused and the account is **not** locked — the successful login cleared the earlier 4 failures (REQ-LOG-010 AC-1) |
| 4 | Submit a **5th** wrong-password attempt | The account is locked with the lockout message **verbatim**, confirming the counter restarted from zero and not from 4 |

**Notes**
- Without step 4, step 3 alone could not distinguish "counter reset" from "counter at 4 but the
  threshold misread".
- Consumes 4 + 5 attempts; ends locked. Unlock afterwards.

---

### TC-53717-042 — A failed OTP attempt does not increment the password Failed Attempt Count

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify a failed OTP verification does not count toward the password lockout threshold` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · State |
| Requirement Reference | REQ-LOG-010 AC-1, AC-3, REQ-LOG-012 AC-7 |
| Decisions Applied | — |
| Azure DevOps ID | **55335** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_OTP` is active, authorized, **not locked**, counter **0**, password valid and not expired.
- **OTP is enabled** for its user type and the device/browser context has **no** valid
  trusted-device record (fresh context).
- The OTP delivery channel is reachable, and the OTP spec's own retry limit is not exhausted by
  the single wrong OTP used here. **If the account hits OTP lockout instead, record it and treat
  the case as BLOCKED** — OTP retry limits are owned by the OTP specification (OQ-14).

**Test Data**
- `AGENT_OTP`'s Agency Code, Email, correct Password; wrong password `WrongPass1`; an incorrect
  OTP value such as `000000` (adjust length to the OTP actually issued).

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Submit **4** consecutive wrong-password attempts | Each is refused with the generic credential message; the account is not locked. The counter now stands at 4 |
| 2 | Submit the **correct** credentials | The credentials are accepted and the **OTP step is presented** — login has not completed, so the counter is **not** yet reset (REQ-LOG-010 AC-1) |
| 3 | Enter an **incorrect** OTP | OTP verification fails, login does **not** complete, and the user remains in the OTP flow (REQ-LOG-012 AC-7) |
| 4 | Return to the login form and submit the **correct** credentials again | The **OTP step is presented again**. The **lockout message is not shown** — the failed OTP attempt did **not** push the password counter from 4 to 5 (REQ-LOG-010 AC-3) |
| 5 | Complete the OTP correctly | Login completes, the dashboard is displayed, and the password counter is now reset (REQ-LOG-010 AC-1) |
| 6 | Log out, then submit **4** consecutive wrong-password attempts | The account is **not** locked — confirming step 5 reset the counter after the *full* login including OTP |

**Notes**
- Steps 1–4 are the precise assertion: with the counter deliberately at 4, a failed OTP that
  incremented it would lock the account, which step 4 would expose immediately.
- Steps 5–6 additionally verify REQ-LOG-010 AC-1's "including OTP verification when applicable"
  half, which TC-041 cannot cover because it runs with OTP disabled.
- Consumes 4 + 4 password attempts and 1 failed OTP attempt. Ends unlocked. **A trusted-device
  record is created by step 5** (REQ-LOG-015 AC-1) — clear the browser context afterwards or
  expect the next OTP case on this device to be bypassed.

---

## 10. OTP step-up and trusted device — REQ-LOG-012, REQ-LOG-015

### TC-53717-043 — OTP is required after valid credentials when OTP is enabled and the device is not trusted

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify the OTP step is presented after valid credentials when OTP is enabled for the user type and the device has no trusted-device record` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Positive · State |
| Requirement Reference | REQ-LOG-012 AC-2, AC-4, AC-6 |
| Decisions Applied | — |
| Azure DevOps ID | **55336** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_OTP` is active, authorized, not locked, password valid and not expired.
- **OTP is enabled** for its user type.
- A **fresh browser context** with no trusted-device record for this account/device.

**Test Data**
- `AGENT_OTP`'s Agency Code, Email and correct Password.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the Agent Portal login form in a fresh browser context | The form is displayed |
| 2 | Enter valid credentials and submit | The credentials are accepted. **Login does not complete** — the **OTP step is presented** (REQ-LOG-012 AC-4, AC-6) |
| 3 | Observe the page before entering any OTP | The dashboard is **not** displayed and the user is **not** authenticated for protected pages |
| 4 | Observe the OTP step's contents | Observation only — delivery channels and selection behaviour belong to the OTP specification (OQ-14) and are not asserted here |
| 5 | Abandon the flow without entering an OTP | Login remains incomplete |

**Notes**
- Consumes no failed password attempt (the credentials were valid). An abandoned OTP flow is not
  a failed password attempt either.

---

### TC-53717-044 — Successful OTP completes the login and auto-creates a trusted device that bypasses OTP next time

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify a successful OTP completes the login and a trusted-device record is created automatically so the next login from the same device skips OTP` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Positive · State |
| Requirement Reference | REQ-LOG-012 AC-5, AC-7, REQ-LOG-015 AC-1, AC-2 |
| Decisions Applied | — |
| Azure DevOps ID | **55337** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_OTP` as in TC-043; **OTP enabled**; a **fresh browser context** with no trusted-device
  record.
- Access to the OTP delivery channel.

**Test Data**
- `AGENT_OTP`'s Agency Code, Email, correct Password; the OTP received at run time (never recorded
  in this file).

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in with valid credentials in the fresh context | The OTP step is presented |
| 2 | Observe the OTP step for any "remember this device" / "trust this device" option | **No user action is required or offered** to create a trusted device — the record is created unconditionally on success (REQ-LOG-015 AC-1). If such an option exists, record it as an observation |
| 3 | Enter the **correct** OTP and submit | OTP verification succeeds, **login completes**, and the dashboard is displayed (REQ-LOG-012 AC-7) |
| 4 | Log out, then log in again **from the same browser context** with the same valid credentials | **The OTP step is skipped** and login completes directly — a valid trusted-device record was created automatically in step 3 (REQ-LOG-012 AC-5, REQ-LOG-015 AC-2) |
| 5 | In a **different, fresh** browser context, log in with the same credentials | The **OTP step is presented** — the trusted-device record applies to the device/context that completed OTP, not to the account globally |

**Notes**
- Steps 4 and 5 together are what proves a *device-scoped* record was created without user action;
  step 4 alone could be explained by a session artefact.
- The **15-day validity** boundary (REQ-LOG-015 AC-4) is **not covered** — see *Deliberately not covered*. Whether each
  successful OTP renews the 15 days, and whether clearing browser data revokes the record, is
  undefined (OQ-12); step 5's isolation is the closest observable proxy.

---

### TC-53717-045 — A failed OTP does not complete the login

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify login does not complete and the user remains in the OTP flow when an incorrect OTP is submitted` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · State |
| Requirement Reference | REQ-LOG-012 AC-7 |
| Decisions Applied | — |
| Azure DevOps ID | **55338** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_OTP` as in TC-043; **OTP enabled**; fresh browser context, no trusted-device record.

**Test Data**
- `AGENT_OTP`'s Agency Code, Email, correct Password; incorrect OTP `000000` (match the issued
  OTP's length).

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in with valid credentials | The OTP step is presented |
| 2 | Enter an **incorrect** OTP and submit | OTP verification fails. **Login does not complete**, the dashboard is not displayed, and the user **remains in the OTP flow** (REQ-LOG-012 AC-7) |
| 3 | Read the message shown | **An appropriate message** indicates the OTP was not accepted. Exact wording is **not** asserted — no OTP text is defined in this specification **[D-03]** |
| 4 | Observe whether a trusted-device record was created: log out, then log in again from the **same** context | The **OTP step is presented again** — a failed OTP creates **no** trusted-device record (REQ-LOG-015 AC-1 requires *successful* verification) |
| 5 | Do not exhaust the OTP retry allowance | Retry and resend limits and OTP lockout are owned by the OTP specification (OQ-14) and are **not** asserted here |

**Notes**
- The password Failed Attempt Count is unaffected by the failed OTP; that assertion belongs to
  TC-042, where the counter is positioned at 4 to make it observable.

---

### TC-53717-046 — Remember Me neither bypasses OTP nor creates a trusted device

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify selecting Remember Me does not bypass OTP verification and does not create a trusted-device record` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · State · Security |
| Requirement Reference | REQ-LOG-015 AC-3, REQ-LOG-019 AC-3, REQ-LOG-012 AC-4 |
| Decisions Applied | — |
| Azure DevOps ID | **55339** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_OTP` as in TC-043; **OTP enabled**; a **fresh browser context** with **no**
  trusted-device record.

**Test Data**
- `AGENT_OTP`'s Agency Code, Email and correct Password.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | In a fresh context, enter valid credentials, **select Remember Me**, and submit | The **OTP step is presented** — Remember Me does not bypass OTP (REQ-LOG-015 AC-3) |
| 2 | Abandon the OTP flow, return to the login form, and submit the valid credentials again with Remember Me still selected | The **OTP step is presented again** — selecting Remember Me created no trusted-device record (REQ-LOG-019 AC-3) |
| 3 | Observe the login form on the second visit | The identifier fields are prefilled from Remember Me, and the Password is empty — the two mechanisms are independent (REQ-LOG-019 AC-1, AC-2) |

**Notes**
- Prefill itself is asserted in TC-048; step 3 here only confirms that Remember Me *was* active,
  so that step 1's and step 2's OTP requirement cannot be dismissed as Remember Me not working.

---

## 11. CAPTCHA — REQ-LOG-017

### TC-53717-047 — No CAPTCHA is presented at any point in the login flow

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify no CAPTCHA challenge is presented during credential entry, after repeated failures, at lockout or during OTP entry` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative requirement · Functional |
| Requirement Reference | REQ-LOG-017 AC-1 |
| Decisions Applied | — |
| Azure DevOps ID | **55340** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_LOCKOUT` is not locked, counter 0 (used for the failure and lockout steps).
- `AGENT_OTP` is available with **OTP enabled** and a fresh browser context (used for the OTP step).
- The account used for the lockout steps ends this case **locked**.

**Test Data**
- `AGENT_LOCKOUT`'s Agency Code and Email with wrong password `WrongPass1`;
  `AGENT_OTP`'s valid credentials.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the Agent Portal login form | **No CAPTCHA** element or challenge is present during credential entry |
| 2 | Submit 4 consecutive wrong-password attempts | Each is refused with the generic credential message and **no CAPTCHA appears** — repeated failures do not introduce a challenge |
| 3 | Submit a 5th wrong-password attempt to trigger the lockout | The lockout message is shown and **no CAPTCHA appears** |
| 4 | In a fresh context, log in as `AGENT_OTP` and reach the OTP step | The OTP step is presented and **no CAPTCHA appears** during OTP entry (REQ-LOG-017 AC-1) |
| 5 | Repeat step 1 on the **Admin Panel** login form | **No CAPTCHA** is present there either |

**Notes**
- A testable **negative** requirement: a CAPTCHA appearing anywhere in this flow is a defect, even
  though `CAPTCHA_STATUS` exists in platform configuration — that setting governs Agent Portal
  Wallet Top-up, not Login (REQ-LOG-017 AC-2).
- Consumes 5 attempts on `AGENT_LOCKOUT`; ends locked. Unlock afterwards.
- Step 5 crosses portals deliberately — the requirement says "at any point in the login flow", and
  a separate Admin-only case would assert the same absence twice.

---

## 12. Remember Me — REQ-LOG-019

### TC-53717-048 — Agent Portal Remember Me prefills Email and Agency Code but never the Password

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify Remember Me prefills Email and Agency Code on the next visit and never prefills the Password` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Positive · State · Security |
| Requirement Reference | REQ-LOG-019 AC-1, AC-2 |
| Decisions Applied | — |
| Azure DevOps ID | **55341** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_VALID` is usable for a positive login; OTP disabled.
- A browser context with **no** previously remembered identifier for this portal.

**Test Data**
- `AGENT_VALID`'s Agency Code, Email and Password.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the login form in a clean context | Agency Code, Email and Password are all **empty** |
| 2 | Enter valid credentials, **select Remember Me**, and submit | Login completes and the dashboard is displayed |
| 3 | Log out and return to the login form | **Email and Agency Code are prefilled** with the values used in step 2 (REQ-LOG-019 AC-1) |
| 4 | Inspect the Password field | The Password field is **empty**. No password value is prefilled, and none is present in the field's underlying value (REQ-LOG-019 AC-2) |
| 5 | Submit the form using only the prefilled identifiers, leaving the Password empty | Login is **refused** with mandatory-field feedback — proving the password was genuinely not retained |

**Notes**
- Step 5 is the assertion that matters: a prefilled-but-masked password would pass step 4 by
  appearance alone.
- Retention period and survival across a browser restart are **not covered** (OQ-11) — see *Deliberately not covered*.

---

### TC-53717-049 — Admin Panel Remember Me prefills the Username but never the Password

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify Remember Me prefills the Username on the next visit and never prefills the Password` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | Positive · State · Security |
| Requirement Reference | REQ-LOG-019 AC-1, AC-2 |
| Decisions Applied | — |
| Azure DevOps ID | **55342** |
| Review/Lifecycle Status | Published |

**Precondition**
- `ADMIN_VALID` is usable for a positive login; OTP disabled.
- A browser context with no previously remembered identifier for this portal.

**Test Data**
- `ADMIN_VALID`'s Username and Password.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the login form in a clean context | Username and Password are **empty** |
| 2 | Enter valid credentials, **select Remember Me**, and submit | Login completes and the dashboard is displayed |
| 3 | Log out and return to the login form | The **Username is prefilled** with the value used in step 2 (REQ-LOG-019 AC-1) |
| 4 | Inspect the Password field | The Password field is **empty** (REQ-LOG-019 AC-2) |
| 5 | Submit using only the prefilled Username, leaving the Password empty | Login is refused with `Password is required.` — the specified message for this exact condition (REQ-LOG-003 AC-1), proving the password was not retained |

---

### TC-53717-050 — Identifiers are not prefilled when Remember Me is not selected

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify identifier fields are not prefilled when Remember Me is not selected, and record what happens to previously remembered values` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Negative · State |
| Requirement Reference | REQ-LOG-019 AC-1 |
| Decisions Applied | — |
| Azure DevOps ID | **55343** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_VALID` is usable for a positive login; OTP disabled.
- A browser context with **no** previously remembered identifier at the start.

**Test Data**
- `AGENT_VALID`'s Agency Code, Email and Password.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | In a clean context, log in with valid credentials and **Remember Me not selected** | Login completes |
| 2 | Log out and return to the login form | Agency Code, Email and Password are all **empty** — nothing was remembered, because Remember Me was not selected (REQ-LOG-019 AC-1 applies only when it is selected) |
| 3 | Log in again **with** Remember Me selected, log out, then log in once more with Remember Me **deselected**, log out and return to the form | **Observation only.** Record whether the previously remembered identifiers are still prefilled, cleared, or updated. The specification does not define whether deselecting clears earlier values (OQ-11) — **assert nothing** |

**Notes**
- Step 2 is the assertable complement of AC-1: identifiers must not be retained when the option was
  not chosen. Step 3 is the undefined part and is recorded, not judged, so OQ-11 can be closed by a
  human decision later.

---

## 13. Deliberately undecided behaviour — observation only

These two cases exist because the analysis records the behaviour as **deliberately undecided**.
They must never be turned into assertions without a human decision, and they can never FAIL on
the undecided part — only on a crash or a missing message.

### TC-53717-051 — Whether pre-authentication validation failures move the Failed Attempt Count (OQ-26)

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Admin Panel] Verify and record whether repeated pre-authentication validation failures contribute to the account lockout counter` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Admin Panel |
| Test Type | Observation · State |
| Requirement Reference | REQ-LOG-003, REQ-LOG-004, REQ-LOG-009 — **behaviour undecided (OQ-26)** |
| Decisions Applied | **D-10** (which deliberately left this open) |
| Azure DevOps ID | **55344** |
| Review/Lifecycle Status | Published |

**Precondition**
- `ADMIN_LOCKOUT` is **not locked** and its Failed Attempt Count is **0** (reset by an
  administrative unlock).
- The account may end this case **locked**, depending on the observed behaviour.

**Test Data**
- `ADMIN_LOCKOUT`'s Username. Invalid inputs: empty Password; the password `Not A Pass1`
  (contains spaces); the Username `admin user` (contains a space). Wrong password `WrongPass1`.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Submit `ADMIN_LOCKOUT`'s Username with an **empty Password** | Refused with `Password is required.` **verbatim** — this part **is** asserted (REQ-LOG-003 AC-1) |
| 2 | Repeat step 1 three more times, so **4** pre-authentication validation failures have occurred | Each is refused with the same message. **No assertion** is made about the counter |
| 3 | Now submit **one** genuine credential failure — the Username with the wrong password `WrongPass1` | **Observation.** Record whether the account is now **locked** (which would mean the 4 validation failures counted, reaching 5) or refused with `Invalid credentials. Please try again.` (which would mean they did not count). **Both outcomes are acceptable** — the source does not define this (OQ-26) |
| 4 | If the account is not locked, submit 4 more wrong-password attempts and record on which attempt the lockout occurs | Observation. Record the exact attempt number that triggered the lockout |
| 5 | Reset the account, then repeat steps 1–3 using a **space-containing password** and then a **space-containing Username** instead of an empty Password | Observation. Record whether the different kinds of validation failure behave the same way |

**Notes**
- **The purpose of this case is to produce the evidence that answers OQ-26.** Its recorded result
  should be taken to the human as a decision request, after which it can become an assertive case.
- **It must not be reported as a FAIL** because of counter behaviour either way. It fails only if a
  validation failure produces no message at all, or the application errors.
- May consume up to 9 attempts and may end locked. Unlock afterwards.

---

### TC-53717-052 — Precedence when an account is both disabled and password-expired (OQ-27)

| | |
|---|---|
| **Title** | `[NBO][Authentication][Login - Agent Portal] Verify and record which check wins when a disabled account with valid credentials also has an expired Password` |
| Project / Module / Feature-Page | NBO / Authentication / Login - Agent Portal |
| Test Type | Observation · State |
| Requirement Reference | REQ-LOG-007 AC-1, REQ-LOG-008 AC-1 — **precedence undecided (OQ-27)** |
| Decisions Applied | **D-11** (which ordered the checks but left this pair unresolved) |
| Azure DevOps ID | **55345** |
| Review/Lifecycle Status | Published |

**Precondition**
- `AGENT_DISABLED_EXPIRED` exists: **disabled / unauthorized** *and* holding an **expired**
  password, **not locked**, and its correct password is known.
- **If such an account cannot be provisioned, the result is BLOCKED, not FAIL.** It is a
  deliberately constructed compound state, not a naturally occurring one.

**Test Data**
- `AGENT_DISABLED_EXPIRED`'s Agency Code, Email and **correct (expired)** Password.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Submit the account's Agency Code, Email and correct expired Password | The credentials are valid, so the flow reaches the remaining account/password checks **[D-11]**. **Login must not complete** and the dashboard must not be displayed — that part **is** asserted |
| 2 | Record which outcome occurred | **Observation.** Either the authorization message `Sorry, Your account is not authorized. Please contact the system administrator.` (authorization wins) **or** routing into the forced change-password flow (expiry wins). **Neither is asserted** — the specification does not order these two checks (OQ-27) |
| 3 | If the forced change-password flow is presented, abandon it | Observation — record whether the account can proceed any further despite being disabled. A disabled account *completing* login through the forced-change path **would** be a defect and must be reported |
| 4 | Submit the same account with a **wrong** password | The **generic credential message** is expected — credential validation precedes both remaining checks **[D-11]**. This part **is** asserted |

**Notes**
- Step 4 is assertable because D-11 settled it; steps 1–3 are the undecided part.
- The one genuine defect this case can find: a disabled account reaching an authenticated session
  by any route. That is asserted in steps 1 and 3.
- Consumes up to 2 failed attempts **[D-05, D-10]**.

---

## Rejected test cases

None. Rejected cases move here with their status set to `Rejected`, keeping their original ID so
it is never reused, and stay recorded for traceability.

*(empty)*

---

## AI self-review record

Performed after generating all 52 cases, before any human review
(`docs/product-decisions.md` §6). Reviewed as a Senior QA Engineer against the analysis, the
confirmed decisions, and the source snapshot.

### What was checked

| Check | Result |
|---|---|
| Every requirement in analysis §14 is covered or explicitly excluded with a reason | Pass — see the coverage map and the exclusions table |
| Exact message text asserted **only** for the nine specified strings | Pass — 9 strings asserted verbatim; all other messages assert presence only **[D-03]** |
| No invented business rule, error text, limit, or expected behaviour | Pass |
| Nothing asserted about a deliberately undecided behaviour (OQ-26, OQ-27, OQ-03, OQ-11) | Pass — those are observation-only steps in TC-017, TC-050, TC-051, TC-052 |
| No case depends on another having run (`product-decisions.md` §4) | Pass — every lockout/expiry case builds its own state and states its own reset precondition |
| No credentials or environment URLs in the file (§4, §12) | Pass — accounts referenced by handle; all literal values are arbitrary strings belonging to no account |
| Title convention `[Project][Module][Feature/Page] <Scenario>` on every case | Pass — 52/52 |
| Structured fields present and consistent with the title | Pass — 52/52 |
| Expected results attached to individual steps (§3) | Pass |
| Duplicates | None remaining — see the corrections below |
| Counter assertions only where observable | Pass — no step asserts a counter value; all counter behaviour is asserted through lockout occurrence |

### Corrections made during the self-review

These are changes the review produced, recorded because a self-review with no findings is not a
review.

1. **A factual error in the analysis was found, not copied.** Analysis §10 offers "2 wrong
   passwords + 2 wrong Agency Codes + 1 unrecognized identifier = 5 → locked" as a mixed-failure
   example. An **unrecognized identifier addresses no account**, so it cannot increment any
   specific account's counter. TC-034 therefore uses wrong-password and wrong-Agency-Code attempts
   against **one constant Email**, and records the discrepancy in its notes. Reproducing the
   analysis's example would have produced a case that fails for a reason unrelated to the
   requirement.
2. **Counter increments are no longer asserted where they cannot be seen.** An earlier draft
   asserted "the Failed Attempt Count is incremented" in the single-failure cases (TC-022, TC-023,
   TC-026, TC-029). The counter is system-managed and never displayed (REQ-LOG-001 AC-2), so those
   assertions were unverifiable at UI level. They were demoted to notes, and the increment is now
   asserted only where it becomes observable — TC-031, TC-034, TC-038, TC-040, TC-041, TC-042.
3. **Duplicate cases merged.**
   - A standalone "OTP disabled → direct to Dashboard" case was dropped: it is exactly the happy
     path, so REQ-LOG-012 AC-3 is asserted inside TC-005 and TC-006 instead.
   - A standalone "trusted device bypasses OTP" case was merged into TC-044, because the bypass is
     the only way to observe that the record was auto-created.
   - Four separate Agent Portal mandatory-field cases became one four-step case (TC-012); the
     assertion is the same rule per field and four Azure DevOps items would carry no extra
     diagnostic value.
4. **Boundaries made two-sided.** TC-032, TC-038, TC-040 and TC-041 originally asserted only that
   the lockout *happens*. Each now also asserts that it does **not** happen at 4, which is the half
   that actually detects an off-by-one threshold.
5. **A false expectation was removed from TC-028.** An early draft expected the authorization
   message for a disabled account with a wrong password — a literal reading of REQ-LOG-007 AC-1.
   **D-11** makes the generic credential error correct, and the analysis flags this as the feature's
   most easily mis-specified case. Fixed, with the reason recorded in the case.
6. **Practical-constraint cases now distinguish BLOCKED from FAIL.** TC-016 (legacy account),
   TC-030 (password policy), TC-037/TC-038 (the 30-minute wait), TC-039/TC-040 (the unlock
   function's location) and TC-052 (compound account) each state that an unavailable prerequisite
   is **BLOCKED**, per `docs/product-decisions.md` §8. Without that, an unobtainable prerequisite
   would be reported as a product failure.
7. **Attempt budgets added.** Every case that consumes more than one failed attempt states how
   many, and every case that leaves an account locked says so. Because **D-04/D-05/D-10** make
   almost every negative case consume part of the same five-attempt allowance, cases that omit
   this silently corrupt the next case's starting state.
8. **Post-reset cases forbid an intervening successful login.** TC-038 and TC-040 verify D-08 and
   D-12 respectively; a successful login in between would reset the counter under REQ-LOG-010
   instead, so both cases would have passed while testing nothing. Made explicit.
9. **TC-005/TC-006 preconditions pinned OTP to disabled.** Without that, the happy path would
   intermittently divert into the OTP flow and the case would be non-deterministic.
10. **TC-022 and TC-024 moved off the positive-flow accounts** onto `AGENT_LOCKOUT` /
    `ADMIN_LOCKOUT`, so no negative case pushes an account that other cases rely on toward lockout.
11. **The lockout accounts were pinned to OTP-disabled** in the prerequisites table. TC-032,
    TC-037, TC-039 and TC-041 each require a *successful* login to prove a counter reset or an
    expiry; with OTP enabled for those accounts the login would divert into the OTP flow and the
    reset assertion would silently not be reached.
12. **REQ-LOG-018's coverage row was corrected.** It listed TC-047 (CAPTCHA), which verifies a
    different requirement and does not exercise data-entry feedback.

### Known limitations of this set

- **Server-side re-enforcement (REQ-LOG-018 AC-2 / REQ-LOG-003 AC-2) has no coverage at all** in
  the UI-only scope **[D-09]**. This is the largest deliberate gap and it is invisible in a
  pass-rate figure.
- **TC-037 and TC-038 cost 30 minutes each** and will be BLOCKED wherever that time or a lockout
  manipulation is unavailable. They are the only verification of the 30-minute duration and of
  **D-08**.
- **OTP cases depend on a specification that is not attached** (OQ-14). They assert only the
  trigger and the pass/fail outcome, which is all this requirement owns.
- **TC-016 will likely be BLOCKED** — current Create User validation can no longer produce a
  legacy email-username account (OQ-15).
- **TC-051 and TC-052 cannot fail on the behaviour they observe.** They exist to produce evidence
  for OQ-26 and OQ-27, and their value is realised only when a human converts the observation into
  a decision.

### Self-review verdict

**Was: ready for human review.** 52 test cases, no expected result asserting an undecided
behaviour, an invented message, or an invented limit.

**Outcome: the human approved all 52 on 2026-08-13** — see the approval record at the top of this
file. This self-review record is kept unchanged as the pre-approval state; it is not rewritten by
the approval.




