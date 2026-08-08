/**
 * Structural + pure communication checks for the canonical tui/ package.
 * Drives shipped product helpers and asserts monorepo entry wiring.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'bun:test';

import {
  PACKAGE_NAME,
  PRODUCT_INSTALL_CURL,
  PRODUCT_NAME,
  formatWelcomeBanner,
} from './product.js';
import { getSolGptShippedToolCatalog, SOL_GPT_TOOL_COUNT } from './tools/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const TUI_ROOT = resolve(HERE, '..');
const REPO_ROOT = resolve(TUI_ROOT, '..');

const REQUIRED = [
  'dist',
  'scripts',
  'src',
  '.dockerignore',
  '.env.example',
  '.eslintrc.cjs',
  'CHANGELOG.md',
  'Dockerfile',
  'fly.toml',
  'install.sh',
  'LICENSE',
  'package.json',
  'README.md',
  'tsconfig.json',
  'tui.ts',
] as const;

describe('tui package communication', () => {
  test('hosts the full package inventory under tui/', () => {
    for (const name of REQUIRED) {
      expect(existsSync(join(TUI_ROOT, name))).toBe(true);
    }
    expect(existsSync(join(TUI_ROOT, 'src', 'cli.tsx'))).toBe(true);
    expect(existsSync(join(TUI_ROOT, 'src', 'App.tsx'))).toBe(true);
    expect(existsSync(join(TUI_ROOT, 'scripts', 'fix-shebang.mjs'))).toBe(true);
  });

  test('runTui entry exists and monorepo consumers import it', () => {
    const entry = join(TUI_ROOT, 'tui.ts');
    const text = readFileSync(entry, 'utf-8');
    expect(text).toContain('export async function runTui');
    expect(text).toContain("from './src/App.js'");

    for (const consumer of ['scripts/run-tui.ts', 'wizard/onboarding.finalize.ts']) {
      const abs = join(REPO_ROOT, consumer);
      expect(existsSync(abs)).toBe(true);
      expect(readFileSync(abs, 'utf-8')).toContain('../tui/tui.js');
    }
  });

  test('drives shipped product + tool catalog (real exports)', () => {
    expect(PRODUCT_NAME).toBe('Dark Clawd');
    expect(PACKAGE_NAME).toBe('@x402solana/dark-clawd');
    const banner = formatWelcomeBanner();
    expect(banner).toContain(PRODUCT_NAME);
    expect(banner).toContain('dark-clawd');
    expect(PRODUCT_INSTALL_CURL).toContain('install.sh');

    const catalog = getSolGptShippedToolCatalog();
    expect(catalog.length).toBe(SOL_GPT_TOOL_COUNT);
    expect(SOL_GPT_TOOL_COUNT).toBe(171);
  });

  test('src production modules resolve internal relative imports', () => {
    const miss: string[] = [];
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        const st = statSync(full);
        if (st.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.test.ts') && !name.endsWith('.test.tsx')) {
          files.push(full);
        }
      }
    };
    walk(join(TUI_ROOT, 'src'));

    for (const file of files) {
      const text = readFileSync(file, 'utf-8');
      const re = /from\s+['"](\.[^'"]+)['"]/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        const spec = m[1];
        const base = dirname(file);
        const raw = resolve(base, spec);
        const candidates = [
          raw,
          raw + '.ts',
          raw + '.tsx',
          raw.replace(/\.js$/, '.ts'),
          raw.replace(/\.js$/, '.tsx'),
          join(raw, 'index.ts'),
        ];
        if (!candidates.some((c) => existsSync(c))) {
          // JSON import
          if (existsSync(raw) || existsSync(raw.replace(/\.js$/, '.json'))) continue;
          miss.push(`${relative(TUI_ROOT, file)} -> ${spec}`);
        }
      }
    }
    expect(miss).toEqual([]);
  });
});
