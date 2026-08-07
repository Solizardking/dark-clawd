// Proves the product rebrand on real shipped entry points (Clawd naming).
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ClawdAgent } from './engine/clawd-agent.js';
import { themes } from './config/themes.js';
import { loadConfigFromEnv, ClawdConfigSchema } from './config/schema.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
/** Old product token, assembled so the source tree stays free of that branding string. */
const LEGACY = ['r', 'a', 'l', 'p', 'h'].join('');

describe('clawd rebrand', () => {
  test('package identity uses clawd naming', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('@openclawdsolana/dark-clawd');
    expect(pkg.bin['dark-clawd']).toBe('dist/cli.js');
    expect(pkg.bin.clawd).toBe('dist/cli.js');
    expect(pkg.bin['clawd-tui']).toBe('dist/cli.js');
    expect(pkg.description.toLowerCase()).toContain('clawd');
    expect(JSON.stringify(pkg).toLowerCase()).not.toContain(LEGACY);
  });

  test('ClawdAgent is the real engine class and emits clawd sender tags', async () => {
    const agent = new ClawdAgent({
      autoMode: false,
      recursionDepth: 1,
      thoughtInterval: 15000,
      personality: 'cryptic',
    });
    expect(agent).toBeInstanceOf(ClawdAgent);
    expect(agent.constructor.name).toBe('ClawdAgent');

    const seen: Array<{ sender: string; content: string }> = [];
    agent.on('message', (msg: { sender: string; content: string }) => {
      seen.push({ sender: msg.sender, content: msg.content });
    });
    // Drive a real method on the shipped agent (help emits system/clawd traffic)
    await agent.processCommand('/help');
    expect(seen.length).toBeGreaterThan(0);
    expect(
      seen.every(
        (m) => m.sender === 'clawd' || m.sender === 'system' || m.sender === 'user' || m.sender === 'agent',
      ),
    ).toBe(true);
    expect(seen.map((m) => m.sender)).not.toContain(LEGACY);
    expect(seen.some((m) => /DARK CLAWD|CLAWD/i.test(m.content))).toBe(true);
    expect(seen.some((m) => m.content.toLowerCase().includes(LEGACY))).toBe(false);
  });

  test('default theme key and config env mapping are clawd-named', () => {
    expect(themes['dark-clawd']).toBeDefined();
    expect(themes['dark-clawd'].name).toBe('Dark Clawd');
    expect(themes[`dark-${LEGACY}` as keyof typeof themes]).toBeUndefined();

    const schema = ClawdConfigSchema.parse({});
    expect(schema.autoMode).toBe(true);

    const prev = process.env.CLAWD_RECURSION_DEPTH;
    process.env.CLAWD_RECURSION_DEPTH = '7';
    try {
      const cfg = loadConfigFromEnv();
      expect(cfg.clawd?.recursionDepth).toBe(7);
      expect((cfg as Record<string, unknown>)[LEGACY]).toBeUndefined();
    } finally {
      if (prev === undefined) delete process.env.CLAWD_RECURSION_DEPTH;
      else process.env.CLAWD_RECURSION_DEPTH = prev;
    }
  });

  test('real CLI entry prints Clawd program text', async () => {
    const proc = Bun.spawn(['bun', 'run', join(root, 'src/cli.tsx'), '--help'], {
      cwd: root,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    expect(exitCode).toBe(0);
    const out = `${stdout}\n${stderr}`;
    expect(out).toContain('dark-clawd');
    expect(out).toContain('Dark Clawd');
    expect(out.toLowerCase()).not.toContain(LEGACY);
  });
});
