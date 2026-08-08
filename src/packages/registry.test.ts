/**
 * Integration tests for root channel/support package registry + pure interop.
 * Drives shipped modules under routing/, sessions/, utils/ and the registry surface.
 */
import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  bootstrapPackageRegistry,
  getPackageStatus,
  getSessionKeyInterop,
  getUtilsInterop,
  listPackageStatuses,
  listPresentChannelIds,
  listPresentSupportIds,
  resolveDarkClawdRoot,
  roundTripChannelSessionKey,
  softLoadPackageEntry,
} from './registry.js';

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

    expect(listPresentChannelIds(ROOT).length).toBeGreaterThanOrEqual(4);
    expect(listPresentSupportIds(ROOT).length).toBeGreaterThanOrEqual(4);
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

    // Bootstrap / list must still work after soft-fail attempt
    expect(getPackageStatus('telegram', ROOT).present).toBe(true);
    expect(listPackageStatuses(ROOT).length).toBeGreaterThanOrEqual(10);
  });

  test('core registry import path does not throw when bootstrapping', () => {
    expect(() => bootstrapPackageRegistry(ROOT)).not.toThrow();
    const boot = bootstrapPackageRegistry(ROOT);
    // sessionKeys + utils attached for consumers
    expect(typeof boot.sessionKeys.buildAgentPeerSessionKey).toBe('function');
    expect(typeof boot.utils.parseBooleanValue).toBe('function');
  });
});
