# AI QA Engineering Agent

An AI-assisted QA lifecycle built around Azure DevOps User Stories:

```
Read User Story + attachments -> requirements analysis -> generate test cases
  -> AI self-review -> human review -> approval -> publish to Azure DevOps
  -> AI web execution -> failure analysis -> bug candidate -> human approval
  -> create bug -> execution report
```

Automation (explore app -> automation plan -> human review -> generated Playwright
code) begins shortly after test cases are manually executed — it is not a distant
final phase.

This project is developed incrementally across many sessions. **This file is the
persistent source of truth.** The full decision record, including rejected
alternatives, lives in `docs/product-decisions.md`.

The repository is **private**.

---

## Current state

Nothing enters this table until it has actually been run. A capability with no
verify command is not built, regardless of what code exists.

| Capability | Status | Verify with |
|---|---|---|
| Azure DevOps read-only connectivity | **Verified against real Azure DevOps** | `npm run ado:check` |
| Read User Story by ID -> Requirement Context | **Verified against real Azure DevOps** (US 53717) | `npm run story:read -- 53717` |
| Read + download Markdown attachments | **Verified against real Azure DevOps** (US 53717) | `npm run story:read -- 53717 --summary` |
| Requirement analysis workflow | **Reusable skill, verified on US 53717** | `/analyze-story <ID>` |
| Requirement analysis artifact | **One produced, 12 decisions applied** | `docs/requirements/US-53717/` |
| Test Case generation workflow | **Reusable skill exists.** The US 53717 set was produced by following its steps in-session; the skill has not yet been invoked as a skill | `/write-test-cases <ID>` |
| Test Case artifact | **One produced — 52 cases, AI self-reviewed, HUMAN-APPROVED then PUBLISHED 2026-08-13** | `docs/test-cases/US-53717/test-cases.md` |
| Azure DevOps **write** path (`ADO_PAT_WRITE`) | **Verified against real Azure DevOps** — 52 Test Cases created, 0 failures, 0 duplicates | `npm run testcases:publish -- 53717` (dry run) |
| Publishing Test Cases as children of a User Story | **Verified against real Azure DevOps** (US 53717 → IDs 55294–55345) | `/publish-test-cases <ID>` |
| Web execution, bugs, reporting, automation | Not built | — |

**Next capability:** **AI web execution of the published Test Cases against STG**
— open the portal, execute step by step, record PASS/FAIL/BLOCKED/SKIPPED,
screenshot on failure, classify failures. **Not started — do not create it until
asked.** Only Admin Panel cases are in scope for manual execution for now (human
decision, 2026-08-13); the Agent Portal cases are published but not yet queued for
execution.

**Publishing is done for US 53717 and is idempotent.** Re-running the publisher
creates nothing: it skips any case holding an Azure DevOps ID and matches the rest
against the story's existing children by title.

**The two workflows are deliberately separate skills.** Requirement analysis and
test case generation have different inputs, different review gates, and different
failure modes; merging them would hide which step produced a wrong result.

**V1 reader scope: `User Story` work item type only.** This Azure DevOps project
exposes 22 work item types including `Product Backlog Item`, `Epic`, `Feature`
and `Issue` — do **not** widen the reader to those yet. Keep the design
extensible so additional types can be added later.

---

## Non-negotiable invariants

These are the rules most easily broken by accident. Do not relax them without an
explicit decision recorded in `docs/product-decisions.md`.

1. **The agent never approves its own work.** It may generate and update local
   test case and bug files, including their review status field. It must never
   treat an artifact as approved on that basis. **Only an explicit human
   statement in the session makes something approved.**

2. **Every Azure DevOps write requires explicit human approval immediately
   before the write.** Approval recorded earlier does not carry forward to a
   later write. Never batch or infer it.

3. **Read/write separation is structural, not conventional.**
   `src/ado/http.ts` exposes GET only — `getJson()` for API responses and
   `getBytes()` for attachment downloads. Never add post/patch/put/delete to it.
   Writes live in `src/ado/http-write.ts` (POST/PATCH, no GET, no retries) behind
   `AdoWriteClient`, using a write-scoped credential loaded only by
   `loadWriteConfig()` and carried in `AdoWriteConfig`. **`AdoConfig` never holds
   the write PAT**, so the read path cannot reach it. `ADO_PAT_WRITE` needs
   **Work Items (Read & write)** — *not* "manage"; never fall back to
   `ADO_PAT_READ`.

4. **Reads are safely retryable; writes are not.** Never blind-retry a write —
   that is how duplicate Test Cases and Bugs get created in Azure DevOps.

5. **Environments are allow-listed. PROD is blocked by default.** The agent may
   act only against explicitly allowed environments. **STG is the only allowed
   environment today.** UAT and PROD must be explicitly configured and selected;
   any PROD execution or PROD write requires explicit human confirmation.

6. **No Azure DevOps field names outside `src/ado/`.** All `System.*` and
   `Microsoft.VSTS.*` reference names live in `src/ado/fields.ts` and nowhere
   else. Checkable:
   `grep -rn "Microsoft.VSTS\|System\." src --include=*.ts` should only hit
   `src/ado/`.

7. **Secrets never leave `.env`.** `src/ado/config.ts` is the only module that
   reads `process.env` — including for the write credential, which it exposes
   through a separate loader and a separate type (see invariant 3). Every error message passes through `redact()` in
   `src/ado/errors.ts`. Never print, log, or commit a credential value.
   Environment configuration and credentials never appear inside test case
   definitions.

8. **Zero runtime dependencies** is the default. Node 24 provides TypeScript
   execution, `.env` loading, `fetch`, and timeouts natively. Dev dependencies
   are limited to `typescript` and `@types/node`. A new runtime dependency needs
   a clear technical reason and human review before it is introduced.

---

## Approval gates

Never perform these without explicit human approval in the current session:

- `git commit` / `git push`
- Publishing Test Cases to Azure DevOps
- Creating Bugs in Azure DevOps
- Any Azure DevOps write, update, or delete
- Any action against a non-STG environment
- Generating automation code after an Automation Plan review

The agent may freely analyse, generate drafts, read, execute against allowed
environments, classify, and recommend.

**GitHub Pull Requests are not the approval mechanism.** Review happens in local
project files; the human names which items are approved, rejected, or need
changes.

---

## Commands

### Claude Code skills

Each workflow is a **Skill** in `.claude/skills/<name>/SKILL.md`. Claude invokes one
when the request matches its description, and a human can invoke it directly as
`/<name> <USER_STORY_ID>`. The User Story ID arrives as the skill's argument.

```
/analyze-story <USER_STORY_ID>
```

Reads the User Story, verifies its type, reads its `.md` attachments, updates the
source snapshot, analyses everything together, and writes
`docs/requirements/US-<ID>/requirement-analysis.md`. Reusable for **any** User
Story ID — no per-story prompting needed. It skips re-download and re-analysis when
the content fingerprint is unchanged. It **never** generates test cases, writes to
Azure DevOps, or commits. Defined in `.claude/skills/analyze-story/SKILL.md`.

```
/write-test-cases <USER_STORY_ID>
```

Generates the Test Case artifact for an **already analysed** User Story from the
local Requirement Analysis, `decisions.md` and source snapshot, then performs the
AI self-review and writes `docs/test-cases/US-<ID>/test-cases.md`. Reusable for any
analysed User Story ID. It **does not read Azure DevOps at all** — if the analysis
is missing it stops and points at `/analyze-story`. It never publishes, never
approves, and never commits. On a re-run it keeps Test Case IDs, human-set statuses
and recorded Azure DevOps IDs stable. Defined in
`.claude/skills/write-test-cases/SKILL.md`.

```
/publish-test-cases <USER_STORY_ID>
```

Publishes the **approved** Test Cases of that story to Azure DevOps as **child Test
Case work items**, then records each new Azure DevOps ID in the local artifact and
sets its status to `Published`. Dry run first, then an **explicit human approval
immediately before the first write**, then create-and-record one item at a time,
then verify against Azure DevOps. Refuses anything not `Approved`; cannot create
duplicates; never retries a write; never commits. Defined in
`.claude/skills/publish-test-cases/SKILL.md`.

### npm scripts

```bash
npm run ado:check            # read-only Azure DevOps connectivity check
npm run ado:check -- --json  # machine-readable output

npm run story:read -- 53717                    # User Story -> Requirement Context
npm run story:read -- 53717 --summary          # metadata + attachment list only
npm run story:read -- 53717 --json             # machine-readable
npm run story:read -- 53717 --save-source <dir># save .md attachments verbatim

npm run testcases:publish -- 53717             # DRY RUN — shows the exact writes
npm run testcases:publish -- 53717 --confirm   # performs the writes (needs approval first)
npm run testcases:publish -- 53717 --verify    # verify published children, writes nothing
npm run testcases:publish -- 53717 --confirm --limit 1   # canary: publish one item

npm run typecheck            # tsc --noEmit, strict
```

`testcases:publish` is **dry run by default** and the only script that can write to
Azure DevOps. It requires `ADO_PAT_WRITE`; every other script works without it.

`story:read` verifies the work item type, converts HTML fields to Markdown,
lists attachments, downloads Markdown attachments, and returns a **Requirement
Context** with a **content fingerprint** — a hash of requirement content only, so
it does not move when someone edits a tag or reassigns the story. A changed
fingerprint means the requirement itself changed (`docs/product-decisions.md` §14).
Non-Markdown attachments are listed but not downloaded.

Configuration lives in `.env` (gitignored, human-provided). `.env.example`
documents the required variables with empty placeholders.

---

## Layout

```
.claude/skills/<name>/SKILL.md
                  Reusable workflow skills: analyze-story, write-test-cases,
                  publish-test-cases. Invokable by Claude or as /<name> <ID>.
src/ado/          Azure DevOps integration. The only place ADO field names exist.
                  config -> credentials/env, read AND write loaders (invariant 7)
                  http -> GET-only transport, retries
                  http-write -> POST/PATCH only, NO retries (invariant 4)
                  client -> AdoReadClient    |  user-story -> Requirement Context
                  write-client -> AdoWriteClient, creates work items
                  test-case -> TestCaseRecord -> ADO Test Case fields + steps XML
                  fields -> System.*/Microsoft.VSTS.* reference names
src/testcases/    Test Case artifact handling with NO ADO knowledge.
                  model -> TestCaseRecord, status vocabulary
                  artifact -> strict parser + per-case ID/status write-back
src/text/         Content conversion with no ADO knowledge (HTML <-> Markdown).
src/cli/          Human-facing entry points.
docs/requirements/US-<id>/
                  requirement-analysis.md   QA analysis: scope, rules, fields,
                                            flows, open questions. Agent-generated
                                            and may be regenerated. Provenance
                                            header records rev + fingerprint +
                                            attachment sha256.
                  decisions.md              Confirmed HUMAN decisions. Human
                                            authority; outranks the agent's reading
                                            and SURVIVES regeneration of the
                                            analysis. The agent may cite it, never
                                            add to it.
                  source/                   Verbatim snapshot of the .md
                                            attachment(s), written by
                                            `--save-source`. The fingerprint says
                                            *that* a requirement changed; only
                                            this snapshot shows *what* changed.
docs/test-cases/US-<id>/
                  test-cases.md             The Test Case set for that User Story:
                                            provenance + fingerprint, test data
                                            handles, coverage map, deliberate
                                            exclusions, the cases, rejected cases,
                                            and the AI self-review record.
                                            Regenerable — but Test Case IDs,
                                            human-set statuses and published
                                            Azure DevOps IDs must survive
                                            regeneration.
```

**Test cases live outside `docs/requirements/`** deliberately. That directory holds
the requirement source of truth and human decisions; test cases are regenerable QA
output derived from it. Keeping them apart makes it obvious which artifact a wrong
result came from.

**Test Case IDs are `TC-<storyId>-NNN` and are never reused or renumbered.** A
rejected case keeps its ID and moves to the *Rejected test cases* section; reusing
an ID would silently re-point an execution record, a bug, or an Azure DevOps link at
different content. Allowed *Review/Lifecycle Status* values are defined in
`docs/product-decisions.md` §6.1 — the agent may never write `Approved`.

**Requirement analysis artifacts tag every statement** `[E]` explicit (with a
requirement reference), `[D]` confirmed human decision (with a decision ID), `[I]`
QA inference, or `[?]` open question. Do not blur these — an inference promoted to a
requirement becomes a false bug report later, and a decision demoted to an inference
gets silently re-litigated.

**Decisions live in `decisions.md`, not only in the analysis.** The analysis is
regenerable; human authority must not be lost when it is rewritten. A decision that
contradicts a specification or `docs/product-decisions.md` is surfaced as a
conflict, never reconciled silently.

**One User Story is not necessarily one Module.** Determine the real scope from
the content (module / feature / part of a feature / enhancement) and say why.
US 53717 is a *Feature* (Login) inside the *Authentication* module.

---

## Conventions

- **Commits: Conventional Commits** — `feat(...)`, `fix(...)`, `docs(...)`,
  `refactor(...)`, `test(...)`, `chore(...)`.
- **Test Case and Bug titles:** `[Project][Module][Feature/Page] <Scenario>`,
  e.g. `[NBO][Country][Add Country] Verify Country is created successfully when
  valid data is entered and Submit is clicked`. Project / Module / Feature are
  stored as structured fields; the title is generated from them.
- **Execution statuses** are defined in `docs/product-decisions.md` §8 —
  PASS / FAIL / BLOCKED / SKIPPED have specific meanings, use them exactly.
- **TypeScript:** strict, plus `erasableSyntaxOnly` — Node runs `.ts` files
  directly, so no enums, namespaces, or constructor parameter properties.
  Relative imports must use explicit `.ts` extensions.
- **Errors:** every Azure DevOps failure becomes an `AdoError` with a domain
  code. Callers switch on the code and never inspect HTTP status.
- **Comments** explain *why*, not *what*.

---

## Maintaining this file

Update `CLAUDE.md` as part of the work that changes it — do not wait to be asked.

**Update immediately when:**

- A capability becomes usable end to end -> *Current state* and *Commands*
- A product or architecture decision is made, changed, or **reversed** ->
  *Invariants* here and the full entry in `docs/product-decisions.md`
- A new invariant or constraint is introduced -> *Invariants*
- A milestone is verified against the real external system -> *Current state*
- A new persistent artifact type or directory is introduced -> add a *Layout*
  section
- **Anything documented here turns out to be wrong** -> fix it in the same turn

**Do not update for:**

- Refactors with no behavioural change
- Bug fixes
- Implementation detail (retry curves, message wording, internal helpers)
- Work in progress — nothing enters *Current state* until it is verified

**Before a session ends,** if a project-level decision was made, record it here
or in `docs/product-decisions.md`.

**Create project files only when a capability genuinely needs them.** Do not
scaffold speculative folders, Skills, Commands, Agents, schemas, or config ahead
of the workflow that requires them. Do not ask the human to create structure —
only secrets, credentials, external configuration, and human decisions come from
them.

---

## Open items

- **US 53717: no blocking questions remain.** Twelve decisions (D-01…D-12) closed
  them; 17 non-blocking questions stay recorded in
  `docs/requirements/US-53717/requirement-analysis.md` §12. Two are **deliberately
  undecided** — whether pre-authentication validation failures move the lockout
  counter (OQ-26) and the disabled-plus-expired precedence (OQ-27). Cover those
  scenarios and report observed behaviour; **never assert an expectation for them**,
  and do not resolve any remaining question by inference.
- **Login test scope is UI only** (D-09), even though the requirement scope is
  UI + API (D-01). `docs/product-decisions.md` §1 therefore stands unchanged.
- **Reader accepts `User Story` only**, so parent/related items of another type
  cannot be read. US 53717's parent (53119) is unread for this reason.

- **US 53717's 52 test cases are published** (Azure DevOps 55294–55345, verified).
  Azure DevOps is now the official record for them (`docs/product-decisions.md`
  §13), so any divergence between the local artifact and a published item is a
  **human decision** — never silently overwrite either side.
- **Only Admin Panel cases are queued for manual execution** for now (human
  decision, 2026-08-13). The Agent Portal cases are published but not scheduled.
- **TC-53717-051 and TC-53717-052 are observation-only** and stay that way. They
  exist to produce the evidence that would close OQ-26 and OQ-27. Approval does
  **not** convert them into assertions — that needs a human decision on the
  questions themselves.
- **Server-side validation re-enforcement (REQ-LOG-018 AC-2) has no coverage** in
  the UI-only scope. Recorded as a known gap in the test case artifact, not dropped.

Add here when a project-level question is raised but not yet decided, and remove
the entry when it is answered.

**Settled 2026-08-13:** the allowed *Review/Lifecycle Status* values and the
rejected-item rule, defined with the first test case artifact and recorded in
`docs/product-decisions.md` §6.1.
