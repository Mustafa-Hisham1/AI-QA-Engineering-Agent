/**
 * Ends an NBO Admin Panel session through the application's logout API
 * (human instruction 2026-10-10; `docs/product-decisions.md` §7.1.3):
 *
 *   POST <backend>/api/v1/Auth/logout?api-version=1
 *   accept: application/json · Language: En · Content-Type: application/json
 *   Authorization: Bearer <the token of the session being closed>
 *   { "allSessions": false }
 *
 * Sessions live in Redis server-side; clearing the browser does not end them.
 * `allSessions: false` ends only this session — never the account's other
 * sessions, which may belong to another test or a person.
 *
 * The backend origin is not configured here: it is taken from the request that
 * carried the token, so the logout always goes to the backend that issued the
 * session. The token is captured from the application's own requests (it is
 * never typed, stored or printed), registered for redaction, and held in memory.
 *
 * No assertion, no credential value in source. Pure apart from `fetch`.
 */

export const LOGOUT_PATH = '/api/v1/Auth/logout?api-version=1';

/** What the login Page Object observed of one session. */
export interface CapturedSession {
  /** Origin of the backend that received the token, e.g. `https://…backend…`. */
  origin: string | null;
  /** The most recent bearer token the application sent for this session. */
  token: string | null;
  /** The most recent read-only (GET) backend request sent with that token. */
  probeUrl: string | null;
}

export function newCapturedSession(): CapturedSession {
  return { origin: null, token: null, probeUrl: null };
}

/** The token of an `Authorization: Bearer <token>` header, or null. */
export function bearerToken(authorization: string | undefined): string | null {
  const match = /^Bearer\s+(\S+)$/i.exec(authorization?.trim() ?? '');
  return match ? match[1]! : null;
}

/**
 * Updates a session from one request the application sent. Only requests
 * carrying a bearer token count; the logout call itself is ignored.
 */
export function observeRequest(session: CapturedSession, request: { url: string; method: string; authorization: string | undefined }): boolean {
  const token = bearerToken(request.authorization);
  if (!token || request.url.includes('/Auth/logout')) return false;
  session.token = token;
  session.origin = new URL(request.url).origin;
  if (request.method.toUpperCase() === 'GET' && !/\/Auth\//i.test(request.url)) session.probeUrl = request.url;
  return true;
}

export interface LogoutRequest {
  readonly url: string;
  readonly method: 'POST';
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
}

/** The logout request for one session — `allSessions` is always false. */
export function buildLogoutRequest(origin: string, token: string): LogoutRequest {
  return {
    url: new URL(LOGOUT_PATH, origin).toString(),
    method: 'POST',
    headers: {
      accept: 'application/json',
      Language: 'En',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ allSessions: false }),
  };
}

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body?: string; signal: AbortSignal }) => Promise<{
  readonly status: number;
  readonly ok: boolean;
}>;

/**
 * Calls the logout API for a session, then checks the server really ended it by
 * repeating one of the application's own read-only requests with the old
 * token: 401 means the session is gone. Returns evidence (status codes only).
 *
 * @throws when the logout is refused, or the old token still works afterwards.
 */
export async function logoutViaApi(session: CapturedSession, fetchImpl: FetchLike = fetch as unknown as FetchLike): Promise<string> {
  if (!session.origin || !session.token) throw new Error('No session token was captured, so there is no session to log out.');
  const request = buildLogoutRequest(session.origin, session.token);
  const response = await fetchImpl(request.url, {
    method: request.method,
    headers: { ...request.headers },
    body: request.body,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`The logout API answered HTTP ${response.status}.`);

  if (!session.probeUrl) return `logout API HTTP ${response.status}; no read-only request was seen to confirm the token is now rejected`;
  const probe = await fetchImpl(session.probeUrl, {
    method: 'GET',
    headers: { accept: 'application/json', Language: 'En', Authorization: `Bearer ${session.token}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (probe.ok) throw new Error(`The logout API answered HTTP ${response.status}, but the old token still works (HTTP ${probe.status}).`);
  return `logout API HTTP ${response.status}; old token now rejected (HTTP ${probe.status})`;
}
