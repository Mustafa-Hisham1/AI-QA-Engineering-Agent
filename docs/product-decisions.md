# V1 Product Decisions

**Status:** Locked 2026-08-13, after three rounds of architecture review.
Remaining open items closed the same day.

This is the full decision record. `CLAUDE.md` carries the compact summary every
session needs; this file carries the detail and the reasoning.

**Changing a decision here is a project-level event:** update the entry, note
what changed and why, and reflect any consequence in `CLAUDE.md`. Decisions that
were considered and *rejected* are recorded at the end — they exist to stop
settled questions being reopened.

Anything not stated here is not decided.

---

## 1. Project type and scope

- **Claude Code-based project**, hosted on GitHub in a **private** repository.
  Not a standalone web application or SaaS platform in V1.
- **V1 testing scope is Web/UI.** Backend/API testing is postponed to a later
  extension.
- **Video recording is out of scope for agent-driven (MCP) execution.**
  *Amended 2026-10-09:* deterministic Playwright automation records video on
  allowed non-PROD runs, by explicit human decision (§7.2.1).

*Reasoning:* the workflow is human-paced and file-driven, which fits a Claude
Code project. A known ceiling was accepted: Claude Code is session-scoped, so
there is no unattended or scheduled execution in V1. All durable state lives in
files rather than session memory.

## 2. Core workflow

```
Azure DevOps User Story
  -> read User Story + attachments
  -> requirements analysis
  -> generate test cases
  -> AI self-review
  -> human review
  -> human approval
  -> publish approved test cases to Azure DevOps + save locally
  -> AI manual web execution
  -> PASS / FAIL / BLOCKED / SKIPPED
  -> failure analysis
  -> if product bug: bug candidate -> human review -> approval -> create bug
  -> execution report
```

**Automation is not a distant final phase.** It begins shortly after approved
test cases have been manually executed:

```
approved test cases -> automation analysis -> website exploration
  -> identify paths/pages/elements -> automation plan -> human review
  -> generate automation code -> execute -> failure analysis -> bug workflow
```

Which approved cases enter automation is decided per case by **Need Automation**
(§6.3), not by approval.

## 3. Test case structure

Every test case contains:

| Field | Notes |
|---|---|
| Internal Test Case ID | Stable, assigned at draft time — exists before any Azure DevOps ID |
| Project / Module / Feature-Page | Structured fields, **not** parsed out of the title |
| Title | Generated from the structured fields |
| Precondition | |
| Steps | |
| Expected Result | **Associated with individual steps where appropriate**, because the agent executes step by step |
| Test Data | See §4 |
| Test Type | |
| Requirement Reference | |
| Azure DevOps ID | Null until published |
| Review/Lifecycle Status | The agent may write this field, but writing it never constitutes approval — see §6. Allowed state names will be defined when the artifact format is first implemented. |
| Need Automation | `Yes` / `No`. AI recommendation, human-reviewable, independent of the status — see §6.3. Local only; not published to Azure DevOps |

**Title convention (mandatory):**

```
[{PROJECT}][{MODULE}][{FEATURE}] <Test Scenario>
```

Example:

```
[{PROJECT}][{MODULE}][{FEATURE}] Verify the record is created successfully when
valid data is entered and Submit is clicked
```

`{PROJECT}` is the **title project token** taken from the active project's
`docs/projects/<KEY>/profile.md`; `{MODULE}` and `{FEATURE}` come from that
project's own vocabulary. Never invent a token, and never borrow another
project's.

The Feature/Page slot covers both pages and functional topics (e.g. a page name
or a validation concern). It is a human label; grouping and filtering rely on the
structured fields, not on parsing the title.

**Work item type scope for V1:** the User Story reader supports the **`User
Story`** work item type only. The Azure DevOps project exposes other types
(`Product Backlog Item`, `Epic`, `Feature`, `Issue`); the reader is not widened
to them yet, but the design must remain extensible enough to add them later.

## 4. Test data

- Scenario-specific test data is stored **inside** the test case: valid values,
  invalid values, numbers, special characters, spaces, empty values, boundary
  values, duplicates, emojis, and anything else the scenario needs. For example,
  for a named reference-data record: a valid name, a numeric-only name, special
  characters, a duplicate code, invalid values.
- A test case should be self-contained enough to execute its own scenario.
- **Environment-wide configuration such as base URLs belongs in environment
  configuration, not in test data.** Credentials never appear in test cases.
- **For stateful scenarios that require unique data, the agent may generate
  unique data at runtime** so that test cases remain independently executable.
- **A test case must never depend on another test case having run first.**

## 5. Bug structure

Title, Description, Steps, Expected Result, Actual Result, Environment,
Severity, Priority, Evidence, Related Test Case, Related User Story.

How these map onto Azure DevOps Bug fields — Description, Repro Steps and System
Info, with **no content repeated between them** — is defined in §5.4.

- Bug titles follow the **same convention** as test cases.
- **AI may propose Severity and Priority; the human has final control.**
- **Before creating a bug, the agent checks for an existing related or open bug**
  for the same User Story or area. If a likely duplicate exists, it recommends
  linking or reporting against the existing bug rather than creating a new one.
  The human decides.

### 5.1 Duplicate-check scope (human decision, 2026-08-16)

§5 requires a duplicate check before creating a Bug but did not say how wide it
should search. **It is scoped to the User Story that owns the executed Test
Cases** — the story under which those Test Cases were generated and published.

The agent does **not** search other User Stories, other parents, other area paths,
or the project at large, and does not investigate other parents' history.

*Context:* the case that produced this rule is recorded with the project it came
from — see `docs/projects/NBO/decisions.md`.

*Known trade-off, accepted deliberately:* a narrow scope cannot see a matching Bug
filed under a different story, so a cross-story duplicate is possible. That is
preferred over a workflow that stalls on distant, differently-scoped items. Both
searches are cheap to run; only the **story-scoped** result governs the decision.

### 5.2 Bug metadata is decided per Bug, never inherited (decided 2026-08-17)

Severity, assignee and Priority are decided by the human **for the specific Bug
being published**, and carry **no** authority over any later Bug.

- **Severity** — the agent proposes a value from the observed impact of *that*
  defect and must have it explicitly confirmed; §5 gives the human final control
  and this project has no finer-grained rule. The value written is the human's.
  Spelled exactly as the process template spells it (this one numbers its values,
  so a bare `Low` is rejected) — constants live in `SEVERITY` in
  `src/ado/fields.ts`.
- **Assignee** — comes from the human's instruction for that Bug. Never inferred
  from the User Story owner, the Test Case author, the previous Bug, the last
  execution, or any historical data. Publishing unassigned is allowed **only** as
  an explicit choice, never as a fallback for silence.
- **Priority** — **not written at all** by default, so the template's own default
  applies. Written only when the human explicitly asks for a value on that Bug.

*Reasoning:* the natural failure mode is copying the previous Bug's input file and
editing only the title. That silently republishes a stale assignee and severity
under a new bug's name — wrong in a way nobody reviews twice, because both fields
look deliberately filled. The tooling therefore **refuses** an input whose
assignee is absent, rather than defaulting it.

The severity and assignee on any already-published Bug are **historical data
about that one Bug** and must never become a default for another.

### 5.3 A publish is not finished at a Bug ID (decided 2026-08-17)

Creating a work item and getting an id back does not prove the item is correct: a
create can return 200 while a field was coerced, a relation dropped, or an
attachment stored unreadable.

**Every publish reads the Bug back and verifies it** — type, title, non-empty
repro steps, non-terminal state, Severity, Priority (default present, or the
explicit override), assignee, parent User Story link, related Test Case link, and
the attachment **downloaded** rather than merely linked.

On any mismatch the result is **`PUBLISH_VERIFICATION_FAILED`**, naming each
failed check with expected vs actual, **preserving the created Bug ID**, and
**never** creating a second Bug to compensate. This mirrors the Test Case
publisher's `--verify` (§6.2) and is re-runnable read-only via `--verify-only`.

### 5.4 Azure DevOps Bug field mapping is disjoint (human decision, 2026-08-23)

A Bug Candidate is **split across three Azure DevOps rich-text fields**, and each
piece of it lands in **exactly one**. The whole candidate is no longer dumped into
Repro Steps.

| Azure DevOps field | Reference name | Carries — and nothing else |
|---|---|---|
| **Description** | `System.Description` | Description |
| **Repro Steps** | `Microsoft.VSTS.TCM.ReproSteps` | Preconditions · Steps to Reproduce · Expected Result · Actual Result · Requirement Reference · Related Test Case |
| **System Info** | `Microsoft.VSTS.TCM.SystemInfo` | Environment (label **and** host) · Failure Classification · Evidence |

The Title stays in `System.Title`. Severity, assignee and Priority are unchanged
by this decision (§5.2), as are the story-scoped duplicate check (§5.1), the human
approval gate (invariant 2) and post-publish verification (§5.3). Evidence is
still uploaded as a real Azure DevOps attachment; the Evidence *note* in System
Info describes it.

*Reasoning:* Azure DevOps shows Description first — on board cards, query results
and the work item form header — so a Bug whose Description was empty read as
contentless everywhere except inside the Repro Steps field. Repeating the same
content in all three fields is worse than the empty Description: three
near-identical blocks give a reviewer no way to tell which is authoritative, and
they diverge the first time someone edits one.

**No content is dropped.** Every field of the Bug Candidate has exactly one home,
which is what makes the split checkable: `buildDescriptionHtml`,
`buildReproStepsHtml` and `buildSystemInfoHtml` in `src/ado/bug.ts` are the only
producers, and verification asserts **all three fields are non-empty separately**
— a single combined check would hide a whole missing section.

**Verified against real Azure DevOps.** The verification run, and any Bug that
predates this mapping, are recorded with the project they belong to — see
`docs/projects/NBO/decisions.md`.

**The mapping is enforced by the publishing code, not by convention.**
`bug.description` is now a *required* input (`publish-bug.ts` rejects an empty
one) because it is the sole content of the field Azure DevOps surfaces first.
Credentials and test secrets stay out of all three fields — test data is
referenced by handle (invariant 7).

## 6. Review and approval

**Human approval is the final authority.**

- The **AI performs a self-review first**, before any human sees the output.
- The **human then reviews test cases and bug candidates in local project
  files.**
- The agent **may generate and update** those local files, **including the
  review status field**.
- **The agent must never consider an artifact approved by itself.** Writing a
  status value is not approval.
- **Approval happens when the human explicitly states** which test cases or bugs
  are approved, rejected, or need changes.
- **Rejected items are removed or marked** according to the artifact lifecycle.
- **Every Azure DevOps write requires explicit human approval immediately before
  the external write.** Prior approval does not carry forward to a later write.
- **GitHub Pull Requests are not the approval mechanism.**

*Reasoning for AI self-review:* generation is cheap and review is the bottleneck.
Filtering redundant and low-value cases before a human looks is what keeps the
approval gate meaningful rather than a rubber stamp.

*Reasoning for the immediate-write gate:* the review status lives in a file the
agent can write, so the file alone cannot be the safety boundary. Requiring
approval at the moment of the external write puts the gate where the
irreversible action actually happens.

## 6.1 Review/Lifecycle Status — allowed values

Decided 2026-08-13, when the first test case artifact was implemented
(`docs/projects/<KEY>/test-cases/US-<id>/test-cases.md`). §3 left the state names undefined
until an artifact format existed; this closes that item.

| Status | Meaning | Who may set it |
|---|---|---|
| `Draft` | Generated, not yet self-reviewed | Agent |
| `AI-Reviewed` | Passed the AI self-review; awaiting human review | Agent |
| `Needs-Changes` | The human asked for changes | Agent, **only** on an explicit human statement |
| `Approved` | The human explicitly approved the item | **Human statement only** — the agent must never set this |
| `Published` | Created in Azure DevOps; the Azure DevOps ID field is filled | Agent, **only** after a confirmed write |
| `Rejected` | The human rejected the item | Agent, **only** on an explicit human statement |

**Rejected items are marked, not deleted** (§6). A rejected test case moves to a
*Rejected test cases* section at the end of its artifact with status `Rejected`
and **keeps its original ID, which is never reused.** A reused ID would silently
re-point an existing execution record, bug, or Azure DevOps link at different
content.

The same vocabulary applies to bug candidates when that artifact is built.

## 6.2 Publishing Test Cases to Azure DevOps

Decided and implemented 2026-08-13, when the first story's approved cases were published.

- **Test Cases are published as `Test Case` work items linked to the User Story
  with a parent-child hierarchy relation** (`System.LinkTypes.Hierarchy-Reverse`
  from the Test Case to the story). The `Tests`/`Tested By` link type was not used:
  the human asked for children, and the hierarchy link is what makes them appear
  under the story.
- **Children inherit the parent's Area Path and Iteration Path.** Otherwise they
  land in the project root, away from the story they belong to.
- **`System.State` is never set on create.** The process template chooses the
  initial state; forcing one breaks on any template whose Test Case workflow
  differs.
- **Azure DevOps Test Cases have no precondition or test-data field.** The internal
  Test Case ID, Project/Module/Feature-Page, Test Type, Requirement Reference,
  Decisions Applied, Precondition, Test Data and Notes are published in
  `System.Description`; the steps and their per-step expected results go in
  `Microsoft.VSTS.TCM.Steps`. Nothing approved is dropped.
- **One item per request, and the returned ID is written to the local artifact
  before the next create is attempted.** Batching would mean an interrupted run
  loses the record of items that really were created — and the next run would
  create them again.
- **Duplicate prevention is based on Azure DevOps state, not local state:** a case
  holding an Azure DevOps ID is never re-created, and a case without one is matched
  against the story's existing children by title before anything is written. A
  local file that lost an ID therefore cannot cause a duplicate.
- **Verification reads Azure DevOps** and checks child-ness, work item type, title,
  and **step count**. A title match alone would not catch a steps document that
  Azure DevOps accepted but stored empty.
- **`ADO_PAT_WRITE` requires only "Work Items (Read & write)".** The broader
  "manage" scope is not requested — it adds destroy and permissions capability this
  project never uses.

*Reasoning for the canary:* the first publish of a new story publishes one case,
which is verified before the rest follow. A wrong field mapping caught on item 1
costs one deletion; caught on item 52 it costs fifty-two.

*Reasoning:* the two agent-forbidden values (`Approved`, `Rejected`) are exactly
the two that represent human authority, and `Published` is the one that must
match external reality. Everything else describes work the agent legitimately
does on its own.

## 6.3 Need Automation — the automation-scope decision (decided 2026-10-07)

Phase 1 of the automation roadmap. Every generated Test Case carries a
`Need Automation` field in its metadata table, with value `Yes` or `No`.

- **`/write-test-cases` writes an initial recommendation** for every case. It
  weighs at least **feasibility, reliability/determinism, regression value and
  maintainability**, records a one-line reason per case in the AI self-review
  record, and must not default every case to `Yes`.
- **The recommendation is not approval, and not final.** The human may change
  any value in the local artifact. **The value in the artifact after human
  review is the source of truth for automation scope:** `Yes` is in scope,
  `No` is out.
- **Independent of every other field.** Need Automation is never derived from
  Review/Lifecycle Status, Test Type or publication, and never changes them.
  `Yes` does not approve a case; approval does not imply `Yes`. The approval
  model of §6 and §6.1 is unchanged.
- **Recorded values survive regeneration, whoever set them.** The artifact
  cannot tell a human edit from the agent's earlier recommendation, so every
  recorded value is treated as human-reviewed. A changed AI assessment goes in
  the self-review record, never into the cell. Only a case with no value gets a
  new recommendation.
- **Enforced by a check, not by discipline.** `npm run testcases:check`
  snapshots the artifact before regeneration and afterwards fails on any lost
  Test Case ID, Azure DevOps ID, human-set status or Need Automation value, and
  on any case without a value.
- **Strict values.** The parser accepts exactly `Yes` or `No`. A case with no
  row parses as *undecided* (null) — artifacts generated before this decision
  must still publish and verify — and undecided is never read as `Yes`.
- **Local only.** Need Automation is not written to Azure DevOps; `src/ado/`
  is unchanged.

*Reasoning:* automation is expensive to build and to maintain. Scoping it per
case at the point where the case is reviewed puts the choice in front of the
human who already understands the case, and keeps a cheap recommendation from
silently becoming a large maintenance commitment.

*Rejected:* deriving automation scope from approval (every approved case
automated). Approval answers "is this case correct?"; Need Automation answers
"is it worth scripting?". Fusing them would force a correct but unautomatable
case — an observation-only case, an OTP flow — either out of approval or into
a script that cannot be reliable.

*Rejected:* a separate provenance marker (AI vs human) on the value. It would
depend on the human remembering to flip it on every edit. Preserving every
recorded value needs no marker and cannot be forgotten.

## 7. Execution

- **The agent itself executes approved UI test cases.**
- The human can request a single test case, a group, or all approved test cases
  for a User Story or module.
- Per test case the agent: loads the approved local test case and its test data,
  loads the selected environment configuration, accesses credentials securely,
  opens the site, executes step by step, validates expected results, records the
  outcome, screenshots on failure, and performs failure analysis.
- **Test cases must be independently executable** (see §4).

**Login:** how the application under test authenticates — the flow, and whether
MFA, SSO or CAPTCHA is in play — is **project knowledge**, recorded in that
project's `docs/projects/<KEY>/profile.md` and `decisions.md`. What is fixed
here: credentials come from environment configuration, **never** from test case
definitions, and are referenced by handle.

**Browser technology:** Playwright MCP for AI-driven exploration and execution;
deterministic Playwright for repeatable automation execution. These are
different jobs — agent-driven execution is a bug-finding tool, deterministic
Playwright is the trustworthy regression oracle.

## 7.1 Playwright automation (automation Phase 2, decided 2026-10-09)

Four human decisions, approved together, plus one correction:

1. **`@playwright/test` is a pinned dev dependency** (exact version), with a
   Chromium-only browser install. The first dependency beyond `typescript` and
   `@types/node`; it is a dev dependency, and the zero-runtime-dependency rule
   (invariant 8) stands for everything else.
2. **`src/automation/config.ts` is the second module allowed to read
   `process.env`** (invariant 7), under the same rules as `src/ado/config.ts`:
   it reads the application-under-test label, base URL and handle values only;
   resolved credentials are registered with `redact()`; errors name variables
   and handles, never values.
3. **Handle -> variable convention.** An account handle `H` reads `H_USERNAME`
   and `H_PASSWORD`; a single-value handle reads `H`. Profiles declare handle
   **names**; values live in `.env` only.
4. **Layout.** The shared framework lives in `src/automation/`; project code
   lives in `automation/<KEY>/<Module>/` (`pages/` and `tests/`); plans live in
   `docs/projects/<KEY>/automation/<Module>/automation-plan.md`.
   **Correction (same day): automation is organised by Module, not by User
   Story.** One story can span modules and one module accumulates cases from
   many stories. The Test Case ID and User Story ID stay on every plan row and
   every spec.

**One framework.** One `playwright.config.ts` at the root defines exactly one
Playwright project — the active project, resolved by the usual rules (§12.3), so
an ambiguous project stops even a bare `npx playwright test`. There is no
per-project config, and `/automate-test-cases` may not create one.

**Scope** is computed by code (`src/automation/scope.ts`,
`npm run automation:scope`): **Need Automation = `Yes` (§6.3) AND status
`Approved` or `Published` (§6.1).** `No` is excluded; a missing value is
*undecided* and excluded, never read as `Yes`; an unapproved `Yes` case is
refused. Nothing is dropped silently — every exclusion is reported with its
reason. The skill never edits `test-cases.md`, so it cannot change a Need
Automation value or a status.

**Approval gate** — the existing one, not a new one: the skill writes an
**Automation Plan** and stops; code is generated only after an explicit human
approval of that plan in the same session (§16, `CLAUDE.md` approval gates).

**Automation status** per case, recorded in the Module's plan:
`PLANNED` · `GENERATED — NOT VERIFIED` · `AUTOMATED` (green once against an
allowed environment) · `NOT AUTOMATED — <CATEGORY>` with category one of
`MISSING_STABLE_LOCATOR`, `TEST_DATA_UNAVAILABLE`, `AUTH_FLOW_UNSUPPORTED`,
`FRAMEWORK_CAPABILITY_MISSING`, `ENVIRONMENT_UNAVAILABLE`, and a reason. **A
blocker never changes Need Automation** — the case stays `Yes` and stays listed.

**Traceability** uses Playwright's own tags and annotations, so it cannot drift
from the code: one spec per Test Case, named `TC-<story>-NNN.spec.ts`, its test
titled `TC-<story>-NNN — <title>`, tagged `@TC-<story>-NNN` and `@US-<story>`,
and annotated with the Test Case, story and Azure DevOps ID. `testCaseDetails()`
refuses an ID whose story segment disagrees with the story. *Which test
implements TC-X?* -> `npm run automation:list -- --grep @TC-X`.

**Environment guard.** `globalSetup` refuses every run unless the explicit
label is set, not PROD (checked **before** the allow-list, so no profile can
reach it), on the active profile's allow-list, and the profile-named base URL
variable (`Automation Base URL Variable`, `{ENV}` replaced by the label) is set.
Discovery (`--list`) needs no environment.

**Authentication** is a fresh UI login per test through the project's login
Page Object. **No `storageState` is saved**: a saved session is a credential on
disk (invariant 7).

### 7.1.1 Artifact safety — verified, not assumed (2026-10-09, Playwright 1.64)

`npm run automation:verify-artifacts` runs an offline, unauthenticated spec that
types sentinel values into a username and a password field, fails on purpose,
and searches everything Playwright wrote — and the console — for them.

| Finding | Result | Mitigation |
|---|---|---|
| `error-context.md` (written on every failure) embeds an ARIA snapshot of the page | **Leaked both values, the masked password in plain text** | `PLAYWRIGHT_NO_COPY_PROMPT` set by every config (`suppressPageSnapshots()`) |
| The same file embeds the failing matcher's **receiver** snapshot | **Leaked both values**; not covered by the variable above | Auto fixture `redactErrorContext` strips it before the file is written |
| `toMatchAriaSnapshot` on a container holding the password field | **Printed the password in the failure message itself** | Cannot be configured away -> ARIA-snapshot APIs are **forbidden** in automation code (`src/automation/code-safety.ts`, enforced by `npm test`) |
| Trace (`--trace on`) | **Password in action parameters, the action log and DOM snapshots** | `trace: 'off'`; `trace`/`video`/`.tracing` forbidden in specs — the policy, not a spec, decides both |
| Video (`video: 'on'`, §7.2.1) | Byte scan clean; **pixels not searchable** | Enabled by human decision with the STG risk accepted; verified for presence, location and genuine WebM format |
| A **failing `fill()`** prints its call log, which records `fill("<value>")` *(found 2026-10-09 while adding §7.2)* | **Password on the console and in `error-context.md`** | `redactErrorContext` now sanitises every error (`src/automation/sanitizer.ts`) before any reporter or file sees it; the report sanitises again runner-side, where step errors arrive unsanitised |
| Failure screenshot, console output (list reporter) | Clean | Kept: rendered pixels are the evidence format (§10.1) |

With these mitigations in place the check passes. **It must pass before any
credentialed automation runs, and again after any Playwright upgrade** — a new
version can start writing a new artifact on failure. Playwright output lives
under `.artifacts/` (gitignored). There is no Playwright HTML report; the QA
execution report of §7.2 is the HTML report, and the check scans it too.

**Deferred** to later phases: CI/CD, scheduled runs, Azure DevOps Test Runs and
Results, publishing Bugs from automation failures, dashboards, self-healing
locators, saved login sessions, per-handle variable overrides in a profile, and
more than one base URL per project.

## 7.2 HTML execution report (automation Phase 3, decided 2026-10-09)

Every automated run writes one human-facing QA report. **It is generated by a
Playwright reporter** (`src/automation/reporting/reporter.ts`) registered in
`playwright.config.ts` beside the `list` console reporter — so every run
produces one, including a bare `npx playwright test`, and **no spec has any
reporting responsibility**. The `list` output and `.artifacts/playwright-results/`
stay as the debugging output.

**Location** — append-only, gitignored, one directory per run:

```
.artifacts/reports/<KEY>/RUN-<NNN>/
  execution-report.html        standalone page: no script, no external resource
  execution-results.json       the same report, machine-readable
  bug-candidates/BUG-NNN.md    local Bug Candidates, Draft
  attachments/                 copied failure screenshots
```

**Contents.** Execution Summary (project, stories, modules, environment label
**and** host, start time, totals for PASS / FAIL / NOT RUN / NOT AUTOMATED,
duration, a PASS/FAIL verdict and bar, and a list of failed cases with their
failed step and reason); Test Case Results (one expandable row per case with
Test Case ID, User Story, ADO ID, title, status, duration, the Playwright spec,
and a step table of Step / Expected Result / Actual Result / status — failed
cases open by default on a *Why it failed* panel); and **Bug Reports**.

**Sources — nothing invented.** IDs come from the spec's `testCaseDetails`
annotations; step actions, Expected Results, title and module from the Test
Case artifact; status, durations, errors and screenshots from Playwright. A
spec with no annotation is shown as *not traceable*, never given an ID.

**Statuses.** `PASS` passed; `FAIL` failed or timed out; `NOT RUN` skipped —
e.g. `TEST_DATA_UNAVAILABLE`, never a FAIL; `NOT AUTOMATED` an in-scope case
(Need Automation = Yes AND Approved/Published) of an executed story that has no
spec, with the reason from its Module's Automation Plan. A case whose spec
exists but was filtered out of the run is omitted, not counted.

**Failure classification is automatic and provisional**, using the §9
vocabulary: network errors -> `NETWORK_ISSUE`; missing handle ->
`TEST_DATA_ISSUE`; environment refusal -> `ENVIRONMENT_ISSUE`; a failure outside
every Test Case step -> `UNKNOWN`; **a failed Expected Result assertion ->
`PRODUCT_BUG`** (suspected — including element-not-found, because a real defect
filed as a script problem disappears silently, §9); a UI action that could not
complete -> `TEST_SCRIPT_ISSUE`; otherwise `UNKNOWN`.

**Bug Candidates.** Only a `PRODUCT_BUG` on a traceable case becomes one. It is
written locally as a **Draft** — title, description, preconditions, steps to
reproduce (up to the failed step), test data by handle, expected and actual
result, requirement, related Test Case (internal and ADO ID), related User
Story, classification, environment, screenshots — and shown in Bug Reports.
**Nothing is created in Azure DevOps.** Severity and Priority are not proposed.
Publishing remains the separate, human-approved `/publish-bug` flow (§5),
given the candidate's file path.

**Security** — the same layer as §7.1.1, not a second one:
- Every Playwright string enters the report through `sanitizeText()` (the
  registered-secret redaction of invariant 7, plus the text-entry and ARIA
  rules) and is HTML-escaped on output. The runner process registers every
  declared handle value and secret-named variable first
  (`registerEnvironmentSecrets()`), because it never resolved them itself.
- Attachments are an **allow-list**: failure screenshots (`image/png`) and test
  videos (`video/webm`), each copied only when ALL hold — the allowed name and
  content type, the file exists, it lies **inside Playwright's output
  directory**, and its **bytes really are** a PNG / WebM. A spec cannot expose
  `.env` or anything else by attaching it as "video". `error-context.md`, traces
  and anything else Playwright attaches are never copied. The HTML references
  nothing outside the run's `attachments/`.
- `npm run automation:verify-artifacts` drives the report end to end on a
  synthetic project and scans the HTML, JSON, Bug Candidates and copied
  attachments with everything else.

### 7.2.1 Video recording for automated runs (human decision, 2026-10-09)

**Reverses** the "video stays off" position this section first took, and amends
§1 and §10 for automation. Decided explicitly by the human:

- **Playwright records a video of every automated test** — PASS, FAIL, and
  NOT RUN whenever Playwright had already started the test
  (`ARTIFACT_POLICY.video = 'on'`). A failed test's video is preserved: it is
  finalised when the test ends and copied into the report afterwards.
- **Videos are QA artifacts for the project testing team.** Automated runs
  target STG test data and environments only.
- **The risk of sensitive STG UI content appearing in a recording is
  explicitly ACCEPTED.** A video is never deleted, blanked or "sanitised away"
  for containing it. The leak check verifies a video's presence, location and
  format — it cannot search pixels, and by this decision it does not need to.
- **Videos complement screenshots; they do not replace them.** Screenshots stay
  failure-only.
- **Storage and retention are unchanged:** each video is copied to
  `.artifacts/reports/<KEY>/RUN-<NNN>/attachments/<TC-ID>.webm` (a second video
  of the same test is `<TC-ID>-2.webm`), beside `<TC-ID>.png`. `.artifacts/` is
  gitignored, local only, never committed, never sent to Azure DevOps, and runs
  are append-only with no automatic deletion — the same as all other evidence
  (whether evidence is ever committed remains an open item in `CLAUDE.md`).
- **The HTML report plays every video it has** (`<video controls>` plus a
  "▶ Play Video" link), for every outcome, and a Bug Candidate carries the
  failing test's video beside its screenshot.
- **The PROD block is unchanged.** Recording changes nothing about which
  environment may run: `globalSetup` still refuses PROD and any label not on the
  active profile's allow-list before a browser starts. Video is a method-level
  policy, so it applies to every allowed non-PROD environment of every project —
  today that is STG, NBO's only allowed environment.
- **Agent-driven MCP execution still records no video** (§10).

*Rejected:* recording only failures (`retain-on-failure`) — the human wants a
passing run's recording too, as evidence of what passed.

**Environment** is recorded as label and host verbatim (§12.1). The host is
configuration, not a secret; the base URL's path is not shown.

## 8. Execution status definitions

Use these exactly; report numbers are meaningless if they drift.

| Status | Meaning |
|---|---|
| **PASS** | The test case was executed successfully and **all** expected results were satisfied. |
| **FAIL** | The test case was executed, but **one or more** expected results were not satisfied. |
| **BLOCKED** | Execution **could not proceed** because of an external blocker — unavailable environment, authentication issue, network issue, missing required dependency, or another condition preventing execution. |
| **SKIPPED** | The test case was **intentionally not executed** because the execution scope or the user explicitly excluded it. |

## 9. Failure classification

**A failed test case must not automatically become a bug.** The agent classifies
first:

`PRODUCT_BUG`, `TEST_DATA_ISSUE`, `ENVIRONMENT_ISSUE`, `NETWORK_ISSUE`,
`AUTHENTICATION_ISSUE`, `TEST_SCRIPT_ISSUE`, `UNKNOWN`

- **Retry when appropriate before final classification.**
- **Every failure stays visible in the execution report regardless of
  classification.**
- Only a likely `PRODUCT_BUG` proceeds to bug candidate -> human review ->
  approval -> creation in Azure DevOps.

*Reasoning:* misclassification is asymmetric. A false `PRODUCT_BUG` costs one
review click; a real bug filed as `ENVIRONMENT_ISSUE` disappears silently.
Classification therefore decides the *default action*, never whether a human sees
the failure.

## 10. Evidence

- No video for agent-driven (MCP) execution. **Automated Playwright runs record
  a video of every test** — human decision 2026-10-09, §7.2.1.
- **Screenshot on failure.** Successful executions do not require screenshots.
- Automation failures may additionally capture screenshots and logs.
- Evidence is associated with the relevant execution and, where applicable, the
  bug candidate.
- Screenshots may contain sensitive information; privacy risk is acknowledged and
  must be considered wherever evidence is stored, sent to a model, or attached to
  a work item.

### 10.1 Execution evidence rules (decided 2026-08-16, from the RUN-001 canary)

Learned by executing a real login case, not by design review.

- **Accessibility snapshots are never persisted as evidence.** The Playwright
  accessibility tree returns typed input values **in plain text — including a
  password the UI masks on screen.** Snapshots remain the right tool for reading
  UI state and targeting elements in-session; they are simply never written to
  disk as evidence.
- **Rendered screenshots are the evidence format**, and only when they expose no
  secret. Where a credential was entered or revealed, the masking is confirmed
  before the image is kept; an image showing a credential is **discarded** and
  described in words instead.
- **Execution results are versioned; evidence is gitignored.**
  `execution-results.md` is committed so results are traceable and reviewable.
  `evidence/` stays local because screenshots may carry credentials, PII or
  internal product detail (§10). Whether evidence should ever be committed is an
  open human decision, not an agent default.
- **A settle/wait is mandatory before judging an asynchronous result.** In the
  canary the app still showed `/login` immediately after submit and completed
  navigation moments later — judging then would have produced a **false FAIL** on
  an authentication case, the exact shape of a bogus bug report. A false FAIL
  caused by insufficient settling is a **`TEST_SCRIPT_ISSUE`**, never a
  `PRODUCT_BUG`.

### 10.2 Execution runs are append-only (decided 2026-08-16)

Every execution gets a fresh `RUN-<NNN>` directory under
`docs/projects/<KEY>/executions/US-<id>/`. **A previous run is never overwritten**, including a
re-run of the same case after a fix. Overwriting would erase the evidence that a
result is intermittent — the single most valuable signal a run history carries.

Execution artifacts are kept **structured enough for a future Azure DevOps Test
Run publisher to consume**. That publisher is deliberately **not built**:
execution performs **no Azure DevOps writes at all** (no Test Run, no Test Result,
no Bug), and adding one is a separate capability under its own approval gate.

### 10.3 Web execution is a Skill, not TypeScript (decided 2026-08-16)

Web execution lives in `.claude/skills/execute-test-cases/SKILL.md` rather than in
`src/`, unlike the reader and publisher.

*Reasoning:* the reader and publisher are deterministic transforms against a
stable API, which is exactly what code is good at. Agent-driven execution is a
**judgement** task — reading an unfamiliar UI, deciding whether an expected result
was met, and classifying why something failed. Encoding that as code would freeze
brittle selectors per application; encoding it as a skill keeps it generic across
applications and makes the *rules* the asset. Deterministic Playwright is a
separate capability with a different purpose (§7, §7.1) — a regression oracle
rather than a bug-finding tool — built by the `automate-test-cases` skill.

The skill is granted browser tools **except** `browser_run_code_unsafe` and
`browser_evaluate`. Arbitrary JavaScript in the page would let execution bypass
every rule the skill enforces, including the credential and PROD restrictions.

## 11. Reporting and traceability

Execution reports contain at minimum: execution summary, total test cases,
passed, failed, blocked, skipped, failures, bugs, environment, timestamp.
Reports are stored as project artifacts.

Traceability chain to preserve wherever applicable:

```
User Story -> Requirement -> Test Case -> Execution -> Evidence -> Bug
```

## 12. Environment configuration and credentials

- **Environment configuration is external to test cases** (base URL per
  environment). The human selects the target environment per run, e.g. "run the
  {MODULE} module on {ENVIRONMENT}".
- **Environments are allow-listed and PROD is blocked by default.** The agent may
  execute only against environments explicitly allowed **by the active project's
  profile**. An environment not on that project's allow-list must never be used,
  and **any PROD execution or PROD write requires explicit human confirmation.**
  A project profile may add an allowed non-PROD environment; it **cannot**
  unblock PROD.
- **Credentials are never stored in test case files.** They live in a local
  `.env`, gitignored, with `.env.example` documenting variable names only.
- `.gitignore` protects secrets only if it is configured before secrets exist —
  it was created first, before any `.env` was written.

### 12.1 Environment labels are never inferred from a hostname

A hostname carries **no authority** over which environment it is. A host may be
named `-dev-` and be the team's STG target; a host named `-stg-` may be
something else entirely. The agent decides the environment from the **explicit
label** (`APP_ENV`) checked against the project's allow-list, and never from the
name of the machine.

The agent must not treat a host as allowed because its name looks familiar, and
must not treat a host as disallowed because its name says dev.

**Every execution artifact records the environment label AND the target host
verbatim**, because they can legitimately disagree and a later reader must be
able to see exactly which machine produced a result.

*Which host is which environment is project knowledge*, recorded in that
project's `docs/projects/<KEY>/profile.md` and `decisions.md` — see
`docs/projects/NBO/decisions.md` §12.1 for the decision that produced this rule.

### 12.2 Method and project knowledge are separate (decided 2026-08-25)

This repository serves **more than one project**. Two kinds of content were
previously interleaved in the same files, and are now separated:

| Kind | Lives in | Applies to |
|---|---|---|
| **Method** — invariants, approval gates, the PROD block, evidence rules, execution statuses, failure classification, artifact formats | `CLAUDE.md`, this file, `.claude/skills/**` | **Every** project |
| **Project knowledge** — environments and hosts, test-data handles, modules, terminology, title token, engagement state, per-story decisions | `docs/projects/<KEY>/` | **One** project |

**A project profile may narrow what the agent does; it may never widen it.** It
can decline an environment the method allows, but it cannot enable PROD, waive an
approval gate, permit a write the method forbids, or relax an evidence or
credential rule. Every safety control is defined at the method layer precisely so
that no project file can turn it off.

*Reasoning:* the two were fused, so onboarding a second project meant diffing a
long decision record and guessing which paragraphs were about the first client.
Worse, a rule and an example of it read the same on the page — making it easy to
"generalise" a real safety rule while copying a project fact into the method.

### 12.3 The active project is explicit, never inferred (decided 2026-08-25)

With several projects in one repository, **every command and skill establishes
the active project before reading or writing anything.**

Resolution order, most explicit first:

1. An explicitly supplied key — `--project <KEY>`, or the key a skill was given.
2. `QA_ACTIVE_PROJECT` in the environment.
3. The sole project, **only** when exactly one profile exists.

**When several projects exist and none is named, the agent stops and asks.** It
must never pick one, never infer the project from a story ID, and never search
every project for a matching file and use whichever it found. Implemented in
`src/projects/active-project.ts`; a failure surfaces as `ProjectError`.

*Reasoning:* a wrong guess is silent in both directions — it runs an execution
against the wrong application, or publishes one project's Test Cases onto another
project's board. Story IDs are unique per Azure DevOps project, not globally, so
an ID is not evidence of ownership. Being asked once is far cheaper than either.

The single-project convenience is deliberate and self-limiting: it applies only
while the repository holds one profile, and turns into an error the moment a
second appears.

### 12.4 Profile drift is caught by a test, not by discipline (decided 2026-08-25)

A project's `profile.md` declares its test-data handles; its Test Cases
reference them. Nothing structural keeps the two in step, so they drift — a new
case introduces a handle nobody added to the profile.

**`tests/profile-drift.test.ts` fails the build when a Test Case uses a handle
its project's profile does not declare.** It is project-agnostic: it discovers
whatever projects exist and asserts nothing about any particular one.

The check is deliberately **one-directional**:

- **Used but not declared → FAIL.** Execution would reach for test data the
  project never defined, and the gap would otherwise surface only at execution
  time as a `BLOCKED` run — after a browser had already been started against a
  live environment.
- **Declared but not used → reported, never failed.** A profile legitimately
  describes test data before any case consumes it.

**The test never invents a handle to make itself pass**, and neither may the
agent. Only a human knows whether the profile or the Test Case is the side that
is wrong, so the failure names the handle and the story and stops there.

## 13. Azure DevOps versus local files

- **Azure DevOps is the official published record** for User Stories, Test
  Cases, Bugs, and the relationships between them.
- **Approved local test case artifacts are the execution/working source.** The
  agent does not re-fetch all test cases from Azure DevOps to execute them.
- Local artifacts maintain traceability to the Azure DevOps User Story ID and
  Test Case ID.
- **On conflict** between a local approved artifact and an externally modified
  Azure DevOps test case, the agent must not silently overwrite or ignore it.
  **The conflict requires a human decision.**

## 14. User Story changes

- **No continuous automatic monitoring in V1.** The human tells the agent a User
  Story has changed.
- The agent then reads the updated story, identifies the changes, analyses
  impact, identifies affected test cases, proposes updates, runs the normal AI
  review, and requires human approval again.
- A lightweight fingerprint/version mechanism may be used to help detect that the
  source changed. Azure DevOps supplies `System.Rev` and `System.ChangedDate`,
  which give this nearly free.

### 14.1 Analysis sources: User Story, optional API specification, optional UI (decided 2026-10-09)

`/analyze-story` is the first analysis and exploration step. It may combine up
to three sources:

| Source | | Role |
|---|---|---|
| User Story + Markdown attachments | **Required** | **The business source of truth** — unchanged |
| API specification — OpenAPI 3, Swagger 2, or Postman Collection v2.x (JSON) | Optional, `--api <path>` | Supporting technical evidence, tagged **[API]** |
| Application UI, explored through Playwright MCP | Optional, **opt-in** `--ui` / `--ui-account <HANDLE>` | Observed current behaviour, tagged **[UI]** |

- **An optional source never blocks an analysis.** Absent or unusable, it is
  recorded — `API source: Not provided` / `Not used — <reason>`,
  `UI exploration: Not performed — <reason>` — and the analysis proceeds from the
  story. `/analyze-story <ID> --project <KEY>` alone behaves exactly as before.
- **Hierarchy.** **[D]** decisions, then **[E]** story and attachments, are the
  requirement. **[API]** and **[UI]** are evidence; neither ever becomes a
  requirement, overrides one, or overwrites a decision. **Disagreement between
  sources is recorded side by side and raised as an open question** — never
  merged, never "corrected" either way.
- **Deterministic parts are code.** `npm run analysis:preflight` decides each
  optional source's status, detects what changed since the last analysis, and
  prints the provenance rows; `npm run api:read` extracts the relevant operations.
  Both are read-only. The UI decision reuses the automation environment guard
  (§7.1), so exploration obeys the same allow-list and the same PROD block,
  enforced in code.
- **API specifications: names, never values.** The reader emits operations,
  fields, types, constraints, enums, status codes, auth scheme names and
  request dependencies — never an example, header value, variable value or
  credential. **The specification file is never copied into the repository**:
  Postman collections routinely hold tokens and passwords. The analysis records
  its path and sha256 instead. JSON only — zero dependencies (invariant 8)
  means no YAML parser; YAML is reported as unusable, never guessed at.
- **UI exploration is read-only observation.** Allowed non-PROD environment only,
  credentials by handle into memory only, no state-changing submission, no
  approval or rejection, settle before observing, and no snapshot or screenshot
  persisted (the Skill is not granted the screenshot tool). An authentication flow
  it cannot drive (OTP, CAPTCHA, SSO) ends exploration with a recorded reason.
- **Provenance and change detection.** The analysis records, beside the existing
  `Content fingerprint`, an `API source` row (type, version, path), an
  `API source sha256` row, and a `UI exploration` row (environment label and
  host when performed). A changed sha256 or a newly supplied specification asks
  for a refresh; a specification analysed before but not supplied now is noted,
  not a change. UI exploration is live observation and never triggers a refresh
  by itself. **The story fingerprint and its rule are unchanged**, and analyses
  written before this decision parse as `API source: Not provided`.

*Rejected:* snapshotting the API specification under `source/` like Markdown
attachments — a committed Postman collection is a committed credential.
*Rejected:* exploring the UI whenever an environment is configured — a browser
session against a shared environment is a deliberate act, so it is opt-in.

## 15. Coverage — definition of done

Test case generation is "done" for a User Story when:

- All applicable requirements and acceptance criteria have meaningful test case
  coverage.
- Positive scenarios are covered.
- Negative/validation scenarios are covered where applicable.
- Boundary/edge cases are covered where applicable.
- Required business rules are covered.
- Important state/dependency scenarios are covered.
- No unnecessary duplicate test cases are created.

**Do not chase an arbitrary percentage such as 100%** unless it represents
meaningful requirement coverage.

## 16. Human control

The agent may analyse, generate, review, execute, classify, and recommend.
Externally visible or destructive actions require human approval — at minimum:

- Publishing test cases to Azure DevOps
- Creating bugs in Azure DevOps
- Generating automation code after the automation plan review
- Any action against an environment not allow-listed by the active project

## 17. Project goal

The project is also intended to demonstrate strong AI engineering practices:
Claude Code, `CLAUDE.md`, Skills, Agents, Commands, MCP, human-in-the-loop
workflows, AI review, structured artifacts, traceability, safe external
integrations, and AI-assisted automation.

**The initial implementation must not be over-engineered.** Components are
created when the workflow genuinely requires them — the workflow decides what
exists, not a feature checklist.

## 18. Documentation synchronization is part of Definition of Done (decided 2026-08-17)

Documentation sync is **not** an optional or deferred step. Whenever a meaningful
change lands anywhere in the project, the agent checks — **in the same task** —
whether it affects any of three surfaces, and updates them immediately:

- `.claude/skills/**/SKILL.md`
- `CLAUDE.md`
- `docs/product-decisions.md`

```
PROJECT CHANGE -> identify affected documentation -> update Skill(s)
  -> update CLAUDE.md -> update product decisions when durable
  -> validate -> continue the requested task
```

**The agent must not** report staleness instead of fixing it, defer an update,
wait to be asked, or leave a known inconsistency. **It does not ask permission**
for these updates.

**A task is not complete** while an affected Skill is stale, `CLAUDE.md` is stale,
a durable decision is unrecorded, a Skill names a changed CLI interface, or
documentation points at a moved path.

**Triggers:** CLI command added or changed · new MCP server/tool · execution or
publishing workflow change · security rule change · artifact path or directory
change · product/workflow decision · a Skill created, removed, renamed or
materially changed · an implementation that proves an existing Skill instruction
wrong (fix it immediately rather than preserving stale text).

**Not triggered by** implementation detail with no effect on workflow, Skill
behaviour, CLI interfaces, architecture, security, MCP configuration, artifact
structure, product decisions, or project-level rules.

**The one thing that still requires the human:** new documentation content that
encodes a genuine product or workflow decision which cannot be derived from the
implementation or an already-recorded decision. Even then, everything technically
determinable is updated and only the unresolved decision is flagged.

*Reasoning:* this project's durable state lives in files, and its safety rules are
enforced by Skills that a future session reads as instructions — so a stale Skill
does not merely misinform, it **actively directs the next run to do the wrong
thing**. That was observed concretely: `execute-test-cases` kept an "or area"
duplicate-check scope after §5.1 narrowed it, and any run following that text
would have repeated a corrected mistake. Documentation drift here is a defect in
the system's behaviour, not a tidiness issue, so it is closed in the same task
that causes it.

---

## Technical decisions

| Decision | Detail |
|---|---|
| Language / runtime | TypeScript on Node.js (Node 24 present) |
| Azure DevOps access | REST API directly |
| Azure DevOps MCP | **Not used for the core pipeline.** Rejected for V1 — see below |
| Runtime dependencies | **Zero by default.** Node natives cover TypeScript execution, `.env` loading, `fetch`, and timeouts. A new runtime dependency requires a clear technical reason and human review |
| Dev dependencies | `typescript`, `@types/node`, and `@playwright/test` pinned to an exact version (§7.1, human-approved 2026-10-09). Chromium is the only browser installed |
| Credential model | **Separate read and write PATs.** `ADO_PAT_READ` for reads; a write-scoped credential is introduced **only** when Azure DevOps publishing is implemented |
| Repository visibility | Private |
| Commit convention | **Conventional Commits** — `feat`, `fix`, `docs`, `refactor`, `test`, `chore` |

---

## Rejected alternatives

Recorded so they are not reopened without new information.

| Rejected | Why |
|---|---|
| **GitHub Pull Requests as the test case review mechanism** | Proposed because Git provides review UI, approval records, versioning, diffing, and audit for free. **Declined** — review happens in local project files, and approval is an explicit human statement plus a gate immediately before each external write (§6). |
| **Azure DevOps MCP server for the core pipeline** | Returns raw, verbose Azure DevOps JSON into model context, exposes read and write tools in one surface, and leaves no place for normalisation, fingerprinting, or the error taxonomy. May still be useful later for ad-hoc human queries alongside — not underneath — the integration. |
| **Azure DevOps SDK** (`azure-devops-node-api`) | Auto-generated and heavy for the ~8 endpoints this project needs. |
| **Azure DevOps Test Plans as the execution runner** | Superseded: the agent executes test cases itself, so the tool does not complement the native runner. Consequence accepted: native ADO run history and test reporting are not used, so the project's own reporting is the only reporting. |
| **Automatic change detection for User Stories** | Postponed in V1; human-triggered instead (§14). |
| **Screenshots on successful execution** | Declined. Residual risk noted: an agent-claimed PASS carries no evidence and is therefore unverifiable. A step-by-step action log was suggested as a near-free mitigation; not adopted. |
| **Automation artifacts organised per User Story** | Corrected 2026-10-09 by the human: automation is organised by **Module** (§7.1). A story can span modules, and a module's page objects and plan are shared by every story that touches it. |
| **Saving a login session (`storageState`) to speed up automation** | Deferred, not adopted: a saved session is a live credential on disk (invariant 7). Fresh UI login per test until a separate decision says otherwise. |
| **Automation as a distant final phase** | Reversed — automation now begins shortly after manual execution (§2), because deterministic Playwright is the only trustworthy regression oracle. |
| **Widening the V1 reader to `Product Backlog Item`** | Declined for V1. `User Story` only; design stays extensible (§3). |
