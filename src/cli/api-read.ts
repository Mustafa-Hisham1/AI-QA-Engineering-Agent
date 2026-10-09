/**
 * Prints the operations of an API specification that are relevant to a story,
 * for `/analyze-story` to cite — names, types and constraints only, never a
 * value (see src/analysis/api-spec.ts).
 *
 *   node src/cli/api-read.ts specs/auth.json                       # every operation
 *   node src/cli/api-read.ts specs/auth.json --match login --match token
 *   node src/cli/api-read.ts specs/auth.json --json
 *
 * Supports OpenAPI 3, Swagger 2 and Postman Collection v2.x, as JSON.
 * Read-only. Exit codes:  0 = read   1 = unusable specification   2 = bad arguments
 */

import { ApiSpecError, filterOperations, operationDependencies, readApiSpec, type ApiField, type ApiOperation } from '../analysis/api-spec.ts';

function parseArgs(argv: readonly string[]): { path: string | null; terms: string[]; json: boolean } {
  let path: string | null = null;
  const terms: string[] = [];
  let json = false;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]!;
    if (arg === '--match') terms.push(argv[++index] ?? '');
    else if (arg === '--json') json = true;
    else if (!arg.startsWith('--')) path = arg;
  }
  return { path, terms, json };
}

function field(entry: ApiField & { location?: string }): string {
  const parts = [
    entry.location ? `${entry.location}` : null,
    entry.type,
    entry.required ? 'required' : 'optional',
    entry.enumValues.length > 0 ? `enum [${entry.enumValues.join(', ')}]` : null,
    ...entry.constraints,
  ].filter(Boolean);
  return `\`${entry.name}\` (${parts.join(', ')})`;
}

function render(operation: ApiOperation): string[] {
  const lines = [`### ${operation.method} ${operation.path}${operation.name ? ` — ${operation.name}` : ''}`];
  if (operation.summary) lines.push(`- Summary: ${operation.summary.split('\n')[0]}`);
  if (operation.tags.length > 0) lines.push(`- Tags / folder: ${operation.tags.join(', ')}`);
  lines.push(`- Auth: ${operation.auth.length > 0 ? operation.auth.join(', ') : 'not specified'}`);
  if (operation.parameters.length > 0) lines.push(`- Parameters: ${operation.parameters.map(field).join('; ')}`);
  if (operation.headers.length > 0) lines.push(`- Headers (names only): ${operation.headers.join(', ')}`);
  if (operation.requestBody) {
    const body = operation.requestBody;
    lines.push(`- Request body${body.contentType ? ` (${body.contentType})` : ''}${body.note ? ` — ${body.note}` : ''}: ${body.fields.length > 0 ? body.fields.map(field).join('; ') : 'no fields defined'}`);
  }
  for (const response of operation.responses) {
    lines.push(`- Response ${response.status}${response.description ? ` — ${response.description}` : ''}${response.fields.length > 0 ? `: ${response.fields.map(field).join('; ')}` : ''}`);
  }
  if (operation.responses.length === 0) lines.push('- Responses: not specified');
  if (operation.provides.length > 0) lines.push(`- Provides: ${operation.provides.join(', ')}`);
  if (operation.uses.length > 0) lines.push(`- Uses variables: ${operation.uses.join(', ')}`);
  return lines;
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  if (!args.path) {
    console.error('Usage: node src/cli/api-read.ts <spec.json> [--match <term>]... [--json]');
    return 2;
  }

  const spec = readApiSpec(args.path);
  const operations = filterOperations(spec.operations, args.terms);
  const dependencies = operationDependencies(operations);

  if (args.json) {
    console.log(JSON.stringify({ ...spec, operations, dependencies }, null, 2));
    return 0;
  }

  console.log(`# ${spec.type} ${spec.version}${spec.title ? ` — ${spec.title}` : ''}`);
  console.log(`Path: ${spec.path}`);
  console.log(`sha256: ${spec.sha256}`);
  console.log(`Operations: ${operations.length} of ${spec.operations.length}${args.terms.length > 0 ? ` matching ${args.terms.map((t) => `"${t}"`).join(', ')}` : ''}`);
  if (spec.authSchemes.length > 0) console.log(`Auth schemes: ${spec.authSchemes.join('; ')}`);
  if (spec.variables.length > 0) console.log(`Collection variables (names only): ${spec.variables.join(', ')}`);
  console.log('Values — examples, headers, variables, credentials — are never printed.');
  for (const operation of operations) {
    console.log();
    for (const line of render(operation)) console.log(line);
  }
  if (dependencies.length > 0) {
    console.log();
    console.log('## Dependencies');
    for (const dependency of dependencies) console.log(`- ${dependency.from} -> ${dependency.to} (${dependency.via})`);
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  if (error instanceof ApiSpecError) {
    console.error(`API specification not usable [${error.code}]: ${error.message}`);
    process.exitCode = 1;
  } else {
    console.error(`Unexpected failure: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
