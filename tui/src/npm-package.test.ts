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

describe('npm package surface (@x402solana/dark-clawd)', () => {
  test('package.json name, bins, files, and pack hooks support npm install', () => {
    const pkg = loadPkg() as ReturnType<typeof loadPkg> & {
      homepage?: string;
      repository?: { url?: string };
      bugs?: { url?: string };
      publishConfig?: { access?: string };
    };
    expect(pkg.name).toBe('@x402solana/dark-clawd');
    expect(pkg.main).toBe('dist/index.js');
    expect(pkg.bin['dark-clawd']).toBe('dist/cli.js');
    expect(pkg.bin.clawd).toBe('dist/cli.js');
    expect(pkg.bin['clawd-tui']).toBe('dist/cli.js');
    expect(pkg.files).toContain('dist');
    expect(pkg.files).toContain('install.sh');
    expect(pkg.engines?.node).toMatch(/>=18/);
    expect(pkg.homepage).toBe('https://cheshireterminal.ai/dark-clawd');
    expect(pkg.repository?.url).toContain('Solizardking/dark-clawd');
    expect(pkg.bugs?.url).toContain('Solizardking/dark-clawd/issues');
    expect(pkg.publishConfig?.access).toBe('public');
    // prepack ensures `npm pack` builds dist before tarball creation
    expect(pkg.scripts.prepack).toContain('build');
    expect(pkg.scripts.prepublishOnly).toContain('build');
    expect(pkg.scripts.build).toContain('fix:shebang');
    expect(pkg.scripts['fix:shebang']).toContain('fix-shebang.mjs');
    expect(existsSync(fixShebang)).toBe(true);
  });

  test('install.sh documents npm global install + hub + github + tools', () => {
    const sh = readFileSync(installSh, 'utf8');
    expect(sh).toContain('@x402solana/dark-clawd');
    expect(sh).toMatch(/npm install -g/);
    expect(sh).toContain('dark-clawd --help');
    expect(sh).toContain('dark-clawd tools');
    expect(sh).toContain('dark-clawd agent');
    expect(sh).toContain('171');
    expect(sh).toContain('https://cheshireterminal.ai/dark-clawd');
    expect(sh).toContain('https://github.com/Solizardking/dark-clawd');
    expect(sh).toContain('releases/download/v');
    expect(sh).toContain('x402solana-dark-clawd-');
    expect(sh).toContain('OPENROUTER_API_KEY');
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

  test('npm pack tarball includes Node-shebang dist/cli.js and install-g --help works', () => {
    // Real pack path (prepack builds). Prefer existing tarball to keep CI fast when present.
    const tarballName = 'x402solana-dark-clawd-1.0.0.tgz';
    let tarball = join(root, tarballName);
    if (!existsSync(tarball)) {
      const pack = spawnSync('npm', ['pack'], {
        cwd: root,
        encoding: 'utf8',
        env: process.env,
      });
      expect(pack.status).toBe(0);
      expect(pack.stdout + pack.stderr).toMatch(/x402solana-dark-clawd-1\.0\.0\.tgz/);
      tarball = join(root, tarballName);
    }
    expect(existsSync(tarball)).toBe(true);

    // Inspect packed cli shebang without full extract tree
    const list = spawnSync('tar', ['-tzf', tarball], { encoding: 'utf8' });
    expect(list.status).toBe(0);
    expect(list.stdout).toMatch(/package\/dist\/cli\.js/);
    expect(list.stdout).toMatch(/package\/package\.json/);

    // Only read the first line of the packed CLI (5MB+ file; avoid loading whole tarball member)
    const shebang = spawnSync(
      'sh',
      ['-c', `tar -xOf ${JSON.stringify(tarball)} package/dist/cli.js | head -n 1`],
      { encoding: 'utf8' },
    );
    expect(shebang.status).toBe(0);
    expect((shebang.stdout || '').trim()).toBe('#!/usr/bin/env node');

    // Global-style install into isolated prefix (same consumer path as npm install -g)
    const prefix = join(root, 'dist', '.pack-install-prefix');
    spawnSync('rm', ['-rf', prefix], { encoding: 'utf8' });
    mkdirSync(prefix, { recursive: true });
    const install = spawnSync('npm', ['install', '-g', '--prefix', prefix, tarball], {
      cwd: root,
      encoding: 'utf8',
      env: process.env,
    });
    expect(install.status).toBe(0);

    const bin = join(prefix, 'bin', 'dark-clawd');
    expect(existsSync(bin)).toBe(true);
    const help = spawnSync(bin, ['--help'], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${join(prefix, 'bin')}:${process.env.PATH || ''}` },
    });
    expect(help.status).toBe(0);
    const out = `${help.stdout}\n${help.stderr}`;
    expect(out).toMatch(/Dark Clawd/i);
    expect(out).toMatch(/dark-clawd/i);

    // Cleanup install prefix only (keep tarball for local re-use / gitignored)
    spawnSync('rm', ['-rf', prefix], { encoding: 'utf8' });
  }, 180_000);
});
