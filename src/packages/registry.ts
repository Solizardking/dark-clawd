/**
 * Dark Clawd package registry — discovers root channel/support packages and
 * exposes pure interop (routing ↔ sessions session keys, utils) without
 * requiring full OpenClaw parent modules (config/, agents/, etc.).
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

import {
  buildAgentPeerSessionKey,
  parseAgentSessionKey,
  resolveAgentIdFromSessionKey,
  toAgentStoreSessionKey,
  type ParsedAgentSessionKey,
} from '../../routing/session-key.ts';
import {
  isAcpSessionKey,
  isSubagentSessionKey,
  parseAgentSessionKey as parseAgentSessionKeyFromSessions,
  resolveThreadParentSessionKey,
} from '../../sessions/session-key-utils.ts';
import { parseBooleanValue } from '../../utils/boolean.ts';
import { normalizeAccountId } from '../../utils/account-id.ts';
import {
  formatAutomatonStatusReport,
  getAutomatonIntegrationStatus,
  isAutomatonPresent,
  loadAutomatonConstitution,
  planAutomatonProxy,
  resolveAutomatonRoot,
} from '../services/automaton-bridge.ts';

export type PackageKind = 'channel' | 'support' | 'meta';

export type PackageId =
  | 'telegram'
  | 'slack'
  | 'signal'
  | 'web'
  | 'whatsapp'
  | 'routing'
  | 'sessions'
  | 'utils'
  | 'providers'
  | 'scripts'
  | 'skills'
  | 'wizard'
  | 'automaton';

export interface PackageDescriptor {
  id: PackageId;
  kind: PackageKind;
  /** Directory name under repo root */
  dir: string;
  /** Optional pure modules that can be imported without OpenClaw parents */
  pureEntries?: string[];
  /** Heavy entrypoints that may fail without OpenClaw parents (optional soft-load) */
  heavyEntries?: string[];
  description: string;
}

export interface PackageStatus {
  id: PackageId;
  kind: PackageKind;
  dir: string;
  absolutePath: string;
  present: boolean;
  pureEntries: string[];
  heavyEntries: string[];
  description: string;
}

export interface SoftLoadResult {
  id: PackageId;
  entry: string;
  ok: boolean;
  exports?: string[];
  error?: string;
}

const DESCRIPTORS: PackageDescriptor[] = [
  {
    id: 'telegram',
    kind: 'channel',
    dir: 'telegram',
    pureEntries: [],
    heavyEntries: ['index.ts'],
    description: 'Telegram bot / monitor channel package',
  },
  {
    id: 'slack',
    kind: 'channel',
    dir: 'slack',
    pureEntries: [],
    heavyEntries: ['index.ts'],
    description: 'Slack monitor / actions channel package',
  },
  {
    id: 'signal',
    kind: 'channel',
    dir: 'signal',
    pureEntries: [],
    heavyEntries: ['index.ts'],
    description: 'Signal daemon / monitor channel package',
  },
  {
    id: 'web',
    kind: 'channel',
    dir: 'web',
    pureEntries: [],
    heavyEntries: ['auto-reply.ts', 'accounts.ts'],
    description: 'Web / WhatsApp web channel package',
  },
  {
    id: 'whatsapp',
    kind: 'channel',
    dir: 'whatsapp',
    pureEntries: [],
    heavyEntries: [],
    description: 'WhatsApp channel package (peer of web)',
  },
  {
    id: 'routing',
    kind: 'support',
    dir: 'routing',
    pureEntries: ['session-key.ts'],
    heavyEntries: ['resolve-route.ts', 'bindings.ts'],
    description: 'Session routing + agent session key builders',
  },
  {
    id: 'sessions',
    kind: 'support',
    dir: 'sessions',
    pureEntries: ['session-key-utils.ts'],
    heavyEntries: ['send-policy.ts', 'model-overrides.ts'],
    description: 'Session key parse helpers + policies',
  },
  {
    id: 'utils',
    kind: 'support',
    dir: 'utils',
    pureEntries: ['boolean.ts', 'account-id.ts', 'message-channel.ts'],
    heavyEntries: [],
    description: 'Shared pure utilities',
  },
  {
    id: 'providers',
    kind: 'support',
    dir: 'providers',
    pureEntries: [],
    heavyEntries: ['github-copilot-token.ts', 'qwen-portal-oauth.ts'],
    description: 'LLM provider auth helpers',
  },
  {
    id: 'scripts',
    kind: 'meta',
    dir: 'scripts',
    pureEntries: [],
    heavyEntries: [],
    description: 'Workspace scripts / package checks',
  },
  {
    id: 'skills',
    kind: 'meta',
    dir: 'skills',
    pureEntries: [],
    heavyEntries: [],
    description: 'Agent skills hub (symlinks + zkrouter)',
  },
  {
    id: 'wizard',
    kind: 'meta',
    dir: 'wizard',
    pureEntries: [],
    heavyEntries: ['onboarding.ts'],
    description: 'Onboarding wizard package',
  },
  {
    id: 'automaton',
    kind: 'meta',
    dir: 'automaton',
    // Prefer config over src/index.ts — index is a CLI entry that runs on import.
    pureEntries: ['src/config.ts'],
    heavyEntries: ['src/index.ts'],
    description:
      'Vendored Clawd Automaton sovereign runtime (heartbeat, Conway, constitution)',
  },
];

/** Resolve monorepo root (parent of `src/`). */
export function resolveDarkClawdRoot(from: string = fileURLToPath(import.meta.url)): string {
  // src/packages/registry.ts → ../../
  return resolve(from, '../../..');
}

export function listPackageDescriptors(): PackageDescriptor[] {
  return DESCRIPTORS.slice();
}

export function listChannelPackageIds(): PackageId[] {
  return DESCRIPTORS.filter((d) => d.kind === 'channel').map((d) => d.id);
}

export function listSupportPackageIds(): PackageId[] {
  return DESCRIPTORS.filter((d) => d.kind === 'support').map((d) => d.id);
}

function existingEntries(absDir: string, candidates: string[] | undefined): string[] {
  if (!candidates?.length || !existsSync(absDir)) return [];
  return candidates.filter((rel) => existsSync(join(absDir, rel)));
}

export function getPackageStatus(id: PackageId, root = resolveDarkClawdRoot()): PackageStatus {
  const desc = DESCRIPTORS.find((d) => d.id === id);
  if (!desc) {
    throw new Error(`Unknown package id: ${id}`);
  }
  const absolutePath = join(root, desc.dir);
  const present = existsSync(absolutePath) && statSync(absolutePath).isDirectory();
  return {
    id: desc.id,
    kind: desc.kind,
    dir: desc.dir,
    absolutePath,
    present,
    pureEntries: present ? existingEntries(absolutePath, desc.pureEntries) : [],
    heavyEntries: present ? existingEntries(absolutePath, desc.heavyEntries) : [],
    description: desc.description,
  };
}

export function listPackageStatuses(root = resolveDarkClawdRoot()): PackageStatus[] {
  return DESCRIPTORS.map((d) => getPackageStatus(d.id, root));
}

export function listPresentChannelIds(root = resolveDarkClawdRoot()): string[] {
  return listPackageStatuses(root)
    .filter((s) => s.kind === 'channel' && s.present)
    .map((s) => s.id);
}

export function listPresentSupportIds(root = resolveDarkClawdRoot()): string[] {
  return listPackageStatuses(root)
    .filter((s) => s.kind === 'support' && s.present)
    .map((s) => s.id);
}

export function listPresentMetaIds(root = resolveDarkClawdRoot()): string[] {
  return listPackageStatuses(root)
    .filter((s) => s.kind === 'meta' && s.present)
    .map((s) => s.id);
}

/**
 * Automaton interop via the existing core bridge (`src/services/automaton-bridge.ts`).
 * Presence / constitution / status without requiring a full Conway provision.
 *
 * @param darkClawdRoot monorepo root (parent of `automaton/`); bridge resolves the tree.
 */
export function getAutomatonInterop(darkClawdRoot = resolveDarkClawdRoot()) {
  const status = getAutomatonIntegrationStatus(darkClawdRoot);
  const autoRoot = resolveAutomatonRoot(darkClawdRoot);
  return {
    present: status.present,
    root: status.root,
    packageName: status.packageName,
    version: status.version,
    constitutionPresent: status.constitutionPresent,
    constitutionLaws: status.constitutionLaws,
    entrypoints: status.entrypoints,
    bins: status.bins,
    darkClawdRole: status.darkClawdRole,
    lineageNote: status.lineageNote,
    formatStatusReport: () => formatAutomatonStatusReport(status),
    resolveRoot: () => autoRoot,
    isPresent: () => isAutomatonPresent(autoRoot),
    loadConstitution: () => loadAutomatonConstitution(autoRoot),
    planProxy: planAutomatonProxy,
  };
}

/** Soft-load a package entry; never throws for missing OpenClaw parents. */
export async function softLoadPackageEntry(
  id: PackageId,
  entry?: string,
  root = resolveDarkClawdRoot(),
): Promise<SoftLoadResult> {
  const status = getPackageStatus(id, root);
  if (!status.present) {
    return { id, entry: entry || '', ok: false, error: `package dir missing: ${status.dir}` };
  }
  const candidates = entry
    ? [entry]
    : [...status.pureEntries, ...status.heavyEntries];
  if (!candidates.length) {
    // Meta packages (scripts/skills) are presence-only
    return {
      id,
      entry: '',
      ok: true,
      exports: listDirNames(status.absolutePath),
    };
  }
  const chosen = candidates[0];
  const abs = join(status.absolutePath, chosen);
  if (!existsSync(abs)) {
    return { id, entry: chosen, ok: false, error: `entry missing: ${chosen}` };
  }
  try {
    const mod = await import(pathToFileURL(abs).href);
    const exports = Object.keys(mod).filter((k) => k !== 'default' && k !== 'module.exports');
    return { id, entry: chosen, ok: true, exports };
  } catch (e) {
    return {
      id,
      entry: chosen,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

function listDirNames(dir: string): string[] {
  try {
    return readdirSync(dir).slice(0, 50);
  } catch {
    return [];
  }
}

/** Pure session-key interop: routing builders + sessions parsers. */
export function getSessionKeyInterop() {
  return {
    // routing
    buildAgentPeerSessionKey,
    parseAgentSessionKey,
    resolveAgentIdFromSessionKey,
    toAgentStoreSessionKey,
    // sessions (same parse export path for dual load proof)
    parseAgentSessionKeyFromSessions,
    isAcpSessionKey,
    isSubagentSessionKey,
    resolveThreadParentSessionKey,
  };
}

/** Pure utils loadable from the same workspace entry as core. */
export function getUtilsInterop() {
  return {
    parseBooleanValue,
    normalizeAccountId,
  };
}

/**
 * Build + parse a representative channel session key.
 * Fixture shape: agent:main:telegram:dm:user1
 */
export function roundTripChannelSessionKey(params?: {
  agentId?: string;
  channel?: string;
  peerId?: string;
}): {
  key: string;
  parsed: ParsedAgentSessionKey | null;
  agentId: string;
  expectedRest: string;
} {
  const agentId = params?.agentId ?? 'main';
  const channel = params?.channel ?? 'telegram';
  const peerId = params?.peerId ?? 'user1';
  const key = buildAgentPeerSessionKey({
    agentId,
    channel,
    peerKind: 'dm',
    peerId,
    dmScope: 'per-channel-peer',
  });
  const parsed = parseAgentSessionKey(key);
  // Cross-check sessions package parse
  const parsed2 = parseAgentSessionKeyFromSessions(key);
  if (JSON.stringify(parsed) !== JSON.stringify(parsed2)) {
    throw new Error('routing and sessions parseAgentSessionKey disagree');
  }
  return {
    key,
    parsed,
    agentId: resolveAgentIdFromSessionKey(key),
    expectedRest: `${channel}:dm:${peerId}`,
  };
}

export function bootstrapPackageRegistry(root = resolveDarkClawdRoot()) {
  const statuses = listPackageStatuses(root);
  const channels = statuses.filter((s) => s.kind === 'channel');
  const support = statuses.filter((s) => s.kind === 'support');
  const meta = statuses.filter((s) => s.kind === 'meta');
  const automaton = getAutomatonInterop(root);
  return {
    root,
    product: 'Dark Clawd',
    channels: channels.map((s) => ({
      id: s.id,
      present: s.present,
      pureEntries: s.pureEntries,
      heavyEntries: s.heavyEntries,
    })),
    support: support.map((s) => ({
      id: s.id,
      present: s.present,
      pureEntries: s.pureEntries,
    })),
    meta: meta.map((s) => ({ id: s.id, present: s.present })),
    sessionKeys: getSessionKeyInterop(),
    utils: getUtilsInterop(),
    /** Vendored Automaton sovereign runtime (present when `automaton/` is on disk). */
    automaton: {
      present: automaton.present,
      packageName: automaton.packageName,
      version: automaton.version,
      constitutionPresent: automaton.constitutionPresent,
      constitutionLaws: automaton.constitutionLaws,
      root: automaton.root,
      bins: automaton.bins,
    },
  };
}
