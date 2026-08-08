import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../', import.meta.url).pathname;

const packageChecks = [
  { name: 'root', sourceDirs: ['packages', 'lib'], envFile: '.env.example' },
  { name: '@vibebot/core', sourceDirs: ['packages/core/src'], envFile: 'packages/core/.env.example' },
  { name: '@vibebot/cli', sourceDirs: ['packages/cli/src'], envFile: 'packages/cli/.env.example' },
  { name: '@vibebot/telegram', sourceDirs: ['packages/telegram/src'], envFile: 'packages/telegram/.env.example' },
  { name: '@vibebot/mobile', sourceDirs: ['packages/mobile/src'], envFile: 'packages/mobile/.env.example' },
  { name: '@vibebot/web', sourceDirs: ['packages/web/src', 'packages/web/ui/src', 'packages/web/ui'], envFile: 'packages/web/.env.example' },
];

const ignoredDirs = new Set([
  'dist',
  'node_modules',
  'public',
  'test',
  'coverage',
  '.expo',
]);

const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      if (!ignoredDirs.has(entry)) {
        walk(path, files);
      }
      continue;
    }

    if ([...sourceExtensions].some(extension => path.endsWith(extension))) {
      files.push(path);
    }
  }

  return files;
}

function readEnvTemplate(path) {
  const content = readFileSync(join(root, path), 'utf8');
  const variables = new Set();

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)=/);
    if (match) {
      variables.add(match[1]);
    }
  }

  return variables;
}

function readSourceVariables(sourceDirs) {
  const variables = new Map();
  const patterns = [
    /process\.env\.([A-Z][A-Z0-9_]*)/g,
    /process\.env\[['"]([A-Z][A-Z0-9_]*)['"]\]/g,
    /import\.meta\.env\.([A-Z][A-Z0-9_]*)/g,
  ];

  for (const sourceDir of sourceDirs) {
    const absoluteSourceDir = join(root, sourceDir);
    for (const file of walk(absoluteSourceDir)) {
      const content = readFileSync(file, 'utf8');

      for (const pattern of patterns) {
        for (const match of content.matchAll(pattern)) {
          const variable = match[1];
          if (!variables.has(variable)) {
            variables.set(variable, new Set());
          }
          variables.get(variable).add(relative(root, file));
        }
      }
    }
  }

  return variables;
}

let failed = false;

for (const check of packageChecks) {
  const documented = readEnvTemplate(check.envFile);
  const used = readSourceVariables(check.sourceDirs);
  const missing = [...used.keys()].filter(variable => !documented.has(variable)).sort();

  if (missing.length > 0) {
    failed = true;
    console.error(`\n${check.name} is missing variables in ${check.envFile}:`);
    for (const variable of missing) {
      console.error(`  ${variable} (${[...used.get(variable)].sort().join(', ')})`);
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log('Environment templates cover source environment variables');
