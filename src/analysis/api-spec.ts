/**
 * Reads an optional API specification for `/analyze-story`
 * (`docs/product-decisions.md` §14.1): OpenAPI 3, Swagger 2, or a Postman
 * Collection (v2.x), as JSON.
 *
 * Produces a compact, normalised operation inventory so the analysis can cite
 * what the specification SAYS — methods, paths, parameters, request and
 * response fields, status codes, enums, constraints, authentication, and
 * dependencies between requests — without dumping the file into the analysis.
 *
 * NAMES, NEVER VALUES. Postman collections routinely carry tokens and passwords
 * in variables, headers, auth blocks and example bodies; OpenAPI examples can
 * hold real data. This reader emits field, header, variable and auth-scheme
 * NAMES, types and constraints — and never an example value, a header value, a
 * variable value, or an auth credential (invariant 7). Enum members are kept:
 * they are the specification's allowed values, not data.
 *
 * Pure apart from reading the file; no network, no Azure DevOps. Zero
 * dependencies (invariant 8), hence JSON only — YAML is reported as
 * unsupported, never guessed at.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export type ApiSpecType = 'OpenAPI' | 'Swagger' | 'Postman';

export type ApiSpecErrorCode = 'NOT_FOUND' | 'UNREADABLE' | 'INVALID_JSON' | 'UNSUPPORTED_FORMAT';

export class ApiSpecError extends Error {
  readonly code: ApiSpecErrorCode;

  constructor(code: ApiSpecErrorCode, message: string) {
    super(message);
    this.name = 'ApiSpecError';
    this.code = code;
  }
}

export interface ApiField {
  /** Dotted for nested properties: `address.city`. */
  readonly name: string;
  readonly type: string | null;
  readonly required: boolean;
  readonly enumValues: readonly string[];
  /** e.g. `maxLength 50`, `pattern ^[A-Z]+$`, `format email`. */
  readonly constraints: readonly string[];
}

export interface ApiParameter extends ApiField {
  /** `path`, `query`, `header`, `cookie`. */
  readonly location: string;
}

export interface ApiResponse {
  readonly status: string;
  readonly description: string;
  readonly fields: readonly ApiField[];
}

export interface ApiOperation {
  readonly method: string;
  /** Path as the specification writes it — `{id}` or `{{baseUrl}}/x` kept literally. */
  readonly path: string;
  /** operationId (OpenAPI) or request name (Postman). */
  readonly name: string | null;
  readonly summary: string | null;
  readonly tags: readonly string[];
  readonly parameters: readonly ApiParameter[];
  /** Header names only (Postman), never values. */
  readonly headers: readonly string[];
  readonly requestBody: { readonly contentType: string | null; readonly fields: readonly ApiField[]; readonly note: string | null } | null;
  readonly responses: readonly ApiResponse[];
  /** Security scheme names / auth types — never credentials. */
  readonly auth: readonly string[];
  /** Variables this request sets for later requests (Postman), and OpenAPI links. */
  readonly provides: readonly string[];
  /** Variables this request uses that another request provides. */
  readonly uses: readonly string[];
}

export interface ApiSpec {
  readonly type: ApiSpecType;
  /** `3.0.1`, `2.0`, or the Postman schema version. */
  readonly version: string;
  readonly title: string | null;
  readonly path: string;
  /** sha256 of the file's bytes — the source's fingerprint. */
  readonly sha256: string;
  /** Security schemes / collection auth, by name and type — never values. */
  readonly authSchemes: readonly string[];
  /** Postman collection variables, NAMES only. */
  readonly variables: readonly string[];
  readonly operations: readonly ApiOperation[];
}

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Identifies the specification type from its content, never from its file name. */
export function detectApiSpecType(doc: unknown): { type: ApiSpecType; version: string } | null {
  if (!isObject(doc)) return null;
  if (typeof doc['openapi'] === 'string' && doc['openapi'].startsWith('3')) return { type: 'OpenAPI', version: doc['openapi'] };
  if (doc['swagger'] === '2.0') return { type: 'Swagger', version: '2.0' };

  const info = doc['info'];
  if (isObject(info) && Array.isArray(doc['item'])) {
    const schema = str(info['schema']) ?? '';
    const version = /v(\d+\.\d+\.\d+)/.exec(schema)?.[1] ?? 'unknown';
    if (/postman/i.test(schema) || '_postman_id' in info) return { type: 'Postman', version };
  }
  return null;
}

// ---------------------------------------------------------------------------
// OpenAPI / Swagger
// ---------------------------------------------------------------------------

const METHODS = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options'] as const;

/** Resolves a local `#/…` reference; external refs are left unresolved, never fetched. */
function deref(doc: Json, value: unknown, depth = 0): unknown {
  if (!isObject(value) || typeof value['$ref'] !== 'string' || depth > 20) return value;
  const ref = value['$ref'];
  if (!ref.startsWith('#/')) return value;
  let target: unknown = doc;
  for (const part of ref.slice(2).split('/')) {
    if (!isObject(target)) return value;
    target = target[part.replace(/~1/g, '/').replace(/~0/g, '~')];
  }
  return deref(doc, target, depth + 1);
}

function constraintsOf(schema: Json): string[] {
  const out: string[] = [];
  for (const key of ['format', 'minLength', 'maxLength', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'pattern', 'minItems', 'maxItems', 'uniqueItems', 'multipleOf']) {
    if (schema[key] !== undefined && schema[key] !== false) out.push(`${key} ${String(schema[key])}`);
  }
  if (schema['nullable'] === true) out.push('nullable');
  if (schema['readOnly'] === true) out.push('readOnly');
  if (schema['writeOnly'] === true) out.push('writeOnly');
  return out;
}

function typeOf(schema: Json): string | null {
  const type = str(schema['type']);
  if (type === 'array' && isObject(schema['items'])) return `array<${str(schema['items']['type']) ?? 'object'}>`;
  return type ?? (isObject(schema['properties']) ? 'object' : null);
}

function enumOf(schema: Json): string[] {
  return Array.isArray(schema['enum']) ? schema['enum'].map((value) => String(value)) : [];
}

/** Flattens an object schema's properties to dotted fields, two levels deep. */
function schemaFields(doc: Json, raw: unknown, prefix = '', depth = 0): ApiField[] {
  let schema = deref(doc, raw);
  if (!isObject(schema)) return [];

  // allOf merges; oneOf/anyOf are shown via their first branch's fields.
  if (Array.isArray(schema['allOf'])) return schema['allOf'].flatMap((part) => schemaFields(doc, part, prefix, depth));
  if (typeOf(schema)?.startsWith('array') && isObject(schema['items'])) schema = deref(doc, schema['items']) as Json;
  if (!isObject(schema)) return [];

  const properties = schema['properties'];
  if (!isObject(properties)) return [];
  const required = new Set(Array.isArray(schema['required']) ? schema['required'].map(String) : []);

  return Object.entries(properties).flatMap(([name, value]) => {
    const property = deref(doc, value);
    if (!isObject(property)) return [];
    const field: ApiField = {
      name: `${prefix}${name}`,
      type: typeOf(property),
      required: required.has(name),
      enumValues: enumOf(property),
      constraints: constraintsOf(property),
    };
    const nested = depth < 1 ? schemaFields(doc, property, `${prefix}${name}.`, depth + 1) : [];
    return [field, ...nested];
  });
}

function openApiParameter(doc: Json, raw: unknown): ApiParameter | null {
  const parameter = deref(doc, raw);
  if (!isObject(parameter) || !str(parameter['name'])) return null;
  // OpenAPI 3 nests the schema; Swagger 2 puts type/enum/constraints on the parameter.
  const schema = (isObject(parameter['schema']) ? deref(doc, parameter['schema']) : parameter) as Json;
  return {
    name: str(parameter['name'])!,
    location: str(parameter['in']) ?? 'unknown',
    type: typeOf(schema),
    required: parameter['required'] === true,
    enumValues: enumOf(schema),
    constraints: constraintsOf(schema),
  };
}

function firstContent(content: unknown): { contentType: string | null; schema: unknown } {
  if (!isObject(content)) return { contentType: null, schema: null };
  const type = 'application/json' in content ? 'application/json' : Object.keys(content)[0];
  const media = type ? content[type] : null;
  return { contentType: type ?? null, schema: isObject(media) ? media['schema'] : null };
}

function readOpenApi(doc: Json, type: ApiSpecType): Pick<ApiSpec, 'authSchemes' | 'operations' | 'variables'> {
  const schemes = isObject(doc['components']) ? (doc['components'] as Json)['securitySchemes'] : doc['securityDefinitions'];
  const authSchemes = isObject(schemes)
    ? Object.entries(schemes).map(([name, scheme]) => {
        const s = isObject(scheme) ? scheme : {};
        return `${name} (${[str(s['type']), str(s['scheme']), str(s['in'])].filter(Boolean).join(', ')})`;
      })
    : [];
  const globalSecurity = Array.isArray(doc['security']) ? doc['security'] : [];

  const operations: ApiOperation[] = [];
  const paths = isObject(doc['paths']) ? doc['paths'] : {};

  for (const [path, rawItem] of Object.entries(paths)) {
    const item = deref(doc, rawItem);
    if (!isObject(item)) continue;
    const shared = Array.isArray(item['parameters']) ? item['parameters'] : [];

    for (const method of METHODS) {
      const operation = item[method];
      if (!isObject(operation)) continue;

      const rawParameters = [...shared, ...(Array.isArray(operation['parameters']) ? operation['parameters'] : [])];
      const parameters: ApiParameter[] = [];
      let requestBody: ApiOperation['requestBody'] = null;

      for (const raw of rawParameters) {
        const resolved = deref(doc, raw);
        // Swagger 2 carries the request body as an `in: body` parameter.
        if (type === 'Swagger' && isObject(resolved) && resolved['in'] === 'body') {
          requestBody = { contentType: 'application/json', fields: schemaFields(doc, resolved['schema']), note: null };
          continue;
        }
        const parameter = openApiParameter(doc, raw);
        if (parameter && !parameters.some((p) => p.name === parameter.name && p.location === parameter.location)) parameters.push(parameter);
      }

      const body = deref(doc, operation['requestBody']);
      if (isObject(body)) {
        const { contentType, schema } = firstContent(body['content']);
        requestBody = { contentType, fields: schemaFields(doc, schema), note: body['required'] === true ? 'required' : null };
      }

      const responses: ApiResponse[] = [];
      const provides: string[] = [];
      for (const [status, rawResponse] of Object.entries(isObject(operation['responses']) ? operation['responses'] : {})) {
        const response = deref(doc, rawResponse);
        if (!isObject(response)) continue;
        const schema = type === 'Swagger' ? response['schema'] : firstContent(response['content']).schema;
        responses.push({ status, description: str(response['description']) ?? '', fields: schemaFields(doc, schema) });
        if (isObject(response['links'])) {
          for (const [link, value] of Object.entries(response['links'])) {
            const target = isObject(value) ? (str(value['operationId']) ?? str(value['operationRef'])) : null;
            provides.push(`link ${link}${target ? ` -> ${target}` : ''} (on ${status})`);
          }
        }
      }

      const security = Array.isArray(operation['security']) ? operation['security'] : globalSecurity;
      const auth = security.flatMap((entry) => (isObject(entry) ? Object.keys(entry) : []));

      operations.push({
        method: method.toUpperCase(),
        path,
        name: str(operation['operationId']),
        summary: str(operation['summary']) ?? str(operation['description']),
        tags: Array.isArray(operation['tags']) ? operation['tags'].map(String) : [],
        parameters,
        headers: [],
        requestBody,
        responses,
        auth: auth.length > 0 ? auth : Array.isArray(operation['security']) ? ['none (explicitly unsecured)'] : [],
        provides,
        uses: [],
      });
    }
  }

  return { authSchemes, operations, variables: [] };
}

// ---------------------------------------------------------------------------
// Postman
// ---------------------------------------------------------------------------

const POSTMAN_SET = /pm\.(?:environment|collectionVariables|globals|variables)\.set\(\s*['"`]([^'"`]+)['"`]/g;
const POSTMAN_USE = /\{\{\s*([^{}\s]+)\s*\}\}/g;

/** Field names of a JSON body, nested one level; values never kept. */
function jsonFieldNames(text: string): ApiField[] | null {
  let parsed: unknown;
  try {
    // "{{var}}" inside a string stays a string; a bare {{var}} becomes a number.
    parsed = JSON.parse(text.replace(/"\{\{\s*[^{}\s]+\s*\}\}"/g, '"x"').replace(POSTMAN_USE, '0'));
  } catch {
    return null;
  }
  const fields: ApiField[] = [];
  const walk = (value: unknown, prefix: string, depth: number): void => {
    if (Array.isArray(value)) value = value[0];
    if (!isObject(value)) return;
    for (const [key, child] of Object.entries(value)) {
      const type = Array.isArray(child) ? 'array' : child === null ? 'null' : typeof child;
      fields.push({ name: `${prefix}${key}`, type, required: false, enumValues: [], constraints: [] });
      if (depth < 1) walk(child, `${prefix}${key}.`, depth + 1);
    }
  };
  walk(parsed, '', 0);
  return fields;
}

function postmanUrl(url: unknown): string {
  if (typeof url === 'string') return url;
  if (!isObject(url)) return '';
  if (str(url['raw'])) return str(url['raw'])!.split('?')[0]!;
  const host = Array.isArray(url['host']) ? url['host'].join('.') : (str(url['host']) ?? '');
  const path = Array.isArray(url['path']) ? url['path'].join('/') : (str(url['path']) ?? '');
  return `${host}/${path}`;
}

function postmanAuth(auth: unknown): string[] {
  return isObject(auth) && str(auth['type']) ? [str(auth['type'])!] : [];
}

function scriptText(events: unknown): string {
  if (!Array.isArray(events)) return '';
  return events
    .flatMap((event) => (isObject(event) && isObject(event['script']) ? [event['script']['exec']] : []))
    .map((exec) => (Array.isArray(exec) ? exec.join('\n') : String(exec ?? '')))
    .join('\n');
}

function readPostman(doc: Json): Pick<ApiSpec, 'authSchemes' | 'operations' | 'variables'> {
  const collectionAuth = postmanAuth(doc['auth']);
  const operations: ApiOperation[] = [];

  const visit = (items: unknown, folder: string[], inheritedAuth: string[]): void => {
    if (!Array.isArray(items)) return;
    for (const raw of items) {
      if (!isObject(raw)) continue;
      const name = str(raw['name']);
      const ownAuth = postmanAuth(raw['auth']);

      if (Array.isArray(raw['item'])) {
        visit(raw['item'], name ? [...folder, name] : folder, ownAuth.length > 0 ? ownAuth : inheritedAuth);
        continue;
      }
      const request = raw['request'];
      if (!isObject(request) && typeof request !== 'string') continue;
      const req: Json = isObject(request) ? request : { url: request, method: 'GET' };

      const url = postmanUrl(req['url']);
      const headers = Array.isArray(req['header'])
        ? req['header'].flatMap((header) => (isObject(header) && str(header['key']) && header['disabled'] !== true ? [str(header['key'])!] : []))
        : [];

      const query: ApiParameter[] =
        isObject(req['url']) && Array.isArray(req['url']['query'])
          ? req['url']['query'].flatMap((q) =>
              isObject(q) && str(q['key'])
                ? [{ name: str(q['key'])!, location: 'query', type: null, required: false, enumValues: [], constraints: [] }]
                : [],
            )
          : [];

      let requestBody: ApiOperation['requestBody'] = null;
      const body = req['body'];
      if (isObject(body)) {
        const mode = str(body['mode']);
        if (mode === 'raw') {
          const fields = jsonFieldNames(String(body['raw'] ?? ''));
          requestBody = fields
            ? { contentType: 'application/json', fields, note: 'field names from the example body; values not shown' }
            : { contentType: null, fields: [], note: 'non-JSON raw body; content not shown' };
        } else if (mode === 'urlencoded' || mode === 'formdata') {
          const entries = Array.isArray(body[mode]) ? body[mode] : [];
          requestBody = {
            contentType: mode === 'urlencoded' ? 'application/x-www-form-urlencoded' : 'multipart/form-data',
            fields: entries.flatMap((e) => (isObject(e) && str(e['key']) ? [{ name: str(e['key'])!, type: str(e['type']), required: false, enumValues: [], constraints: [] }] : [])),
            note: 'keys only; values not shown',
          };
        } else if (mode) {
          requestBody = { contentType: null, fields: [], note: `${mode} body; content not shown` };
        }
      }

      const responses: ApiResponse[] = Array.isArray(raw['response'])
        ? raw['response'].flatMap((example) =>
            isObject(example)
              ? [{
                  status: String(example['code'] ?? '?'),
                  description: str(example['name']) ?? str(example['status']) ?? '',
                  fields: jsonFieldNames(String(example['body'] ?? '')) ?? [],
                }]
              : [],
          )
        : [];

      const script = scriptText(raw['event']);
      const provides = [...new Set([...script.matchAll(POSTMAN_SET)].map((match) => `variable ${match[1]}`))];
      const usedText = JSON.stringify(req);
      const uses = [...new Set([...usedText.matchAll(POSTMAN_USE)].map((match) => match[1]!))];

      const auth = ownAuth.length > 0 ? ownAuth : isObject(req) ? postmanAuth(req['auth']) : [];
      operations.push({
        method: (str(req['method']) ?? 'GET').toUpperCase(),
        path: url,
        name: name ? [...folder, name].join(' / ') : null,
        summary: isObject(req) ? (typeof req['description'] === 'string' ? str(req['description']) : null) : null,
        tags: folder,
        parameters: query,
        headers,
        requestBody,
        responses,
        auth: auth.length > 0 ? auth : inheritedAuth,
        provides,
        uses,
      });
    }
  };

  visit(doc['item'], [], collectionAuth);

  const variables = Array.isArray(doc['variable'])
    ? doc['variable'].flatMap((v) => (isObject(v) && str(v['key']) ? [str(v['key'])!] : []))
    : [];

  return { authSchemes: collectionAuth.map((type) => `collection auth (${type})`), operations, variables };
}

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

/** Parses specification text. `path` is recorded as given. */
export function parseApiSpec(text: string, path: string): ApiSpec {
  const trimmed = text.replace(/^﻿/, '').trimStart();
  if (!trimmed.startsWith('{')) {
    throw new ApiSpecError(
      'UNSUPPORTED_FORMAT',
      `${path} is not JSON. YAML OpenAPI/Swagger is not supported (no YAML parser — zero dependencies); export the specification as JSON.`,
    );
  }

  let doc: unknown;
  try {
    doc = JSON.parse(trimmed);
  } catch (error) {
    throw new ApiSpecError('INVALID_JSON', `${path} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  const detected = detectApiSpecType(doc);
  if (!detected || !isObject(doc)) {
    throw new ApiSpecError('UNSUPPORTED_FORMAT', `${path} is JSON but not an OpenAPI 3, Swagger 2 or Postman Collection document.`);
  }

  const info = isObject(doc['info']) ? doc['info'] : {};
  const body = detected.type === 'Postman' ? readPostman(doc) : readOpenApi(doc, detected.type);

  return {
    type: detected.type,
    version: detected.version,
    title: str(info['title']) ?? str(info['name']),
    path,
    sha256: createHash('sha256').update(text, 'utf8').digest('hex'),
    ...body,
  };
}

/** Reads and parses a specification file. */
export function readApiSpec(path: string): ApiSpec {
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    throw new ApiSpecError(code === 'ENOENT' ? 'NOT_FOUND' : 'UNREADABLE', `${path}: ${code === 'ENOENT' ? 'no such file' : String(error)}`);
  }
  return parseApiSpec(text, path);
}

/**
 * Keeps the operations relevant to the story: any whose method, path, name,
 * summary or tags contain one of `terms` (case-insensitive). No terms: all.
 */
export function filterOperations(operations: readonly ApiOperation[], terms: readonly string[]): ApiOperation[] {
  const needles = terms.map((term) => term.toLowerCase()).filter(Boolean);
  if (needles.length === 0) return [...operations];
  return operations.filter((operation) => {
    const haystack = [operation.method, operation.path, operation.name, operation.summary, ...operation.tags].join(' ').toLowerCase();
    return needles.some((needle) => haystack.includes(needle));
  });
}

/**
 * Dependencies between operations: B depends on A when B uses a variable A
 * provides (Postman), or A links to B's operationId (OpenAPI).
 */
export function operationDependencies(operations: readonly ApiOperation[]): { from: string; to: string; via: string }[] {
  const label = (operation: ApiOperation): string => `${operation.method} ${operation.name ?? operation.path}`;
  const dependencies: { from: string; to: string; via: string }[] = [];

  for (const provider of operations) {
    for (const provided of provider.provides) {
      const variable = /^variable (.+)$/.exec(provided)?.[1];
      const linked = /-> (\S+)/.exec(provided)?.[1];
      for (const consumer of operations) {
        if (consumer === provider) continue;
        if (variable && consumer.uses.includes(variable)) dependencies.push({ from: label(provider), to: label(consumer), via: `variable ${variable}` });
        if (linked && consumer.name === linked) dependencies.push({ from: label(provider), to: label(consumer), via: provided });
      }
    }
  }
  return dependencies;
}
