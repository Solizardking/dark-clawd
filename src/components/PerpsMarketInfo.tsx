// ═══════════════════════════════════════════════════════════════════════════════
// DARK CLAWD TUI - Perpetual Futures Market Info Component
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Box, Text } from 'ink';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface PerpMarket {
  symbol: string;
  name?: string;
  status: string;
  markPrice: number | null;
  spotPrice: number | null;
  openInterest: number | null;
  maxLeverage: number;
  fundingRate?: number;
  volume24h?: number;
  makerFeeBps: number;
  takerFeeBps: number;
  tickSize: number;
  marketPubkey: string;
}

interface PerpsMarketInfoProps {
  market: PerpMarket;
  width?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKET INFO PANEL
// ─────────────────────────────────────────────────────────────────────────────

export const PerpsMarketInfo: React.FC<PerpsMarketInfoProps> = ({
  market,
  width = 50,
}) => {
  const mark = market.markPrice === null ? 'n/a' : `$${market.markPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const spot = market.spotPrice === null ? 'n/a' : `$${market.spotPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const oi = market.openInterest === null ? 'n/a' : `$${market.openInterest.toLocaleString('en-US')}`;
  const fr = market.fundingRate === undefined ? 'n/a' : `${(market.fundingRate * 100).toFixed(4)}%`;
  const vol = market.volume24h === undefined ? 'n/a' : `$${market.volume24h.toLocaleString('en-US')}`;

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="green" width={width}>
      {/* Header */}
      <Box paddingX={1} borderBottom>
        <Text color="greenBright" bold>
          {market.symbol}
        </Text>
        <Text color="gray"> PERP</Text>
        <Text color={market.status === 'active' ? 'green' : 'yellow'} dimColor>
          {' '}● {market.status.toUpperCase()}
        </Text>
      </Box>

      <Box flexDirection="column" paddingX={1} paddingY={1}>
        {/* Key Prices */}
        <Box justifyContent="space-between">
          <Text color="gray">Mark:</Text>
          <Text color="cyan" bold>{mark}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">Spot:</Text>
          <Text color="white">{spot}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">Open Interest:</Text>
          <Text color="yellow">{oi}</Text>
        </Box>

        <Box marginTop={1}>
          <Text color="gray">{'─'.repeat(width - 4)}</Text>
        </Box>

        {/* Fees & Leverage */}
        <Box justifyContent="space-between">
          <Text color="gray">Max Leverage:</Text>
          <Text color="magenta" bold>{market.maxLeverage}x</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">Funding Rate:</Text>
          <Text color={market.fundingRate && market.fundingRate > 0 ? 'red' : 'green'}>{fr}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">24h Volume:</Text>
          <Text color="white">{vol}</Text>
        </Box>

        <Box marginTop={1}>
          <Text color="gray">{'─'.repeat(width - 4)}</Text>
        </Box>

        {/* Fee Details */}
        <Box justifyContent="space-between">
          <Text color="gray">Maker Fee:</Text>
          <Text color="green">{market.makerFeeBps.toFixed(2)} bps</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">Taker Fee:</Text>
          <Text color="red">{market.takerFeeBps.toFixed(2)} bps</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">Tick Size:</Text>
          <Text color="gray">{market.tickSize}</Text>
        </Box>

        <Box marginTop={1}>
          <Text color="gray">{'─'.repeat(width - 4)}</Text>
        </Box>

        {/* Liquidation Price Indicator */}
        <Box>
          <Text color="gray">Pubkey: </Text>
          <Text color="gray" dimColor>
            {market.marketPubkey.slice(0, 8)}...{market.marketPubkey.slice(-4)}
          </Text>
        </Box>
      </Box>

      {/* Footer */}
      <Box paddingX={1} borderTop>
        <Text color="gray" dimColor>
          /perp {market.symbol.toLowerCase()} • /perps to list all
        </Text>
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PERPS MARKET SELECTOR (Compact horizontal list)
// ─────────────────────────────────────────────────────────────────────────────

export const PerpsMarketSelector: React.FC<{
  markets: PerpMarket[];
  selected: string;
  onSelect: (symbol: string) => void;
  width?: number;
}> = ({ markets, selected, onSelect, width = 80 }) => {
  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray">
      <Box paddingX={1} borderBottom>
        <Text color="greenBright" bold>
          PERP MARKETS
        </Text>
        <Text color="gray" dimColor>
          {' '}— Select a market to trade
        </Text>
      </Box>

      <Box flexDirection="column" paddingX={1} paddingY={1}>
        {/* Header row */}
        <Box>
          <Text color="gray">{'SYMBOL'.padEnd(8)}</Text>
          <Text color="gray">{'STATUS'.padEnd(8)}</Text>
          <Text color="gray">{'MARK'.padStart(12)}</Text>
          <Text color="gray">{'OI'.padStart(14)}</Text>
          <Text color="gray">{'LEV'.padStart(6)}</Text>
          <Text color="gray">{'FUNDING'.padStart(10)}</Text>
        </Box>

        <Box>
          <Text color="gray">{'─'.repeat(width - 4)}</Text>
        </Box>

        {markets.slice(0, 10).map((m) => {
          const isSelected = m.symbol === selected;
          const markStr = m.markPrice === null ? 'n/a'.padStart(12) : `$${m.markPrice.toFixed(2)}`.padStart(12);
          const oiStr = m.openInterest === null ? 'n/a'.padStart(14) : `$${(m.openInterest / 1e6).toFixed(1)}M`.padStart(14);

          return (
            <Box key={m.symbol}>
              <Text color={isSelected ? 'greenBright' : 'cyan'} bold={isSelected}>
                {isSelected ? '▸ '.padEnd(0) : '  '}{m.symbol.padEnd(6)}
              </Text>
              <Text color={m.status === 'active' ? 'green' : 'yellow'} dimColor={!isSelected}>
                {m.status.padEnd(8)}
              </Text>
              <Text color={isSelected ? 'white' : 'gray'}>{markStr}</Text>
              <Text color={isSelected ? 'yellow' : 'gray'}>{oiStr}</Text>
              <Text color={isSelected ? 'magenta' : 'gray'}>{`${m.maxLeverage}x`.padStart(6)}</Text>
              <Text color={m.fundingRate && m.fundingRate > 0 ? 'red' : 'green'} dimColor={!isSelected}>
                {m.fundingRate === undefined ? 'n/a'.padStart(10) : `${(m.fundingRate * 100).toFixed(4)}%`.padStart(10)}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default PerpsMarketInfo;