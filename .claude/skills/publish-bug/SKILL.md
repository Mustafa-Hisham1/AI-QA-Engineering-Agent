---
name: publish-bug
description: Publish an already human-reviewed Bug Candidate to Azure DevOps as a Bug under the User Story that owns the failing Test Case, then verify the created item field by field. Use when asked to publish, create, or file an approved Bug Candidate in Azure DevOps. Takes the path to a Bug Candidate, or a User Story ID plus run. Performs irreversible external writes and requires explicit human approval, a human-chosen Severity, and a human-chosen assignee immediately before the write.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm run bug:publish:*), Bash(npm run typecheck:*), Bash(ls:*), Bash(git status:*), Bash(git diff:*)
---

# Publish a Bug Candidate to Azure DevOps

Create a **human-reviewed** Bug Candidate as a **Bug work item** under the User Story that owns
the failing Test Case, link it, attach its evidence, and then **verify the created item against
Azure DevOps**.

**This skill performs irreversible external writes.** It publishes **one** Bug per invocation.
Everything below exists to make sure the write is intended, approved, non-duplicating, and
actually correct after the fact.

It does **not** execute Test Cases, does **not** classify failures, and does **not** decide
whether something is a defect. That happened in `execute-test-cases`, and the human reviewed it.

## Step 0 — Resolve the Bug Candidate

The argument is `$ARGUMENTS` — a path to a Bug Candidate file, or enough context to find one
under `docs/executions/US-<ID>/RUN-<NNN>/bug-candidates/`.

If it is missing or ambiguous, **ask and stop.** Never guess which Bug is being published — a
wrong guess files someone else's defect under the wrong story.

## Non-negotiable rules

1. **Only a human-reviewed Bug Candidate may be published**, and only one classified
   `PRODUCT_BUG` (`docs/product-decisions.md` §9). Anything else is refused.
2. **Explicit human approval is required immediately before the write** (invariant 2). Approval
   recorded in the artifact, or given earlier in the session for something else, **does not**
   authorize this write.
3. **Severity and assignee are decided by the human for THIS Bug** — see *Step 5*. Never inherit
   either from a previous Bug, a previous run, the User Story owner, or the Test Case author.
4. **Priority is not written** unless the human explicitly asks for a value on this Bug.
5. **Duplicate checking is scoped to the owning User Story only** — see *Step 4*.
6. **Never blind-retry a write** (invariant 4). After a timeout the outcome is *unknown*:
   reconcile against Azure DevOps, never re-send.
7. **Publishing does not end at a Bug ID.** An unverified publish is not a successful publish
   (*Step 8*).
8. **Never publish a credential** — not in a field, not in evidence, not in a file name
   (invariant 7).
9. **The Azure DevOps field mapping is fixed and disjoint** — see *Step 5b*. Never dump the whole
   Bug Candidate into Repro Steps, and never repeat the same content across Description, Repro
   Steps and System Info.
10. **One Bug per invocation.** Never loop.
11. **Do not commit or push.**

## Step 1 — Read the Bug Candidate

Read it in full and confirm it carries everything a developer needs to reproduce the issue
unaided:

Title · Description · Preconditions · Steps to Reproduce · Test Data (**by handle**) ·
Expected Result · Actual Result · Environment (label **and** host) · Requirement reference ·
Related Test Case (internal ID **and** Azure DevOps ID) · Related User Story · Evidence ·
Failure classification.

Anything missing → **stop** and report what is missing. Do **not** invent it, and do not fill a
gap from a previous Bug.

If its status is not one a human has reviewed, **stop**. The agent may never treat its own
artifact as approved (invariant 1).

## Step 2 — Confirm the human approval to publish

State plainly what is about to happen, then **ask**. Required, in this session, for this Bug:

- approval to create the Bug in Azure DevOps,
- the **Severity** value (*Step 5*),
- the **assignee** (*Step 5*).

If any is absent, **stop and request it.** Do not proceed on an assumption, and do not offer a
previous Bug's values as defaults.

## Step 3 — Resolve the owning User Story

The Bug is filed under **the User Story that owns the failing Test Case** — taken from the Bug
Candidate, not from anywhere else.

The Bug inherits that story's **Area Path** and **Iteration Path**; otherwise it lands in the
project root, away from the work it belongs to.

`parentUserStoryId` and `relatedUserStoryId` **must match**. The tooling refuses the input if
they do not — a Bug filed under a story that does not own the Test Case breaks traceability and
defeats the duplicate check.

## Step 4 — Duplicate check — the owning User Story ONLY

Search **only among Bugs that are children of that User Story**
(`docs/product-decisions.md` §5.1).

**Do NOT search:** other User Stories · parent or ancestor work items · other Area Paths · the
project at large · historical Bugs from other User Stories.

A similar Bug outside that scope is **not** a duplicate for this workflow. It may be *mentioned
as context*; it must never block publishing or be substituted for the Bug being filed.

The dry run in *Step 6* performs this check and prints every Bug already under the story. If a
title match is found it **refuses to publish** and reports the existing Bug.

If a duplicate exists: **stop, report the existing Bug ID and title, and create nothing.**
Recommend linking, updating, or reporting against it — **the human decides.**

## Step 5 — Severity and assignee: decided per Bug

### Severity

**Never hardcoded and never inherited.** Propose a value from the **observed impact** of this
specific defect, and say why:

- how much of the specified behaviour is unavailable,
- whether a workaround exists,
- whether data, security, or a release-critical flow is affected.

`docs/product-decisions.md` §5 gives the agent permission to *propose* Severity and gives the
**human final control**. There is no finer-grained rule in this project, so the proposal must be
explicitly confirmed before publishing. **The value written is the human's.**

Use the **exact process-template spelling** — this template numbers its values, so a bare `Low`
is rejected. The constants are in `SEVERITY` in `src/ado/fields.ts`; read them rather than typing
a guess.

**A previously published Bug's Severity has no authority over this one.**

### Assignee

**Never hardcoded, never inferred, never inherited.** It comes from the human's instruction for
**this** Bug.

Do **not** derive it from: a previous Bug · a previous Bug Candidate · the last execution · the
User Story owner · the Test Case author · any historical data.

If no assignee has been given, **stop and ask.** Publishing unassigned is allowed **only** when
the human explicitly chose that — never as a fallback for silence.

### Priority

**Do not write Priority.** Leaving the field unset is what lets Azure DevOps apply its configured
default. Write a value **only** when the human explicitly requests one for this Bug, and never
carry a value over from a previous Bug.

## Step 5b — Azure DevOps field mapping (fixed, disjoint)

The Bug Candidate is split across **three** rich-text fields, and every piece of it lands in
**exactly one** of them (`docs/product-decisions.md` §5.4). This is enforced by the publishing
code — `buildDescriptionHtml`, `buildReproStepsHtml`, `buildSystemInfoHtml` in `src/ado/bug.ts` —
not by this instruction. Do not hand-assemble field HTML.

| Azure DevOps field | Carries — and nothing else |
|---|---|
| **Title** (`System.Title`) | The Bug title, `[Project][Module][Feature/Page] <Scenario>` |
| **Description** | Description |
| **Repro Steps** | Preconditions · Steps to Reproduce · Expected Result · Actual Result · Requirement Reference · Related Test Case |
| **System Info** | Environment (label **and** host) · Failure Classification · Evidence |

**Do NOT** put the entire Bug Candidate into Repro Steps, and **do not duplicate** content
between the three fields — three near-identical blocks leave a reviewer unable to tell which is
authoritative, and they diverge the moment someone edits one.

**Nothing is dropped.** Every Bug Candidate field has one home. Because Description is now the
sole content of the field Azure DevOps shows first on every board card and query result, an empty
`bug.description` is **rejected** by the tooling — fill it from the candidate, never invent it.

Evidence is still uploaded as a **real Azure DevOps attachment** (*Step 7*); the Evidence entry in
System Info is the *note* describing what it shows.

No credential or test secret enters any of the three fields — test data stays **by handle**
(invariant 7).

## Step 6 — Build the input and dry run

Write the publishing input described in **`docs/bug-input.schema.md`**, mapping the Bug Candidate
onto its fields. Test data stays **by handle**; no credential enters the file.

Then:

```bash
npm run bug:publish -- <input.json>
```

A dry run is the **default** — it writes nothing. It validates the input, performs the
story-scoped duplicate check, prints the **field mapping** it applied, and prints the **exact**
`POST` body the real write would send, plus the relations and the resolved Severity / assignee /
Priority decision.

Read the printed body and confirm the separation is right: `System.Description` holds only the
description, `Microsoft.VSTS.TCM.ReproSteps` holds only the repro block, and
`Microsoft.VSTS.TCM.SystemInfo` holds only environment, classification and evidence.

Handle the outcome:

- **`INPUT REJECTED`** → fix the input. The validation is strict on purpose.
- **`DUPLICATE FOUND`** → stop (*Step 4*).
- **`CONFIG_MISSING` naming `ADO_PAT_WRITE`** → stop. Ask for a PAT with **Work Items (Read &
  write)**; never fall back to `ADO_PAT_READ`.
- **Any other failure** → stop and report it verbatim.

**Show the human the dry run output** — the real body, not a summary of it — and confirm the
Severity and assignee shown are the ones they chose.

## Step 7 — Publish

Only after the explicit approval from *Step 2*:

```bash
npm run bug:publish -- <input.json> --confirm
```

The evidence is uploaded first, then the Bug is created, then its relations are applied in a
second request. If linking fails the Bug still **exists** — the command reports
`PUBLISH_VERIFICATION_FAILED` with the ID. **Do not re-run `--confirm`**; that creates a
duplicate. Fix the links on that item.

## Step 8 — Verify

Verification runs automatically after `--confirm`, and can be re-run against an existing item
without writing anything:

```bash
npm run bug:publish -- <input.json> --verify-only <bug-id>
```

It **reads the Bug back from Azure DevOps** rather than trusting the create response, and checks:

- the Bug **exists**, and is of type **Bug**,
- **title** matches,
- **Description**, **Repro Steps** and **System Info** are each non-empty — checked
  **separately**, because each carries different content and a combined check would hide a whole
  missing section,
- **state** is a non-terminal (open) state,
- **Severity** matches the approved value,
- **Priority** — a value exists when the template default applies, or matches the explicit
  override,
- **assignee** matches the approved identity, or is genuinely unassigned when that was chosen,
- the **parent User Story** relation points at the owning story,
- the **related Test Case** relation points at the failing Test Case,
- the **attachment** relation exists **and its bytes download successfully** — a relation naming
  a file proves a link, not a retrievable file.

**If any check fails:**

- **do not report success**,
- report **`PUBLISH_VERIFICATION_FAILED`** and exactly which checks failed, expected vs actual,
- **preserve and report the created Bug ID** so it can be investigated,
- **never create another Bug** to "fix" it.

## Step 9 — Record and report

Only after verification passes, update the local Bug Candidate: record the **Azure DevOps Bug
ID**, set its status to `Published`, and note that the write was authorized by an explicit human
statement. Note the same in the execution run's `execution-results.md`.

Report:

1. **Bug ID**, title, and URL.
2. **Assignee**, **Severity**, and **Priority** — stating for each that it was the human's choice
   for this Bug, and that Priority was left to the template unless overridden.
3. **User Story** and **Test Case** links.
4. **Attachment**, and that its bytes were verified.
5. The **verification result**, including how many checks ran.
6. The **duplicate-check scope** that was applied, and what it found.

## Step 10 — Documentation-impact check

**Mandatory, in this same task** (`CLAUDE.md` → *Documentation synchronization*,
`docs/product-decisions.md` §18).

If publishing changed anything project-level — the CLI interface, the input schema, the
duplicate-check scope, the verification checks, the severity/assignee/priority rules, or an
instruction in **this** skill that turned out to be wrong — update the affected `SKILL.md`,
`CLAUDE.md`, and `docs/product-decisions.md` **now**. Do not report staleness instead of fixing
it, and do not ask permission.

Publishing one Bug through an unchanged workflow changes no documentation. Update *Current state*
in `CLAUDE.md` only when a capability became usable end to end or an invariant changed.

**Do not commit. Do not push.**
