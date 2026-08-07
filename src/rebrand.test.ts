// Proves the product rebrand on real shipped entry points (Clawd naming).
import { describe, expect, test } from 'bun:test';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ClawdAgent } from './engine/clawd-agent.js';
import { themes } from './config/themes.js';
import { loadConfigFromEnv, ClawdConfigSchema } from './config/schema.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
/** Old product token, assembled so the source tree stays free of that branding string. */
const LEGACY = ['r', 'a', 'l', 'p', 'h'].join('');

describe('clawd rebrand (root package)', () => {
  test('package identity uses clawd naming (legacy bins optional)', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('@x402solana/dark-clawd');
    expect(pkg.bin['dark-clawd']).toBe('./dist/cli.js');
    expect(pkg.bin.clawd).toBe('./dist/cli.js');
    expect(pkg.bin['clawd-tui']).toBe('./dist/cli.js');
    expect(pkg.description.toLowerCase()).toContain('clawd');
    expect(pkg.repository?.url).toContain('Solizardking/dark-clawd');
    expect(pkg.homepage).toBe('https://cheshireterminal.ai/dark-clawd');
  });

  test('engine file is clawd-agent and class is ClawdAgent', () => {
    expect(existsSync(join(root, 'src/engine/clawd-agent.ts'))).toBe(true);
    expect(existsSync(join(root, `src/engine/${LEGACY}-agent.ts`))).toBe(false);

    const agent = new ClawdAgent({
      autoMode: false,
      recursionDepth: 1,
      thoughtInterval: 15000,
      personality: 'cryptic',
    });
    expect(agent).toBeInstanceOf(ClawdAgent);
    expect(agent.constructor.name).toBe('ClawdAgent');
  });

  test('ClawdAgent emits clawd/system sender tags on real /help path', async () => {
    const agent = new ClawdAgent({
      autoMode: false,
      recursionDepth: 1,
      thoughtInterval: 15000,
      personality: 'cryptic',
    });
    const seen: Array<{ sender: string; content: string }> = [];
    agent.on('message', (msg: { sender: string; content: string }) => {
      seen.push({ sender: msg.sender, content: msg.content });
    });
    await agent.processCommand('/help');
    expect(seen.length).toBeGreaterThan(0);
    expect(
      seen.every(
        (m) =>
          m.sender === 'clawd' ||
          m.sender === 'system' ||
          m.sender === 'user' ||
          m.sender === 'agent',
      ),
    ).toBe(true);
    expect(seen.map((m) => m.sender)).not.toContain(LEGACY);
    expect(seen.some((m) => /DARK CLAWD|CLAWD/i.test(m.content))).toBe(true);
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

  test('public docs are Dark Clawd + accurate OpenClawd paths', () => {
    const openclawd = readFileSync(join(root, 'docs/OPENCLAWD_ADAPTATION.md'), 'utf8');
    const birdeye = readFileSync(join(root, 'docs/BIRDEYE_INTEGRATION.md'), 'utf8');
    const x = readFileSync(join(root, 'docs/X_ARTICLE.md'), 'utf8');
    const tuiReadme = readFileSync(join(root, 'tui/README.md'), 'utf8');
    const envExample = readFileSync(join(root, 'tui/.env.example'), 'utf8');
    const rootPkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const tuiPkg = JSON.parse(readFileSync(join(root, 'tui/package.json'), 'utf8'));

    expect(openclawd).toMatch(/Dark Clawd/);
    expect(openclawd).toContain('`automaton/`');
    expect(openclawd).not.toContain('`automaton-main/`');
    expect(openclawd).toContain('`tui/`');
    expect(openclawd).toContain('`src/`');
    expect(openclawd).toContain('tui/dist/');
    expect(openclawd).toContain('tui/.env.example');
    expect(openclawd).toContain('fly.toml');
    expect(openclawd).toContain('Dockerfile');
    expect(openclawd).toContain('install.sh');
    // Package bins live in package.json; path table should not invent clawd-tui/ dir
    expect(openclawd).not.toMatch(/^\| `clawd-tui\/`/m);

    expect(birdeye).toMatch(/Dark Clawd/);
    expect(birdeye).toMatch(/BIRDEYE_API_KEY/);
    expect(birdeye).toMatch(/mock data/i);
    expect(birdeye).toContain('tui/src/services/');
    expect(birdeye).toContain('src/services/');

    expect(x).toMatch(/Dark Clawd/);
    expect(x).toMatch(/Observe\./);
    expect(x).toMatch(/## Short X Post/);
    expect(x.toLowerCase()).toContain('ralph');

    // Real package surface names match docs
    expect(tuiPkg.name).toBe('@x402solana/dark-clawd');
    expect(rootPkg.name).toBe('@x402solana/dark-clawd');
    expect(envExample).toContain('BIRDEYE_API_KEY=');
    expect(envExample).toContain('OPENCLAWD_SITE_URL=');
    expect(tuiReadme).toContain('tui/');
    expect(tuiReadme).toContain('dist/');
    expect(existsSync(join(root, 'tui/dist/cli.js'))).toBe(true);
    expect(existsSync(join(root, 'tui/Dockerfile'))).toBe(true);
    expect(existsSync(join(root, 'tui/fly.toml'))).toBe(true);
    expect(existsSync(join(root, 'tui/install.sh'))).toBe(true);
  });
});
