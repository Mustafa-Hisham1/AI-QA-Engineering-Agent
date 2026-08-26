# BUG CANDIDATE 001 — WORKFLOW TEST — Remember Me option missing (dummy data)

| | |
|---|---|
| **Status** | **`Published`** — human-approved and created in Azure DevOps on 2026-08-23 |
| **Purpose** | **WORKFLOW TEST ONLY.** Validates the Bug publishing implementation and the new disjoint field mapping (`docs/product-decisions.md` §5.4) |
| Raised by | Human request, 2026-08-23. **No Test Case was executed** |
| **Azure DevOps Bug ID** | **[56329](https://dev.azure.com/tilde-technology/b1763c9b-14e8-46ae-9683-8947457e8c81/_workitems/edit/56329)** |

> **This is NOT a newly discovered product defect.** Its content is copied verbatim from
> **Bug 55482** (US 53717, RUN-002) and reused as dummy test data under a different parent.
> No requirement was analysed, no failure was classified from observation, and no browser
> was driven. Do not treat this Bug as a defect report about US 56109.

**`RUN-000` is deliberately not an execution run.** It carries no `execution-results.md`,
because nothing was executed. The directory exists only to give this test artifact the same
shape as a real Bug Candidate; the `000` number is reserved for non-execution artifacts so it
can never collide with a real `RUN-001`.

---

## Content source

Every field below is Bug 55482's content, unchanged except:

- **Description** gained a leading TEST BUG disclaimer naming 55482 as its source.
- **`relatedUserStoryId`** is **56109**, not 53717 — the parent for this test.

## Placement and metadata — human's explicit choice for THIS Bug

| | Value | Authority |
|---|---|---|
| Parent User Story | **56109** — `[INT] Admin-Agency-Agency - Apply Role "Q3-API-INTE-033"` | Human instruction |
| Area path | `NBO\NBO 1 (Zay)` | Inherited from US 56109 |
| Iteration | `NBO\Sprint 2` | Inherited from US 56109 |
| **Severity** | **`4 - Low`** | Human's explicit choice. Not proposed by the agent, not inherited from 55482 (which was also `4 - Low` — coincidence, not inheritance) |
| **Assignee** | `mostafa.albatal@tildetech.ae` | Human's explicit choice ("me / Mostafa") |
| **Priority** | **not written** — Azure DevOps applied its default (`2`) | Human instruction: keep the template default |

## Duplicate check — performed 2026-08-23

**Scope: US 56109 only** (`docs/product-decisions.md` §5.1). The story held **0 Bugs** before
this one, and no title match existed. **No Bug outside US 56109 was searched** — Bug 55482,
whose content this reuses, was deliberately not treated as a duplicate because it lives under a
different parent and is out of this workflow's scope.

## Known deviation — related Test Case belongs to another story

The Bug links to Test Case **55295 (`TC-53717-002`)**, which is a child of **US 53717**, not of
US 56109. This is inherent to reusing 55482's content under a different parent, was raised
before publishing, and the human approved it for this test. The tooling permitted it because it
enforces only `parentUserStoryId == relatedUserStoryId`; it does not require the related Test
Case to be a child of that story.

**For a real Bug this would be wrong** — traceability expects the Test Case to belong to the
owning story.

## Field mapping verified against Azure DevOps

Read back from Azure DevOps after creation. Each Bug Candidate section was searched for in **all
three** rich-text fields and had to appear in exactly one:

| Azure DevOps field | Content confirmed present | Size |
|---|---|---|
| **Description** | Description only — **no section headings at all** | 984 chars |
| **Repro Steps** | Preconditions · Steps to Reproduce · Expected Result · Actual Result · Requirement Reference · Related Test Case | 1449 chars |
| **System Info** | Environment (label + host) · Failure Classification · Evidence | 465 chars |

**20 separation checks passed** — 10 content phrases and 9 headings each found in exactly one
field, plus the assertion that Description carries no section heading. **Nothing duplicated
across the three fields.** A credential scan over all three found nothing.

The publisher's own post-create verification passed **12 checks**, including the three fields
asserted non-empty **separately** and the attachment downloaded (399017 bytes, byte count
matching the local file).

## Evidence

`docs/projects/NBO/executions/US-53717/RUN-002/evidence/tc-002-login-form-fullpage.png` — reused from RUN-002,
uploaded to Bug 56329 as a real Azure DevOps attachment. Rendered screenshot only; no
accessibility snapshot (invariant 7). Evidence remains **gitignored**.

## Cleanup

Bug 56329 is a **test artifact in a real Azure DevOps project.** Whether to close, delete, or
keep it is a human decision — nothing here removes it.
