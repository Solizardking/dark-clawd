// ═══════════════════════════════════════════════════════════════════════════════
// DARK CLAWD TUI - Main Perpetual Futures Dashboard (Bloomberg Style)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { PerpsMarketInfo, PerpsMarketSelector } from './PerpsMarketInfo.js';
import type { PerpMarket } from './PerpsMarketInfo.js';
import { PerpsOrderEntry, MarginCalculator } from './PerpsOrderEntry.js';
import type { PerpsOrderParams } from './PerpsOrderEntry.js';
import { PerpsPositionTable, PerpsOpenOrders } from './PerpsPositionTable.js';
import type { PerpsPosition, PerpsOpenOrder } from './PerpsPositionTable.js';
import { PerpsStrategyPanel, FundingRateTracker } from './PerpsStrategyPanel.js';
import type { StrategyConfig } from './PerpsStrategyPanel.js';
import { OrderBook } from './OrderBook.js';
import { PriceChart, Sparkline } from './PriceChart.js';
import { DepthChart } from './DepthChart.js';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type PerpsView = 'markets' | 'trade' | 'positions' | 'strategies';

interface PerpsDashboardProps {
  width?: number;
  height?: number;
  apiKey?: string;
  onCommand?: (command: string) => void;
  onPlaceOrder?: (order: PerpsOrderParams) => void;
  onStartStrategy?: (config: StrategyConfig) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_MARKETS: PerpMarket[] = [
  { symbol: 'SOL', status: 'active', markPrice: 150.42, spotPrice: 150.45, openInterest: 452000000, maxLeverage: 10, fundingRate: 0.0001, volume24h: 2100000000, makerFeeBps: 0.2, takerFeeBps: 0.6, tickSize: 0.01, marketPubkey: '8UJg7jKWmCqBmNQYGbGmGmGmGmGmGmGmGmGmGmGm' },
  { symbol: 'BONK', status: 'active', markPrice: 0.0000234, spotPrice: 0.0000235, openInterest: 125000000, maxLeverage: 10, fundingRate: -0.0002, volume24h: 45000000, makerFeeBps: 0.2, takerFeeBps: 0.6, tickSize: 0.0000001, marketPubkey: '7UJg7jKWmCqBmNQYGbGmGmGmGmGmGmGmGmGmGmG' },
  { symbol: 'WIF', status: 'active', markPrice: 2.85, spotPrice: 2.86, openInterest: 85000000, maxLeverage: 5, fundingRate: 0.00005, volume24h: 38000000, makerFeeBps: 0.3, takerFeeBps: 0.7, tickSize: 0.001, marketPubkey: '6UJg7jKWmCqBmNQYGbGmGmGmGmGmGmGmGmGmGmG' },
  { symbol: 'JTO', status: 'active', markPrice: 3.21, spotPrice: 3.22, openInterest: 22000000, maxLeverage: 5, fundingRate: 0.00015, volume24h: 22000000, makerFeeBps: 0.2, takerFeeBps: 0.6, tickSize: 0.01, marketPubkey: '5UJg7jKWmCqBmNQYGbGmGmGmGmGmGmGmGmGmGmG' },
  { symbol: 'PYTH', status: 'active', markPrice: 0.45, spotPrice: 0.452, openInterest: 18500000, maxLeverage: 10, fundingRate: -0.0001, volume24h: 18500000, makerFeeBps: 0.2, takerFeeBps: 0.6, tickSize: 0.001, marketPubkey: '4UJg7jKWmCqBmNQYGbGmGmGmGmGmGmGmGmGmGmG' },
  { symbol: 'JUP', status: 'active', markPrice: 1.12, spotPrice: 1.13, openInterest: 15200000, maxLeverage: 5, fundingRate: 0.00008, volume24h: 15200000, makerFeeBps: 0.3, takerFeeBps: 0.7, tickSize: 0.01, marketPubkey: '3UJg7jKWmCqBmNQYGbGmGmGmGmGmGmGmGmGmGmG' },
];

const MOCK_POSITIONS: PerpsPosition[] = [
  { symbol: 'SOL', side: 'LONG', size: 10.5, entryPrice: 148.20, markPrice: 150.42, liquidationPrice: 135.00, unrealizedPnl: 23.31, unrealizedPnlPercent: 1.50, leverage: 5, marginMode: 'CROSS', notional: 1579.41, marginUsed: 315.88, fundingPaid: -1.20 },
  { symbol: 'BONK', side: 'SHORT', size: 5000000, entryPrice: 0.000025, markPrice: 0.0000234, liquidationPrice: 0.000030, unrealizedPnl: 8.00, unrealizedPnlPercent: 4.0, leverage: 3, marginMode: 'ISOLATED', notional: 117.00, marginUsed: 39.00, fundingPaid: 0.45 },
];

const MOCK_ORDERS: PerpsOpenOrder[] = [
  { id: 'ord-001', symbol: 'SOL', side: 'BUY', type: 'LIMIT', price: 148.50, size: 5.0, filled: 0, status: 'OPEN', createdAt: Date.now() - 600000 },
  { id: 'ord-002', symbol: 'WIF', side: 'SELL', type: 'STOP_LOSS', price: 2.65, size: 100, filled: 0, status: 'OPEN', createdAt: Date.now() - 1200000 },
];

// ─────────────────────────────────────────────────────────────────────────────
// PERPS DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export const PerpsDashboard: React.FC<PerpsDashboardProps> = ({
  width = 120,
  height = 40,
  apiKey,
  onCommand,
  onPlaceOrder,
  onStartStrategy,
}) => {
  const [view, setView] = useState<PerpsView>('markets');
  const [selectedSymbol, setSelectedSymbol] = useState('SOL');
  const colWidth = Math.floor((width - 6) / 3);

  // Get current market
  const currentMarket = MOCK_MARKETS.find((m) => m.symbol === selectedSymbol) || MOCK_MARKETS[0];

  // Keyboard navigation
  useInput((input) => {
    if (input === '1') setView('markets');
    if (input === '2') setView('trade');
    if (input === '3') setView('positions');
    if (input === '4') setView('strategies');

    // Market selection cycling
    if (view === 'markets' || view === 'trade') {
      if (input === 'n' || input === '.') {
        const idx = MOCK_MARKETS.findIndex((m) => m.symbol === selectedSymbol);
        setSelectedSymbol(MOCK_MARKETS[(idx + 1) % MOCK_MARKETS.length].symbol);
      }
      if (input === 'p' || input === ',') {
        const idx = MOCK_MARKETS.findIndex((m) => m.symbol === selectedSymbol);
        setSelectedSymbol(MOCK_MARKETS[(idx - 1 + MOCK_MARKETS.length) % MOCK_MARKETS.length].symbol);
      }
    }

    // Quick perps commands
    if (input === '?') onCommand?.('/perps');
  });

  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* Perps Header */}
      <Box borderStyle="single" borderColor="green" paddingX={1}>
        <Text color="greenBright" bold>
          🦞 PERPETUAL FUTURES
        </Text>
        <Text color="gray"> │ </Text>
        <Text color="cyan">{selectedSymbol} PERP</Text>
        <Text color="gray"> │ </Text>
        <Box>
          <Text color={view === 'markets' ? 'greenBright' : 'gray'} bold={view === 'markets'}>
            [1] MARKETS
          </Text>
          <Text color="gray"> │ </Text>
          <Text color={view === 'trade' ? 'greenBright' : 'gray'} bold={view === 'trade'}>
            [2] TRADE
          </Text>
          <Text color="gray"> │ </Text>
          <Text color={view === 'positions' ? 'greenBright' : 'gray'} bold={view === 'positions'}>
            [3] POSITIONS
          </Text>
          <Text color="gray"> │ </Text>
          <Text color={view === 'strategies' ? 'greenBright' : 'gray'} bold={view === 'strategies'}>
            [4] STRATS
          </Text>
        </Box>
        <Text color="gray" dimColor>
          {' '} • [N]ext [P]rev market • [?] /perps
        </Text>
      </Box>

      {/* Content */}
      {view === 'markets' && (
        <MarketsView
          markets={MOCK_MARKETS}
          currentMarket={currentMarket}
          selectedSymbol={selectedSymbol}
          onSelect={setSelectedSymbol}
          colWidth={colWidth}
        />
      )}

      {view === 'trade' && (
        <TradeView
          market={currentMarket}
          colWidth={colWidth}
          onPlaceOrder={onPlaceOrder}
        />
      )}

      {view === 'positions' && (
        <PositionsView
          positions={MOCK_POSITIONS}
          orders={MOCK_ORDERS}
          colWidth={colWidth}
        />
      )}

      {view === 'strategies' && (
        <StrategiesView
          market={currentMarket}
          colWidth={colWidth}
          onStartStrategy={onStartStrategy}
        />
      )}

      {/* Bottom Status Bar */}
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray" dimColor>
          {currentMarket.symbol} PERP • Mark ${currentMarket.markPrice?.toFixed(4)} • OI ${(currentMarket.openInterest! / 1e6).toFixed(1)}M • Lev {currentMarket.maxLeverage}x
        </Text>
        <Text color="gray" dimColor>
          {' '}• {view.toUpperCase()} VIEW
        </Text>
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MARKETS VIEW
// ─────────────────────────────────────────────────────────────────────────────

const MarketsView: React.FC<{
  markets: PerpMarket[];
  currentMarket: PerpMarket;
  selectedSymbol: string;
  onSelect: (s: string) => void;
  colWidth: number;
}> = ({ markets, currentMarket, selectedSymbol, onSelect, colWidth }) => {
  return (
    <Box flexGrow={1} padding={1}>
      <Box width={colWidth + 2}>
        <PerpsMarketSelector
          markets={markets}
          selected={selectedSymbol}
          onSelect={onSelect}
          width={colWidth}
        />
      </Box>
      <Box width={colWidth * 2 + 2} flexDirection="column" marginLeft={1}>
        <Box>
          <PerpsMarketInfo market={currentMarket} width={colWidth * 2} />
        </Box>
        <Box marginTop={1}>
          <OrderBook depth={6} width={colWidth * 2} symbol={`${selectedSymbol}/USDC`} />
        </Box>
      </Box>
      <Box flexDirection="column" width={colWidth} marginLeft={1}>
        <FundingRateTracker symbol={selectedSymbol} width={colWidth} />
        <Box marginTop={1}>
          <MarginCalculator
            notional={1000}
            leverage={5}
            markPrice={currentMarket.markPrice || 150}
            side="LONG"
            width={colWidth}
          />
        </Box>
        <Box marginTop={1}>
          <Box borderStyle="single" borderColor="gray" width={colWidth}>
            <Box paddingX={1} borderBottom>
              <Text color="gray" bold>QUICK STATS</Text>
            </Box>
            <Box flexDirection="column" paddingX={1} paddingY={1}>
              <Box justifyContent="space-between">
                <Text color="gray">24h Trades:</Text>
                <Text color="white">12,452</Text>
              </Box>
              <Box justifyContent="space-between">
                <Text color="gray">Long/Short:</Text>
                <Text color="green">58% / 42%</Text>
              </Box>
              <Box justifyContent="space-between">
                <Text color="gray">Liq. 24h:</Text>
                <Text color="red">$2.4M</Text>
              </Box>
              <Box justifyContent="space-between">
                <Text color="gray">Active Traders:</Text>
                <Text color="white">3,201</Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TRADE VIEW
// ─────────────────────────────────────────────────────────────────────────────

const TradeView: React.FC<{
  market: PerpMarket;
  colWidth: number;
  onPlaceOrder?: (order: PerpsOrderParams) => void;
}> = ({ market, colWidth, onPlaceOrder }) => {
  return (
    <Box flexGrow={1} padding={1}>
      <Box>
        <PerpsOrderEntry
          market={market}
          balance={{ usdc: 10000 }}
          onPlaceOrder={onPlaceOrder}
          width={colWidth}
        />
      </Box>
      <Box flexDirection="column" marginLeft={1} width={colWidth}>
        <MarginCalculator
          notional={1000}
          leverage={5}
          markPrice={market.markPrice || 150}
          side="LONG"
          width={colWidth}
        />
        <Box marginTop={1}>
          <FundingRateTracker symbol={market.symbol} width={colWidth} />
        </Box>
      </Box>
      <Box flexDirection="column" marginLeft={1} width={colWidth}>
        <OrderBook depth={8} width={colWidth} symbol={`${market.symbol}/USDC`} />
        <Box marginTop={1}>
          <DepthChart width={colWidth} height={8} />
        </Box>
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// POSITIONS VIEW
// ─────────────────────────────────────────────────────────────────────────────

const PositionsView: React.FC<{
  positions: PerpsPosition[];
  orders: PerpsOpenOrder[];
  colWidth: number;
}> = ({ positions, orders, colWidth }) => {
  return (
    <Box flexDirection="column" flexGrow={1} padding={1}>
      <PerpsPositionTable positions={positions} width={colWidth * 3 + 4} />
      <Box marginTop={1}>
        <PerpsOpenOrders orders={orders} width={colWidth * 3 + 4} />
      </Box>
      {positions.length > 0 && (
        <Box marginTop={1}>
          <PriceChart width={colWidth * 3 + 4} height={10} showVolume symbol={positions[0].symbol} />
        </Box>
      )}
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STRATEGIES VIEW
// ─────────────────────────────────────────────────────────────────────────────

const StrategiesView: React.FC<{
  market: PerpMarket;
  colWidth: number;
  onStartStrategy?: (config: StrategyConfig) => void;
}> = ({ market, colWidth, onStartStrategy }) => {
  return (
    <Box flexGrow={1} padding={1}>
      <Box>
        <PerpsStrategyPanel
          symbol={market.symbol}
          markPrice={market.markPrice || 150}
          balance={{ usdc: 10000 }}
          onStartStrategy={onStartStrategy}
          width={colWidth}
        />
      </Box>
      <Box flexDirection="column" marginLeft={1} width={colWidth * 2 + 2}>
        <Box borderStyle="single" borderColor="gray" flexDirection="column" width={colWidth * 2 + 2}>
          <Box paddingX={1} borderBottom>
            <Text color="greenBright" bold>STRATEGY MONITOR</Text>
          </Box>
          <Box flexDirection="column" padding={1}>
            <Text color="gray" dimColor>
              Strategy runs are monitored here. Each run creates a ledger-backed execution loop.
            </Text>
            <Box marginTop={1}>
              <Box borderStyle="round" borderColor="cyan" padding={1}>
                <Text color="cyan" bold>TWAP RUN #001 — SOL</Text>
                <Box justifyContent="space-between">
                  <Text color="gray">Status:</Text>
                  <Text color="green">● RUNNING</Text>
                </Box>
                <Box justifyContent="space-between">
                  <Text color="gray">Progress:</Text>
                  <Text color="white">3 / 10 slices (30%)</Text>
                </Box>
                <Box justifyContent="space-between">
                  <Text color="gray">Filled:</Text>
                  <Text color="white">$298.45 / $1,000.00</Text>
                </Box>
                <Box justifyContent="space-between">
                  <Text color="gray">Avg Price:</Text>
                  <Text color="cyan">$149.82</Text>
                </Box>
                <Box justifyContent="space-between">
                  <Text color="gray">Slippage:</Text>
                  <Text color="yellow">0.12%</Text>
                </Box>
                <Box marginTop={1}>
                  <Text color="gray" dimColor>
                    /twap status run-001 • pause/stop/finalize
                  </Text>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PerpsDashboard;