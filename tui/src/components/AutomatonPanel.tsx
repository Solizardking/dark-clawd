// ═══════════════════════════════════════════════════════════════════════════════
// DARK CLAWD TUI — Automaton Panel
// Surfaces the vendored sovereign runtime (./automaton) inside the Bloomberg UI.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import {
  getAutomatonIntegrationStatus,
  loadAutomatonConstitution,
  type AutomatonIntegrationStatus,
} from '../services/automaton-bridge.js';
import { Panel } from './Panel.js';

export interface AutomatonPanelProps {
  width?: number;
  height?: number;
  /** When true, show constitution excerpt */
  showConstitution?: boolean;
  /** Poll interval for re-reading on-disk status (ms). 0 = once. */
  refreshMs?: number;
}

function shortPath(p: string, max = 48): string {
  if (p.length <= max) return p;
  return `…${p.slice(-(max - 1))}`;
}

export const AutomatonPanel: React.FC<AutomatonPanelProps> = ({
  width,
  height,
  showConstitution = true,
  refreshMs = 0,
}) => {
  const [status, setStatus] = useState<AutomatonIntegrationStatus>(() =>
    getAutomatonIntegrationStatus(),
  );
  const [excerpt, setExcerpt] = useState<string>('');

  useEffect(() => {
    const refresh = () => {
      const s = getAutomatonIntegrationStatus();
      setStatus(s);
      if (showConstitution && s.present) {
        const text = loadAutomatonConstitution(s.root);
        if (text) {
          setExcerpt(
            text
              .split(/\r?\n/)
              .filter((l) => l.trim().length > 0)
              .slice(0, 12)
              .join('\n'),
          );
        }
      }
    };
    refresh();
    if (refreshMs > 0) {
      const t = setInterval(refresh, refreshMs);
      return () => clearInterval(t);
    }
    return undefined;
  }, [showConstitution, refreshMs]);

  const presentColor = status.present ? 'greenBright' : 'red';
  const lawLine =
    status.constitutionLaws.length > 0
      ? status.constitutionLaws.join(' · ')
      : '—';

  return (
    <Panel
      title="AUTOMATON · SOVEREIGN RUNTIME"
      width={width}
      height={height}
      borderColor="magenta"
      accentColor="magentaBright"
    >
      <Box flexDirection="column">
        <Box>
          <Text color="gray">Present: </Text>
          <Text color={presentColor} bold>
            {status.present ? 'YES' : 'NO'}
          </Text>
          <Text color="gray"> │ </Text>
          <Text color="cyan">{status.packageName ?? '—'}</Text>
          <Text color="gray"> @</Text>
          <Text color="white">{status.version ?? '?'}</Text>
        </Box>

        <Box marginTop={0}>
          <Text color="gray">Root: </Text>
          <Text color="white">{shortPath(status.root, 56)}</Text>
        </Box>

        <Box>
          <Text color="gray">Bins: </Text>
          <Text color="yellow">
            {status.bins.length ? status.bins.join(', ') : '—'}
          </Text>
        </Box>

        <Box>
          <Text color="gray">Scripts: </Text>
          <Text color="white">
            {status.entrypoints.scripts.length
              ? status.entrypoints.scripts.join(', ')
              : '—'}
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text color="magentaBright" bold>
            CONSTITUTION
          </Text>
          <Text color="gray"> · </Text>
          <Text color={status.constitutionPresent ? 'green' : 'red'}>
            {status.constitutionPresent ? 'loaded' : 'missing'}
          </Text>
        </Box>
        <Box>
          <Text color="gray">Laws: </Text>
          <Text color="cyan">{lawLine}</Text>
        </Box>

        {showConstitution && excerpt ? (
          <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="gray" paddingX={1}>
            {excerpt.split('\n').map((line, i) => (
              <Text key={i} color="gray" dimColor>
                {line.slice(0, 72)}
              </Text>
            ))}
          </Box>
        ) : null}

        <Box marginTop={1} flexDirection="column">
          <Text color="yellow">Role</Text>
          <Text color="white">{status.darkClawdRole}</Text>
        </Box>

        <Box marginTop={1}>
          <Text color="gray" dimColor>
            [7] AUTOMATON │ CLI: dark-clawd automaton status │ /automaton
          </Text>
        </Box>
      </Box>
    </Panel>
  );
};

/** Compact one-line status for sidebars / agent context. */
export const CompactAutomatonStatus: React.FC = () => {
  const [status, setStatus] = useState(() => getAutomatonIntegrationStatus());
  useEffect(() => {
    setStatus(getAutomatonIntegrationStatus());
  }, []);

  return (
    <Box>
      <Text color="magenta">⚙ Automaton </Text>
      <Text color={status.present ? 'green' : 'red'} bold>
        {status.present ? '● LINKED' : '○ MISSING'}
      </Text>
      {status.present && (
        <>
          <Text color="gray"> · </Text>
          <Text color="cyan">{status.version}</Text>
          <Text color="gray"> · </Text>
          <Text color="yellow">{status.constitutionLaws.length} laws</Text>
        </>
      )}
    </Box>
  );
};

export default AutomatonPanel;
