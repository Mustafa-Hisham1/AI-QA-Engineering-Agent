# Test Cases — US 1 (synthetic, artifact check only)

| Provenance | Value |
|---|---|
| Content fingerprint at generation | `0000000000000000000000000000000000000000000000000000000000000000` |

TC-1-001…003 fail on purpose and TC-1-004 passes on purpose. See `src/automation/artifact-check/artifact-check.spec.ts`.

---

### TC-1-001 — Submitting the form shows a page that never appears

| | |
|---|---|
| **Title** | `[ARTIFACT-CHECK][Artifact Check][Login Form] Verify a page that never renders appears after submitting credentials` |
| Project / Module / Feature-Page | ARTIFACT-CHECK / Artifact Check / Login Form |
| Test Type | Synthetic · Leak check |
| Requirement Reference | CHECK-1 |
| Decisions Applied | — |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Precondition**
- The local check page is loaded.

**Test Data**
- Account handle: `CHECK_ACCOUNT`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter the credentials | The values are accepted |
| 2 | Submit and expect a page that never appears | The text "This text is never rendered" is visible |

---

### TC-1-002 — A field that never becomes editable

| | |
|---|---|
| **Title** | `[ARTIFACT-CHECK][Artifact Check][Login Form] Verify the password can be entered into a field that stays disabled` |
| Project / Module / Feature-Page | ARTIFACT-CHECK / Artifact Check / Login Form |
| Test Type | Synthetic · Leak check |
| Requirement Reference | CHECK-2 |
| Decisions Applied | — |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter the password into a field that never becomes editable | The password is entered |

---

### TC-1-003 — The form container shows text it never has

| | |
|---|---|
| **Title** | `[ARTIFACT-CHECK][Artifact Check][Login Form] Verify the form container shows text it never renders` |
| Project / Module / Feature-Page | ARTIFACT-CHECK / Artifact Check / Login Form |
| Test Type | Synthetic · Leak check |
| Requirement Reference | CHECK-3 |
| Decisions Applied | — |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter the credentials | The values are accepted |
| 2 | Expect text the form never shows | The form shows "This text is never rendered" |

---

### TC-1-004 — The login form is shown (passes on purpose)

| | |
|---|---|
| **Title** | `[ARTIFACT-CHECK][Artifact Check][Login Form] Verify the login form is shown after entering credentials` |
| Project / Module / Feature-Page | ARTIFACT-CHECK / Artifact Check / Login Form |
| Test Type | Synthetic · Leak check |
| Requirement Reference | CHECK-4 |
| Decisions Applied | — |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |
| Need Automation | Yes |

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter the credentials | The values are accepted |
| 2 | Confirm the login form is shown | The "Artifact check" heading is visible |
