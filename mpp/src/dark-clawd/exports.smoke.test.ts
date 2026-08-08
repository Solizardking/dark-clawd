/**
 * Post-build package surface smoke — drives real dist entry points.
 * Run after `npm run build` (or when dist/ already present from CI).
 */
import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const mppRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(join(mppRoot, 'package.json'));

function ensureBuilt() {
  const dark = join(mppRoot, 'dist/dark-clawd/index.js');
  const server = join(mppRoot, 'dist/server/index.js');
  const client = join(mppRoot, 'dist/client/index.js');
  const root = join(mppRoot, 'dist/index.js');
  if (existsSync(dark) && existsSync(server) && existsSync(client) && existsSync(root)) {
    return;
  }
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: mppRoot,
    encoding: 'utf8',
    env: process.env,
  });
  expect(build.status).toBe(0);
}

describe('solana-mpp package surface (post-build)', () => {
  test('declared exports resolve to dist files', () => {
    ensureBuilt();
    const pkg = JSON.parse(readFileSync(join(mppRoot, 'package.json'), 'utf8'));
    expect(pkg.exports['.']).toBeDefined();
    expect(pkg.exports['./server']).toBeDefined();
    expect(pkg.exports['./client']).toBeDefined();
    expect(pkg.exports['./dark-clawd']).toBeDefined();

    for (const sub of ['solana-mpp', 'solana-mpp/server', 'solana-mpp/client', 'solana-mpp/dark-clawd']) {
      const resolved = require.resolve(sub);
      expect(resolved.includes(`${join('mpp', 'dist')}`) || resolved.includes('/dist/')).toBe(true);
      expect(existsSync(resolved)).toBe(true);
    }
  });

  test('dist/dark-clawd createDarkClawdMpp charge → 402', async () => {
    ensureBuilt();
    const href = pathToFileURL(join(mppRoot, 'dist/dark-clawd/index.js')).href;
    const mod = await import(href);
    expect(typeof mod.createDarkClawdMpp).toBe('function');
    const mpp = mod.createDarkClawdMpp({
      recipient: 'So11111111111111111111111111111111111111112',
      network: 'devnet',
      mode: 'paper',
      currency: 'USDC',
    });
    const result = await mpp.charge({ amount: '0.01', description: 'export-smoke' });
    expect(result.status).toBe(402);
    if (result.status === 402) {
      expect(result.challenge.amount).toBe('10000');
      expect(result.challenge.reference.length).toBeGreaterThan(8);
    }
  });

  test('bin/info.mjs prints solana-mpp + dark-clawd', () => {
    const info = spawnSync(process.execPath, [join(mppRoot, 'bin/info.mjs')], {
      cwd: mppRoot,
      encoding: 'utf8',
    });
    expect(info.status).toBe(0);
    const out = `${info.stdout}\n${info.stderr}`;
    expect(out).toMatch(/solana-mpp/i);
    expect(out).toMatch(/dark-clawd/i);
  });
});
