/**
 * Minimal Markdown-to-HTML conversion for content going *into* rich-text fields.
 *
 * The counterpart of ./html-to-markdown.ts, and deliberately just as narrow: it
 * handles only the inline constructs the project's own artifacts use — bold,
 * inline code, and italics — plus paragraph and list structure.
 *
 * It has no Azure DevOps knowledge and no notion of what field the output lands
 * in.
 *
 * The guiding rule is FIDELITY: anything not recognised is passed through as
 * literal text rather than dropped. Losing a character from an approved test
 * case's expected result is worse than rendering a stray asterisk, because the
 * published item would then differ silently from the artifact that was approved.
 */

/** Escapes the five characters that are significant in HTML/XML text. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Converts inline Markdown in a single line to HTML.
 *
 * Escaping happens first, so any HTML in the source is rendered as text rather
 * than interpreted — the artifact is data, not markup. `**`, `` ` `` and `_` are
 * not HTML-special, so they survive escaping and can be matched afterwards.
 *
 * Inline code is converted BEFORE bold: an expected result may legitimately
 * contain a literal asterisk inside backticks, and converting bold first would
 * consume it.
 */
export function inlineMarkdownToHtml(line: string): string {
  let html = escapeHtml(line);

  // `code` — non-greedy, must not span backticks.
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // **bold** — non-greedy so two bold runs on one line stay separate.
  html = html.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

  // *italic* / _italic_ — single markers only, and only when they wrap content.
  html = html.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>');
  html = html.replace(/(^|[\s(])_([^_\s][^_]*)_/g, '$1<i>$2</i>');

  return html;
}

/**
 * Converts a block of lines to HTML.
 *
 * Lines beginning with `-` become list items; consecutive items share one list.
 * Everything else becomes a paragraph. Blank lines separate blocks and are not
 * emitted as empty paragraphs, which Azure DevOps renders as stray gaps.
 */
export function linesToHtml(lines: readonly string[]): string {
  const out: string[] = [];
  let inList = false;

  const closeList = (): void => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      closeList();
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${inlineMarkdownToHtml(bullet[1] ?? '')}</li>`);
      continue;
    }

    closeList();
    out.push(`<p>${inlineMarkdownToHtml(line)}</p>`);
  }

  closeList();
  return out.join('');
}
