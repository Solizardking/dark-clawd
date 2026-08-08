/**
 * Durable GitHub-facing check: the real root README documents product identity
 * and the monorepo inventory visitors need after clone. Reads README.md on disk
 * (not a reimplementation of product copy).
 */
import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readmePath = join(root, 'README.md');

/** OBJECTIVE inventory paths (excluding node_modules as a documented source tree). */
const INVENTORY_PATHS = [
  'agent',
  'automaton',
  'clawdbot-pumpfun',
  'docs',
  'llm-wiki-tang',
  'mpp',
  'providers',
  'routing',
  'scripts',
  'sessions',
  'signal',
  'skills',
  'slack',
  'src',
  'telegram',
  'tui',
  'utils',
  'web',
  'whatsapp',
  'wizard',
] as const;

const RELATIVE_LINK_RE = /\[[^\]]*\]\(([^)]+)\)/g;

describe('README GitHub presentation + monorepo inventory', () => {
  test('product name, npm package, install entry, and hub/repo links', () => {
    const text = readFileSync(readmePath, 'utf8');

    expect(text).toContain('Dark Clawd');
    expect(text).toContain('@x402solana/dark-clawd');
    expect(text).toMatch(/npm install -g @x402solana\/dark-clawd/);
    expect(text).toContain('dark-clawd');
    expect(text).toContain('https://cheshireterminal.ai/dark-clawd');
    expect(text).toContain('https://github.com/Solizardking/dark-clawd');
    expect(text).toMatch(/git clone https:\/\/github\.com\/Solizardking\/dark-clawd\.git/);
  });

  test('documents each monorepo inventory area from OBJECTIVE', () => {
    const text = readFileSync(readmePath, 'utf8');
    const missing: string[] = [];
    for (const token of INVENTORY_PATHS) {
      // Accept `token/` or bare path token in tree/table copy
      if (!text.includes(token)) missing.push(token);
      // Path should exist on disk so the README is not aspirational fiction
      expect(existsSync(join(root, token))).toBe(true);
    }
    expect(missing).toEqual([]);
    // Prefer explicit monorepo map link for deep dive
    expect(text).toContain('docs/MONOREPO.md');
    expect(existsSync(join(root, 'docs/MONOREPO.md'))).toBe(true);
  });

  test('relative markdown links in README resolve under the repo root', () => {
    const text = readFileSync(readmePath, 'utf8');
    const broken: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = RELATIVE_LINK_RE.exec(text))) {
      const raw = m[1].trim();
      if (!raw || raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('mailto:') || raw.startsWith('#')) {
        continue;
      }
      const pathOnly = raw.split('#')[0];
      if (!pathOnly) continue;
      if (!existsSync(join(root, pathOnly))) {
        broken.push(raw);
      }
    }
    expect(broken).toEqual([]);
  });
});
