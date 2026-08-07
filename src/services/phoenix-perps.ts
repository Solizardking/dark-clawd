// Phoenix perpetual futures market reads through the Rise SDK.

import {
  createPhoenixClient,
  type ExchangeMarketSnapshot,
  type ExchangeSnapshotView,
  type PhoenixClient,
} from '@ellipsis-labs/rise';

export const DEFAULT_PHOENIX_API_URL = 'https://perp-api.phoenix.trade';
export const DEFAULT_PHOENIX_RPC_URL = 'https://api.mainnet-beta.solana.com';

export interface PhoenixPerpsConfig {
  apiUrl?: string;
  rpcUrl?: string;
  ws?: boolean;
}

export interface PhoenixPerpMarket {
  symbol: string;
  name?: string;
  assetId: number;
  status: string;
  marketPubkey: string;
  splinePubkey: string;
  baseLotsDecimals: number;
  tickSize: number;
  makerFeeBps: number;
  takerFeeBps: number;
  isolatedOnly: boolean;
  maxLeverage: number;
  openInterestCapBase: string;
  logoUri?: string;
}

export interface PhoenixPerpMarketSummary extends PhoenixPerpMarket {
  markPrice: number | null;
  spotPrice: number | null;
  openInterest: number | null;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase().replace(/-PERP$/, '');
}

function lotsToBaseUnits(lots: bigint, decimals: number): string {
  if (decimals < 0) {
    return (lots * 10n ** BigInt(Math.abs(decimals))).toLocaleString('en-US');
  }

  const whole = lots / 10n ** BigInt(decimals);
  const remainder = lots % 10n ** BigInt(decimals);
  if (remainder === 0n) return whole.toLocaleString('en-US');

  const fraction = remainder.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole.toLocaleString('en-US')}.${fraction}`;
}

function toMarketView(market: ExchangeMarketSnapshot): PhoenixPerpMarket {
  const maxLeverage = Math.max(...market.leverageTiers.map((tier) => tier.maxLeverage));

  return {
    symbol: market.symbol,
    name: market.metadata?.name ?? undefined,
    assetId: market.assetId,
    status: market.marketStatus,
    marketPubkey: market.marketPubkey,
    splinePubkey: market.splinePubkey,
    baseLotsDecimals: market.baseLotsDecimals,
    tickSize: market.tickSize,
    makerFeeBps: market.makerFee * 10_000,
    takerFeeBps: market.takerFee * 10_000,
    isolatedOnly: market.isolatedOnly,
    maxLeverage,
    openInterestCapBase: lotsToBaseUnits(market.openInterestCapBaseLots, market.baseLotsDecimals),
    logoUri: market.metadata?.logoUri ?? undefined,
  };
}

export class PhoenixPerpsService {
  private readonly apiUrl: string;
  private readonly rpcUrl: string;
  private readonly ws: boolean;
  private client?: PhoenixClient;

  constructor(config: PhoenixPerpsConfig = {}) {
    this.apiUrl = config.apiUrl || DEFAULT_PHOENIX_API_URL;
    this.rpcUrl = config.rpcUrl || DEFAULT_PHOENIX_RPC_URL;
    this.ws = config.ws ?? false;
  }

  private getClient(): PhoenixClient {
    if (!this.client) {
      this.client = createPhoenixClient({
        apiUrl: this.apiUrl,
        rpcUrl: this.rpcUrl,
        ws: this.ws ? { connectMode: 'lazy' } : false,
        exchangeMetadata: { stream: this.ws },
      });
    }

    return this.client;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.getClient().exchange.ready();
      return true;
    } catch {
      return false;
    }
  }

  async getSnapshot(): Promise<Readonly<ExchangeSnapshotView>> {
    return this.getClient().exchange.ready();
  }

  async listMarkets(): Promise<PhoenixPerpMarket[]> {
    const snapshot = await this.getSnapshot();
    return [...snapshot.markets]
      .map(toMarketView)
      .sort((a, b) => {
        if (a.status === b.status) return a.symbol.localeCompare(b.symbol);
        return a.status === 'active' ? -1 : 1;
      });
  }

  async getMarket(symbol: string): Promise<PhoenixPerpMarketSummary | null> {
    const normalized = normalizeSymbol(symbol);
    const client = this.getClient();
    await client.exchange.ready();

    const market = client.exchange.market(normalized);
    if (!market) return null;

    let markPrice: number | null = null;
    let spotPrice: number | null = null;
    let openInterest: number | null = null;

    try {
      const history = await client.api.markets().getMarketStatsHistory(normalized, { limit: 1 });
      const latest = history.stats[0];
      markPrice = latest?.mark_price ?? null;
      spotPrice = latest?.spot_price ?? null;
      openInterest = latest?.open_interest ?? null;
    } catch {
      // Market metadata is still useful when the optional stats endpoint is unavailable.
    }

    return {
      ...toMarketView(market),
      markPrice,
      spotPrice,
      openInterest,
    };
  }

  formatMarketTable(markets: PhoenixPerpMarket[], limit = 8): string {
    let output = '[PHOENIX PERPS]\n';
    output += '┌───────┬────────┬──────┬────────────┬──────────┐\n';
    output += '│ Symbol│ Status │ Lev  │ Taker Fee  │ OI Cap   │\n';
    output += '├───────┼────────┼──────┼────────────┼──────────┤\n';

    markets.slice(0, limit).forEach((market) => {
      output += `│ ${market.symbol.padEnd(5)} │ ${market.status.padEnd(6)} │ ${`${market.maxLeverage}x`.padEnd(4)} │ ${`${market.takerFeeBps.toFixed(2)} bps`.padEnd(10)} │ ${market.openInterestCapBase.padEnd(8)} │\n`;
    });

    output += '└───────┴────────┴──────┴────────────┴──────────┘';
    return output;
  }

  formatMarketSummary(market: PhoenixPerpMarketSummary): string {
    const mark = market.markPrice === null ? 'n/a' : `$${market.markPrice.toLocaleString('en-US')}`;
    const spot = market.spotPrice === null ? 'n/a' : `$${market.spotPrice.toLocaleString('en-US')}`;
    const oi = market.openInterest === null ? 'n/a' : market.openInterest.toLocaleString('en-US');

    return `[PHOENIX ${market.symbol}]
Status: ${market.status} | Max Lev: ${market.maxLeverage}x | Isolated: ${market.isolatedOnly ? 'yes' : 'no'}
Mark: ${mark} | Spot: ${spot} | Open Interest: ${oi}
Fees: maker ${market.makerFeeBps.toFixed(2)} bps / taker ${market.takerFeeBps.toFixed(2)} bps
Market: ${market.marketPubkey}`;
  }

  close(): void {
    this.client?.dispose();
    this.client = undefined;
  }
}

export default PhoenixPerpsService;
