# Project Profile — NDC-CORE

> **STATUS: PLACEHOLDER — NOT CONFIGURED.**
> Every value below marked `TBD` is **unset**, not empty-by-accident. No fact in
> this file has been confirmed by a human, and none has been inferred from NBO.
>
> **The agent must not execute, publish, or generate test cases for this project
> until a human fills these in.** A skill that needs a `TBD` value must stop and
> ask, never assume one and never borrow NBO's.

This file exists to make the multi-project structure real and to give onboarding
a single place to land. It is deliberately empty of content rather than filled
with plausible guesses — a plausible guess here would send an execution at the
wrong host with the wrong credentials.

**This file is project knowledge, not methodology.** How the agent works — the
invariants, the approval gates, the PROD block, the evidence rules, the execution
statuses and the failure classification — lives in `CLAUDE.md` and
`docs/product-decisions.md` and is **already shared by every project**, including
this one. Nothing here may weaken a rule defined there.

---

## Settings

| Setting | Value |
|---|---|
| Project Key | NDC-CORE |
| Project Name | TBD |
| Tracker | Azure DevOps |
| Tracker Project | TBD — set `ADO_PROJECT` in `.env` for this project |
| Supported Work Item Type | User Story |
| Title Project Token | TBD |
| Allowed Environments | **None configured** |
| Environment Label Variable | APP_ENV |
| Artifact Root | docs/projects/NDC-CORE |

## Environments

**No environment is allowed for this project yet.** Until a human configures one
and states its label explicitly, **every execution request must stop**.

| Environment | Status | URL variable |
|---|---|---|
| STG | **Not configured** | TBD |
| UAT | **Not configured** | — |
| PROD | **Blocked** | — |

PROD is blocked by the shared methodology (`docs/product-decisions.md` §12,
invariant 5) and **cannot be enabled by editing this file**.

The environment label is never inferred from a hostname. `APP_ENV` is what the
allow-list checks.

## Modules in scope

TBD — no module has been scoped for this project.

## Title convention

```
[<Title Project Token>][<Module>][<Feature/Page>] <Test Scenario>
```

The shape is defined by the shared methodology (`docs/product-decisions.md` §3).
The project token is **TBD** and must be set before any test case is generated —
the artifact parser rejects a title that disagrees with its structured fields.

## Test data handles

**None defined.** Test Cases reference test data by handle, never by value, and
handles resolve from `.env` at execution time. A missing handle is `BLOCKED` /
`TEST_DATA_ISSUE`, never a FAIL.

Do **not** reuse NBO's handles here. They name NBO accounts in an NBO
environment; pointing an NDC Core case at one would either fail confusingly or,
worse, act on the wrong system.

| Handle | Purpose | Configured |
|---|---|---|
| TBD | TBD | No |

## Terminology

TBD — record any term whose meaning in this project differs from its ordinary
reading, so an analysis does not quietly import NBO's vocabulary.

## Artifacts

```
docs/projects/NDC-CORE/profile.md                    this file
docs/projects/NDC-CORE/decisions.md                  project-specific decisions
docs/projects/NDC-CORE/requirements/US-<id>/         analysis, decisions, source snapshot
docs/projects/NDC-CORE/test-cases/US-<id>/           the Test Case set
docs/projects/NDC-CORE/executions/US-<id>/RUN-<nnn>/ execution runs, evidence, bug candidates
```

## Onboarding checklist

- [ ] Confirm the Azure DevOps project name and set `ADO_PROJECT`
- [ ] Confirm the title project token
- [ ] Configure at least one non-PROD environment and its URL variable
- [ ] Define the test data handles this project needs
- [ ] Record any project-specific terminology
- [ ] Record the first project-level decisions in `decisions.md`
