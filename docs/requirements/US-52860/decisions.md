# Confirmed Human Decisions — US 52860

**Human authority.** This file outranks the agent's reading of the requirement and
**survives every regeneration** of `requirement-analysis.md`. The agent may cite these
decisions; it may never add to this file on its own.

---

## D-01 — Test Case scope is CITY ONLY

**Decided by:** human · **Date:** 2026-08-18 · **Source:** explicit session instruction

Test Cases for this User Story cover **City functionality only**.

The attached specification `Geo-Master-Requirements-City-Region-State.md` documents three
features (City, Region, State) plus shared and relationship rules. **Country, State,
Region, and any other entity are OUT OF SCOPE** and must not produce a Test Case, even
where the specification states a requirement for them.

Every Test Case must be directly related to City functionality or a City-specific
requirement/change. A requirement appearing in the specification is **not** sufficient
justification for a Test Case if it belongs to another entity.

**Permitted:** Country and State records used as **preconditions / test data** for a City
case, and shared rules (`REQ-SHR-*`) verified **on a City record through the City
feature**.

**Not permitted:** any assertion whose subject is a State, Region, or Country record.

Verbatim: *"The final Test Case scope is: CITY ONLY."*

---

## D-02 — The Change Request amends the Requirement; it is not a separate requirement

**Decided by:** human · **Date:** 2026-08-18 · **Source:** explicit session instruction

`City-CR.md` is a **requested change/update to** the main Requirement
`Geo-Master-Requirements-City-Region-State.md`. It is **not** a separate feature and not
an independent requirement.

The analysis must:

1. Understand the original Requirement.
2. Understand the Change Request.
3. **Apply** the Change Request to the original Requirement when determining the final
   expected behaviour.
4. **Preserve the distinction** between the original Requirement and the requested
   changes — they must remain separately identifiable in the artifact, never merged into
   one smooth account.

Final expected behaviour = baseline specification **with the Change Request applied**.
Where the CR overrides the baseline, only the CR behaviour is the expectation.

---

## Decisions still needed

These are **not** decided. They are listed here only so the open questions in
`requirement-analysis.md` §11 have a visible home. Do not treat any of them as answered.

| Open question | Subject | Blocking |
|---|---|---|
| OQ-04 | Uniqueness scope of City Code / City Name — global (spec) vs within-state (story AC-5) | **Yes** |
| OQ-06 | What a user WITH approval authority can do on an Inactive City (missing matrix row, WARN-016) | **Yes** |
| OQ-07 | Which "Inactive" the *Update / No / Inactive* row means — Pending, Rejected, or Approved-but-deactivated (WARN-017) | **Yes** |
| OQ-03 | Definitive City Name format rule — letters only, or letters + spaces (WARN-006) | **Yes** |
| OQ-18 | Whether Reject saves or discards the amendment (WARN-018) | Yes, for that assertion |
| OQ-19 | Which buttons require approval remarks, and whether remarks are mandatory (WARN-019) | Yes, for that assertion |
| OQ-01 | `City-Change-Request.md` (the CR's full detail) is not attached | Partly |
| OQ-02 | Whether this story's deliverable is UI, API, or both | Blocks test design |

---

## D-03 — City Code / City Name uniqueness is GLOBAL

**Decided by:** human · **Date:** 2026-08-18 · **Source:** explicit session instruction
**Closes:** OQ-04 (blocking) · **Supersedes:** User Story AC-5's "within the selected state"

City Code and City Name uniqueness is **GLOBAL across the City feature** — not limited to
the selected State.

The specification's reading wins (`REQ-SHR-006`, `REQ-CIT-002` AC2, `REQ-CIT-003` AC2).
**User Story AC-5** (*"unique within the selected state"*) is therefore **not** the
expected behaviour and must not be tested as written.

Consequence for Test Cases: a City Code or City Name that already exists **anywhere** in
the City feature is rejected, regardless of which State is selected. A duplicate under a
*different* State is still a duplicate.

Verbatim: *"City Code/Name uniqueness is GLOBAL across the City feature, not limited to
the selected State."*

---

## D-04 — City Name accepts LETTERS + SPACES

**Decided by:** human · **Date:** 2026-08-18 · **Source:** explicit session instruction
**Closes:** OQ-03 (blocking) · **Resolves:** WARN-006

The definitive City Name format rule is **letters and spaces**.

The source's contradiction is resolved in favour of the intended (disabled) pattern, not
the user-facing *"City Name is alpha"* message. Names such as `New York` are **valid**.

Consequence for Test Cases: a City Name containing only letters and/or spaces is accepted;
a City Name containing digits or special characters is rejected. Length limits from
`REQ-CIT-003` (1–125) continue to apply independently.

Verbatim: *"City Name accepts LETTERS + SPACES."*

---

## D-05 — No Test Cases for the undefined behaviour paths (OQ-06, OQ-07)

**Decided by:** human · **Date:** 2026-08-18 · **Source:** explicit session instruction
**Applies to:** OQ-06, OQ-07

**Do NOT create Test Cases** for these undefined behaviour paths, and **do not invent
Expected Results** for them.

- **OQ-06** — *Update / authority = Yes / Inactive record.* The Change Request's button
  matrix has no such row (WARN-016). **No Test Case.**
- **OQ-07** — the three meanings of "Inactive" in the *Update / No / Inactive* row:
  **Pending**, **Rejected**, **Approved-but-deactivated** (WARN-017). The row itself is
  testable only where the meaning is unambiguous; the ambiguous interpretations get
  **no Test Case**.

This decision **rejects the observation-only alternative** that was offered (the
TC-53717-051/052 pattern). These paths produce **no Test Case at all** — not an
observation-only one.

Both remain **recorded as known coverage gaps** in the Test Case artifact, so they are
visibly undecided rather than silently dropped. Neither is closed as a question; only the
instruction not to test them is decided.

Verbatim: *"OQ-06 and OQ-07: Do NOT create Test Cases for these undefined behavior paths.
Do not invent Expected Results."*
