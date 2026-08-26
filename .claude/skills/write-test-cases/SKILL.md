---
name: write-test-cases
description: Generate Test Cases for an analyzed User Story from its local Requirement Analysis and confirmed decisions, then AI self-review them into docs/projects/<KEY>/test-cases/US-<ID>/test-cases.md. Use when asked to write, generate, or regenerate the test cases for a User Story by ID. Takes the User Story ID as its argument.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git diff:*), Bash(git status:*), Bash(grep:*)
---

# Write Test Cases for a User Story

Produce or update the persistent **Test Case artifact** for a User Story from the Requirement
Analysis, confirmed decisions and source snapshot **already in this repository**.

This skill **reads local files and writes local files only.** It never modifies Azure DevOps,
never creates Test Cases or Bugs in Azure DevOps, never approves anything, and never commits.

## Step 0 — Resolve the active project, then the User Story ID

**Resolve the active project before reading anything.** `<KEY>` below means that project's
key, and every artifact path in this skill is under `docs/projects/<KEY>/`.

1. A key stated in the request (`--project <KEY>`, or "for <KEY>") wins.
2. Otherwise `QA_ACTIVE_PROJECT` in the environment.
3. Otherwise, **only** if exactly one directory under `docs/projects/` has a `profile.md`,
   use it.
4. Otherwise **stop and ask the human which project this story belongs to.**

**Never guess the project.** Do not infer it from the story ID — story IDs are unique per
Azure DevOps project, not globally. Do not search every project for a matching artifact and
use whichever turned up.

Then **read `docs/projects/<KEY>/profile.md`**. Take from it, and never invent:

- the **title project token** — the `[Project]` slot of every generated title
- the **module and feature/page vocabulary** in scope
- the **test-data handle names** this project defines
- the project's **terminology**

If the profile marks a value `TBD`, that value is **not configured**: stop and ask rather than
substituting another project's.

The ID is `$ARGUMENTS`. Below, `<ID>` means that value.

If no ID was supplied, ask for one and stop. Do not guess an ID.

## Scope boundary

- **Do not re-analyse the User Story.** The Requirement Analysis is the source of truth here.
- **Do not read Azure DevOps.** No `npm run story:read`, no other fetch. If the analysis is
  missing or stale, stop and say so — refreshing it is the `analyze-story` skill, a separate
  workflow with a separate review.
- **Do not publish.** Creating these as children of the User Story in Azure DevOps is a later
  step and needs explicit human approval immediately before that write.
- **Do not approve.** You may set `AI-Reviewed`; only an explicit human statement makes a test
  case `Approved`.

---

## Step 1 — Locate the inputs

```
docs/projects/<KEY>/requirements/US-<ID>/requirement-analysis.md    the analysis      (required)
docs/projects/<KEY>/requirements/US-<ID>/decisions.md               human decisions   (read if present)
docs/projects/<KEY>/requirements/US-<ID>/source/                    verbatim snapshot (read if present)
docs/projects/<KEY>/test-cases/US-<ID>/test-cases.md                the output
```

- **No `requirement-analysis.md`** → **stop.** Report that US <ID> has not been analysed and that
  the `analyze-story` skill must run first. Do not analyse it yourself here, and do not generate
  test cases from the story title.
- **Analysis present but marked incomplete, or carrying blocking open questions** → stop and
  report which ones. A blocking question means at least one expected result would be a guess.
  Non-blocking questions do **not** stop this skill.

## Step 2 — Read everything before writing anything

Read, in this order:

1. `docs/projects/<KEY>/requirements/US-<ID>/decisions.md` — **human authority.** It outranks the analysis where
   they differ. Every decision it records governs the expected results.
2. `docs/projects/<KEY>/requirements/US-<ID>/requirement-analysis.md` — in full, including the coverage map, the
   open questions (both open and closed), the message inventory, and the test-data
   prerequisites.
3. `docs/projects/<KEY>/requirements/US-<ID>/source/` — the verbatim requirement text, for exact message strings
   and acceptance criteria wording. **Quote message text only from here or from the analysis's
   exact-text table.**
4. `docs/product-decisions.md` §3, §4, §6, §6.1, §8, §15 — the mandatory test case fields, the
   test data rules, the review model, the status vocabulary and the coverage definition of done.

## Step 3 — Decide whether work is needed

If `docs/projects/<KEY>/test-cases/US-<ID>/test-cases.md` already exists, compare its recorded **content
fingerprint** with the one in the analysis's provenance table:

- **Fingerprints match and no decision is newer than the artifact** → do not regenerate. Report
  that the set is current, with its case count and status breakdown, and stop.
- **Fingerprints differ** → the requirement changed. Treat this as an **update**: keep every
  existing Test Case ID stable, revise the affected cases, add new ones with new IDs, and mark
  what changed and why. **Never renumber.** A published Azure DevOps ID or an approval already
  refers to an ID.
- **Human-set statuses (`Approved`, `Needs-Changes`, `Rejected`) and recorded Azure DevOps IDs
  must survive an update untouched.** Never reset an `Approved` case to `AI-Reviewed` because
  you rewrote its neighbour.

## Step 4 — Determine scope and title fields

From the analysis, take the **Project**, **Module** and **Feature/Page** values it recorded —
they are structured fields, not something to parse out of a title. A requirement with more than
one surface (for example two portals) gets a distinct Feature/Page value per surface.

Titles follow the mandatory convention and are **generated from** those fields:

```
[Project][Module][Feature/Page] Verify <expected outcome> when <condition>
```

State the outcome and the trigger. Never write "Check login" or "Test validation".

## Step 5 — Design the coverage

Work from the analysis's **coverage map**: every requirement it lists gets coverage, or gets an
entry in the artifact's *Deliberately not covered* table with a reason and what would unblock
it. A silently skipped requirement is the failure mode this step exists to prevent.

Cover, where the requirement supports it:

- **Positive** — each main flow, per surface.
- **Negative** — each defined failure condition.
- **Validation** — mandatory fields, format rules, forbidden characters.
- **Boundary** — thresholds from **both** sides. A threshold case that only proves the limit
  fires never detects an off-by-one; assert that it does **not** fire one step below.
- **State** — account/entity states, transitions, counters, sessions, and the compound states
  the analysis identifies.
- **Failure and error handling** — including behaviour that must *not* happen (a negative
  requirement is testable).
- **Security-relevant behaviour** where the requirement states it — for example messages that
  must be indistinguishable, or values that must never be retained.

Then remove waste:

- Merge cases whose assertion is the same rule applied to a different field, using one case with
  a step per field. Do not create near-identical Azure DevOps items with no extra diagnostic
  value.
- Drop a case that is another case's precondition or main flow re-stated.
- Do not chase a percentage (`product-decisions.md` §15). Meaningful requirement coverage is the
  target.

## Step 6 — Write each test case

Every case carries every field from `docs/product-decisions.md` §3:

| Field | Rule |
|---|---|
| Internal Test Case ID | `TC-<ID>-NNN`, zero-padded, assigned once and **never reused or renumbered** |
| Title | Generated from the structured fields, per Step 4 |
| Project / Module / Feature-Page | Structured, from the analysis |
| Test Type | The coverage kinds from Step 5 |
| Requirement Reference | The source's own requirement/AC IDs |
| Decisions Applied | The `[D]` decision IDs that govern this case, or `—` |
| Azure DevOps ID | `—` until published |
| Review/Lifecycle Status | `AI-Reviewed` after your self-review — never `Approved` |
| Precondition | The state the case needs, and how to reach it |
| Test Data | Scenario-specific values, per the rules below |
| Steps | Numbered, with an **Expected Result per step** — the agent executes step by step |
| Notes | Optional: caveats, attempt budgets, open-question references, why a choice was made |

Rules that decide whether the set is trustworthy:

1. **Never invent an expected result, a message, a limit, or a business rule.** If the source
   does not define it, the source not defining it *is* the finding.
2. **Assert exact message text only where the source defines it.** Everywhere else the expected
   result is that *an appropriate message or field-level feedback is displayed* — a missing
   message is a defect, differing appropriate wording is not.
3. **Never assert a deliberately undecided behaviour.** For each such question, write an
   **observation-only** case: assert what is known, record what is observed, and say explicitly
   that nothing is asserted about the undecided part. Say which open question it will answer.
   These cases must not FAIL on the observed behaviour — only on a crash or a missing response.
4. **Never assert what the UI cannot observe.** A system-managed value that is never displayed
   cannot be an expected result. Assert its observable consequence instead, in the case where
   that consequence appears, and record the reasoning in Notes.
5. **Every case is independently executable** (`product-decisions.md` §4). A case that needs a
   prior state creates it in its own steps and states how to reset. **No case may depend on
   another having run.**
6. **No credentials, no environment URLs, no secrets.** Reference accounts by a handle defined
   in the artifact's prerequisites table and resolved from environment configuration. Literal
   invalid values used in negative cases must be arbitrary strings that belong to no account —
   never a real password with a character changed. Unique data for stateful scenarios may be
   generated at run time.
7. **Distinguish BLOCKED from FAIL.** Where a case needs a prerequisite that may not exist —
   seeded data, a configuration toggle, a long wall-clock wait, a permission — say that its
   absence makes the result **BLOCKED**, per `product-decisions.md` §8. Otherwise an
   unobtainable prerequisite gets reported as a product failure.
8. **Budget destructive side effects.** Where cases consume a shared, finite allowance (attempt
   counters, quotas) or leave state behind (locked accounts, changed passwords), state how much
   each case consumes and what state it leaves. Silent side effects corrupt the next case.
9. **Test scope.** Honour the analysis's recorded test scope. If it says UI only, generate no API
   cases; record the requirements that only a lower layer can verify as a known gap instead of
   dropping them.

## Step 7 — Write the artifact

Write `docs/projects/<KEY>/test-cases/US-<ID>/test-cases.md`, structured so it stays editable and so the
publishing step can consume it case by case:

1. **Provenance header** — work item ID, analysis/decisions/source paths, the revision and the
   **full content fingerprint** copied from the analysis, generation date, test scope, target
   environment, case count, and what has been published (nothing, at first). The fingerprint is
   what makes staleness detectable later; never omit or truncate it.
2. **How to read this file** — the status vocabulary (`product-decisions.md` §6.1) and the
   conventions the cases rely on.
3. **Environment and test data prerequisites** — every account/data handle the cases reference,
   what it must be, which cases use it, and the practical constraints.
4. **Coverage map** — requirement → test case IDs, plus open questions → the cases that observe
   them.
5. **Deliberately not covered** — each gap, its requirement, why, and what would unblock it.
6. **The test cases**, grouped by requirement area, in a stable order.
7. **Rejected test cases** — the section rejected items move to, keeping their IDs.
8. **AI self-review record** — Step 8's output.

## Step 8 — Self-review as a Senior QA Engineer

The AI self-review happens **before** any human sees the set (`product-decisions.md` §6). Review
the set you just wrote as if someone else wrote it, and **fix what you find** rather than listing
it as future work.

Check at least:

- **Coverage** — every requirement covered or explicitly excluded with a reason. Every acceptance
  criterion accounted for.
- **Correctness of expected results** — each one traceable to the source or a decision. Re-check
  every case where a confirmed decision **overrides** the specification's literal reading; that
  is where a wrong expectation hides, and copying the specification there produces a false bug
  report later.
- **Inherited errors** — the analysis can be wrong. If an example or derived statement in it does
  not hold, do not reproduce it: fix the case, and record the discrepancy in that case's Notes
  and in the self-review record.
- **Invented content** — no message text, limit, or rule that no source defines.
- **Undecided behaviour** — nothing asserted where a question is deliberately open.
- **Duplicates** — no case that another case already proves. Merge or drop.
- **Boundaries** — two-sided, not one-sided.
- **Independence** — no case relying on another's residue.
- **Observability** — no assertion the UI cannot verify.
- **Field completeness and title convention** — on every case.
- **Secrets** — none.

Record the review in the artifact: what was checked, **the corrections the review produced**, the
known limitations of the set, and the verdict. A self-review that reports no findings is not a
review — if nothing needed changing, say what you checked that made you confident.

Set every case's status to `AI-Reviewed`. **Never `Approved`.**

## Step 9 — Report

Report briefly:

1. How many test cases were generated, and the breakdown by coverage kind or requirement area.
2. Where the artifact was saved.
3. Which confirmed decisions governed the expected results.
4. **Requirements deliberately not covered**, with the reason for each.
5. **Observation-only cases** and the open question each will answer.
6. Cases likely to be **BLOCKED** on execution, and what they need.
7. The self-review result, including the corrections it produced.

Then update `CLAUDE.md` only if something genuinely project-level changed — a new capability, a
new invariant, a new artifact type, or a settled open item. **Never put requirement detail in
`CLAUDE.md`.**

**Documentation-impact check — mandatory, in this same task** (`CLAUDE.md` →
*Documentation synchronization*, `docs/product-decisions.md` §18). If this run changed anything
project-level — a CLI interface, an artifact path, a rule, or an instruction in **this** skill
that turned out to be wrong — update the affected `SKILL.md`, `CLAUDE.md`, and
`docs/product-decisions.md` **now**, without asking. Generating test cases changes none of them.

Do not commit. Do not touch Azure DevOps. Stop and wait for human review — the human names which
cases are approved, rejected, or need changes.
