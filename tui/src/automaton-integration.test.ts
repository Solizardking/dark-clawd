/**
 * Proves Automaton is integrated into the published tui/ package surface.
 * Resolves the real sibling ../automaton tree (not a mock).
 */
import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  AutomatonConfigSchema,
  defaultConfig,
  loadConfigFromEnv,
} from './config/schema.js';
import {
  OPENCLAWD_AUTOMATON_PACKAGE,
  OPENCLAWD_ROUTES,
  getOpenClawdCapabilityMap,
} from './openclawd.js';
import {
  getAutomatonIntegrationStatus,
  isAutomatonPresent,
  resolveAutomatonRoot,
  resolveDarkClawdRoot,
} from './services/automaton-bridge.js';
import { captureAutomatonSnapshot } from './skills/automaton-skill.js';
import { ClawdAgent } from './engine/clawd-agent.js';

const tuiRoot = resolveDarkClawdRoot();

describe('tui Automaton integration', () => {
  test('resolves sibling ../automaton from tui package root', () => {
    expect(tuiRoot.endsWith('tui') || tuiRoot.includes(`${join('', 'tui')}`)).toBe(true);
    const autoRoot = resolveAutomatonRoot(tuiRoot);
    expect(isAutomatonPresent(autoRoot)).toBe(true);
    expect(existsSync(join(autoRoot, 'constitution.md'))).toBe(true);
    expect(autoRoot).toContain('automaton');
    // Prefer monorepo sibling, not nested under tui/automaton unless present
    expect(autoRoot.includes(`${join('tui', 'automaton')}`)).toBe(false);
  });

  test('config + openclawd expose automaton', () => {
    expect(AutomatonConfigSchema.parse({}).enabled).toBe(true);
    expect(defaultConfig.automaton.packageDir).toBe('../automaton');
    expect(loadConfigFromEnv().automaton?.enabled).toBe(true);
    expect(OPENCLAWD_ROUTES.automaton).toBe('/automaton');
    expect(OPENCLAWD_AUTOMATON_PACKAGE).toBe('automaton');
    expect(getOpenClawdCapabilityMap().automaton).toBeDefined();
  });

  test('bridge status and skill snapshot work', () => {
    const status = getAutomatonIntegrationStatus();
    expect(status.present).toBe(true);
    expect(status.constitutionLaws.length).toBeGreaterThanOrEqual(3);
    const snap = captureAutomatonSnapshot();
    expect(snap.report).toMatch(/AUTOMATON|DARK CLAWD/);
    expect(snap.scripts).toContain('automaton.sh');
  });

  test('source wiring: Bloomberg [6], App boot, CLI, engine', () => {
    const bloomberg = readFileSync(join(tuiRoot, 'src/components/BloombergDashboard.tsx'), 'utf8');
    expect(bloomberg).toMatch(/'automaton'/);
    expect(bloomberg).toMatch(/input === '6'/);
    expect(bloomberg).toContain('AutomatonPanel');

    const app = readFileSync(join(tuiRoot, 'src/App.tsx'), 'utf8');
    expect(app).toContain('automatonViewEnabled');
    expect(app).toContain('[AUTO]');

    const cli = readFileSync(join(tuiRoot, 'src/cli.tsx'), 'utf8');
    expect(cli).toContain(".command('automaton')");
    expect(cli).toContain('formatAutomatonStatusReport');

    const engine = readFileSync(join(tuiRoot, 'src/engine/clawd-agent.ts'), 'utf8');
    expect(engine).toContain("case '/automaton'");

    const index = readFileSync(join(tuiRoot, 'src/index.ts'), 'utf8');
    expect(index).toContain('AutomatonPanel');
    expect(index).toContain('captureAutomatonSnapshot');

    const pkg = JSON.parse(readFileSync(join(tuiRoot, 'package.json'), 'utf8'));
    expect(pkg.scripts['automaton:status']).toBeTruthy();
  });

  test('ClawdAgent /automaton hits real bridge', async () => {
    const agent = new ClawdAgent({
      autoMode: false,
      recursionDepth: 1,
      thoughtInterval: 15000,
      personality: 'cryptic',
    });
    const seen: string[] = [];
    agent.on('message', (m: { content: string }) => seen.push(m.content));
    await agent.processCommand('/automaton');
    expect(seen.join('\n')).toMatch(/AUTOMATON|Present/i);
  });

  test('CLI automaton status exits 0', async () => {
    const proc = Bun.spawn(['bun', 'run', join(tuiRoot, 'src/cli.tsx'), 'automaton', 'status'], {
      cwd: tuiRoot,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    expect(code).toBe(0);
    expect(stdout + stderr).toMatch(/Present:\s+YES|AUTOMATON BRIDGE/i);
  });
});
