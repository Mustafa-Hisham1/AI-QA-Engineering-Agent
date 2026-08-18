# Bug publishing input — schema

The input file consumed by `npm run bug:publish -- <input.json>`
(`src/cli/publish-bug.ts`). It is the machine-readable form of a **human-reviewed
Bug Candidate**, plus the metadata the human approved for that specific Bug.

**It is generated per Bug and thrown away after publishing.** It is *not* a
template to copy from a previous Bug — see *Never inherit* below.

**Never put a credential in this file.** Test data is referenced by **handle**
(`ADMIN_VALID`), exactly as in Test Cases and execution artifacts (invariant 7).

---

## Shape

```jsonc
{
  "bug": {
    "title":                  "string  — [Project][Module][Feature/Page] <Scenario>",
    "description":            "string",
    "preconditions":          ["string", "..."],
    "steps":                  ["string", "..."],   // steps to reproduce, in order
    "expectedResult":         "string  — as the Test Case states it",
    "actualResult":           "string  — what was observed",
    "environmentLabel":       "string  — e.g. STG. The LABEL, never inferred from a hostname",
    "environmentHost":        "string  — target host, recorded verbatim",
    "requirementReference":   "string  — e.g. REQ-... AC-...",
    "relatedTestCaseLocalId": "string  — internal ID, e.g. TC-<storyId>-NNN",
    "relatedTestCaseAdoId":   0,       // number — Azure DevOps ID of that Test Case
    "relatedUserStoryId":     0,       // number — the story that OWNS the Test Case
    "failureClassification":  "string  — PRODUCT_BUG (only this is publishable)",
    "evidenceNote":           "string  — what the evidence shows; credential-free"
  },

  "placement": {
    "parentUserStoryId": 0,            // number — MUST equal bug.relatedUserStoryId
    "areaPath":          "string",     // inherit from the owning User Story
    "iterationPath":     "string",     // inherit from the owning User Story
    "assignedTo":        "string|null",// REQUIRED from the human. null = deliberately unassigned
    "severity":          "string",     // human-approved, exact process-template spelling
    "priorityOverride":  "string|null" // null = let Azure DevOps default apply. OMIT unless asked
  },

  "attachment": {                      // optional; omit entirely when there is none
    "path":    "string — path to the approved evidence file",
    "comment": "string — what the evidence shows"
  }
}
```

---

## Field rules that are not optional

### `placement.severity` — per Bug, never a default

Set from **the human's approved value for this Bug**. The agent may *propose* a
severity from observed impact, but the value written here is the one the human
confirmed (`docs/product-decisions.md` §5).

Use the exact process-template spelling. This template numbers them — the
constants live in `SEVERITY` in `src/ado/fields.ts`. A bare `"Low"` is rejected
by Azure DevOps.

### `placement.assignedTo` — from the human, for this Bug

Must come from the human's instruction for **this** Bug. Never inferred from the
User Story owner, the Test Case author, the previous Bug, or anything historical.

`null` is valid **only** when the human explicitly chose to leave it unassigned —
never as a fallback for "nobody said".

### `placement.priorityOverride` — normally `null`

`null` (or absent) means **do not write Priority at all**, letting the process
template apply its own default. Set a value **only** when the human explicitly
asked for a specific Priority on this Bug.

### Never inherit

Severity, assignee and priority from a previously published Bug carry **no**
authority over the next one. Reusing an old input file and editing only the title
is exactly the mistake this schema exists to prevent: it silently republishes a
stale assignee and severity under a new bug's name.

---

## Validation performed before any write

`publish-bug.ts` refuses the input unless:

| Rule | Why |
|---|---|
| `failureClassification` is `PRODUCT_BUG` | Nothing else may become a Bug (`docs/product-decisions.md` §9) |
| `placement.parentUserStoryId` equals `bug.relatedUserStoryId` | A Bug filed under a story that does not own the Test Case breaks traceability and defeats story-scoped duplicate checking |
| `severity` is non-empty | Severity is `alwaysRequired` on Bug with no default; the create fails without it |
| `assignedTo` is present (a name or an explicit `null`) | Forces a deliberate decision instead of an accidental omission |
| `attachment.path` exists on disk, when given | An attachment that cannot be read must fail before the Bug is created, not after |
| Title, steps, expected and actual are non-empty | A Bug nobody can reproduce is not worth filing |

`priorityOverride` is deliberately **not** required — its absence is meaningful.
