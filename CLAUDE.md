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
| Requirement analysis artifact | **Two produced** — US 53717 (12 decisions) and US 52860 (5 decisions, requirement + Change Request read together) | `docs/requirements/US-53717/`, `docs/requirements/US-52860/` |
| Test Case generation workflow | **Reusable skill, verified** — invoked as a skill on US 52860, producing 35 cases from a requirement plus a Change Request | `/write-test-cases <ID>` |
| Test Case artifact | **Two produced** — US 53717 (52 cases) and US 52860 (35 cases), both AI self-reviewed, HUMAN-APPROVED and PUBLISHED | `docs/test-cases/US-53717/test-cases.md`, `docs/test-cases/US-52860/test-cases.md` |
| Azure DevOps **write** path (`ADO_PAT_WRITE`) | **Verified against real Azure DevOps** — 87 Test Cases created across two stories, 0 failures, 0 duplicates | `npm run testcases:publish -- <ID>` (dry run) |
| Publishing Test Cases as children of a User Story | **Verified against real Azure DevOps, twice** (US 53717 → 55294–55345; US 52860 → 55648–55683) | `/publish-test-cases <ID>` |
| Manual web execution against STG (Playwright MCP) | **Canary verified against the real app** — TC-53717-006 executed, PASS | `docs/executions/US-53717/RUN-001/execution-results.md` |
| Execution results artifact | **One produced** — RUN-001, 1 of 52 cases | `docs/executions/US-53717/RUN-001/` |
| Web execution workflow | **Reusable skill, verified** — invoked as a skill on TC-53717-002, found a real defect | `/execute-test-cases <ID> [<TC-ID>…]` |
| Bug Candidate artifact | **One produced** — RUN-002, human-approved | `docs/executions/US-53717/RUN-002/bug-candidates/` |
| Creating Bugs in Azure DevOps | **Verified against real Azure DevOps** — Bug 55482 created, assigned, linked, attachment verified byte-identical | `npm run bug:publish -- <input.json>` (dry run) |
| Bug publishing workflow | **Reusable skill.** Duplicate refusal and post-create verification both exercised against real Azure DevOps (read-only) | `/publish-bug <bug-candidate>` |
| Post-create Bug verification | **Verified** — 10 checks, mismatches correctly reported as `PUBLISH_VERIFICATION_FAILED` | `npm run bug:publish -- <input.json> --verify-only <id>` |
| Reporting, ADO Test Runs, automation | Not built | — |

**Web execution has started, canary-first.** TC-53717-006 was executed manually
against STG through the Playwright MCP server on 2026-08-16 and **passed**; the
result is in `docs/executions/US-53717/RUN-001/`. The canary validated the flow,
the step-level result format and the evidence rules, and **the reusable
`/execute-test-cases` skill was then extracted from what that run proved** — its
hard rules are lessons from a real execution, not theory.

Only Admin Panel cases are in scope for manual execution for now (human decision,
2026-08-13); the Agent Portal cases are published but not yet queued.

**Next capability:** execute the remaining approved Admin Panel cases through the
skill. `ADMIN_LOCKOUT` and `ADMIN_DISABLED` are **not yet configured** in `.env`,
so cases needing them will be BLOCKED / `TEST_DATA_ISSUE` until they are.

**Execution never writes to Azure DevOps.** No Test Run, no Test Result, no Bug is
created by execution. A failure classified `PRODUCT_BUG` becomes a **local Bug
Candidate** that stops for human review; every other classification
(`TEST_DATA_ISSUE`, `ENVIRONMENT_ISSUE`, `NETWORK_ISSUE`, `AUTHENTICATION_ISSUE`,
`TEST_SCRIPT_ISSUE`, `UNKNOWN`) is recorded with evidence and raises no bug.

**Creating the Bug is a separate, human-gated skill** — `/publish-bug`, never part
of execution. The pipeline is:

```
PRODUCT_BUG -> Bug Candidate -> human review -> /publish-bug -> verify
```

Dry run by default; `--confirm` requires explicit approval immediately beforehand.
**Duplicate checking is scoped to the User Story that owns the executed Test
Cases** (human decision, 2026-08-16 — `docs/product-decisions.md` §5.1).

**Severity and assignee are decided by the human per Bug and are never inherited**
from a previously published Bug (`docs/product-decisions.md` §5.2). **Priority is
not written at all** unless the human explicitly asks for a value, so the process
template's default applies. Input schema: `docs/bug-input.schema.md`.

**A publish is not finished when Azure DevOps returns an ID.** The item is read
back and checked field by field; a mismatch is reported as
**`PUBLISH_VERIFICATION_FAILED`** with the Bug ID preserved, and **never** by
creating a second Bug.

**Two execution rules the canary proved, the hard way:**
- **Wait for the app to settle before judging a result.** After submitting login
  the page was still on `/login`; navigation completed a moment later. Reading the
  result immediately would have produced a **false FAIL**.
- **Never persist an accessibility snapshot as evidence.** The Playwright
  accessibility tree returns typed passwords in **plain text** even though the UI
  masks them. Rendered screenshots are the safe artifact (invariant 7).

**Publishing is done for US 53717 and is idempotent.** Re-running the publisher
creates nothing: it skips any case holding an Azure DevOps ID and matches the rest
against the story's existing children by title.

**The two workflows are deliberately separate skills.** Requirement analysis and
test case generation have different inputs, different review gates, and different
failure modes; merging them would hide which step produced a wrong result.

**A User Story may carry a Change Request as a second attachment.** US 52860 attached both
a module-level requirement (`Geo-Master-Requirements-City-Region-State.md`, covering City,
Region **and** State) and a City-scoped Change Request (`City-CR.md`). The workflow handled
this by reading both, keeping the **original requirement** and the **requested change**
separately identifiable in the analysis, and deriving a **final expected behaviour** section
from the two combined (human decision D-02 on that story). **Do not merge a Change Request
into the baseline silently** — a case asserting a superseded baseline rule becomes a false
bug report. The reverse also matters: three cases in that set assert CR behaviour that
directly contradicts the specification's literal text.

**A story's scope may be narrower than its specification.** US 52860's specification
documents three features; the human scoped test cases to **City only** (D-01). Most of the
specification's requirement count was therefore deliberately out of scope, recorded as
explicit exclusions rather than dropped. When a requirement belongs to another entity, a
record of it being *used as test data* is in scope; an *assertion about it* is not.

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

```
/publish-bug <path-to-bug-candidate>
```

Publishes **one** human-reviewed Bug Candidate to Azure DevOps as a Bug under the
User Story that owns the failing Test Case, links it to that story and to the Test
Case, uploads its evidence, then **verifies the created item field by field**.
Duplicate checking is **story-scoped only**. Severity and assignee must be
supplied by the human for that Bug; Priority is left to Azure DevOps unless
explicitly overridden. Refuses anything not `PRODUCT_BUG`; never retries a write;
never commits. Defined in `.claude/skills/publish-bug/SKILL.md`.

```
/execute-test-cases <USER_STORY_ID> [<TC-ID> ...]
```

Executes the **approved** Web UI Test Cases of that story against the allow-listed
environment through the **Playwright MCP server**, step by step, verifying each
stated Expected Result and recording PASS/FAIL/BLOCKED/SKIPPED with step-level
Expected vs Actual, failure classification and evidence into a **new**
`docs/executions/US-<ID>/RUN-<NNN>/`. Narrow it to specific Test Case IDs, or run a
single case alone. It **never writes to Azure DevOps**, never modifies a Test Case,
never invents an Expected Result, and never commits. A failure classified
`PRODUCT_BUG` produces a **local Bug Candidate and stops for human review**.
Defined in `.claude/skills/execute-test-cases/SKILL.md`.

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

npm run bug:publish -- <input.json>                    # DRY RUN + story-scoped duplicate check
npm run bug:publish -- <input.json> --confirm          # publishes, then verifies
npm run bug:publish -- <input.json> --verify-only <id> # re-verify an existing Bug, writes nothing

npm run typecheck            # tsc --noEmit, strict
```

`bug:publish` is **dry run by default** and publishes **one** Bug per invocation —
there is no batch mode, because a loop is how duplicate Bugs get created. Input
schema: `docs/bug-input.schema.md`. Exit code **3** means
`PUBLISH_VERIFICATION_FAILED`: the Bug **exists** and must be fixed by hand, never
by re-running.

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
                  publish-test-cases, execute-test-cases. Invokable by Claude or
                  as /<name> <ID>.
src/ado/          Azure DevOps integration. The only place ADO field names exist.
                  config -> credentials/env, read AND write loaders (invariant 7)
                  http -> GET-only transport, retries
                  http-write -> POST/PATCH only, NO retries (invariant 4)
                  client -> AdoReadClient    |  user-story -> Requirement Context
                  write-client -> AdoWriteClient, creates work items, uploads
                                  attachments, links relations
                  test-case -> TestCaseRecord -> ADO Test Case fields + steps XML
                  bug -> BugCandidateRecord -> ADO Bug fields + repro-steps HTML.
                         Severity IS written (required, no default); Priority is
                         NEVER written, so the template default stands.
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
docs/executions/US-<id>/RUN-<nnn>/
                  execution-results.md      One manual execution run: provenance
                                            (environment label AND target host
                                            verbatim), per-case status, step-level
                                            Expected vs Actual, failure
                                            classification, observations. Never
                                            modifies test-cases.md.
                  evidence/                 Screenshots for that run. GITIGNORED —
                                            local only, never committed. Rendered
                                            screenshots only; never accessibility
                                            snapshots, which leak passwords.
                  bug-candidates/           Local Bug Candidates raised by that run,
                                            status Draft, awaiting human review.
                                            NEVER auto-published to Azure DevOps.
```

**Runs are append-only.** A re-execution after a fix is a **new** `RUN-<NNN>`, never
an overwrite — run history is what makes a flaky result visible instead of hiding it
behind the latest green.

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

## Documentation synchronization — mandatory

**Documentation sync is part of Definition of Done, not a follow-up step**
(human decision, 2026-08-17 — `docs/product-decisions.md` §18).

Whenever a change lands anywhere in the project, run a documentation-impact check
**in the same task** and update whatever it affects:

```
PROJECT CHANGE
  -> identify affected documentation
  -> update affected Skill(s)
  -> update CLAUDE.md
  -> update docs/product-decisions.md when the change is a durable decision
  -> validate
  -> continue the requested task
```

Three surfaces are in scope: **`.claude/skills/**/SKILL.md`**, **`CLAUDE.md`**, and
**`docs/product-decisions.md`**.

**Never** report that documentation is stale instead of fixing it, defer an update,
wait to be asked, or leave a known inconsistency behind. **Do not ask permission**
to perform these updates — they are maintenance.

**A task is NOT complete if** an affected Skill is stale, CLAUDE.md is stale, a
durable decision is unrecorded, a Skill still names a changed CLI interface, or
documentation still points at a moved path.

**Triggers include:** a CLI command added or changed · a new MCP server or tool ·
an execution or publishing workflow change · a security rule change · an artifact
path or directory change · a product/workflow decision · a Skill created, removed,
renamed, or materially changed · **an implementation that proves an existing Skill
instruction wrong** — fix the Skill immediately rather than preserving stale text.

**Not triggered by** trivial implementation detail with no effect on workflow,
Skill behaviour, CLI interfaces, architecture, security, MCP configuration,
artifact structure, product decisions, or project-level rules.

**Ask the human only** when new documentation content encodes a genuine
product/workflow decision that cannot be derived from the implementation or an
already-recorded decision — and even then, update everything technical that *is*
determinable and flag only the unresolved decision.

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
- **No `Remember Me` control was visible on the Admin Panel login form** during
  RUN-001, though TC-53717-002 expects one. **Unverified** — TC-53717-002 has not
  been executed, so this is an observation, not a result and not a bug. Execute
  that case before drawing any conclusion.
- **US 52860's 35 City test cases are published** (Azure DevOps 55648–55683, verified).
  Azure DevOps is now the official record for them (`docs/product-decisions.md` §13).
  **Not yet executed** — none of its 12 test-data prerequisites is confirmed in STG, and the
  City screen's location is unknown (OQ-12 in that story's analysis).
- **US 52860 has four open questions that block coverage, not publication.**
  **OQ-06** (the Change Request's button matrix has no *Update / authority=Yes / Inactive*
  row) and **OQ-07** ("Inactive" means Pending, Rejected, *or* Approved-but-deactivated) are
  the source's own High-severity warnings. By human decision **D-05** they produce **no test
  case at all** — not even observation-only — and no invented Expected Result. **OQ-02**
  (is the deliverable UI, API, or both?) leaves `REQ-CIT-015` and `REQ-CIT-017` — the Change
  Request's back-end enforcement requirements — **uncoverable by the UI-only scope**.
  **OQ-01**: the CR names a `City-Change-Request.md` full-detail document that was never
  attached, so only its summary was available.
- **US 52860 has 10 open Bugs under the same story** that describe behaviour its new test
  cases assert (54370, 54589, 54591, 54604, 55040, 55043, 55054, 55056 among them). Several
  cases are therefore **expected to FAIL on first execution** — that is the test working, not
  a defect in the test. Bug 54591 (City Code `ALEX` treated as equal to `AL I`) points at a
  real case/space-comparison defect touching **WARN-002**, which no source defines and which
  decision D-03 deliberately did **not** settle — D-03 fixed uniqueness *scope*, not its
  *case rule*.
- **Whether execution evidence stays gitignored** (current behaviour) or gets
  committed for traceability is undecided. Screenshots may contain internal
  product data, so the safe default stands until a human decides.

Add here when a project-level question is raised but not yet decided, and remove
the entry when it is answered.

**Settled 2026-08-13:** the allowed *Review/Lifecycle Status* values and the
rejected-item rule, defined with the first test case artifact and recorded in
`docs/product-decisions.md` §6.1.
