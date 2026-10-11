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
| Manual execution HTML report (`manual-report.html`) and run policy | **Built and verified by tests** — strict record validation, isolation from the automation report, totals, evidence links, CSV untouched; a product bug never stops the run, only legitimate stop conditions do (37 tests). **Produced by a real manual run** — 51 cases against STG, 2 product-bug failures recorded and the run continued to completion | `npm run execution:report -- <ID> --project <KEY> [--run RUN-<NNN>]` |
| **Bug Report** section in both reports, Bug Candidate dispositions (`Draft` / `Confirmed` / `Not a Bug`) | **Verified by tests** (18) and on a real run — US-52857 RUN-001 re-rendered with both candidates resolved as not a bug; its results and Execution Summary unchanged | `npm run execution:report -- <ID> --project <KEY> --run RUN-<NNN>` · `npm run automation:report -- --project <KEY>` |
| Creating Bugs in Azure DevOps | **Verified against real Azure DevOps, twice** | `npm run bug:publish -- <input.json>` (dry run) |
| Bug publishing workflow | **Reusable skill.** Duplicate refusal and post-create verification exercised | `/publish-bug <bug-candidate>` |
| Post-create Bug verification | **Verified** — **12 checks**; Description, Repro Steps and System Info asserted non-empty **separately** | `npm run bug:publish -- <input.json> --verify-only <id>` |
| Disjoint Bug field mapping | **Verified against real Azure DevOps** — read back and checked phrase by phrase | `docs/projects/<KEY>/executions/` |
| Multi-project support (profiles + active project) | **Verified** — resolution, refusal-to-guess and path scoping under test | `npm test` |
| Automated tests (parser, CSV codec + CSV-first store, Bug builders, active project, profile drift, regeneration, automation, reporting, analysis sources, session cleanup) | **Verified** — 318 tests, 317 pass. The one failure, `analysis-sources` 11b, is **expected**: it reads `requirements/US-53717/requirement-analysis.md`, and that story was deliberately removed from the repository. The test is scheduled to be rewritten against a fixture instead of a live project artifact | `npm test` |
| Optional analysis sources — API specification, UI exploration (`/analyze-story`) | **Preflight and API reader verified** by tests and against the real US-53717 analysis (backward compatible). **No analysis has yet used an API spec or explored the UI** — none supplied, and `.env` has no app environment | `npm run analysis:preflight -- <ID> --project <KEY>` |
| Need Automation decision per Test Case (automation Phase 1) | **Verified** — parser and regeneration check by tests; Skill exercised by the US-52857 `/write-test-cases` run (52 cases, 47 Yes / 5 No) | `npm run testcases:check -- <ID> --project <KEY>` |
| **CSV as the single source of truth for test cases** (`test-cases.csv` + rendered `test-cases.md`) | **Verified** — all 4 existing stories migrated losslessly (139 NBO cases + 4 synthetic); publisher `--verify` and dry run read the CSV against real Azure DevOps (read-only); automation scope and the HTML report read the CSV; contract under test | `npm run testcases:check -- <ID> --project <KEY>` |
| Playwright framework (automation Phase 2) | **Verified against STG** — config, project resolution, discovery by `@TC` tag, environment guard, sub-module paths (§7.1.2), recorded observations in the report (§7.2). **51 specs exist** (NBO US-52857, `automation/NBO/Company/Operating-Country/`); **all 51 passed on STG in RUN-040** (commit 75ec5dd), after six automation defects were fixed | `npm run automation:list -- --project <KEY>` |
| Automation case selection | **Verified** by tests and against a real artifact (0 of 52 in scope, all undecided) | `npm run automation:scope -- <ID> --project <KEY>` |
| Playwright artifact safety | **Verified** — found three leak paths of typed passwords and closed them (§7.1.1); the check now also scans the HTML report and Bug Candidates; passes | `npm run automation:verify-artifacts` |
| Automation workflow | **Reusable skill, verified end to end** — US-52857: plan approved, code for all 51 cases generated, and all 51 passing on STG in RUN-040. An early full run was invalidated by abandoned sessions; session cleanup (§7.1.3) fixed it | `/automate-test-cases <ID>` |
| Session cleanup after every automated test (§7.1.3) | **Verified on STG** — logout API with each session's own token and `allSessions: false`; every session in 9 cases (passing, failing, 2- and 3-account) answered HTTP 200 and its old token was then rejected (401); next login succeeded. 14 unit tests | `npm test` · `npm run automation:test -- --project <KEY> --grep @TC-<id>` |
| HTML execution report (automation Phase 3) | **Verified end to end on the synthetic artifact-check project** (3 failures + 1 pass, 2 Bug Candidates, screenshots, a video for every test) and by tests. **Not yet produced by a real project run** — no spec exists | `npm run automation:report -- --project <KEY>` |
| ADO Test Runs, CI for automation, publishing automation Bugs | Not built | — |

**Execution never writes to Azure DevOps.** No Test Run, no Test Result, no Bug is
created by execution. A failure classified `PRODUCT_BUG` becomes a **local Bug
Candidate** for human review — and **the run continues**: a product bug never stops
a manual run or skips another case (`docs/product-decisions.md` §10.5). A run stops
only when continuing is unsafe or impossible — `ENVIRONMENT_UNAVAILABLE`,
`AUTHENTICATION_BROKEN`, `BLOCKING_ISSUE`, `DESTRUCTIVE_RISK` — keeping every result
so far and still writing its reports; the rule is code (`src/execution/run-policy.ts`)
and `execution:report` refuses a record that breaks it. Every other classification
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

**Every automated test ends every session it opened, passed or failed**
(`docs/product-decisions.md` §7.1.3) — the `endSessions` auto fixture, fed by the
project's login Page Object, through the **application's logout API** with that
session's own token and `allSessions: false`, then confirms the old token is
rejected (401). Tokens are captured from the app's own requests, held in memory,
registered for redaction, never logged. Clearing cookies or storage is **not** a
logout: sessions live server-side (Redis); the first full US-52857 run abandoned
them, reached STG's 15-session cap, and every later login failed.

**Two execution rules the canary proved, the hard way:**
- **Wait for the app to settle before judging a result.** After submitting login
  the page was still on `/login`; navigation completed a moment later. Reading the
  result immediately would have produced a **false FAIL**.
- **Never persist an accessibility snapshot as evidence.** The Playwright
  accessibility tree returns typed passwords in **plain text** even though the UI
  masks them. Rendered screenshots are the safe artifact (invariant 7).

**Deterministic Playwright automation hits the same leak, verified**
(`docs/product-decisions.md` §7.1.1). On failure, Playwright 1.64 writes
`error-context.md` with an ARIA snapshot holding the typed password; a trace
holds it three times; a failing `toMatchAriaSnapshot` prints it in the error
message; a **failing `fill()` prints `fill("<value>")`** in its call log.
Mitigated by `suppressPageSnapshots()`, the `redactErrorContext` auto fixture
(which runs every error through `src/automation/sanitizer.ts`), `trace` off, and
code rules enforced by `npm test`.
**`npm run automation:verify-artifacts` must pass before any credentialed
automation runs and after every Playwright upgrade.**

**Automation scope is code, not judgement:** Need Automation = `Yes` **and**
`Approved`/`Published`. `No` and undecided are excluded, an unapproved `Yes` is
refused, every exclusion is reported, and the automation skill never edits
`test-cases.csv` or `test-cases.md`. A `Yes` case that cannot be automated is recorded as
`NOT AUTOMATED — <CATEGORY>`; its Need Automation stays `Yes`.

**Every automated run writes an HTML execution report** (`docs/product-decisions.md`
§7.2) at `.artifacts/reports/<KEY>/RUN-<NNN>/automation-report.html` (the history)
**and** at `automation/<KEY>/<Module path>/automation-report.html` (the Module's
latest run, attachments linked to the run directory, gitignored), via a
Playwright reporter — specs do nothing. A test that never really ran (interrupted,
or its worker died before any step) is `NOT RUN`, never FAIL. Step actions and Expected Results come
from the Test Case artifact, IDs from the spec annotations; nothing is invented.
A step whose Expected Result says "record …" is recorded by the spec as an
`observation` annotation (`Step N: <text>`) and shown, sanitised, as
`Recorded: …` under that step — never an assertion, never a status.
Failure classification there is **automatic and provisional**. A `PRODUCT_BUG`
on a traceable case becomes a **local Draft Bug Candidate**
(`bug-candidates/BUG-NNN.md`) shown in the report's *Bug Report* section — **automation never
creates an Azure DevOps Bug**; publishing stays `/publish-bug`, human-approved.

**Both reports carry a "Bug Report" section** (`docs/product-decisions.md` §10.6), rendered by
one shared component (`src/reporting/bug-report.ts`) from the Bug Candidates **of that run
only**. A Bug Candidate is `Draft` until a **human** resolves it as `Confirmed` or
`Not a Bug`, recorded as a `resolution` (disposition, who, when, decision, rationale) on the
candidate. **A resolution never rewrites history:** the run's results, classifications and
Execution Summary stay as executed; the candidate file keeps its original content and evidence
under a Resolution section; a candidate resolved as not a bug is never passed to `/publish-bug`;
a corrected expectation is proven only by a new run.
Every Playwright string passes the shared sanitizer; attachments are an
allow-list — failure screenshots and test videos, each copied only if it lies
inside Playwright's output directory and its bytes really are PNG / WebM.

**Automated runs record a video of every test** — PASS, FAIL, and NOT RUN once
started (human decision 2026-10-09, `docs/product-decisions.md` §7.2.1). Videos
are **QA-only artifacts** for the project testing team, stored as
`attachments/<TC-ID>.webm` in the run's report directory beside `<TC-ID>.png`,
played in the HTML report, and retained like all other evidence (gitignored,
local, append-only, never sent to Azure DevOps). **The risk of sensitive STG UI
content in a recording is explicitly accepted: never delete or blank a video for
it.** Screenshots stay failure-only. **Video changes nothing about PROD** —
`globalSetup` still refuses PROD and any unlisted label before a browser starts.
MCP-driven `/execute-test-cases` still records no video.

**Publishing is idempotent.** Re-running the publisher creates nothing: it skips
any case holding an Azure DevOps ID and matches the rest against the story's
existing children by title.

**Test cases live in CSV — the single source of truth** (`docs/product-decisions.md`
§6.4). Every story has `test-cases.csv` (one row per case; the human reviews and
edits it) and `test-cases.md` (a rendering of it plus narrative: provenance,
prerequisites, coverage map, self-review). **Every consumer reads the CSV** through
`src/testcases/store.ts` — publishing, execution, automation scope and reporting,
checks. The Markdown is never read for case content; **if the two disagree, the
CSV wins** and the Markdown is re-rendered (`npm run testcases:render`). Rendering
never writes the CSV; the only code change ever made to it is the publisher's
write-back of an Azure DevOps ID and `Published`, cell by cell. Human edits are
never silently restored: `/write-test-cases` revises only affected rows, and
`testcases:check` lists every case whose content changed. Agent-driven Skills read
cases with `npm run testcases:show`, never by reading either file by eye.

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

   **`src/automation/config.ts` is the second and last module allowed to read
   `process.env`** (human decision 2026-10-09, `docs/product-decisions.md` §7.1):
   the application-under-test label, base URL and test-data handle values only,
   under the same rules — resolved credentials are registered with `redact()`,
   errors name variables and handles, never values. It never reads a tracker
   credential.

   The **one** non-secret exception is `QA_ACTIVE_PROJECT`, read by
   `src/projects/active-project.ts`: it holds a directory name, is safe to print,
   and is printed by design so a run states which project it acted on. Checkable:
   `grep -rln "process\.env" src automation playwright.config.ts --include=*.ts`
   should list only `src/ado/config.ts`, `src/automation/config.ts` and
   `src/projects/active-project.ts`.

8. **Zero runtime dependencies** is the default. Node 24 provides TypeScript
   execution, `.env` loading, `fetch`, timeouts, and a test runner natively. Dev
   dependencies are limited to `typescript`, `@types/node`, and
   `@playwright/test` **pinned to an exact version** (human-approved 2026-10-09,
   Chromium only). A new dependency of either kind needs a clear technical
   reason and human review before it is introduced.

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
/analyze-story <USER_STORY_ID> [--project <KEY>] [--api <path>] [--ui] [--ui-account <HANDLE>]
```

Reads the User Story, verifies its type, reads its `.md` attachments, updates the
source snapshot, analyses everything together, and writes
`docs/projects/<KEY>/requirements/US-<ID>/requirement-analysis.md`. Reusable for
**any** User Story ID. It skips re-download and re-analysis when nothing changed.
**Optionally** it also analyses an API specification (`--api`: OpenAPI 3,
Swagger 2 or Postman Collection, JSON) and explores the application UI through
Playwright MCP (`--ui`, opt-in, allowed non-PROD environment only, read-only).
A missing optional source **never** blocks: it is recorded as `Not provided` /
`Not performed — <reason>` (`docs/product-decisions.md` §14.1). The story stays
the source of truth; **[API]** and **[UI]** are evidence, and conflicts become
open questions. It **never** generates test cases, writes to Azure DevOps, or
commits.

```
/write-test-cases <USER_STORY_ID> [--project <KEY>]
```

Generates the Test Case artifact for an **already analysed** User Story from the
local Requirement Analysis, `decisions.md` and source snapshot, then performs the
AI self-review and writes
`docs/projects/<KEY>/test-cases/US-<ID>/test-cases.csv` — the source of truth — then
renders `test-cases.md` from it (`npm run testcases:render`). It **does not read Azure
DevOps at all** — if the analysis is missing it stops and points at
`/analyze-story`. It never publishes, never approves, and never commits. On a
re-run it revises only the CSV rows a requirement change affects — never undoing a
human CSV edit — and keeps Test Case IDs, human-set statuses, recorded Azure
DevOps IDs and every recorded **Need Automation** value stable, enforced by
`npm run testcases:check`. It writes an AI-recommended **Need Automation**
(`Yes`/`No`) on every case for the human to review; it never builds automation.

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
failure classified `PRODUCT_BUG` produces a **local Bug Candidate for human
review, and the run continues** with the next case (§10.5).

```
/automate-test-cases <USER_STORY_ID> [<TC-ID> ...] [--project <KEY>]
```

Selects the story's cases with **Need Automation = `Yes` and status
`Approved`/`Published`** (by code, `automation:scope`), inspects the existing
framework, explores the app on an allow-listed environment through the MCP
server, and writes an **Automation Plan per Module** at
`docs/projects/<KEY>/automation/<Module>/automation-plan.md` — then **stops**.
Code is generated only after an explicit approval of that plan in the session:
one spec per Test Case at `automation/<KEY>/<Module>/tests/TC-<story>-NNN.spec.ts`,
Page Objects in `automation/<KEY>/<Module>/pages/`, tagged `@TC-…`/`@US-…`. It
never edits a Test Case or a Need Automation value, never writes to Azure DevOps,
never creates a Bug, never commits.

### npm scripts

```bash
npm run ado:check            # read-only Azure DevOps connectivity check
npm run ado:check -- --json  # machine-readable output

npm run story:read -- <ID>                    # User Story -> Requirement Context
npm run story:read -- <ID> --summary          # metadata + attachment list only
npm run story:read -- <ID> --json             # machine-readable
npm run story:read -- <ID> --save-source <dir># save .md attachments verbatim

npm run analysis:preflight -- <ID> --project <KEY> [--api <path>] [--ui] [--ui-account <HANDLE>] [--fingerprint <sha256>]
                                              # optional-source status, changes, provenance rows; read-only
npm run api:read -- <spec.json> [--match <term>]...   # relevant API operations, names only — never values

npm run testcases:publish -- <ID> --project <KEY>            # DRY RUN
npm run testcases:publish -- <ID> --project <KEY> --confirm  # writes (needs approval first)
npm run testcases:publish -- <ID> --project <KEY> --verify   # verify, writes nothing
npm run testcases:publish -- <ID> --project <KEY> --confirm --limit 1   # canary

npm run testcases:check -- <ID> --project <KEY> --snapshot   # before revising: save the CSV
npm run testcases:check -- <ID> --project <KEY>              # after: CSV valid, Markdown in sync, nothing lost, Need Automation on every case
npm run testcases:render -- <ID> --project <KEY>             # re-render test-cases.md from the CSV (never writes the CSV)
npm run testcases:show -- <ID> [TC-ID …] --project <KEY> [--json]   # print cases from the CSV via the strict parser
npm run testcases:migrate -- <ID> --project <KEY>            # once: legacy Markdown-only story -> CSV (lossless or nothing)

npm run bug:publish -- <input.json>                    # DRY RUN + story-scoped duplicate check
npm run bug:publish -- <input.json> --confirm          # publishes, then verifies
npm run bug:publish -- <input.json> --verify-only <id> # re-verify an existing Bug, writes nothing

npm run automation:scope -- <ID> --project <KEY>     # which cases are in automation scope, by Module
npm run automation:list -- --project <KEY> [--grep @TC-<id>]   # Playwright discovery; no environment
npm run automation:test -- --project <KEY> [--grep @TC-<id>]   # runs against the allowed environment; writes the HTML report
npm run automation:report -- --project <KEY> [--run RUN-<NNN>]  # find (and re-render) a run's HTML report
npm run automation:verify-artifacts                   # typed secrets must not reach Playwright output or the report
npm run execution:report -- <ID> --project <KEY> [--run RUN-<NNN>]   # MANUAL run -> manual-report.html (latest run by default)

npm test                     # node --test: parser, Bug builders, active project, profile drift, regeneration, automation, reporting, analysis
npm run typecheck            # tsc --noEmit, strict (src/, automation/, playwright.config.ts)
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

`testcases:check` touches local files only and never writes the CSV. It parses
the CSV strictly and requires `test-cases.md` to match it case for case.
`--snapshot` copies the CSV to a gitignored `test-cases.previous.csv` beside it.
The check then exits **1** on Markdown drift, on a lost Test Case ID, Azure
DevOps ID, human-set status or Need Automation value, or on a case without Need
Automation, and lists every case whose content changed; it keeps the snapshot on
failure and removes it when the check passes.

`testcases:render` reads the CSV and rewrites only the generated block of
`test-cases.md`, keeping its narrative verbatim. `testcases:migrate` refuses when
a CSV exists and writes nothing unless every case round-trips exactly.

`automation:list` / `automation:test` resolve the project like every other
command, then run the **pinned** local Playwright with it pinned; every other
argument passes to `playwright test`. Discovery needs no environment; a run is
refused in `globalSetup` unless the label is set, not PROD, on the profile's
allow-list, and its base URL variable is set. `automation:verify-artifacts` is
offline and unauthenticated; exit **1** means a typed value reached Playwright
output — **no credentialed automation may run until it passes**. It drives the
HTML report end to end on a synthetic project
(`src/automation/artifact-check/projects/ARTIFACT-CHECK`) and scans it too.

**Every manual run writes `manual-report.html`** (`docs/product-decisions.md` §10.4)
in its own run directory, `docs/projects/<KEY>/executions/US-<id>/RUN-<NNN>/`, as
the mandatory last step of `/execute-test-cases`: the Skill writes a structured
`execution-results.json`, and `npm run execution:report` validates it strictly and
renders the report. Same look as the automation report (shared presentation in
`src/reporting/html.ts`), separate data and code; the manual report depends on no
automation run. Totals are derived, never stored; the record names handles, never
values, and is refused if it contains one. **The two reports never collide:**
`manual-report.html` (MANUAL) vs `automation-report.html` (AUTOMATED), separate run
roots, and each writer refuses a directory holding the other's report.

`automation:test` prints `Execution report: <path>` (and `Module report: <path>` per
Module) at the end of every run that executed at least one test. `automation:report` finds the latest (or a named)
run's report and re-renders the HTML and Bug Candidates from its stored,
already-sanitised `execution-results.json`; it never re-runs a test. **It
re-renders the Module report too**, from those same stored results — the
Module copy holds only the **latest** run, so a narrowed run (`--grep`,
a single Test Case) legitimately leaves it holding just that run's cases, and
`automation:report -- --project <KEY> --run RUN-<NNN>` is how the full run's
Module report is restored without executing anything. A Module report that must
show every case of a Module therefore comes from a full run — or from
re-rendering one.

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
                  publish-test-cases, execute-test-cases, publish-bug,
                  automate-test-cases.
                  METHOD — shared by every project.
playwright.config.ts
                  The ONE Playwright config. Defines exactly one Playwright
                  project: the active project. Never add a second config.
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
src/analysis/     Optional analysis sources for /analyze-story (§14.1). Read-only;
                  no ADO knowledge, no file writes.
                  api-spec -> OpenAPI 3 / Swagger 2 / Postman v2.x (JSON) ->
                              operation inventory; names, NEVER values
                  sources -> optional-source status, UI exploration decision
                             (reuses the automation env guard), provenance
                             rows, change detection
src/projects/     Active project resolution and per-project artifact paths.
                  active-project -> resolveActiveProject (explicit or STOP),
                                    profile reading, path helpers.
                  NO Azure DevOps knowledge, reads no credentials.
src/testcases/    Test Case handling with NO ADO knowledge (§6.4).
                  model -> TestCaseRecord, status + Need Automation vocabulary
                  csv -> RFC 4180 reader/writer, no dependencies
                  csv-artifact -> the CSV schema: columns <-> TestCaseRecord
                  artifact -> Markdown reader + the validation shared with
                              the CSV (buildRecord)
                  store -> THE entry point: loadTestCases (CSV), render
                           Markdown, sync check, ID write-back, migration
                  regeneration -> what a revision must preserve, and
                                  which cases it changed; behind
                                  `testcases:check`
src/automation/   Playwright framework. METHOD — project-agnostic, no ADO knowledge.
                  config -> env guard + handle resolution; the ONLY automation
                            module reading process.env (invariant 7)
                  fixtures -> the `test` every spec imports: appEnv, account(H),
                              dataValue(H), redactErrorContext (auto — runs
                              every error through the sanitizer), endSessions
                              (auto — logs out every session the test opened,
                              passed or failed; §7.1.3)
                  sessions -> registry of open sessions per test page; the
                              login Page Object registers (token captured
                              from the app's requests), switch + teardown end
                              them through the project's logout API
                  sanitizer -> THE one credential sanitizer for Playwright
                               text: redact(), fill("…") args, ARIA values
                  scope -> Need Automation=Yes AND Approved/Published; plan and
                           spec paths by Module
                  traceability -> testCaseDetails(): @TC/@US tags, annotations
                  artifact-policy -> screenshots on failure only; video for
                                     every test (§7.2.1); no trace, no
                                     Playwright HTML report; reporter +
                                     report locations
                  code-safety -> rules every automation/ file must satisfy
                  global-setup -> refuses a run before any browser starts
                  runner -> starts the pinned local Playwright CLI
                  reporting/ -> the QA execution report (§7.2):
                      reporter -> Playwright reporter; collects, then writes
                      build -> raw results + Test Case artifact -> report
                      classify -> automatic, provisional §9 classification
                      generator -> standalone HTML + Bug Candidate Markdown
                      not-automated -> in-scope cases with no spec
                      writer -> append-only RUN-<NNN> directory
                  artifact-check/ -> the offline leak check: spec, config, and
                                     a synthetic ARTIFACT-CHECK project the
                                     report traces to
src/reporting/    Presentation shared by the two QA reports — no data model.
                  html -> stylesheet, badges, step table, evidence gallery,
                          page shell
                  report-files -> automation-report.html vs manual-report.html,
                                  and the guard refusing the other's run dir
                  bug-report -> the "Bug Report" section both reports render
                                from their own run's Bug Candidates; status and
                                resolution vocabulary (§10.6)
src/execution/    MANUAL run reporting and run policy (§10.4, §10.5). No
                  automation dependency.
                  run-policy -> continue or stop after each case: a product bug
                                never stops; only the four stop conditions do
                  manual-results -> execution-results.json schema + strict
                                    validation; derived totals and verdict
                  manual-report -> renders and writes manual-report.html only
src/text/         Content conversion with no ADO knowledge (HTML <-> Markdown).
src/cli/          Human-facing entry points.
automation/<KEY>/<Module>/
                  PROJECT automation code — it names one app's pages.
                  <Module> may be <Module>/<Sub-Module> when the profile
                  declares one (product-decisions §7.1.2), e.g.
                  automation/NBO/Company/Operating-Country/.
                      pages/<Feature>Page.ts      locators + actions; no
                                                  assertions, data or credentials
                      tests/TC-<story>-NNN.spec.ts ONE Test Case per spec
                      support/<name>.ts           shared run-time data + setup
                                                  flows; actions only, no
                                                  assertion, no credential
.artifacts/reports/<KEY>/RUN-<nnn>/
                  HTML execution report per automated run. GITIGNORED,
                  append-only. automation-report.html, execution-results.json,
                  bug-candidates/BUG-NNN.md (local Drafts until a human
                  resolves them — never published automatically),
                  attachments/ (<TC-ID>.png failure
                  screenshots, <TC-ID>.webm videos of every test).
tests/            node --test suites. Golden fixtures in tests/fixtures/.
                  artifact.test.ts       Markdown reader + shared validation
                  csv.test.ts            RFC 4180 codec: quotes, commas,
                                         multiline, BOM, refusals
                  test-case-store.test.ts CSV-first contract: CSV wins,
                                         render never writes the CSV, human
                                         edits survive, write-back, migration,
                                         consumers read the CSV, every real
                                         story has both files in sync
                  bug.test.ts            the three DISJOINT Bug builders
                  active-project.test.ts resolution, refusal-to-guess, scoping
                  profile-drift.test.ts  every handle a Test Case uses must be
                                         declared in its project's profile.
                                         Project-agnostic; never invents a
                                         handle, reports the gap instead.
                  regeneration.test.ts   IDs, ADO IDs, human statuses and Need
                                         Automation survive regeneration, each
                                         checked independently
                  automation-config.test.ts      env guard, PROD block, handle
                                                 convention, redaction
                  automation-reporting.test.ts   report statuses, steps, Bug
                                                 Candidates, attachments, video
                                                 gating, no credential rendered
                  automation-scope.test.ts       selection, Module layout,
                                                 traceability
                  api-spec.test.ts               OpenAPI / Swagger / Postman
                                                 reading; no value ever emitted
                  analysis-sources.test.ts       the four source combinations,
                                                 never blocking, UI decision,
                                                 provenance, golden fingerprint
                  analyze-story-skill.test.ts    Skill contract: granted tools,
                                                 stated rules, read-only code
                  automation-code-safety.test.ts code rules + scan of every
                                                 file under automation/
                  automation-sessions.test.ts    logout API contract (allSessions
                                                 false, own token), pass, failure,
                                                 switch, isolation, refused logout,
                                                 token still valid afterwards
                  bug-report.test.ts             the Bug Report section of BOTH
                                                 reports: own-run data only,
                                                 every field, dispositions,
                                                 empty state, escaping, links,
                                                 totals unchanged by resolution

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
                                                fingerprint + attachment sha256,
                                                plus API source (type, path,
                                                sha256) and UI exploration
                                                (label + host, or why not).
                                                Opens with a Source Coverage
                                                table. API specs are NEVER
                                                copied here — path + hash only.
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
                      test-cases.csv            THE SOURCE OF TRUTH for test-
                                                case content (§6.4): one row per
                                                case. Humans review and edit it;
                                                every consumer reads it. Test
                                                Case IDs, human-set statuses,
                                                published Azure DevOps IDs, Need
                                                Automation values and human edits
                                                survive every revision.
                      test-cases.md             Rendering of the CSV inside the
                                                generated-block markers, plus
                                                narrative: provenance +
                                                fingerprint, test data handles,
                                                coverage map, deliberate
                                                exclusions, AI self-review.
                                                Re-render, never hand-edit cases.
                      test-cases.previous.csv   Pre-revision snapshot.
                                                GITIGNORED; removed by a clean
                                                `testcases:check`.
                  automation/<Module>[/<Sub-Module>]/
                      automation-plan.md        One plan per MODULE (not per
                                                story): every in-scope case with
                                                its Test Case ID, User Story, ADO
                                                ID, spec path and Automation
                                                Status. Rows are never removed.
                  executions/US-<id>/RUN-<nnn>/
                      execution-results.json    Structured record of the run —
                                                the only input of the report.
                                                Totals derived, never stored.
                      manual-report.html        The MANUAL HTML report (§10.4),
                                                rendered by `execution:report`.
                                                Never automation-report.html.
                      execution-results.md      One manual execution run:
                                                provenance (environment label AND
                                                target host verbatim), per-case
                                                status, step-level Expected vs
                                                Actual, failure classification.
                                                Never modifies test-cases.csv
                                                or test-cases.md.
                      evidence/                 Screenshots. GITIGNORED — local
                                                only, never committed. Rendered
                                                screenshots only; never
                                                accessibility snapshots, which
                                                leak passwords.
                      bug-candidates/           Local Bug Candidates, status Draft,
                                                awaiting human review. NEVER
                                                auto-published to Azure DevOps.
                                                A human may resolve one as
                                                Confirmed or Not a Bug: the
                                                file keeps its original content
                                                under a Resolution section
                                                (§10.6).
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

**Every Test Case carries `Need Automation`: `Yes` or `No`**
(`docs/product-decisions.md` §6.3). The agent writes a recommendation weighing
feasibility, determinism, regression value and maintainability; the human may
change it, and **the value after human review decides automation scope.** It is
independent of the status: `Yes` is not approval, and approval is not `Yes`. A
recorded value is never overwritten by regeneration, whoever set it. A case with
no row (a legacy artifact) is *undecided*, never an implicit `Yes`.

**Requirement analysis artifacts tag every statement** `[E]` explicit (with a
requirement reference), `[D]` confirmed human decision (with a decision ID),
`[API]` what an API specification says (with the operation), `[UI]` observed
current behaviour (with the page), `[I]` QA inference, or `[?]` open question. Do
not blur these — an inference or an observation promoted to a requirement becomes a
false bug report later, and a decision demoted to an inference gets silently
re-litigated. `[API]` and `[UI]` are evidence, never requirements: where they
disagree with `[E]`/`[D]`, every side is recorded and an open question raised.

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
  -> update README.md when the change alters what a newcomer is told
  -> validate
  -> continue the requested task
```

Five surfaces are in scope: **`.claude/skills/**/SKILL.md`**, **`CLAUDE.md`**,
**`docs/product-decisions.md`**, **`docs/projects/<KEY>/`**, and **`README.md`**.

**`README.md` is a documentation surface like any other.** It is the repository's
front door — the first thing a newcomer reads — and it drifts precisely because it
was left off this list while `CLAUDE.md` moved on. When a change alters a
capability, a command, or the layout a newcomer is shown, the README is updated in
the same task.

**Route the update to the right layer.** A rule goes to the method layer; a fact
about one client goes to that project's directory. Putting a project fact in
`CLAUDE.md` is how the two got fused in the first place.

**Never** report that documentation is stale instead of fixing it, defer an update,
wait to be asked, or leave a known inconsistency behind. **Do not ask permission**
to perform these updates — they are maintenance.

**A task is NOT complete if** an affected Skill is stale, CLAUDE.md is stale,
README.md is stale, a durable decision is unrecorded, a project profile contradicts
what the code does, a Skill still names a changed CLI interface, or documentation
still points at a moved path.

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
