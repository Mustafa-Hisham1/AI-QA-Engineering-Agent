/**
 * Minimal HTML -> Markdown converter.
 *
 * Azure DevOps stores Description, Acceptance Criteria and similar rich-text
 * fields as HTML fragments produced by its own editor. Markdown is what the
 * model reasons over and what a human reviews in a local file, so the
 * conversion happens once, at read time.
 *
 * Scope is deliberately the subset that Azure DevOps' editor emits: paragraphs,
 * headings, lists (nested), tables, links, images, inline emphasis, code and
 * horizontal rules. It is not a general-purpose HTML renderer, and it has no
 * dependencies — see the zero-runtime-dependency rule in CLAUDE.md.
 *
 * Unknown elements are rendered transparently (children kept, tag dropped)
 * rather than discarded: losing requirement text is far worse than emitting
 * slightly plain Markdown.
 */

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  // A non-breaking space is turned into a normal space on purpose: kept as
  // U+00A0 it looks identical in review yet breaks trimming and string
  // comparison, which would silently corrupt fingerprints and test data.
  nbsp: ' ',
  ensp: ' ',
  emsp: ' ',
  thinsp: ' ',
  shy: '',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  bull: '•',
  middot: '·',
  laquo: '«',
  raquo: '»',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  copy: '©',
  reg: '®',
  trade: '™',
  deg: '°',
  plusmn: '±',
  times: '×',
  divide: '÷',
  euro: '€',
  pound: '£',
  yen: '¥',
  cent: '¢',
  sect: '§',
  para: '¶',
  dagger: '†',
  larr: '←',
  rarr: '→',
  harr: '↔',
  ne: '≠',
  le: '≤',
  ge: '≥',
  checkmark: '✓',
};

function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body: string) => {
    if (body.startsWith('#')) {
      const isHex = body[1] === 'x' || body[1] === 'X';
      const code = Number.parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }

    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named === undefined ? match : named;
  });
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

interface TextNode {
  readonly kind: 'text';
  readonly text: string;
}

interface ElementNode {
  readonly kind: 'element';
  readonly tag: string;
  readonly attrs: Record<string, string>;
  readonly children: Node[];
}

type Node = TextNode | ElementNode;

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'wbr']);

/** Elements whose text content must be dropped, not rendered. */
const DISCARDED_TAGS = new Set(['script', 'style', 'head', 'title', 'noscript']);

/** Tags that implicitly close an open element of the same kind. */
const IMPLICIT_CLOSERS: Record<string, readonly string[]> = {
  li: ['li'],
  tr: ['tr', 'td', 'th'],
  td: ['td', 'th'],
  th: ['td', 'th'],
  p: ['p'],
};

const TOKEN_PATTERN = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!?\/?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>])*)>|([^<]+)|</g;

function parseAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  for (const match of raw.matchAll(pattern)) {
    const name = match[1];
    if (!name) continue;
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attrs[name.toLowerCase()] = decodeEntities(value);
  }
  return attrs;
}

/**
 * Parses an HTML fragment into a tree.
 *
 * Robustness over correctness: Azure DevOps content is editor-generated and can
 * contain unclosed tags and stray closers. A close tag with no matching open
 * ancestor is ignored rather than allowed to unwind the tree.
 */
function parse(html: string): Node[] {
  const root: ElementNode = { kind: 'element', tag: '#root', attrs: {}, children: [] };
  const stack: ElementNode[] = [root];

  const current = (): ElementNode => stack[stack.length - 1] ?? root;

  for (const match of html.matchAll(TOKEN_PATTERN)) {
    const [token, tagName, rawAttrs, text] = match;

    if (text !== undefined) {
      if (text) current().children.push({ kind: 'text', text: decodeEntities(text) });
      continue;
    }

    // Comments, CDATA, doctypes and a stray "<" carry nothing we need.
    if (tagName === undefined) continue;

    const tag = tagName.toLowerCase();
    const isClosing = token.startsWith('</');

    if (isClosing) {
      const openIndex = stack.findIndex((node) => node.tag === tag);
      if (openIndex > 0) stack.length = openIndex;
      continue;
    }

    if (DISCARDED_TAGS.has(tag)) {
      // Skip the element's entire content by consuming up to its close tag.
      // Handled by pushing a node that is never attached to the tree.
      const sink: ElementNode = { kind: 'element', tag, attrs: {}, children: [] };
      if (!token.endsWith('/>')) stack.push(sink);
      continue;
    }

    const element: ElementNode = {
      kind: 'element',
      tag,
      attrs: parseAttributes(rawAttrs ?? ''),
      children: [],
    };

    for (const closable of IMPLICIT_CLOSERS[tag] ?? []) {
      const openIndex = stack.findIndex((node) => node.tag === closable);
      if (openIndex > 0) {
        stack.length = openIndex;
        break;
      }
    }

    current().children.push(element);

    if (!VOID_TAGS.has(tag) && !token.endsWith('/>')) stack.push(element);
  }

  return root.children;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const INLINE_TAGS = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'big', 'br', 'cite', 'code', 'del', 'em', 'font', 'i', 'img', 'ins', 'kbd',
  'label', 'mark', 'q', 's', 'samp', 'small', 'span', 'strike', 'strong', 'sub', 'sup', 'time', 'tt', 'u', 'var',
]);

const HEADING_LEVELS: Record<string, number> = { h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6 };

interface ListContext {
  readonly ordered: boolean;
  index: number;
}

/** Collapses runs of spaces/tabs but keeps explicit line breaks from <br>. */
function collapseSpaces(value: string): string {
  return value.replace(/[ \t\f\v\r]+/g, ' ').replace(/\n[ \t]+/g, '\n').replace(/[ \t]+\n/g, '\n');
}

function textOf(nodes: readonly Node[]): string {
  return nodes
    .map((node) => (node.kind === 'text' ? node.text : node.tag === 'br' ? '\n' : textOf(node.children)))
    .join('');
}

/** Wraps `content` in `marker` only when there is something to emphasise. */
function emphasise(content: string, marker: string): string {
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(content);
  if (!match) return content;
  const [, lead = '', body = '', trail = ''] = match;
  if (!body) return content;
  return `${lead}${marker}${body}${marker}${trail}`;
}

function renderInline(node: ElementNode): string {
  const inner = () => renderNodes(node.children, { block: false });

  switch (node.tag) {
    case 'br':
      return '\n';
    case 'strong':
    case 'b':
      return emphasise(inner(), '**');
    case 'em':
    case 'i':
      return emphasise(inner(), '*');
    case 's':
    case 'strike':
    case 'del':
      return emphasise(inner(), '~~');
    case 'code':
    case 'kbd':
    case 'samp':
    case 'tt': {
      const text = collapseSpaces(textOf(node.children)).trim();
      return text ? `\`${text}\`` : '';
    }
    case 'a': {
      const href = node.attrs['href']?.trim() ?? '';
      const label = inner().trim();
      if (!href) return label;
      // A bare URL as its own label reads better unlinked than as [url](url).
      if (!label || label === href) return href;
      return `[${label}](${href})`;
    }
    case 'img': {
      const src = node.attrs['src']?.trim() ?? '';
      const alt = (node.attrs['alt'] ?? '').trim();
      if (!src) return alt;
      return `![${alt}](${src})`;
    }
    default:
      return inner();
  }
}

function indentContinuation(value: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return value
    .split('\n')
    .map((line, index) => (index === 0 || !line ? line : `${pad}${line}`))
    .join('\n');
}

function renderList(node: ElementNode, depth: number): string {
  const ordered = node.tag === 'ol';
  const startAttr = Number.parseInt(node.attrs['start'] ?? '', 10);
  const context: ListContext = { ordered, index: Number.isFinite(startAttr) ? startAttr : 1 };

  const items = node.children.filter((child): child is ElementNode => child.kind === 'element' && child.tag === 'li');

  // Non-<li> children of a list are malformed but do occur; keep their text.
  const strays = node.children.filter((child) => !(child.kind === 'element' && child.tag === 'li'));
  const strayText = collapseSpaces(textOf(strays)).trim();

  const lines = items.map((item) => {
    const marker = context.ordered ? `${context.index++}.` : '-';
    const body = renderListItem(item, depth + 1);
    return `${marker} ${indentContinuation(body, marker.length + 1)}`;
  });

  if (strayText) lines.unshift(strayText);
  return lines.join('\n');
}

/** List items join their blocks with single newlines to keep the list tight. */
function renderListItem(item: ElementNode, depth: number): string {
  const blocks = renderBlocks(item.children, depth);
  return blocks.join('\n');
}

function cellsOf(row: ElementNode): ElementNode[] {
  return row.children.filter(
    (child): child is ElementNode => child.kind === 'element' && (child.tag === 'td' || child.tag === 'th'),
  );
}

function renderCell(cell: ElementNode): string {
  // Pipes and newlines would break the row; a cell is always single-line.
  return renderNodes(cell.children, { block: false })
    .replace(/\n+/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

function renderTable(node: ElementNode): string {
  const rows: ElementNode[] = [];

  const collect = (nodes: readonly Node[]): void => {
    for (const child of nodes) {
      if (child.kind !== 'element') continue;
      if (child.tag === 'tr') rows.push(child);
      else if (['thead', 'tbody', 'tfoot', 'table'].includes(child.tag)) collect(child.children);
    }
  };
  collect(node.children);

  if (rows.length === 0) return '';

  const grid = rows.map((row) => cellsOf(row).map(renderCell));
  const width = Math.max(...grid.map((cells) => cells.length));
  if (width === 0) return '';

  const pad = (cells: readonly string[]): string => `| ${Array.from({ length: width }, (_, i) => cells[i] ?? '').join(' | ')} |`;

  const [firstRow = [], ...restRows] = grid;
  const firstIsHeader = cellsOf(rows[0] as ElementNode).some((cell) => cell.tag === 'th');

  // Markdown tables require a header row. When the source has none, an empty
  // header keeps the table renderable rather than dropping the first data row.
  const header = firstIsHeader ? pad(firstRow) : pad(Array.from({ length: width }, () => ''));
  const separator = `|${' --- |'.repeat(width)}`;
  const body = (firstIsHeader ? restRows : grid).map(pad);

  return [header, separator, ...body].join('\n');
}

function renderBlock(node: ElementNode, depth: number): string {
  const headingLevel = HEADING_LEVELS[node.tag];
  if (headingLevel !== undefined) {
    const text = renderNodes(node.children, { block: false }).replace(/\n+/g, ' ').trim();
    return text ? `${'#'.repeat(headingLevel)} ${text}` : '';
  }

  switch (node.tag) {
    case 'hr':
      return '---';
    case 'ul':
    case 'ol':
      return renderList(node, depth);
    case 'li':
      // An <li> outside a list still represents an item.
      return `- ${indentContinuation(renderListItem(node, depth + 1), 2)}`;
    case 'table':
      return renderTable(node);
    case 'pre': {
      const code = textOf(node.children).replace(/^\n+|\s+$/g, '');
      return code ? `\`\`\`\n${code}\n\`\`\`` : '';
    }
    case 'blockquote': {
      const inner = renderBlocks(node.children, depth).join('\n\n');
      return inner
        .split('\n')
        .map((line) => (line ? `> ${line}` : '>'))
        .join('\n');
    }
    default:
      return renderBlocks(node.children, depth).join('\n\n');
  }
}

function isBlockElement(node: Node): node is ElementNode {
  return node.kind === 'element' && !INLINE_TAGS.has(node.tag);
}

/** Splits a node list into blocks, grouping consecutive inline content. */
function renderBlocks(nodes: readonly Node[], depth: number): string[] {
  const blocks: string[] = [];
  let inline = '';

  const flush = (): void => {
    const text = collapseSpaces(inline).trim();
    if (text) blocks.push(text);
    inline = '';
  };

  for (const node of nodes) {
    if (isBlockElement(node)) {
      flush();
      const rendered = renderBlock(node, depth);
      if (rendered.trim()) blocks.push(rendered);
      continue;
    }
    inline += node.kind === 'text' ? node.text : renderInline(node);
  }

  flush();
  return blocks;
}

function renderNodes(nodes: readonly Node[], options: { block: boolean }): string {
  if (options.block) return renderBlocks(nodes, 0).join('\n\n');

  return nodes
    .map((node) => (node.kind === 'text' ? node.text : node.kind === 'element' && isBlockElement(node) ? `\n${renderBlock(node, 0)}\n` : renderInline(node)))
    .join('');
}

/**
 * Converts an HTML fragment to Markdown.
 *
 * Returns an empty string for empty, whitespace-only, or content-free HTML, so
 * callers can treat "no value" and "empty field" identically.
 */
export function htmlToMarkdown(html: string | null | undefined): string {
  if (!html) return '';

  const nodes = parse(html);
  const markdown = renderBlocks(nodes, 0).join('\n\n');

  return markdown
    .replace(/ /g, ' ')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Plain text of an HTML fragment, for short single-line values. */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return '';
  return collapseSpaces(textOf(parse(html))).replace(/\s+/g, ' ').trim();
}
