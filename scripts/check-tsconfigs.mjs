import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;

const runtimeConfigs = [
  {
    path: 'lib/tsconfig.json',
    label: 'lib',
    rootDir: '.',
    include: ['*.ts'],
    requireResolveJsonModule: false,
  },
  {
    path: 'packages/core/tsconfig.json',
    label: '@vibebot/core',
    rootDir: './src',
    include: ['src/**/*'],
    requireResolveJsonModule: true,
  },
  {
    path: 'packages/cli/tsconfig.json',
    label: '@vibebot/cli',
    rootDir: './src',
    include: ['src/**/*'],
    requireResolveJsonModule: true,
  },
  {
    path: 'packages/telegram/tsconfig.json',
    label: '@vibebot/telegram',
    rootDir: './src',
    include: ['src/**/*'],
    requireResolveJsonModule: true,
  },
  {
    path: 'packages/web/tsconfig.json',
    label: '@vibebot/web',
    rootDir: './src',
    include: ['src/**/*'],
    requireResolveJsonModule: true,
  },
];

const errors = [];

function readJson(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) {
    errors.push(`${path} is missing`);
    return undefined;
  }

  return JSON.parse(readFileSync(fullPath, 'utf8'));
}

function assertValue(label, actual, expected, path) {
  if (actual !== expected) {
    errors.push(`${label} ${path} must be ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertArrayIncludes(label, actual, expected, path) {
  if (!Array.isArray(actual) || !actual.includes(expected)) {
    errors.push(`${label} ${path} must include ${JSON.stringify(expected)}`);
  }
}

for (const spec of runtimeConfigs) {
  const config = readJson(spec.path);
  if (!config) continue;

  const compilerOptions = config.compilerOptions || {};
  const requiredCompilerOptions = {
    target: 'ES2022',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    outDir: './dist',
    rootDir: spec.rootDir,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    declaration: true,
    declarationMap: true,
    sourceMap: true,
  };

  for (const [option, expected] of Object.entries(requiredCompilerOptions)) {
    assertValue(spec.label, compilerOptions[option], expected, `compilerOptions.${option}`);
  }

  assertArrayIncludes(spec.label, compilerOptions.lib, 'ES2022', 'compilerOptions.lib');

  if (spec.requireResolveJsonModule) {
    assertValue(spec.label, compilerOptions.resolveJsonModule, true, 'compilerOptions.resolveJsonModule');
  }

  for (const include of spec.include) {
    assertArrayIncludes(spec.label, config.include, include, 'include');
  }

  assertArrayIncludes(spec.label, config.exclude, 'node_modules', 'exclude');
  assertArrayIncludes(spec.label, config.exclude, 'dist', 'exclude');
}

const mobileConfig = readJson('packages/mobile/tsconfig.json');
if (mobileConfig) {
  assertValue('@vibebot/mobile', mobileConfig.extends, 'expo/tsconfig.base', 'extends');
  assertValue('@vibebot/mobile', mobileConfig.compilerOptions?.strict, true, 'compilerOptions.strict');
  assertValue('@vibebot/mobile', mobileConfig.compilerOptions?.baseUrl, '.', 'compilerOptions.baseUrl');
  assertArrayIncludes('@vibebot/mobile', mobileConfig.compilerOptions?.paths?.['@/*'], 'src/*', 'compilerOptions.paths["@/*"]');
  assertArrayIncludes('@vibebot/mobile', mobileConfig.compilerOptions?.paths?.['@vibebot/core'], '../core/src', 'compilerOptions.paths["@vibebot/core"]');
  assertArrayIncludes('@vibebot/mobile', mobileConfig.include, '**/*.ts', 'include');
  assertArrayIncludes('@vibebot/mobile', mobileConfig.include, '**/*.tsx', 'include');
}

const uiConfig = readJson('packages/web/ui/tsconfig.json');
if (uiConfig) {
  const compilerOptions = uiConfig.compilerOptions || {};

  assertValue('@vibebot/ui', compilerOptions.target, 'ES2022', 'compilerOptions.target');
  assertValue('@vibebot/ui', compilerOptions.module, 'ESNext', 'compilerOptions.module');
  assertValue('@vibebot/ui', compilerOptions.moduleResolution, 'bundler', 'compilerOptions.moduleResolution');
  assertValue('@vibebot/ui', compilerOptions.strict, true, 'compilerOptions.strict');
  assertValue('@vibebot/ui', compilerOptions.noEmit, true, 'compilerOptions.noEmit');
  assertValue('@vibebot/ui', compilerOptions.jsx, 'react-jsx', 'compilerOptions.jsx');
  assertValue('@vibebot/ui', compilerOptions.resolveJsonModule, true, 'compilerOptions.resolveJsonModule');
  assertValue('@vibebot/ui', compilerOptions.isolatedModules, true, 'compilerOptions.isolatedModules');
  assertArrayIncludes('@vibebot/ui', compilerOptions.lib, 'ES2022', 'compilerOptions.lib');
  assertArrayIncludes('@vibebot/ui', compilerOptions.lib, 'DOM', 'compilerOptions.lib');
  assertArrayIncludes('@vibebot/ui', compilerOptions.paths?.['@/*'], './src/*', 'compilerOptions.paths["@/*"]');
  assertArrayIncludes('@vibebot/ui', uiConfig.include, 'src', 'include');
}

if (errors.length > 0) {
  console.error('TypeScript config check failed:');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log('TypeScript config consistency passed for lib, packages/core, packages/cli, packages/mobile, packages/telegram, packages/web, packages/web/ui');
