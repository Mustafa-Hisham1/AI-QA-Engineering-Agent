# Test Cases — US 99001

| Provenance | Value |
|---|---|
| Content fingerprint at generation | `334a9561b7cb81fbaf6e6f2c9975044bcd3c702f838008052a67cb4c948d78d0` |

---

### TC-99001-001 — Login form presents the specified fields

| | |
|---|---|
| **Title** | `[DEMO][Authentication][Login - Portal] Verify the login form presents Email and Password` |
| Project / Module / Feature-Page | DEMO / Authentication / Login - Portal |
| Test Type | Positive · UI |
| Requirement Reference | REQ-LOG-002 AC-1 |
| Decisions Applied | — |
| Azure DevOps ID | **55294** |
| Review/Lifecycle Status | Published |

**Precondition**
- The portal URL is reachable and the user is **not** authenticated.

**Test Data**
- None.

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Open the login URL as an unauthenticated visitor | The login form is displayed |
| 2 | Inspect the form fields | An **Email** field and a **Password** field are present |

---

### TC-99001-002 — Valid credentials authenticate successfully

| | |
|---|---|
| **Title** | `[DEMO][Authentication][Login - Portal] Verify a valid user can sign in` |
| Project / Module / Feature-Page | DEMO / Authentication / Login - Portal |
| Test Type | Positive · UI |
| Requirement Reference | REQ-LOG-003 AC-2 |
| Decisions Applied | D-01 |
| Azure DevOps ID | — |
| Review/Lifecycle Status | Approved |

**Precondition**
- A valid account exists.

**Test Data**
- Account handle: `PRIMARY_VALID`

**Steps**

| # | Step | Expected Result |
|---|---|---|
| 1 | Enter the credentials for `PRIMARY_VALID` | The values are accepted |
| 2 | Click Login | The dashboard is displayed |

**Notes**
- Settle before judging the post-submit URL.
