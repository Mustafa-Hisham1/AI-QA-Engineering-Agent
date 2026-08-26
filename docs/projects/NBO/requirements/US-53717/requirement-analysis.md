# Requirement Analysis — US 53717: Login (Authentication)

**Status:** QA analysis complete. **12 human decisions applied (D-01…D-12).**
**No blocking open questions remain** — 17 non-blocking questions stay recorded, two of them
(OQ-26, OQ-27) deliberately left undecided. No test cases generated yet.

Every statement below is tagged:

| Tag | Meaning |
|---|---|
| **[E]** | **Explicit** — stated in the User Story or the attached specification. The reference is given. |
| **[D]** | **Confirmed decision** — explicitly decided by the human. Recorded in [`decisions.md`](decisions.md) and cited by ID. Carries the same weight as an explicit requirement. |
| **[I]** | **QA inference** — not stated in the sources; my reading, assumption, or engineering judgement. Never treat as a requirement. |
| **[?]** | **Open question** — the sources are silent, vague, or contradictory. Listed in §12. Requires a human decision. |

---

## 1. Provenance and authority

### 1.1 Sources

| | |
|---|---|
| Azure DevOps work item | **53717** — `[INT] Authentication-Login Screen"Q3-API-INTE-033"` |
| Work item type | **User Story** (verified by the reader) |
| Project / Area / Iteration | NBO / `NBO\NBO 1 (Zay)` / `NBO\Sprint 2` |
| State | New (New) |
| Priority / Story points | 2 / not set |
| Parent work item | 53119 |
| Work item revision | **rev 8**, last changed 2026-08-11T09:56:08.47Z |
| Content fingerprint | `334a9561b7cb81fbaf6e6f2c9975044bcd3c702f838008052a67cb4c948d78d0` |
| Attachment | `login-business-requirements.md` — 23 290 bytes, sha256 `a5c687d444935c1284da925bbc307e2786968cde4fcdd51014a0e9c96b95e826` |
| Local source snapshot | [`source/login-business-requirements.md`](source/login-business-requirements.md) |
| Confirmed decisions | [`decisions.md`](decisions.md) — D-01…D-08 |
| Read at | 2026-08-13T08:34:05Z, via `npm run story:read -- 53717` |
| Last verified | 2026-08-13 — fingerprint re-checked, **unchanged**; no re-download or re-analysis needed |

**Source-of-truth documents:** the User Story description + 14 acceptance criteria, and the
attached specification (`Login — Business Requirements Specification`, prefix `LOG`,
requirement prefix `REQ-LOG-NNN`, document status *Draft — for planning review*, dated
2026-08-06).

The attachment states it is **reverse-engineered from a legacy system**
(`sheenrd/old-po-java`, Odeysys Travel Platform) so the feature can be rebuilt. **[E]**

**Change detection:** if the fingerprint above differs on a later read, the requirement
content changed — diff the live attachment against the local snapshot before touching test
cases (`docs/product-decisions.md` §14).

### 1.2 Confirmed decisions applied **[D]**

Human authority, full text in [`decisions.md`](decisions.md). These are **not** inferences and
must not be re-litigated by a later analysis.

| ID | Decision | Closed |
|---|---|---|
| **D-01** | Login **design/requirement** scope is **UI and API** | OQ-01 |
| **D-09** | **QA test-case scope is UI only** for now — API test cases are not produced yet | OQ-23 — `product-decisions.md` §1 stands unchanged, no reversal needed |
| **D-02** | Passwords containing spaces are invalid on **both** portals | OQ-02 |
| **D-03** | Every login problem shows an **appropriate** error message; **exact wording is never invented** where the source does not define it | OQ-04, OQ-05, OQ-19 |
| **D-04** | A wrong **Agency Code** is a failed login attempt and **increments** the Failed Attempt Count | OQ-06 (behaviour half) |
| **D-05** | **All** failed-login conditions in the requirements increment the counter, not only a wrong password | OQ-08 — extended by **D-10** |
| **D-06** | **Lock status is checked before credential authentication** | OQ-07 lockout half — completed by **D-11** |
| **D-07** | An already-locked account **shows the locked message and stops** — no authentication, **no further increment** | locked + correct/wrong password cases |
| **D-08** | When the 30-minute lockout expires, the Failed Attempt Count **resets to zero** | OQ-10 |
| **D-10** | While not locked: **invalid credentials** increment the counter, and so does an **expired password with otherwise valid credentials**. Pre-authentication validation failures are **deliberately undecided** | OQ-08b — residual continues as **OQ-26** |
| **D-11** | Full evaluation order: **lock check → credential validation → remaining account/password checks**. Invalid credentials give a **generic** error that never reveals which credential was wrong, and increment the counter | OQ-07b — residual continues as **OQ-27** |
| **D-12** | An **administrative unlock** unlocks the account **and resets the counter to zero** | OQ-24 |

**Effect of D-03 on every expected result in this document:** the nine strings in §8 remain
exact-text assertions because the specification defines them. Everywhere else, the expectation
is that *an appropriate message is displayed* — absence of a message is a defect, different
but appropriate wording is not.

---

## 2. Scope of this requirement

**This User Story is a Feature, not a Module.** **[I — conclusion; evidence below is [E]]**

Evidence:

- The attachment's own header declares `Feature: Login (Authentication)` and
  `Module: Security / Authentication`. The requirement therefore sits *inside* a module and
  is not the module itself. **[E]**
- §1.2 *Out of scope* explicitly excludes sibling features of the same module: **Change
  Password** (`PWD`), the **OTP specification**, **Admin Settings** configuration,
  **Create User**, and user/role/permission administration. **[E]**
- The 19 requirements all concern one screen and one transaction: the authentication entry
  point. **[E]**

**Recorded scope classification:**

| | |
|---|---|
| Project | **NBO** **[E]** |
| Module | **Authentication** (attachment says "Security / Authentication") **[E]** |
| Feature | **Login** **[E]** |
| Surfaces | **two** — Agent Portal login and Admin Panel login **[E]** |
| Layers — design scope | **UI and API** **[D — D-01]** |
| Layers — current test scope | **UI only** **[D — D-09]** |
| Scope type | **Complete feature**, spanning two portals, with two deliberately partial areas (see below) **[I]** |

**On the two scopes:** the requirement covers the API as well as the UI (D-01), but test cases
generated from this analysis target the **UI only** (D-09), so `docs/product-decisions.md` §1
("V1 testing scope is Web/UI") stands unchanged. Every requirement below is recorded at the
behavioural level, which holds for either layer — so the API stays documented and traceable and
becomes coverable later without re-analysis. No API contract was supplied with this story (no
endpoints, payloads, or status codes); that is deferred, not lost — see **OQ-25**. The one
requirement that only a non-UI layer can verify is called out in §5.8.

**Two areas are in scope only at their trigger point, not in full** — a distinction that
directly bounds test coverage: **[E]**

| Area | In scope here | Owned elsewhere |
|---|---|---|
| Password expiry | Detecting expiry at login and routing into the forced change (REQ-LOG-008) | The Change Password feature — `REQ-PWD-011`, `REQ-PWD-012` |
| OTP | The *decision* to require OTP, and the pass/fail outcome (REQ-LOG-012) | The separate OTP specification: generation, delivery, retries, resend, TTL, OTP lockout |

**Suggested title fields for future test cases** (per the `[Project][Module][Feature/Page]`
convention): `[NBO][Authentication][Login - Agent Portal]` and
`[NBO][Authentication][Login - Admin Panel]`. **[I]**

---

## 3. Functional requirement inventory

All 19 requirement IDs, as numbered in the attachment. **[E]**

| ID | Requirement | Area |
|---|---|---|
| REQ-LOG-001 | Login information model (business attributes) | Data model |
| REQ-LOG-002 | Access the Login form (per portal) | Access & entry |
| REQ-LOG-003 | Mandatory credentials | Access & entry |
| REQ-LOG-004 | Admin Panel identifier format (no space, no `@`) | Access & entry |
| REQ-LOG-005 | Agent Portal identifier (Email + Agency Code) | Access & entry |
| REQ-LOG-006 | Credential verification without information leakage | Verification |
| REQ-LOG-007 | Account authorization check | Verification |
| REQ-LOG-008 | Password expiry check at login | Verification |
| REQ-LOG-009 | Account lockout after 5 consecutive failed attempts, 30 minutes | Lockout |
| REQ-LOG-010 | Lockout counter reset only on full success | Lockout |
| REQ-LOG-011 | Administrative unlock | Lockout |
| REQ-LOG-012 | OTP trigger conditions | OTP step-up |
| REQ-LOG-015 | Trusted device (auto-created, 15 days) | OTP step-up |
| REQ-LOG-016 | Effect of a successful login | Success |
| REQ-LOG-017 | CAPTCHA is not part of the login flow | CAPTCHA |
| REQ-LOG-018 | Immediate data-entry feedback + authoritative server-side validation | Messaging |
| REQ-LOG-019 | Remember Me (login identifier retention) | Remember Me |

**`REQ-LOG-013` and `REQ-LOG-014` do not exist in the document** — §3.4 jumps from 012 to
015, and the traceability table in §4 also omits them. **[E]** Most likely they were moved
into the separate OTP specification, but the document does not say so. **[I]** → **[?] OQ-09**

---

## 4. Fields and their behaviour

### 4.1 Agent Portal login form — REQ-LOG-002 AC-1, REQ-LOG-003 AC-3 **[E]**

| Field | Required | Behaviour / constraints | Source |
|---|---|---|---|
| Agency Code | **Yes** | Displayed and saved **capitalized regardless of how it was typed**. Scopes the login to the correct agency. A **wrong** Agency Code is a failed login attempt and **increments the Failed Attempt Count** **[D — D-04]**. | REQ-LOG-005 AC-2, AC-3 |
| Email | **Yes** | The account identifier on this portal; an email address is valid here, unlike the Admin Panel. | REQ-LOG-005 AC-1 |
| Password | **Yes** | Verified against the stored (hashed) password. **Must not contain a space** **[D — D-02]**. | REQ-LOG-001, REQ-LOG-006 |
| View Password toggle | n/a | Show/hide the entered password. | REQ-LOG-002 AC-3 |
| Remember Me | **Optional** | Remembers **Email + Agency Code** for prefill. Never the password. | REQ-LOG-019 AC-1, AC-2 |

Missing mandatory fields are "highlighted using field-level validation feedback" — **no
message texts are specified for this portal** **[E: the absence]**. Expected result is
therefore *an appropriate message / field-level feedback is displayed*, with **no exact
wording asserted** **[D — D-03]**.

### 4.2 Admin Panel login form — REQ-LOG-002 AC-2, REQ-LOG-003 AC-1 **[E]**

| Field | Required | Behaviour / constraints | Source |
|---|---|---|---|
| Username | **Yes** | **Must not contain a space. Must not contain `@`.** An email address supplied in place of a username is rejected. | REQ-LOG-004 |
| Password | **Yes** | **Must not contain a space.** | REQ-LOG-004 AC-2 (**[D — D-02]** extends the same rule to the Agent Portal) |
| View Password toggle | n/a | Show/hide the entered password. | REQ-LOG-002 AC-3 |
| Remember Me | **Optional** | Remembers **Username** for prefill. Never the password. | REQ-LOG-019 AC-1, AC-2 |

### 4.3 System-managed information — REQ-LOG-001 **[E]**

| Attribute | Nature | Behaviour |
|---|---|---|
| Device Fingerprint | System-captured | Identifies the browser/device; drives trusted-device recognition. Business-level definition only — no technical definition given. |
| Failed Attempt Count | System-managed | Consecutive failed login attempts. Drives lockout. Cleared **only after full successful authentication, including OTP where applicable** **[E]**, **and also when the 30-minute lockout expires** **[D — D-08]**. Incremented by **all** failed-login conditions in the requirements, not only a wrong password **[D — D-05]**, including a wrong Agency Code **[D — D-04]**. Not incremented again while the account is already locked **[D — D-07]**. |
| OTP Attempt / Resend Count | System-managed | Drives the separate **OTP lockout**. Owned by the OTP specification. |

Neither counter is directly editable by the user attempting to log in. (REQ-LOG-001 AC-2) **[E]**

### 4.4 Not specified for any field **[E: the absence]** → **[?] OQ-03, OQ-06, OQ-22**

No minimum or maximum lengths, no allowed character sets (beyond the space/`@` prohibitions),
no email-format rule, no Agency Code format, and no password-composition rules — password
policy values are explicitly owned by Admin Settings / the Change Password spec.

---

## 5. Business rules

### Evaluation order **[D — D-06, D-07, D-11]**

The specification deliberately left the order of the independent checks to implementation
(*Implementation Note — Login Check Execution Order*). It is now decided, and this order
governs every expected result below:

```
submit
  │
  ├─ 1. LOCK CHECK ─── locked? ──► locked-account message, STOP.
  │                               Credentials never validated.
  │                               Counter NOT incremented.          [D-06, D-07]
  │
  ├─ 2. CREDENTIAL VALIDATION ─── invalid? ──► generic error: "the entered data is
  │                                            incorrect", never which one.
  │                                            Counter +1.           [D-11, D-10]
  │
  ├─ 3. REMAINING ACCOUNT / PASSWORD CHECKS (credentials valid)
  │        ├─ not authorized / disabled ──► authorization message   [REQ-LOG-007]
  │        └─ password expired ──► forced Change Password flow,
  │                                 Counter +1                       [REQ-LOG-008, D-10]
  │
  └─ 4. OTP DECISION ──► per REQ-LOG-012, then Dashboard
```

Two consequences worth stating plainly, because they were ambiguous before:

- **A disabled account with a wrong password shows the generic credential error**, not the
  authorization message — step 2 rejects before step 3 is reached. The authorization message
  appears only when the credentials are valid. **[D — D-11]**
- **While locked, nothing else is observable.** Correct credentials, wrong credentials, wrong
  Agency Code and a disabled account all yield the same locked message, and none moves the
  counter. **[D — D-06, D-07]**

### 5.1 Credential verification — REQ-LOG-006 **[E]**

- Identifier and Password are verified **together**.
- An **unrecognized identifier** and an **incorrect password** produce the **same** message:
  `Invalid credentials. Please try again.` — no indication of which credential was wrong.
- Behaviour is **identical on both portals**.
- An incorrect password **counts toward** the Failed Attempt Count.
- **[D — D-05, D-10]** So does every other failed-login condition: an unrecognized identifier,
  a wrong Agency Code (D-04), a refused disabled/unauthorized account, and an **expired
  password with otherwise valid credentials** — provided the account is **not already locked**.
- **[D — D-11]** The message for invalid credentials is **generic**: it states the entered data
  is incorrect and never reveals which credential was wrong. The specification's
  `Invalid credentials. Please try again.` is exactly that message.
- **[D — D-06, D-11]** Credential validation runs **after** the lock check and **before** the
  remaining account and password checks — so an invalid credential is reported as such even
  when the account would also have failed a later check.
- **[?]** Whether **pre-authentication validation failures** (empty field, space, `@`) count as
  attempts is deliberately left open — **OQ-26**. No expected result may assert counter
  movement for them.

### 5.2 Authorization — REQ-LOG-007 **[E]**

A disabled or otherwise unauthorized account is refused **even when the password is
correct**, with `Sorry, Your account is not authorized. Please contact the system
administrator.` Identical on both portals.

**[D — D-05]** This refusal is a failed-login condition, so it **increments the Failed Attempt
Count** — meaning repeated attempts on a disabled account can reach the lockout threshold.
**[D — D-03]** If disabled and unauthorized-type accounts turn out to show different wording,
that is acceptable; only the text above is asserted verbatim.

**[D — D-11] This message appears only when the credentials are valid.** A disabled account
submitted with a **wrong** password produces the **generic credential error** instead, because
credential validation is evaluated first. This is the single most easily mis-specified case in
the feature: asserting the authorization message for a disabled account without supplying its
correct password would be wrong.

### 5.3 Password expiry — REQ-LOG-008 **[E]**

- Expiry is evaluated **at the moment of login**.
- A **correct but expired** password does **not** complete login; the user is routed into
  the forced change-password flow (`REQ-PWD-012`).
- A **successful forced change completes the login** — the user does **not** re-submit
  credentials.
- **[D — D-10]** An expired password with otherwise valid credentials **increments the Failed
  Attempt Count**, provided the account is not already locked.
- **[D — D-11]** This check belongs to the *remaining account/password checks*, reached only
  after credential validation succeeds.
- **[I — derived]** Because REQ-LOG-010 resets the counter on full successful authentication and
  a successful forced change completes the login, that increment is **transient on the success
  path** and persists only if the user abandons the forced change. Worth confirming during
  execution rather than asserting blindly.

### 5.4 Lockout — REQ-LOG-009, REQ-LOG-010, REQ-LOG-011 **[E]**

| Rule | Value / behaviour | Tag |
|---|---|---|
| Threshold | Locked **on the 5th consecutive failed attempt** | **[E]** REQ-LOG-009 AC-1 |
| Duration | **30 minutes** from the point it is triggered | **[E]** AC-2 |
| Message | `Your account has been locked due to too many failed login attempts. Please contact the system administrator.` | **[E]** AC-3 |
| Tracking scope | **Per user** — not per device, not per IP. Switching device or network does not bypass it. | **[E]** AC-4 |
| Portal scope | **Identical threshold and duration on both portals**, sharing one mechanism | **[E]** AC-5 |
| **Check order** | The **lock check runs first — before credential authentication** | **[D — D-06, D-11]** |
| **Already locked** | Show the locked message and **stop**: credentials are **not** authenticated and the counter is **not** incremented again | **[D — D-07, D-11]** |
| What increments | Invalid credentials, an unrecognized identifier, a wrong Agency Code, a refused disabled/unauthorized account, and an **expired password with otherwise valid credentials** — always only while **not already locked** | **[D — D-04, D-05, D-10]** |
| What is undecided | **Pre-authentication validation failures** (empty field, space, `@`) — deliberately not decided | **[?] OQ-26** |
| Counter reset — on success | **Only after the full login completes**, including OTP where applicable — not after mere password validation | **[E]** REQ-LOG-010 |
| Counter reset — on expiry | **Resets to zero when the 30-minute lockout expires**, so the user starts again with a full allowance of 5 | **[D — D-08]** |
| OTP failures | A failed OTP attempt does **not** increment the password Failed Attempt Count (tracked separately) | **[E]** REQ-LOG-010 AC-3 |
| Admin unlock | An authorized administrator can **view** lock status and **unlock on demand**, and that single action clears **both** the password lockout **and** the OTP attempt/resend lockout | **[E]** REQ-LOG-011 |
| Counter reset — on admin unlock | An administrative unlock **also resets the counter to zero**, so it behaves exactly like a natural expiry | **[D — D-12]** |

**Consequence of D-06 + D-07 together** **[I — derived, not separately stated]**: while an
account is locked, no other login outcome is observable. Wrong password, correct password,
wrong Agency Code and a disabled account all produce the same lockout message during the
30-minute window, and none of them moves the counter. This removes most of the
combined-condition ambiguity that REQ-LOG-009 alone left open.

### 5.5 OTP step-up and trusted device — REQ-LOG-012, REQ-LOG-015 **[E]**

Decision sequence, evaluated **immediately after credentials are verified** — which is itself
after the lock check **[D — D-06]**:

1. Invalid credentials → denied per REQ-LOG-006; the OTP rules do not apply at all.
2. Credentials valid → read the **OTP-enablement configuration for the account's user type**.
   General users and admin users are **independently configurable**. Owned by Admin Settings;
   only consumed here.
3. OTP **disabled** for that user type → login completes immediately, navigate to Dashboard.
4. OTP **enabled** → check for a **valid, non-expired trusted-device record**.
5. Valid trusted-device record exists → **OTP bypassed**, login completes, navigate to Dashboard.
6. No valid record → **start the OTP flow** (channels and selection behaviour belong to the
   OTP spec).
7. OTP **succeeds** → login completes, navigate to Dashboard, **and a trusted-device record
   is created automatically** — unconditionally, with **no user action** such as
   "Remember this device".
   OTP **fails** → login does not complete; the user stays in the OTP flow under the OTP
   spec's retry/lockout rules.

Trusted device validity: **15 days from the successful OTP verification.** **Remember Me is
unrelated** to trusted-device creation and never bypasses OTP.

### 5.6 Successful login — REQ-LOG-016 **[E]**

| Portal | Session behaviour |
|---|---|
| Agent Portal | Redirect to the user's dashboard. **Prior sessions are NOT invalidated — multiple concurrent sessions are permitted** (AC-2a) |
| Admin Panel | **Any prior session is invalidated**, a new session is established, redirect to dashboard (AC-2) |

The session carries the information needed to support password-expiry enforcement.

### 5.7 CAPTCHA — REQ-LOG-017 **[E]**

**No CAPTCHA at any point** — not during credential entry, not during OTP entry, not
anywhere in the flow. A `CAPTCHA_STATUS` setting exists in the platform but governs Agent
Portal **Wallet Top-up**, not Login. This is a testable negative requirement.

### 5.8 Validation layering — REQ-LOG-018, REQ-LOG-003 AC-2 **[E]**

Empty-field and format violations are flagged **at data-entry time**, **and every check is
re-enforced authoritatively on the server** regardless of what the client showed.
Client-side feedback is never the authority.

**[D — D-09]** The data-entry half is UI-testable. The server-re-enforcement half
(REQ-LOG-018 AC-2, REQ-LOG-003 AC-2) requires bypassing the client, which the **UI-only test
scope cannot do** — it is recorded here as a known coverage gap rather than dropped, and
becomes coverable if API test cases are added later (D-01).

### 5.9 Remember Me — REQ-LOG-019 **[E]**

Remembers the **login identifier fields only** for prefill on the next visit (Email +
Agency Code on the Agent Portal, Username on the Admin Panel). **Never the password.** Does
not control trusted-device creation and does not bypass OTP.

---

## 6. State behaviour

Account states affecting login, derived from the requirements: **[I — the model; each state is [E]]**

**Locked is evaluated first** **[D — D-06]**, so it dominates every other state below while it
lasts.

| State | Login outcome | Counter effect |
|---|---|---|
| **Locked** (5 consecutive failures) | Refused with the lockout message, credentials never checked, for 30 minutes or until admin unlock **[D — D-06, D-07]** | **Unchanged** — no further increment **[D — D-07]** |
| Active, authorized, password valid, OTP not required | Login completes → Dashboard | Reset to 0 |
| Active, authorized, password valid, OTP required, device not trusted | OTP flow → completes on OTP success | Reset to 0 **only after OTP succeeds** |
| Active, authorized, password valid, OTP required, device trusted (≤15 days) | OTP bypassed → Dashboard | Reset to 0 |
| Active, password **expired** (credentials otherwise valid) | Forced Change Password → login completes after successful change | **+1** **[D — D-10]**, then reset once the change completes login **[I]** |
| **Disabled / unauthorized**, correct password | Refused, authorization message | **+1** **[D — D-05]** |
| **Disabled / unauthorized**, wrong password | Refused with the **generic credential error**, not the authorization message **[D — D-11]** | **+1** **[D — D-10]** |
| Wrong identifier / wrong password / **wrong Agency Code** | Refused, generic credential error | **+1** **[E / D-04, D-05, D-10]** |
| Pre-authentication format rejection (empty field, space, `@`) | Rejected before authentication | **Undecided → OQ-26** — never assert either way |
| **OTP-locked** (separate mechanism) | Blocked inside the OTP flow; cleared by the same admin unlock | Password counter untouched **[E]** |

**Counter lifecycle** — now fully determined except for the OQ-26 path:

```
0 ──(failed login condition while not locked: D-04, D-05, D-10)──> 1 ... 4
                                                                     │
                                                        (5th failure)│
                                                                     ▼
                                                LOCKED — counter frozen, credentials
                                                never validated          [D-07, D-11]
                                                                     │
        ┌──(30 minutes elapse)────────────────────► 0, unlocked      │  [D-08]
        ├──(administrator unlock)─────────────────► 0, unlocked      │  [D-12]
        └──(full successful authentication incl. OTP)──► 0           │  [REQ-LOG-010]
                                                                     │
   pre-authentication validation failure ──► effect on counter UNDECIDED  [OQ-26]
```

**Both unlock paths now agree:** natural expiry (D-08) and administrative unlock (D-12) each
reset the counter to zero, so an unlocked user always starts again with the full allowance of 5.

---

## 7. User flows

**Flow A — Agent Portal happy path, OTP disabled** **[E: REQ-LOG-002, 003, 005, 006, 012 AC-3, 016 AC-1]**
Open Agent Portal login → enter Agency Code, Email, Password → submit → credentials valid →
OTP disabled for user type → redirected to agent dashboard, session established.

**Flow B — Admin Panel happy path, OTP disabled** **[E: REQ-LOG-002 AC-2, 006, 012 AC-3, 016 AC-2]**
Open Admin Panel login → enter Username, Password → submit → prior session invalidated, new
session, redirected to admin dashboard.

**Flow C — OTP required, untrusted device** **[E: REQ-LOG-012 AC-4/6/7, REQ-LOG-015 AC-1]**
Valid credentials → OTP enabled → no valid trusted-device record → OTP flow → OTP verified →
trusted-device record created automatically → Dashboard.

**Flow D — OTP required, trusted device** **[E: REQ-LOG-012 AC-5, REQ-LOG-015 AC-2/AC-4]**
Valid credentials → OTP enabled → valid non-expired trusted-device record (within 15 days) →
OTP skipped → Dashboard.

**Flow E — Expired password** **[E: REQ-LOG-008]** with **[D — D-10, D-11]**
Not locked → credentials validated and valid → expiry detected among the remaining checks →
**counter +1** → forced Change Password flow → successful change → login completes without
re-entering credentials, and the counter resets **[I — derived]**.

**Flow F — Lockout** **[E: REQ-LOG-009]** with **[D — D-04, D-05, D-06, D-07, D-08]**
4 failed attempts, of any failing kind (wrong password, wrong Agency Code, unrecognized
identifier, disabled account) → still not locked → **5th** consecutive failure → account
locked → **every** subsequent attempt shows the lockout message with credentials never checked
and the counter frozen → after **30 minutes** the lock lifts **and the counter is back to 0**,
or an authorized administrator unlocks it earlier (REQ-LOG-011).

**Flow G — Remember Me prefill** **[E: REQ-LOG-019 AC-1/AC-2]**
Select Remember Me → log in → return to the login form → identifier fields prefilled,
password empty.

**Flow H — Locked account short-circuit** **[D — D-06, D-07, D-11]**
Locked account → submit **correct** credentials → lockout message, login refused, credentials
never authenticated, counter unchanged. Identical outcome with incorrect credentials. This is
the flow that makes the lock check observable as *preceding* authentication.

**Flow I — Disabled account with a wrong password** **[D — D-11, D-10]**
Not locked → credentials invalid → **generic credential error**, *not* the authorization
message → counter +1. The authorization message requires the account's **correct** password.

**Flow J — Administrative unlock** **[E: REQ-LOG-011]** with **[D — D-12]**
Locked account → administrator unlocks → account unlocked **and counter reset to zero** → the
user may then fail 4 times without re-locking; only a 5th failure re-locks.

---

## 8. Message inventory

### 8.1 Exact texts — assert verbatim **[E]**

Reproduced verbatim from the attachment's §4.1 consolidated inventory plus the inline ACs.
These are assertion targets — punctuation and capitalisation included, and note the
inconsistent trailing punctuation is **as specified**. **[E]**

| Trigger | Portal | Exact text | Source |
|---|---|---|---|
| Username or Password empty | Admin | `Please enter Username and Password!` | REQ-LOG-003 AC-1 |
| Username supplied, Password empty | Admin | `Password is required.` | REQ-LOG-003 AC-1 |
| Space in Username | Admin | `Spaces not allowed in user name!` | REQ-LOG-004 AC-1 |
| Space in Password | Admin | `Spaces not allowed in Password` | REQ-LOG-004 AC-2 |
| `@` in Username | Admin | `Please enter a valid user without '@'` | REQ-LOG-004 AC-3 |
| Email used as Username (legacy accounts only) | Admin | `Sorry, you cannot use your email. Please use your username.` | REQ-LOG-004 AC-4 |
| Unrecognized identifier **or** wrong password — **and any invalid-credential case, including on a disabled account** **[D — D-11]** | Both | `Invalid credentials. Please try again.` | REQ-LOG-006 AC-1 |
| Disabled / unauthorized account | Both | `Sorry, Your account is not authorized. Please contact the system administrator.` | REQ-LOG-007 AC-1 |
| Locked account | Both | `Your account has been locked due to too many failed login attempts. Please contact the system administrator.` | REQ-LOG-009 AC-3 |

### 8.2 Undefined texts — assert presence, never wording **[D — D-03]**

The specification defines no text for these. The expected result is that **an appropriate
error message or field-level feedback is displayed** — a missing message is a defect, wording
that differs but fits is not. **Do not invent strings for this table.**

| Trigger | Portal | Expected |
|---|---|---|
| Empty Agency Code, Email, or Password | Agent | Appropriate field-level validation feedback |
| Invalid email format | Agent | Appropriate message (no format rule is stated either — OQ-06) |
| Space in Password | Agent | Appropriate message; the rule itself is confirmed by **D-02** |
| Wrong Agency Code with a valid Email | Agent | A **generic** invalid-credential message that does not reveal which value was wrong (**D-11**), and it counts as a failed attempt (**D-04**, **D-10**). `Invalid credentials. Please try again.` is the message that satisfies this **[I]**, but the specification does not name this case, so exact text is not asserted |
| Username empty with a Password supplied | Admin | Appropriate message — the specification covers only "both empty" and "Password empty" |
| Any other login problem | Both | Appropriate message |

---

## 9. Dependencies

**Requirement dependencies stated in the sources** **[E]**

| Depends on | Why | Availability to QA |
|---|---|---|
| **Change Password** spec (`REQ-PWD-011`, `REQ-PWD-012`) | Password expiry threshold and the forced-change flow | **Not attached to this story** |
| **OTP** specification | OTP generation, delivery, retries, resend, TTL, OTP lockout | **Not attached, prefix not yet assigned** |
| **Admin Settings** feature | Owns lockout threshold/duration, OTP enablement per user type, password-policy values | Needed to configure test conditions |
| **Create User** (Admin Panel) | Enforces the Username `@` restriction; REQ-LOG-004 AC-4 exists only for accounts predating it | Needed to create admin test accounts |
| **Agency CRUD** (NDC Admin) | Defines what makes an Agency Code valid | Needed for Agent Portal test data |
| **Agent CRUD** (NDC Portal) | Defines what makes an Email/account valid | Needed for Agent Portal test data |
| User / role / permission administration | An account's authorization state gates login; also defines who may unlock | Needed for the disabled-account and unlock scenarios |

**Execution dependencies** **[I]**

- Two separate application URLs (Agent Portal, Admin Panel) on **STG** — environment
  configuration, not test data.
- The ability to **unlock** an account, otherwise lockout testing costs 30 minutes of wall
  clock per run and can leave a shared account unusable.
- A means to toggle **OTP enablement** per user type, and access to the OTP delivery channel.

---

## 10. Negative and edge scenarios worth covering

Requirement-backed — these are areas, not test cases. All are within the **UI-only** test scope
**[D — D-09]** unless marked otherwise.

- Empty Username / empty Password / both empty (Admin) — the first two have defined texts; the
  Username-empty-with-Password case asserts presence only **[D — D-03]**.
- Empty Agency Code / Email / Password (Agent) — presence of feedback only **[D — D-03]**.
- Space inside Username (Admin); space inside Password **on both portals** **[D — D-02]**.
- `@` inside Username (Admin); an email address as Username (Admin, legacy accounts).
- Unrecognized identifier vs correct identifier + wrong password → **identical** message,
  and no leakage of which one was wrong.
- **Wrong Agency Code with a valid Email** → failed login **and counter increments**
  **[D — D-04]**; repeated wrong Agency Codes can therefore reach lockout.
- Correct password on a **disabled** account → authorization message, not success, **and the
  counter increments** **[D — D-05]**.
- **Wrong** password on a **disabled** account → **generic credential error**, *not* the
  authorization message, counter +1 **[D — D-11, D-10]**.
- Correct but **expired** password → forced change, not success, **counter +1** **[D — D-10]**.
- 4 failures (not locked) → **5th** failure (locked) → attempt while locked → after 30
  minutes → after admin unlock.
- **Mixed failure kinds reaching the threshold**: e.g. 2 wrong passwords + 2 wrong Agency
  Codes + 1 unrecognized identifier = 5 → locked **[D — D-04, D-05]**.
- **Locked account with correct credentials** → lockout message, no authentication, counter
  unchanged **[D — D-06, D-07]**.
- **Counter reset after lockout expiry**: once 30 minutes pass, 4 further failures must **not**
  re-lock; only a 5th does **[D — D-08]**.
- **Counter reset after administrative unlock**: same expectation as expiry — 4 further failures
  must not re-lock **[D — D-12]**.
- **No information leakage in the generic error**: the message for an unknown identifier, a
  wrong password, a wrong Agency Code and a disabled account with a wrong password must be
  indistinguishable **[D — D-11]**.
- **Not assertable either way** **[?] OQ-26**: whether repeated pre-authentication validation
  failures (5 empty-password submissions, say) move the counter or reach lockout. Report what is
  observed; do not encode an expectation.
- Lockout is per user: same account from a second device/network stays locked.
- OTP enabled + untrusted device → OTP required; OTP failure does not complete login and
  does not increment the password counter.
- Trusted device within 15 days → OTP skipped.
- **Remember Me never prefills the password**, and never bypasses OTP.
- **No CAPTCHA appears anywhere** in the flow.
- Agency Code entered in lower case → displayed/saved capitalized.
- Admin Panel: logging in invalidates the earlier session; Agent Portal: it does **not**.
- **Outside the current test scope** **[D — D-09]**: client-side validation bypass, where the
  server must still reject (REQ-LOG-018 AC-2 / REQ-LOG-003 AC-2). Needs request-level access;
  becomes coverable only if API test cases are added.

---

## 11. Existing behaviour vs new / changed behaviour

- **Everything in the specification describes legacy behaviour being rebuilt.** The
  attachment is reverse-engineered from `sheenrd/old-po-java` so the same feature can be
  reimplemented. For the NBO product this is therefore **new implementation of existing
  behaviour**. **[E]**
- **One explicit product enhancement, not legacy:** the **View Password toggle** on both
  portals — "a confirmed product enhancement, not reverse-engineered legacy behavior …
  included here as an approved addition to the rebuild scope" (REQ-LOG-002 AC-3). **[E]**
  It is absent from the User Story's own acceptance criteria. **[E: the absence]**
- **Deliberately not reproduced:** legacy defects and ambiguities were to be raised as
  warnings rather than copied (§1.5, §6). **[E]** §5 now reports **zero** warnings at every
  severity with "all items have been resolved", but the document records **neither the
  original findings nor the decisions taken** — so the corrected behaviour is invisible to
  QA. **[E: the absence]** → **[?] OQ-16**
- **Explicitly left to implementation:** the **relative execution order** of the independent
  login checks — lockout, credential verification, authorization, password expiry, OTP
  trigger. The document states no business rule governs the sequence. **[E]**
  **Now decided:** lock check → credential validation → remaining account/password checks →
  OTP **[D — D-06, D-07, D-11]**. Only the precedence between the authorization and expiry
  checks, for an account that is simultaneously disabled and password-expired, is still
  unstated → **[?] OQ-27**.
- **Changed relative to the specification's literal reading** — in each case the decision
  governs:
  - The Failed Attempt Count **resets when a lockout expires** **[D — D-08]** and **on
    administrative unlock** **[D — D-12]**; REQ-LOG-010 reset it only on full success.
  - **All** failed-login conditions increment it, not only a wrong password **[D — D-04, D-05,
    D-10]**, including an **expired password with otherwise valid credentials** — a case the
    specification treats as a routing outcome rather than a failure.
  - The password space rule extends to the **Agent Portal** **[D — D-02]**.

---

## 12. Open questions

Nothing here is resolved silently. Blocking items would make a generated expected result a
guess. **IDs are stable** — a closed question keeps its ID and is listed in §12.2 rather than
deleted.

### 12.1 Still open

**No blocking questions remain.** Every item below can be handled by reporting observed
behaviour instead of asserting a derived expectation.

| ID | Question | Impact | Blocking? |
|---|---|---|---|
| **OQ-26** | **Deliberately left open by D-10**: do **pre-authentication validation failures** (empty values, spaces, invalid format) count as authentication attempts and move the Failed Attempt Count? The source does not define it, so it must not be invented. | No expected result may assert counter movement — or its absence — for validation-only failures. Observe and report instead. | No — by decision |
| **OQ-27** | **D-11** orders lock → credentials → remaining checks, but not *within* that last group: for an account that is **both disabled and password-expired** with valid credentials, does the authorization refusal or the forced-change routing win? | One deliberately constructed compound state; report what is observed | No |
| **OQ-06** | Agency Code has no format, length or character rules. (The *behaviour* for a wrong Agency Code is settled by **D-04**, **D-10** and **D-11**; only the input rules remain.) Also no email-format rule is stated for the Agent Portal. | Boundary and invalid-format coverage for Agent Portal identifiers | No |
| **OQ-03** | "Contains a space": does it include **leading/trailing** spaces, tabs, and is input trimmed before validation? Now applies to both portals via **D-02**. | Boundary cases for the space rules | No — can be reported as observed |
| **OQ-09** | **REQ-LOG-013 and REQ-LOG-014 do not exist** in the document or its traceability table. Were they moved to the OTP spec, or is content missing? | Possible coverage gap | No |
| **OQ-11** | Remember Me: retention period, storage, survival across browser restart, and whether **unchecking** it clears previously remembered values. | Defines the Remember Me lifecycle cases | No |
| **OQ-12** | Trusted device: is the record per **user+device** or per device only? Does clearing browser data revoke it? Does each successful OTP **renew** the 15 days? Device Fingerprint has a business-level definition only. | Trusted-device case design; the 15-day boundary is not testable in a normal run | No |
| **OQ-13** | Who is an "authorized administrator" for unlock (REQ-LOG-011), and where does that function live in the Admin Panel? | Needed to execute the unlock and post-unlock reset cases (**D-12**) at all | No |
| **OQ-14** | The **Change Password** and **OTP** specifications are not attached. REQ-LOG-008 AC-2 and REQ-LOG-012 AC-6/AC-7 cross the boundary into them. | Flows E and C cannot be fully verified end to end | No |
| **OQ-15** | REQ-LOG-004 AC-4 applies **only to legacy accounts** that current Create User validation can no longer produce. Does such an account exist on STG? | Likely **not executable** without data seeding | No |
| **OQ-16** | §5 reports zero warnings with "all items resolved", but no findings or resolutions are recorded, while the document status is still *Draft — for planning review*. Where are the resolved decisions recorded? | Corrected-vs-legacy behaviour is unverifiable from this document | No |
| **OQ-17** | The lockout message directs the user to contact an administrator, yet the lockout **auto-expires** after 30 minutes and the counter resets (REQ-LOG-009 AC-2, **D-08**). The message never mentions waiting. **[I]** | Possibly a wording defect worth raising | No |
| **OQ-18** | "Dashboard" is the stated landing target for both portals, but the actual landing page/route per portal is not specified. | Redirect assertions need a concrete target | No |
| **OQ-20** | Session timeout, idle expiry and logout are not mentioned. Presumably out of scope for Login. **[I]** | Confirms a coverage boundary | No |
| **OQ-21** | Is parent work item 53119 the Authentication **Feature/Epic** parent? It could not be read — V1's reader accepts `User Story` only. | Affects how sibling stories in this module are discovered later | No |
| **OQ-22** | No length limits or character sets for Username, Email, Password or Agency Code, and password composition is owned by Admin Settings / the PWD spec. | Boundary-value coverage has no authoritative limits | No |
| **OQ-25** | The **API layer is in the requirement scope** (**D-01**) but no API contract was supplied — no endpoints, payloads or status codes — and the current test scope is UI-only (**D-09**). When API coverage is taken up, where does that contract come from? | Deferred, not blocking today; blocks any future API coverage | No — deferred by D-09 |

### 12.2 Closed

Kept for traceability. Never re-open one of these by inference.

| ID | Original question | Closed by |
|---|---|---|
| **OQ-01** | Does this story mean the UI screen, an API deliverable, or both? | **D-01** (scope is UI + API) and **D-09** (test scope is UI only) |
| **OQ-02** | Does the password space prohibition apply to the Agent Portal? | **D-02** — yes, both portals |
| **OQ-04** | Admin: no message defined for empty Username with a Password supplied | **D-03** — appropriate message, wording not asserted |
| **OQ-05** | Agent Portal has no specified message texts | **D-03** — assert presence, never invent wording |
| **OQ-07** | Check execution order unspecified for combined conditions | **D-06** + **D-07**, completed by **D-11**; narrow residual is **OQ-27** |
| **OQ-07b** | Order among credential verification, authorization and password expiry | **D-11** — credential validation precedes the remaining account/password checks |
| **OQ-08** | Does anything other than a wrong password increment the counter? | **D-05** (+ **D-04** for Agency Code) |
| **OQ-08b** | Do validation-only failures and the expired-password path increment? | **D-10** — expired password **does**; the pre-authentication half stays open **by decision** as **OQ-26** |
| **OQ-10** | Is the counter reset when a lockout expires without a successful login? | **D-08** — yes, resets to zero |
| **OQ-24** | Does an administrative unlock also reset the counter? | **D-12** — yes, resets to zero |
| **OQ-19** | Do disabled and unauthorized-type accounts show different text? | **D-03** — either is acceptable if appropriate |
| **OQ-23** | Does D-01 reverse `product-decisions.md` §1 (V1 testing is Web/UI)? | **D-09** — no. §1 stands; test scope is UI only |

**Consistency check between the two sources:** the User Story's 14 acceptance criteria are
**consistent with** the attachment — no contradictions found. The attachment is strictly
broader (it adds the View Password toggle, Agency Code capitalisation, concurrent Agent
sessions, the admin unlock clearing the OTP lockout, and the counter-reset nuance). **[I —
conclusion of a full comparison]**

**Where the confirmed decisions override the specification:** D-05/D-04 widen what increments
the counter, D-08 adds a reset trigger REQ-LOG-010 does not have, and D-02 extends the password
space rule to the Agent Portal. In each case the decision governs and the specification's
narrower literal reading is not used. **[D]**

---

## 13. Test environment and data prerequisites

Needed before this feature can be executed on **STG** (the only allowed environment), through
the **UI** **[D — D-09]**. **[I]**

| Need | Purpose | Requirement |
|---|---|---|
| Agent Portal URL + Admin Panel URL | Two surfaces to reach | REQ-LOG-002 |
| Valid agent account: Agency Code + Email + Password | Positive Agent flow | REQ-LOG-005 |
| Valid admin account: Username + Password | Positive Admin flow | REQ-LOG-004 |
| **Dedicated, expendable** account per portal for lockout | 5 failures locks it for 30 minutes; never use a shared account | REQ-LOG-009 |
| A **second** valid Agency Code, or a known-invalid one | Wrong-Agency-Code failure now increments the counter | **D-04** |
| Ability to unlock (admin account with the right permission) | Keeps lockout runs repeatable | REQ-LOG-011 |
| Disabled / unauthorized account | Authorization refusal | REQ-LOG-007 |
| Account with an expired password | Forced-change routing | REQ-LOG-008 |
| OTP enablement toggle + access to the OTP channel | OTP-required and OTP-bypass flows | REQ-LOG-012 |
| A fresh browser context (no trusted-device record) and one with a valid record | Distinguishing OTP-required from OTP-bypassed | REQ-LOG-015 |
| Legacy admin account whose Username is an email | REQ-LOG-004 AC-4 — **probably unobtainable** | REQ-LOG-004 |

**Testability constraints:** **[I]**

- The **30-minute** lockout and the **15-day** trusted-device expiry cannot be waited out in
  a normal run — they need either data manipulation, configuration change, or acceptance
  that the boundary is not verified. **D-08** makes the post-expiry counter reset a required
  expectation, which makes this constraint more visible, not less: verifying it needs the
  30 minutes to actually pass or the lockout state to be manipulated.
- Lockout cases are **destructive to account state** and must not run against accounts other
  cases depend on. **D-04 and D-05 widen this**: wrong-Agency-Code and disabled-account
  attempts now also consume attempts toward the same threshold, so any negative case can
  contribute to a lockout and must be budgeted per account.
- **Server-side re-enforcement (REQ-LOG-018 AC-2) is not coverable** in the UI-only test scope
  **[D — D-09]**.
- Credentials belong in environment configuration, never in test case files
  (`docs/product-decisions.md` §4, §12).

---

## 14. Coverage map for future test case generation

Requirement → coverage area, so no requirement is silently skipped. Test scope is the **UI**
**[D — D-09]**. **No test cases exist yet.** **[I]**

| Requirement | Coverage areas | Status |
|---|---|---|
| REQ-LOG-002 | Both login forms render the specified fields; View Password toggle shows/hides | Ready |
| REQ-LOG-003 | Mandatory-field validation per portal; exact texts for the two defined Admin cases, presence-only elsewhere (D-03) | Ready — server half not coverable (D-09) |
| REQ-LOG-004 | Username space / `@` / email-as-username; Password space on **both** portals (D-02) | Ready except AC-4 (OQ-15) and whitespace edges (OQ-03) |
| REQ-LOG-005 | Email + Agency Code identification; Agency Code capitalisation; wrong Agency Code fails and increments (D-04) | Ready — input format rules undefined (OQ-06) |
| REQ-LOG-006 | Identical **generic** message for unknown identifier, wrong password, wrong Agency Code and disabled-with-wrong-password (D-11); counter increments | Ready |
| REQ-LOG-007 | Disabled/unauthorized refusal **with a correct password**, both portals; increments the counter (D-05); **wrong** password on the same account gives the generic error instead (D-11) | Ready — only the disabled+expired precedence open (OQ-27) |
| REQ-LOG-008 | Expired password routes to forced change and **increments the counter** (D-10); login completes after change | Partly — crosses into the PWD spec (OQ-14) |
| REQ-LOG-009 | 4 vs 5 attempt boundary; mixed failure kinds reaching 5 (D-04, D-05); message; 30-minute duration; per-user across devices; both portals; lock checked before authentication (D-06); locked short-circuit (D-07) | Ready — 30-minute wait is a practical constraint |
| REQ-LOG-010 | Counter cleared after full success incl. OTP; OTP failure does not increment; **reset on lockout expiry** (D-08) and **on admin unlock** (D-12) | Ready |
| REQ-LOG-011 | Admin views lock status; unlock restores login **and resets the counter** (D-12); unlock clears OTP lockout too | Needs the unlock function's owner/location (OQ-13) |
| REQ-LOG-012 | OTP disabled → direct Dashboard; enabled + untrusted → OTP; enabled + trusted → bypass; OTP fail → no login | Partly — crosses into the OTP spec (OQ-14) |
| REQ-LOG-015 | Trusted-device record auto-created on OTP success with no user action; bypass within 15 days | Partly — 15-day boundary and record semantics (OQ-12) |
| REQ-LOG-016 | Redirect per portal; Admin invalidates prior session; Agent permits concurrent sessions | Ready — landing route undefined (OQ-18) |
| REQ-LOG-017 | No CAPTCHA at credential entry, OTP entry, or any step | Ready |
| REQ-LOG-018 | Data-entry feedback appears | Server re-enforcement **not coverable** (D-09) |
| REQ-LOG-019 | Identifier prefill per portal; password never prefilled; no OTP bypass | Ready — retention lifecycle undefined (OQ-11) |

**Unblocked by the confirmed decisions:** Agent Portal validation coverage, wrong-Agency-Code
coverage, Agent password-space coverage, mixed-failure lockout coverage, the locked-account
short-circuit, the post-expiry and post-unlock counter resets, the full check-evaluation order,
and the disabled-account message split. These were the largest gaps in the first analysis.

**Nothing is blocked on a decision any more.** What remains is of two kinds, and neither stops
test case generation:

| Kind | Items | How to handle |
|---|---|---|
| **Deliberately undecided** | **OQ-26** (validation-only failures and the counter), **OQ-27** (disabled + expired precedence) | Cover the scenario, report observed behaviour, assert nothing about the undecided part |
| **External or environmental** | **OQ-14** (PWD and OTP specs not attached), **OQ-13** (unlock owner/location), **OQ-15** (legacy email-username account), **OQ-06/OQ-22** (no format or length limits), **OQ-18** (landing route), **OQ-11/OQ-12** (Remember Me and trusted-device lifecycles) | Scope the case to what the source supports; note the gap in the test case |
