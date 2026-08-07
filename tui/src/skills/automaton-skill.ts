// ═══════════════════════════════════════════════════════════════════════════════
// Dark Clawd skill — Automaton sovereign runtime helpers
// Thin, side-effect-light wrappers over automaton-bridge for engine/CLI use.
// ═══════════════════════════════════════════════════════════════════════════════

import {
  formatAutomatonStatusReport,
  getAutomatonIntegrationStatus,
  loadAutomatonConstitution,
  listAutomatonScripts,
  planAutomatonProxy,
  resolveAutomatonRoot,
  type AutomatonIntegrationStatus,
} from '../services/automaton-bridge.js';

export interface AutomatonSkillSnapshot {
  status: AutomatonIntegrationStatus;
  report: string;
  constitutionHead: string | null;
  scripts: string[];
  proxyHelp: ReturnType<typeof planAutomatonProxy>;
}

/**
 * Capture a full Automaton skill snapshot from the real vendored tree.
 */
export function captureAutomatonSnapshot(): AutomatonSkillSnapshot {
  const status = getAutomatonIntegrationStatus();
  const constitution = status.present ? loadAutomatonConstitution(status.root) : null;
  const constitutionHead = constitution
    ? constitution.split(/\r?\n/).slice(0, 24).join('\n')
    : null;

  return {
    status,
    report: formatAutomatonStatusReport(status),
    constitutionHead,
    scripts: listAutomatonScripts(status.root),
    proxyHelp: planAutomatonProxy('help'),
  };
}

/**
 * Human-readable skill blurb for agent prompts / TUI help.
 */
export function describeAutomatonSkill(): string {
  const s = getAutomatonIntegrationStatus();
  return [
    'AUTOMATON SKILL',
    `  linked: ${s.present ? 'yes' : 'no'}`,
    `  package: ${s.packageName ?? '—'}@${s.version ?? '?'}`,
    `  root: ${resolveAutomatonRoot()}`,
    `  laws: ${s.constitutionLaws.join(', ') || '—'}`,
    '  commands: /automaton | /automaton constitution',
    '  cli: dark-clawd automaton status|constitution|paths|help',
  ].join('\n');
}

export {
  getAutomatonIntegrationStatus,
  formatAutomatonStatusReport,
  loadAutomatonConstitution,
  resolveAutomatonRoot,
};
