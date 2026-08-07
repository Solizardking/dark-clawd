// ═══════════════════════════════════════════════════════════════════════════════
// DARK CLAWD TUI - Perpetual Futures Position & Order Management
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Box, Text } from 'ink';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface PerpsPosition {
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  leverage: number;
  marginMode: 'CROSS' | 'ISOLATED';
  notional: number;
  marginUsed: number;
  fundingPaid: number;
}

export interface PerpsOpenOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'STOP' | 'TAKE_PROFIT' | 'STOP_LOSS';
  price: number;
  size: number;
  filled: number;
  status: 'OPEN' | 'PARTIAL' | 'CANCELLED';
  createdAt: number;
}

interface PerpsPositionTableProps {
  positions: PerpsPosition[];
  onClose?: (symbol: string) => void;
  onCloseAll?: () => void;
  width?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// POSITION TABLE
// ─────────────────────────────────────────────────────────────────────────────

export const PerpsPositionTable: React.FC<PerpsPositionTableProps> = ({
  positions,
  onClose,
  onCloseAll,
  width = 80,
}) => {
  const totalPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  const totalMargin = positions.reduce((sum, p) => sum + p.marginUsed, 0);
  const totalNotional = positions.reduce((sum, p) => sum + p.notional, 0);

  if (positions.length === 0) {
    return (
      <Box flexDirection="column" borderStyle="single" borderColor="gray" width={width}>
        <Box paddingX={1} borderBottom>
          <Text color="greenBright" bold>
            OPEN POSITIONS
          </Text>
        </Box>
        <Box paddingX={1} paddingY={1}>
          <Text color="gray" dimColor>
            No open positions. Use the order entry to open a position.
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="green" width={width}>
      {/* Header */}
      <Box paddingX={1} borderBottom justifyContent="space-between">
        <Text color="greenBright" bold>
          OPEN POSITIONS ({positions.length})
        </Text>
        {onCloseAll && (
          <Text color="red" dimColor>
            [C] Close All
          </Text>
        )}
      </Box>

      <Box flexDirection="column" paddingX={1} paddingY={1}>
        {/* Column Headers */}
        <Box>
          <Text color="gray">{'SYMBOL'.padEnd(8)}</Text>
          <Text color="gray">{'SIDE'.padEnd(6)}</Text>
          <Text color="gray">{'SIZE'.padStart(8)}</Text>
          <Text color="gray">{'ENTRY'.padStart(10)}</Text>
          <Text color="gray">{'MARK'.padStart(10)}</Text>
          <Text color="gray">{'LIQ'.padStart(10)}</Text>
          <Text color="gray">{'PNL'.padStart(12)}</Text>
          <Text color="gray">{'LEV'.padStart(5)}</Text>
          <Text color="gray">{'MARGIN'.padStart(8)}</Text>
        </Box>

        <Box>
          <Text color="gray">{'─'.repeat(width - 4)}</Text>
        </Box>

        {/* Position Rows */}
        {positions.map((pos, i) => (
          <Box key={`${pos.symbol}-${i}`}>
            <Text color="cyan" bold>{pos.symbol.padEnd(8)}</Text>
            <Text color={pos.side === 'LONG' ? 'green' : 'red'} bold>{pos.side.padEnd(6)}</Text>
            <Text color="white">{pos.size.toFixed(4).padStart(8)}</Text>
            <Text color="gray">${pos.entryPrice.toFixed(4).padStart(8)}</Text>
            <Text color="white">${pos.markPrice.toFixed(4).padStart(8)}</Text>
            <Text color="red">${pos.liquidationPrice.toFixed(2).padStart(8)}</Text>
            <Text color={pos.unrealizedPnl >= 0 ? 'green' : 'red'} bold>
              {(pos.unrealizedPnl >= 0 ? '+' : '') + '$' + pos.unrealizedPnl.toFixed(2) + ' (' + (pos.unrealizedPnl >= 0 ? '+' : '') + pos.unrealizedPnlPercent.toFixed(2) + '%)'}
            </Text>
            <Text color="magenta" bold>{`${pos.leverage}x`.padStart(5)}</Text>
            <Text color="cyan">${pos.marginUsed.toFixed(2).padStart(7)}</Text>
          </Box>
        ))}

        {/* Summary */}
        <Box marginTop={1}>
          <Text color="gray">{'─'.repeat(width - 4)}</Text>
        </Box>

        <Box justifyContent="space-between">
          <Text color="gray">Total Positions:</Text>
          <Text color="white" bold>{positions.length}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">Total Notional:</Text>
          <Text color="white">${totalNotional.toFixed(2)}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">Total Margin:</Text>
          <Text color="cyan">${totalMargin.toFixed(2)}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color="gray">Unrealized PnL:</Text>
          <Text color={totalPnl >= 0 ? 'green' : 'red'} bold>
            {(totalPnl >= 0 ? '+' : '') + '$' + totalPnl.toFixed(2)}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OPEN ORDERS TABLE
// ─────────────────────────────────────────────────────────────────────────────

export const PerpsOpenOrders: React.FC<{
  orders: PerpsOpenOrder[];
  onCancel?: (id: string) => void;
  onCancelAll?: () => void;
  width?: number;
}> = ({ orders, onCancel, onCancelAll, width = 80 }) => {
  if (orders.length === 0) {
    return null;
  }

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="yellow" width={width}>
      <Box paddingX={1} borderBottom justifyContent="space-between">
        <Text color="yellowBright" bold>
          OPEN ORDERS ({orders.length})
        </Text>
        {onCancelAll && (
          <Text color="red" dimColor>
            [X] Cancel All
          </Text>
        )}
      </Box>

      <Box flexDirection="column" paddingX={1} paddingY={1}>
        {/* Header */}
        <Box>
          <Text color="gray">{'SYMBOL'.padEnd(8)}</Text>
          <Text color="gray">{'SIDE'.padEnd(6)}</Text>
          <Text color="gray">{'TYPE'.padEnd(12)}</Text>
          <Text color="gray">{'PRICE'.padStart(10)}</Text>
          <Text color="gray">{'SIZE'.padStart(8)}</Text>
          <Text color="gray">{'FILLED'.padStart(8)}</Text>
          <Text color="gray">{'STATUS'.padStart(10)}</Text>
        </Box>

        <Box>
          <Text color="gray">{'─'.repeat(width - 4)}</Text>
        </Box>

        {orders.map((order) => (
          <Box key={order.id}>
            <Text color="cyan">{order.symbol.padEnd(8)}</Text>
            <Text color={order.side === 'BUY' ? 'green' : 'red'}>{order.side.padEnd(6)}</Text>
            <Text color="gray">{order.type.padEnd(12)}</Text>
            <Text color="white">{`$${order.price.toFixed(4)}`.padStart(10)}</Text>
            <Text color="white">{order.size.toFixed(4).padStart(8)}</Text>
            <Text color="gray">{`${((order.filled / order.size) * 100).toFixed(0)}%`.padStart(8)}</Text>
            <Text color={order.status === 'OPEN' ? 'green' : 'yellow'}>{order.status.padStart(10)}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PerpsPositionTable;