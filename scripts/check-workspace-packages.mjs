import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;

const requestedPackages = [
  {
    dir: 'packages/core',
    name: '@vibebot/core',
    private: false,
    requiredFiles: ['package.json', 'tsconfig.json', '.env.example'],
    requiredDirs: ['src', 'test'],
    requiredScripts: ['build', 'dev', 'test', 'lint'],
  },
  {
    dir: 'packages/cli',
    name: '@vibebot/cli',
    private: false,
    requiredFiles: ['package.json', 'tsconfig.json', '.env.example'],
    requiredDirs: ['src', 'test'],
    requiredScripts: ['build', 'dev', 'start', 'test', 'lint'],
  },
  {
    dir: 'packages/mobile',
    name: '@vibebot/mobile',
    private: true,
    requiredFiles: ['package.json', 'tsconfig.json', '.env.example', 'app.json', 'index.js'],
    requiredDirs: ['src', 'test'],
    requiredScripts: ['build', 'start', 'android', 'ios', 'web', 'test', 'lint'],
  },
  {
    dir: 'packages/telegram',
    name: '@vibebot/telegram',
    private: false,
    requiredFiles: ['package.json', 'tsconfig.json', '.env.example'],
    requiredDirs: ['src', 'test'],
    requiredScripts: ['build', 'dev', 'start', 'test', 'lint'],
  },
  {
    dir: 'packages/web',
    name: '@vibebot/web',
    private: false,
    requiredFiles: ['package.json', 'tsconfig.json', '.env.example'],
    requiredDirs: ['src', 'test', 'public', 'ui'],
    requiredScripts: ['build', 'dev', 'start', 'test', 'lint'],
  },
];

const errors = [];

function requireFile(packageDir, file) {
  const path = join(root, packageDir, file);
  return existsSync(path) && statSync(path).isFile();
}

function requireDir(packageDir, dir) {
  const path = join(root, packageDir, dir);
  return existsSync(path) && statSync(path).isDirectory();
}

const rootPackageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const rootWorkspaces = rootPackageJson.workspaces || [];
const pnpmWorkspace = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8');

for (const packageSpec of requestedPackages) {
  const packageJsonPath = join(root, packageSpec.dir, 'package.json');
  if (!existsSync(packageJsonPath)) {
    errors.push(`${packageSpec.dir} is missing package.json`);
    continue;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

  if (packageJson.name !== packageSpec.name) {
    errors.push(`${packageSpec.dir} package name must be ${packageSpec.name}, got ${packageJson.name || '<missing>'}`);
  }

  if (Boolean(packageJson.private) !== packageSpec.private) {
    errors.push(`${packageSpec.name} private must be ${packageSpec.private}`);
  }

  for (const file of packageSpec.requiredFiles) {
    if (!requireFile(packageSpec.dir, file)) {
      errors.push(`${packageSpec.name} missing required file ${file}`);
    }
  }

  for (const dir of packageSpec.requiredDirs) {
    if (!requireDir(packageSpec.dir, dir)) {
      errors.push(`${packageSpec.name} missing required directory ${dir}`);
    }
  }

  for (const script of packageSpec.requiredScripts) {
    if (!packageJson.scripts?.[script]) {
      errors.push(`${packageSpec.name} missing required script ${script}`);
    }
  }
}

if (!rootWorkspaces.includes('packages/*')) {
  errors.push('root package.json workspaces must include packages/*');
}

if (!rootWorkspaces.includes('packages/web/ui')) {
  errors.push('root package.json workspaces must include packages/web/ui');
}

for (const workspacePattern of ['packages/*', 'packages/web/ui']) {
  if (!pnpmWorkspace.includes(`- ${workspacePattern}`)) {
    errors.push(`pnpm-workspace.yaml must include ${workspacePattern}`);
  }
}

if (errors.length > 0) {
  console.error('Workspace package inventory check failed:');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`Workspace package inventory passed for ${requestedPackages.map(pkg => pkg.name).join(', ')}`);
