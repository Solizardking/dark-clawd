/**
 * Proves Automaton is integrated into the main Dark Clawd src/ surface:
 * config, openclawd, engine skill path, CLI status, Bloomberg view key.
 */
import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  AutomatonConfigSchema,
  ConfigSchema,
  defaultConfig,
  loadConfigFromEnv,
} from './config/schema.js';
import {
  OPENCLAWD_AUTOMATON_PACKAGE,
  OPENCLAWD_CAPABILITIES,
  OPENCLAWD_ROUTES,
  getOpenClawdCapabilityMap,
} from './openclawd.js';
import { captureAutomatonSnapshot, describeAutomatonSkill } from './skills/automaton-skill.js';
import { resolveDarkClawdRoot } from './services/automaton-bridge.js';
import { ClawdAgent } from './engine/clawd-agent.js';

const root = resolveDarkClawdRoot();

describe('src-level Automaton integration', () => {
  test('config schema includes automaton with defaults', () => {
    const parsed = AutomatonConfigSchema.parse({});
    expect(parsed.enabled).toBe(true);
    expect(parsed.packageDir).toBe('automaton');
    expect(parsed.tuiViewEnabled).toBe(true);
    expect(defaultConfig.automaton.enabled).toBe(true);

    const full = ConfigSchema.partial().parse({
      automaton: { enabled: true, packageDir: 'automaton' },
    });
    expect(full.automaton?.packageDir).toBe('automaton');

    const fromEnv = loadConfigFromEnv();
    expect(fromEnv.automaton?.enabled).toBe(true);
    expect(fromEnv.automaton?.packageDir).toBe('automaton');
  });

  test('openclawd maps automaton route + capability + package constant', () => {
    expect(OPENCLAWD_ROUTES.automaton).toBe('/automaton');
    expect(OPENCLAWD_AUTOMATON_PACKAGE).toBe('automaton');
    const map = getOpenClawdCapabilityMap();
    expect(map.automaton).toBeDefined();
    expect(map.automaton.key).toBe('automaton');
    expect(OPENCLAWD_CAPABILITIES.some((c) => c.key === 'automaton')).toBe(true);
  });

  test('automaton skill snapshot hits real vendored tree', () => {
    const snap = captureAutomatonSnapshot();
    expect(snap.status.present).toBe(true);
    expect(snap.report).toMatch(/AUTOMATON|DARK CLAWD/);
    expect(snap.scripts).toContain('automaton.sh');
    expect(describeAutomatonSkill()).toMatch(/AUTOMATON SKILL/i);
  });

  test('shipped source files wire Automaton into UI/engine/cli', () => {
    const files = {
      app: join(root, 'src/App.tsx'),
      bloomberg: join(root, 'src/components/BloombergDashboard.tsx'),
      panel: join(root, 'src/components/AutomatonPanel.tsx'),
      skill: join(root, 'src/skills/automaton-skill.ts'),
      bridge: join(root, 'src/services/automaton-bridge.ts'),
      cli: join(root, 'src/cli.tsx'),
      index: join(root, 'src/index.ts'),
      schema: join(root, 'src/config/schema.ts'),
      openclawd: join(root, 'src/openclawd.ts'),
      engine: join(root, 'src/engine/clawd-agent.ts'),
    };
    for (const [name, path] of Object.entries(files)) {
      expect(existsSync(path), `${name} missing`).toBe(true);
    }

    const bloomberg = readFileSync(files.bloomberg, 'utf8');
    expect(bloomberg).toMatch(/'automaton'/);
    expect(bloomberg).toMatch(/input === '7'/);
    expect(bloomberg).toContain('AutomatonPanel');
    expect(bloomberg).toContain('[7]');

    const app = readFileSync(files.app, 'utf8');
    expect(app).toContain('automatonViewEnabled');
    expect(app).toContain('[AUTO]');
    expect(app).toContain('isAutomatonPresent');

    const index = readFileSync(files.index, 'utf8');
    expect(index).toContain('AutomatonPanel');
    expect(index).toContain('captureAutomatonSnapshot');

    const engine = readFileSync(files.engine, 'utf8');
    expect(engine).toContain("case '/automaton'");
    expect(engine).toContain('captureAutomatonSnapshot');
  });

  test('ClawdAgent /automaton skill subcommand works on real path', async () => {
    const agent = new ClawdAgent({
      autoMode: false,
      recursionDepth: 1,
      thoughtInterval: 15000,
      personality: 'cryptic',
    });
    const seen: string[] = [];
    agent.on('message', (m: { content: string }) => seen.push(m.content));
    await agent.processCommand('/automaton skill');
    expect(seen.join('\n')).toMatch(/AUTOMATON SKILL|linked/i);
  });

  test('CLI status mentions Automaton vendored bridge', async () => {
    const proc = Bun.spawn(['bun', 'run', join(root, 'src/cli.tsx'), 'status'], {
      cwd: root,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    expect(code).toBe(0);
    const out = stdout + stderr;
    expect(out).toMatch(/Automaton/i);
    expect(out).toMatch(/VENDORED|MISSING|DISABLED/);
  });
});
