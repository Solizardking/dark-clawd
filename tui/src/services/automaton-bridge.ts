// ═══════════════════════════════════════════════════════════════════════════════
// Dark Clawd ↔ Automaton integration bridge
// Discovers the vendored automaton runtime and surfaces status / constitution /
// entrypoints without requiring a full Conway provision on every call.
// ═══════════════════════════════════════════════════════════════════════════════

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

export interface AutomatonPackageManifest {
  name: string;
  version: string;
  description?: string;
  bin?: Record<string, string>;
  scripts?: Record<string, string>;
}

export interface AutomatonTreePaths {
  root: string;
  packageJson: string;
  constitution: string;
  srcIndex: string;
  cliPackageJson: string;
  scriptsDir: string;
  readme: string;
}

export interface AutomatonIntegrationStatus {
  present: boolean;
  root: string;
  packageName: string | null;
  version: string | null;
  description: string | null;
  constitutionPresent: boolean;
  constitutionLaws: string[];
  entrypoints: {
    runtime: string | null;
    cliPackage: string | null;
    scripts: string[];
  };
  bins: string[];
  darkClawdRole: string;
  lineageNote: string;
}

const RELATIVE_AUTOMATON = 'automaton';

function looksLikeAutomatonRoot(candidate: string): boolean {
  return (
    existsSync(join(candidate, 'package.json')) &&
    existsSync(join(candidate, 'src', 'index.ts'))
  );
}

/** Resolve this package root (`tui/` or monorepo dark-clawd root). */
export function resolveDarkClawdRoot(fromUrl: string = import.meta.url): string {
  // src/services/automaton-bridge.ts → ../../
  const here = dirname(fileURLToPath(fromUrl));
  return resolve(here, '../..');
}

/**
 * Resolve vendored automaton/.
 * Search order:
 * 1. AUTOMATON_PACKAGE_DIR env (absolute or relative to package root)
 * 2. <packageRoot>/automaton
 * 3. <packageRoot>/../automaton  (sibling — when running from tui/)
 */
export function resolveAutomatonRoot(darkClawdRoot?: string): string {
  const root = darkClawdRoot ?? resolveDarkClawdRoot();
  const envDir = process.env.AUTOMATON_PACKAGE_DIR?.trim();
  const candidates: string[] = [];
  if (envDir) {
    candidates.push(envDir.startsWith('/') ? envDir : resolve(root, envDir));
  }
  candidates.push(join(root, RELATIVE_AUTOMATON));
  candidates.push(resolve(root, '..', RELATIVE_AUTOMATON));

  for (const c of candidates) {
    if (looksLikeAutomatonRoot(c)) return c;
  }
  // Prefer sibling for tui package layout even if not yet installed
  const sibling = resolve(root, '..', RELATIVE_AUTOMATON);
  if (existsSync(sibling) || root.endsWith(`${join('', 'tui')}`) || /[/\\]tui$/.test(root)) {
    return sibling;
  }
  return join(root, RELATIVE_AUTOMATON);
}

export function getAutomatonTreePaths(automatonRoot?: string): AutomatonTreePaths {
  const root = automatonRoot ?? resolveAutomatonRoot();
  return {
    root,
    packageJson: join(root, 'package.json'),
    constitution: join(root, 'constitution.md'),
    srcIndex: join(root, 'src', 'index.ts'),
    cliPackageJson: join(root, 'packages', 'cli', 'package.json'),
    scriptsDir: join(root, 'scripts'),
    readme: join(root, 'README.md'),
  };
}

export function isAutomatonPresent(automatonRoot?: string): boolean {
  const paths = getAutomatonTreePaths(automatonRoot);
  return existsSync(paths.packageJson) && existsSync(paths.srcIndex);
}

export function loadAutomatonPackageManifest(
  automatonRoot?: string,
): AutomatonPackageManifest | null {
  const paths = getAutomatonTreePaths(automatonRoot);
  if (!existsSync(paths.packageJson)) return null;
  try {
    return JSON.parse(readFileSync(paths.packageJson, 'utf8')) as AutomatonPackageManifest;
  } catch {
    return null;
  }
}

export function loadAutomatonConstitution(automatonRoot?: string): string | null {
  const paths = getAutomatonTreePaths(automatonRoot);
  if (!existsSync(paths.constitution)) return null;
  return readFileSync(paths.constitution, 'utf8');
}

/** Extract Law headings from constitution.md (real shipped content). */
export function extractConstitutionLaws(constitutionText: string): string[] {
  const laws: string[] = [];
  for (const line of constitutionText.split(/\r?\n/)) {
    const m = line.match(/^##\s+(Law\s+[IVXLC]+)\b/i) || line.match(/^##\s+(Law\s+I{1,3})\b/);
    if (m) laws.push(m[1].replace(/\s+$/, ''));
    // Also accept "Law I — Never harm." style already matched above
  }
  // Fallback: scan for "Law I" style markers in body
  if (laws.length === 0) {
    const re = /\bLaw\s+(I{1,3}|IV|V)\b/g;
    const seen = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = re.exec(constitutionText)) !== null) {
      const key = `Law ${match[1]}`;
      if (!seen.has(key)) {
        seen.add(key);
        laws.push(key);
      }
    }
  }
  return laws;
}

export function listAutomatonScripts(automatonRoot?: string): string[] {
  const paths = getAutomatonTreePaths(automatonRoot);
  if (!existsSync(paths.scriptsDir)) return [];
  return readdirSync(paths.scriptsDir)
    .filter((name) => {
      try {
        return statSync(join(paths.scriptsDir, name)).isFile();
      } catch {
        return false;
      }
    })
    .sort();
}

/**
 * Build integration status from the real on-disk automaton tree.
 * This is the primary bridge API used by CLI + agent commands.
 */
export function getAutomatonIntegrationStatus(
  darkClawdRoot?: string,
): AutomatonIntegrationStatus {
  const root = resolveAutomatonRoot(darkClawdRoot);
  const paths = getAutomatonTreePaths(root);
  const present = isAutomatonPresent(root);
  const manifest = present ? loadAutomatonPackageManifest(root) : null;
  const constitution = present ? loadAutomatonConstitution(root) : null;
  const scripts = present ? listAutomatonScripts(root) : [];
  const bins = manifest?.bin ? Object.keys(manifest.bin) : [];

  let cliPackage: string | null = null;
  if (existsSync(paths.cliPackageJson)) {
    try {
      const cli = JSON.parse(readFileSync(paths.cliPackageJson, 'utf8')) as {
        name?: string;
      };
      cliPackage = cli.name ?? paths.cliPackageJson;
    } catch {
      cliPackage = paths.cliPackageJson;
    }
  }

  return {
    present,
    root,
    packageName: manifest?.name ?? null,
    version: manifest?.version ?? null,
    description: manifest?.description ?? null,
    constitutionPresent: !!constitution,
    constitutionLaws: constitution ? extractConstitutionLaws(constitution) : [],
    entrypoints: {
      runtime: present && existsSync(paths.srcIndex) ? paths.srcIndex : null,
      cliPackage,
      scripts,
    },
    bins,
    darkClawdRole:
      'Sovereign background runtime — heartbeat, self-mod, replication, Conway survival loop. Complements the Dark Clawd TUI market surface.',
    lineageNote:
      'Vendored as dark-ralph/automaton (sibling of tui/). Constitution is Clawd-branded (shell molts / laws do not). Product surface: Dark Clawd, forged from Ralph on Solana.',
  };
}

export function formatAutomatonStatusReport(
  status: AutomatonIntegrationStatus = getAutomatonIntegrationStatus(),
): string {
  const lines = [
    '════════════════════════════════════════',
    '  DARK CLAWD · AUTOMATON BRIDGE',
    '════════════════════════════════════════',
    `  Present:        ${status.present ? 'YES' : 'NO'}`,
    `  Root:           ${status.root}`,
    `  Package:        ${status.packageName ?? '—'}`,
    `  Version:        ${status.version ?? '—'}`,
    `  Bins:           ${status.bins.length ? status.bins.join(', ') : '—'}`,
    `  Runtime:        ${status.entrypoints.runtime ?? '—'}`,
    `  Creator CLI:    ${status.entrypoints.cliPackage ?? '—'}`,
    `  Scripts:        ${status.entrypoints.scripts.join(', ') || '—'}`,
    `  Constitution:   ${status.constitutionPresent ? 'YES' : 'NO'}`,
    `  Laws:           ${status.constitutionLaws.join(' · ') || '—'}`,
    `  Role:           ${status.darkClawdRole}`,
    `  Lineage:        ${status.lineageNote}`,
    '════════════════════════════════════════',
  ];
  return lines.join('\n');
}

export type AutomatonProxyCommand = 'help' | 'version' | 'status' | 'run';

/**
 * Proxy a safe automaton CLI flag through the vendored src entry (tsx/node),
 * or return a dry-run command plan when runtime deps are not installed.
 */
export function planAutomatonProxy(command: AutomatonProxyCommand = 'help'): {
  cwd: string;
  args: string[];
  suggested: string[];
} {
  const root = resolveAutomatonRoot();
  const flag =
    command === 'help'
      ? '--help'
      : command === 'version'
        ? '--version'
        : command === 'status'
          ? '--status'
          : '--run';
  return {
    cwd: root,
    args: ['src/index.ts', flag],
    suggested: [
      `cd ../automaton && pnpm install && pnpm build`,
      `cd ../automaton && pnpm test`,
      `cd ../automaton && node dist/index.js ${flag}`,
      `bun run automaton:${command === 'help' ? 'help' : command}`,
    ],
  };
}

/**
 * Attempt to execute `automaton --help|--version` via bun against the TypeScript
 * entry when possible. Returns stdout/stderr; does not throw on missing deps.
 */
export function tryRunAutomatonEntrypoint(
  flag: '--help' | '--version' = '--help',
  darkClawdRoot?: string,
): { ok: boolean; stdout: string; stderr: string; exitCode: number | null } {
  const root = resolveAutomatonRoot(darkClawdRoot);
  const entry = join(root, 'src', 'index.ts');
  if (!existsSync(entry)) {
    return { ok: false, stdout: '', stderr: 'automaton entry missing', exitCode: null };
  }

  const result = spawnSync('bun', ['run', entry, flag], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
    timeout: 15_000,
  });

  return {
    ok: result.status === 0,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status,
  };
}
