import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = new URL('../', import.meta.url).pathname;
const cacheDir = join(root, '.npm-cache');

const packages = [
  { dir: 'lib', envExample: false },
  { dir: 'packages/core', envExample: true },
  { dir: 'packages/cli', envExample: true },
  { dir: 'packages/telegram', envExample: true },
  { dir: 'packages/web', envExample: true, requiredPrefixes: ['public/'] },
];

function readPackageJson(packageDir) {
  return JSON.parse(readFileSync(join(root, packageDir, 'package.json'), 'utf8'));
}

function normalizePackagePath(path) {
  return path.replace(/^\.\//, '');
}

function collectExportTargets(exportsField, targets = []) {
  if (!exportsField) return targets;

  if (typeof exportsField === 'string') {
    targets.push(exportsField);
    return targets;
  }

  if (typeof exportsField !== 'object') {
    return targets;
  }

  for (const value of Object.values(exportsField)) {
    collectExportTargets(value, targets);
  }

  return targets;
}

function runPackJson(packageDir) {
  const result = spawnSync('npm', ['pack', '--dry-run', '--json', '--cache', cacheDir], {
    cwd: join(root, packageDir),
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error([
      `npm pack failed for ${packageDir}`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n'));
  }

  const parsed = JSON.parse(result.stdout);
  if (!Array.isArray(parsed) || parsed.length !== 1) {
    throw new Error(`Unexpected npm pack JSON for ${packageDir}`);
  }

  return parsed[0];
}

mkdirSync(cacheDir, { recursive: true });

const errors = [];

for (const packageSpec of packages) {
  const packageJson = readPackageJson(packageSpec.dir);
  const packed = runPackJson(packageSpec.dir);
  const paths = new Set(packed.files.map(file => file.path));

  const requiredPaths = [
    'package.json',
    normalizePackagePath(packageJson.main),
    normalizePackagePath(packageJson.types),
    ...collectExportTargets(packageJson.exports).map(normalizePackagePath),
  ];

  if (packageJson.bin) {
    const bins = typeof packageJson.bin === 'string'
      ? { [packageJson.name]: packageJson.bin }
      : packageJson.bin;
    requiredPaths.push(...Object.values(bins).map(normalizePackagePath));
  }

  if (packageSpec.envExample) {
    requiredPaths.push('.env.example');
  }

  for (const requiredPath of new Set(requiredPaths)) {
    if (!paths.has(requiredPath)) {
      errors.push(`${packageJson.name} pack is missing ${requiredPath}`);
    }
  }

  for (const requiredPrefix of packageSpec.requiredPrefixes || []) {
    if (![...paths].some(path => path.startsWith(requiredPrefix))) {
      errors.push(`${packageJson.name} pack is missing files under ${requiredPrefix}`);
    }
  }

  for (const path of paths) {
    if (path === '.env' || path.endsWith('/.env')) {
      errors.push(`${packageJson.name} pack must not include ${path}`);
    }

    if (path === '.DS_Store' || path.endsWith('/.DS_Store')) {
      errors.push(`${packageJson.name} pack must not include ${path}`);
    }

    if (path.startsWith('src/') || path.startsWith('test/') || path.startsWith('node_modules/')) {
      errors.push(`${packageJson.name} pack includes non-runtime path ${path}`);
    }
  }

  console.log(`${packageJson.name}: ${packed.entryCount} files, ${packed.filename}`);
}

if (errors.length > 0) {
  console.error('Pack dry-run content check failed:');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log('Pack dry-run contents passed');
