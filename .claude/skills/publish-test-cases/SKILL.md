---
name: publish-test-cases
description: Publish the approved Test Cases of a User Story to Azure DevOps as child Test Case work items, from the story's test-cases.csv (the source of truth), then record each new Azure DevOps ID back into that CSV. Use when asked to publish, push, or create the approved test cases of a User Story in Azure DevOps. Takes the User Story ID as its argument. Performs irreversible external writes and requires explicit human approval immediately before the first write.
allowed-tools: Read, Edit, Glob, Grep, Bash(npm run testcases:publish:*), Bash(npm run testcases:check:*), Bash(npm run testcases:show:*), Bash(npm run typecheck:*), Bash(git status:*), Bash(git diff:*)
---

# Publish Test Cases for a User Story

Create the **approved** Test Cases in `docs/projects/<KEY>/test-cases/US-<ID>/test-cases.csv` as **child Test Case
work items** of that User Story in Azure DevOps, then record each new Azure DevOps ID back into
that CSV.

**The CSV is the single source of truth for test-case content** (`docs/product-decisions.md`
§6.4). What is published is the CSV **as it stands now**, including every human edit made after
generation. `test-cases.md` is a rendering and is never read for content; the publisher
re-renders it after each recorded ID.

**This skill performs irreversible external writes.** It is the only workflow in this project
that does. Everything below exists to make sure each write is intended, approved, and
non-duplicating.

## Step 0 — Resolve the active project, then the User Story ID

**Resolve the active project before reading anything.** `<KEY>` below means that project's
key, and every artifact path in this skill is under `docs/projects/<KEY>/`.

1. A key stated in the request (`--project <KEY>`, or "for <KEY>") wins.
2. Otherwise `QA_ACTIVE_PROJECT` in the environment.
3. Otherwise, **only** if exactly one directory under `docs/projects/` has a `profile.md`,
   use it.
4. Otherwise **stop and ask the human which project these Test Cases belong to.**

**Never guess the project.** This skill creates real work items: a wrong project publishes one
client's Test Cases onto another client's board, and nothing about the result looks wrong until
someone notices. Do not infer the project from the story ID — story IDs are unique per Azure
DevOps project, not globally.

Pass the resolved key through to the publisher as `--project <KEY>`. The command refuses to run
when the project is ambiguous.

The ID is `$ARGUMENTS`. Below, `<ID>` means that value.

If no ID was supplied, ask for one and stop. **Never guess the ID** — a wrong ID here parents
real work items under the wrong story.

## Non-negotiable rules

1. **Only `Approved` cases are published.** `Draft`, `AI-Reviewed`, `Needs-Changes` and
   `Rejected` are refused. The agent never publishes what a human has not approved
   (invariant 1). If nothing is approved, **stop** and say so.
2. **A separate human approval is required immediately before the first write** (invariant 2).
   An approval given earlier in the session, or recorded in the artifact, **does not** authorize
   the write. Show the exact operation, then ask.
3. **Never modify Test Case content while publishing.** Title, precondition, steps, expected
   results, test data and requirement reference go across exactly as they stand in the CSV.
   Publishing is not an editing step — never edit the CSV to make a publish work, and never
   restore a value from the Markdown or an earlier version.
   Because the CSV is editable, the human's approval immediately before the write (rule 2) is
   approval of **the content the dry run shows** — which is read from the current CSV.
4. **Never create a duplicate.** A case with a recorded Azure DevOps ID is never created again,
   and cases without one are matched against the story's existing children by title first.
5. **Never blind-retry a write** (invariant 4). The tooling makes exactly one attempt per item.
   After a timeout the outcome is *unknown* — reconcile against Azure DevOps, never re-send.
6. **Never mark a failed case `Published`.** Report the failure with its reason.
7. **Do not commit or push.**

## Step 1 — Read the local state

```
docs/projects/<KEY>/test-cases/US-<ID>/test-cases.csv     source of truth — what is published
docs/projects/<KEY>/test-cases/US-<ID>/test-cases.md      rendering + provenance header
```

```bash
npm run testcases:check -- <ID> --project <KEY>
```

- **No CSV** → stop. If only `test-cases.md` exists it is a legacy artifact: report that it must
  be migrated (`npm run testcases:migrate`) before publishing. If neither exists, the
  `write-test-cases` skill must run first.
- **The check reports a parse error** → stop and report it. A CSV the strict parser refuses is
  never published.
- **The check reports only that `test-cases.md` is out of date** → not a blocker: the CSV is what
  is published, and the publisher re-renders the Markdown as it records IDs. Say so.
- Read each case's **Review/Lifecycle Status** and **Azure DevOps ID** from the CSV
  (`npm run testcases:show -- <ID> --project <KEY>` prints them through the strict parser), and the
  provenance header from the Markdown.

Report the counts before doing anything else: total cases, `Approved`, already `Published`, and
anything in another status.

## Step 2 — Dry run

```bash
npm run testcases:publish -- <ID>
```

A dry run is the **default** — this command writes nothing. It reads the CSV, reads the
User Story and its existing children over the **read-only** path, and prints:

- the parent's type, area path and iteration path (children inherit these),
- **every existing child** of the story, with type and title,
- the plan: to publish / already published / exists in Azure DevOps by title / not approved,
- the **exact `POST` body** for the first case, built by the same code that performs the write,
- the full list of cases that would be created.

Read the existing-children list yourself. A Test Case already under the story whose **title
differs** from every artifact case is invisible to the title-based duplicate guard — if the
existing children look like they may already cover these cases, **stop and raise it** rather
than adding a near-duplicate set.

Handle the outcome:

- **`CONFIG_MISSING` naming `ADO_PAT_WRITE`** → stop. Ask the human to add a PAT with
  **Work Items (Read & write)** to `.env` as `ADO_PAT_WRITE`. Do not ask for a broader scope, and
  never fall back to `ADO_PAT_READ`.
- **`UNSUPPORTED_WORK_ITEM_TYPE`** → stop. Only a `User Story` may parent these.
- **`NOT_FOUND`** → stop. The ID does not exist or the token cannot see it.
- **An artifact problem** → stop and report it verbatim. The parser is strict on purpose; a case
  it cannot read must never be published on a guess.

## Step 3 — Show the operation and ask for approval

Show the human:

- **the exact operation**: the `POST` URL, the content type, and the full JSON Patch body from
  the dry run — not a summary of it,
- how many items will be created, and that each becomes a child of <ID>,
- that writes are **not** retried.

Then **ask for explicit approval.** Recommend a **canary**: publish one case with `--limit 1`,
verify it in Azure DevOps, then publish the rest. A wrong field mapping caught on item 1 costs
one deletion; caught on item 52 it costs fifty-two.

**Do not proceed without an explicit approval in this session.** If the human declines, stop and
change nothing.

## Step 4 — Publish

```bash
npm run testcases:publish -- <ID> --confirm --limit 1   # canary, if that was chosen
npm run testcases:publish -- <ID> --confirm             # the rest
```

The publisher creates one work item per request, and **writes each returned Azure DevOps ID into
the CSV — flipping that case's status to `Published` — before attempting the next create.**
That ordering is what makes an interrupted run safe to resume: nothing that exists in Azure DevOps
is left unrecorded locally. Only those two cells of that row change; every other cell, human edits
included, keeps its value. The Markdown is re-rendered after each write-back.

Do not edit the ID or status cells by hand; the tooling owns them. **Close the CSV in any
spreadsheet tool before publishing** — a file locked by the tool cannot be written, and the
publisher then reports the created work item ID for you to record by hand.

If a case fails:

- it stays `Approved` with no Azure DevOps ID, and the run continues with the remaining cases,
- **except** on `AUTH_FAILED` / `PERMISSION_DENIED`, where the run stops because every remaining
  item would fail identically,
- report each failure with its Azure DevOps reason. After fixing the cause, simply re-run —
  already-published cases are skipped.

## Step 5 — Verify

```bash
npm run testcases:publish -- <ID> --verify
```

Verification reads Azure DevOps rather than trusting the CSV, and checks that every locally
published case:

- **exists as a child** of User Story <ID>,
- **is of type `Test Case`**,
- has a **title matching** the CSV,
- has a **step count matching** the CSV — a title match alone would not catch a steps
  document that Azure DevOps accepted but stored empty.

A human may legitimately edit a published case in the CSV later; verification then reports the
divergence. Report any mismatch as a failure. Do not "fix" it by editing the CSV to match Azure DevOps:
a divergence between an approved artifact and the published record is a **human decision**
(`docs/product-decisions.md` §13).

## Step 6 — Record and report

Update the provenance header in `test-cases.md` (narrative, outside the generated block) with what was published: how many, the Azure DevOps ID
range, the date, and that verification passed. Note that the publish was authorized by a separate
human statement.

Report:

1. How many Test Cases were published, and how many were skipped or refused, with reasons.
2. The **created Azure DevOps IDs**, mapped to their internal Test Case IDs.
3. Any failures, with the Azure DevOps reason and what to do next.
4. The verification result.
5. That the CSV now records every ID (and the Markdown was re-rendered), and that re-running cannot duplicate.

**Documentation-impact check — mandatory, in this same task** (`CLAUDE.md` →
*Documentation synchronization*, `docs/product-decisions.md` §18). If publishing changed anything
project-level — a CLI interface, an artifact path, a rule, or an instruction in **this** skill
that turned out to be wrong — update the affected `SKILL.md`, `CLAUDE.md`, and
`docs/product-decisions.md` **now**, without asking. Update *Current state* only when a
capability became usable end to end or an invariant changed.

**Do not commit. Do not push.**
