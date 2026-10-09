---
name: analyze-story
description: Analyze an Azure DevOps User Story with its .md attachments — optionally together with an API specification (OpenAPI/Swagger or Postman Collection) and an exploration of the application UI through Playwright MCP — and persist a Requirement Analysis under docs/projects/<KEY>/requirements/US-<ID>/. Use when asked to analyze, re-analyze, or refresh the requirements of a User Story by ID. Takes the User Story ID, plus optional --api <path>, --ui and --ui-account <HANDLE>.
allowed-tools: Bash(npm run story:read:*), Bash(npm run analysis:preflight:*), Bash(npm run api:read:*), Bash(git diff:*), Bash(git status:*), Read, Write, Edit, Glob, Grep, mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_fill_form, mcp__playwright__browser_press_key, mcp__playwright__browser_select_option, mcp__playwright__browser_hover, mcp__playwright__browser_wait_for, mcp__playwright__browser_navigate_back, mcp__playwright__browser_tabs, mcp__playwright__browser_console_messages, mcp__playwright__browser_network_requests, mcp__playwright__browser_close
---

# Analyze User Story

Produce or update the persistent **Requirement Analysis** for a User Story — the first analysis
and exploration step of the lifecycle. Up to three sources:

| Source | | Weight |
|---|---|---|
| **User Story + its Markdown attachments** | **Required** | **The business source of truth** |
| API specification — OpenAPI / Swagger, or Postman Collection | Optional (`--api <path>`) | Supporting technical evidence |
| Application UI, explored through Playwright MCP | Optional, opt-in (`--ui`) | Observed current behaviour |

**An optional source that is missing or unusable never blocks the analysis.** It is recorded as
`API Source: Not provided` / `UI Exploration: Not performed — <reason>`, and the analysis
proceeds from the User Story — exactly as before.

This skill **reads** Azure DevOps and **writes local analysis files only**. It never modifies
Azure DevOps, never creates Bugs, never generates Test Cases or automation, never commits.

## Step 0 — Resolve the active project, then the arguments

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
terminology, modules, title token, environments, the login flow, handle names. Read
`docs/projects/<KEY>/decisions.md` if it exists.

The arguments are `$ARGUMENTS`:

```
<USER_STORY_ID> [--project <KEY>] [--api <path>] [--ui] [--ui-account <HANDLE>]
```

- `<USER_STORY_ID>` — **required.** If missing, ask and stop. Never guess an ID, never analyse
  the most recently touched story instead.
- `--api <path>` — optional. A local **JSON** file: OpenAPI 3, Swagger 2, or a Postman
  Collection (v2.x). The type is detected from the content, not the name.
- `--ui` — optional. Explore the application UI. **Opt-in: without it, no browser starts.**
- `--ui-account <HANDLE>` — optional, implies `--ui`. Log in with that account handle from the
  profile. Without it, explore unauthenticated pages only.

`/analyze-story <ID> --project <KEY>` with nothing else behaves exactly as it always has, and
records that the optional sources were not provided / not performed.

## Scope boundary

**Do NOT generate Test Cases, automation code, or Bugs. Do NOT publish anything.**
Requirement understanding only. Test case generation is `/write-test-cases`, a separate skill
with a separate human review.

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

**The User Story is the only mandatory source.** A failure here stops the skill; a failure of an
optional source never does.

## Step 2 — Preflight the optional sources

```bash
npm run analysis:preflight -- <ID> --project <KEY> --fingerprint <fingerprint from Step 1> [--api <path>] [--ui] [--ui-account <HANDLE>]
```

Read-only — it writes nothing and starts no browser. It reports:

- **API source** — `OpenAPI` / `Swagger` / `Postman` with version, path, sha256 and operation
  count; or `Not provided`; or `NOT USED — <reason>` (missing file, not JSON, YAML, not a
  specification). An unusable API source is **recorded and skipped**, never fatal.
- **UI exploration** — `PERFORM` with the environment **label** and **host**; or
  `Not performed — <reason>`: not requested, no environment or base URL configured, environment
  not allowed (**PROD is always refused**), credentials unavailable for the handle. The decision
  reuses the automation environment guard, so the allow-list and the PROD block are enforced by
  code, not by this text.
- **Changes against the existing analysis** — `REFRESH` when the story fingerprint changed, or
  when the API specification changed (sha256) or is newly supplied.
- The **provenance rows** and **Source Coverage rows** to write in Step 9. Copy them verbatim.

## Step 3 — Decide whether analysis work is needed

Artifact paths for this story:

```
docs/projects/<KEY>/requirements/US-<ID>/requirement-analysis.md    the analysis (agent-generated)
docs/projects/<KEY>/requirements/US-<ID>/decisions.md               confirmed human decisions (human authority)
docs/projects/<KEY>/requirements/US-<ID>/source/                    verbatim .md attachment snapshot
```

- **No artifact yet** → continue as a first analysis.
- **Preflight reports `REFRESH`** for the story → the requirement changed. Continue as an update:
  preserve the artifact's structure and every confirmed decision, then apply the change.
- **Preflight reports `REFRESH`** for the API specification only → continue, but limit the work to
  the API analysis, its conflicts and the sections they touch.
- **UI exploration was requested and preflight says `PERFORM`** → an explicit request to observe;
  continue, limited to the UI findings and the sections they touch.
- **Nothing changed, nothing new requested** → **do not re-download, do not re-analyse, do not
  rewrite the artifact.** Report "unchanged since <date> at rev <n>", note anything in
  `decisions.md` the analysis has not yet absorbed, and stop — unless the human asks for a
  refresh anyway, or `decisions.md` is newer than the analysis.

The story fingerprint covers requirement content only (title, description, acceptance criteria,
extra fields, attachment hashes). It deliberately ignores `rev`, dates, state and assignment, so a
reassignment or a tag edit does not trigger re-analysis. **Unchanged rule.** An API specification
analysed before but not supplied this time is noted, not a change: keep that API analysis and mark
it *not re-verified this run*. UI exploration is live observation and never triggers a refresh on
its own.

## Step 4 — Read the full content and update the snapshot

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

**The API specification is never copied into the repository.** Postman collections routinely hold
tokens, passwords and hosts in variables, headers, auth blocks and example bodies. The analysis
records the specification's path and sha256 (Step 2) and cites what it says; the file stays where
the human keeps it.

## Step 5 — Load confirmed decisions

Read `docs/projects/<KEY>/requirements/US-<ID>/decisions.md` if it exists. It holds decisions the
human has explicitly confirmed, and it is **human authority**: it outranks your own reading of the
requirement, **the API specification, and the observed UI**, and must survive every regeneration of
the analysis.

- Every decision there is tagged **[D]** in the analysis, never **[I]**.
- A decision **closes** the open questions it answers. Move them out of the open-question
  list and into the rules they affect, citing the decision ID.
- A decision that **conflicts** with the attached specification, with the API specification, with
  the observed UI, or with `docs/product-decisions.md`, is **not** silently reconciled — and
  **never overwritten**: keep the decision, record the conflicting evidence beside it, and raise a
  blocking open question.
- Never add a decision to that file yourself. Only a human statement in a session creates
  one; if the human confirms decisions during this skill, write them there and cite where
  they came from.

## Step 6 — API analysis (only when the preflight says the source is usable)

```bash
npm run api:read -- <path> --match <term> [--match <term> …]
```

Choose the `--match` terms from the story — its module, feature, entity and action words (for a
login story: `login`, `auth`, `token`). Read without `--match` only to find the right terms. The
reader prints names, types and constraints and **never a value** — no example, header value,
variable value or credential — so nothing secret reaches the analysis.

From the relevant operations only, record:

- **OpenAPI / Swagger** — endpoints, methods, paths, path/query/header parameters, request body
  fields (required/optional), response structures, status codes, enums and allowed values,
  validation constraints (length, pattern, range, format), authentication requirements, and
  dependencies between endpoints (links).
- **Postman** — requests (folder / name), methods and URLs, request body fields, header names,
  variables used and provided, example responses (status and fields), dependencies between
  requests (a variable one request sets and another uses), and the authentication configuration.

**Do not dump the specification.** Only what bears on this story, cited by operation
(`POST /auth/login`).

Tag every statement from the specification **[API]** — *"the API specification says …"* — with the
operation it comes from. Keep it apart from **[I]** QA inference about it. **If the specification
does not define something, it is undefined: never invent an endpoint, a field, a status code or a
rule.**

## Step 7 — UI exploration (only when the preflight says `PERFORM`)

Explore through the **Playwright MCP server**, under the same rules as `/execute-test-cases`
(Steps 2, 4, 5, 6, 7 of that skill):

- **Only the environment the preflight approved** — that label, that host. **Never PROD.** If
  anything you see suggests the host is not the environment the label says, stop exploring and
  record it.
- **Credentials only by handle**, resolved from `.env` into memory for the login and never written
  anywhere — not in the analysis, a note, a file name, or your response. Log in with the profile's
  login flow. If the flow needs something you cannot do — OTP, CAPTCHA, SSO, a second device —
  **stop exploring and record `UI Exploration: Not performed — authentication not supported:
  <what>`** (or *partially performed*, saying what was seen before it), then continue the analysis.
- **Read-only.** Navigate, open, read, and type into fields to observe their validation — but do
  **not** submit anything that creates or changes business data, approve or reject anything,
  delete, or perform any irreversible action. If observing a behaviour genuinely needs a state
  change the story itself describes, ask the human first.
- **Settle before observing** — wait for the expected condition after any navigation or action;
  never judge a page mid-transition.
- **Persist no snapshot and no screenshot.** The accessibility snapshot shows typed passwords in
  plain text; it is for reading the page in-session only. This skill is not granted the
  screenshot tool.
- Explore **only what the story touches**: pages and navigation, fields and their visible
  validation, dropdown options, buttons and actions, visible messages, states and error behaviour,
  and which elements look stable enough to automate later (roles, labels, test IDs).

Tag every observation **[UI]**, with the page it came from — *"[UI] On the login page, the Login
button stays disabled until both fields are filled."* **An observation is current behaviour, never
a requirement.** The UI may be wrong; that is precisely what a later test finds.

## Step 8 — Analyse the sources together, as a Senior QA Engineer

**Hierarchy:** **[D]** confirmed decisions, then **[E]** the User Story and its attachments, are the
requirement. **[API]** and **[UI]** are evidence about it. Evidence never overrides the requirement
and is never merged into it silently.

**When sources disagree, keep every side visible and ask.** Record all observations side by side,
then raise an open question:

```
[E] REQ-LOG-009: the account locks after 5 failed attempts.
[API] POST /auth/login documents 423 "Account locked" but no attempt limit.
[UI] STG locked the account after 3 failed attempts.
[?] OQ-31 — Which limit is required: 5 (specification) or 3 (observed)? Blocks the lockout cases.
```

Never turn observed behaviour into a requirement, and never "correct" the story to match the API or
the UI. A conflict with a **[D]** decision keeps the decision and raises a blocking question.

Analyse the User Story and its Markdown attachment(s) **together**. The attachment usually carries
the detail, the story carries the intent; if they disagree, say so. Determine the **actual scope**
from the content — a module, a feature, part of a feature, an enhancement. Do not assume one User
Story is one Module. State the scope, the evidence, and what it excludes.

Rules that keep the analysis trustworthy:

- **The User Story and its attachments are the source of truth.** Never invent a requirement.
- **Never invent exact wording.** Quote message text only where the story or attachment defines it.
  A message text seen only in the UI is an **[UI]** observation of current wording, not a required
  text.
- **Never silently resolve an ambiguity.** Every unresolved point becomes an open question.
- **Never promote an inference — or an observation — to a requirement.** Either one recorded as fact
  becomes a false bug report weeks later.

## Step 9 — Write or update the artifact

Write `docs/projects/<KEY>/requirements/US-<ID>/requirement-analysis.md`. Every statement carries
exactly one tag:

| Tag | Meaning |
|---|---|
| **[E]** | **Explicit** — stated in the User Story or an attachment. Give the reference. |
| **[D]** | **Confirmed decision** — a human decision from `decisions.md`. Give the decision ID. |
| **[API]** | **API specification says** — give the operation. Evidence, not a requirement. |
| **[UI]** | **Observed current behaviour** in the explored UI — give the page. Evidence, not a requirement. |
| **[I]** | **QA inference** — your reading or judgement. Never a requirement. |
| **[?]** | **Open question** — unresolved; needs a human decision. |

**Provenance** — the artifact opens with a provenance table: work item ID, verified type, project,
area path, iteration, state, revision, **full content fingerprint** (row key `Content fingerprint`),
attachment names with sizes and sha256, the local snapshot path, when it was read, **and the rows
the preflight printed** — `API source`, `API source sha256` (when provided), `UI exploration` (with
environment label and host when performed) — plus the analysis date. Never omit or truncate those
rows: the next run's change detection reads them.

**Source Coverage** — directly after provenance:

```
## Source Coverage

| Source | Status | Details |
|---|---|---|
| User Story | Available | US-<ID>, rev <n> |
| Markdown Attachments | Available / Not available | <names, or "none attached"> |
<the API Specification and UI Exploration rows printed by the preflight>
```

**Sections, for a first analysis** — include a section only when the sources give it content;
never leave an empty heading:

1. Business / Functional Requirements — from the story and attachments
2. API Analysis — only when an API source was used
3. UI Exploration Findings — only when UI exploration was performed
4. Business Rules
5. Fields and Validations
6. State Transitions
7. User Flows
8. Positive Scenarios
9. Negative Scenarios
10. Dependencies
11. Current Behaviour vs Required Behaviour — where **[UI]** or **[API]** differs from **[E]/[D]**
12. Contradictions / Gaps
13. Test Environment / Test Data Prerequisites — and anything not practically testable
14. Requirement → Coverage Map — so no requirement is silently skipped
15. Open Questions — stable IDs, impact, and whether each **blocks** expected results

Plus a **confirmed decisions** section listing every **[D]** decision and what it closed.

**For an update, keep the existing structure and IDs** — an artifact written before this format
keeps its section numbering. Add the Source Coverage table and the new provenance rows, add API /
UI sections only when those sources were used, mark what changed relative to the previous revision,
and preserve all **[D]** content. Never renumber or delete an open question; close it only when a
source or a confirmed decision answers it, and say which.

## Step 10 — Report

Report briefly:

1. Whether the work item was read and its type verified.
2. **Source coverage** — story, attachments, API (type and path, or *Not provided* / why not
   used), UI (environment and host, or *Not performed* and why).
3. The scope you determined, and why.
4. Whether this was a first analysis, an update (and which source changed), or unchanged.
5. Where the artifact was saved.
6. Confirmed decisions applied.
7. **Conflicts between sources**, each with its open question.
8. **Remaining open questions**, blocking ones first.

Confirm: **no Test Case generated, no Azure DevOps write, no Bug, no screenshot or snapshot
persisted, no business data changed in the explored application.**

Then update `CLAUDE.md` only if something genuinely project-level changed — a new capability
verified, a new invariant, a reversed decision, or a new artifact type. **Never put requirement
detail in `CLAUDE.md`.** A project fact learned while exploring — where a screen lives, the real
login flow — goes to `docs/projects/<KEY>/profile.md` or `decisions.md`, flagged for the human.

**Documentation-impact check — mandatory, in this same task** (`CLAUDE.md` →
*Documentation synchronization*, `docs/product-decisions.md` §18). If this run changed anything
project-level — a CLI interface, an artifact path, a rule, or an instruction in **this** skill
that turned out to be wrong — update the affected `SKILL.md`, `CLAUDE.md`, and
`docs/product-decisions.md` **now**, without asking. Analysing a story changes none of them.

Do not commit. Stop and wait for human review.
