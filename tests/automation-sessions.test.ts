/**
 * Tests for automated-session cleanup (`docs/product-decisions.md` §7.1.3):
 * the shared registry behind the `endSessions` fixture
 * (src/automation/sessions.ts) and the NBO logout-API client
 * (automation/NBO/Authentication/support/session-api.ts).
 *
 * Every session a test opens must be ended through the logout API with ITS OWN
 * token and `allSessions: false` — after a pass or a failure, and before an
 * account switch — without touching another test's sessions and without
 * replacing the test's own result. A fake `fetch` stands in for STG.
 */

import { deepStrictEqual, match, ok, rejects, strictEqual } from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { redact } from '../src/ado/errors.ts';
import { endOpenSessionsNow, endSessions, openSessions, registerSession, registerSessionSecret } from '../src/automation/sessions.ts';
import {
  LOGOUT_PATH,
  bearerToken,
  buildLogoutRequest,
  logoutViaApi,
  newCapturedSession,
  observeRequest,
  type CapturedSession,
  type FetchLike,
} from '../automation/NBO/Authentication/support/session-api.ts';

const BACKEND = 'https://backend.example.test';

interface Call {
  readonly url: string;
  readonly method: string;
  readonly headers: Record<string, string>;
  readonly body?: string;
}

/**
 * A fake backend: the logout API ends a token; afterwards any GET with that
 * token is 401. `logoutStatus` simulates a refusal.
 */
function fakeBackend(logoutStatus = 200): { fetch: FetchLike; calls: Call[] } {
  const ended = new Set<string>();
  const calls: Call[] = [];
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push({ url, method: init.method, headers: init.headers, ...(init.body === undefined ? {} : { body: init.body }) });
    const token = bearerToken(init.headers['Authorization']) ?? '';
    if (url.includes('/Auth/logout')) {
      if (logoutStatus === 200) ended.add(token);
      return { status: logoutStatus, ok: logoutStatus < 300 };
    }
    const status = ended.has(token) ? 401 : 200;
    return { status, ok: status < 300 };
  };
  return { fetch: fetchImpl, calls };
}

/** A session as the login Page Object captures it from the app's own requests. */
function sessionFor(token: string): CapturedSession {
  const session = newCapturedSession();
  observeRequest(session, { url: `${BACKEND}/api/v1/operatingcountries?Status=1`, method: 'GET', authorization: `Bearer ${token}` });
  return session;
}

/** A stand-in for a test's `page`: the registry only needs an object identity. */
function newPage(): object {
  return {};
}

function logoutCalls(calls: readonly Call[]): Call[] {
  return calls.filter((call) => call.url.includes('/Auth/logout'));
}

// --- The logout request ------------------------------------------------------

test('the logout request is the application contract: POST, headers, allSessions false, this session token', () => {
  const request = buildLogoutRequest(BACKEND, 'tok-maker');
  strictEqual(request.url, `${BACKEND}${LOGOUT_PATH}`);
  strictEqual(request.url, `${BACKEND}/api/v1/Auth/logout?api-version=1`);
  strictEqual(request.method, 'POST');
  deepStrictEqual(request.headers, {
    accept: 'application/json',
    Language: 'En',
    'Content-Type': 'application/json',
    Authorization: 'Bearer tok-maker',
  });
  deepStrictEqual(JSON.parse(request.body), { allSessions: false });
});

test('the token and backend come from the app requests; the logout call and non-bearer requests are ignored', () => {
  const session = newCapturedSession();
  strictEqual(observeRequest(session, { url: `${BACKEND}/api/v1/x`, method: 'GET', authorization: undefined }), false);
  strictEqual(observeRequest(session, { url: 'https://frontend.example.test/main.js', method: 'GET', authorization: 'Basic abc' }), false);
  ok(observeRequest(session, { url: `${BACKEND}/api/v1/operatingcountries`, method: 'GET', authorization: 'Bearer tok-1' }));
  ok(observeRequest(session, { url: `${BACKEND}/api/v1/operatingcountries/7`, method: 'PUT', authorization: 'Bearer tok-2' }));
  strictEqual(observeRequest(session, { url: `${BACKEND}${LOGOUT_PATH}`, method: 'POST', authorization: 'Bearer tok-x' }), false);
  deepStrictEqual(session, { origin: BACKEND, token: 'tok-2', probeUrl: `${BACKEND}/api/v1/operatingcountries` }, 'latest token; probe is a GET only');
});

test('logout succeeds only when the server then rejects the old token', async () => {
  const backend = fakeBackend();
  const detail = await logoutViaApi(sessionFor('tok-1'), backend.fetch);
  strictEqual(detail, 'logout API HTTP 200; old token now rejected (HTTP 401)');
  deepStrictEqual(
    backend.calls.map((call) => [call.method, call.url.replace(BACKEND, '')]),
    [
      ['POST', LOGOUT_PATH],
      ['GET', '/api/v1/operatingcountries?Status=1'],
    ],
  );
});

test('a refused logout, or a token that still works afterwards, is an error', async () => {
  await rejects(logoutViaApi(sessionFor('tok-1'), fakeBackend(500).fetch), /logout API answered HTTP 500/);
  const stillWorks: FetchLike = async () => ({ status: 200, ok: true });
  await rejects(logoutViaApi(sessionFor('tok-1'), stillWorks), /old token still works \(HTTP 200\)/);
  await rejects(logoutViaApi(newCapturedSession(), fakeBackend().fetch), /No session token was captured/);
});

test('a session token is registered for redaction and never printed', () => {
  registerSessionSecret('tok-secret-abc123');
  strictEqual(redact('Authorization: Bearer tok-secret-abc123'), 'Authorization: Bearer [REDACTED]');
});

// --- The registry and the fixture's teardown ---------------------------------

/** What the login Page Object registers: end the session through the API. */
function registerApiSession(page: object, handle: string, token: string, backend: { fetch: FetchLike }): void {
  const session = sessionFor(token);
  registerSession(page, handle, async () => ({ ended: true, detail: await logoutViaApi(session, backend.fetch) }));
}

test('a passing test: teardown calls the logout API with its token and allSessions false', async () => {
  const page = newPage();
  const backend = fakeBackend();
  registerApiSession(page, 'ADMIN_ALL', 'tok-admin', backend);

  const results = await endSessions(page);
  deepStrictEqual(results.map((result) => [result.label, result.outcome, result.when]), [['ADMIN_ALL', 'logged-out', 'teardown']]);
  const [logout] = logoutCalls(backend.calls);
  strictEqual(logout!.headers['Authorization'], 'Bearer tok-admin');
  deepStrictEqual(JSON.parse(logout!.body!), { allSessions: false });
  deepStrictEqual(openSessions(page), []);
});

test('a failing test: teardown still calls the logout API — it does not depend on the result', async () => {
  const page = newPage();
  const backend = fakeBackend();
  registerApiSession(page, 'OPERATING_COUNTRIES_MAKER', 'tok-maker', backend);

  const failure = await (async () => {
    throw new Error('expect(locator).toBeVisible() failed');
  })().catch((error: unknown) => error);

  ok(failure instanceof Error);
  deepStrictEqual((await endSessions(page)).map((result) => result.outcome), ['logged-out']);
  strictEqual(logoutCalls(backend.calls).length, 1);
});

test('several accounts: each session is logged out with its own token — at the switch and at teardown', async () => {
  const page = newPage();
  const backend = fakeBackend();
  registerApiSession(page, 'OPERATING_COUNTRIES_MAKER', 'tok-maker', backend);
  await endOpenSessionsNow(page); // LoginPage.signOut() before the next login
  registerApiSession(page, 'OPERATING_COUNTRIES_APPROVER', 'tok-approver', backend);
  await endOpenSessionsNow(page);
  registerApiSession(page, 'ADMIN_ALL', 'tok-admin', backend);

  const results = await endSessions(page);
  deepStrictEqual(
    results.map((result) => [result.label, result.when, result.outcome]),
    [
      ['OPERATING_COUNTRIES_MAKER', 'switch', 'logged-out'],
      ['OPERATING_COUNTRIES_APPROVER', 'switch', 'logged-out'],
      ['ADMIN_ALL', 'teardown', 'logged-out'],
    ],
  );
  deepStrictEqual(
    logoutCalls(backend.calls).map((call) => call.headers['Authorization']),
    ['Bearer tok-maker', 'Bearer tok-approver', 'Bearer tok-admin'],
    'each logout carries the token of the session being closed',
  );
  ok(logoutCalls(backend.calls).every((call) => JSON.parse(call.body!).allSessions === false));
});

test("a test's teardown never ends another test's session", async () => {
  const mine = newPage();
  const theirs = newPage();
  const backend = fakeBackend();
  registerApiSession(mine, 'ADMIN_ALL', 'tok-mine', backend);
  registerApiSession(theirs, 'ADMIN_ALL', 'tok-theirs', backend);

  await endSessions(mine);
  deepStrictEqual(logoutCalls(backend.calls).map((call) => call.headers['Authorization']), ['Bearer tok-mine']);
  deepStrictEqual(openSessions(theirs), ['ADMIN_ALL']);
  await endSessions(theirs);
});

test('a failed logout is reported, never thrown, and the other sessions are still attempted', async () => {
  const page = newPage();
  const good = fakeBackend();
  const refusing = fakeBackend(503);
  registerApiSession(page, 'OPERATING_COUNTRIES_MAKER', 'tok-maker', good);
  registerApiSession(page, 'ADMIN_ALL', 'tok-admin', refusing);

  const results = await endSessions(page);
  deepStrictEqual(
    results.map((result) => [result.label, result.outcome]),
    [
      ['ADMIN_ALL', 'failed'],
      ['OPERATING_COUNTRIES_MAKER', 'logged-out'],
    ],
  );
  match(results[0]!.detail, /HTTP 503/);
});

test('a failed logout at an account switch does not stop the test, and is reported at teardown', async () => {
  const page = newPage();
  registerApiSession(page, 'OPERATING_COUNTRIES_MAKER', 'tok-maker', fakeBackend(500));
  const atSwitch = await endOpenSessionsNow(page); // resolves — never throws
  strictEqual(atSwitch[0]!.outcome, 'failed');
  deepStrictEqual((await endSessions(page)).map((result) => [result.when, result.outcome]), [['switch', 'failed']]);
});

test('a login that never completed has nothing to end, and that is not a failure', async () => {
  const page = newPage();
  registerSession(page, 'ADMIN_ALL', async () => ({ ended: false, detail: 'no session token was issued to this page' }));
  deepStrictEqual((await endSessions(page)).map((result) => result.outcome), ['nothing-to-end']);
  deepStrictEqual(await endSessions(newPage()), []);
});

// --- The wiring, checked in the source ---------------------------------------

test('the shared fixtures end sessions automatically after the test, and never throw', () => {
  const fixtures = readFileSync(new URL('../src/automation/fixtures.ts', import.meta.url), 'utf8');
  const block = fixtures.slice(fixtures.indexOf('endSessions: ['), fixtures.indexOf('appEnv: async'));
  ok(/async \(\{ page \}, use, testInfo\) => \{\s*await use\(\);/.test(block), 'teardown runs after use()');
  ok(/auto: true/.test(block), 'endSessions is an auto fixture');
  ok(!/throw/.test(block), 'teardown never throws');
});

test('the NBO login ends sessions through the logout API, never by clearing the browser alone', () => {
  const login = readFileSync(new URL('../automation/NBO/Authentication/pages/LoginPage.ts', import.meta.url), 'utf8');
  const signIn = login.slice(login.indexOf('async signIn('), login.indexOf('async waitUntilSignedIn('));
  ok(signIn.indexOf("this.page.on('request'") < signIn.indexOf('this.loginButton.click()'), 'token capture starts before the login is submitted');
  ok(signIn.indexOf('registerSession(') > signIn.indexOf('this.loginButton.click()'), 'registered as the login is submitted');
  ok(signIn.includes('logoutViaApi(captured)'), 'ended through the logout API');
  const signOut = login.slice(login.indexOf('async signOut('));
  ok(signOut.indexOf('endOpenSessionsNow(') !== -1 && signOut.indexOf('endOpenSessionsNow(') < signOut.indexOf('clearCookies'), 'API logout before clearing');
});
