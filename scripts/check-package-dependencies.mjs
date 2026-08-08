import { builtinModules } from 'node:module';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../', import.meta.url).pathname;

const packageDirs = [
  { dir: 'lib' },
  { dir: 'packages/core' },
  { dir: 'packages/cli' },
  { dir: 'packages/mobile' },
  { dir: 'packages/telegram' },
  { dir: 'packages/web', ignoredSubdirs: ['ui'] },
  { dir: 'packages/web/ui' },
];

const ignoredDirs = new Set(['dist', 'node_modules', 'public', 'coverage', '.expo']);
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const builtins = new Set([
  ...builtinModules,
  ...builtinModules.map(moduleName => `node:${moduleName}`),
]);

function walk(dir, files = [], ignoredSubdirs = new Set()) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      if (!ignoredDirs.has(entry) && !ignoredSubdirs.has(entry)) {
        walk(path, files, new Set());
      }
      continue;
    }

    if ([...sourceExtensions].some(extension => path.endsWith(extension))) {
      files.push(path);
    }
  }

  return files;
}

function readPackageJson(packageDir) {
  return JSON.parse(readFileSync(join(root, packageDir, 'package.json'), 'utf8'));
}

function packageNameFromSpecifier(specifier) {
  if (
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('#') ||
    builtins.has(specifier)
  ) {
    return undefined;
  }

  if (specifier.startsWith('@')) {
    const [scope, name] = specifier.split('/');
    return name ? `${scope}/${name}` : specifier;
  }

  return specifier.split('/')[0];
}

function isDevOnlyFile(path) {
  return (
    path.includes('/test/') ||
    path.endsWith('.test.ts') ||
    path.endsWith('.test.tsx') ||
    path.endsWith('.spec.ts') ||
    path.endsWith('.spec.tsx') ||
    path.endsWith('vite.config.ts') ||
    path.endsWith('vite.config.js') ||
    path.endsWith('tailwind.config.js') ||
    path.endsWith('postcss.config.js')
  );
}

function collectImports(file) {
  const content = readFileSync(file, 'utf8');
  const imports = [];
  const patterns = [
    /\bimport\s+(?:type\s+)?(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bexport\s+(?:type\s+)?[^'"]+?\s+from\s+['"]([^'"]+)['"]/g,
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      imports.push(match[1]);
    }
  }

  return imports;
}

const errors = [];

for (const packageSpec of packageDirs) {
  const packageDir = packageSpec.dir;
  const packageJson = readPackageJson(packageDir);
  const dependencies = new Set(Object.keys(packageJson.dependencies || {}));
  const devDependencies = new Set(Object.keys(packageJson.devDependencies || {}));
  const optionalDependencies = new Set(Object.keys(packageJson.optionalDependencies || {}));
  const peerDependencies = new Set(Object.keys(packageJson.peerDependencies || {}));
  const packageName = packageJson.name || packageDir;

  for (const file of walk(join(root, packageDir), [], new Set(packageSpec.ignoredSubdirs || []))) {
    const rel = relative(root, file);
    const devOnly = isDevOnlyFile(file);

    for (const specifier of collectImports(file)) {
      const importedPackage = packageNameFromSpecifier(specifier);
      if (!importedPackage) continue;

      const declaredRuntime =
        dependencies.has(importedPackage) ||
        optionalDependencies.has(importedPackage) ||
        peerDependencies.has(importedPackage);
      const declaredDev = devDependencies.has(importedPackage);

      if (devOnly) {
        if (!declaredRuntime && !declaredDev) {
          errors.push(`${packageName} imports undeclared ${importedPackage} in ${rel}`);
        }
        continue;
      }

      if (!declaredRuntime) {
        errors.push(`${packageName} runtime import ${importedPackage} is not declared in dependencies/peerDependencies/optionalDependencies (${rel})`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error('Package dependency check failed:');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`Package dependency declarations passed for ${packageDirs.map(packageSpec => packageSpec.dir).join(', ')}`);
