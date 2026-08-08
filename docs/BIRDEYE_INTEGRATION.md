# Birdeye API & WebSocket Integration Guide

## Overview

Real-time Solana token data from Birdeye’s API and WebSocket services for the **Dark Clawd** TUI (forged from Ralph on Solana).

After the **TUI upgrade**, prefer the published product tree **`tui/`** for shipping and docs. Root **`src/`** remains a monorepo dev mirror — keep service modules aligned when changing the client.

The same service modules ship in both trees:

| Tree | Paths |
| --- | --- |
| **Package (canonical)** | `tui/src/services/birdeye-api.ts`, `birdeye-websocket.ts`, `market-data-provider.ts`, `birdeye.ts`, `index.ts` |
| Root (dev) | `src/services/` (same filenames) |

Components that accept optional `apiKey` / live refresh live under `tui/src/components/` and `src/components/`.

See [MONOREPO.md](./MONOREPO.md) for the full workspace map.

## Services

### `birdeye-api.ts` — Birdeye API v3 client

- Token metadata, market data, trade data  
- Price stats, OHLCV, price history  
- Token lists (trending, gainers, losers, new listings)  
- Transactions, wallet portfolio  
- Pair/pool data  

Exports (via `services/index.ts`): `BirdeyeAPIClient`, `getBirdeyeClient`, OHLCV/token/wallet types.

### `birdeye-websocket.ts` — streaming client

- Price / trade / OHLCV subscriptions  
- New token listings  
- Auto-reconnect and heartbeat  

Exports: `BirdeyeWebSocket`, `getBirdeyeWebSocket`, update message types.

### `market-data-provider.ts` — React hooks

- `useMarketDataProvider()` / `useMarketData()`  
- `useTokenPrice()`  
- `useTrendingTokens()`  
- `useRecentTrades()`  
- `useOHLCV()`  

Also exports `POPULAR_TOKENS`, `DEFAULT_TICKER_ADDRESSES`, and ticker state types.

### `birdeye.ts` — legacy helper

Compatibility wrapper still exported as `BirdeyeService` for older call sites.

### `services/index.ts`

Barrel re-exports Birdeye API/WS/hooks, Helius, Phoenix perps, AI providers, and news search (package also re-exports trade automation / sandbox where present).

## Components (live data props)

All of these support optional `apiKey` and auto-refresh style live data where wired:

| Component | Notes |
| --- | --- |
| `PriceChart.tsx` | `address` + `apiKey` for OHLCV |
| `TickerRow` (in PriceChart) | Auto-fetches prices with `apiKey` |
| `Heatmap.tsx` | Real market data heatmap |
| `ActivityFeed.tsx` | `TopMovers` gainers/losers |

Present in both `tui/src/components/` and `src/components/`.

## Usage

### Components

```tsx
import { PriceChart, TickerRow } from './components/PriceChart';
import { MarketHeatmap } from './components/Heatmap';
import { TopMovers } from './components/ActivityFeed';

// Requires BIRDEYE_API_KEY in .env (see tui/.env.example)
<PriceChart
  symbol="SOL/USDC"
  address="So11111111111111111111111111111111111111112"
  apiKey={process.env.BIRDEYE_API_KEY}
  timeframe="1H"
/>

<TickerRow apiKey={process.env.BIRDEYE_API_KEY} />
<MarketHeatmap apiKey={process.env.BIRDEYE_API_KEY} />
<TopMovers apiKey={process.env.BIRDEYE_API_KEY} limit={5} />
```

### API client

```tsx
import { getBirdeyeClient, POPULAR_TOKENS } from './services';

const api = getBirdeyeClient(process.env.BIRDEYE_API_KEY);

const overview = await api.getTokenOverview(POPULAR_TOKENS.SOL);
const candles = await api.getOHLCV(POPULAR_TOKENS.SOL, { type: '1H' });
const trending = await api.getTrendingTokens(20);
const gainers = await api.getTopGainers(10);
const losers = await api.getTopLosers(10);
const portfolio = await api.getWalletPortfolio('YourWalletAddress...');
```

### WebSocket

```tsx
import { getBirdeyeWebSocket, POPULAR_TOKENS } from './services';

const ws = getBirdeyeWebSocket({
  apiKey: process.env.BIRDEYE_API_KEY,
});

ws.on('connected', () => console.log('Connected!'));
ws.on('price', (update) => console.log('Price:', update));
ws.on('trade', (trade) => console.log('Trade:', trade));

await ws.connect();
ws.subscribeToPrices([POPULAR_TOKENS.SOL, POPULAR_TOKENS.BONK]);
ws.subscribeToTrades([POPULAR_TOKENS.WIF]);
ws.subscribeToOHLCV(POPULAR_TOKENS.JUP, '1m');
ws.subscribeToNewListings();
ws.disconnect();
```

### Hooks

```tsx
import { useTokenPrice, useTrendingTokens, useOHLCV, POPULAR_TOKENS } from './services';

function MyComponent() {
  const { price, loading } = useTokenPrice(POPULAR_TOKENS.SOL);
  const { tokens } = useTrendingTokens(10);
  const { candles } = useOHLCV(POPULAR_TOKENS.SOL, '1H');
  // ...
}
```

## Environment variables

Copy the package template (committed; no secrets):

```bash
cd tui
cp .env.example .env
```

Birdeye-related keys used by the TUI:

```env
# From tui/.env.example
BIRDEYE_API_KEY=

# Optional WebSocket URL override (used by birdeye-websocket when set)
BIRDEYE_WSS_URL=wss://public-api.birdeye.so/socket/solana?x-api-key=YOUR_KEY
```

Related market / chain keys in the same template:

```env
HELIUS_API_KEY=
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=
```

Config loaders (`tui/src/config/schema.ts`, `src/config/schema.ts`) map `process.env.BIRDEYE_API_KEY` into `apiKeys.BIRDEYE_API_KEY`.

**Security:** root `.gitignore` ignores `.env` / `.env.*` and keeps `!.env.example`. Never commit `tui/.env`.

## Popular token addresses

`POPULAR_TOKENS` in `market-data-provider.ts`:

```typescript
POPULAR_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  PYTH: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  JTO: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  MNGO: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
  SAMO: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
}
```

## API surface covered

### Token data
- Metadata, market data, overview, trade data, price stats (single/multiple)

### Pair / pool
- Pair overview (single/multiple)

### Token lists
- Filtered/sorted list, trending, top gainers/losers, new listings

### Transactions
- Token, recent, pair, trader

### Price history
- OHLCV (multiple timeframes), price history

### Wallet
- Token portfolio

## Fallback behavior

- No API key → mock data in UI  
- Failed API calls → mock data  
- Goal: Bloomberg panels always render offline  

## Related package commands

From **`tui/`** (preferred product surface after TUI upgrade):

```bash
bun run run          # TUI (Birdeye panels use key when present)
bun run status       # shows Birdeye among provider status
bun run build        # emits tui/dist/cli.js (+ yoga.wasm)
bun test src         # includes product / catalog / package communication tests
```

Installed binary:

```bash
dark-clawd run
dark-clawd status
```

See also: [MONOREPO.md](./MONOREPO.md), [OpenClawd adaptation](./OPENCLAWD_ADAPTATION.md), [`tui/README.md`](../tui/README.md).
