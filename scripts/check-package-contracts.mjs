import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, normalize, relative } from 'node:path';

const root = new URL('../', import.meta.url).pathname;

const publishablePackages = [
  'lib',
  'packages/core',
  'packages/cli',
  'packages/telegram',
  'packages/web',
];

function readPackageJson(packageDir) {
  return JSON.parse(readFileSync(join(root, packageDir, 'package.json'), 'utf8'));
}

function normalizePackagePath(path) {
  return normalize(path.replace(/^\.\//, ''));
}

function isCoveredByFiles(path, files = []) {
  const normalizedPath = normalizePackagePath(path);
  return files.some(entry => {
    const normalizedEntry = normalizePackagePath(entry);
    return normalizedPath === normalizedEntry || normalizedPath.startsWith(`${normalizedEntry}/`);
  });
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

function checkTarget({ packageDir, packageName, files }, label, target, errors) {
  if (!target || typeof target !== 'string') return;

  const normalizedTarget = normalizePackagePath(target);
  const absoluteTarget = join(root, packageDir, normalizedTarget);

  if (!existsSync(absoluteTarget)) {
    errors.push(`${packageName} ${label} target does not exist: ${target}`);
    return;
  }

  if (statSync(absoluteTarget).isDirectory()) {
    errors.push(`${packageName} ${label} target must be a file: ${target}`);
  }

  if (!isCoveredByFiles(normalizedTarget, files)) {
    errors.push(`${packageName} ${label} target is not covered by files allowlist: ${target}`);
  }
}

const errors = [];

for (const packageDir of publishablePackages) {
  const packageJson = readPackageJson(packageDir);
  const packageName = packageJson.name || packageDir;
  const files = packageJson.files || [];
  const context = { packageDir, packageName, files };

  if (packageJson.private) {
    errors.push(`${packageName} is listed as publishable but has private=true`);
  }

  if (!Array.isArray(files) || files.length === 0) {
    errors.push(`${packageName} must define a non-empty files allowlist`);
  }

  if (files.includes('.env')) {
    errors.push(`${packageName} must not include a real .env file in files`);
  }

  if (!packageJson.main) {
    errors.push(`${packageName} must define main`);
  }

  if (!packageJson.types) {
    errors.push(`${packageName} must define types`);
  }

  if (!packageJson.exports) {
    errors.push(`${packageName} must define exports`);
  }

  checkTarget(context, 'main', packageJson.main, errors);
  checkTarget(context, 'types', packageJson.types, errors);

  if (packageJson.bin) {
    const bins = typeof packageJson.bin === 'string'
      ? { [packageName]: packageJson.bin }
      : packageJson.bin;

    for (const [binName, binTarget] of Object.entries(bins)) {
      checkTarget(context, `bin "${binName}"`, binTarget, errors);
    }
  }

  for (const target of collectExportTargets(packageJson.exports)) {
    checkTarget(context, 'exports', target, errors);
  }

  const envExamplePath = join(root, packageDir, '.env.example');
  if (existsSync(envExamplePath) && !isCoveredByFiles('.env.example', files)) {
    errors.push(`${packageName} has .env.example but does not include it in files`);
  }
}

if (errors.length > 0) {
  console.error('Package contract check failed:');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`Package contracts passed for ${publishablePackages.map(packageDir => relative(root, join(root, packageDir))).join(', ')}`);
