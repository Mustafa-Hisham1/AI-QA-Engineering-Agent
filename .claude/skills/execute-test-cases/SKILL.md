---
name: execute-test-cases
description: Execute approved Web UI Test Cases against an allow-listed environment using the Playwright MCP server, recording step-level PASS/FAIL/BLOCKED/SKIPPED results with Expected vs Actual and evidence. Use when asked to execute, run, or re-run the approved test cases of a User Story, or a single Test Case, against a web environment. Takes a User Story ID, optionally narrowed to specific Test Case IDs. Never writes to Azure DevOps; a failure classified PRODUCT_BUG stops for human review.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(mkdir:*), Bash(mv:*), Bash(ls:*), Bash(grep:*), Bash(git status:*), Bash(git diff:*), mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_fill_form, mcp__playwright__browser_press_key, mcp__playwright__browser_select_option, mcp__playwright__browser_hover, mcp__playwright__browser_wait_for, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_console_messages, mcp__playwright__browser_network_requests, mcp__playwright__browser_navigate_back, mcp__playwright__browser_handle_dialog, mcp__playwright__browser_tabs, mcp__playwright__browser_resize, mcp__playwright__browser_close
---

# Execute Test Cases against a web environment

Execute **approved** Web UI Test Cases step by step through the **Playwright MCP server**, verify
each stated Expected Result against the real UI, and persist a structured execution record with
evidence.

This skill **drives a real browser against a real environment.** It reads local Test Case
definitions and writes local execution artifacts. It **never writes to Azure DevOps** — no Test
Run, no Test Result, no Bug — and it **never modifies a Test Case**.

Its job is to report what the application actually did. It is not the judge of whether a
deviation is a defect, and it never files one on its own.

## Step 0 — Resolve the scope

The argument is `$ARGUMENTS`. Accept either form:

- **`<USER_STORY_ID>`** — execute the approved, in-scope Web UI cases of that story.
- **`<USER_STORY_ID> <TC-ID> [<TC-ID> …]`** — execute only those Test Cases.

Below, `<ID>` is the User Story ID. If no ID was supplied, ask for one and **stop**. **Never guess
the ID** — a wrong ID executes the wrong suite against a live environment.

Test Cases are independently executable (`docs/product-decisions.md` §4), so any subset is valid.

## Non-negotiable rules

1. **Only `Approved` or `Published` cases are executed.** `Draft`, `AI-Reviewed`,
   `Needs-Changes` and `Rejected` are refused — executing unapproved content produces results
   nobody agreed to (invariant 1). If the requested scope contains none, **stop** and say so.
2. **Never modify a Test Case.** Not its steps, expected results, status, or Azure DevOps ID.
   Execution reads `test-cases.md`; it never writes to it. A test case that looks wrong is
   **reported**, never corrected mid-run.
3. **Never invent a step, an Expected Result, or a business rule.** Verify exactly what the case
   states. If a case is ambiguous, execute what it says and record the ambiguity as an
   observation.
4. **The environment is identified explicitly and never inferred from the hostname.**
   See *Step 2*. A host named `-dev-`, `-stg-` or anything else carries **no** authority
   (`docs/product-decisions.md` §12.1).
5. **Never execute against PROD.** No exception, no flag, no human override inside this skill.
6. **Never persist a credential** — not in an artifact, a log, a report, a screenshot, a
   filename, or source code, and never printed in the response (invariant 7).
7. **A failed assertion is not automatically a bug.** Classify first (*Step 8*). Only
   `PRODUCT_BUG` proceeds to a Bug Candidate, and that **stops for human review**.
8. **No Azure DevOps writes of any kind.** Not results, not runs, not bugs.
9. **Do not commit or push.**
10. **Never overwrite a previous run.** Every execution gets a fresh run ID (*Step 3*).

## Step 1 — Load the Test Cases

```
docs/test-cases/US-<ID>/test-cases.md
```

- **Missing** → stop. Report that US <ID> has no Test Case artifact and that `write-test-cases`
  must run first.
- Read each in-scope case in full: ID, title, Azure DevOps ID, Review/Lifecycle Status,
  Test Type, Requirement Reference, Precondition, Test Data handles, and every step with its
  Expected Result.

Then decide what is actually executable:

- **Not `Approved`/`Published`** → excluded, reported by status.
- **Not a Web UI case** (API-only, or requiring a channel this skill cannot drive) → **SKIPPED**,
  reason recorded.
- **Explicitly out of the requested scope** → **SKIPPED**.
- **Observation-only cases** — cases that exist to record behaviour rather than assert it —
  execute normally but **record observed behaviour without a pass/fail assertion**. Never invent
  an expectation for them.

Report the counts before touching a browser: in scope, executable, skipped, refused.

## Step 2 — Validate the environment

Read the environment label and target URL from `.env` — the only place they live (invariant 7).

1. **Read the explicit environment label** (e.g. `APP_ENV`). This value, not the URL, decides
   what environment this is.
2. **If the label is `PROD`, or missing, or not on the allow-list → stop.** Execute nothing.
   **STG is the only allowed environment today** (invariant 5).
3. **If the label is absent but a URL is present → stop.** Do not infer. Ask the human to set the
   label explicitly.
4. **Record the label AND the target host verbatim** in the artifact. They are recorded together
   because they can disagree — this project's STG host is named `-dev-`
   (`docs/product-decisions.md` §12.1). A future reader must be able to see exactly which machine
   produced a result.
5. **Confirm the target is reachable** before running the suite. If it is not, every case is
   **BLOCKED / `ENVIRONMENT_ISSUE`** — not FAIL.

## Step 3 — Create the run

Runs are append-only. Find the highest existing `RUN-NNN` under `docs/executions/US-<ID>/` and
create the next one:

```
docs/executions/US-<ID>/RUN-<NNN>/
  execution-results.md
  evidence/
```

**Never write into an existing run directory.** Re-executing a case after a fix is a **new run**;
history is what makes a flaky result visible.

`evidence/` is **gitignored** — evidence stays local unless a human decides otherwise.

## Step 4 — Resolve test data handles

Test Cases reference accounts by **handle** (`ADMIN_VALID`, `ADMIN_LOCKOUT`, …), never by value.

For each handle a case needs:

- **Resolve it from `.env`** at execution time, into memory only.
- **Missing or unset** → that case is **BLOCKED / `TEST_DATA_ISSUE`** with the missing handle
  named. **Missing test data is never a product failure**, and never a FAIL.
- **Refer to the handle everywhere.** The artifact, the response and any bug candidate say
  `ADMIN_VALID` — never the username, never the password.

**Handles that consume state** — lockout accounts, single-use data — are destructive. Confirm
with the human before executing cases that burn them, and never reuse such an account across
cases in one run without saying so.

## Step 5 — Start the browser

Use the **Playwright MCP server** (`mcp__playwright__*`). Do not write or run Playwright scripts
here — deterministic Playwright is a separate, later capability with a different purpose
(`docs/product-decisions.md` §7).

Start from a **clean session** for each case that depends on authentication state. A residual
session silently invalidates login, logout and lockout cases.

## Step 6 — Execute the steps sequentially

For each step, in order: perform the action, **settle**, observe, compare against the stated
Expected Result.

### Settling is mandatory

**After any action that can trigger navigation or an async UI update, wait for the app to settle
before judging the result.** This is not optional and not a style preference.

- **Never judge a login immediately after clicking the submit control.** The page may still show
  the login route while authentication completes. Reading the result at that instant produces a
  **false FAIL** — and a false FAIL on authentication is exactly what turns into a bogus bug
  report. This rule exists because it was observed live.
- Prefer waiting for a **specific expected condition** (text appearing, text disappearing) over a
  fixed delay. Use a bounded time-based wait only when no condition is available.
- If a step genuinely times out, that is evidence — record the wait that was applied, so the
  result can be judged fairly.

### Observing

Use the **accessibility snapshot** to read UI state and to target elements — it is the reliable
way to see the page. **See the security limit on snapshots in *Step 7*.**

### Verifying

Compare the observed state against **the Expected Result the case states** — nothing more:

- **Satisfied** → step PASS.
- **Not satisfied** → step FAIL. Record precisely what was expected and what was observed.
  Continue only if later steps remain meaningful; otherwise stop the case and record the rest as
  not executed.
- **Cannot be evaluated** — the app never reached the state — → the case is **BLOCKED**, not FAIL.

**Deliberately unspecified behaviour stays unasserted.** Where a Test Case says something is not
asserted, or points at an open question, **record the observation and assert nothing**. An
observation must never be promoted into a pass/fail criterion, and a single run never resolves an
open question — that needs a human decision.

Anything noticed that belongs to a **different** Test Case is an **observation**, recorded in the
artifact, explicitly marked as unverified, and **not** a result for the executed case.

## Step 7 — Capture evidence

- **Failures: always.** Screenshot the failing state, plus console errors and relevant network
  activity.
- **Passes: only when the case asks for it** (`docs/product-decisions.md` §10) — successful
  executions do not require screenshots.
- Store under the run's `evidence/`, named for the case and step.

### The snapshot rule — do not weaken this

**Never persist an accessibility snapshot that contains a secret.** The accessibility tree
returns typed values **in plain text, including passwords the UI masks on screen.** Snapshots are
for reading state in-session; they are **not** an evidence format.

**Rendered screenshots are the evidence format** — and only when they do not expose a secret.
Before saving a screenshot of any view where a credential was entered or revealed (a shown
password, a token on screen), **confirm the value is masked**. If it is visible, **discard the
screenshot** and describe the state in words instead. Losing one image is cheaper than committing
a password to disk.

## Step 8 — Classify every failure

**A failed assertion is not a bug until it is classified.** Retry when appropriate before
deciding (`docs/product-decisions.md` §9).

| Classification | Use when |
|---|---|
| `PRODUCT_BUG` | The application genuinely behaved contrary to a stated Expected Result, and no other cause explains it |
| `TEST_DATA_ISSUE` | Required data/account missing, wrong state, expired, already consumed |
| `ENVIRONMENT_ISSUE` | Environment down, misconfigured, wrong build, unreachable |
| `NETWORK_ISSUE` | Timeouts, DNS, connectivity, transient transport failure |
| `AUTHENTICATION_ISSUE` | Could not authenticate for reasons outside the case under test |
| `TEST_SCRIPT_ISSUE` | The execution itself was wrong — bad selector, missing wait, mis-sequenced step. **A false FAIL from insufficient settling belongs here, never `PRODUCT_BUG`** |
| `UNKNOWN` | Cause not determined. Use it honestly rather than guessing |

Before classifying `PRODUCT_BUG`, rule out the others — especially a **precondition the case
assumes but the environment does not satisfy** (account locked, password expired, feature
disabled). That is `TEST_DATA_ISSUE` or `ENVIRONMENT_ISSUE`, and the case is **BLOCKED**.

**Every failure appears in the report regardless of classification.** Classification decides the
*default action*, never whether the human sees it. Misclassification is asymmetric: a false
`PRODUCT_BUG` costs one review; a real bug filed as `ENVIRONMENT_ISSUE` disappears silently — so
when genuinely torn, prefer the classification that keeps a human looking at it.

## Step 9 — Persist the execution result

Write `execution-results.md` in the run directory, following the structure the canary established
(`docs/executions/US-53717/RUN-001/execution-results.md`). Keep it **structured and machine-
readable enough for a future Azure DevOps Test Run publisher to consume** — that publisher is a
separate, not-yet-built, separately-approved capability.

Record:

- **Provenance** — story ID, run ID, date, environment **label and target host verbatim**,
  application, Test Case source, scope, and *"Azure DevOps writes: none"*.
- **Test data** — by **handle only**.
- **Summary counts** — PASS / FAIL / BLOCKED / SKIPPED / executed, and Bug Candidates raised.
- **Per case** — Test Case ID, Azure DevOps ID, title, requirement reference, execution status,
  failure classification, precondition verification, a **step-level table** (step, Expected,
  Actual, status), overall Expected vs Actual, evidence paths, and observations.
- **Observations** — recorded, explicitly marked unverified, never converted into results.

Status meanings are fixed (`docs/product-decisions.md` §8) — **PASS** all expected results
satisfied; **FAIL** one or more not satisfied; **BLOCKED** could not proceed; **SKIPPED**
intentionally not executed. Do not let them drift.

## Step 10 — If and only if a failure is `PRODUCT_BUG`

**Stop. Do not continue executing the remaining cases until the human has reviewed it.**

### Duplicate check — the owning User Story ONLY

Check whether a Bug for this issue already exists **under the User Story that owns the executed
Test Case** — nothing wider (`docs/product-decisions.md` §5.1).

**In scope:** Bugs that are children of that User Story.

**Out of scope — do NOT search:**

- other User Stories,
- parent work items or any ancestor,
- other Area Paths,
- the project at large,
- historical Bugs belonging to other User Stories.

A Bug found outside that scope is **not** a duplicate for this workflow, however similar its
title. If one is noticed incidentally, it may be **mentioned as context**, but it must never
block the Bug Candidate or be treated as the existing report.

If a duplicate **is** found within scope, recommend linking or reporting against it rather than
raising a new one. **The human decides.**

Write a **local Bug Candidate** under the run directory:

```
docs/executions/US-<ID>/RUN-<NNN>/bug-candidates/BUG-CANDIDATE-<n>.md
```

Using the project bug structure (`docs/product-decisions.md` §5), containing:

- **Title** — same convention as Test Cases: `[Project][Module][Feature/Page] <Scenario>`
- **Description**
- **Preconditions**
- **Steps to reproduce** — enough for someone else to reproduce it unaided
- **Test data** — **by handle only**
- **Expected Result** — as the Test Case states it
- **Actual Result** — what was observed
- **Environment** — label **and** host verbatim
- **Severity / Priority** — **proposed**; the human has final control
- **Evidence** — paths to screenshots/logs, credential-free
- **Related Test Case ID** and **Related User Story**
- **Failure classification** and why the alternatives were ruled out
- **Status** — `Draft`. **The agent may never write `Approved`** (§6.1, invariant 1)

Then **show the human the complete Bug Candidate and STOP.**

**Never create or publish an Azure DevOps Bug automatically.** Only after an **explicit human
approval in the current session** may a bug be created, and that is a separate write workflow
under its own approval gate (invariant 2) — approval given earlier never carries forward.

### Handoff to publishing

This skill ends at the reviewed Bug Candidate. Publishing is **`publish-bug`**, a separate skill:

```
PRODUCT_BUG → Bug Candidate → human review → /publish-bug <path-to-bug-candidate>
```

The handoff is deliberate. Execution and publishing have different inputs, different failure
modes and different blast radii — one drives a browser, the other writes irreversibly to Azure
DevOps. Merging them would hide which step produced a wrong result and would put a write behind a
workflow the human started for a different reason.

**Do not publish from this skill**, and do not pre-fill publishing metadata here. **Severity and
assignee are decided by the human at publish time, per Bug** — this skill may record a *proposed*
severity in the Bug Candidate, but it never chooses an assignee and never carries either value
over from a previous Bug.

## Step 11 — Report

1. **Summary counts** — PASS / FAIL / BLOCKED / SKIPPED, out of how many in scope.
2. **Per case** — status, and for anything not PASS, the classification and reason.
3. **Bug Candidates raised**, each awaiting human review — or explicitly *none*.
4. **Observations** worth a human's attention, marked unverified.
5. **Where the artifact and evidence live**, and that evidence is gitignored.
6. Confirmation that **no Azure DevOps write occurred** and **no Test Case was modified**.

## Step 12 — Documentation-impact check

**Mandatory, in this same task** (`CLAUDE.md` → *Documentation synchronization*,
`docs/product-decisions.md` §18).

If this run changed anything about how the project works — a CLI interface, an artifact path, a
security rule, an execution rule, or an instruction in **this** skill that turned out to be wrong
— update the affected `SKILL.md`, `CLAUDE.md`, and `docs/product-decisions.md` **now**. Do not
report staleness instead of fixing it, and do not ask permission.

A run that only produces results changes no documentation. Update *Current state* in `CLAUDE.md`
only when a capability became usable end to end or an invariant changed.

**Do not commit. Do not push.**
