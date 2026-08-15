---
name: publish-test-cases
description: Publish the approved Test Cases of a User Story to Azure DevOps as child Test Case work items, then record each new Azure DevOps ID in the local artifact. Use when asked to publish, push, or create the approved test cases of a User Story in Azure DevOps. Takes the User Story ID as its argument. Performs irreversible external writes and requires explicit human approval immediately before the first write.
allowed-tools: Read, Edit, Glob, Grep, Bash(npm run testcases:publish:*), Bash(npm run typecheck:*), Bash(git status:*), Bash(git diff:*)
---

# Publish Test Cases for a User Story

Create the **approved** Test Cases in `docs/test-cases/US-<ID>/test-cases.md` as **child Test Case
work items** of that User Story in Azure DevOps, then record each new Azure DevOps ID back into
the local artifact.

**This skill performs irreversible external writes.** It is the only workflow in this project
that does. Everything below exists to make sure each write is intended, approved, and
non-duplicating.

## Step 0 — Resolve the User Story ID

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
   results, test data and requirement reference go across exactly as approved. Publishing is not
   an editing step.
4. **Never create a duplicate.** A case with a recorded Azure DevOps ID is never created again,
   and cases without one are matched against the story's existing children by title first.
5. **Never blind-retry a write** (invariant 4). The tooling makes exactly one attempt per item.
   After a timeout the outcome is *unknown* — reconcile against Azure DevOps, never re-send.
6. **Never mark a failed case `Published`.** Report the failure with its reason.
7. **Do not commit or push.**

## Step 1 — Read the local state

```
docs/test-cases/US-<ID>/test-cases.md
```

- **Missing** → stop. Report that US <ID> has no Test Case artifact and that the
  `write-test-cases` skill must run first.
- Read the provenance header, the approval record, and each case's
  **Review/Lifecycle Status** and **Azure DevOps ID**.

Report the counts before doing anything else: total cases, `Approved`, already `Published`, and
anything in another status.

## Step 2 — Dry run

```bash
npm run testcases:publish -- <ID>
```

A dry run is the **default** — this command writes nothing. It reads the artifact, reads the
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
the artifact — flipping that case's status to `Published` — before attempting the next create.**
That ordering is what makes an interrupted run safe to resume: nothing that exists in Azure DevOps
is left unrecorded locally.

Do not edit the artifact's ID or status cells by hand; the tooling owns them.

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

Verification reads Azure DevOps rather than trusting the artifact, and checks that every locally
published case:

- **exists as a child** of User Story <ID>,
- **is of type `Test Case`**,
- has a **title matching** the artifact,
- has a **step count matching** the artifact — a title match alone would not catch a steps
  document that Azure DevOps accepted but stored empty.

Report any mismatch as a failure. Do not "fix" it by editing the artifact to match Azure DevOps:
a divergence between an approved artifact and the published record is a **human decision**
(`docs/product-decisions.md` §13).

## Step 6 — Record and report

Update the artifact's provenance header with what was published: how many, the Azure DevOps ID
range, the date, and that verification passed. Note that the publish was authorized by a separate
human statement.

Report:

1. How many Test Cases were published, and how many were skipped or refused, with reasons.
2. The **created Azure DevOps IDs**, mapped to their internal Test Case IDs.
3. Any failures, with the Azure DevOps reason and what to do next.
4. The verification result.
5. That the artifact now records every ID, and that re-running cannot duplicate.

Then update `CLAUDE.md` if a capability became usable end to end or an invariant changed.
**Do not commit. Do not push.**
