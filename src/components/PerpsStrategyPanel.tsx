// ═══════════════════════════════════════════════════════════════════════════════
// DARK CLAWD TUI - Perpetual Futures Strategy Panel (TWAP/Grid/TA)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type StrategyType = 'TWAP' | 'GRID' | 'TA';
export type ExecutionMode = 'paper' | 'dry-run' | 'confirm-each' | 'auto-execute';
export type StrategyStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error';

export interface StrategyConfig {
  type: StrategyType;
  symbol: string;
  mode: ExecutionMode;
  intervalSeconds: number;
  maxTicks: number;
  // TWAP-specific
  totalNotional?: number;
  slices?: number;
  // Grid-specific
  lowerPrice?: number;
  upperPrice?: number;
  levelsPerSide?: number;
  // TA-specific
  configJson?: string;
}

interface PerpsStrategyPanelProps {
  symbol: string;
  markPrice: number;
  balance?: { usdc: number };
  onStartStrategy?: (config: StrategyConfig) => void;
  onStopStrategy?: () => void;
  width?: number;
}

interface ActiveRun {
  id: string;
  type: StrategyType;
  symbol: string;
  status: StrategyStatus;
  startedAt: string;
  ticks: number;
  progress: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// STRATEGY PANEL
// ─────────────────────────────────────────────────────────────────────────────

export const PerpsStrategyPanel: React.FC<PerpsStrategyPanelProps> = ({
  symbol,
  markPrice,
  balance = { usdc: 10000 },
  onStartStrategy,
  onStopStrategy,
  width = 50,
}) => {
  const [selectedType, setSelectedType] = useState<StrategyType>('TWAP');
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('paper');
  const [intervalSec, setIntervalSec] = useState(60);
  const [maxTicks, setMaxTicks] = useState(20);
  const [totalNotional, setTotalNotional] = useState(1000);
  const [slices, setSlices] = useState(10);
  const [levelsPerSide, setLevelsPerSide] = useState(5);
  const [gridWidthPct, setGridWidthPct] = useState(2.0);

  // Mock active runs
  const [activeRuns] = useState<ActiveRun[]>([
    { id: 'run-001', type: 'TWAP', symbol: 'SOL', status: 'running', startedAt: '2m ago', ticks: 3, progress: '30%' },
    { id: 'run-002', type: 'GRID', symbol: 'BONK', status: 'paused', startedAt: '15m ago', ticks: 12, progress: '--' },
  ]);

  useInput((input) => {
    if (input === '1') setSelectedType('TWAP');
    if (input === '2') setSelectedType('GRID');
    if (input === '3') setSelectedType('TA');
    if (input === 'p') setExecutionMode('paper');
    if (input === 'd') setExecutionMode('dry-run');
    if (input === 'c') setExecutionMode('confirm-each');
    if (input === 'a') setExecutionMode('auto-execute');
  });

  const handleStart = () => {
    if (!onStartStrategy) return;
    onStartStrategy({
      type: selectedType,
      symbol,
      mode: executionMode,
      intervalSeconds: intervalSec,
      maxTicks,
      totalNotional,
      slices: selectedType === 'TWAP' ? slices : undefined,
      lowerPrice: markPrice * (1 - gridWidthPct / 100),
      upperPrice: markPrice * (1 + gridWidthPct / 100),
      levelsPerSide: selectedType === 'GRID' ? levelsPerSide : undefined,
    });
  };

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="green" width={width}>
      {/* Header */}
      <Box paddingX={1} borderBottom justifyContent="space-between">
        <Text color="greenBright" bold>
          STRATEGY RUNNER
        </Text>
        <Text color="cyan">{symbol} PERP</Text>
      </Box>

      <Box flexDirection="column" paddingX={1} paddingY={1}>
        {/* Active Runs */}
        {activeRuns.length > 0 && (
          <Box flexDirection="column" marginBottom={1}>
            <Text color="yellowBright" bold>
              ACTIVE RUNS
            </Text>
            {activeRuns.map((run) => (
              <Box key={run.id} justifyContent="space-between">
                <Text color="cyan">{run.type}</Text>
                <Text color={run.status === 'running' ? 'green' : 'yellow'}>
                  {run.symbol} ● {run.status.toUpperCase()}
                </Text>
                <Text color="gray" dimColor>
                  {run.startedAt} • tick {run.ticks}
                </Text>
                <Text color="white">{run.progress}</Text>
              </Box>
            ))}
            <Box marginTop={1}>
              <Text color="gray">{'─'.repeat(width - 4)}</Text>
            </Box>
          </Box>
        )}

        {/* Strategy Type Selector */}
        <Box marginBottom={1}>
          <Text color="gray">Type: </Text>
          <Text color={selectedType === 'TWAP' ? 'white' : 'gray'} bold={selectedType === 'TWAP'}>
            [1] TWAP
          </Text>
          <Text color="gray"> │ </Text>
          <Text color={selectedType === 'GRID' ? 'white' : 'gray'} bold={selectedType === 'GRID'}>
            [2] GRID
          </Text>
          <Text color="gray"> │ </Text>
          <Text color={selectedType === 'TA' ? 'white' : 'gray'} bold={selectedType === 'TA'}>
            [3] TA
          </Text>
        </Box>

        {/* Execution Mode */}
        <Box marginBottom={1}>
          <Text color="gray">Mode: </Text>
          <Text color={executionMode === 'paper' ? 'green' : 'gray'} bold={executionMode === 'paper'}>
            [P]APER
          </Text>
          <Text color="gray"> │ </Text>
          <Text color={executionMode === 'dry-run' ? 'cyan' : 'gray'} bold={executionMode === 'dry-run'}>
            [D]RY
          </Text>
          <Text color="gray"> │ </Text>
          <Text color={executionMode === 'confirm-each' ? 'yellow' : 'gray'} bold={executionMode === 'confirm-each'}>
            [C]ONFIRM
          </Text>
          <Text color="gray"> │ </Text>
          <Text color={executionMode === 'auto-execute' ? 'red' : 'gray'} bold={executionMode === 'auto-execute'}>
            [A]UTO
          </Text>
        </Box>

        {/* Strategy-specific config */}
        {selectedType === 'TWAP' && (
          <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1} marginBottom={1}>
            <Text color="cyan" bold>TWAP CONFIG</Text>
            <Box justifyContent="space-between">
              <Text color="gray">Total:</Text>
              <Text color="white">${totalNotional.toLocaleString()}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text color="gray">Slices:</Text>
              <Text color="white">{slices}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text color="gray">Per Slice:</Text>
              <Text color="cyan">${(totalNotional / slices).toFixed(2)}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text color="gray">Interval:</Text>
              <Text color="white">{intervalSec}s</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text color="gray">Max Ticks:</Text>
              <Text color="white">{maxTicks}</Text>
            </Box>
          </Box>
        )}

        {selectedType === 'GRID' && (
          <Box flexDirection="column" borderStyle="round" borderColor="magenta" padding={1} marginBottom={1}>
            <Text color="magenta" bold>GRID CONFIG</Text>
            <Box justifyContent="space-between">
              <Text color="gray">Center:</Text>
              <Text color="white">${markPrice.toFixed(2)}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text color="gray">Width:</Text>
              <Text color="white">±{gridWidthPct}%</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text color="gray">Range:</Text>
              <Text color="cyan">${(markPrice * (1 - gridWidthPct / 100)).toFixed(2)} — ${(markPrice * (1 + gridWidthPct / 100)).toFixed(2)}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text color="gray">Levels/Side:</Text>
              <Text color="white">{levelsPerSide}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text color="gray">Total Levels:</Text>
              <Text color="white">{levelsPerSide * 2}</Text>
            </Box>
          </Box>
        )}

        {selectedType === 'TA' && (
          <Box flexDirection="column" borderStyle="round" borderColor="yellow" padding={1} marginBottom={1}>
            <Text color="yellow" bold>TA STRATEGY</Text>
            <Text color="gray" dimColor>
              Rule-based config via JSON or pre-set templates:
            </Text>
            <Box marginTop={1}>
              <Text color="cyan">• EMA Cross (SOL)</Text>
            </Box>
            <Box>
              <Text color="cyan">• RSI Reversal</Text>
            </Box>
            <Box>
              <Text color="cyan">• MACD Divergence</Text>
            </Box>
            <Box>
              <Text color="cyan">• Bollinger Squeeze</Text>
            </Box>
          </Box>
        )}

        {/* Guardrails Info */}
        <Box borderStyle="round" borderColor="gray" padding={1} marginBottom={1}>
          <Text color="gray" dimColor>
            Guardrails: max-total ${(balance.usdc * 0.5).toFixed(0)} • max-drift 75bps • exposure ratio 3.0
          </Text>
        </Box>

        {/* Controls */}
        <Box justifyContent="center" marginTop={1}>
          <Box borderStyle="round" borderColor="cyan" paddingX={2}>
            <Text color="cyan" bold underline>
              START {selectedType} (Enter)
            </Text>
          </Box>
          {activeRuns.length > 0 && (
            <Box borderStyle="round" borderColor="red" paddingX={2} marginLeft={1}>
              <Text color="red" bold>
                [S]TOP ALL
              </Text>
            </Box>
          )}
        </Box>

        {/* Help */}
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            1/2/3 select type • P/D/C/A mode • Enter start
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FUNDING RATE TRACKER WIDGET
// ─────────────────────────────────────────────────────────────────────────────

export const FundingRateTracker: React.FC<{
  symbol: string;
  currentRate?: number;
  predictedRate?: number;
  nextFundingIn?: number;
  width?: number;
}> = ({ symbol, currentRate = 0.0001, predictedRate = 0.00012, nextFundingIn = 1800, width = 30 }) => {
  const minutes = Math.floor(nextFundingIn / 60);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="yellow" width={width}>
      <Box paddingX={1} borderBottom>
        <Text color="yellowBright" bold>
          FUNDING {symbol}
        </Text>
      </Box>
      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Box justifyContent="space-between">
          <Text color="gray">Current:</Text>
          <Text color={currentRate > 0 ? 'red' : 'green'}>{(currentRate * 100).toFixed(4)}%</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">Predicted:</Text>
          <Text color={predictedRate > 0 ? 'red' : 'green'}>{(predictedRate * 100).toFixed(4)}%</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">Next in:</Text>
          <Text color="white">{minutes}:00</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {(currentRate * 7 * 100).toFixed(2)}% APR charged to longs
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default PerpsStrategyPanel;