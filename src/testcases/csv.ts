/**
 * RFC 4180 CSV reading and writing, with no dependencies (invariant 8).
 *
 * The Test Case CSV is edited by humans in spreadsheet tools, so this reader
 * accepts what those tools write — a UTF-8 byte-order mark, CRLF or LF row
 * endings, quoted fields holding commas, doubled quotes and line breaks — and
 * rejects what is genuinely ambiguous (an unterminated quote, a quote in the
 * middle of an unquoted field) instead of guessing. A guessed field boundary
 * would shift every later column of the row: a step landing in Expected Results
 * is exactly the kind of silent corruption the strict artifact parser exists to
 * prevent.
 *
 * Inside a field, CRLF is normalised to LF, so a value reads the same whatever
 * tool last saved the file.
 */

/** Raised for CSV text that cannot be read unambiguously. */
export class CsvError extends Error {
  /** 1-based physical line where the problem was detected. */
  readonly line: number;

  constructor(message: string, line: number) {
    super(`${message} (line ${line})`);
    this.name = 'CsvError';
    this.line = line;
  }
}

const BOM = '﻿';

/**
 * Parses CSV text into rows of fields. Every row keeps its own length; checking
 * that rows match the header is the schema's job, not the codec's.
 */
export function parseCsv(text: string): string[][] {
  const source = text.startsWith(BOM) ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  // True once a quoted field has closed: only a delimiter or a row end may follow.
  let afterQuote = false;
  let line = 1;
  let fieldStartLine = 1;

  const endField = (): void => {
    row.push(field);
    field = '';
    afterQuote = false;
  };
  const endRow = (): void => {
    endField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < source.length; i++) {
    const char = source[i]!;

    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          afterQuote = true;
        }
      } else if (char === '\r' && source[i + 1] === '\n') {
        field += '\n';
        i++;
        line++;
      } else {
        if (char === '\n') line++;
        field += char;
      }
      continue;
    }

    if (char === ',') {
      endField();
      continue;
    }
    if (char === '\r' || char === '\n') {
      if (char === '\r' && source[i + 1] === '\n') i++;
      endRow();
      line++;
      continue;
    }
    if (afterQuote) {
      throw new CsvError('Unexpected character after a closing quote — a quoted field must end at a comma or a line end', line);
    }
    if (char === '"') {
      if (field !== '') {
        throw new CsvError('A quote inside an unquoted field — quote the whole field and double the inner quote ("")', line);
      }
      quoted = true;
      fieldStartLine = line;
      continue;
    }
    field += char;
  }

  if (quoted) {
    throw new CsvError('A quoted field is never closed', fieldStartLine);
  }

  // The last row has no terminator when the file does not end in a newline.
  // A file that does end in one leaves nothing pending, and must not gain an
  // empty trailing row.
  if (field !== '' || row.length > 0 || afterQuote) endRow();

  return rows;
}

/** Quotes a field only when it must be quoted, so diffs stay readable. */
function formatField(value: string): string {
  if (/[",\r\n]/.test(value) || /^\s|\s$/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Serialises rows as CSV: LF row endings, LF inside multiline fields, and a
 * UTF-8 byte-order mark so spreadsheet tools read accented letters and dashes
 * correctly. Deterministic — the same rows always produce the same bytes.
 */
export function formatCsv(rows: readonly (readonly string[])[]): string {
  return BOM + rows.map((row) => row.map((value) => formatField(value.replace(/\r\n?/g, '\n'))).join(',')).join('\n') + '\n';
}
