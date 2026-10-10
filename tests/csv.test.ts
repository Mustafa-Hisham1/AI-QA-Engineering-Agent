/**
 * Tests for the RFC 4180 CSV codec (src/testcases/csv.ts).
 *
 * The Test Case CSV is the source of truth (§6.4) and is edited in spreadsheet
 * tools, so the reader must take what those tools write — and refuse anything
 * ambiguous rather than shift a value into the wrong column.
 */

import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert/strict';
import { test } from 'node:test';

import { CsvError, formatCsv, parseCsv } from '../src/testcases/csv.ts';

test('a field holding a comma, a quote and line breaks survives a round trip', () => {
  const rows = [
    ['ID', 'Steps', 'Note'],
    ['TC-1-001', '1. Type "Côte d\'Ivoire", then Tab\n2. Click Save', 'a, b'],
  ];
  const text = formatCsv(rows);
  deepStrictEqual(parseCsv(text), rows);
});

test('only fields that need quoting are quoted, so diffs stay readable', () => {
  const text = formatCsv([['plain', 'with,comma', 'with "quote"', 'two\nlines', ' padded']]);
  strictEqual(text, '﻿plain,"with,comma","with ""quote""","two\nlines"," padded"\n');
});

test('the writer adds a UTF-8 BOM and the reader strips it', () => {
  const text = formatCsv([['A'], ['—']]);
  ok(text.startsWith('﻿'));
  deepStrictEqual(parseCsv(text), [['A'], ['—']]);
});

test('CRLF row endings and CRLF inside a quoted field are read as LF', () => {
  deepStrictEqual(parseCsv('a,b\r\n"x\r\ny",z\r\n'), [
    ['a', 'b'],
    ['x\ny', 'z'],
  ]);
});

test('a spreadsheet that quotes every field is read the same as a minimal one', () => {
  deepStrictEqual(parseCsv('"a","b,c","d"\n'), parseCsv('a,"b,c",d\n'));
});

test('empty fields and a missing final newline are handled', () => {
  deepStrictEqual(parseCsv('a,,c\n,,'), [
    ['a', '', 'c'],
    ['', '', ''],
  ]);
  deepStrictEqual(parseCsv('a,b'), [['a', 'b']]);
});

test('a trailing newline does not add an empty row', () => {
  deepStrictEqual(parseCsv('a\nb\n'), [['a'], ['b']]);
});

test('a quoted field that is never closed is refused, naming the line it opened on', () => {
  throws(
    () => parseCsv('a,b\n"open,\nmore\n'),
    (error: unknown) => {
      ok(error instanceof CsvError);
      strictEqual(error.line, 2);
      return true;
    },
  );
});

test('a quote inside an unquoted field is refused instead of guessed', () => {
  throws(() => parseCsv('a,b"c\n'), CsvError);
});

test('text after a closing quote is refused instead of guessed', () => {
  throws(() => parseCsv('"a"b,c\n'), CsvError);
});

test('commas are never split naively: a quoted comma stays in one field', () => {
  deepStrictEqual(parseCsv('"1, 2, 3",x\n'), [['1, 2, 3', 'x']]);
});
