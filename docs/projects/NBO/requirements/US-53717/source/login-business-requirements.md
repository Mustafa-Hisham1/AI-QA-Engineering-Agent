# Login — Business Requirements Specification

| | |
|---|---|
| **Feature** | Login (Authentication) |
| **Requirement Prefix** | `LOG` |
| **Module** | Security / Authentication |
| **Source System (reverse-engineered)** | `sheenrd/old-po-java` (Odeysys Travel Platform) |
| **Document Status** | Draft — for planning review |
| **Date** | 2026-08-06 |

---

## 1. Introduction

### 1.1 Purpose

This document captures the complete, implementation-independent business requirements for the **Login** feature as it exists in the legacy system, so that the same feature can be rebuilt. Requirements are stated in business terms (what the system must do), not technical terms (how it is coded).

### 1.2 Scope

**In scope:** the authentication entry point for both the Agent Portal and the Admin Panel — credential entry and verification, account-authorization and password-expiry checks, the failed-attempt lockout mechanism and its administrative override, the decision of *whether* OTP step-up verification is required and the trusted-device mechanism that can bypass it, the effect of a successful login, and validation/confirmation messaging.

**Out of scope:**
- The **Change Password** feature itself (its own specification, prefix `PWD`) — referenced here only where password expiry forces a change as part of login (REQ-LOG-008).
- The **OTP specification itself** (a separate document, to be given its own prefix) — OTP generation, delivery (SMS/Email sending), retry limits, resend limits, expiration/TTL, and OTP lockout rules all belong there. This document is concerned only with the decision to trigger OTP and the pass/fail outcome (REQ-LOG-012).
- The business meaning and management of the underlying configuration values this feature consumes (lockout threshold/duration, password-policy values) — these are configuration entries owned by the **Admin Settings** feature.
- User/role/permission administration itself — referenced only insofar as an account's authorization state gates login.
- The management of Agency and Agent records themselves — this feature depends on, but does not restate, Agency CRUD (NDC Admin) for what makes an Agency Code valid, and Agent CRUD (NDC Portal) for what makes an Email/account valid.
- The management of Admin Panel user accounts themselves — this feature depends on, but does not restate, **Create User** for the Username `@`-restriction referenced in REQ-LOG-004; the detailed Create User validation rules are outside the scope of this specification.
- CAPTCHA — no CAPTCHA implementation was found anywhere in the login flow (see REQ-LOG-017).

### 1.3 Business Domain Context

- Two distinct populations authenticate through two separate portals: **agents** (customers/travel-agency staff) via the Agent Portal, and **administrators/internal staff** via the Admin Panel. Each portal has its own login form and its own rules for what counts as a valid identifier.
- A successful login is not just "correct password" — the account must also be authorized (not disabled), the password must not have expired, and, depending on configuration and whether the device is recognized, a second authentication factor (OTP) may be required.
- The platform protects against credential-guessing by locking an account out after a run of failed attempts, independently of whichever portal the attempts came through, since both portals share the same underlying lockout mechanism.
- A separate, second lockout can also occur specifically from repeated OTP failures or excessive OTP resend requests, distinct from the password-attempt lockout.
- A device that has previously completed OTP verification can be remembered as "trusted," letting a returning user skip OTP on subsequent logins from that same device.

### 1.4 Definitions & Glossary

| Term | Meaning |
|---|---|
| **Identifier** | The credential used to identify the account being logged into: a Username for the Admin Panel, an Email address (plus Agency Code) for the Agent Portal. |
| **Device Fingerprint** | A value identifying the specific browser/device a login attempt comes from, used for trusted-device recognition. |
| **Trusted Device** | A device previously verified via OTP and remembered, allowed to bypass OTP on subsequent logins for a period of time. |
| **OTP (One-Time Passcode)** | A short-lived code sent to the user (by SMS or Email) and required as a second factor when triggered. |
| **Account Lockout** | A temporary block on logging in, applied after too many failed password attempts, tracked per user. |
| **OTP Lockout** | A separate temporary block applied after too many failed OTP attempts or too many OTP resend requests. |
| **Session** | The authenticated context established after a successful login. |

### 1.5 Reading Conventions

- Each requirement has a unique identifier `REQ-LOG-NNN`, a formal statement ("The system shall…"), and **Acceptance Criteria (AC)**.
- The words *shall* / *must* denote mandatory requirements.
- Inconsistencies found in the source system are **not silently reproduced**; they are raised as **⚠️ warnings** (`WARN-LOG-NNN`), cross-referenced inline, and consolidated with severity ratings in **Section 5**. Every warning is an open decision to be resolved during the planning phase.

---

## 2. Data Dictionary (Business Attributes)

**REQ-LOG-001 — Login information model**
The system shall accept the following business inputs, and maintain the following business information, for a login attempt.

| Attribute | Business Meaning | Required | Notes / Constraints |
|---|---|---|---|
| Identifier | Username (Admin Panel) or Email + Agency Code (Agent Portal) | Yes | Format rules differ by portal (REQ-LOG-004, REQ-LOG-005) |
| Password | The account's current password | Yes | Verified against the stored (hashed) password |
| Device Fingerprint | Identifies the requesting device | System-captured | Drives trusted-device recognition |
| Remember Me | User's request to have login identifier details remembered for prefill (REQ-LOG-019) | Optional | Offered on both the Agent Portal and the Admin Panel |
| Failed Attempt Count | Number of consecutive failed password attempts | System-managed | Drives Account Lockout (REQ-LOG-009). Reset behavior follows REQ-LOG-010; the counter is cleared only after full successful authentication, including OTP when applicable. |
| OTP Attempt/Resend Count | Number of failed OTP attempts / resend requests in the current cycle | System-managed | Drives OTP Lockout; owned by the separate OTP specification |

**Acceptance Criteria**
- AC-1: Every login attempt is evaluated against all applicable checks in this document before access is granted.
- AC-2: System-managed counters are not directly editable by the user attempting to log in.

---

## 3. Functional Requirements

### 3.1 Access and Credential Entry

**REQ-LOG-002 — Access the Login form**
The system shall present a login form to any unauthenticated visitor, distinct for the Agent Portal and the Admin Panel.

*Acceptance Criteria*
- AC-1: The Agent Portal's login form presents Agency Code, Email, Password, and a Remember Me option.
- AC-2: The Admin Panel's login form presents Username, Password, and a Remember Me option.
- AC-3: The Password field on both the Agent Portal and the Admin Panel offers a View Password toggle, allowing the user to show or hide the entered password. This is a confirmed product enhancement, not reverse-engineered legacy behavior, and is included here as an approved addition to the rebuild scope.

**REQ-LOG-003 — Mandatory credentials**
The system shall require both the Identifier and Password fields to be supplied.

*Acceptance Criteria*
- AC-1: On the Admin Panel, submitting with an empty Username or Password shows "Please enter Username and Password!"; submitting with Username but no Password shows "Password is required."
- AC-2: These checks are enforced both at data entry (client-side) and on submission (server-side, authoritative).
- AC-3: On the Agent Portal, Agency Code, Email, and Password are mandatory. Missing mandatory fields shall be highlighted using field-level validation feedback.

**REQ-LOG-004 — Admin Panel identifier format**
The system shall require the Admin Panel's Username to contain no spaces and no `@` character, and shall reject an email address supplied in place of a username.

Note: The Username `@`-character restriction is enforced during user creation (Create User). Therefore, usernames containing an email format cannot be created under the current validation rules. AC-4 applies only to legacy accounts that were created before this validation was introduced.

*Acceptance Criteria*
- AC-1: A Username containing a space is rejected with "Spaces not allowed in user name!".
- AC-2: A Password containing a space is rejected with "Spaces not allowed in Password".
- AC-3: A Username containing `@` is rejected with "Please enter a valid user without '@'".
- AC-4: For legacy accounts where the Username contains an email address, login using the email-based Username is rejected with the message "Sorry, you cannot use your email. Please use your username." This validation acts as a safety net for accounts created before the Create User `@`-restriction was enforced and is not applicable to newly created accounts under the current validation rules.

**REQ-LOG-005 — Agent Portal identifier**
The system shall identify an Agent Portal account by Email address together with Agency Code.

*Acceptance Criteria*
- AC-1: The Agent Portal accepts an email address as the identifier, in contrast to the Admin Panel's username-only rule (REQ-LOG-004).
- AC-2: Agency Code is supplied alongside Email to scope the login to the correct agency.
- AC-3: Agency Code is displayed and saved as a capitalized value regardless of how it was typed.

### 3.2 Credential Verification

**REQ-LOG-006 — Credential verification without information leakage**
The system shall verify the supplied Identifier and Password together, and shall respond identically whether the Identifier is unrecognized or the Password is merely incorrect.

*Acceptance Criteria*
- AC-1: An unrecognized Identifier and an incorrect Password both produce the same message: "Invalid credentials. Please try again."
- AC-2: This behavior is identical between the Agent Portal and the Admin Panel.
- AC-3: An incorrect Password counts toward the Failed Attempt Count (REQ-LOG-009).

**REQ-LOG-007 — Account authorization check**
The system shall refuse to log in a user whose account is disabled or otherwise not of an authorized type, independently of whether the credentials were correct.

*Acceptance Criteria*
- AC-1: A disabled or unauthorized account is rejected with "Sorry, Your account is not authorized. Please contact the system administrator." even when the Password is correct.
- AC-2: This check applies identically to both portals.

**REQ-LOG-008 — Password expiry check at login**
The system shall detect a password that has passed its configured expiry (per the Change Password specification, `REQ-PWD-011`) at the moment of login, and shall require it to be changed before login can complete.

*Acceptance Criteria*
- AC-1: A correct Password that has expired does not complete the login; the user is routed into the forced change-password flow (`REQ-PWD-012`).
- AC-2: A successful forced password change completes the login without requiring the user to submit their credentials a second time.

### 3.3 Failed-Attempt Lockout

**REQ-LOG-009 — Account lockout after repeated failed attempts**
The system shall lock an account on the 5th consecutive failed Password attempt, for a duration of 30 minutes.

*Acceptance Criteria*
- AC-1: The account is locked immediately when the 5th consecutive failed Password attempt occurs.
- AC-2: The lockout lasts 30 minutes from the point it is triggered.
- AC-3: A locked-out user attempting to log in sees "Your account has been locked due to too many failed login attempts. Please contact the system administrator."
- AC-4: The lockout is tracked per user (not per device or per IP address); switching devices or networks does not bypass it.
- AC-5: This lockout mechanism, and its threshold and duration, are identical for the Agent Portal and the Admin Panel.

**REQ-LOG-010 — Lockout counter reset on success**
The system shall reset the Failed Attempt Count to zero only after the login process is fully completed — including successful OTP verification, when OTP is required.

*Acceptance Criteria*
- AC-1: A successful login clears any prior failed-attempt history for that account. "Successful login" means the full authentication process has completed, including OTP verification when applicable — not merely successful password validation.
- AC-2: A previously locked-out account that is no longer within its lockout period, and then logs in successfully, has no residual effect from the earlier lockout.
- AC-3: A failed OTP attempt does not increment the Failed Attempt Count (password lockout counter). OTP failures are tracked separately under the OTP Attempt/Resend Count, owned by the OTP specification.

**REQ-LOG-011 — Administrative unlock**
The system shall allow an authorized administrator to view an account's lockout status and unlock it before its lockout period naturally expires.

*Acceptance Criteria*
- AC-1: An administrator can check whether a given account is currently locked.
- AC-2: An administrator can unlock a locked account on demand.
- AC-3: The administrative unlock action clears both the password-attempt lockout (owned by Login) and the OTP attempt/resend lockout (owned by the OTP specification), restoring the user's ability to complete the full login journey without requiring a separate OTP-specific unlock action.

### 3.4 OTP Step-Up Verification

**REQ-LOG-012 — OTP trigger conditions**
The system shall decide, immediately after valid credentials are verified, whether OTP verification is required before login can complete.

*Acceptance Criteria*
- AC-1: Login first validates credentials (Identifier and Password) per REQ-LOG-004 through REQ-LOG-007; invalid credentials deny login with the message defined in REQ-LOG-006 and REQ-LOG-012 does not apply.
- AC-2: Once credentials are valid, the system checks the current OTP-enablement configuration for the account's user type (general users vs. admin users, independently configurable). This configuration is owned by the Admin Settings feature (or its underlying configuration table) and is only consumed here.
- AC-3: If OTP is disabled for that user type, login completes immediately and the user is navigated directly to the Dashboard; no OTP flow is triggered.
- AC-4: If OTP is enabled for that user type, the system checks whether the requesting device has a valid, non-expired trusted-device record (REQ-LOG-015).
- AC-5: If a valid, non-expired trusted-device record exists, OTP verification is bypassed; login completes and the user is navigated directly to the Dashboard.
- AC-6: If no valid trusted-device record exists, the system starts the OTP flow. Available OTP delivery channels and the user's selection behavior are governed by the separate OTP specification.
- AC-7: If OTP verification succeeds, login completes, the user is navigated to the Dashboard, and a trusted-device record is created automatically (REQ-LOG-015) — no user action is required to enable this. If OTP verification fails, login does not complete and the user remains in the OTP flow, subject to the retry/lockout rules defined in the OTP specification.

**REQ-LOG-015 — Trusted device**
The system shall automatically create a trusted-device record whenever OTP verification succeeds, and shall let a login from a device with a valid, non-expired trusted-device record bypass OTP.

*Acceptance Criteria*
- AC-1: A trusted-device record is created and stored, with an expiration time, automatically upon successful OTP verification — this happens unconditionally and requires no user action such as a "Remember this device" selection.
- AC-2: A subsequent login from a device with a still-valid trusted-device record skips OTP (REQ-LOG-012 AC-5).
- AC-3: The "Remember Me" option, on either portal, is unrelated to trusted-device creation; it instead remembers login identifier details for prefill (REQ-LOG-019).
- AC-4: A trusted-device record remains valid for 15 days from the date of successful OTP verification.

### 3.5 Successful Login

**REQ-LOG-016 — Effect of a successful login**
The system shall establish an authenticated session for the user upon successful login and route them to their portal's landing area.

*Acceptance Criteria*
- AC-1: On the Agent Portal, a successful login redirects the user to their dashboard.
- AC-2: On the Admin Panel, any prior session is invalidated, a new session is established, and the user is redirected to their dashboard.
- AC-2a: Unlike the Admin Panel (AC-2), the Agent Portal does not invalidate prior sessions on login; multiple concurrent active sessions are permitted for the same Agent Portal account.
- AC-3: The authenticated session maintains the information required to support password expiry enforcement (supporting REQ-LOG-008).

### 3.6 CAPTCHA

**REQ-LOG-017 — CAPTCHA is not part of the login flow**
The system shall not require a CAPTCHA challenge at any point in the login flow.

*Acceptance Criteria*
- AC-1: No CAPTCHA is presented during credential entry, OTP entry, or any other step of login.
- AC-2: Note: a setting named `CAPTCHA_STATUS` exists elsewhere in the platform's configuration, but it governs the Wallet Top-up feature in the Agent Portal, not Login. It is unrelated to this document.

### 3.7 Messaging & Validation Feedback

**REQ-LOG-018 — Immediate data-entry feedback**
The system shall provide immediate, field-level feedback for invalid input during data entry, without that feedback replacing authoritative server-side validation.

*Acceptance Criteria*
- AC-1: Empty-field and format violations (REQ-LOG-003, REQ-LOG-004) are flagged at data-entry time.
- AC-2: All checks in this document are re-enforced authoritatively on the server regardless of what client-side feedback showed.

### 3.8 Remember Me

**REQ-LOG-019 — Remember Me (login identifier retention)**
The system shall, when Remember Me is selected on either portal, remember the user's login identifier details for prefill on future login attempts, independently of the trusted-device/OTP mechanism.

*Acceptance Criteria*
- AC-1: When Remember Me is selected, the portal's identifier fields are remembered and prefilled the next time the user visits the login form — Email and Agency Code on the Agent Portal, Username on the Admin Panel.
- AC-2: The Password is never remembered or prefilled by this option.
- AC-3: Remember Me does not control trusted-device creation (REQ-LOG-015) and does not bypass OTP verification; those are governed entirely by the automatic trusted-device mechanism.

---

## Implementation Note — Login Check Execution Order

The relative execution order of the independent login checks — account lockout (REQ-LOG-009), credential verification (REQ-LOG-006), account authorization (REQ-LOG-007), password expiry (REQ-LOG-008), and OTP trigger (REQ-LOG-012) — is not specified in this document. Each check's outcome is defined independently within its respective requirement. No legacy evidence has been identified establishing a specific business rule governing their evaluation sequence. Absent such evidence, the ordering of these checks is considered an implementation detail to be determined during design and implementation.

---

## 4. Requirement Traceability Summary

| Area | Requirements |
|---|---|
| Data model | REQ-LOG-001 |
| Access & credential entry | REQ-LOG-002 … REQ-LOG-005 |
| Credential verification | REQ-LOG-006 … REQ-LOG-008 |
| Failed-attempt lockout | REQ-LOG-009 … REQ-LOG-011 |
| OTP & Trusted Device | REQ-LOG-012, REQ-LOG-015 |
| Successful login | REQ-LOG-016 |
| CAPTCHA | REQ-LOG-017 |
| Messaging & feedback | REQ-LOG-018 |
| Remember Me | REQ-LOG-019 |

### 4.1 Consolidated Message Inventory

| Event | Text |
|---|---|
| Missing Username/Password (Admin) | Please enter Username and Password! |
| Missing Password only (Admin) | Password is required. |
| Space in Username (Admin) | Spaces not allowed in user name! |
| Space in Password (Admin) | Spaces not allowed in Password |
| '@' in Username (Admin) | Please enter a valid user without '@' |
| Email used as Username (Admin) | Sorry, you cannot use your email. Please use your username. |
| Invalid credentials (either portal) | Invalid credentials. Please try again. |
| Account not authorized | Sorry, Your account is not authorized. Please contact the system administrator. |
| Account locked | Your account has been locked due to too many failed login attempts. Please contact the system administrator. |

---

## 5. ⚠️ Warnings — Inconsistencies to Resolve During Planning

> These are defects, contradictions, ambiguities and gaps observed in the legacy system. They are **flagged, not reproduced**. Each requires an explicit decision in the planning phase before implementation begins.
>
> **Severity:** **H** = High (data integrity, security, or workflow-bypass risk) · **M** = Medium (functional ambiguity requiring a business decision) · **L** = Low (cosmetic, wording, or dead-weight)

### 5.1 High Severity

None — all High-severity items have been resolved.

### 5.2 Medium Severity

None — all Medium-severity items have been resolved.

### 5.3 Low Severity

None — all Low-severity items have been resolved.

### 5.4 Warning Index by Severity

| Severity | Count | IDs |
|---|---|---|
| **High** | 0 | — |
| **Medium** | 0 | — |
| **Low** | 0 | — |
| **Total** | **0** | |

---

## 6. Assumptions & Notes

- This specification is reverse-engineered from the legacy system's observable behaviour and message catalogue. Where legacy behaviour is defective or ambiguous, the corrected behaviour is deliberately **not** guessed — it is deferred to planning through the warnings in Section 5.
- The configuration values this feature consumes (lockout threshold and duration, OTP length/validity/resend limits, password-policy values) are configuration entries owned by the **Admin Settings** feature; their business meaning and management belong to that specification.
- Password expiry (REQ-LOG-008) and the resulting forced-change flow are the same mechanism documented in the **Change Password** specification (`REQ-PWD-011`, `REQ-PWD-012`); this document does not restate that logic, only its trigger point at login.
- Numeric internal codes, session/token mechanics, and hashing/storage details are described here only insofar as they establish a business rule; implementation detail beyond that is intentionally omitted.
- Screen layout, styling, and exact control types are implementation concerns and are intentionally omitted, except where a behaviour (e.g., a masked OTP recipient display) is itself a business rule.
- See the standalone **Implementation Note — Login Check Execution Order** (following Section 3) regarding the unspecified evaluation sequence of the independent login checks.
