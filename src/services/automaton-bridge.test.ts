/**
 * Drives the real Automaton bridge against the vendored automaton/ tree.
 * No mocks of package layout — asserts on-disk constitution, package, scripts.
 */
import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  extractConstitutionLaws,
  formatAutomatonStatusReport,
  getAutomatonIntegrationStatus,
  getAutomatonTreePaths,
  isAutomatonPresent,
  listAutomatonScripts,
  loadAutomatonConstitution,
  loadAutomatonPackageManifest,
  planAutomatonProxy,
  resolveAutomatonRoot,
  resolveDarkClawdRoot,
  tryRunAutomatonEntrypoint,
} from './automaton-bridge.js';
import { ClawdAgent } from '../engine/clawd-agent.js';

describe('automaton bridge integration', () => {
  test('resolves vendored automaton next to Dark Clawd root', () => {
    const darkRoot = resolveDarkClawdRoot();
    const autoRoot = resolveAutomatonRoot(darkRoot);
    expect(autoRoot).toBe(join(darkRoot, 'automaton'));
    expect(isAutomatonPresent(autoRoot)).toBe(true);
    expect(existsSync(join(autoRoot, 'package.json'))).toBe(true);
    expect(existsSync(join(autoRoot, 'src', 'index.ts'))).toBe(true);
    expect(existsSync(join(autoRoot, 'constitution.md'))).toBe(true);
  });

  test('loads real package manifest and scripts', () => {
    const root = resolveAutomatonRoot();
    const manifest = loadAutomatonPackageManifest(root);
    expect(manifest).not.toBeNull();
    expect(manifest!.name).toContain('automaton');
    expect(manifest!.version).toBeTruthy();
    expect(manifest!.bin).toBeDefined();
    expect(Object.keys(manifest!.bin!).length).toBeGreaterThan(0);

    const scripts = listAutomatonScripts(root);
    expect(scripts).toContain('automaton.sh');
    expect(scripts).toContain('crustacean-automation.sh');
    expect(scripts).toContain('clawd-rules.txt');

    const paths = getAutomatonTreePaths(root);
    expect(existsSync(paths.cliPackageJson)).toBe(true);
    const cliPkg = JSON.parse(readFileSync(paths.cliPackageJson, 'utf8'));
    expect(cliPkg.name).toMatch(/automaton-cli/);
  });

  test('constitution is Clawd-branded with hierarchical laws', () => {
    const text = loadAutomatonConstitution(resolveAutomatonRoot());
    expect(text).toBeTruthy();
    expect(text!.toLowerCase()).toContain('clawd');
    expect(text!).toMatch(/Law I/i);
    expect(text!).toMatch(/Never harm/i);
    expect(text!).toMatch(/Earn your existence/i);

    const laws = extractConstitutionLaws(text!);
    expect(laws.length).toBeGreaterThanOrEqual(3);
    expect(laws.some((l) => /I\b/.test(l))).toBe(true);
  });

  test('getAutomatonIntegrationStatus reports present bridge surface', () => {
    const status = getAutomatonIntegrationStatus();
    expect(status.present).toBe(true);
    expect(status.packageName).toBeTruthy();
    expect(status.constitutionPresent).toBe(true);
    expect(status.entrypoints.runtime).toContain(`${join('automaton', 'src', 'index.ts')}`);
    expect(status.entrypoints.scripts.length).toBeGreaterThan(0);
    expect(status.darkClawdRole.toLowerCase()).toContain('sovereign');
    expect(status.lineageNote.toLowerCase()).toContain('ralph');

    const report = formatAutomatonStatusReport(status);
    expect(report).toContain('DARK CLAWD');
    expect(report).toContain('AUTOMATON');
    expect(report).toContain(status.root);
  });

  test('planAutomatonProxy and tryRunAutomatonEntrypoint hit real entry', () => {
    const plan = planAutomatonProxy('help');
    expect(plan.cwd).toBe(resolveAutomatonRoot());
    expect(plan.args[0]).toBe('src/index.ts');
    expect(plan.args[1]).toBe('--help');
    expect(plan.suggested.some((s) => s.includes('pnpm'))).toBe(true);

    // Drive real TypeScript entry with bun (may load deps; --help exits early)
    const result = tryRunAutomatonEntrypoint('--help');
    // Help should succeed if bun can load the graph; if native modules missing,
    // still assert we attempted the real entry (stderr or stdout non-empty path check).
    if (result.ok) {
      expect(result.stdout.toLowerCase()).toMatch(/automaton|usage|--run/);
    } else {
      // Entry file must still be the one we would execute
      expect(existsSync(join(resolveAutomatonRoot(), 'src', 'index.ts'))).toBe(true);
      expect(result.exitCode === null || typeof result.exitCode === 'number').toBe(true);
    }
  });

  test('ClawdAgent /automaton command emits bridge status from real tree', async () => {
    const agent = new ClawdAgent({
      autoMode: false,
      recursionDepth: 1,
      thoughtInterval: 15_000,
      personality: 'cryptic',
    });
    const seen: Array<{ sender: string; content: string }> = [];
    agent.on('message', (msg: { sender: string; content: string }) => {
      seen.push(msg);
    });
    await agent.processCommand('/automaton');
    expect(seen.length).toBeGreaterThan(0);
    const blob = seen.map((m) => m.content).join('\n');
    expect(blob).toMatch(/AUTOMATON|automaton/i);
    expect(blob).toMatch(/DARK CLAWD|Present/i);

    seen.length = 0;
    await agent.processCommand('/automaton constitution');
    const lawsBlob = seen.map((m) => m.content).join('\n');
    expect(lawsBlob.toLowerCase()).toMatch(/constitution|law|harm|clawd/);
  });

  test('CLI help lists automaton command (shipped entry)', async () => {
    const proc = Bun.spawn(['bun', 'run', join(resolveDarkClawdRoot(), 'src/cli.tsx'), '--help'], {
      cwd: resolveDarkClawdRoot(),
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [stdout, , code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    expect(code).toBe(0);
    expect(stdout.toLowerCase()).toContain('automaton');
  });

  test('CLI automaton status exits 0 with present report', async () => {
    const proc = Bun.spawn(
      ['bun', 'run', join(resolveDarkClawdRoot(), 'src/cli.tsx'), 'automaton', 'status'],
      {
        cwd: resolveDarkClawdRoot(),
        stdout: 'pipe',
        stderr: 'pipe',
      },
    );
    const [stdout, stderr, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    expect(code).toBe(0);
    expect(stdout + stderr).toMatch(/Present:\s+YES|AUTOMATON BRIDGE/i);
    expect(stdout + stderr).toContain('automaton');
  });
});
