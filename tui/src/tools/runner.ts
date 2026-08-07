/**
 * Dark Clawd tool runner — dispatches the full SOL GPT catalog (171 tools).
 * Non-custodial: prepare_* returns unsigned plans only; never signs with a server key.
 */

import {
  getToolDef,
  searchTools,
  SOL_GPT_TOOL_DEFS,
  type SolGptToolDef,
} from './catalog.js';
import {
  birdeyeKey,
  env,
  heliusRpcUrl,
  httpJson,
  imperialBase,
  phoenixApiBase,
  solanaTrackerKey,
  solanaTrackerRpcKey,
  solanaTrackerRpcUrl,
  type Json,
} from './http.js';

export interface ToolRunInput {
  tool: string;
  args?: Record<string, unknown>;
  wallet?: string;
}

export interface ToolRunResult {
  ok: boolean;
  tool: string;
  group?: string;
  custody?: string;
  core?: boolean;
  description?: string;
  result?: Json;
  error?: string;
  requires?: string[];
  note?: string;
}

function str(args: Record<string, unknown> | undefined, key: string, fallback = ''): string {
  const v = args?.[key];
  if (v == null) return fallback;
  return String(v);
}

function num(args: Record<string, unknown> | undefined, key: string, fallback?: number): number | undefined {
  const v = args?.[key];
  if (v == null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function need(keys: string[], args: Record<string, unknown> | undefined): string | null {
  for (const k of keys) {
    if (args?.[k] == null || args?.[k] === '') return `Missing required arg: ${k}`;
  }
  return null;
}

function missingEnv(keys: string[]): ToolRunResult['requires'] {
  return keys.filter((k) => !env(k));
}

function preparePlan(
  tool: string,
  kind: string,
  args: Record<string, unknown> | undefined,
  wallet?: string,
): ToolRunResult {
  const w = wallet || str(args, 'wallet') || str(args, 'walletAddress') || env('SOLANA_WALLET');
  return {
    ok: true,
    tool,
    custody: 'user-signed',
    result: {
      kind,
      status: 'unsigned_plan',
      custody: 'user-signed',
      wallet: w || null,
      args: args || {},
      message:
        'Non-custodial prepare: Dark Clawd never signs. Use your browser/CLI wallet to sign the returned plan when execution is wired for this host.',
      next: [
        'Review plan fields',
        'Sign with your wallet (never paste private keys into chat/CLI)',
        'Relay via your preferred execute endpoint if available',
      ],
    },
    note: 'Server does not hold or use private keys.',
  };
}

async function phoenixGet(path: string): Promise<ToolRunResult['result']> {
  const url = `${phoenixApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await httpJson(url);
  if (!res.ok) throw new Error(res.error || 'Phoenix API error');
  return res.data;
}

async function imperialGet(path: string, query?: Record<string, string | undefined>): Promise<Json> {
  const u = new URL(`${imperialBase()}${path.startsWith('/') ? path : `/${path}`}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== '') u.searchParams.set(k, v);
    }
  }
  const res = await httpJson(u.toString());
  if (!res.ok) throw new Error(res.error || 'Imperial API error');
  return res.data;
}

async function birdeyeGet(path: string, query?: Record<string, string | undefined>): Promise<Json> {
  const key = birdeyeKey();
  if (!key) throw new Error('BIRDEYE_API_KEY not configured');
  const u = new URL(`https://public-api.birdeye.so${path.startsWith('/') ? path : `/${path}`}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== '') u.searchParams.set(k, v);
    }
  }
  const res = await httpJson(u.toString(), {
    headers: { 'X-API-KEY': key, 'x-chain': 'solana' },
  });
  if (!res.ok) throw new Error(res.error || 'Birdeye API error');
  return res.data;
}

async function jupiterPrice(ids: string[]): Promise<Json> {
  const u = new URL('https://api.jup.ag/price/v2');
  u.searchParams.set('ids', ids.join(','));
  const res = await httpJson(u.toString());
  if (!res.ok) throw new Error(res.error || 'Jupiter price error');
  return res.data;
}

async function rpc(method: string, params: unknown[]): Promise<Json> {
  const res = await httpJson(heliusRpcUrl(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(res.error || 'RPC error');
  const body = res.data as { result?: Json; error?: { message?: string } };
  if (body?.error?.message) throw new Error(body.error.message);
  return body?.result ?? body;
}

async function stData(path: string, query?: Record<string, string | undefined>): Promise<Json> {
  const key = solanaTrackerKey();
  if (!key) throw new Error('SOLANA_TRACKER_API_KEY (or SOLANA_TRACKER_DATA_API_KEY) not configured');
  const base = env('SOLANA_TRACKER_API_URL', 'https://data.solanatracker.io').replace(/\/$/, '');
  const u = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== '') u.searchParams.set(k, v);
    }
  }
  const res = await httpJson(u.toString(), {
    headers: { 'x-api-key': key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(res.error || 'Solana Tracker data error');
  return res.data;
}

async function stDas(method: string, params: Record<string, unknown>): Promise<Json> {
  const url = solanaTrackerRpcUrl();
  const key = solanaTrackerRpcKey();
  if (!url) throw new Error('SOLANA_TRACKER_RPC_URL not configured (DAS, 10 credits/call)');
  const res = await httpJson(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(key ? { 'x-api-key': key, Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(res.error || 'Solana Tracker DAS error');
  const body = res.data as { result?: Json; error?: { message?: string } };
  if (body?.error?.message) throw new Error(body.error.message);
  return body?.result ?? body;
}

async function stRpc(method: string, params: unknown[]): Promise<Json> {
  const url = solanaTrackerRpcUrl() || heliusRpcUrl();
  const key = solanaTrackerRpcKey();
  const res = await httpJson(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(key && solanaTrackerRpcUrl() ? { 'x-api-key': key, Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(res.error || 'RPC error');
  const body = res.data as { result?: Json; error?: { message?: string } };
  if (body?.error?.message) throw new Error(body.error.message);
  return body?.result ?? body;
}

function meta(def: SolGptToolDef, extra: Partial<ToolRunResult>): ToolRunResult {
  return {
    ok: extra.ok ?? true,
    tool: def.name,
    group: def.group,
    custody: def.custody,
    core: def.core,
    description: def.description,
    ...extra,
  };
}

async function runImpl(def: SolGptToolDef, args: Record<string, unknown> | undefined, wallet?: string): Promise<ToolRunResult> {
  const name = def.name;
  const w = wallet || str(args, 'wallet') || str(args, 'walletAddress') || env('SOLANA_WALLET');

  // Platform
  if (name === 'search_tools') {
    const q = str(args, 'query') || str(args, 'q') || str(args, 'keyword');
    const hits = searchTools(q || '', num(args, 'limit', 25) || 25);
    return meta(def, {
      ok: true,
      result: { query: q, count: hits.length, tools: hits },
    });
  }
  if (name === 'sponge_status') {
    return meta(def, {
      ok: true,
      result: {
        sponge: 'not_embedded',
        product: 'Dark Clawd',
        hub: 'https://cheshireterminal.ai/dark-clawd',
        note: 'Sponge/PayBox status is available when SPONGE_* / PayBox MCP is configured in the host environment.',
      },
    });
  }

  // Browser (requires Browser Use / external automation)
  if (name.startsWith('browse_') || name.startsWith('browser_')) {
    const req = missingEnv(['BROWSER_USE_API_KEY', 'BROWSERUSE_API_KEY']);
    return meta(def, {
      ok: false,
      error: 'Cloud browser requires Browser Use credentials in the host environment.',
      requires: req.length ? req : ['BROWSER_USE_API_KEY'],
      result: { args: args || {}, task: str(args, 'task') || str(args, 'url') || null },
    });
  }

  // Prediction markets (DFlow)
  if (name.startsWith('get_prediction') || name === 'search_prediction_markets') {
    const base = env('DFLOW_API_URL', 'https://quote-api.dflow.net').replace(/\/$/, '');
    if (name === 'search_prediction_markets') {
      const q = str(args, 'query') || str(args, 'q') || 'solana';
      const res = await httpJson(`${base}/prediction/markets?q=${encodeURIComponent(q)}`);
      return meta(def, {
        ok: res.ok,
        result: res.data,
        error: res.ok ? undefined : res.error,
        note: 'DFlow prediction markets (read-only). Endpoint may vary by DFlow deployment.',
      });
    }
    const ticker = str(args, 'ticker') || str(args, 'market') || str(args, 'symbol');
    if (!ticker) return meta(def, { ok: false, error: 'Missing required arg: ticker' });
    const path =
      name === 'get_prediction_orderbook'
        ? `/prediction/markets/${encodeURIComponent(ticker)}/orderbook`
        : `/prediction/markets/${encodeURIComponent(ticker)}`;
    const res = await httpJson(`${base}${path}`);
    return meta(def, { ok: res.ok, result: res.data, error: res.ok ? undefined : res.error });
  }

  // User-signed prepares
  if (name.startsWith('prepare_')) {
    return meta(def, preparePlan(name, name, args, w));
  }

  // Phoenix
  if (name.startsWith('get_phoenix') || name.startsWith('list_phoenix') || name.startsWith('analyze_phoenix') || name.startsWith('calculate_phoenix')) {
    if (name === 'list_phoenix_markets' || name === 'get_phoenix_exchange_snapshot') {
      const data = await phoenixGet('/markets');
      return meta(def, { ok: true, result: data });
    }
    if (name === 'get_phoenix_exchange_status') {
      const data = await phoenixGet('/status').catch(async () => phoenixGet('/markets'));
      return meta(def, { ok: true, result: data });
    }
    if (name === 'get_phoenix_funding_overview') {
      const data = await phoenixGet('/funding');
      return meta(def, { ok: true, result: data });
    }
    if (name === 'get_phoenix_rpc_context') {
      const slot = await rpc('getSlot', []);
      const blockHeight = await rpc('getBlockHeight', []);
      let sol: Json = null;
      if (w) {
        try {
          sol = await rpc('getBalance', [w]);
        } catch {
          sol = null;
        }
      }
      return meta(def, {
        ok: true,
        result: {
          rpc: heliusRpcUrl().replace(/api-key=[^&]+/i, 'api-key=***'),
          slot,
          blockHeight,
          wallet: w || null,
          balanceLamports: sol,
        },
      });
    }
    const symbol = str(args, 'symbol') || str(args, 'market') || 'SOL-PERP';
    const pathMap: Record<string, string> = {
      get_phoenix_market: `/markets/${encodeURIComponent(symbol)}`,
      get_phoenix_mark_price: `/markets/${encodeURIComponent(symbol)}/mark-price`,
      get_phoenix_orderbook: `/markets/${encodeURIComponent(symbol)}/orderbook`,
      get_phoenix_candles: `/markets/${encodeURIComponent(symbol)}/candles`,
      get_phoenix_funding_rates: `/markets/${encodeURIComponent(symbol)}/funding`,
      get_phoenix_market_fills: `/markets/${encodeURIComponent(symbol)}/fills`,
      get_phoenix_market_stats: `/markets/${encodeURIComponent(symbol)}/stats`,
      get_phoenix_market_calendar: `/markets/${encodeURIComponent(symbol)}/calendar`,
      get_phoenix_trader: `/traders/${encodeURIComponent(str(args, 'trader') || w || '')}`,
      get_phoenix_my_trader_state: `/traders/${encodeURIComponent(w || '')}`,
    };
    if (name === 'analyze_phoenix_account_health' || name === 'calculate_phoenix_position_margin') {
      const market = await phoenixGet(`/markets/${encodeURIComponent(symbol)}`).catch(() => null);
      const mark = await phoenixGet(`/markets/${encodeURIComponent(symbol)}/mark-price`).catch(() => null);
      return meta(def, {
        ok: true,
        result: {
          estimate: true,
          symbol,
          market,
          mark,
          note: 'Read-only margin/health estimate scaffolding — pair with live trader state for production risk.',
          args: args || {},
        },
      });
    }
    const path = pathMap[name];
    if (!path || path.endsWith('/')) {
      return meta(def, { ok: false, error: `Phoenix tool requires wallet/trader for ${name}` });
    }
    // candles timeframe
    let full = path;
    if (name === 'get_phoenix_candles') {
      const tf = str(args, 'timeframe') || str(args, 'resolution') || '1h';
      full += `?timeframe=${encodeURIComponent(tf)}`;
    }
    const data = await phoenixGet(full);
    return meta(def, { ok: true, result: data });
  }

  // Imperial
  if (name.startsWith('get_imperial')) {
    const walletAddr = w || str(args, 'walletAddress');
    const routes: Record<string, () => Promise<Json>> = {
      get_imperial_status: () => imperialGet('/status'),
      get_imperial_funding_rates: () => imperialGet('/funding-rates'),
      get_imperial_mark_prices: () => imperialGet('/mark-prices'),
      get_imperial_flash_markets: () => imperialGet('/flash/markets'),
      get_imperial_gmtrade_markets: () => imperialGet('/gmtrade/markets'),
      get_imperial_gmtrade_funding_rates: () => imperialGet('/gmtrade/funding-rates'),
      get_imperial_gmtrade_liquidity: () => imperialGet('/gmtrade/liquidity'),
      get_imperial_phoenix_markets: () => imperialGet('/phoenix/markets'),
      get_imperial_phoenix_mark_prices: () => imperialGet('/phoenix/mark-prices'),
      get_imperial_phoenix_depth: () =>
        imperialGet('/phoenix/depth', { symbol: str(args, 'symbol') || undefined }),
      get_imperial_priority_fee: () => imperialGet('/priority-fee'),
      get_imperial_stats_summary: () => imperialGet('/stats/summary'),
      get_imperial_stats_markets: () =>
        imperialGet('/stats/markets', { period: str(args, 'period') || '24h' }),
      get_imperial_stats_open_interest: () =>
        imperialGet('/stats/open-interest', { grouping: str(args, 'grouping') || 'venue' }),
      get_imperial_stats_open_interest_history: () =>
        imperialGet('/stats/open-interest/history', {
          period: str(args, 'period') || '7d',
          grouping: str(args, 'grouping') || 'venue',
        }),
      get_imperial_stats_volume: () =>
        imperialGet('/stats/volume', {
          period: str(args, 'period') || '24h',
          grouping: str(args, 'grouping') || 'venue',
          venue: str(args, 'venue') || undefined,
        }),
      get_imperial_route: () =>
        imperialGet('/route', {
          asset: str(args, 'asset') || 'SOL',
          side: str(args, 'side') || 'long',
          notional: str(args, 'notional') || '100',
        }),
      get_imperial_builder_summary: () =>
        imperialGet('/builder/summary', { code: str(args, 'code') || undefined }),
      get_imperial_touch_markets: () => imperialGet('/touch/markets'),
      get_imperial_touch_deals: () =>
        imperialGet('/touch/deals', { marketId: str(args, 'marketId') || undefined }),
      get_imperial_jupiter_pool_info: () =>
        imperialGet('/jupiter/pool-info', { mint: str(args, 'mint') || undefined }),
    };
    if (routes[name]) {
      const data = await routes[name]();
      return meta(def, { ok: true, result: data });
    }
    // wallet-scoped
    if (!walletAddr && !['get_imperial_order_history_detail'].includes(name)) {
      return meta(def, { ok: false, error: 'Missing wallet / walletAddress for Imperial wallet-scoped tool' });
    }
    const walletRoutes: Record<string, string> = {
      get_imperial_positions: `/wallets/${walletAddr}/positions`,
      get_imperial_orders: `/wallets/${walletAddr}/orders`,
      get_imperial_trades: `/wallets/${walletAddr}/trades`,
      get_imperial_deposit_history: `/wallets/${walletAddr}/deposits`,
      get_imperial_funding_history: `/wallets/${walletAddr}/funding`,
      get_imperial_order_history: `/wallets/${walletAddr}/order-history`,
      get_imperial_passthrough_orders: `/wallets/${walletAddr}/passthrough-orders`,
      get_imperial_phoenix_direct_positions: `/wallets/${walletAddr}/phoenix-positions`,
      get_imperial_pnl_history: `/wallets/${walletAddr}/pnl`,
      get_imperial_touch_positions: `/wallets/${walletAddr}/touch-positions`,
    };
    if (name === 'get_imperial_order_history_detail') {
      const order = str(args, 'order') || str(args, 'orderPda') || str(args, 'id');
      if (!order) return meta(def, { ok: false, error: 'Missing order / orderPda' });
      const data = await imperialGet(`/orders/${encodeURIComponent(order)}`);
      return meta(def, { ok: true, result: data });
    }
    const path = walletRoutes[name];
    if (!path) return meta(def, { ok: false, error: `Unhandled Imperial tool: ${name}` });
    const data = await imperialGet(path);
    return meta(def, { ok: true, result: data });
  }

  // Market / Birdeye / Jupiter
  if (def.group === 'market' || def.group === 'ohlcv' || def.group === 'wallet') {
    if (name === 'get_price' || name === 'get_multi_price') {
      const mint = str(args, 'mint') || str(args, 'token') || str(args, 'address');
      const mints = name === 'get_multi_price'
        ? (Array.isArray(args?.mints) ? (args!.mints as string[]) : String(args?.mints || mint).split(',').filter(Boolean))
        : mint ? [mint] : [];
      if (!mints.length) return meta(def, { ok: false, error: 'Missing mint / mints' });
      try {
        const data = await jupiterPrice(mints.slice(0, 50));
        return meta(def, { ok: true, result: data });
      } catch (e) {
        if (birdeyeKey() && mint) {
          const data = await birdeyeGet('/defi/price', { address: mint });
          return meta(def, { ok: true, result: data, note: 'Birdeye fallback' });
        }
        throw e;
      }
    }
    if (name === 'get_trending' || name === 'get_meme_list' || name === 'get_meme_listings') {
      const data = await birdeyeGet('/defi/token_trending', {
        sort_by: str(args, 'sort_by') || 'rank',
        sort_type: 'asc',
        offset: '0',
        limit: str(args, 'limit') || '20',
      });
      return meta(def, { ok: true, result: data });
    }
    if (name === 'search_tokens' || name === 'search_market_data' || name === 'resolve_token') {
      const q = str(args, 'query') || str(args, 'q') || str(args, 'symbol') || str(args, 'token');
      if (!q) return meta(def, { ok: false, error: 'Missing query / symbol' });
      const data = await birdeyeGet('/defi/v3/search', { keyword: q, chain: 'solana' });
      return meta(def, { ok: true, result: data });
    }
    if (name === 'get_token_overview' || name === 'get_birdeye_security' || name === 'get_token_security' || name === 'get_creation_info' || name === 'get_holder_distribution' || name === 'get_token_markets' || name === 'get_token_fees' || name === 'get_top_traders' || name === 'get_smart_money' || name === 'list_tokens') {
      const mint = str(args, 'mint') || str(args, 'token') || str(args, 'address');
      if (!mint && name !== 'list_tokens') return meta(def, { ok: false, error: 'Missing mint / address' });
      const path =
        name === 'get_token_overview' ? '/defi/token_overview' :
        name === 'get_birdeye_security' || name === 'get_token_security' ? '/defi/token_security' :
        name === 'get_creation_info' ? '/defi/token_creation_info' :
        name === 'get_holder_distribution' ? '/defi/v3/token/holder' :
        name === 'get_token_markets' ? '/defi/v2/markets' :
        name === 'get_token_fees' ? '/defi/token_fees' :
        name === 'get_top_traders' ? '/defi/v2/tokens/top_traders' :
        name === 'get_smart_money' ? '/defi/v2/tokens/top_traders' :
        '/defi/tokenlist';
      const data = await birdeyeGet(path, {
        address: mint || undefined,
        offset: '0',
        limit: str(args, 'limit') || '20',
      });
      return meta(def, { ok: true, result: data });
    }
    if (name === 'get_chart' || name === 'get_history_price' || name === 'get_pair_chart' || name === 'get_base_quote_chart' || name === 'get_token_trades' || name === 'get_pair_trades') {
      const address = str(args, 'mint') || str(args, 'address') || str(args, 'pair') || str(args, 'token');
      if (!address) return meta(def, { ok: false, error: 'Missing mint / pair address' });
      const path = name.includes('trade') ? '/defi/txs/token' : '/defi/ohlcv';
      const data = await birdeyeGet(path, {
        address,
        type: str(args, 'type') || str(args, 'timeframe') || '15m',
        time_from: str(args, 'time_from') || undefined,
        time_to: str(args, 'time_to') || undefined,
      });
      return meta(def, { ok: true, result: data });
    }
    if (name === 'get_live_price' || name === 'get_live_txs' || name === 'get_base_quote_live_price') {
      return meta(def, {
        ok: true,
        result: {
          mode: 'snapshot_hint',
          note: 'Live WebSocket subscriptions are available via Dark Clawd Birdeye WebSocket service; this tool returns a REST snapshot path hint.',
          rest: 'Use get_price / get_token_trades for non-WS hosts',
          args: args || {},
        },
      });
    }
    if (name === 'get_net_worth' || name === 'get_wallet_assets' || name === 'get_pnl' || name === 'get_sol_balance' || name === 'get_net_worth_chart') {
      if (!w) return meta(def, { ok: false, error: 'Missing wallet' });
      if (name === 'get_sol_balance') {
        const bal = await rpc('getBalance', [w]);
        return meta(def, { ok: true, result: { wallet: w, balance: bal } });
      }
      // Prefer Helius DAS if key present
      if (env('HELIUS_API_KEY')) {
        const res = await httpJson(heliusRpcUrl(), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getAssetsByOwner',
            params: { ownerAddress: w, page: 1, limit: 100 },
          }),
        });
        return meta(def, {
          ok: res.ok,
          result: res.data,
          error: res.ok ? undefined : res.error,
          note: 'Helius DAS cascade; configure Birdeye/Solana Tracker for PnL enrichment',
        });
      }
      if (solanaTrackerKey()) {
        const data = await stData(`/wallet/${w}`);
        return meta(def, { ok: true, result: data, note: 'Solana Tracker wallet portfolio' });
      }
      return meta(def, {
        ok: false,
        error: 'Configure HELIUS_API_KEY, BIRDEYE_API_KEY, or SOLANA_TRACKER_API_KEY for portfolio tools',
        requires: missingEnv(['HELIUS_API_KEY', 'BIRDEYE_API_KEY', 'SOLANA_TRACKER_API_KEY']),
      });
    }
  }

  // Helius wallet API
  if (def.group === 'helius') {
    if (!env('HELIUS_API_KEY')) {
      return meta(def, {
        ok: false,
        error: 'HELIUS_API_KEY required for Helius Wallet API tools',
        requires: ['HELIUS_API_KEY'],
      });
    }
    const address = w || str(args, 'address') || str(args, 'wallet');
    if (name === 'batch_wallet_identity') {
      const addrs = Array.isArray(args?.addresses) ? args!.addresses : String(args?.addresses || address).split(',').filter(Boolean);
      const data = await rpc('getMultipleAccounts', [addrs.slice(0, 100)]);
      return meta(def, { ok: true, result: { addresses: addrs, accounts: data }, note: 'Identity labels require Helius wallet API product access; raw accounts returned.' });
    }
    if (!address) return meta(def, { ok: false, error: 'Missing wallet / address' });
    if (name === 'get_wallet_balances_helius') {
      const data = await rpc('getTokenAccountsByOwner', [
        address,
        { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { encoding: 'jsonParsed' },
      ]);
      return meta(def, { ok: true, result: data });
    }
    if (name === 'get_wallet_history' || name === 'get_wallet_transfers' || name === 'stream_wallet_activity') {
      const data = await rpc('getSignaturesForAddress', [address, { limit: num(args, 'limit', 25) || 25 }]);
      return meta(def, { ok: true, result: data });
    }
    if (name === 'get_wallet_identity' || name === 'get_wallet_funded_by' || name === 'get_wallet_balance_at') {
      const data = await rpc('getAccountInfo', [address, { encoding: 'jsonParsed' }]);
      return meta(def, {
        ok: true,
        result: { address, account: data, args: args || {} },
        note: 'Full Helius Wallet API identity/funding endpoints require plan access; account info returned as baseline.',
      });
    }
  }

  // Solana Tracker
  if (def.group === 'solanatracker') {
    if (name.startsWith('st_das_')) {
      const methodMap: Record<string, string> = {
        st_das_get_asset: 'getAsset',
        st_das_get_asset_proof: 'getAssetProof',
        st_das_get_assets_by_authority: 'getAssetsByAuthority',
        st_das_get_assets_by_creator: 'getAssetsByCreator',
        st_das_get_assets_by_group: 'getAssetsByGroup',
        st_das_get_assets_by_owner: 'getAssetsByOwner',
        st_das_get_nft_editions: 'getNFTEditions',
        st_das_get_signatures_for_asset: 'getSignaturesForAsset',
        st_das_get_token_accounts: 'getTokenAccounts',
        st_das_search_assets: 'searchAssets',
      };
      const method = methodMap[name];
      const params = { ...(args || {}) };
      const data = await stDas(method, params as Record<string, unknown>);
      return meta(def, { ok: true, result: data, note: 'DAS call — 10 credits typical' });
    }
    if (name.startsWith('st_rpc_')) {
      const method = name.replace(/^st_rpc_/, '').replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      // convert st_rpc_get_balance -> getBalance
      const rpcMethod = method.startsWith('get') || method.startsWith('send') || method.startsWith('simulate')
        ? method
        : method;
      // fix camelCase properly
      const camel = name
        .replace(/^st_rpc_/, '')
        .split('_')
        .map((p, i) => (i === 0 ? p : p[0].toUpperCase() + p.slice(1)))
        .join('');
      const params = Array.isArray(args?.params) ? (args!.params as unknown[]) : buildRpcParams(name, args, w);
      if (name === 'st_rpc_send_transaction') {
        const tx = str(args, 'transaction') || str(args, 'tx');
        if (!tx) return meta(def, { ok: false, error: 'Missing already-signed transaction (base64/base58)' });
        const data = await stRpc('sendTransaction', [tx, { encoding: str(args, 'encoding') || 'base64' }]);
        return meta(def, { ok: true, result: data, custody: 'user-signed', note: 'Broadcast only — server never signs' });
      }
      const data = await stRpc(camel, params);
      return meta(def, { ok: true, result: data });
    }
    // data API
    const mint = str(args, 'mint') || str(args, 'token') || str(args, 'address');
    const pathMap: Record<string, string> = {
      st_get_price: mint ? `/price?token=${encodeURIComponent(mint)}` : '',
      st_get_token: mint ? `/tokens/${encodeURIComponent(mint)}` : '',
      st_get_chart: mint ? `/chart/${encodeURIComponent(mint)}` : '',
      st_get_token_holders: mint ? `/tokens/${encodeURIComponent(mint)}/holders` : '',
      st_get_token_top_holders: mint ? `/tokens/${encodeURIComponent(mint)}/holders/top` : '',
      st_get_token_trades: mint ? `/trades/${encodeURIComponent(mint)}` : '',
      st_get_token_stats: mint ? `/tokens/${encodeURIComponent(mint)}/stats` : '',
      st_get_token_events: mint ? `/tokens/${encodeURIComponent(mint)}/events` : '',
      st_get_token_bundlers: mint ? `/tokens/${encodeURIComponent(mint)}/bundlers` : '',
      st_get_token_top_traders: mint ? `/tokens/${encodeURIComponent(mint)}/top-traders` : '',
      st_get_first_buyers: mint ? `/tokens/${encodeURIComponent(mint)}/first-buyers` : '',
      st_get_price_history: mint ? `/price/history?token=${encodeURIComponent(mint)}` : '',
      st_get_trending_tokens: `/tokens/trending`,
      st_get_latest_tokens: `/tokens/latest`,
      st_get_graduating_tokens: `/tokens/graduating`,
      st_get_graduated_tokens: `/tokens/graduated`,
      st_get_tokens_by_volume: `/tokens/volume`,
      st_get_top_performers: `/tokens/multi/all`,
      st_get_top_traders: `/top-traders/all`,
      st_search_tokens: `/search?query=${encodeURIComponent(str(args, 'query') || str(args, 'q') || '')}`,
      st_get_wallet: w ? `/wallet/${w}` : '',
      st_get_wallet_basic: w ? `/wallet/${w}/basic` : '',
      st_get_wallet_chart: w ? `/wallet/${w}/chart` : '',
      st_get_wallet_page: w ? `/wallet/${w}/page` : '',
      st_get_wallet_pnl: w ? `/pnl/${w}` : '',
      st_get_wallet_trades: w ? `/wallet/${w}/trades` : '',
      st_get_wallet_token_pnl: w && mint ? `/pnl/${w}/${mint}` : '',
      st_get_tokens_by_deployer: `/deployer/${encodeURIComponent(str(args, 'deployer') || w || '')}`,
      st_get_multiple_prices: `/price/multi`,
      st_get_multi_tokens: `/tokens/multi`,
    };
    const path = pathMap[name];
    if (!path) return meta(def, { ok: false, error: `Unhandled Solana Tracker tool path for ${name}` });
    if (!path || path.endsWith('/') || path.includes('undefined')) {
      return meta(def, { ok: false, error: `Missing required mint/wallet/query for ${name}` });
    }
    if (name === 'st_get_multiple_prices' || name === 'st_get_multi_tokens') {
      const tokens = Array.isArray(args?.tokens) ? args!.tokens : String(args?.tokens || mint).split(',').filter(Boolean);
      const data = await stData(path.split('?')[0], undefined).catch(async () => {
        // POST body style
        const base = env('SOLANA_TRACKER_API_URL', 'https://data.solanatracker.io').replace(/\/$/, '');
        const key = solanaTrackerKey();
        const res = await httpJson(`${base}${path}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-api-key': key, Authorization: `Bearer ${key}` },
          body: JSON.stringify({ tokens }),
        });
        if (!res.ok) throw new Error(res.error || 'ST multi error');
        return res.data;
      });
      return meta(def, { ok: true, result: data });
    }
    const data = await stData(path);
    return meta(def, { ok: true, result: data });
  }

  // Trading quotes
  if (def.group === 'trading') {
    if (name === 'get_quote') {
      const inputMint = str(args, 'inputMint') || str(args, 'from') || 'So11111111111111111111111111111111111111112';
      const outputMint = str(args, 'outputMint') || str(args, 'to') || str(args, 'mint');
      const amount = str(args, 'amount') || '1000000';
      if (!outputMint) return meta(def, { ok: false, error: 'Missing outputMint / to' });
      const u = new URL('https://quote-api.jup.ag/v6/quote');
      u.searchParams.set('inputMint', inputMint);
      u.searchParams.set('outputMint', outputMint);
      u.searchParams.set('amount', amount);
      u.searchParams.set('slippageBps', str(args, 'slippageBps') || '50');
      const res = await httpJson(u.toString());
      return meta(def, { ok: res.ok, result: res.data, error: res.ok ? undefined : res.error });
    }
    if (name === 'list_dflow_tokens' || name === 'get_dflow_priority_fees') {
      const base = env('DFLOW_API_URL', 'https://quote-api.dflow.net').replace(/\/$/, '');
      const path = name === 'list_dflow_tokens' ? '/tokens' : '/priority-fees';
      const res = await httpJson(`${base}${path}`);
      return meta(def, { ok: res.ok, result: res.data, error: res.ok ? undefined : res.error });
    }
  }

  // Agents
  if (name === 'get_asset') {
    const id = str(args, 'id') || str(args, 'mint') || str(args, 'asset');
    if (!id) return meta(def, { ok: false, error: 'Missing asset id / mint' });
    const res = await httpJson(heliusRpcUrl(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getAsset', params: { id } }),
    });
    return meta(def, { ok: res.ok, result: res.data, error: res.ok ? undefined : res.error });
  }
  if (name === 'search_solana_agents') {
    return meta(def, {
      ok: true,
      result: {
        query: str(args, 'query') || str(args, 'q') || '',
        note: 'Agent discovery via Metaplex/DAS — use get_asset + Helius DAS search when configured',
        hub: 'https://cheshireterminal.ai/dark-clawd',
      },
    });
  }

  return meta(def, {
    ok: false,
    error: `No handler implemented for ${name}`,
  });
}

function buildRpcParams(name: string, args: Record<string, unknown> | undefined, wallet?: string): unknown[] {
  const a = args || {};
  switch (name) {
    case 'st_rpc_get_balance':
      return [str(a, 'address') || wallet];
    case 'st_rpc_get_account_info':
      return [str(a, 'address') || str(a, 'pubkey'), { encoding: 'jsonParsed' }];
    case 'st_rpc_get_multiple_accounts': {
      const keys = Array.isArray(a.addresses) ? a.addresses : String(a.addresses || '').split(',').filter(Boolean);
      return [keys, { encoding: 'jsonParsed' }];
    }
    case 'st_rpc_get_token_accounts_by_owner':
      return [
        str(a, 'owner') || wallet,
        a.mint ? { mint: str(a, 'mint') } : { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { encoding: 'jsonParsed' },
      ];
    case 'st_rpc_get_token_supply':
    case 'st_rpc_get_token_largest_accounts':
      return [str(a, 'mint')];
    case 'st_rpc_get_token_account_balance':
      return [str(a, 'address') || str(a, 'tokenAccount')];
    case 'st_rpc_get_signatures_for_address':
      return [str(a, 'address') || wallet, { limit: num(a, 'limit', 20) || 20 }];
    case 'st_rpc_get_signature_statuses': {
      const sigs = Array.isArray(a.signatures) ? a.signatures : String(a.signatures || a.signature || '').split(',').filter(Boolean);
      return [sigs];
    }
    case 'st_rpc_get_transaction':
      return [str(a, 'signature') || str(a, 'tx'), { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }];
    case 'st_rpc_get_block':
      return [num(a, 'slot')];
    case 'st_rpc_get_blocks':
      return [num(a, 'startSlot'), num(a, 'endSlot')];
    case 'st_rpc_get_program_accounts':
      return [str(a, 'programId'), { encoding: 'jsonParsed' }];
    case 'st_rpc_get_token_accounts_by_delegate':
      return [str(a, 'delegate'), { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }, { encoding: 'jsonParsed' }];
    case 'st_rpc_get_fee_for_message':
      return [str(a, 'message')];
    case 'st_rpc_simulate_transaction':
      return [str(a, 'transaction') || str(a, 'tx'), { encoding: 'base64' }];
    case 'st_rpc_get_block_height':
    case 'st_rpc_get_block_production':
    case 'st_rpc_get_transaction_count':
      return [];
    default:
      return Array.isArray(a.params) ? (a.params as unknown[]) : [];
  }
}

export async function runSolGptTool(input: ToolRunInput): Promise<ToolRunResult> {
  const name = (input.tool || '').trim();
  if (!name) return { ok: false, tool: '', error: 'tool name required' };
  if (name === 'search_tools' || !getToolDef(name)) {
    // allow search_tools even if — it is in catalog
  }
  const def = getToolDef(name);
  if (!def) {
    const suggestions = searchTools(name, 8).map((t) => t.name);
    return {
      ok: false,
      tool: name,
      error: `Unknown tool: ${name}. Use search_tools or dark-clawd tools list.`,
      result: { suggestions },
    };
  }
  try {
    return await runImpl(def, input.args || {}, input.wallet);
  } catch (e) {
    return meta(def, {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

export function listAllTools(): SolGptToolDef[] {
  return SOL_GPT_TOOL_DEFS.slice();
}
