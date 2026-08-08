/**
 * Integration tests for root channel/support package registry + pure interop.
 * Drives shipped modules under routing/, sessions/, utils/ and the registry surface.
 */
import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  bootstrapPackageRegistry,
  getAutomatonInterop,
  getLlmWikiTangInterop,
  getPackageStatus,
  getSessionKeyInterop,
  getUtilsInterop,
  listPackageStatuses,
  listPresentChannelIds,
  listPresentMetaIds,
  listPresentSupportIds,
  resolveDarkClawdRoot,
  roundTripChannelSessionKey,
  softLoadPackageEntry,
} from './registry.js';
import {
  loadLlmWikiTangPyProject,
  parsePyProjectToml,
  resolveLlmWikiTangRoot,
} from '../services/llm-wiki-tang-bridge.js';
import { readFileSync } from 'node:fs';

const ROOT = resolveDarkClawdRoot();

describe('package registry (channel + support interop)', () => {
  test('repo root contains OBJECTIVE package directories', () => {
    for (const dir of [
      'telegram',
      'slack',
      'signal',
      'web',
      'routing',
      'sessions',
      'utils',
      'providers',
      'scripts',
      'skills',
      'wizard',
      'automaton',
      'llm-wiki-tang',
    ]) {
      expect(existsSync(join(ROOT, dir))).toBe(true);
    }
  });

  test('bootstrap lists present channels and support packages', () => {
    const boot = bootstrapPackageRegistry(ROOT);
    expect(boot.product).toBe('Dark Clawd');
    expect(boot.root).toBe(ROOT);

    const channelIds = boot.channels.filter((c) => c.present).map((c) => c.id);
    for (const id of ['telegram', 'slack', 'signal', 'web']) {
      expect(channelIds).toContain(id);
    }

    const supportIds = boot.support.filter((s) => s.present).map((s) => s.id);
    for (const id of ['routing', 'sessions', 'utils', 'providers']) {
      expect(supportIds).toContain(id);
    }

    const metaIds = boot.meta.filter((m) => m.present).map((m) => m.id);
    expect(metaIds).toContain('automaton');
    expect(metaIds).toContain('llm-wiki-tang');
    expect(listPresentMetaIds(ROOT)).toContain('automaton');
    expect(listPresentMetaIds(ROOT)).toContain('llm-wiki-tang');

    expect(listPresentChannelIds(ROOT).length).toBeGreaterThanOrEqual(4);
    expect(listPresentSupportIds(ROOT).length).toBeGreaterThanOrEqual(4);
  });

  test('automaton is discoverable via registry + bridge interop', () => {
    expect(getPackageStatus('automaton', ROOT).present).toBe(true);

    const interop = getAutomatonInterop(ROOT);
    expect(interop.present).toBe(true);
    expect(interop.packageName).toBeTruthy();
    expect(interop.constitutionPresent).toBe(true);
    expect(interop.constitutionLaws.length).toBeGreaterThan(0);
    expect(interop.loadConstitution()?.length ?? 0).toBeGreaterThan(0);
    expect(interop.formatStatusReport()).toContain('AUTOMATON');

    const boot = bootstrapPackageRegistry(ROOT);
    expect(boot.automaton.present).toBe(true);
    expect(boot.automaton.constitutionPresent).toBe(true);
    expect(String(boot.automaton.packageName || '')).toMatch(/automaton/i);
  });

  test('llm-wiki-tang is discoverable via registry + pyproject metadata', () => {
    expect(getPackageStatus('llm-wiki-tang', ROOT).present).toBe(true);

    const wikiRoot = resolveLlmWikiTangRoot(ROOT);
    expect(existsSync(join(wikiRoot, 'pyproject.toml'))).toBe(true);
    expect(existsSync(join(wikiRoot, 'api', 'main.py'))).toBe(true);

    // Drive real pyproject.toml — not a hardcoded name string without reading the file
    const raw = readFileSync(join(wikiRoot, 'pyproject.toml'), 'utf8');
    const parsed = parsePyProjectToml(raw);
    expect(parsed.name).toBe('llm-wiki-tang');
    expect(parsed.version).toBeTruthy();
    expect(String(parsed.description || '').length).toBeGreaterThan(0);

    const fromDisk = loadLlmWikiTangPyProject(wikiRoot);
    expect(fromDisk.name).toBe(parsed.name);
    expect(fromDisk.version).toBe(parsed.version);

    const interop = getLlmWikiTangInterop(ROOT);
    expect(interop.present).toBe(true);
    expect(interop.packageName).toBe(parsed.name);
    expect(interop.version).toBe(parsed.version);
    expect(interop.paths.apiMain).toBe(true);
    expect(interop.paths.api).toBe(true);
    expect(interop.paths.src).toBe(true);
    expect(interop.paths.tests).toBe(true);
    expect(interop.paths.readme).toBe(true);
    expect(interop.researchApiUrl.length).toBeGreaterThan(0);
    expect(interop.uvicornCmd).toContain('uvicorn');
    expect(interop.formatStatusReport()).toContain('LLM-WIKI-TANG');

    const boot = bootstrapPackageRegistry(ROOT);
    expect(boot.llmWikiTang.present).toBe(true);
    expect(boot.llmWikiTang.packageName).toBe(parsed.name);
    expect(boot.llmWikiTang.apiMainPresent).toBe(true);
    expect(boot.llmWikiTang.researchApiUrl).toBeTruthy();
  });

  test('routing↔sessions session-key round-trip for agent:main:telegram:dm:user1', () => {
    const { key, parsed, agentId, expectedRest } = roundTripChannelSessionKey({
      agentId: 'main',
      channel: 'telegram',
      peerId: 'user1',
    });
    expect(key).toBe('agent:main:telegram:dm:user1');
    expect(parsed).not.toBeNull();
    expect(parsed?.agentId).toBe('main');
    expect(parsed?.rest).toBe(expectedRest);
    expect(agentId).toBe('main');

    // Dual package surface: sessions helper matches
    const sk = getSessionKeyInterop();
    expect(sk.parseAgentSessionKeyFromSessions(key)?.agentId).toBe('main');
    expect(sk.isSubagentSessionKey(key)).toBe(false);

    // store key helper
    const store = sk.toAgentStoreSessionKey({
      agentId: 'main',
      requestKey: 'telegram:dm:user1',
    });
    expect(store).toBe('agent:main:telegram:dm:user1');
  });

  test('pure utils export is loadable via registry utils interop', () => {
    const utils = getUtilsInterop();
    expect(utils.parseBooleanValue('yes')).toBe(true);
    expect(utils.parseBooleanValue('off')).toBe(false);
    expect(utils.parseBooleanValue('maybe')).toBeUndefined();
    expect(utils.normalizeAccountId('  acct-1  ')).toBe('acct-1');
    expect(utils.normalizeAccountId('')).toBeUndefined();
  });

  test('soft-load pure routing entry succeeds; heavy telegram entry fails soft', async () => {
    const routing = await softLoadPackageEntry('routing', 'session-key.ts', ROOT);
    expect(routing.ok).toBe(true);
    expect(routing.exports?.length ?? 0).toBeGreaterThan(0);
    expect(routing.exports).toContain('buildAgentPeerSessionKey');

    const utils = await softLoadPackageEntry('utils', 'boolean.ts', ROOT);
    expect(utils.ok).toBe(true);
    expect(utils.exports).toContain('parseBooleanValue');

    // Heavy channel index may fail without OpenClaw parents — must not throw
    const tg = await softLoadPackageEntry('telegram', 'index.ts', ROOT);
    // Either succeeds (if deps resolve) or soft-fails with error string
    expect(typeof tg.ok).toBe('boolean');
    if (!tg.ok) {
      expect(String(tg.error || '').length).toBeGreaterThan(0);
    }

    // Automaton config soft-loads without running CLI main; bridge remains source of truth
    const autoCfg = await softLoadPackageEntry('automaton', 'src/config.ts', ROOT);
    expect(typeof autoCfg.ok).toBe('boolean');
    if (!autoCfg.ok) {
      expect(String(autoCfg.error || '').length).toBeGreaterThan(0);
    }
    // Presence + bridge path still works
    expect(getPackageStatus('automaton', ROOT).present).toBe(true);

    // Python API entry cannot load as a JS module — soft-fail must not throw
    const wiki = await softLoadPackageEntry('llm-wiki-tang', 'api/main.py', ROOT);
    expect(typeof wiki.ok).toBe('boolean');
    if (!wiki.ok) {
      expect(String(wiki.error || '').length).toBeGreaterThan(0);
    }
    expect(getPackageStatus('llm-wiki-tang', ROOT).present).toBe(true);
    expect(getLlmWikiTangInterop(ROOT).present).toBe(true);

    // Bootstrap / list must still work after soft-fail attempt
    expect(getPackageStatus('telegram', ROOT).present).toBe(true);
    expect(listPackageStatuses(ROOT).length).toBeGreaterThanOrEqual(12);
  });

  test('core registry import path does not throw when bootstrapping', () => {
    expect(() => bootstrapPackageRegistry(ROOT)).not.toThrow();
    const boot = bootstrapPackageRegistry(ROOT);
    // sessionKeys + utils attached for consumers
    expect(typeof boot.sessionKeys.buildAgentPeerSessionKey).toBe('function');
    expect(typeof boot.utils.parseBooleanValue).toBe('function');
    expect(boot.llmWikiTang.present).toBe(true);
  });
});
