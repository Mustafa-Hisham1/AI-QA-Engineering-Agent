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
- **Video recording is out of scope.**

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

**Title convention (mandatory):**

```
[Project][Module][Feature/Page] <Test Scenario>
```

Example:

```
[NBO][Country][Add Country] Verify Country is created successfully when valid
data is entered and Submit is clicked
```

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
  values, duplicates, emojis, and anything else the scenario needs. For example:
  a valid Country Name, a numeric-only Country Name, special characters, a
  duplicate Country Code, invalid values.
- A test case should be self-contained enough to execute its own scenario.
- **Environment-wide configuration such as base URLs belongs in environment
  configuration, not in test data.** Credentials never appear in test cases.
- **For stateful scenarios that require unique data, the agent may generate
  unique data at runtime** so that test cases remain independently executable.
- **A test case must never depend on another test case having run first.**

## 5. Bug structure

Title, Description, Steps, Expected Result, Actual Result, Environment,
Severity, Priority, Evidence, Related Test Case, Related User Story.

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

*Context:* this was decided when Bug 55482 was created from US 53717. A
project-wide search had surfaced Bug **43084** *"Missing 'Remember Me' Checkbox in
Design and Implementation"* — Closed as *Fixed and verified*, under a different
parent (33633) and area path (`NDCIntegrations\Integration - 2`). The human ruled
it **out of scope for this workflow**, and the Bug was created under US 53717.

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

Bug 55482's `4 - Low` / Zeyad Nasser assignment is **historical data about one
Bug** and must never become a default.

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
(`docs/test-cases/US-53717/test-cases.md`). §3 left the state names undefined
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

Decided and implemented 2026-08-13, when US 53717's 52 approved cases were published.

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

## 7. Execution

- **The agent itself executes approved UI test cases.**
- The human can request a single test case, a group, or all approved test cases
  for a User Story or module.
- Per test case the agent: loads the approved local test case and its test data,
  loads the selected environment configuration, accesses credentials securely,
  opens the site, executes step by step, validates expected results, records the
  outcome, screenshots on failure, and performs failure analysis.
- **Test cases must be independently executable** (see §4).

**Login:** STG uses a normal username/password flow. The agent enters the
configured username and password and clicks Login. There is currently no MFA,
SSO redirect, or CAPTCHA blocking this. Credentials come from environment
configuration, never from test case definitions.

**Browser technology:** Playwright MCP for AI-driven exploration and execution;
deterministic Playwright for repeatable automation execution. These are
different jobs — agent-driven execution is a bug-finding tool, deterministic
Playwright is the trustworthy regression oracle.

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

- No video.
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
`docs/executions/US-<id>/`. **A previous run is never overwritten**, including a
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
applications and makes the *rules* the asset. Deterministic Playwright remains a
separate, later capability with a different purpose (§7) — a regression oracle
rather than a bug-finding tool.

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
  Country module on STG".
- **Environments are allow-listed and PROD is blocked by default.** The agent may
  execute only against explicitly allowed environments. **STG is the only allowed
  environment today.** UAT and PROD must be explicitly configured and selected
  when introduced, and **any PROD execution or PROD write requires explicit human
  confirmation.**
- **Credentials are never stored in test case files.** They live in a local
  `.env`, gitignored, with `.env.example` documenting variable names only.
- `.gitignore` protects secrets only if it is configured before secrets exist —
  it was created first, before any `.env` was written.

### 12.1 The STG host is named `-dev-` (human decision, 2026-08-16)

The Admin Panel environment the team uses as **STG** for this project has a
hostname containing **`-dev-`**:

```
https://ndc-apis-nbo-frontend-dev-…northeurope-01.azurewebsites.net
```

The human confirmed explicitly that this host **is** the intended STG target for
execution, and that the `-dev-` in the name is naming only.

**The environment is STG by human decision, never by inference from the
hostname.** `APP_ENV=STG` in `.env` is what the allow-list checks; the hostname
carries no authority. The agent must not treat a `-dev-`, `-uat-` or any other
host as allowed because a name looks familiar, and must not treat this host as
disallowed because its name says dev.

**Every execution artifact records the target host verbatim** alongside the
environment label, so no later reader can mistake which machine produced a
result. Recorded in `docs/executions/US-53717/RUN-001/execution-results.md`.

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
- Any action against a non-STG environment

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
| **Automation as a distant final phase** | Reversed — automation now begins shortly after manual execution (§2), because deterministic Playwright is the only trustworthy regression oracle. |
| **Widening the V1 reader to `Product Backlog Item`** | Declined for V1. `User Story` only; design stays extensible (§3). |
