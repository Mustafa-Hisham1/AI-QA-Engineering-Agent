# NBO — Project Decisions

Human decisions that apply to **NBO only**. The shared methodology lives in
`CLAUDE.md` and `docs/product-decisions.md`; nothing here may weaken a rule
defined there.

Per-story decisions stay with their story in
`docs/projects/NBO/requirements/US-<id>/decisions.md`. This file carries
decisions that span the project.

---

## 12.1 The STG host is named `-dev-` (human decision, 2026-08-16)

The Admin Panel environment the team uses as **STG** has a hostname containing
**`-dev-`**:

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
result. Recorded in
`docs/projects/NBO/executions/US-53717/RUN-001/execution-results.md`.

## Duplicate-check scope — the case that settled it (2026-08-16)

The **rule** is shared methodology (`docs/product-decisions.md` §5.1): the
duplicate check is scoped to the User Story that owns the executed Test Cases.
The NBO case that produced it is recorded here.

Decided when Bug 55482 was created from US 53717. A project-wide search had
surfaced Bug **43084** *"Missing 'Remember Me' Checkbox in Design and
Implementation"* — Closed as *Fixed and verified*, under a different parent
(33633) and area path (`NDCIntegrations\Integration - 2`). The human ruled it
**out of scope for this workflow**, and the Bug was created under US 53717.

## Disjoint Bug field mapping — the verification run (2026-08-23)

The **mapping** is shared methodology (`docs/product-decisions.md` §5.4). The
NBO evidence that it works is recorded here.

Bug **56329** (US 56109, 2026-08-23) was published as a deliberate workflow test,
reusing Bug 55482's content as dummy data, then read back and checked phrase by
phrase — **20 separation checks**: each of the ten Bug Candidate sections appeared
in exactly one field, each of the nine headings in exactly one field, and
Description carried no section heading at all. Record:
`docs/projects/NBO/executions/US-56109/RUN-000/bug-candidates/BUG-CANDIDATE-001.md`.

**Bug 55482 predates this decision** and still carries the old
all-in-Repro-Steps layout. Azure DevOps is the record for it
(`docs/product-decisions.md` §13), so remapping it is a human decision, not a
silent migration.

## Execution scope — Admin Panel only (human decision, 2026-08-13)

Only **Admin Panel** cases are queued for manual execution. The Agent Portal
cases of US 53717 are published but not scheduled.

## Login flow (STG)

STG uses a normal username/password flow. The agent enters the configured
username and password and clicks Login. There is currently **no MFA, SSO
redirect, or CAPTCHA** blocking this. Credentials come from environment
configuration, never from test case definitions.

## Per-story decisions

| Story | Decisions | File |
|---|---|---|
| US 53717 — Login | D-01…D-12 | `requirements/US-53717/decisions.md` |
| US 52860 — City | D-01…D-05 | `requirements/US-52860/decisions.md` |
