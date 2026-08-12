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
| Read User Story by ID | Not built | — |
| Read User Story attachments | Not built | — |
| Test case generation / review / publishing | Not built | — |
| Web execution, bugs, reporting, automation | Not built | — |

**Next capability:** read a User Story by ID and return normalised information
(HTML->markdown, `System.Rev` + content fingerprint, attachment metadata).

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
   `src/ado/http.ts` exposes `getJson()` only. Never add post/patch/put/delete
   to it. Writes will live in a separate module loading its own write-scoped
   credential (`ADO_PAT_WRITE`, introduced only when publishing is implemented),
   so the read path stays incapable of modifying Azure DevOps.

4. **Reads are safely retryable; writes are not.** Never blind-retry a write —
   that is how duplicate Test Cases and Bugs get created in Azure DevOps.

5. **Environments are allow-listed. PROD is blocked by default.** The agent may
   act only against explicitly allowed environments. **STG is the only allowed
   environment today.** UAT and PROD must be explicitly configured and selected;
   any PROD execution or PROD write requires explicit human confirmation.

6. **No Azure DevOps field names outside `src/ado/`.** No `System.*` or
   `Microsoft.VSTS.*` reference anywhere else in the codebase. Checkable:
   `grep -rn "Microsoft.VSTS\|System\." src --include=*.ts` should only hit
   `src/ado/`.

7. **Secrets never leave `.env`.** `src/ado/config.ts` is the only module that
   reads `process.env`. Every error message passes through `redact()` in
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

```bash
npm run ado:check            # read-only Azure DevOps connectivity check
npm run ado:check -- --json  # machine-readable output
npm run typecheck            # tsc --noEmit, strict
```

Configuration lives in `.env` (gitignored, human-provided). `.env.example`
documents the required variables with empty placeholders.

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

None currently open. Add here when a project-level question is raised but not
yet decided, and remove the entry when it is answered.

One detail to settle when the test case artifact is first implemented: the
allowed values of the *Review/Lifecycle Status* field, and how rejected items are
removed or marked. The rule is agreed (see `docs/product-decisions.md` §6); the
concrete state names are not yet defined because no artifact format exists.
