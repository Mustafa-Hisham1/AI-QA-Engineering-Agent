/**
 * Starts the Playwright test runner as a child process.
 *
 * Runs the locally installed, pinned `@playwright/test` CLI with the current
 * Node — never `npx`, which could fetch a different version.
 */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

import { playwrightChildEnv } from './config.ts';

export interface PlaywrightRun {
  readonly exitCode: number;
  /** Combined stdout and stderr, when captured. */
  readonly output: string;
}

/**
 * @param args       arguments after `playwright`, e.g. `['test', '--list']`
 * @param projectKey pinned into the child as `QA_ACTIVE_PROJECT`, when given
 * @param capture    collect output instead of streaming it to this terminal
 */
export function runPlaywright(args: readonly string[], projectKey?: string, capture = false): Promise<PlaywrightRun> {
  const cli = createRequire(import.meta.url).resolve('@playwright/test/cli');

  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [cli, ...args], {
      env: playwrightChildEnv(projectKey),
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    });

    let output = '';
    child.stdout?.on('data', (chunk: Buffer) => (output += chunk.toString('utf8')));
    child.stderr?.on('data', (chunk: Buffer) => (output += chunk.toString('utf8')));

    child.on('error', reject);
    child.on('close', (code) => resolvePromise({ exitCode: code ?? 1, output }));
  });
}
