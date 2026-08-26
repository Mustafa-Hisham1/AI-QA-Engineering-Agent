# Confirmed Decisions — US 53717: Login (Authentication)

**Authority: human.** Every decision here was stated explicitly by the human in a session.
This file outranks the agent's reading of the requirement and **survives any regeneration of
`requirement-analysis.md`**. The agent may read it and cite it; it may never add to it.

Decisions are tagged **[D]** in the analysis — never **[I]**.

| Recorded | Source |
|---|---|
| 2026-08-13 | D-01…D-08 — human statement in session, given after reviewing the first requirement analysis of US 53717 (rev 8, fingerprint `334a9561…`) |
| 2026-08-13 | D-09 — human clarification in the same session, narrowing the QA test scope |
| 2026-08-13 | D-10…D-12 — human statement in the same session, closing the last three blocking questions (OQ-08b, OQ-07b, OQ-24) |

---

## D-01 — Login scope is UI **and** API

The Login scope for this User Story covers both the UI and the API.

**Closes:** OQ-01 (the story title's `[INT]` / `Q3-API-INTE-033` reference).

**Applies to the design and requirement scope.** The QA *test* scope is narrower — see **D-09**.

## D-02 — Passwords containing spaces are invalid on both portals

A password containing a space is invalid on the **Agent Portal** as well as the **Admin
Panel**.

**Closes:** OQ-02. The specification stated the rule only inside REQ-LOG-004 (Admin Panel
identifier format); it now applies to both portals.

**Note:** whether "contains a space" includes leading/trailing whitespace and tabs, and
whether input is trimmed before validation, remains undecided — see OQ-03.

## D-03 — Every login problem must show an appropriate error message; never invent wording

Any login problem must display an appropriate error message to the user. **Where the source
does not define the exact wording, the wording must not be invented.** Expected results assert
that an appropriate message is displayed; they assert exact text only where the specification
defines it.

**Closes:** OQ-04 (Admin Panel case of empty Username with a Password supplied), OQ-05 (Agent
Portal has no specified message texts), OQ-19 (whether disabled and unauthorized accounts show
different wording).

**Consequence:** the nine message strings in the specification's §4.1 stay exact-text
assertions. Everything else asserts *presence and appropriateness* of a message. A missing
message is a defect; unexpected-but-appropriate wording is not.

## D-04 — A wrong Agency Code is a failed login attempt and increments the counter

Submitting a wrong Agency Code is a failed login attempt and **increments the Failed Attempt
Count**, so it can contribute to lockout.

**Closes:** the behavioural half of OQ-06.

**Still open:** Agency Code format, length and allowed characters — see OQ-06. The message
shown follows D-03; the specification's `Invalid credentials. Please try again.` is the
plausible candidate but is not stated for this case, so it is not asserted as exact text.

## D-05 — Failed login conditions identified in the requirements increment the counter

Every failed-login condition identified in the requirements increments the Failed Attempt
Count — not only an incorrect password.

**Closes:** the core of OQ-08 (only an incorrect password was stated to increment).

**Applies unambiguously to:** unrecognized identifier, incorrect password, wrong Agency Code
(D-04), and a refused disabled/unauthorized account.

**Extended by D-10**, which adds the expired-password path and confirms the "not already
locked" precondition. **D-10 adds to D-05 and does not repeal it** — the disabled/unauthorized
increment established here still stands. **[I — reading of how the two decisions compose; say
so if that was not the intent.]**

## D-06 — Lock status is checked before credential authentication

The account lock check runs **before** credential authentication.

**Closes:** the lockout half of OQ-07 (check execution order, which the specification
deliberately left to implementation).

**Superseded in scope by D-11**, which keeps this rule and defines the not-locked branch as
well. D-06 and D-07 remain valid; D-11 is the complete ordering.

## D-07 — An already-locked account stops immediately, with no further counting

If the account is already locked, the system shows the locked message and **stops**. It does
**not** authenticate the credentials, and it does **not** increment the Failed Attempt Count
again.

**Closes:** the combined-condition cases "locked + correct password" and "locked + wrong
password" — both show the lockout message defined in REQ-LOG-009 AC-3, and neither changes the
counter.

## D-08 — The counter resets to zero when the lockout period expires

After the 30-minute lockout period expires, the Failed Attempt Count **resets to zero**.

**Closes:** OQ-10. The specification, read literally, reset the counter only on full
successful authentication, which would have re-locked the account on the very next single
failure after a lockout expired. That reading is now rejected: a user whose lockout has
expired starts again with a full allowance of 5 attempts.

## D-09 — Test-case scope is **UI only** for now

The Login **design and requirement** scope is UI + API (D-01), but the **current QA test-case
scope is the UI only**. API-level test cases are not produced yet.

**Closes:** OQ-23. There is therefore **no conflict** with `docs/product-decisions.md` §1
("V1 testing scope is Web/UI; backend/API testing is postponed") — that decision stands
unchanged and needs no reversal.

**Consequence:** every requirement in the analysis is still recorded at the behavioural level,
so the API layer is documented and traceable, but coverage generated from it targets the UI.
Requirements whose only realistic verification is below the UI — chiefly REQ-LOG-018 AC-2 /
REQ-LOG-003 AC-2, the "server re-enforces validation regardless of the client" rule — are
noted as **not coverable within the current test scope** rather than silently dropped.

## D-10 — What increments the Failed Attempt Count

**While the account is not already locked:**

- **Invalid login credentials** increment the Failed Attempt Count.
- An **expired password with otherwise valid credentials** also increments the Failed Attempt
  Count.

**Pre-authentication field validation failures** (empty values, spaces, invalid format) are
**not decided**. Whether they count as authentication attempts must not be invented; it stays
an open question unless the source defines it. The source does not — see **OQ-26**.

**Closes:** OQ-08b, whose expired-password half this settles. Its pre-authentication half
continues as **OQ-26**, deliberately unresolved.

**Composition with D-05:** D-10 adds the expired-password path; it does not repeal D-05, so a
refused disabled/unauthorized account still increments. **[I — reading of how the two decisions
compose.]**

**Derived, not stated** **[I]**: an expired password increments the counter *and* routes into
the forced change (REQ-LOG-008). If that forced change succeeds, login completes, and
REQ-LOG-010 then resets the counter to zero. So the increment is transient on the success path
and persistent only if the user abandons the forced change.

## D-11 — Login evaluation order and the generic credential error

**If the account is already locked:**

1. Show the locked-account error.
2. **Stop** the login flow.
3. Do **not** validate or authenticate the credentials.
4. Do **not** increment the Failed Attempt Count again.

**If the account is not locked:**

1. Validate the submitted credentials.
2. **If invalid** — display a **generic** login error stating that the entered data is
   incorrect. **Never reveal** whether the identifier or the password was the incorrect one.
   Increment the Failed Attempt Count.
3. **If valid** — continue with the remaining applicable account and password checks, and
   proceed per the relevant requirement, including the expired-password flow.

**Closes:** OQ-07b. The order is now: **lock check → credential validation → remaining
account/password checks → OTP decision**.

**Consequences that were previously ambiguous:**

- **Disabled account + wrong password** → the **generic credential error**, not the
  authorization message. The authorization message appears only once credentials are valid.
- **Disabled account + correct password** → credentials valid, so the flow continues to the
  remaining checks and the authorization message applies (REQ-LOG-007 AC-1).
- The generic error corresponds to the specification's defined text
  `Invalid credentials. Please try again.` (REQ-LOG-006 AC-1) on both portals, which satisfies
  the no-information-leakage rule.

**Residual, narrow** **[?]**: when credentials are valid but the account is **both** disabled
**and** holds an expired password, which of the two remaining checks wins is still unstated.
See **OQ-27** — a deliberately constructed compound state, non-blocking.

## D-12 — Administrative unlock resets the counter

When an administrator unlocks an account: the account becomes **unlocked** and the **Failed
Attempt Count is reset to zero**.

**Closes:** OQ-24. An unlocked user therefore starts again with the full allowance of 5
attempts, exactly as after a natural 30-minute expiry (D-08). The two unlock paths now behave
identically with respect to the counter.
