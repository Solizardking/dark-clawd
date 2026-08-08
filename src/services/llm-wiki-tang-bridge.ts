/**
 * Dark Clawd ↔ llm-wiki-tang integration bridge
 * Discovers the vendored AutoResearch / OpenClawd memory API tree and surfaces
 * pyproject metadata + key paths without requiring uvicorn or Python deps.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LLM_WIKI_TANG_DIR = 'llm-wiki-tang';
export const DEFAULT_RESEARCH_API_URL = 'http://localhost:8000';
export const DEFAULT_UVICORN_CMD =
  'python3 -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000';

export interface LlmWikiTangPyProject {
  name: string | null;
  version: string | null;
  description: string | null;
  requiresPython: string | null;
}

export interface LlmWikiTangPaths {
  root: string;
  pyproject: string;
  readme: string;
  apiDir: string;
  apiMain: string;
  srcDir: string;
  testsDir: string;
  webDir: string;
  examplesDir: string;
  openclawdMemoryDir: string;
  netlifyDir: string;
}

export interface LlmWikiTangIntegrationStatus {
  present: boolean;
  root: string;
  packageName: string | null;
  version: string | null;
  description: string | null;
  requiresPython: string | null;
  paths: {
    api: boolean;
    apiMain: boolean;
    src: boolean;
    tests: boolean;
    web: boolean;
    examples: boolean;
    readme: boolean;
    pyproject: boolean;
    openclawdMemory: boolean;
    netlify: boolean;
  };
  researchApiUrl: string;
  uvicornCmd: string;
  darkClawdRole: string;
}

function resolveDarkClawdRoot(fromUrl: string = import.meta.url): string {
  const here = dirname(fileURLToPath(fromUrl));
  // src/services/llm-wiki-tang-bridge.ts → ../../
  return resolve(here, '../..');
}

function looksLikeLlmWikiTangRoot(candidate: string): boolean {
  return (
    existsSync(join(candidate, 'pyproject.toml')) &&
    existsSync(join(candidate, 'api')) &&
    existsSync(join(candidate, 'README.md'))
  );
}

/** Resolve vendored llm-wiki-tang/ (env override or package-local). */
export function resolveLlmWikiTangRoot(darkClawdRoot?: string): string {
  const root = darkClawdRoot ?? resolveDarkClawdRoot();
  const envDir = process.env.LLM_WIKI_TANG_DIR?.trim();
  const candidates: string[] = [];
  if (envDir) {
    candidates.push(envDir.startsWith('/') ? envDir : resolve(root, envDir));
  }
  candidates.push(join(root, LLM_WIKI_TANG_DIR));
  for (const c of candidates) {
    if (looksLikeLlmWikiTangRoot(c)) return c;
  }
  return join(root, LLM_WIKI_TANG_DIR);
}

export function getLlmWikiTangPaths(wikiRoot?: string): LlmWikiTangPaths {
  const root = wikiRoot ?? resolveLlmWikiTangRoot();
  return {
    root,
    pyproject: join(root, 'pyproject.toml'),
    readme: join(root, 'README.md'),
    apiDir: join(root, 'api'),
    apiMain: join(root, 'api', 'main.py'),
    srcDir: join(root, 'src'),
    testsDir: join(root, 'tests'),
    webDir: join(root, 'web'),
    examplesDir: join(root, 'examples'),
    openclawdMemoryDir: join(root, '.openclawd-memory'),
    netlifyDir: join(root, '.netlify'),
  };
}

export function isLlmWikiTangPresent(wikiRoot?: string): boolean {
  const root = wikiRoot ?? resolveLlmWikiTangRoot();
  return looksLikeLlmWikiTangRoot(root);
}

/**
 * Parse [project] name/version/description from real pyproject.toml text.
 * Soft-fails to null fields on missing/malformed content (never throws).
 */
export function parsePyProjectToml(text: string): LlmWikiTangPyProject {
  const out: LlmWikiTangPyProject = {
    name: null,
    version: null,
    description: null,
    requiresPython: null,
  };
  if (!text || typeof text !== 'string') return out;

  // Prefer the [project] table (ignore later tool tables).
  const projectSection = text.match(/\[project\]([\s\S]*?)(?=\n\[|$)/);
  const body = projectSection?.[1] ?? text;

  const strField = (key: string): string | null => {
    const re = new RegExp(`^${key}\\s*=\\s*"([^"]*)"`, 'm');
    const m = body.match(re);
    return m?.[1] ?? null;
  };

  out.name = strField('name');
  out.version = strField('version');
  out.description = strField('description');
  out.requiresPython = strField('requires-python');
  return out;
}

export function loadLlmWikiTangPyProject(wikiRoot?: string): LlmWikiTangPyProject {
  const paths = getLlmWikiTangPaths(wikiRoot);
  if (!existsSync(paths.pyproject)) {
    return { name: null, version: null, description: null, requiresPython: null };
  }
  try {
    const text = readFileSync(paths.pyproject, 'utf8');
    return parsePyProjectToml(text);
  } catch {
    return { name: null, version: null, description: null, requiresPython: null };
  }
}

function dirPresent(p: string): boolean {
  try {
    return existsSync(p) && statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function filePresent(p: string): boolean {
  try {
    return existsSync(p) && statSync(p).isFile();
  } catch {
    return false;
  }
}

/**
 * Build integration status from the real on-disk llm-wiki-tang tree.
 * Does not spawn uvicorn or import Python.
 */
export function getLlmWikiTangIntegrationStatus(
  darkClawdRoot?: string,
): LlmWikiTangIntegrationStatus {
  const root = resolveLlmWikiTangRoot(darkClawdRoot);
  const paths = getLlmWikiTangPaths(root);
  const present = isLlmWikiTangPresent(root);
  const meta = present ? loadLlmWikiTangPyProject(root) : {
    name: null,
    version: null,
    description: null,
    requiresPython: null,
  };

  const researchApiUrl =
    process.env.RESEARCH_API_URL?.trim() || DEFAULT_RESEARCH_API_URL;

  return {
    present,
    root,
    packageName: meta.name,
    version: meta.version,
    description: meta.description,
    requiresPython: meta.requiresPython,
    paths: {
      api: dirPresent(paths.apiDir),
      apiMain: filePresent(paths.apiMain),
      src: dirPresent(paths.srcDir),
      tests: dirPresent(paths.testsDir),
      web: dirPresent(paths.webDir),
      examples: dirPresent(paths.examplesDir),
      readme: filePresent(paths.readme),
      pyproject: filePresent(paths.pyproject),
      openclawdMemory: dirPresent(paths.openclawdMemoryDir),
      netlify: dirPresent(paths.netlifyDir),
    },
    researchApiUrl,
    uvicornCmd: DEFAULT_UVICORN_CMD,
    darkClawdRole:
      'Local AutoResearch + OpenClawd memory API for clawd-tui (/research, /autoloop). Point RESEARCH_API_URL at uvicorn.',
  };
}

export function formatLlmWikiTangStatusReport(
  status: LlmWikiTangIntegrationStatus = getLlmWikiTangIntegrationStatus(),
): string {
  const p = status.paths;
  return [
    '════════════════════════════════════════',
    '  DARK CLAWD · LLM-WIKI-TANG BRIDGE',
    '════════════════════════════════════════',
    `  Present:        ${status.present ? 'YES' : 'NO'}`,
    `  Root:           ${status.root}`,
    `  Package:        ${status.packageName ?? '—'}`,
    `  Version:        ${status.version ?? '—'}`,
    `  API main:       ${p.apiMain ? 'YES' : 'NO'} (api/main.py)`,
    `  Subtrees:       api=${p.api} src=${p.src} tests=${p.tests} web=${p.web}`,
    `  Memory dir:     ${p.openclawdMemory ? 'YES' : 'NO'}`,
    `  RESEARCH_API:   ${status.researchApiUrl}`,
    `  Run:            cd llm-wiki-tang && ${status.uvicornCmd}`,
    `  Role:           ${status.darkClawdRole}`,
    '════════════════════════════════════════',
  ].join('\n');
}
