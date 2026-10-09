# Project Profile — ARTIFACT-CHECK

**Synthetic project used only by `npm run automation:verify-artifacts`.** It is
not a real project, lives outside `docs/projects/`, and is never resolved by any
other command. It exists so the leak check can drive the HTML execution report
end to end — Test Case join, failure classification, Bug Candidates — and then
search everything the report wrote.

## Settings

| Setting | Value |
|---|---|
| Project Key | ARTIFACT-CHECK |
| Title Project Token | ARTIFACT-CHECK |
| Allowed Environments | None configured |
| Environment Label Variable | APP_ENV |
| Automation Base URL Variable | TBD |

## Test data handles

| Handle | Purpose |
|---|---|
| `CHECK_ACCOUNT` | The sentinel username and password the check types. Not a credential. |
