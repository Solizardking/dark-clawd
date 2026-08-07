// ═══════════════════════════════════════════════════════════════════════════════
// DARK CLAWD TUI - Perpetual Futures Order Entry Component
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { PerpMarket } from './PerpsMarketInfo.js';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type OrderSide = 'LONG' | 'SHORT';
export type OrderType = 'MARKET' | 'LIMIT';
export type MarginMode = 'CROSS' | 'ISOLATED';
export type TpSlMode = 'NONE' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'BOTH';

export interface PerpsOrderParams {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  size: number;
  price?: number;
  leverage: number;
  marginMode: MarginMode;
  takeProfit?: number;
  stopLoss?: number;
}

interface PerpsOrderEntryProps {
  market: PerpMarket;
  balance?: { usdc: number };
  onPlaceOrder?: (order: PerpsOrderParams) => void;
  width?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER ENTRY COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export const PerpsOrderEntry: React.FC<PerpsOrderEntryProps> = ({
  market,
  balance = { usdc: 10000 },
  onPlaceOrder,
  width = 50,
}) => {
  const [side, setSide] = useState<OrderSide>('LONG');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [marginMode, setMarginMode] = useState<MarginMode>('CROSS');
  const [leverage, setLeverage] = useState(1);
  const [size, setSize] = useState<number>(0.1);
  const [price, setPrice] = useState<number>(market.markPrice || 0);
  const [tpMode, setTpMode] = useState<TpSlMode>('NONE');
  const [takeProfit, setTakeProfit] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [focused, setFocused] = useState<'side' | 'type' | 'lev' | 'size' | 'price' | 'tp' | 'sl'>('size');

  // Calculate margin and liquidation
  const notional = size * (orderType === 'LIMIT' ? price : (market.markPrice || 0));
  const requiredMargin = marginMode === 'CROSS'
    ? notional / leverage
    : notional / leverage * 1.2; // Isolated requires 20% more
  const liquidationPrice = side === 'LONG'
    ? (market.markPrice || 0) * (1 - 1 / leverage)
    : (market.markPrice || 0) * (1 + 1 / leverage);
  const maxSize = (balance.usdc * leverage) / (market.markPrice || 1);

  // Keyboard navigation for the form
  useInput((input, key) => {
    if (input === 'b') setSide('LONG');
    if (input === 's') setSide('SHORT');
    if (input === 'm') setOrderType(ot => ot === 'MARKET' ? 'LIMIT' : 'MARKET');
    if (input === 'x') setMarginMode(mm => mm === 'CROSS' ? 'ISOLATED' : 'CROSS');
    if (input === '+' || input === '=') setLeverage(l => Math.min(l + 1, market.maxLeverage));
    if (input === '-') setLeverage(l => Math.max(l - 1, 1));
    if (input === ']') setSize(s => Math.min(s * 2, maxSize));
    if (input === '[') setSize(s => Math.max(s / 2, 0.01));
    if (key.upArrow) {
      const fields = ['size', 'price', 'lev', 'tp', 'sl'] as const;
      const idx = fields.indexOf(focused as typeof fields[number]);
      if (idx >= 0) setFocused(fields[Math.max(0, idx - 1)]);
    }
    if (key.downArrow) {
      const fields = ['size', 'price', 'lev', 'tp', 'sl'] as const;
      const idx = fields.indexOf(focused as typeof fields[number]);
      if (idx >= 0) setFocused(fields[Math.min(fields.length - 1, idx + 1)]);
    }
    if (input === 't') setTpMode(t => t === 'NONE' ? 'TAKE_PROFIT' : t === 'TAKE_PROFIT' ? 'STOP_LOSS' : t === 'STOP_LOSS' ? 'BOTH' : 'NONE');
  });

  const handleSubmit = () => {
    if (!onPlaceOrder) return;
    onPlaceOrder({
      symbol: market.symbol,
      side,
      type: orderType,
      size,
      price: orderType === 'LIMIT' ? price : undefined,
      leverage,
      marginMode,
      takeProfit: tpMode === 'TAKE_PROFIT' || tpMode === 'BOTH' ? takeProfit : undefined,
      stopLoss: tpMode === 'STOP_LOSS' || tpMode === 'BOTH' ? stopLoss : undefined,
    });
  };

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="green" width={width}>
      {/* Header */}
      <Box paddingX={1} borderBottom justifyContent="space-between">
        <Text color="greenBright" bold>
          ORDER ENTRY
        </Text>
        <Text color="cyan" bold>
          {market.symbol} PERP
        </Text>
      </Box>

      <Box flexDirection="column" paddingX={1} paddingY={1}>
        {/* Side Selection */}
        <Box marginBottom={1}>
          <Text color="gray">Side: </Text>
          <Text
            color={side === 'LONG' ? 'green' : 'gray'}
            bold={side === 'LONG'}
            underline={side === 'LONG'}
          >
            [B] LONG
          </Text>
          <Text color="gray"> │ </Text>
          <Text
            color={side === 'SHORT' ? 'red' : 'gray'}
            bold={side === 'SHORT'}
            underline={side === 'SHORT'}
          >
            [S] SHORT
          </Text>
        </Box>

        {/* Order Type & Margin Mode */}
        <Box marginBottom={1}>
          <Text color="gray">Type: </Text>
          <Text color={orderType === 'MARKET' ? 'white' : 'gray'} bold={orderType === 'MARKET'}>
            [M]ARKET
          </Text>
          <Text color="gray"> │ </Text>
          <Text color={orderType === 'LIMIT' ? 'white' : 'gray'} bold={orderType === 'LIMIT'}>
            [L]IMIT
          </Text>
          <Text color="gray"> │ </Text>
          <Text color="gray">Margin: </Text>
          <Text color={marginMode === 'CROSS' ? 'cyan' : 'yellow'} bold>
            [X]{marginMode}
          </Text>
        </Box>

        {/* Leverage */}
        <Box marginBottom={1}>
          <Text color="gray">Leverage: </Text>
          <Box borderStyle="round" borderColor="magenta" paddingX={1}>
            <Text color="magenta" bold>
              {leverage}x
            </Text>
          </Box>
          <Text color="gray" dimColor>
            {' '}[+]/[-]
          </Text>
        </Box>

        {/* Size Input */}
        <Box marginBottom={1}>
          <Text color="gray">Size: </Text>
          <Box borderStyle="round" borderColor={focused === 'size' ? 'cyan' : 'gray'} paddingX={1}>
            <Text color="white">{size.toFixed(2)}</Text>
          </Box>
          <Text color="gray"> {market.symbol}</Text>
          <Text color="gray" dimColor>
            {' '}[[]/[]]
          </Text>
        </Box>

        {/* Limit Price */}
        {orderType === 'LIMIT' && (
          <Box marginBottom={1}>
            <Text color="gray">Price: </Text>
            <Box borderStyle="round" borderColor={focused === 'price' ? 'cyan' : 'gray'} paddingX={1}>
              <Text color="white">${price.toFixed(2)}</Text>
            </Box>
            <Text color="gray"> USDC</Text>
          </Box>
        )}

        {/* TP/SL Mode */}
        <Box marginBottom={1}>
          <Text color="gray">TP/SL: </Text>
          <Text color={tpMode === 'NONE' ? 'gray' : 'white'} bold={tpMode !== 'NONE'}>
            [T]{tpMode === 'NONE' ? ' SET' : tpMode}
          </Text>
        </Box>

        {tpMode === 'TAKE_PROFIT' || tpMode === 'BOTH' ? (
          <Box marginBottom={1}>
            <Text color="gray">Take Profit: </Text>
            <Box borderStyle="round" borderColor={focused === 'tp' ? 'cyan' : 'gray'} paddingX={1}>
              <Text color="green">${takeProfit > 0 ? takeProfit.toFixed(2) : '---'}</Text>
            </Box>
          </Box>
        ) : null}

        {tpMode === 'STOP_LOSS' || tpMode === 'BOTH' ? (
          <Box marginBottom={1}>
            <Text color="gray">Stop Loss: </Text>
            <Box borderStyle="round" borderColor={focused === 'sl' ? 'cyan' : 'gray'} paddingX={1}>
              <Text color="red">${stopLoss > 0 ? stopLoss.toFixed(2) : '---'}</Text>
            </Box>
          </Box>
        ) : null}

        {/* Calculations */}
        <Box marginTop={1}>
          <Text color="gray">{'─'.repeat(width - 4)}</Text>
        </Box>

        <Box justifyContent="space-between">
          <Text color="gray">Notional:</Text>
          <Text color="white">${notional.toFixed(2)}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">Required Margin:</Text>
          <Text color="cyan">${requiredMargin.toFixed(2)}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">Liq. Price:</Text>
          <Text color="red">${liquidationPrice.toFixed(4)}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">Max Size:</Text>
          <Text color="yellow">{maxSize.toFixed(2)}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">Wallet Balance:</Text>
          <Text color="green">${balance.usdc.toFixed(2)} USDC</Text>
        </Box>

        {/* Submit Button */}
        <Box marginTop={1} justifyContent="center">
          <Box
            borderStyle="round"
            borderColor={side === 'LONG' ? 'green' : 'red'}
            paddingX={2}
            paddingY={0}
          >
            <Text
              color={side === 'LONG' ? 'green' : 'red'}
              bold
              underline
            >
              ENTER {side.toUpperCase()} (Enter)
            </Text>
          </Box>
        </Box>

        {/* Controls Help */}
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            ↑↓ navigate • Enter submit • Esc cancel
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MARGIN CALCULATOR (standalone widget)
// ─────────────────────────────────────────────────────────────────────────────

export const MarginCalculator: React.FC<{
  notional: number;
  leverage: number;
  markPrice: number;
  side: OrderSide;
  width?: number;
}> = ({ notional, leverage, markPrice, side, width = 30 }) => {
  const margin = notional / leverage;
  const liqPrice = side === 'LONG'
    ? markPrice * (1 - 1 / leverage)
    : markPrice * (1 + 1 / leverage);
  const pnl1pc = notional * 0.01 * (side === 'LONG' ? 1 : -1);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="yellow" width={width}>
      <Box paddingX={1} borderBottom>
        <Text color="yellowBright" bold>
          MARGIN CALC
        </Text>
      </Box>
      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Box justifyContent="space-between">
          <Text color="gray">Leverage:</Text>
          <Text color="magenta" bold>{leverage}x</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">Margin:</Text>
          <Text color="cyan">${margin.toFixed(2)}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">Liq. Price:</Text>
          <Text color="red">${liqPrice.toFixed(4)}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">1% Move:</Text>
          <Text color={pnl1pc >= 0 ? 'green' : 'red'}>${pnl1pc.toFixed(2)}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">Liq. From Mark:</Text>
          <Text color="red">{((1 - liqPrice / markPrice) * 100 * (side === 'LONG' ? 1 : -1)).toFixed(2)}%</Text>
        </Box>
      </Box>
    </Box>
  );
};

export default PerpsOrderEntry;