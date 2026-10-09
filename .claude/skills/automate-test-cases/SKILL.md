---
name: automate-test-cases
description: Plan, then generate, deterministic Playwright automation for the approved Test Cases of a User Story whose Need Automation is Yes, organised by Module and traceable to each Test Case ID. Use when asked to automate, script, or write Playwright tests for a User Story's test cases. Takes a User Story ID, optionally narrowed to specific Test Case IDs. Writes an Automation Plan and stops for human review before generating any code; never changes a Test Case, never writes to Azure DevOps.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm run automation:scope:*), Bash(npm run automation:list:*), Bash(npm run automation:test:*), Bash(npm run automation:report:*), Bash(npm run automation:verify-artifacts:*), Bash(npm test:*), Bash(npm run typecheck:*), Bash(mkdir:*), Bash(ls:*), Bash(git status:*), Bash(git diff:*), mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_fill_form, mcp__playwright__browser_press_key, mcp__playwright__browser_select_option, mcp__playwright__browser_hover, mcp__playwright__browser_wait_for, mcp__playwright__browser_navigate_back, mcp__playwright__browser_tabs, mcp__playwright__browser_close
---

# Automate Test Cases with Playwright

Turn approved Test Cases into **deterministic Playwright tests** — the regression oracle
(`docs/product-decisions.md` §7, §7.1). Two phases, with a human gate between them:

```
scope -> inspect framework -> explore app -> Automation Plan -> STOP (human review)
      -> explicit approval in session -> generate code -> validate -> record status
```

This skill **never changes a Test Case** (not its steps, status, or Need Automation), **never
writes to Azure DevOps**, never creates a Bug, never commits.

## Step 0 — Resolve the active project, then the scope

**Resolve the active project before reading anything.** `<KEY>` below is that project's key.

1. A key stated in the request (`--project <KEY>`, or "for <KEY>") wins.
2. Otherwise `QA_ACTIVE_PROJECT` in the environment.
3. Otherwise, **only** if exactly one directory under `docs/projects/` has a `profile.md`, use it.
4. Otherwise **stop and ask the human which project this is.**

**Never guess the project**, and never infer it from a story ID.

Then **read `docs/projects/<KEY>/profile.md`**. Take from it, never inventing: the allowed
environments, the environment label variable, the **`Automation Base URL Variable`** setting,
the declared test-data handles, the login flow, modules and terminology. Also read
`docs/projects/<KEY>/decisions.md` for project decisions about login and environments. A value
marked `TBD` is **not configured**: stop and say so. **Never borrow another project's handles,
hosts, page objects or credentials.**

The argument is `$ARGUMENTS`: `<USER_STORY_ID>` or `<USER_STORY_ID> <TC-ID> [<TC-ID> …]`. If no ID
was supplied, ask and stop.

## Non-negotiable rules

1. **Need Automation is the scope decision, and it is final here.** Automate only cases whose
   value is `Yes`. `No` is never automated. A missing value is **undecided** — never treated as
   `Yes`. **Never re-evaluate, and never edit, a Need Automation value** — not even when a `Yes`
   case turns out to be unautomatable; that is recorded as `NOT AUTOMATED`, below.
2. **Only `Approved` or `Published` cases are automated.** `Need Automation = Yes` is not approval.
   This skill never approves, never changes a status, and never writes `test-cases.md`.
3. **No code before an approved plan.** Generating automation code requires an **explicit human
   approval of the Automation Plan in the current session** (`CLAUDE.md` → *Approval gates*).
   Approval of an earlier plan does not carry forward to a changed one.
4. **One framework.** Extend the existing one: `playwright.config.ts`, `src/automation/`, and
   `automation/<KEY>/`. Never create a second Playwright config, a second fixture layer, a
   different test runner, or a new dependency.
5. **Never invent an Expected Result, a step, or a business rule.** A spec asserts exactly what
   the Test Case states. Observation-only content is never turned into an assertion.
6. **PROD is never targeted.** The label decides the environment, never the hostname (§12.1).
7. **Never persist or print a credential.** Credentials come only from the `account()` and
   `dataValue()` fixtures, by handle. No literal credential, URL or host in any generated file.
8. **No Azure DevOps writes, no Bug creation, no commit, no push.**

## Step 1 — Select the cases (code decides, not judgement)

```
npm run automation:scope -- <ID> --project <KEY>
```

It parses the artifact strictly and lists, **grouped by Module**: the in-scope cases (Need
Automation = `Yes` **and** `Approved`/`Published`) with each case's plan path and spec path, and
every excluded case with its reason — `NEED_AUTOMATION_NO`, `NEED_AUTOMATION_UNDECIDED`, or
`NOT_APPROVED`. If specific TC IDs were requested, narrow to those; a requested ID that is
excluded is **reported with its reason**, never silently automated.

**Nothing in scope → stop** and report the exclusions. Undecided cases need `/write-test-cases`
and a human review; unapproved cases need a human approval. Neither is this skill's call.

## Step 2 — Inspect the existing framework before writing anything

Read, every time, because it grows between runs:

- `playwright.config.ts` and `src/automation/` — `fixtures.ts` (the `test` to import, the
  `appEnv`, `account(H)`, `dataValue(H)` fixtures, `testCaseDetails`), `config.ts`,
  `artifact-policy.ts`, `code-safety.ts`.
- `automation/<KEY>/**` — **every existing Page Object and spec.** Reuse a Page Object that
  already models a page; extend it rather than writing a parallel one. Match the naming and
  locator style already there.
- `docs/projects/<KEY>/automation/<Module>/automation-plan.md` for each Module in scope — the
  existing plan is updated, never replaced; earlier rows stay.

## Step 3 — Confirm the environment, then explore

1. **Artifact safety first.** `npm run automation:verify-artifacts` must PASS before any
   credentialed automation runs — and again after a Playwright upgrade or any change to
   `artifact-policy.ts` or `fixtures.ts`. If it fails, **stop**: credentialed runs could write a
   password to disk.
2. **The environment** comes from `.env` through the profile: the label variable (e.g.
   `APP_ENV`) must hold a label on the profile's allow-list, never `PROD`, and the variable the
   profile's `Automation Base URL Variable` names (with `{ENV}` replaced by the label) must be
   set. Missing → the affected cases are `NOT AUTOMATED — ENVIRONMENT_UNAVAILABLE`; ask the human
   to configure it. **Never infer the environment from a hostname.**
3. **Explore** the pages each case touches through the **Playwright MCP server**, under the same
   rules as `execute-test-cases` (Steps 2, 4, 5, 7 of that skill): allow-listed environment only,
   handles resolved into memory only, **never persist an accessibility snapshot** (it shows typed
   passwords), settle before observing. Exploration only reads the UI — do not submit data that
   changes state unless the Test Case itself requires that state, and say so.
4. For each step of each case, identify a **stable locator**, in this order of preference:
   `getByRole` with an accessible name → `getByLabel` → `getByTestId` → `getByText` for static
   copy. CSS/XPath only when nothing above exists, and the plan says so with the reason.

## Step 4 — Write the Automation Plan, then STOP

One plan **per Module**, not per User Story:

```
docs/projects/<KEY>/automation/<Module>/automation-plan.md
```

`<Module>` is the Module directory name `automation:scope` printed (spaces become `-`). A User
Story spanning two Modules updates two plans; one Module accumulates cases from many stories.

The plan contains:

1. **Provenance** — project, Module, the source artifact(s) and the content fingerprint of each,
   environment label **and** host explored (verbatim), date.
2. **Case table** — one row per in-scope case, **never removed once added**:

   | Test Case | User Story | ADO ID | Title | Status | Need Automation | Spec | Page Objects | Handles | Automation Status | Reason |
   |---|---|---|---|---|---|---|---|---|---|---|

   `Need Automation` is copied verbatim (`Yes`). `Automation Status` is one of:

   | Status | Meaning |
   |---|---|
   | `PLANNED` | In the plan, awaiting human approval |
   | `GENERATED — NOT VERIFIED` | Code exists; not yet green against an allowed environment |
   | `AUTOMATED` | Code exists and passed once against an allowed environment |
   | `NOT AUTOMATED — <CATEGORY>` | A `Yes` case that cannot be automated now — reason required |

   `<CATEGORY>` is one of `MISSING_STABLE_LOCATOR`, `TEST_DATA_UNAVAILABLE`,
   `AUTH_FLOW_UNSUPPORTED` (OTP, CAPTCHA, SSO…), `FRAMEWORK_CAPABILITY_MISSING`,
   `ENVIRONMENT_UNAVAILABLE`, with a specific reason. **A blocker never changes Need Automation**
   — the case stays `Yes` and stays in the plan.
3. **Page Objects** — new or extended, per page, with the locators chosen and why.
4. **Per case** — step → action → locator → assertion mapping, each assertion traced to the Test
   Case's Expected Result for that step.
5. **Risks** — state each case consumes or leaves behind, finite accounts it burns (confirm with
   the human before automating cases that burn lockout or single-use data), ordering hazards.

**Stop here.** Report the plan and wait. The human approves, rejects, or changes it. Only an
**explicit approval in this session** unlocks Step 5.

## Step 5 — Generate the code (after explicit approval only)

Layout — project code, organised by Module:

```
automation/<KEY>/<Module>/pages/<Feature>Page.ts      Page Objects
automation/<KEY>/<Module>/tests/TC-<story>-NNN.spec.ts   ONE spec per Test Case
```

Page Objects:
- One class per page or feature, shared by every spec that touches it; a spec in another Module
  imports it rather than copying it.
- Locators and actions only. **No assertions, no test data, no credentials** in a Page Object.
- Import Playwright **types** only (`import type { Page, Locator } from '@playwright/test'`).

Specs — exactly this shape:

```ts
import { expect, test, testCaseDetails } from '<relative>/src/automation/fixtures.ts';

test(
  'TC-<story>-NNN — <the Test Case title, verbatim>',
  testCaseDetails({ testCaseId: 'TC-<story>-NNN', storyId: <story>, adoId: <ADO ID or null> }),
  async ({ page, appEnv, account }) => {
    await test.step('Step 1: <action from the Test Case>', async () => { … });
    …
  },
);
```

- **One `test()` per file; one `test.step` per Test Case step**, titled `Step N: <action>`.
  Step titles never contain a value. `N` is the Test Case's own step number: the HTML report
  joins on it to show each step's Expected Result, so a renumbered or missing step shows up there
  as `NOT EXECUTED`.
- **Always pass `testCaseDetails(…)`** — without it the report shows the test as *not
  traceable* and raises no Bug Candidate for it.
- **Each step asserts that step's Expected Result** with web-first assertions (`toBeVisible`,
  `toHaveURL`, `toHaveText` on the element the result names). Exact message text only where the
  Test Case states it.
- **Settle before judging** — wait for the expected condition (`expect(...).toBeVisible()`,
  `toHaveURL`), never read a result immediately after a navigation-triggering action. Fixed waits
  (`waitForTimeout`) only when no condition exists, with a comment saying why.
- **Credentials only via `account('<HANDLE>')` / `dataValue('<HANDLE>')`.** A handle with no
  value skips the test as `NOT RUN — TEST_DATA_UNAVAILABLE`; never work around it.
- **Navigate relative to `appEnv.baseUrl`** (or `baseURL`). Never a literal host.
- **Unique data** generated at run time where the case requires it (§4). Every spec runs alone
  and leaves the state the Test Case says it leaves.
- **Forbidden, and enforced by `npm test`** (`src/automation/code-safety.ts`): ARIA snapshots
  (`toMatchAriaSnapshot`, `ariaSnapshot()` — they print typed passwords in the failure message),
  `trace`/`video` overrides, `.tracing`, `storageState`, `process.env`, and importing `test` or
  `expect` from `@playwright/test` (that bypasses the fixtures). Also never assert on the value
  of a credential field — a failing `toHaveValue` prints it.

## Step 6 — Validate

1. `npm run typecheck` and `npm test` — both must pass; the code-safety scan covers every new file.
2. `npm run automation:list -- --project <KEY> --grep @TC-<story>-NNN` — discovery finds exactly
   one test per generated case.
3. Run the generated cases against the allowed environment:
   `npm run automation:test -- --project <KEY> --grep @TC-<story>-NNN`. The global setup refuses
   a missing, unlisted or PROD label before any browser starts.
4. **Read the HTML execution report** the run wrote — its path is printed as
   `Execution report: …` (`.artifacts/reports/<KEY>/RUN-<NNN>/execution-report.html`;
   `npm run automation:report -- --project <KEY>` finds the latest). It joins each result with the
   Test Case's steps and Expected Results, names the failed step, and classifies each failure
   **automatically and provisionally** (`docs/product-decisions.md` §7.2). Review that
   classification against §9 yourself — it is a starting point, not a verdict.
5. Record the outcome in the plan: green once → `AUTOMATED`. Red → `GENERATED — NOT VERIFIED`,
   with the failure classified. A failure classified `PRODUCT_BUG` appears as a **local Draft
   Bug Candidate** in the report (`bug-candidates/BUG-NNN.md`). **Nothing is created in Azure
   DevOps** — report the candidate to the human, who may confirm it with `/execute-test-cases`
   and publish it only through `/publish-bug` with explicit approval. A candidate whose cause is
   really a stale locator is a `TEST_SCRIPT_ISSUE`: say so, and fix the spec rather than
   forwarding it.

Playwright debug output lands under `.artifacts/playwright-results/<KEY>/` and reports under
`.artifacts/reports/<KEY>/` (both gitignored). Failure screenshots are rendered pixels; before
quoting or keeping one where a credential was entered, confirm the value is masked.

**Every test is recorded on video** — pass, fail, or not run once started — by the artifact
policy, not by the spec (human decision, `docs/product-decisions.md` §7.2.1). The report copies
each video to `attachments/<TC-ID>.webm` beside `<TC-ID>.png` and plays it under the case's
*Attachments*. Videos are **QA-only artifacts** for the project testing team, retained like all
other evidence (local, gitignored, never committed, never attached to anything outside the
report). The risk of sensitive STG content in a recording is **explicitly accepted**: never
delete, blank or withhold a video for it, and never set `video` in a spec to avoid it. Use a
failing case's video to see what the application did before you classify the failure. Video
changes nothing about PROD — the run is still refused unless its label is allowed and not PROD.

## Step 7 — Report

1. Scope: in scope / excluded (by reason) / refused.
2. Per Module: the plan path, and per case its Automation Status and spec path.
3. Every `NOT AUTOMATED` case with its category and reason.
4. Validation results (typecheck, tests, discovery, runs), the **HTML report path**, and every
   Bug Candidate it holds — stated as a local Draft, not a Bug.
5. Confirmation that **no Test Case was modified**, **no Need Automation value changed**, **no
   Azure DevOps write occurred**, and nothing was committed.

**Documentation-impact check — mandatory, in this same task** (`CLAUDE.md` → *Documentation
synchronization*). A new fixture, a new framework capability, a changed command, or an
instruction here that proved wrong → update this `SKILL.md`, `CLAUDE.md` and
`docs/product-decisions.md` now. Project facts learned while exploring (login flow, locator
conventions, a page's location) go to `docs/projects/<KEY>/profile.md` or `decisions.md`.

Do not commit. Do not push.
