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
persistent source of truth for HOW the agent works.** The full decision record,
including rejected alternatives, lives in `docs/product-decisions.md`.

The repository is **private**.

---

## Method vs. project knowledge

**This repository serves more than one project.** Two kinds of content are kept
strictly apart (`docs/product-decisions.md` §12.2):

| Kind | Lives in | Applies to |
|---|---|---|
| **Method** — invariants, approval gates, the PROD block, evidence rules, execution statuses, failure classification, artifact formats, workflows | `CLAUDE.md`, `docs/product-decisions.md`, `.claude/skills/**` | **Every** project |
| **Project knowledge** — environments and hosts, test-data handles, modules, terminology, title token, engagement state, per-story decisions | `docs/projects/<KEY>/` | **One** project |

**A project profile may narrow what the agent does; it may never widen it.** It
cannot enable PROD, waive an approval gate, permit a write the method forbids, or
relax an evidence or credential rule. Every safety control is defined here, at
the method layer, precisely so that no project file can turn it off.

Do not put a project fact in this file, and do not put a rule in a project
profile.

### Active project — always explicit

Before reading or writing **anything**, establish which project the request
belongs to (`docs/product-decisions.md` §12.3):

1. An explicitly supplied key — `--project <KEY>`, or the key a skill was given.
2. `QA_ACTIVE_PROJECT` in the environment.
3. The sole project, **only** when exactly one profile exists.

**If several projects exist and none is named, STOP and ask the human.** Never
pick one. Never infer the project from a story ID — story IDs are unique per
Azure DevOps project, not globally. Never search every project for a matching
file and use whichever turned up. Never default to whichever project came first.

Once resolved, **load `docs/projects/<KEY>/profile.md`** and take every
project-specific value from it. Implemented in `src/projects/active-project.ts`;
failures surface as `ProjectError`.

```
Active Project = NBO       -> docs/projects/NBO/profile.md
Active Project = NDC-CORE  -> docs/projects/NDC-CORE/profile.md
```

---

## Current state

Nothing enters this table until it has actually been run. A capability with no
verify command is not built, regardless of what code exists. **This table
describes the agent's capabilities, not any one engagement** — per-project
progress lives in `docs/projects/<KEY>/state.md`.

| Capability | Status | Verify with |
|---|---|---|
| Azure DevOps read-only connectivity | **Verified against real Azure DevOps** | `npm run ado:check` |
| Read User Story by ID -> Requirement Context | **Verified against real Azure DevOps** | `npm run story:read -- <ID>` |
| Read + download Markdown attachments | **Verified against real Azure DevOps** | `npm run story:read -- <ID> --summary` |
| Requirement analysis workflow | **Reusable skill, verified** | `/analyze-story <ID>` |
| Test Case generation workflow | **Reusable skill, verified** | `/write-test-cases <ID>` |
| Azure DevOps **write** path (`ADO_PAT_WRITE`) | **Verified against real Azure DevOps** — 87 Test Cases created, 0 failures, 0 duplicates | `npm run testcases:publish -- <ID>` (dry run) |
| Publishing Test Cases as children of a User Story | **Verified against real Azure DevOps, twice** | `/publish-test-cases <ID>` |
| Manual web execution (Playwright MCP) | **Canary verified against a real app** | `/execute-test-cases <ID>` |
| Web execution workflow | **Reusable skill, verified** — found a real defect | `/execute-test-cases <ID> [<TC-ID>…]` |
| Creating Bugs in Azure DevOps | **Verified against real Azure DevOps, twice** | `npm run bug:publish -- <input.json>` (dry run) |
| Bug publishing workflow | **Reusable skill.** Duplicate refusal and post-create verification exercised | `/publish-bug <bug-candidate>` |
| Post-create Bug verification | **Verified** — **12 checks**; Description, Repro Steps and System Info asserted non-empty **separately** | `npm run bug:publish -- <input.json> --verify-only <id>` |
| Disjoint Bug field mapping | **Verified against real Azure DevOps** — read back and checked phrase by phrase | `docs/projects/<KEY>/executions/` |
| Multi-project support (profiles + active project) | **Verified** — resolution, refusal-to-guess and path scoping under test | `npm test` |
| Automated tests (parser, Bug builders, active project, profile drift) | **Verified** — 48 tests | `npm test` |
| Reporting, ADO Test Runs, automation | Not built | — |

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
Cases** (`docs/product-decisions.md` §5.1).

**The Bug's Azure DevOps field mapping is disjoint** (`docs/product-decisions.md`
§5.4). The whole Bug Candidate is never dumped into Repro Steps; each part of it
lands in exactly one field, with nothing repeated:

```
Title       -> System.Title
Description -> Description
Repro Steps -> Preconditions, Steps to Reproduce, Expected Result,
               Actual Result, Requirement Reference, Related Test Case
System Info -> Environment (label AND host), Failure Classification, Evidence
```

`bug.description` is therefore **required** — it is the sole content of the field
Azure DevOps shows first on every board card. Evidence is still uploaded as a real
attachment; System Info carries the note describing it. Verification asserts all
three fields are non-empty **separately**, because one combined check would hide a
whole missing section.

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

**Publishing is idempotent.** Re-running the publisher creates nothing: it skips
any case holding an Azure DevOps ID and matches the rest against the story's
existing children by title.

**The two workflows are deliberately separate skills.** Requirement analysis and
test case generation have different inputs, different review gates, and different
failure modes; merging them would hide which step produced a wrong result.

**A User Story may carry a Change Request as a second attachment.** Read both,
keep the **original requirement** and the **requested change** separately
identifiable in the analysis, and derive a **final expected behaviour** section
from the two combined. **Do not merge a Change Request into the baseline
silently** — a case asserting a superseded baseline rule becomes a false bug
report. The reverse also matters: a case may assert CR behaviour that
contradicts the specification's literal text, and that must be visible.

**A story's scope may be narrower than its specification.** Requirements outside
the human-set scope are recorded as explicit exclusions rather than dropped. When
a requirement belongs to another entity, a record of it being *used as test data*
is in scope; an *assertion about it* is not.

**V1 reader scope: `User Story` work item type only.** Azure DevOps projects
expose many work item types (`Product Backlog Item`, `Epic`, `Feature`, `Issue`)
— do **not** widen the reader to those yet. Keep the design extensible so
additional types can be added later.

---

## Non-negotiable invariants

These are the rules most easily broken by accident. Do not relax them without an
explicit decision recorded in `docs/product-decisions.md`. **No project profile
may override any of them.**

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
   act only against environments explicitly allowed by the **active project's
   profile**. Any PROD execution or PROD write requires explicit human
   confirmation. **A project profile may add an allowed non-PROD environment; it
   can never unblock PROD.** The environment is decided by its explicit label,
   **never inferred from a hostname**.

6. **No Azure DevOps field names outside `src/ado/`.** All `System.*` and
   `Microsoft.VSTS.*` reference names live in `src/ado/fields.ts` and nowhere
   else. Checkable:
   `grep -rn "Microsoft.VSTS\|System\." src --include=*.ts` should only hit
   `src/ado/`.

7. **Secrets never leave `.env`.** `src/ado/config.ts` is the only module that
   may read a **credential or any other secret** from `process.env` — including
   the write credential, which it exposes through a separate loader and a
   separate type (see invariant 3). Every error message passes through `redact()`
   in `src/ado/errors.ts`. Never print, log, or commit a credential value.
   Environment configuration and credentials never appear inside test case
   definitions or project profiles — profiles name **handles and variable names
   only, never values**.

   The **one** non-secret exception is `QA_ACTIVE_PROJECT`, read by
   `src/projects/active-project.ts`: it holds a directory name, is safe to print,
   and is printed by design so a run states which project it acted on. Checkable:
   `grep -rn "process\.env" src --include=*.ts` should hit only
   `src/ado/config.ts` and that single line.

8. **Zero runtime dependencies** is the default. Node 24 provides TypeScript
   execution, `.env` loading, `fetch`, timeouts, and a test runner natively. Dev
   dependencies are limited to `typescript` and `@types/node`. A new runtime
   dependency needs a clear technical reason and human review before it is
   introduced.

9. **The active project is explicit or the run stops.** Never guess which project
   a request belongs to when more than one exists. See *Active project* above and
   `docs/product-decisions.md` §12.3.

---

## Approval gates

Never perform these without explicit human approval in the current session:

- `git commit` / `git push`
- Publishing Test Cases to Azure DevOps
- Creating Bugs in Azure DevOps
- Any Azure DevOps write, update, or delete
- Any action against an environment not allow-listed by the active project
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

**Every skill resolves the active project first** and reads
`docs/projects/<KEY>/profile.md` for project-specific values. A skill given an
ambiguous project stops and asks.

```
/analyze-story <USER_STORY_ID> [--project <KEY>]
```

Reads the User Story, verifies its type, reads its `.md` attachments, updates the
source snapshot, analyses everything together, and writes
`docs/projects/<KEY>/requirements/US-<ID>/requirement-analysis.md`. Reusable for
**any** User Story ID. It skips re-download and re-analysis when the content
fingerprint is unchanged. It **never** generates test cases, writes to Azure
DevOps, or commits.

```
/write-test-cases <USER_STORY_ID> [--project <KEY>]
```

Generates the Test Case artifact for an **already analysed** User Story from the
local Requirement Analysis, `decisions.md` and source snapshot, then performs the
AI self-review and writes
`docs/projects/<KEY>/test-cases/US-<ID>/test-cases.md`. It **does not read Azure
DevOps at all** — if the analysis is missing it stops and points at
`/analyze-story`. It never publishes, never approves, and never commits. On a
re-run it keeps Test Case IDs, human-set statuses and recorded Azure DevOps IDs
stable.

```
/publish-test-cases <USER_STORY_ID> [--project <KEY>]
```

Publishes the **approved** Test Cases of that story to Azure DevOps as **child Test
Case work items**, then records each new Azure DevOps ID in the local artifact and
sets its status to `Published`. Dry run first, then an **explicit human approval
immediately before the first write**, then create-and-record one item at a time,
then verify against Azure DevOps. Refuses anything not `Approved`; cannot create
duplicates; never retries a write; never commits.

```
/publish-bug <path-to-bug-candidate>
```

Publishes **one** human-reviewed Bug Candidate to Azure DevOps as a Bug under the
User Story that owns the failing Test Case, links it to that story and to the Test
Case, uploads its evidence, then **verifies the created item field by field**.
Duplicate checking is **story-scoped only**. Severity and assignee must be
supplied by the human for that Bug; Priority is left to Azure DevOps unless
explicitly overridden. Refuses anything not `PRODUCT_BUG`; never retries a write;
never commits.

```
/execute-test-cases <USER_STORY_ID> [<TC-ID> ...] [--project <KEY>]
```

Executes the **approved** Web UI Test Cases of that story against an environment
allow-listed **by the active project's profile**, through the **Playwright MCP
server**, step by step, verifying each stated Expected Result and recording
PASS/FAIL/BLOCKED/SKIPPED with step-level Expected vs Actual, failure
classification and evidence into a **new**
`docs/projects/<KEY>/executions/US-<ID>/RUN-<NNN>/`. Narrow it to specific Test
Case IDs, or run a single case alone. It **never writes to Azure DevOps**, never
modifies a Test Case, never invents an Expected Result, and never commits. A
failure classified `PRODUCT_BUG` produces a **local Bug Candidate and stops for
human review**.

### npm scripts

```bash
npm run ado:check            # read-only Azure DevOps connectivity check
npm run ado:check -- --json  # machine-readable output

npm run story:read -- <ID>                    # User Story -> Requirement Context
npm run story:read -- <ID> --summary          # metadata + attachment list only
npm run story:read -- <ID> --json             # machine-readable
npm run story:read -- <ID> --save-source <dir># save .md attachments verbatim

npm run testcases:publish -- <ID> --project <KEY>            # DRY RUN
npm run testcases:publish -- <ID> --project <KEY> --confirm  # writes (needs approval first)
npm run testcases:publish -- <ID> --project <KEY> --verify   # verify, writes nothing
npm run testcases:publish -- <ID> --project <KEY> --confirm --limit 1   # canary

npm run bug:publish -- <input.json>                    # DRY RUN + story-scoped duplicate check
npm run bug:publish -- <input.json> --confirm          # publishes, then verifies
npm run bug:publish -- <input.json> --verify-only <id> # re-verify an existing Bug, writes nothing

npm test                     # node --test: parser, Bug builders, active project, profile drift
npm run typecheck            # tsc --noEmit, strict
```

`--project <KEY>` is **required whenever more than one project profile exists**.
With exactly one, it may be omitted. `QA_ACTIVE_PROJECT=<KEY>` works in place of
the flag.

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
                  publish-test-cases, execute-test-cases, publish-bug.
                  METHOD — shared by every project.
src/ado/          Azure DevOps integration. The only place ADO field names exist.
                  config -> credentials/env, read AND write loaders (invariant 7)
                  http -> GET-only transport, retries
                  http-write -> POST/PATCH only, NO retries (invariant 4)
                  client -> AdoReadClient    |  user-story -> Requirement Context
                  write-client -> AdoWriteClient, creates work items, uploads
                                  attachments, links relations
                  test-case -> TestCaseRecord -> ADO Test Case fields + steps XML
                  bug -> BugCandidateRecord -> ADO Bug fields. THREE disjoint
                         rich-text builders: buildDescriptionHtml,
                         buildReproStepsHtml, buildSystemInfoHtml — nothing is
                         repeated between them (product-decisions §5.4).
                         Severity IS written (required, no default); Priority is
                         NEVER written, so the template default stands.
                  fields -> System.*/Microsoft.VSTS.* reference names
src/projects/     Active project resolution and per-project artifact paths.
                  active-project -> resolveActiveProject (explicit or STOP),
                                    profile reading, path helpers.
                  NO Azure DevOps knowledge, reads no credentials.
src/testcases/    Test Case artifact handling with NO ADO knowledge.
                  model -> TestCaseRecord, status vocabulary
                  artifact -> strict parser + per-case ID/status write-back
src/text/         Content conversion with no ADO knowledge (HTML <-> Markdown).
src/cli/          Human-facing entry points.
tests/            node --test suites. Golden fixtures in tests/fixtures/.
                  artifact.test.ts       strict parser + write-back
                  bug.test.ts            the three DISJOINT Bug builders
                  active-project.test.ts resolution, refusal-to-guess, scoping
                  profile-drift.test.ts  every handle a Test Case uses must be
                                         declared in its project's profile.
                                         Project-agnostic; never invents a
                                         handle, reports the gap instead.

docs/product-decisions.md   METHOD — the full shared decision record.
docs/bug-input.schema.md    METHOD — Bug publisher input schema.

docs/projects/<KEY>/        PROJECT KNOWLEDGE — one directory per project.
                  profile.md      tracker, environments, handles, terminology,
                                  title token, modules. Names variables and
                                  handles, NEVER values.
                  decisions.md    project-level human decisions
                  state.md        engagement state: delivered, next, open items
                  requirements/US-<id>/
                      requirement-analysis.md   QA analysis: scope, rules, fields,
                                                flows, open questions. Agent-
                                                generated and may be regenerated.
                                                Provenance header records rev +
                                                fingerprint + attachment sha256.
                      decisions.md              Confirmed HUMAN decisions. Human
                                                authority; outranks the agent's
                                                reading and SURVIVES regeneration
                                                of the analysis. The agent may
                                                cite it, never add to it.
                      source/                   Verbatim snapshot of the .md
                                                attachment(s). The fingerprint
                                                says *that* a requirement changed;
                                                only this shows *what* changed.
                  test-cases/US-<id>/
                      test-cases.md             The Test Case set: provenance +
                                                fingerprint, test data handles,
                                                coverage map, deliberate
                                                exclusions, the cases, rejected
                                                cases, and the AI self-review
                                                record. Regenerable — but Test
                                                Case IDs, human-set statuses and
                                                published Azure DevOps IDs must
                                                survive regeneration.
                  executions/US-<id>/RUN-<nnn>/
                      execution-results.md      One manual execution run:
                                                provenance (environment label AND
                                                target host verbatim), per-case
                                                status, step-level Expected vs
                                                Actual, failure classification.
                                                Never modifies test-cases.md.
                      evidence/                 Screenshots. GITIGNORED — local
                                                only, never committed. Rendered
                                                screenshots only; never
                                                accessibility snapshots, which
                                                leak passwords.
                      bug-candidates/           Local Bug Candidates, status Draft,
                                                awaiting human review. NEVER
                                                auto-published to Azure DevOps.
```

**`RUN-000` is reserved for non-execution artifacts.** A Bug Candidate created to
test the publishing workflow — not produced by executing anything — lives in
`RUN-000` and carries **no** `execution-results.md`. Reserving `000` keeps such an
artifact from ever colliding with a real `RUN-001`.

**Runs are append-only.** A re-execution after a fix is a **new** `RUN-<NNN>`, never
an overwrite — run history is what makes a flaky result visible instead of hiding it
behind the latest green.

**Test cases live outside `requirements/`** deliberately. That directory holds
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

---

## Conventions

- **Commits: Conventional Commits** — `feat(...)`, `fix(...)`, `docs(...)`,
  `refactor(...)`, `test(...)`, `chore(...)`.
- **Test Case and Bug titles:** `[Project][Module][Feature/Page] <Scenario>`.
  The Project token comes from the **active project's profile**. Project / Module
  / Feature are stored as structured fields; the title is generated from them.
- **Execution statuses** are defined in `docs/product-decisions.md` §8 —
  PASS / FAIL / BLOCKED / SKIPPED have specific meanings, use them exactly.
- **TypeScript:** strict, plus `erasableSyntaxOnly` — Node runs `.ts` files
  directly, so no enums, namespaces, or constructor parameter properties.
  Relative imports must use explicit `.ts` extensions.
- **Errors:** every Azure DevOps failure becomes an `AdoError` with a domain
  code. Callers switch on the code and never inspect HTTP status. Active-project
  failures are `ProjectError`; artifact failures are `ArtifactError`.
- **Comments** explain *why*, not *what*.
- **Tests:** `node --test`, no framework (invariant 8). Run `npm test` and
  `npm run typecheck` after any change to `src/`.

---

## Documentation synchronization — mandatory

**Documentation sync is part of Definition of Done, not a follow-up step**
(`docs/product-decisions.md` §18).

Whenever a change lands anywhere in the project, run a documentation-impact check
**in the same task** and update whatever it affects:

```
PROJECT CHANGE
  -> identify affected documentation
  -> update affected Skill(s)
  -> update CLAUDE.md
  -> update docs/product-decisions.md when the change is a durable decision
  -> update docs/projects/<KEY>/ when the change is project knowledge
  -> validate
  -> continue the requested task
```

Four surfaces are in scope: **`.claude/skills/**/SKILL.md`**, **`CLAUDE.md`**,
**`docs/product-decisions.md`**, and **`docs/projects/<KEY>/`**.

**Route the update to the right layer.** A rule goes to the method layer; a fact
about one client goes to that project's directory. Putting a project fact in
`CLAUDE.md` is how the two got fused in the first place.

**Never** report that documentation is stale instead of fixing it, defer an update,
wait to be asked, or leave a known inconsistency behind. **Do not ask permission**
to perform these updates — they are maintenance.

**A task is NOT complete if** an affected Skill is stale, CLAUDE.md is stale, a
durable decision is unrecorded, a project profile contradicts what the code does, a
Skill still names a changed CLI interface, or documentation still points at a moved
path.

**Triggers include:** a CLI command added or changed · a new MCP server or tool ·
an execution or publishing workflow change · a security rule change · an artifact
path or directory change · a product/workflow decision · a Skill created, removed,
renamed, or materially changed · **a new project onboarded** · **an implementation
that proves an existing Skill instruction wrong** — fix the Skill immediately
rather than preserving stale text.

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
- A new persistent artifact type or directory is introduced -> *Layout*
- **Anything documented here turns out to be wrong** -> fix it in the same turn

**Do not update for:**

- Refactors with no behavioural change
- Bug fixes
- Implementation detail (retry curves, message wording, internal helpers)
- Work in progress — nothing enters *Current state* until it is verified
- **Anything specific to one project** — that belongs in `docs/projects/<KEY>/`

**Before a session ends,** if a project-level decision was made, record it here
or in `docs/product-decisions.md`; if an engagement fact changed, record it in
`docs/projects/<KEY>/state.md`.

**Create project files only when a capability genuinely needs them.** Do not
scaffold speculative folders, Skills, Commands, Agents, schemas, or config ahead
of the workflow that requires them. Do not ask the human to create structure —
only secrets, credentials, external configuration, and human decisions come from
them.

---

## Onboarding a new project

1. Create `docs/projects/<KEY>/profile.md` — tracker, environments (never PROD),
   test-data handle **names**, terminology, title token, modules.
2. Add that project's `.env` variables. Values live only in `.env` (invariant 7).
3. Create `docs/projects/<KEY>/decisions.md` and `state.md` as they gain content.
4. Run every command with `--project <KEY>`, or set `QA_ACTIVE_PROJECT`.

Nothing in `src/` changes to add a project. **Do not copy another project's
handles, hosts, or decisions** — they name that project's systems.

---

## Open items

Project-level open questions live with their project in
`docs/projects/<KEY>/state.md`. Method-level open questions go here.

- **Whether execution evidence stays gitignored** (current behaviour) or gets
  committed for traceability is undecided. Screenshots may contain internal
  product data, so the safe default stands until a human decides.
