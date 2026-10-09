# AI QA Engineering Agent

An AI-assisted QA lifecycle built around **Azure DevOps User Stories**, run inside
Claude Code. The agent reads a User Story and its specification attachments,
analyses the requirements, generates test cases, publishes the approved ones to
Azure DevOps, executes them against a web application through the Playwright MCP
server, classifies failures, and prepares Bug Candidates for human review. Cases a
human marks **Need Automation = Yes** become deterministic Playwright tests, after a
human-approved Automation Plan.

```
Read User Story + attachments -> requirements analysis -> generate test cases
  -> AI self-review -> human review -> approval -> publish to Azure DevOps
  -> AI web execution -> failure analysis -> bug candidate -> human approval
  -> create bug -> execution report
```

**One agent, many projects.** The same methodology and the same Skills serve every
project. What differs between projects — environments, test-data handles, modules,
terminology — lives in that project's own profile, never in the Skills.

**The human is the approval authority.** The agent never approves its own work, and
every Azure DevOps write requires explicit human approval immediately beforehand.

> This README documents the implementation **as it exists today**. Where a
> capability is partial, that is stated plainly rather than smoothed over — see
> *Current Limitations*.

---

## Table of contents

- [Architecture](#architecture)
- [Repository structure](#repository-structure)
- [Project structure](#project-structure)
- [Active project](#active-project)
- [Project resolution](#project-resolution)
- [The complete workflow](#the-complete-workflow)
- [How Skills stay reusable](#how-skills-stay-reusable)
- [Where things belong](#where-things-belong)
- [Adding a new project](#adding-a-new-project)
- [The safety boundary](#the-safety-boundary)
- [Current project state](#current-project-state)
- [Typical usage](#typical-usage)
- [Commands](#commands)
- [Playwright automation](#playwright-automation)
- [Development](#development)
- [Current limitations](#current-limitations)

---

## Architecture

Three layers, deliberately separated:

| Layer | What it is | Where it lives | Scope |
|---|---|---|---|
| **Method** | *How* the agent works — invariants, approval gates, the PROD block, evidence rules, execution statuses, failure classification, artifact formats | `CLAUDE.md`, `docs/product-decisions.md`, `.claude/skills/**` | **Every** project |
| **Project knowledge** | *What* the agent knows about one project — environments, test-data handles, modules, terminology, title token, engagement state | `docs/projects/<KEY>/` | **One** project |
| **Azure DevOps integration** | The shared, tracker-specific layer: reading stories, publishing Test Cases and Bugs | `src/ado/` | **Every** project |

The rule that keeps them apart:

> **A project profile may narrow what the agent does; it may never widen it.**

A profile can decline an environment the method allows. It **cannot** enable PROD,
waive an approval gate, permit a write the method forbids, or relax an evidence or
credential rule. Every safety control is defined at the method layer precisely so
that no project file can turn it off.

Azure DevOps is the **only** tracker, and `src/ado/` is shared by every project.
There is no tracker abstraction layer, no adapter interface, and no support for any
other tracker. Adding a project does not change anything in `src/`.

---

## Repository structure

```
.
├── CLAUDE.md                       METHOD — how the agent works (session source of truth)
├── README.md                       this file
├── .env                            secrets + environment config (GITIGNORED, human-provided)
├── .env.example                    documents every variable, values empty
├── .mcp.json                       Playwright MCP server configuration (manual execution)
├── playwright.config.ts            the ONE Playwright config (automation); active project only
│
├── .claude/skills/                 METHOD — the reusable workflow Skills
│   ├── analyze-story/SKILL.md
│   ├── write-test-cases/SKILL.md
│   ├── publish-test-cases/SKILL.md
│   ├── execute-test-cases/SKILL.md
│   ├── publish-bug/SKILL.md
│   └── automate-test-cases/SKILL.md
│
├── automation/<KEY>/<Module>/      PROJECT automation code (created by the first approved plan)
│   ├── pages/<Feature>Page.ts
│   └── tests/TC-<story>-NNN.spec.ts
│
├── docs/
│   ├── product-decisions.md        METHOD — the full shared decision record
│   ├── bug-input.schema.md         METHOD — Bug publisher input schema
│   └── projects/                   PROJECT KNOWLEDGE — one directory per project
│       ├── NBO/
│       │   ├── profile.md
│       │   ├── decisions.md
│       │   ├── state.md
│       │   ├── requirements/US-<id>/
│       │   ├── test-cases/US-<id>/
│       │   ├── executions/US-<id>/RUN-<nnn>/
│       │   └── automation/<Module>/automation-plan.md
│       └── NDC-CORE/
│           └── profile.md          placeholder only — see Current project state
│
├── src/
│   ├── ado/                        Azure DevOps integration (shared, all projects)
│   │   ├── config.ts               credentials + env; separate read and write loaders
│   │   ├── http.ts                 GET-only transport, retries
│   │   ├── http-write.ts           POST/PATCH only, NO retries
│   │   ├── client.ts               AdoReadClient
│   │   ├── write-client.ts         AdoWriteClient
│   │   ├── user-story.ts           User Story -> Requirement Context
│   │   ├── test-case.ts            TestCaseRecord -> ADO fields + steps XML
│   │   ├── bug.ts                  BugCandidateRecord -> ADO Bug fields
│   │   ├── fields.ts               the ONLY place System.*/Microsoft.VSTS.* names exist
│   │   └── errors.ts               AdoError + redact()
│   ├── projects/
│   │   └── active-project.ts       active project resolution + project-scoped paths
│   ├── analysis/                   optional analysis sources (read-only)
│   │   ├── api-spec.ts             OpenAPI / Swagger / Postman reader — names, never values
│   │   └── sources.ts              source status, UI decision, provenance, change detection
│   ├── testcases/
│   │   ├── model.ts                TestCaseRecord, status + Need Automation vocabulary
│   │   ├── artifact.ts             strict artifact parser + ID/status write-back
│   │   └── regeneration.ts         what a regeneration must preserve
│   ├── automation/                 Playwright framework (shared, all projects)
│   │   ├── config.ts               env guard + handle resolution; reads process.env
│   │   ├── fixtures.ts             the `test` every spec imports
│   │   ├── sanitizer.ts            the one credential sanitizer for Playwright text
│   │   ├── reporting/              the HTML execution report (reporter, build, classify,
│   │   │                           generator, not-automated, writer, model)
│   │   ├── scope.ts                Need Automation=Yes AND approved; Module paths
│   │   ├── traceability.ts         @TC/@US tags + annotations
│   │   ├── artifact-policy.ts      what Playwright may write to disk
│   │   ├── code-safety.ts          rules every automation/ file must satisfy
│   │   ├── global-setup.ts         refuses a run before any browser starts
│   │   ├── runner.ts               starts the pinned local Playwright
│   │   └── artifact-check/         the offline secret-leak check
│   ├── text/                       HTML <-> Markdown conversion
│   └── cli/                        human-facing entry points
│
└── tests/                          node --test, no framework
    ├── artifact.test.ts            parser + write-back
    ├── bug.test.ts                 the three disjoint Bug builders
    ├── active-project.test.ts      resolution, refusal-to-guess, path scoping
    ├── profile-drift.test.ts       handles used must be declared in the profile
    ├── regeneration.test.ts        regeneration keeps IDs, statuses, Need Automation
    ├── api-spec.test.ts            OpenAPI / Swagger / Postman reading, no value emitted
    ├── analysis-sources.test.ts    source combinations, UI decision, provenance, fingerprint
    ├── analyze-story-skill.test.ts Skill contract: tools, rules, read-only code
    ├── automation-config.test.ts   env guard, PROD block, handle convention
    ├── automation-scope.test.ts    selection, Module layout, traceability
    ├── automation-code-safety.test.ts  code rules + scan of automation/
    ├── automation-reporting.test.ts    HTML report, Bug Candidates, sanitizer
    └── fixtures/valid-artifact.md
```

---

## Project structure

Everything the agent knows about one project, and every artifact it produces for
that project, lives under a single directory keyed by the project:

```
docs/projects/<PROJECT-KEY>/
```

`<PROJECT-KEY>` is a plain directory name — letters, digits, dot, dash, underscore.
No path separators. Current keys: `NBO`, `NDC-CORE`.

| File / directory | Purpose | Required? |
|---|---|---|
| `profile.md` | Tracker, environments, test-data **handle names**, terminology, title token, modules. **This file's presence is what makes a directory a project.** | **Yes** |
| `decisions.md` | Project-level human decisions that span stories | Created when it gains content |
| `state.md` | Engagement state: what is delivered, what is next, open items | Created when it gains content |
| `requirements/US-<id>/` | Requirement analysis, per-story human decisions, verbatim source snapshot | Per story |
| `test-cases/US-<id>/` | The Test Case set for that story | Per story |
| `executions/US-<id>/RUN-<nnn>/` | Execution runs, evidence, Bug Candidates | Per run |

### `profile.md`

Carries a **Settings** table the code can read plus prose the agent reads. Current
settings, as used by both existing profiles:

```
| Setting                  | Value |
| Project Key              | the directory name
| Project Name             |
| Tracker                  | Azure DevOps
| Tracker Project          | (points at ADO_PROJECT in .env — not duplicated here)
| Supported Work Item Type | User Story
| Title Project Token      | the [Project] slot of every generated title
| Allowed Environments     | non-PROD labels this project permits
| Environment Label Variable | e.g. APP_ENV
| Artifact Root            | docs/projects/<KEY>
```

Beyond the table, a profile records allowed environments and their URL **variable
names**, modules in scope, the title convention, test-data **handle names**, and
project terminology.

**A profile names handles and variable names only — never values.** Credentials and
URLs live in `.env`. `tests/profile-drift.test.ts` fails the build if a profile
appears to assign a credential value.

### `requirements/US-<id>/`

```
requirement-analysis.md   Agent-generated; regenerable. Tags every statement
                          [E] explicit · [D] decision · [I] inference · [?] open question.
decisions.md              Confirmed HUMAN decisions. Human authority — outranks the
                          agent's reading and SURVIVES regeneration of the analysis.
                          The agent may cite it, never add to it.
source/                   Verbatim snapshot of the .md attachment(s).
```

**Analysis sources** (`docs/product-decisions.md` §14.1). The **User Story and its
attachments are required** and remain the source of truth. Two sources are optional
and never block an analysis:

- **API specification** — `/analyze-story <ID> --api <spec.json>`: OpenAPI 3,
  Swagger 2 or Postman Collection (JSON). Statements from it are tagged **[API]**.
  The file is **not** copied into `source/` — Postman collections often hold tokens —
  so the analysis records its path and sha256 instead.
- **UI exploration** — `--ui` (and `--ui-account <HANDLE>` to log in): read-only
  exploration through Playwright MCP on the allowed non-PROD environment.
  Observations are tagged **[UI]** — current behaviour, never a requirement.

The analysis opens with a **Source Coverage** table (User Story · Markdown
Attachments · API Specification · UI Exploration). An absent source reads
`Not provided` / `Not performed — <reason>`. Where API or UI disagrees with the
story or a decision, every side is recorded and an open question raised.
`npm run analysis:preflight` reports whether the story or the API specification
changed since the last analysis.

### `test-cases/US-<id>/test-cases.md`

The Test Case set: provenance and fingerprint, test-data handles, coverage map,
deliberate exclusions, the cases, rejected cases, and the AI self-review record.
Regenerable — but Test Case IDs, human-set statuses, published Azure DevOps IDs and
Need Automation values survive regeneration. Test Case IDs are `TC-<storyId>-NNN`
and are never reused.

**Need Automation (automation Phase 1).** Every case's metadata table carries a
`| Need Automation | Yes |` (or `No`) row:

- `/write-test-cases` writes it as an **AI recommendation**, weighing feasibility,
  reliability/determinism, regression value and maintainability. The reason for
  each case is in the AI self-review record.
- **The human may change any value** in this file. The value after human review
  is the source of truth for future automation scope: `Yes` is in, `No` is out.
- It is **independent of Review/Lifecycle Status**. `Yes` is not approval, and
  approving a case does not make it `Yes`.
- **A recorded value is never overwritten by regeneration**, whoever set it.
  `npm run testcases:check` enforces this.
- It stays local and is not published to Azure DevOps.
- A case without the row (an artifact generated before the field existed) is
  *undecided*, never an implicit `Yes`.

Nothing is automated yet; this phase only records the decision. Full rules:
`docs/product-decisions.md` §6.3.

### `executions/US-<id>/RUN-<nnn>/`

```
execution-results.md   Per-case status, step-level Expected vs Actual, failure
                       classification, environment label AND target host verbatim.
                       Never modifies test-cases.md.
evidence/              Screenshots. GITIGNORED — local only.
bug-candidates/        Local Bug Candidates awaiting human review. NEVER auto-published.
```

**Runs are append-only.** A re-execution after a fix is a new `RUN-<NNN>`, never an
overwrite — run history is what makes a flaky result visible. `RUN-000` is reserved
for non-execution artifacts and carries no `execution-results.md`.

---

## Active project

Because several projects live in one repository, **every command and every Skill
establishes which project it is acting on before reading or writing anything.**

Source of truth: [`src/projects/active-project.ts`](src/projects/active-project.ts),
function `resolveActiveProject()`.

### Resolution mechanisms and precedence

Most explicit first. The **first** mechanism that yields a key wins:

| # | Mechanism | How it is supplied | `source` reported |
|---|---|---|---|
| 1 | **Explicit key** | `--project <KEY>` on the command line, or the key a Skill was given in the request | `explicit` |
| 2 | **Environment variable** | `QA_ACTIVE_PROJECT=<KEY>` (in `.env` or the shell) | `environment` |
| 3 | **Sole project** | Used **only** when exactly one directory under `docs/projects/` contains a `profile.md` | `sole-project` |

An explicit key **overrides** `QA_ACTIVE_PROJECT`. The sole-project fallback applies
only when there is genuinely nothing to disambiguate — it is self-limiting, and turns
into an error the moment a second profile appears.

A directory counts as a project **only if it contains `profile.md`**. A directory
without one is invisible to resolution (`listProjectKeys()`).

### What happens when the project is ambiguous

Several projects exist and none was named → the run **stops**. Actual output:

```
Active project problem: The active project is ambiguous and must be stated explicitly.
  Available projects: NBO, NDC-CORE

  Pass --project <KEY>, or set QA_ACTIVE_PROJECT=<KEY>.
  The project is never inferred from a story ID or from file contents.
```

Nothing is read, nothing is written, no Azure DevOps call is made. In a Skill, the
agent asks the human which project the request belongs to and waits.

### What happens with an invalid or non-existent project

A named project with no `profile.md` is an **error**, never a fallback to another
project:

```
Active project problem: Project "NOPE" has no profile.
  Expected: docs/projects/NOPE/profile.md
  Available projects: NBO, NDC-CORE
```

A malformed key is rejected before it touches the filesystem — this is what stops a
supplied key from escaping the projects root:

```
Active project problem: "a/b" is not a valid project key.
  A project key is a directory name under docs/projects, such as NBO or NDC-CORE.
  Letters, digits, dot, dash and underscore only — no path separators.
```

### The agent must never silently assume a project

**Never assume NBO** — or any other project — merely because it exists, came first,
or is the one with the most artifacts. Specifically forbidden:

- Inferring the project from a **story ID**. Story IDs are unique per Azure DevOps
  project, **not globally**, so an ID is not evidence of ownership.
- Searching every project for a matching file and using whichever turned up.
- Defaulting to whichever project is alphabetically first or was onboarded first.

A wrong guess is silent in both directions: it runs an execution against the wrong
application, or publishes one project's Test Cases onto another project's board.
Being asked once is far cheaper than either.

### Examples

```bash
# Explicit — always unambiguous
npm run testcases:publish -- 53717 --project NBO

# Environment variable
QA_ACTIVE_PROJECT=NBO npm run testcases:publish -- 53717

# Ambiguous — both NBO and NDC-CORE exist, neither named → STOPS and asks
npm run testcases:publish -- 53717
```

With both projects present, artifact paths never collide — the same story number in
two projects resolves to two different files:

```
NBO       -> docs/projects/NBO/test-cases/US-53717/test-cases.md
NDC-CORE  -> docs/projects/NDC-CORE/test-cases/US-53717/test-cases.md
```

---

## Project resolution

The single rule, stated once:

> **Project context is explicit. Ambiguity results in a question, never a guess.**

```
                    ┌──────────────────────────────┐
                    │  Was a key stated explicitly? │
                    │  (--project, or in the ask)   │
                    └──────────────┬───────────────┘
                          yes      │      no
                   ┌───────────────┘       └───────────────┐
                   ▼                                       ▼
          validate the key                      ┌───────────────────────┐
          profile exists?                       │ QA_ACTIVE_PROJECT set? │
           yes → USE IT                         └───────────┬───────────┘
           no  → ERROR, list choices                 yes    │    no
                                              ┌─────────────┘     └──────────────┐
                                              ▼                                  ▼
                                     validate + USE IT            ┌──────────────────────────┐
                                                                  │ How many profiles exist?  │
                                                                  └────────────┬─────────────┘
                                                        exactly 1 │      0     │      2+
                                                    ┌─────────────┘     ┌──────┘      └──────┐
                                                    ▼                   ▼                    ▼
                                                USE IT               ERROR            STOP AND ASK
                                            (sole-project)      (nothing to do)    (never pick one)
```

---

## The complete workflow

```
User request
   ↓
Resolve Active Project
   ↓
Load docs/projects/<KEY>/profile.md
   ↓
Load relevant project-specific knowledge
   ↓
Execute the shared Skill
   ↓
Read/write project-scoped artifacts
   ↓
Use the existing Azure DevOps integration when required
```

**1. User request.** A human invokes a Skill (`/analyze-story 53717`) or runs a CLI
command. The request may name a project; it may not.

**2. Resolve Active Project.** Step 0 of every Skill, and the first action of
`publish-test-cases`, before anything is read or written. Precedence as above.
Ambiguity stops the run. In code this is `resolveActiveProject()`, which throws
`ProjectError`; a Skill asks the human.

**3. Load `profile.md`.** The resolved project's profile is read, and every
project-specific value is taken from it: allowed environments and their URL variable
names, the environment label variable, test-data handle names, the title project
token, modules, terminology. A value marked `TBD` is **not configured** — the Skill
stops and asks rather than substituting another project's value.

**4. Load relevant project knowledge.** Depending on the Skill: `decisions.md` for
project-level human decisions, `requirements/US-<id>/decisions.md` for per-story
decisions (human authority, outranks the analysis), the requirement analysis, and the
verbatim `source/` snapshot.

**5. Execute the shared Skill.** The same Skill file for every project. It carries
methodology only — the rules, the gates, the classification vocabulary — and takes
project values from the profile loaded in step 3.

**6. Read/write project-scoped artifacts.** All artifacts resolve under
`docs/projects/<KEY>/`. In code the path helpers are `requirementsDirFor()`,
`testCasesPathFor()` and `executionsDirFor()`, plus `artifactPathFor(projectRoot,
storyId)`. Two projects can never resolve to the same file.

**7. Use the Azure DevOps integration when required.** Only when the workflow
genuinely needs the tracker:

- **Reads** (`analyze-story`, `publish-test-cases`) go through `AdoReadClient` on the
  GET-only transport.
- **Writes** (`publish-test-cases`, `publish-bug`) go through `AdoWriteClient` on a
  separate POST/PATCH transport with a separate write-scoped credential, and require
  explicit human approval immediately beforehand.
- `write-test-cases` **does not read Azure DevOps at all.**
- **Execution never writes to Azure DevOps** — no Test Run, no Test Result, no Bug.

---

## How Skills stay reusable

There are **six Skills, shared by every project.** There is no NBO Skill and no
NDC-CORE Skill, and there must never be — duplicating a Skill per project is how the
method silently forks and two projects end up with different definitions of `FAIL`.

| Skill | Does | Never does |
|---|---|---|
| `/analyze-story <ID> [--api <spec>] [--ui]` | Reads the story + `.md` attachments — optionally an API spec (OpenAPI/Swagger/Postman) and the live UI — and writes the Requirement Analysis | Generate test cases · write to ADO · let a missing optional source block · treat API/UI evidence as a requirement · commit |
| `/write-test-cases <ID>` | Generates Test Cases from the local analysis, recommends Need Automation per case, AI self-reviews | Read ADO · publish · approve · automate · overwrite a recorded Need Automation value · commit |
| `/publish-test-cases <ID>` | Publishes **approved** cases as child Test Case work items, records ADO IDs | Publish anything not `Approved` · retry a write · commit |
| `/execute-test-cases <ID> [TC-ID…]` | Executes approved Web UI cases via Playwright MCP, records results + evidence | Write to ADO · modify a Test Case · invent an Expected Result · commit |
| `/automate-test-cases <ID> [TC-ID…]` | Plans, then (after plan approval) generates Playwright for approved cases with Need Automation = Yes, by Module | Change a Test Case or Need Automation · generate code before plan approval · write to ADO · create a Bug · commit |
| `/publish-bug <candidate>` | Publishes **one** reviewed Bug Candidate, then verifies it field by field | Publish anything not `PRODUCT_BUG` · retry a write · commit |

What makes them reusable:

- **A Skill contains methodology, not project knowledge.** Rules, gates, statuses,
  classification, artifact formats — all portable.
- **Project-specific values are resolved from the profile at run time**, never
  hardcoded. A Skill refers to "the test-data handle names this project defines",
  not to any particular handle.
- **Every Skill starts with Step 0: resolve the active project**, and stops if it is
  ambiguous.
- **Placeholders, not examples from one client.** Shared documentation uses
  `[{PROJECT}][{MODULE}][{FEATURE}]` and `<KEY>`.

If a Skill would need a project-specific fact to work, that fact belongs in the
profile and the Skill should read it there.

---

## Where things belong

| Location | Contains | Never contains |
|---|---|---|
| `CLAUDE.md` | The method: invariants, approval gates, capabilities, conventions, layout. The session source of truth for *how* the agent works. | Any fact about one project |
| `.claude/skills/` | The six reusable workflow Skills. Methodology only. | Project handles, hosts, modules, terminology |
| `docs/product-decisions.md` | The full shared decision record with reasoning, plus rejected alternatives. | Instance facts (those are pointed at, in the project's own files) |
| `docs/projects/<KEY>/` | Everything about one project: profile, decisions, state, and all its artifacts | Rules that should apply to every project · credential values |
| `src/projects/` | Active project resolution and project-scoped path helpers. No Azure DevOps knowledge; reads no secrets. | Tracker logic |
| `src/ado/` | The entire Azure DevOps integration — the **only** place `System.*` and `Microsoft.VSTS.*` field names exist. Shared by every project. | Project-specific values |

Two checkable boundaries:

```bash
# ADO field names appear only inside src/ado/
grep -rn "Microsoft.VSTS\|System\." src --include=*.ts

# process.env is read only by src/ado/config.ts and src/automation/config.ts,
# plus the one non-secret project key in src/projects/active-project.ts
grep -rln "process\.env" src automation playwright.config.ts --include=*.ts
```

---

## Adding a new project

Nothing in `src/` changes to add a project.

**1. Create the profile.**

```bash
mkdir -p docs/projects/<KEY>
$EDITOR docs/projects/<KEY>/profile.md
```

The profile must carry the Settings table (Project Key, Project Name, Tracker,
Supported Work Item Type, Title Project Token, Allowed Environments, Environment
Label Variable, Artifact Root) plus:

- **Allowed environments** and the **variable name** holding each target URL.
  Non-PROD only — PROD cannot be allow-listed by a profile.
- **Test-data handle names** — names only, never values.
- **Modules in scope**, **terminology**, and the **title project token**.

`profile.md` is what makes the directory a project. Until it exists, resolution does
not see the directory at all.

**2. Add the project's `.env` variables.** Values live only in `.env` (gitignored).
`.env.example` documents variable names with empty placeholders.

**3. Create `decisions.md` and `state.md` when they gain content.** Not up front —
do not scaffold empty files.

**4. Run commands with the project named.**

```bash
npm run testcases:publish -- <ID> --project <KEY>
# or
QA_ACTIVE_PROJECT=<KEY> npm run testcases:publish -- <ID>
```

**Do not copy another project's handles, hosts, or decisions.** They name that
project's systems; reusing one would point the agent at the wrong environment.

**What must NOT change:** the Skills, `CLAUDE.md`, `docs/product-decisions.md`, and
`src/ado/`. If onboarding seems to require editing a Skill, that is a signal a
project fact has leaked into the method layer — put the fact in the profile instead.
Change a Skill only when the **method itself** is genuinely wrong for every project.

### Manual steps and limitations

- The profile is **hand-written**. There is no scaffolding command and no template
  generator.
- `ADO_PROJECT` in `.env` is **global**, so one `.env` serves one Azure DevOps
  project at a time. Running two projects that live in different Azure DevOps
  projects requires switching `.env` between runs. See *Current limitations*.
- Only `testcases:publish` accepts `--project` today. See *Current limitations*.

---

## The safety boundary

Two categories, and the line between them is not negotiable.

### Global — cannot be overridden by any project profile

A profile **cannot** enable, relax, waive, or reconfigure any of these:

| Control | Rule |
|---|---|
| **PROD protection** | PROD is blocked by default. A profile may add an allowed **non-PROD** environment; it can **never** unblock PROD. Any PROD execution or write requires explicit human confirmation, and `execute-test-cases` refuses PROD outright — no exception, no flag, no override. |
| **Human approval gates** | Every Azure DevOps write requires explicit human approval **immediately before the write**. Approval given earlier does not carry forward. The agent never approves its own work — only an explicit human statement makes something approved. |
| **Read/write PAT separation** | Structural, not conventional. `src/ado/http.ts` is GET-only; writes live in `src/ado/http-write.ts` behind a separate write-scoped credential (`ADO_PAT_WRITE`) that `AdoConfig` never holds. The read path cannot reach the write credential. |
| **Credential and secret rules** | Secrets never leave `.env`. Only `src/ado/config.ts` (tracker) and `src/automation/config.ts` (application under test) may read a credential from the environment. Every error passes through `redact()`. Profiles name handles and variable names only — never values. |
| **Evidence security** | Accessibility snapshots are **never** persisted as evidence — the Playwright accessibility tree returns typed passwords in plain text even when the UI masks them. Rendered screenshots only, and only when they expose no secret. `evidence/` is gitignored. |
| **No retried writes** | Reads are safely retryable; writes are not. Blind-retrying a write is how duplicate Test Cases and Bugs get created. |
| **Execution never writes to ADO** | No Test Run, no Test Result, no Bug. A `PRODUCT_BUG` becomes a local Bug Candidate that stops for human review. |
| **Explicit active project** | Never guess which project a request belongs to when more than one exists. |

### Project-specific — varies per project, set in the profile

- Which **non-PROD** environments are allowed, and the variable holding each URL
- The **environment label variable** the allow-list is checked against
- **Test-data handle names**
- **Modules** in scope and project **terminology**
- The **title project token**
- Project-level and per-story **human decisions**

The asymmetry is deliberate: a profile can only ever make the agent do **less**.

---

## Current project state

### NBO — active

Fully onboarded and in use. Carries `profile.md`, `decisions.md`, `state.md`, and
artifacts for two User Stories (requirement analyses, test cases, execution runs and
Bug Candidates). Its profile declares STG as the only allowed environment, an
`APP_ENV` label variable, its modules, and its test-data handle names.

Per-story progress, open questions and engagement state live in
`docs/projects/NBO/state.md` — not in this README, and not in `CLAUDE.md`.

### NDC-CORE — placeholder only

**NDC-CORE is a placeholder. It is not configured and cannot be used yet.**

The directory contains **only `profile.md`** — no `decisions.md`, no `state.md`, no
requirements, no test cases, no executions. Its profile is marked
`STATUS: PLACEHOLDER — NOT CONFIGURED` and holds **`TBD` in every project-specific
field**: Project Name, Tracker Project, Title Project Token, modules, terminology,
and test-data handles. `Allowed Environments` reads **None configured**.

No NDC-CORE fact has been confirmed by a human, and none has been inferred or copied
from NBO. **The agent must not execute, publish, or generate test cases for NDC-CORE
until a human fills these in**; a Skill that needs a `TBD` value stops and asks.

The placeholder exists so the multi-project structure is real and exercised — with
two profiles present, resolution genuinely refuses to guess, and that refusal is
under test.

---

## Typical usage

Skills are invoked in Claude Code; `npm` scripts run in a terminal.

### Naming the project explicitly

```
/analyze-story 53717 --project NBO
```
```
Analyze User Story 53717 for NBO
```

### When the project is ambiguous

```
> /analyze-story 53717

Two projects exist in this repository — NBO and NDC-CORE — and the request does
not say which one User Story 53717 belongs to. Story IDs are unique per Azure
DevOps project, not globally, so I cannot infer it from the ID.

Which project should I analyse this story for?
```

The agent asks rather than picking. That is the intended behaviour, not a failure.

### Setting the project for a session

```bash
export QA_ACTIVE_PROJECT=NBO      # or set it in .env
```
```
/write-test-cases 53717
```

### A full story, end to end

```
/analyze-story 53717 --project NBO          # read + analyse; writes local files only
/write-test-cases 53717 --project NBO       # generate + AI self-review; no ADO access
                                            # → HUMAN REVIEW: mark cases Approved
/publish-test-cases 53717 --project NBO     # dry run, then approve, then create
/execute-test-cases 53717 --project NBO     # run against an allow-listed environment
                                            # → HUMAN REVIEW of any Bug Candidate
/publish-bug docs/projects/NBO/executions/US-53717/RUN-002/bug-candidates/BUG-CANDIDATE-001.md
```

Every arrow marked **HUMAN REVIEW** is a hard stop. The agent will not cross it on
its own.

### Narrowing an execution

```
/execute-test-cases 53717 TC-53717-002 TC-53717-006 --project NBO
```

---

## Commands

```bash
npm run ado:check                                  # read-only connectivity check
npm run ado:check -- --json

npm run story:read -- <ID>                         # User Story -> Requirement Context
npm run story:read -- <ID> --summary               # metadata + attachment list only
npm run story:read -- <ID> --json
npm run story:read -- <ID> --save-source <dir>     # save .md attachments verbatim

npm run analysis:preflight -- <ID> --project <KEY> [--api <path>] [--ui] [--ui-account <HANDLE>] [--fingerprint <sha256>]
                                                   # optional analysis sources: status, changes, provenance rows
npm run api:read -- <spec.json> [--match <term>]... # relevant API operations — names only, never values

npm run testcases:publish -- <ID> --project <KEY>            # DRY RUN (default)
npm run testcases:publish -- <ID> --project <KEY> --confirm  # writes; needs approval first
npm run testcases:publish -- <ID> --project <KEY> --verify   # verify only, writes nothing
npm run testcases:publish -- <ID> --project <KEY> --confirm --limit 1   # canary

npm run testcases:check -- <ID> --project <KEY> --snapshot   # before regenerating: save the artifact
npm run testcases:check -- <ID> --project <KEY>              # after: nothing lost, Need Automation on every case

npm run bug:publish -- <input.json>                    # DRY RUN + story-scoped duplicate check
npm run bug:publish -- <input.json> --confirm          # publishes, then verifies
npm run bug:publish -- <input.json> --verify-only <id> # re-verify, writes nothing

npm run automation:scope -- <ID> --project <KEY>             # cases in automation scope, by Module
npm run automation:list -- --project <KEY> [--grep @TC-<id>] # Playwright discovery; no environment
npm run automation:test -- --project <KEY> [--grep @TC-<id>] # run against the allowed environment + HTML report
npm run automation:report -- --project <KEY> [--run RUN-<NNN>] # find / re-render a run's HTML report
npm run automation:verify-artifacts                           # typed secrets must not reach any output or the report

npm test                                           # node --test
npm run typecheck                                  # tsc --noEmit, strict
```

`testcases:publish` and `bug:publish` are **dry run by default**. `--confirm`
requires explicit human approval immediately beforehand. `bug:publish` publishes
**one** Bug per invocation — there is no batch mode, because a loop is how duplicate
Bugs get created. Exit code **3** means `PUBLISH_VERIFICATION_FAILED`: the Bug
**exists** and must be fixed by hand, never by re-running.

`testcases:check` reads and writes local files only. It exits **1** when a
regeneration lost a Test Case ID, an Azure DevOps ID, a human-set status or a
Need Automation value, or when any case has no Need Automation value. A failed
check keeps the gitignored `test-cases.previous.md` snapshot so the lost values
can be restored; a clean check removes it.

---

## Playwright automation

Deterministic Playwright is the regression oracle; the MCP-driven
`/execute-test-cases` is the bug-finding tool. They are different jobs and stay
separate. Full rules: `docs/product-decisions.md` §7.1.

**What gets automated.** `npm run automation:scope` selects, by code: **Need
Automation = `Yes` AND status `Approved`/`Published`.** `No` is never automated, a
missing value is *undecided* (never treated as `Yes`), and an unapproved `Yes` is
refused. Every exclusion is listed with its reason.

**The gate.** `/automate-test-cases` writes an **Automation Plan per Module** and
stops. Code is generated only after the human explicitly approves that plan in the
session. A `Yes` case that cannot be automated is recorded as
`NOT AUTOMATED — <CATEGORY>` (missing stable locator, test data unavailable,
auth flow unsupported, framework capability missing, environment unavailable) —
its Need Automation stays `Yes`.

**Layout — by Module, not by User Story.**

```
docs/projects/<KEY>/automation/<Module>/automation-plan.md    plan + per-case status
automation/<KEY>/<Module>/pages/<Feature>Page.ts              Page Objects
automation/<KEY>/<Module>/tests/TC-<story>-NNN.spec.ts        one spec per Test Case
```

**Traceability.** Each spec is titled `TC-<story>-NNN — <title>`, tagged
`@TC-<story>-NNN` and `@US-<story>`, and annotated with the Azure DevOps ID:

```bash
npm run automation:list -- --project NBO --grep @TC-53717-006   # which test implements it?
npm run automation:list -- --project NBO --grep @US-53717       # every test for a story
```

**Environment and credentials.** The label (`APP_ENV`) must be on the active
profile's allow-list and is never PROD; the base URL comes from the variable the
profile's `Automation Base URL Variable` names, with `{ENV}` replaced by the label.
An account handle `H` reads `H_USERNAME` / `H_PASSWORD` and a single-value handle
reads `H` — from `.env` only, through `src/automation/config.ts`. Login is a fresh
UI login per test; no session is saved to disk.

**Artifact safety — verified.** On failure, Playwright writes an
`error-context.md` containing an ARIA snapshot of the page, and that snapshot held a
typed password in plain text; a trace holds it too; and a failing `fill()` prints
`fill("<password>")` in its call log. All are suppressed — every error passes one
sanitizer (`src/automation/sanitizer.ts`) before any reporter or file sees it — and
code that would bring them back (ARIA-snapshot assertions, tracing, saved sessions,
`process.env`, bypassing the fixtures) fails `npm test`. **Run
`npm run automation:verify-artifacts` before any credentialed run and after every
Playwright upgrade.** Output lives in the gitignored `.artifacts/`. The check also proves every test — passing and failing — has its video in the report, that every attachment is a genuine PNG/WebM inside the run's `attachments/`, and that the HTML references nothing else.

### The HTML execution report

Every run that executes at least one test writes a standalone QA report — no
script, no external resource — through a Playwright reporter; specs do nothing:

```
.artifacts/reports/<KEY>/RUN-<NNN>/          append-only, gitignored
├── execution-report.html                    open this
├── execution-results.json                   the same data, machine-readable
├── bug-candidates/BUG-NNN.md                local Draft Bug Candidates
└── attachments/
    ├── TC-53717-001.png                     failure screenshot (failures only)
    ├── TC-53717-001.webm                    video — every test, any outcome
    └── TC-53717-002.webm
```

`automation:test` prints its path; `npm run automation:report -- --project <KEY>`
finds the latest run again (or `--run RUN-<NNN>`), re-renders it from its stored
results, and prints a `file://` link to open.

- **Execution Summary** — project, User Stories, Modules, environment label and
  host, start time, duration, and Passed / Failed / Not Run / Not Automated
  totals with a PASS/FAIL verdict, plus a list of failed cases naming the failed
  step and the reason.
- **Test Case Results** — one expandable row per case: Test Case ID, User Story,
  ADO ID, title, status, duration, the Playwright spec, and every step with its
  Expected Result (from the Test Case) and Actual Result. A failure opens on a
  *Why it failed* panel: failed step, Expected, Actual, reason, classification,
  full error. Every case — passed or failed — has an *Attachments* block:
  *View Screenshot* (a clickable preview, failures only) and a playable video
  with a *▶ Play Video* link.
- **Bug Reports** — every failure classified `PRODUCT_BUG` on a traceable case,
  as a local **Draft** Bug Candidate: title, description, steps to reproduce,
  expected and actual result, related Test Case and User Story, classification,
  environment, screenshot and video. **Nothing is created in Azure DevOps.** To publish
  one, a human reviews it and runs `/publish-bug <run>/bug-candidates/BUG-NNN.md`.

`NOT RUN` is a skipped test (for example missing test data — never a FAIL).
`NOT AUTOMATED` is an in-scope case of an executed story with no spec, with the
reason from its Automation Plan. **Classification is automatic and provisional**
(`docs/product-decisions.md` §7.2) — confirm it before acting on it.

**What the report's text never contains:** credentials, `.env` values, traces,
ARIA or page snapshots, `error-context.md`. Attachments are an allow-list —
failure screenshots and test videos only, each copied only if it lies inside
Playwright's output directory and its bytes really are PNG / WebM, so no other
file can be smuggled in as a "video".

**Video (human decision, `docs/product-decisions.md` §7.2.1).** Automated runs
record a video of every test — pass, fail, or not run once started — for the
project testing team. A failed test keeps its video. Videos show the UI exactly
as it ran: **the risk of sensitive STG content in a recording is explicitly
accepted**, and a video is never deleted or blanked for it. They are retained like
all other evidence — local, gitignored, append-only, never committed, never sent
to Azure DevOps. Recording changes nothing about PROD: a run is still refused
unless its label is allowed and not PROD. MCP-driven manual execution still
records no video.

---

## Development

**Requirements:** Node **≥ 22.18** (developed on 24.x). Node runs the `.ts` files
directly — there is no build step.

**Zero runtime dependencies** by design. Node provides TypeScript execution, `.env`
loading, `fetch`, timeouts, and the test runner natively. Dev dependencies are
limited to `typescript`, `@types/node`, and `@playwright/test` pinned to an exact
version (Chromium only).

```bash
cp .env.example .env    # then fill in real values; .env is gitignored
npm install
npx playwright install chromium   # browser for automation only
npm run ado:check       # verify read-only connectivity
npm test                # node --test
npm run typecheck       # tsc --noEmit, strict
```

Run `npm test` and `npm run typecheck` after any change to `src/`.

**Conventions:** strict TypeScript with `erasableSyntaxOnly` (no enums, namespaces,
or constructor parameter properties); relative imports use explicit `.ts` extensions;
Conventional Commits; comments explain *why*, not *what*.

**Test suites:**

| Suite | Covers |
|---|---|
| `artifact.test.ts` | Strict artifact parsing (including Need Automation) and ID/status write-back |
| `regeneration.test.ts` | IDs, Azure DevOps IDs, human-set statuses and Need Automation survive regeneration, each checked independently |
| `api-spec.test.ts` | OpenAPI 3, Swagger 2 and Postman reading — operations, fields, constraints, enums, auth, dependencies — and that no example, header, variable or credential value is ever emitted |
| `analysis-sources.test.ts` | The four source combinations, optional sources never blocking, the UI exploration decision (PROD and unlisted labels refused), provenance round-trip, change detection, the golden story fingerprint |
| `analyze-story-skill.test.ts` | The `/analyze-story` contract: granted tools exclude every write path, the rules its text must keep, and that the analysis code is read-only |
| `bug.test.ts` | The three disjoint Bug builders; Severity written, Priority not |
| `active-project.test.ts` | Resolution precedence, refusal to guess, key validation, path scoping |
| `profile-drift.test.ts` | Every handle a Test Case uses is declared in its project's profile |
| `automation-config.test.ts` | Environment guard (label, allow-list, PROD block, hostname has no authority), handle convention, redaction |
| `automation-scope.test.ts` | Automation selection, Module layout, Test Case traceability |
| `automation-code-safety.test.ts` | The automation code rules, and a scan of every file under `automation/` |
| `automation-reporting.test.ts` | HTML report statuses, steps, failures, Bug Candidates, screenshot and video allow-list (PASS and FAIL videos, path containment, file signatures), the sanitizer, and that no credential is ever rendered |

`profile-drift.test.ts` is project-agnostic: it discovers whatever projects exist and
fails when a Test Case references a handle its profile does not declare. It is
one-directional by design — declared-but-unused is reported, never failed, because a
profile may legitimately describe test data before any case consumes it. **It never
invents a handle to make itself pass**, since only a human knows whether the profile
or the Test Case is the side that is wrong.

---

## Current limitations

Stated plainly rather than smoothed over.

- **Only `testcases:publish` accepts `--project`.** `ado:check`, `story:read` and
  `bug:publish` do not implement the flag, because they do not resolve
  project-scoped artifact paths. `QA_ACTIVE_PROJECT` does not affect them either.
  Skills still resolve the project themselves at Step 0.
- **`.env` is single-tenant.** `ADO_PROJECT`, `APP_ENV` and the URL variables are
  global, so one `.env` serves one project at a time. Running NBO and a second
  project that lives in a different Azure DevOps project requires switching `.env`
  between runs. Per-project variable prefixes are an open decision, not implemented.
- **Skills resolve the project by instruction, not by code.** Step 0 of each SKILL.md
  states the rules; only `publish-test-cases` enforces them in TypeScript.
- **Profile parsing is minimal.** `readProfileSettings()` reads the Settings table
  into a map; the rest of the profile is prose the agent reads. Nothing validates
  that a profile declares every setting a Skill might want.
- **Drift detection is heuristic.** It scans `**Test Data**` blocks for
  backticked `SCREAMING_SNAKE_CASE` tokens. A case that names handles elsewhere
  would not be checked.
- **API specifications: JSON only.** OpenAPI 3, Swagger 2 and Postman v2.x, as JSON. YAML is reported as unusable (no YAML parser — zero dependencies); export it as JSON. External `$ref`s are not fetched. A local path only — no URL.
- **UI exploration is agent-driven.** Whether it may run is decided by code; *how* it explores, and that it stays read-only, rests on the Skill's rules and its granted tools, as with `/execute-test-cases`.
- **V1 reads the `User Story` work item type only.** `Product Backlog Item`, `Epic`,
  `Feature` and `Issue` are not supported.
- **Not built:** Azure DevOps Test Runs, CI/CD and scheduled automation runs,
  publishing Bugs from automation failures (they stay local Drafts), dashboards and
  cross-run trends, self-healing locators, saved login sessions.
- **Report classification is rule-based.** It reads the error text; it cannot
  tell a stale locator from a removed element, so an element-not-found assertion
  becomes a suspected `PRODUCT_BUG` for a human to confirm.
- **Short credentials are not redacted by value.** The shared redaction registry
  ignores values under 8 characters; such a value is still removed from `fill()`
  call logs, but would survive anywhere else it appeared verbatim.
- **Automation is a foundation, not yet a suite.** The framework, scope selection,
  traceability, environment guard and artifact safety are built and tested, but no
  spec exists yet: no case is in scope until a human sets Need Automation values, and
  `/automate-test-cases` has not yet run end to end.
- **One base URL per project.** `Automation Base URL Variable` names one
  application. A project with two web applications (two portals) can automate only
  the configured one; the other's cases are `NOT AUTOMATED — ENVIRONMENT_UNAVAILABLE`.
- **No per-handle variable override.** Handle values follow the `_USERNAME` /
  `_PASSWORD` / bare-name convention only.
- **Artifacts generated before Phase 1 have no Need Automation values.** Their cases
  parse as *undecided*, and they still publish and verify. The next
  `/write-test-cases` run on such a story adds a recommendation to those cases only
  and changes nothing else. Which artifacts are affected is recorded per project in
  `docs/projects/<KEY>/state.md`.
- **Undecided:** whether execution evidence stays gitignored (current behaviour) or
  is committed for traceability. Screenshots may carry internal product data, so the
  safe default stands.
