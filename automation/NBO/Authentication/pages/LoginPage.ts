/**
 * The Admin Panel staff login page (explored on STG 2026-10-10).
 *
 * Locators and actions only — no assertion, no credential. The caller passes
 * the account it resolved through the `account(H)` fixture, and judges the
 * result itself once the app has settled.
 *
 * Sessions (`docs/product-decisions.md` §7.1.3): each submitted login is
 * registered with the shared session registry, and ended through the
 * application's logout API with that session's own token
 * (`../support/session-api.ts`) — before another login on the same page, and
 * by the `endSessions` fixture at test end, passed or failed. The token is
 * taken from the application's own backend requests, registered for redaction,
 * and kept in memory only. Clearing cookies or storage is NOT a logout: the
 * server keeps the session.
 *
 * The page also offers an API backend toggle (Development / Testing / Local).
 * It is deliberately never touched: its default is the backend STG runs on.
 */

import type { Locator, Page, Request } from '@playwright/test';

import { endOpenSessionsNow, openSessions, registerSession, registerSessionSecret } from '../../../../src/automation/sessions.ts';
import { logoutViaApi, newCapturedSession, observeRequest } from '../support/session-api.ts';

export interface LoginAccount {
  /** The handle the account was resolved from. Labels the session; never the username. */
  readonly handle?: string;
  readonly username: string;
  readonly password: string;
}

export class LoginPage {
  static readonly path = '/auth/staff-login';

  readonly page: Page;
  readonly userName: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userName = page.getByRole('textbox', { name: 'User Name (required)' });
    this.password = page.getByRole('textbox', { name: 'Password (required)' });
    this.loginButton = page.getByRole('button', { name: 'Login', exact: true });
  }

  async open(): Promise<void> {
    await this.page.goto(LoginPage.path);
  }

  /**
   * Fills and submits. Does not wait for the outcome — see `waitUntilSignedIn`.
   *
   * The form resets itself while it initialises, which empties values typed too
   * early (seen on STG 2026-10-10: "User Name is required." after a fill). So it
   * waits for the page to settle and re-fills a dropped value. The comparison
   * is in memory only — never an assertion, which would print the value.
   *
   * The session is registered as the login is submitted: a login that
   * completes after the test has already failed is still logged out.
   */
  async signIn(account: LoginAccount): Promise<void> {
    // One account per page at a time: end the previous session before another login.
    if (openSessions(this.page).length > 0) await this.signOut();
    await this.page.waitForLoadState('networkidle');
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.userName.fill(account.username);
      await this.password.fill(account.password);
      if ((await this.userName.inputValue()) === account.username && (await this.password.inputValue()) === account.password) break;
      await this.page.waitForTimeout(500); // the form gives no signal that it has initialised
    }

    // Capture this session's token from the application's own backend requests.
    const captured = newCapturedSession();
    const watch = (request: Request): void => {
      void request
        .allHeaders()
        .then((headers) => {
          if (observeRequest(captured, { url: request.url(), method: request.method(), authorization: headers['authorization'] }) && captured.token) {
            registerSessionSecret(captured.token);
          }
        })
        .catch(() => undefined); // a request whose page is gone carries nothing to capture
    };
    this.page.on('request', watch);

    await this.loginButton.click();
    registerSession(this.page, account.handle ?? 'account', async () => {
      if (!captured.token && !this.page.isClosed()) {
        // A login that was still completing: give the app a moment to make its first call.
        await this.page.waitForTimeout(3_000); // no event signals "the app used its token"
      }
      if (!this.page.isClosed()) this.page.off('request', watch);
      if (!captured.token) return { ended: false, detail: 'no session token was issued to this page — the login did not complete' };
      return { ended: true, detail: await logoutViaApi(captured) };
    });
  }

  /**
   * Settles on leaving the login route. The canary showed the page still on the
   * login route for a moment after a successful submit; judging then is a
   * false FAIL.
   */
  async waitUntilSignedIn(): Promise<void> {
    await this.page.waitForURL((url) => !url.pathname.startsWith('/auth/'), { timeout: 30_000 });
  }

  /** Opens the login page, signs in, and settles. */
  async signInAs(account: LoginAccount): Promise<void> {
    await this.open();
    await this.signIn(account);
    await this.waitUntilSignedIn();
  }

  /**
   * Ends the current session through the logout API so another role can sign
   * in on the same page — one page per spec keeps one video covering every
   * role. Then clears what the browser kept (the app must not reuse a dead
   * token) and opens the login page. A failed logout is reported at teardown;
   * it never stops the test.
   */
  async signOut(): Promise<void> {
    await endOpenSessionsNow(this.page);
    await this.page.context().clearCookies();
    await this.page.evaluate(() => {
      // Runs in the browser; the project compiles without the DOM library.
      const storage = globalThis as unknown as { localStorage: { clear(): void }; sessionStorage: { clear(): void } };
      storage.localStorage.clear();
      storage.sessionStorage.clear();
    });
    await this.open();
    await this.userName.waitFor();
  }
}
