/**
 * Proves llm-wiki-tang is integrated into the published tui/ package surface.
 * Resolves the real sibling ../llm-wiki-tang tree (not a mock).
 */
import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  OPENCLAWD_LLM_WIKI_TANG_PACKAGE,
  OPENCLAWD_ROUTES,
  getOpenClawdCapabilityMap,
} from './openclawd.js';
import {
  formatLlmWikiTangStatusReport,
  getLlmWikiTangIntegrationStatus,
  getResearchApiUrl,
  isLlmWikiTangPresent,
  loadLlmWikiTangPyProject,
  parsePyProjectToml,
  probeResearchApiHealth,
  resolveLlmWikiTangRoot,
  resolveTuiPackageRoot,
} from './services/llm-wiki-tang-bridge.js';

const tuiRoot = resolveTuiPackageRoot();

describe('tui llm-wiki-tang integration', () => {
  test('resolves sibling ../llm-wiki-tang from tui package root', () => {
    expect(tuiRoot.endsWith('tui') || tuiRoot.includes(`${join('', 'tui')}`)).toBe(true);
    const wikiRoot = resolveLlmWikiTangRoot(tuiRoot);
    expect(isLlmWikiTangPresent(wikiRoot)).toBe(true);
    expect(existsSync(join(wikiRoot, 'pyproject.toml'))).toBe(true);
    expect(existsSync(join(wikiRoot, 'api', 'main.py'))).toBe(true);
    expect(wikiRoot).toContain('llm-wiki-tang');
    // Prefer monorepo sibling, not nested under tui/llm-wiki-tang unless present
    expect(wikiRoot.includes(`${join('tui', 'llm-wiki-tang')}`)).toBe(false);
  });

  test('openclawd exposes research / llm-wiki-tang capability', () => {
    expect(OPENCLAWD_ROUTES.research).toBe('/research');
    expect(OPENCLAWD_LLM_WIKI_TANG_PACKAGE).toBe('llm-wiki-tang');
    expect(getOpenClawdCapabilityMap().research).toBeDefined();
    expect(getOpenClawdCapabilityMap().research.localPath).toContain('llm-wiki-tang');
  });

  test('bridge reads real pyproject.toml + status report', () => {
    const wikiRoot = resolveLlmWikiTangRoot(tuiRoot);
    const raw = readFileSync(join(wikiRoot, 'pyproject.toml'), 'utf8');
    const parsed = parsePyProjectToml(raw);
    expect(parsed.name).toBe('llm-wiki-tang');
    expect(parsed.version).toBeTruthy();

    const fromDisk = loadLlmWikiTangPyProject(wikiRoot);
    expect(fromDisk.name).toBe(parsed.name);
    expect(fromDisk.version).toBe(parsed.version);

    const status = getLlmWikiTangIntegrationStatus(tuiRoot);
    expect(status.present).toBe(true);
    expect(status.packageName).toBe(parsed.name);
    expect(status.paths.apiMain).toBe(true);
    expect(status.paths.api).toBe(true);
    expect(status.paths.src).toBe(true);
    expect(status.paths.tests).toBe(true);
    expect(status.researchApiUrl).toBeTruthy();
    expect(getResearchApiUrl().length).toBeGreaterThan(0);
    expect(formatLlmWikiTangStatusReport(status)).toContain('LLM-WIKI-TANG');
  });

  test('health probe soft-fails without throwing when API is down', async () => {
    const probe = await probeResearchApiHealth('http://127.0.0.1:9', 500);
    expect(typeof probe.ok).toBe('boolean');
    expect(probe.ok).toBe(false);
    expect(probe.url).toContain('/health');
  });

  test('source wiring: CLI research-api, agent /research, package scripts', () => {
    const cli = readFileSync(join(tuiRoot, 'src/cli.tsx'), 'utf8');
    expect(cli).toContain(".command('research-api')");
    expect(cli).toContain('formatLlmWikiTangStatusReport');
    expect(cli).toContain('probeResearchApiHealth');

    const engine = readFileSync(join(tuiRoot, 'src/engine/clawd-agent.ts'), 'utf8');
    expect(engine).toContain('researchViaLlmWikiTang');
    expect(engine).toContain('LLM-WIKI-TANG');

    const index = readFileSync(join(tuiRoot, 'src/index.ts'), 'utf8');
    expect(index).toContain('llm-wiki-tang-bridge');

    const pkg = JSON.parse(readFileSync(join(tuiRoot, 'package.json'), 'utf8'));
    expect(pkg.scripts['research-api:status']).toBeTruthy();
    expect(pkg.scripts['research-api:health']).toBeTruthy();
    expect(pkg.scripts['research-api:serve']).toContain('llm-wiki-tang');
  });
});
