# City — Change Request (Summary)

**Module:** City · **Spec:** `Geo-Master-Requirements-City-Region-State.md` · **Full detail:** `City-Change-Request.md` · **Date:** 2026-08-05

---

## The change

| Action | Approval Authority | Record Status | Buttons |
|---|---|---|---|
| Create | Yes | N/A | Cancel, Approve |
| Create | No | N/A | Cancel, Send for Approval |
| Update | Yes | Active | Cancel, Approve, Reject |
| Update | No | Active | Cancel, Update |
| Update | No | Inactive | Cancel, Send for Approval |

---

## Points

- **Create with authority** → City is *Approved* + **Active** in one step. No pending stage, no second approval.
- **Create without authority** → *Pending for Approval* + **Inactive**, as today.
- **Update with authority** (Active record) → the save **is** a decision: Approve keeps it Active and records a fresh approval; Reject makes it *Rejected* + Inactive. No plain Update for them.
- **Update without authority** (Active record) → applies directly, **stays Active and Approved**. It no longer drops back to Inactive + Pending.
- **Update without authority** (Inactive record) → resubmits: *Pending for Approval*, stays Inactive.
- **Cancel** is on every screen, always first, and saves nothing — not the amendment, not the decision.
- Status is **derived from the button pressed**, never taken from the submission.
- The matrix is enforced on the **back end too**, not just by which buttons are drawn.
- Self-approval is **intended** — the same user may create and approve; creator and approver are recorded as the same person.
- **Region and State are not changed.** All shared-rule changes are City-scoped overrides.

---

## New requirements

`REQ-CIT-011` Approval authority · `REQ-CIT-012` Status of a new City · `REQ-CIT-013` Direct decision · `REQ-CIT-014` Buttons matrix · `REQ-CIT-015` Status from the button · `REQ-CIT-016` Cancel · `REQ-CIT-017` Enforced both sides

**Amended:** `REQ-CIT-004`, `REQ-CIT-007`, `REQ-CIT-009`
**Overridden for City only:** `REQ-SHR-002` AC-1/AC-2/AC-5, `REQ-SHR-004`

---

## Open points — need a decision

| ID | Sev | Issue |
|---|---|---|
| `WARN-016` | **H** | **Missing row:** *Update / Yes / Inactive*. A user **with** authority has no buttons on an Inactive City |
| `WARN-017` | **H** | **"Inactive" means three things** — *Pending*, *Rejected*, or *Approved but deactivated*. One row covers all three: it contradicts `REQ-SHR-003` on pending records, and resubmits an already-approved one |
| `WARN-018` | M | Is an amendment saved when the approver presses **Reject**, or discarded? |
| `WARN-019` | M | Which buttons require **approval remarks**, and are they mandatory? |
| `WARN-020` | L | City now differs from Region and State on the shared rules |

*"Active" is exact — `REQ-SHR-001` says Active can only mean Approved. "Inactive" is not. That is where both High items come from.*
