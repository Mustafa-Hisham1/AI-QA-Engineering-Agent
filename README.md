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

> This file is a short entry point. **`CLAUDE.md` is the source of truth for how the
> agent works** — it is maintained as part of every change, and this README
> deliberately does not duplicate it.

---

## Quick start

Requires **Node.js >= 22.18**. There is no build step: Node runs the TypeScript
directly. There are **zero runtime dependencies**.

```bash
cp .env.example .env     # then fill in the values — .env is gitignored
npm install              # dev dependencies only
npx playwright install chromium

npm run ado:check        # read-only Azure DevOps connectivity check
npm test                 # the full suite
npm run typecheck        # tsc --noEmit, strict
```

Dev dependencies are limited to `typescript`, `@types/node`, and `@playwright/test`
pinned to an exact version. Chromium is the only browser installed.

---

## The Skills

Each workflow is a Claude Code Skill in `.claude/skills/<name>/SKILL.md`, invoked as
`/<name> <USER_STORY_ID>`. They are **method** — shared unchanged by every project.

| Skill | Input | Output |
|---|---|---|
| `/analyze-story` | User Story ID (optionally an API spec, or `--ui` to explore the app) | `requirements/US-<ID>/requirement-analysis.md` |
| `/write-test-cases` | An already-analysed story | `test-cases/US-<ID>/test-cases.csv` (source of truth) + rendered `test-cases.md` |
| `/publish-test-cases` | The story's **approved** cases | Azure DevOps child Test Case work items; each new ID recorded back into the CSV |
| `/execute-test-cases` | Approved Web UI cases, an allow-listed environment | A new `executions/US-<ID>/RUN-<NNN>/` with results, evidence, `manual-report.html` |
| `/automate-test-cases` | Cases with Need Automation = `Yes` and `Approved`/`Published` | An Automation Plan per Module, then — only after approval — Playwright specs |
| `/publish-bug` | One human-reviewed Bug Candidate | An Azure DevOps Bug, linked and verified field by field |

**Every Skill resolves the active project first**, and stops to ask rather than
guessing when more than one project exists.

Exact rules for a workflow live in its own `.claude/skills/<name>/SKILL.md`.

---

## Projects

A directory under `docs/projects/` containing a `profile.md` **is** a project. The
profile names that project's environments, test-data handle names, modules,
terminology and title token — **names and variables only, never secret values**.

The active project is resolved in this order:

1. An explicitly supplied key — `--project <KEY>`, or the key a Skill was given.
2. `QA_ACTIVE_PROJECT` in the environment.
3. The sole project, only when exactly one profile exists.

If several projects exist and none is named, the run **stops and asks**. It never
infers the project from a story ID, and never defaults to whichever came first.

**A profile may narrow what the agent does; it may never widen it.** It cannot
enable PROD, waive an approval gate, or relax an evidence or credential rule — every
safety control is defined at the method layer precisely so no project file can turn
it off.

Projects in this repository: **NBO** (active) and **NDC-CORE** (a placeholder whose
fields are all `TBD`).

---

## Safety

| Rule | How it is enforced |
|---|---|
| **PROD is blocked** | Environments are allow-listed by the active project; a profile can add a non-PROD environment but can never unblock PROD. The environment is decided by its explicit label, never inferred from a hostname |
| **Every Azure DevOps write needs human approval immediately beforehand** | Approval recorded earlier never carries forward; it is never batched or inferred |
| **Read and write credentials are structurally separate** | `src/ado/http.ts` exposes GET only; writes live in `src/ado/http-write.ts` behind a write-scoped credential the read path cannot reach |
| **Writes are never retried** | Reads are safely retryable; a blind write retry is how duplicate Test Cases and Bugs get created |
| **Secrets live only in `.env`** | Two modules may read credentials from the environment; every error message passes through `redact()` |
| **Execution never writes to Azure DevOps** | No Test Run, Test Result or Bug. A `PRODUCT_BUG` becomes a local Bug Candidate for human review, and the run continues |
| **Accessibility snapshots are never persisted as evidence** | The accessibility tree returns typed passwords in plain text; rendered screenshots are the safe artifact |
| **Every automated test ends every session it opened** | Through the application's logout API with that session's own token — clearing cookies or storage is **not** a logout, because sessions live server-side |

The full list of non-negotiable invariants and approval gates is in `CLAUDE.md`.

---

## Commands

```bash
npm run ado:check                    # read-only Azure DevOps connectivity check
npm run story:read -- <ID>           # User Story -> Requirement Context
npm run api:read -- <spec.json>      # relevant API operations, names only
npm run analysis:preflight -- <ID> --project <KEY>

npm run testcases:publish -- <ID> --project <KEY>   # DRY RUN by default
npm run testcases:check -- <ID> --project <KEY>     # CSV valid, Markdown in sync
npm run testcases:render -- <ID> --project <KEY>    # re-render the Markdown
npm run testcases:migrate -- <ID> --project <KEY>   # legacy Markdown -> CSV, once
npm run testcases:show -- <ID> [TC-ID …] --project <KEY>

npm run bug:publish -- <input.json>  # DRY RUN by default; one Bug per invocation

npm run automation:scope -- <ID> --project <KEY>    # what is in automation scope
npm run automation:list -- --project <KEY>          # Playwright discovery
npm run automation:test -- --project <KEY>          # run against the allowed env
npm run automation:report -- --project <KEY>        # re-render a run's report
npm run automation:verify-artifacts                 # typed secrets must not leak
npm run execution:report -- <ID> --project <KEY>    # MANUAL run -> manual-report.html

npm test                             # node --test
npm run typecheck                    # tsc --noEmit, strict
```

`--project <KEY>` is required whenever more than one project profile exists;
`QA_ACTIVE_PROJECT=<KEY>` works in place of the flag.

`testcases:publish` and `bug:publish` are **dry run by default** and need
`--confirm` — with explicit human approval immediately beforehand — to write.
`automation:verify-artifacts` must pass before any credentialed automation runs.

---

## Where to read more

| For | Read |
|---|---|
| How the agent works — capabilities, invariants, approval gates, layout | **`CLAUDE.md`** |
| The full decision record, including rejected alternatives | `docs/product-decisions.md` |
| One project's knowledge, engagement state and per-story decisions | `docs/projects/<KEY>/` |
| A workflow's exact rules | `.claude/skills/<name>/SKILL.md` |
| The Bug publisher's input schema | `docs/bug-input.schema.md` |

The repository is private.
