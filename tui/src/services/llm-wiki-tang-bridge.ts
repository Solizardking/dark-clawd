// ═══════════════════════════════════════════════════════════════════════════════
// Dark Clawd TUI ↔ llm-wiki-tang integration bridge
// Discovers sibling ../llm-wiki-tang (AutoResearch + OpenClawd memory API) and
// surfaces pyproject metadata + key paths without requiring uvicorn/Python.
// ═══════════════════════════════════════════════════════════════════════════════

import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
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

function looksLikeLlmWikiTangRoot(candidate: string): boolean {
  return (
    existsSync(join(candidate, 'pyproject.toml')) &&
    existsSync(join(candidate, 'api')) &&
    existsSync(join(candidate, 'README.md'))
  );
}

/** Resolve this package root (`tui/` when running from the preferred npm surface). */
export function resolveTuiPackageRoot(fromUrl: string = import.meta.url): string {
  // tui/src/services/llm-wiki-tang-bridge.ts → ../../
  const here = dirname(fileURLToPath(fromUrl));
  return resolve(here, '../..');
}

/**
 * Resolve vendored llm-wiki-tang/.
 * Search order:
 * 1. LLM_WIKI_TANG_DIR env (absolute or relative to package root)
 * 2. <packageRoot>/llm-wiki-tang
 * 3. <packageRoot>/../llm-wiki-tang  (sibling — when running from tui/)
 */
export function resolveLlmWikiTangRoot(packageRoot?: string): string {
  const root = packageRoot ?? resolveTuiPackageRoot();
  const envDir = process.env.LLM_WIKI_TANG_DIR?.trim();
  const candidates: string[] = [];
  if (envDir) {
    candidates.push(envDir.startsWith('/') ? envDir : resolve(root, envDir));
  }
  candidates.push(join(root, LLM_WIKI_TANG_DIR));
  candidates.push(resolve(root, '..', LLM_WIKI_TANG_DIR));

  for (const c of candidates) {
    if (looksLikeLlmWikiTangRoot(c)) return c;
  }
  // Prefer sibling for tui package layout even if tree is incomplete
  const sibling = resolve(root, '..', LLM_WIKI_TANG_DIR);
  if (existsSync(sibling) || /[/\\]tui$/.test(root)) {
    return sibling;
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
    return parsePyProjectToml(readFileSync(paths.pyproject, 'utf8'));
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

export function getResearchApiUrl(): string {
  return process.env.RESEARCH_API_URL?.trim() || DEFAULT_RESEARCH_API_URL;
}

/**
 * Build integration status from the real on-disk llm-wiki-tang tree.
 * Does not spawn uvicorn or import Python.
 */
export function getLlmWikiTangIntegrationStatus(
  packageRoot?: string,
): LlmWikiTangIntegrationStatus {
  const root = resolveLlmWikiTangRoot(packageRoot);
  const paths = getLlmWikiTangPaths(root);
  const present = isLlmWikiTangPresent(root);
  const meta = present
    ? loadLlmWikiTangPyProject(root)
    : { name: null, version: null, description: null, requiresPython: null };

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
    researchApiUrl: getResearchApiUrl(),
    uvicornCmd: DEFAULT_UVICORN_CMD,
    darkClawdRole:
      'Local AutoResearch + OpenClawd memory API for Dark Clawd TUI (/research, /autoloop). Point RESEARCH_API_URL at uvicorn; falls back to Perplexity when unset/unavailable.',
  };
}

export function formatLlmWikiTangStatusReport(
  status: LlmWikiTangIntegrationStatus = getLlmWikiTangIntegrationStatus(),
): string {
  const p = status.paths;
  return [
    '════════════════════════════════════════',
    '  DARK CLAWD TUI · LLM-WIKI-TANG BRIDGE',
    '════════════════════════════════════════',
    `  Present:        ${status.present ? 'YES' : 'NO'}`,
    `  Root:           ${status.root}`,
    `  Package:        ${status.packageName ?? '—'}`,
    `  Version:        ${status.version ?? '—'}`,
    `  API main:       ${p.apiMain ? 'YES' : 'NO'} (api/main.py)`,
    `  Subtrees:       api=${p.api} src=${p.src} tests=${p.tests} web=${p.web}`,
    `  Memory dir:     ${p.openclawdMemory ? 'YES' : 'NO'}`,
    `  RESEARCH_API:   ${status.researchApiUrl}`,
    `  Run:            cd ${status.present ? status.root : '../llm-wiki-tang'} && ${status.uvicornCmd}`,
    `  TUI env:        RESEARCH_API_URL=${status.researchApiUrl}`,
    `  Role:           ${status.darkClawdRole}`,
    '════════════════════════════════════════',
  ].join('\n');
}

/**
 * Soft health probe against RESEARCH_API_URL.
 * Never throws; returns ok:false when the API is down or fetch fails.
 */
export async function probeResearchApiHealth(
  baseUrl: string = getResearchApiUrl(),
  timeoutMs = 2500,
): Promise<{ ok: boolean; status?: number; body?: string; error?: string; url: string }> {
  const url = `${baseUrl.replace(/\/+$/, '')}/health`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    const body = await res.text().catch(() => '');
    return {
      ok: res.ok,
      status: res.status,
      body: body.slice(0, 500),
      url,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      url,
    };
  }
}

/**
 * Soft market research call against the local AutoResearch API.
 * Soft-fails when uvicorn is not running (does not throw).
 */
export async function researchViaLlmWikiTang(
  query: string,
  opts?: { baseUrl?: string; timeoutMs?: number },
): Promise<{ ok: boolean; content?: string; error?: string; url: string }> {
  const base = (opts?.baseUrl ?? getResearchApiUrl()).replace(/\/+$/, '');
  const url = `${base}/api/v1/research/market`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts?.timeoutMs ?? 8000);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-tier': 'local' },
      body: JSON.stringify({ query, topic: query, symbol: query }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 300)}`, url };
    }
    try {
      const data = JSON.parse(text) as Record<string, unknown>;
      const content =
        (typeof data.summary === 'string' && data.summary) ||
        (typeof data.result === 'string' && data.result) ||
        (typeof data.content === 'string' && data.content) ||
        JSON.stringify(data, null, 2);
      return { ok: true, content, url };
    } catch {
      return { ok: true, content: text, url };
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      url,
    };
  }
}
