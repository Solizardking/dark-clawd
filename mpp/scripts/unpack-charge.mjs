#!/usr/bin/env node
/**
 * Restore charge package surfaces (root / server / client / utils) from the
 * vendored solana-mpp-0.5.0.tgz so advertised exports resolve without needing
 * a full tsc rebuild against optional mppx peers.
 *
 * Dark Clawd dist is built separately and preserved here.
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  cpSync,
  statSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tarball = join(root, 'solana-mpp-0.5.0.tgz');
const dist = join(root, 'dist');

if (!existsSync(tarball)) {
  console.error('unpack-charge: missing', tarball);
  process.exit(1);
}

const tmp = mkdtempSync(join(tmpdir(), 'solana-mpp-unpack-'));
try {
  const tar = spawnSync('tar', ['-xzf', tarball, '-C', tmp], { encoding: 'utf8' });
  if (tar.status !== 0) {
    console.error(tar.stderr || tar.stdout);
    process.exit(tar.status ?? 1);
  }
  const srcDist = join(tmp, 'package', 'dist');
  if (!existsSync(srcDist)) {
    console.error('unpack-charge: tarball has no package/dist');
    process.exit(1);
  }

  // Preserve existing dark-clawd build if present
  const darkClawd = join(dist, 'dark-clawd');
  const darkBackup = join(tmp, 'dark-clawd-backup');
  if (existsSync(darkClawd)) {
    cpSync(darkClawd, darkBackup, { recursive: true });
  }

  mkdirSync(dist, { recursive: true });
  // Copy all charge dist files (overwrite charge artifacts only)
  for (const name of readdirSync(srcDist)) {
    if (name === 'dark-clawd') continue;
    const from = join(srcDist, name);
    const to = join(dist, name);
    cpSync(from, to, { recursive: true });
  }

  if (existsSync(darkBackup)) {
    cpSync(darkBackup, darkClawd, { recursive: true });
  }

  const required = [
    'index.js',
    'Methods.js',
    'constants.js',
    'server/index.js',
    'client/index.js',
  ];
  for (const rel of required) {
    const p = join(dist, rel);
    if (!existsSync(p) || !statSync(p).isFile()) {
      console.error('unpack-charge: missing after extract:', rel);
      process.exit(1);
    }
  }
  console.log('unpack-charge: restored charge dist from solana-mpp-0.5.0.tgz');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
