---
name: analyze-story
description: Read an Azure DevOps User Story with its .md attachments and persist a Requirement Analysis under docs/projects/<KEY>/requirements/US-<ID>/. Use when asked to analyze, re-analyze, or refresh the requirements of a User Story by ID. Takes the User Story ID as its argument.
allowed-tools: Bash(npm run story:read:*), Bash(git diff:*), Bash(git status:*), Read, Write, Edit, Glob, Grep
---

# Analyze User Story

Produce or update the persistent **Requirement Analysis** for a User Story.

This skill **reads** Azure DevOps and **writes local files only**. It never modifies Azure
DevOps, never creates Bugs, never generates Test Cases, and never commits.

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
use whichever turned up. Do not default to whichever project came first.

Then **read `docs/projects/<KEY>/profile.md`** and take every project-specific value from it —
terminology, modules, title token. Read `docs/projects/<KEY>/decisions.md` if it exists.

The ID is `$ARGUMENTS`. Below, `<ID>` means that value.

If no ID was supplied, ask for one and stop. Do not guess an ID and do not analyse the most
recently touched story instead.

## Scope boundary

**Do NOT generate Test Cases.** Requirement understanding only. Test case generation is a
separate skill and a separate human review.

---

## Step 1 — Read the User Story

```bash
npm run story:read -- <ID> --summary
```

This uses the permanent read-only integration (`src/ado/client.ts` → `readUserStory`). It
already verifies the work item type, converts HTML fields to Markdown, lists attachments and
downloads Markdown attachments. **Do not write a script and do not fetch Azure DevOps any
other way.**

Handle the outcome:

- **`UNSUPPORTED_WORK_ITEM_TYPE`** → stop. Report the actual type. V1 reads `User Story`
  only; widening the reader is a project-level decision, not a step in this skill.
- **`NOT_FOUND`** → stop. The ID does not exist or the token cannot see it. Do not retry with
  a different ID and do not guess.
- **`AUTH_FAILED` / `CONFIG_MISSING`** → stop and report the hint from the error verbatim.
- **No Markdown attachment listed** → continue with the User Story fields alone, and record
  prominently in the analysis that no specification attachment was present. Do not invent the
  missing detail.

Record from the output: title, work item type, state, project, area path, iteration, revision,
**the full content fingerprint**, and each attachment's name, size and sha256.

## Step 2 — Decide whether analysis work is needed

Artifact paths for this story:

```
docs/projects/<KEY>/requirements/US-<ID>/requirement-analysis.md    the analysis (agent-generated)
docs/projects/<KEY>/requirements/US-<ID>/decisions.md               confirmed human decisions (human authority)
docs/projects/<KEY>/requirements/US-<ID>/source/                    verbatim .md attachment snapshot
```

If `requirement-analysis.md` already exists, read the fingerprint in its provenance table and
compare it with the fingerprint from Step 1:

- **Fingerprints match** → the requirement content has not changed. **Do not re-download, do
  not re-analyse, do not rewrite the artifact.** Report "unchanged since <date> at rev <n>",
  note anything in `decisions.md` that the analysis has not yet absorbed, and stop. Re-run
  the remaining steps only if the human asks for a refresh anyway, or if `decisions.md` is
  newer than the analysis.
- **Fingerprints differ** → the requirement changed. Continue, and treat this as an update:
  preserve the artifact's structure and every confirmed decision, then apply the change.
- **No artifact yet** → continue as a first analysis.

The fingerprint covers requirement content only (title, description, acceptance criteria,
extra fields, attachment hashes). It deliberately ignores `rev`, dates, state and assignment,
so a reassignment or a tag edit does not trigger re-analysis.

## Step 3 — Read the full content and update the snapshot

```bash
npm run story:read -- <ID> --save-source docs/projects/<KEY>/requirements/US-<ID>/source
```

Read the complete output: description, acceptance criteria, additional fields, and the entire
content of every Markdown attachment. The same command writes the snapshot, so the source of
truth is captured in one read.

If a snapshot already existed, see exactly what changed:

```bash
git diff -- docs/projects/<KEY>/requirements/US-<ID>/source
```

For an update, that diff — not the whole document — is what drives the impact analysis.

## Step 4 — Load confirmed decisions

Read `docs/projects/<KEY>/requirements/US-<ID>/decisions.md` if it exists. It holds decisions the human has
explicitly confirmed, and it is **human authority**: it outranks your own reading of the
requirement and must survive every regeneration of the analysis.

- Every decision there is tagged **[D]** in the analysis, never **[I]**.
- A decision **closes** the open questions it answers. Move them out of the open-question
  list and into the rules they affect, citing the decision ID.
- A decision that **conflicts** with the attached specification, or with
  `docs/product-decisions.md`, is **not** silently reconciled — surface the conflict as a
  blocking open question.
- Never add a decision to that file yourself. Only a human statement in a session creates
  one; if the human confirms decisions during this skill, write them there and cite where
  they came from.

## Step 5 — Analyse as a Senior QA Engineer

Analyse the User Story and its Markdown attachment(s) **together**. The two sources have
different weight: the attachment usually carries the detail, the story carries the intent. If
they disagree, say so — do not merge them into a single smooth account.

Determine the **actual scope** from the content. Do not assume one User Story is one Module.
It may be a complete module, a feature, part of a feature, an enhancement to existing
behaviour, or another meaningful functional scope. State the scope, the evidence for it, and
what it explicitly excludes.

Cover, only where the sources support it:

- Module / Feature / functional scope, and what is out of scope
- Functional requirements, with the source's own requirement IDs where they exist
- Business rules, with their concrete values
- Fields: required vs optional, behaviour, allowed and forbidden values, boundaries
- Validation rules, and which layer enforces them
- Dependencies — on other features, configuration, and specifications not attached
- State behaviour and state transitions
- User flows, including alternate and failure paths
- Expected system behaviour, and exact message text **only when the source defines it**
- Important negative scenarios
- Existing behaviour vs new or changed behaviour
- Ambiguities, contradictions, gaps, and missing requirements
- Test environment and test data prerequisites, and anything not practically testable
- A requirement → coverage-area map, so no requirement is silently skipped

Rules that keep the analysis trustworthy:

- **The User Story and its attachments are the source of truth.** Never invent a requirement.
- **Never invent exact wording.** Quote message text only where the source defines it. Where
  it does not, state that an appropriate message is expected and that the wording is
  undefined — that is a finding, not a blank to fill.
- **Never silently resolve an ambiguity.** Every unresolved point becomes an open question.
- **Never promote an inference to a requirement.** An inference recorded as fact becomes a
  false bug report weeks later.

## Step 6 — Write or update the artifact

Write `docs/projects/<KEY>/requirements/US-<ID>/requirement-analysis.md`. Every statement carries exactly one tag:

| Tag | Meaning |
|---|---|
| **[E]** | **Explicit** — stated in the User Story or an attachment. Give the reference. |
| **[D]** | **Confirmed decision** — a human decision from `decisions.md`. Give the decision ID. |
| **[I]** | **QA inference** — your reading or judgement. Never a requirement. |
| **[?]** | **Open question** — unresolved; needs a human decision. |

The artifact must open with a **provenance** table: work item ID, verified type, project, area
path, iteration, state, revision, **full content fingerprint**, attachment names with sizes
and sha256, the local snapshot path, and when it was read. That table is what makes the next
run's fingerprint comparison possible — never omit or truncate it.

It must also contain:

- A **confirmed decisions** section listing every `[D]` decision and what it closed.
- An **open questions** table with a stable ID per question, the impact, and whether it
  **blocks** expected results. Keep the IDs stable across updates so earlier discussion still
  refers to the right question. Never delete a question because it is inconvenient — close it
  only when a source or a confirmed decision answers it, and say which.

For an update, keep the existing structure and IDs, mark what changed relative to the previous
revision, and preserve all `[D]` content.

## Step 7 — Report

Report briefly:

1. Whether the work item was read and its type verified.
2. The scope you determined, and why.
3. Whether a Markdown attachment was found and read.
4. Whether this was a first analysis, an update, or unchanged (fingerprint match).
5. Where the artifact was saved.
6. Confirmed decisions applied.
7. **Remaining open questions**, blocking ones first.

Then update `CLAUDE.md` only if something genuinely project-level changed — a new capability
verified, a new invariant, a reversed decision, or a new artifact type. **Never put requirement
detail in `CLAUDE.md`.**

**Documentation-impact check — mandatory, in this same task** (`CLAUDE.md` →
*Documentation synchronization*, `docs/product-decisions.md` §18). If this run changed anything
project-level — a CLI interface, an artifact path, a rule, or an instruction in **this** skill
that turned out to be wrong — update the affected `SKILL.md`, `CLAUDE.md`, and
`docs/product-decisions.md` **now**, without asking. Analysing a story changes none of them.

Do not commit. Stop and wait for human review.
