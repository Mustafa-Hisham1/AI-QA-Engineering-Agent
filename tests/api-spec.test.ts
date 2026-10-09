/**
 * Tests for the optional API source of /analyze-story (src/analysis/api-spec.ts):
 * OpenAPI 3, Swagger 2 and Postman Collection reading, and the rule that a
 * specification's VALUES — examples, headers, variables, credentials — never
 * leave the reader.
 */

import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  ApiSpecError,
  detectApiSpecType,
  filterOperations,
  operationDependencies,
  parseApiSpec,
  readApiSpec,
  type ApiSpec,
} from '../src/analysis/api-spec.ts';

const fixture = (name: string): string => fileURLToPath(new URL(`./fixtures/api/${name}`, import.meta.url));
const OPENAPI = readApiSpec(fixture('openapi-auth.json'));
const SWAGGER = readApiSpec(fixture('swagger-auth.json'));
const POSTMAN = readApiSpec(fixture('postman-auth.json'));

function op(spec: ApiSpec, method: string, path: string) {
  const found = spec.operations.find((entry) => entry.method === method && entry.path === path);
  ok(found, `${method} ${path} must be read`);
  return found;
}

test('the specification type is identified from content, and recorded with its version', () => {
  deepStrictEqual([OPENAPI.type, OPENAPI.version, OPENAPI.title], ['OpenAPI', '3.0.1', 'DEMO Auth API']);
  deepStrictEqual([SWAGGER.type, SWAGGER.version], ['Swagger', '2.0']);
  deepStrictEqual([POSTMAN.type, POSTMAN.version, POSTMAN.title], ['Postman', '2.1.0', 'DEMO Auth Collection']);
  strictEqual(detectApiSpecType({ hello: 'world' }), null);
});

test('the source fingerprint is the sha256 of the file, stable across reads and sensitive to change', () => {
  const text = readFileSync(fixture('openapi-auth.json'), 'utf8');

  strictEqual(OPENAPI.sha256, readApiSpec(fixture('openapi-auth.json')).sha256);
  ok(/^[0-9a-f]{64}$/.test(OPENAPI.sha256));
  ok(parseApiSpec(text.replace('"maxLength": 50', '"maxLength": 60'), 'x.json').sha256 !== OPENAPI.sha256);
});

test('OpenAPI: methods, paths, request body with required fields, constraints and $ref resolution', () => {
  const login = op(OPENAPI, 'POST', '/auth/login');

  strictEqual(login.name, 'login');
  strictEqual(login.summary, 'Authenticate a user');
  deepStrictEqual(login.tags, ['Authentication']);
  strictEqual(login.requestBody!.contentType, 'application/json');
  strictEqual(login.requestBody!.note, 'required');

  const email = login.requestBody!.fields.find((field) => field.name === 'email')!;
  deepStrictEqual([email.type, email.required, email.constraints], ['string', true, ['format email', 'maxLength 50']]);
  const agency = login.requestBody!.fields.find((field) => field.name === 'agencyCode')!;
  deepStrictEqual([agency.required, agency.constraints], [false, ['pattern ^[A-Z0-9]{6}$']]);
});

test('OpenAPI: status codes, response fields, nested fields and enums', () => {
  const login = op(OPENAPI, 'POST', '/auth/login');

  deepStrictEqual(login.responses.map((response) => response.status), ['200', '401', '423']);
  strictEqual(login.responses[2]!.description, 'Account locked');
  const role = login.responses[0]!.fields.find((field) => field.name === 'user.role')!;
  deepStrictEqual(role.enumValues, ['ADMIN', 'AGENT']);
});

test('OpenAPI: path-level and operation parameters, enum on a query parameter', () => {
  const profile = op(OPENAPI, 'GET', '/users/{id}');

  deepStrictEqual(profile.parameters.map((p) => [p.name, p.location, p.required]), [['id', 'path', true], ['include', 'query', false]]);
  deepStrictEqual(profile.parameters[0]!.constraints, ['minimum 1']);
  deepStrictEqual(profile.parameters[1]!.enumValues, ['roles', 'agency']);
});

test('OpenAPI: authentication — global scheme, explicit opt-out, scheme types', () => {
  deepStrictEqual(OPENAPI.authSchemes, ['bearerAuth (http, bearer)']);
  deepStrictEqual(op(OPENAPI, 'GET', '/users/{id}').auth, ['bearerAuth']);
  deepStrictEqual(op(OPENAPI, 'POST', '/auth/login').auth, ['none (explicitly unsecured)']);
});

test('OpenAPI: response links become dependencies between endpoints', () => {
  deepStrictEqual(operationDependencies(OPENAPI.operations), [
    { from: 'POST login', to: 'GET getProfile', via: 'link GetProfile -> getProfile (on 200)' },
  ]);
});

test('Swagger 2: the in:body parameter becomes the request body; parameter-level enum kept', () => {
  const login = op(SWAGGER, 'POST', '/login');

  deepStrictEqual(login.requestBody!.fields.map((field) => [field.name, field.required]), [['username', true], ['password', false]]);
  deepStrictEqual(login.parameters.map((p) => [p.name, p.enumValues]), [['lang', ['en', 'ar']]]);
  deepStrictEqual(login.auth, ['apiKey']);
  deepStrictEqual(SWAGGER.authSchemes, ['apiKey (apiKey, header)']);
  deepStrictEqual(login.responses[0]!.fields.map((field) => field.name), ['token']);
});

test('Postman: requests in folders, methods, URLs, query, headers, body fields, example responses', () => {
  const login = op(POSTMAN, 'POST', '{{baseUrl}}/auth/login');

  strictEqual(login.name, 'Authentication / Login');
  deepStrictEqual(login.tags, ['Authentication']);
  deepStrictEqual(login.parameters.map((p) => [p.name, p.location]), [['lang', 'query']]);
  deepStrictEqual(login.headers, ['Content-Type', 'X-Client-Secret']);
  deepStrictEqual(login.requestBody!.fields.map((field) => field.name), ['email', 'password', 'agencyCode']);
  deepStrictEqual(login.responses.map((r) => [r.status, r.description]), [['200', 'Success']]);
  deepStrictEqual(login.responses[0]!.fields.map((field) => field.name), ['token', 'user', 'user.id']);
});

test('Postman: auth inheritance — request override, collection default', () => {
  deepStrictEqual(op(POSTMAN, 'POST', '{{baseUrl}}/auth/login').auth, ['noauth']);
  deepStrictEqual(op(POSTMAN, 'GET', '{{baseUrl}}/users/me').auth, ['bearer']);
  deepStrictEqual(POSTMAN.authSchemes, ['collection auth (bearer)']);
});

test('Postman: variables set by one request and used by another become a dependency', () => {
  deepStrictEqual(op(POSTMAN, 'POST', '{{baseUrl}}/auth/login').provides, ['variable authToken']);
  ok(op(POSTMAN, 'GET', '{{baseUrl}}/users/me').uses.includes('authToken'));
  deepStrictEqual(operationDependencies(POSTMAN.operations), [
    { from: 'POST Authentication / Login', to: 'GET Authentication / Profile', via: 'variable authToken' },
  ]);
  deepStrictEqual(POSTMAN.variables, ['baseUrl', 'adminPassword']);
});

test('no value ever leaves the reader: examples, header values, variables, auth, bodies, responses', () => {
  const everything = JSON.stringify([OPENAPI, SWAGGER, POSTMAN]);

  for (const secret of [
    'Example-Secret-Pw1',
    'real.person@example.test',
    'Postman-Bearer-Secret-777',
    'Postman-Var-Secret-555',
    'Postman-Header-Secret-333',
    'Postman-Body-Secret-111',
    'Response-Token-Secret-999',
    'stg.internal.example.test',
  ]) {
    ok(!everything.includes(secret), `${secret} must never be emitted`);
  }
});

test('filterOperations keeps only the operations relevant to the story', () => {
  deepStrictEqual(filterOperations(OPENAPI.operations, ['login']).map((o) => o.path), ['/auth/login']);
  deepStrictEqual(filterOperations(OPENAPI.operations, ['CITY']).map((o) => o.path), ['/cities']);
  strictEqual(filterOperations(OPENAPI.operations, []).length, 3);
});

test('unusable sources fail with a clear code — never a guess', () => {
  const code = (fn: () => unknown, expected: string): void =>
    throws(fn, (error: unknown) => error instanceof ApiSpecError && error.code === expected);

  code(() => readApiSpec(fixture('does-not-exist.json')), 'NOT_FOUND');
  code(() => parseApiSpec('openapi: 3.0.0\ninfo:\n  title: x', 'spec.yaml'), 'UNSUPPORTED_FORMAT');
  code(() => parseApiSpec('{ not json', 'broken.json'), 'INVALID_JSON');
  code(() => parseApiSpec('{"name": "not a spec"}', 'other.json'), 'UNSUPPORTED_FORMAT');
});
