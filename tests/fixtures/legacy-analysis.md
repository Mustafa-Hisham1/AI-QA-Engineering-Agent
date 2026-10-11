# Requirement Analysis — US 10001: Example Feature (Example Module)

**Status:** QA analysis complete. **2 human decisions applied (D-01…D-02).**
**No blocking open questions remain.** No test cases generated yet.

This fixture is a requirement analysis written in the **old provenance format** —
before the `API source` and `UI exploration` rows existed. It exists so the
method layer can prove that such an analysis still parses, without depending on
any project's story artifact. Its content is deliberately neutral placeholder
text: no real client, module, feature or story.

Every statement below is tagged:

| Tag | Meaning |
|---|---|
| **[E]** | **Explicit** — stated in the User Story or the attached specification. The reference is given. |
| **[D]** | **Confirmed decision** — explicitly decided by the human. Recorded in `decisions.md` and cited by ID. |
| **[I]** | **QA inference** — not stated in the sources; my reading or engineering judgement. Never treat as a requirement. |
| **[?]** | **Open question** — the sources are silent, vague, or contradictory. Requires a human decision. |

---

## 1. Provenance and authority

### 1.1 Sources

| | |
|---|---|
| Azure DevOps work item | **10001** — `[EXAMPLE] Example Feature Screen` |
| Work item type | **User Story** (verified by the reader) |
| Project / Area / Iteration | EXAMPLE / `EXAMPLE\Area 1` / `EXAMPLE\Sprint 1` |
| State | New (New) |
| Priority / Story points | 2 / not set |
| Parent work item | 10000 |
| Work item revision | **rev 3**, last changed 2026-01-02T00:00:00.00Z |
| Content fingerprint | `1111111111111111111111111111111111111111111111111111111111111111` |
| Attachment | `example-requirements.md` — 1 024 bytes, sha256 `2222222222222222222222222222222222222222222222222222222222222222` |
| Local source snapshot | `source/example-requirements.md` |
| Confirmed decisions | `decisions.md` — D-01…D-02 |
| Read at | 2026-01-02T00:00:00Z, via `npm run story:read -- 10001` |
| Last verified | 2026-01-02 — fingerprint re-checked, **unchanged**; no re-download or re-analysis needed |

**Note:** this analysis records **no `API source` row and no `UI exploration` row.**
That absence is the point of the fixture — a missing API row must be reported as
*not provided*, never as a change that forces a refresh.

**Source-of-truth documents:** the User Story description and its acceptance
criteria, plus the attached specification (requirement prefix `REQ-EXM-NNN`).

### 1.2 Authority

The User Story and its attachment are the source of truth. Confirmed human
decisions outrank the agent's reading and survive regeneration of this file. **[E]**

---

## 2. Scope

In scope: the Example Feature screen of the Example Module. **[E]**

Out of scope: every other module. Recorded as an explicit exclusion rather than
dropped. **[D]** (D-01)

---

## 3. Requirements

| ID | Requirement | Tag |
|---|---|---|
| REQ-EXM-001 | The screen presents a form with the required fields marked. | **[E]** |
| REQ-EXM-002 | Submitting an incomplete form is refused with a field-level message. | **[E]** |
| REQ-EXM-003 | A successful submission returns the user to the list. | **[E]** |

---

## 4. Open questions

None blocking. **[?]** Whether the list is paginated beyond ten rows is
unanswered by the sources and is not assumed here.
