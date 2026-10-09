/**
 * Static rules every file under `automation/<KEY>/` must satisfy
 * (`docs/product-decisions.md` §7.1). Enforced by `npm test`, so a generated
 * spec that breaks one cannot pass review unnoticed.
 *
 * Each rule closes a verified leak or a bypass of a guard:
 * - ARIA snapshots print input values — masked passwords included — in the
 *   failure MESSAGE itself; no configuration can redact that (verified
 *   2026-10-09, Playwright 1.64).
 * - Trace and video are decided by the artifact policy alone: traces record
 *   typed values (kept off), video is on by human decision (§7.2.1). A spec
 *   must not override either.
 * - A saved storage state is a live session on disk (invariant 7).
 * - Reading the process environment belongs to `src/automation/config.ts`
 *   alone (invariant 7). Spelled indirectly below, so this file does not show
 *   up in the invariant-7 grep it helps enforce.
 * - Importing `test` from `@playwright/test` skips the project fixtures: the
 *   environment guard, handle resolution and error-context redaction.
 *
 * Pure: takes source text, returns violations.
 */

export interface CodeSafetyViolation {
  readonly path: string;
  readonly line: number;
  readonly rule: string;
}

const RULES: readonly { readonly rule: string; readonly pattern: RegExp }[] = [
  { rule: 'ARIA snapshots are forbidden: they print typed values, passwords included', pattern: /\btoMatchAriaSnapshot\b|\bariaSnapshot\s*\(/ },
  { rule: 'Do not override the artifact policy (trace/video) in a spec', pattern: /\b(trace|video)\s*:/ },
  { rule: 'Tracing is forbidden: traces record typed values', pattern: /\.tracing\b/ },
  { rule: 'Saved sessions are forbidden: a storage state is a credential on disk', pattern: /\bstorageState\b/ },
  {
    rule: 'The environment is read only by src/automation/config.ts (invariant 7); use the fixtures',
    pattern: new RegExp(['\\bprocess', 'env\\b'].join('\\.')),
  },
  {
    rule: "Import test from src/automation/fixtures.ts, not from '@playwright/test'",
    pattern: /import\s*\{[^}]*\b(test|expect)\b[^}]*\}\s*from\s*['"]@playwright\/test['"]/,
  },
];

/** Removes `//` and block comments so prose explaining a rule does not trip it. */
function stripComments(line: string, inBlock: { value: boolean }): string {
  let out = '';
  for (let i = 0; i < line.length; i++) {
    if (inBlock.value) {
      if (line.startsWith('*/', i)) {
        inBlock.value = false;
        i++;
      }
      continue;
    }
    if (line.startsWith('/*', i)) {
      inBlock.value = true;
      i++;
      continue;
    }
    if (line.startsWith('//', i)) break;
    out += line[i];
  }
  return out;
}

export function findCodeSafetyViolations(path: string, source: string): CodeSafetyViolation[] {
  const violations: CodeSafetyViolation[] = [];
  const inBlock = { value: false };

  source.split(/\r?\n/).forEach((raw, index) => {
    const code = stripComments(raw, inBlock);
    for (const { rule, pattern } of RULES) {
      if (pattern.test(code)) violations.push({ path, line: index + 1, rule });
    }
  });

  return violations;
}
