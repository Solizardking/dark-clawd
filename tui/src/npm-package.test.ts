/**
 * Package-surface invariants for one-shot npm install of Dark Clawd.
 * Reads real tui/package.json + shipped dist bin (when built).
 */
import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = join(root, 'package.json');
const cliDist = join(root, 'dist/cli.js');
const fixShebang = join(root, 'scripts/fix-shebang.mjs');
const installSh = join(root, 'install.sh');

function loadPkg(): {
  name: string;
  bin: Record<string, string>;
  files: string[];
  scripts: Record<string, string>;
  engines?: Record<string, string>;
  main?: string;
} {
  return JSON.parse(readFileSync(pkgPath, 'utf8'));
}

describe('npm package surface (@openclawdsolana/dark-clawd)', () => {
  test('package.json name, bins, files, and pack hooks support npm install', () => {
    const pkg = loadPkg();
    expect(pkg.name).toBe('@openclawdsolana/dark-clawd');
    expect(pkg.main).toBe('dist/index.js');
    expect(pkg.bin['dark-clawd']).toBe('dist/cli.js');
    expect(pkg.bin.clawd).toBe('dist/cli.js');
    expect(pkg.bin['clawd-tui']).toBe('dist/cli.js');
    expect(pkg.files).toContain('dist');
    expect(pkg.files).toContain('install.sh');
    expect(pkg.engines?.node).toMatch(/>=18/);
    // prepack ensures `npm pack` builds dist before tarball creation
    expect(pkg.scripts.prepack).toContain('build');
    expect(pkg.scripts.prepublishOnly).toContain('build');
    expect(pkg.scripts.build).toContain('fix:shebang');
    expect(pkg.scripts['fix:shebang']).toContain('fix-shebang.mjs');
    expect(existsSync(fixShebang)).toBe(true);
  });

  test('install.sh documents npm global install of the real package name', () => {
    const sh = readFileSync(installSh, 'utf8');
    expect(sh).toContain('@openclawdsolana/dark-clawd');
    expect(sh).toMatch(/npm install -g/);
    expect(sh).toContain('dark-clawd --help');
  });

  test('fix-shebang.mjs rewrites bun shebang to node on a temp fixture', () => {
    const tmp = join(root, 'dist', '.shebang-fixture-cli.js');
    // Use dist dir so we do not pollute src; create minimal fixture
    mkdirSync(join(root, 'dist'), { recursive: true });
    const bunish = '#!/usr/bin/env bun\nconsole.log("fixture-ok");\n';
    writeFileSync(tmp, bunish);
    const result = spawnSync(process.execPath, [fixShebang, tmp], {
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    const fixed = readFileSync(tmp, 'utf8');
    expect(fixed.startsWith('#!/usr/bin/env node')).toBe(true);
    expect(fixed).not.toMatch(/^#!\/usr\/bin\/env bun/m);
    unlinkSync(tmp);
  });

  test('shipped dist/cli.js (when present) is Node-shebang and --help works under node', () => {
    if (!existsSync(cliDist)) {
      // Build once so the invariant is exercised on the real shipped entry
      const build = spawnSync('bun', ['run', 'build'], {
        cwd: root,
        encoding: 'utf8',
        env: process.env,
      });
      expect(build.status).toBe(0);
    }
    expect(existsSync(cliDist)).toBe(true);
    const head = readFileSync(cliDist, 'utf8').slice(0, 80);
    expect(head.startsWith('#!/usr/bin/env node')).toBe(true);
    expect(head).not.toMatch(/^#!\/usr\/bin\/env bun/);

    // Drive the real packed entry with Node only (no bun on argv)
    const help = spawnSync(process.execPath, [cliDist, '--help'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, PATH: process.env.PATH },
    });
    expect(help.status).toBe(0);
    const out = `${help.stdout}\n${help.stderr}`;
    expect(out).toMatch(/dark-clawd/i);
    expect(out).toMatch(/Dark Clawd/i);
    expect(out).not.toMatch(/bun: command not found/i);
  });
});
