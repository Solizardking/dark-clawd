/**
 * SOL GPT tool catalog for Dark Clawd — 171 shipped tools.
 * Generated from the SOL GPT TOOL_DEFS group tables (keep in sync).
 * Source of truth for names/groups: docs/SOL_GPT_TOOLS.md + this file.
 */

export type ToolGroupId =
  | 'phoenix'
  | 'imperial'
  | 'market'
  | 'ohlcv'
  | 'wallet'
  | 'helius'
  | 'solanatracker'
  | 'trading'
  | 'prediction'
  | 'browser'
  | 'agents'
  | 'platform'
;

export type ToolCustody = 'read-only' | 'user-signed';

export interface SolGptToolDef {
  name: string;
  group: ToolGroupId;
  core: boolean;
  custody: ToolCustody;
  description: string;
}

export interface SolGptToolGroupMeta {
  id: ToolGroupId;
  title: string;
  blurb: string;
}

export const SOL_GPT_TOOL_GROUPS: SolGptToolGroupMeta[] = [
  { id: 'phoenix', title: 'Phoenix Eternal', blurb: 'Perps research + user-signed trade prep (market/limit, deposit, withdraw, register)' },
  { id: 'imperial', title: 'Imperial router', blurb: 'Multi-venue perps intel (Jupiter / Flash / Phoenix / GMTrade): funding, marks, route, stats, positions' },
  { id: 'market', title: 'Market data', blurb: 'Prices, search, trending, memes, fees, security' },
  { id: 'ohlcv', title: 'OHLCV & live tape', blurb: 'Candles, live price, base/quote streams, trades' },
  { id: 'wallet', title: 'Wallet & portfolio', blurb: 'Net worth, PnL, assets, balances' },
  { id: 'helius', title: 'Helius Wallet API', blurb: 'Identity, history, transfers, funding, activity stream' },
  { id: 'solanatracker', title: 'Solana Tracker', blurb: 'Wallet portfolio, PnL, trending, graduating, bundlers, search + DAS API (10 credits/call)' },
  { id: 'trading', title: 'Swaps & sends', blurb: 'Quotes + user-signed swap/transfer prep (your wallet signs)' },
  { id: 'prediction', title: 'Prediction markets', blurb: 'DFlow / Kalshi read-only market data' },
  { id: 'browser', title: 'Cloud browser', blurb: 'Browse external sites via Browser Use' },
  { id: 'agents', title: 'Agents & DAS', blurb: 'Metaplex / Solana agent discovery and assets' },
  { id: 'platform', title: 'Platform', blurb: 'Sponge status and catalog search' },
];

export const SOL_GPT_TOOL_DEFS: SolGptToolDef[] = [
  { name: 'analyze_phoenix_account_health', group: 'phoenix', core: true, custody: 'read-only', description: `Estimate Phoenix effective collateral, account-health gap, risk score/tier, and liquidation thresholds. Call get_phoenix_market first for risk-factor percentages. Read-only estimate.` },
  { name: 'calculate_phoenix_position_margin', group: 'phoenix', core: true, custody: 'read-only', description: `Estimate Phoenix position margin + resting limit-order margin. Call get_phoenix_market + get_phoenix_mark_price first. Read-only.` },
  { name: 'get_phoenix_candles', group: 'phoenix', core: true, custody: 'read-only', description: `OHLCV candles for a Phoenix perpetual (TradingView-style). Requires timeframe (1m, 5m, 1h, 1d, …). Read-only.` },
  { name: 'get_phoenix_exchange_snapshot', group: 'phoenix', core: true, custody: 'read-only', description: `Phoenix exchange snapshot (aggregate market state). Read-only.` },
  { name: 'get_phoenix_exchange_status', group: 'phoenix', core: true, custody: 'read-only', description: `Phoenix Eternal operational status: active, gated, withdrawals. Read-only.` },
  { name: 'get_phoenix_funding_overview', group: 'phoenix', core: true, custody: 'read-only', description: `Exchange-wide Phoenix funding overview across markets. Read-only.` },
  { name: 'get_phoenix_funding_rates', group: 'phoenix', core: true, custody: 'read-only', description: `Recent Phoenix Eternal funding-rate history for a market. Read-only.` },
  { name: 'get_phoenix_mark_price', group: 'phoenix', core: true, custody: 'read-only', description: `Current Phoenix Eternal mark price (USD) used for PnL and liquidation. Read-only.` },
  { name: 'get_phoenix_market', group: 'phoenix', core: true, custody: 'read-only', description: `Get static configuration for one Phoenix Eternal perpetual market (leverage tiers, fees, risk). Symbols like SOL-PERP. Read-only.` },
  { name: 'get_phoenix_market_calendar', group: 'phoenix', core: true, custody: 'read-only', description: `Market calendar / session schedule for a Phoenix market (useful for RWA/commodity perps). Read-only.` },
  { name: 'get_phoenix_market_fills', group: 'phoenix', core: true, custody: 'read-only', description: `Recent unaggregated fills for a Phoenix market (tape). Read-only.` },
  { name: 'get_phoenix_market_stats', group: 'phoenix', core: true, custody: 'read-only', description: `Historical / rolling market stats for a Phoenix perpetual. Read-only.` },
  { name: 'get_phoenix_my_trader_state', group: 'phoenix', core: true, custody: 'read-only', description: `Read the connected wallet's Phoenix trader state (cross + isolated subaccounts, collateral, positions when available). Use before deposit/orders. Read-only — does not place orders.` },
  { name: 'get_phoenix_orderbook', group: 'phoenix', core: true, custody: 'read-only', description: `Current Phoenix Eternal L2 orderbook snapshot for a perpetual market. Read-only.` },
  { name: 'get_phoenix_rpc_context', group: 'phoenix', core: true, custody: 'read-only', description: `Solana RPC / Helius cluster health for perps readiness: slot, block height, optional connected-wallet SOL for fees. Uses server HELIUS_API_KEY / SOLANA_RPC_URL (never client keys). Pair with Phoenix market tools before discussing live execution.` },
  { name: 'get_phoenix_trader', group: 'phoenix', core: true, custody: 'read-only', description: `Read Phoenix trader view by trader pubkey (positions/margins when available). Read-only research — not a live order.` },
  { name: 'list_phoenix_markets', group: 'phoenix', core: true, custody: 'read-only', description: `List Phoenix Eternal perpetual markets with status, fees, leverage tiers, and risk parameters. Read-only. Prefer for 'what perps can I trade'.` },
  { name: 'prepare_phoenix_cancel_all', group: 'phoenix', core: true, custody: 'user-signed', description: `Build an unsigned cancel-all for resting Phoenix orders on one market (UI signs).` },
  { name: 'prepare_phoenix_deposit', group: 'phoenix', core: true, custody: 'user-signed', description: `Build an unsigned Phoenix USDC deposit for the connected wallet (UI signs). Use when the user wants to fund their Phoenix perps account with USDC.` },
  { name: 'prepare_phoenix_limit_order', group: 'phoenix', core: true, custody: 'user-signed', description: `Build an unsigned Phoenix limit order for the connected wallet (UI signs). Requires symbol, side, baseUnits, and priceUsd.` },
  { name: 'prepare_phoenix_market_order', group: 'phoenix', core: true, custody: 'user-signed', description: `Build an unsigned Phoenix market order (IOC) for the connected wallet (UI signs). Use for live long/short/open/close when the user wants to trade perps now. Prefer get_phoenix_mark_price + get_phoenix_my_trader_state first. baseUnits is position size in base (e.g. 0.25 SOL).` },
  { name: 'prepare_phoenix_register_trader', group: 'phoenix', core: true, custody: 'user-signed', description: `Build an unsigned Phoenix register-trader transaction for the connected wallet (UI prompts wallet to sign). Required once before deposits/orders. Cross margin uses subaccount 0; isolated uses subaccount > 0.` },
  { name: 'prepare_phoenix_withdraw', group: 'phoenix', core: true, custody: 'user-signed', description: `Build an unsigned Phoenix USDC withdraw for the connected wallet (UI signs). Withdraws free collateral back to the user's USDC token account.` },
  { name: 'get_imperial_builder_summary', group: 'imperial', core: false, custody: 'read-only', description: `Builder fee accrual/payout summary for a builder code (code is the credential; no JWT). Read-only.` },
  { name: 'get_imperial_deposit_history', group: 'imperial', core: false, custody: 'read-only', description: `Imperial deposit/withdraw history for a wallet. Read-only.` },
  { name: 'get_imperial_flash_markets', group: 'imperial', core: true, custody: 'read-only', description: `Flash Trade markets available via Imperial (long/short sides, pool addresses). Read-only.` },
  { name: 'get_imperial_funding_history', group: 'imperial', core: false, custody: 'read-only', description: `Per-wallet Imperial funding payment history. Read-only.` },
  { name: 'get_imperial_funding_rates', group: 'imperial', core: true, custody: 'read-only', description: `Multi-venue Imperial funding/borrow rates (Phoenix, Jupiter, Flash, GMTrade) for all symbols. longFundingRatePerHourPercent > 0 means longs pay shorts. Read-only.` },
  { name: 'get_imperial_gmtrade_funding_rates', group: 'imperial', core: true, custody: 'read-only', description: `GMTrade funding/borrow rates (independent long/short). Read-only.` },
  { name: 'get_imperial_gmtrade_liquidity', group: 'imperial', core: true, custody: 'read-only', description: `GMTrade liquidity snapshot via Imperial. Read-only.` },
  { name: 'get_imperial_gmtrade_markets', group: 'imperial', core: true, custody: 'read-only', description: `GMTrade markets available via Imperial. Read-only.` },
  { name: 'get_imperial_jupiter_pool_info', group: 'imperial', core: false, custody: 'read-only', description: `Cache-fronted Jupiter pool-info for a market mint (Imperial proxy; avoids client Jupiter rate limits). Requires mint. Read-only.` },
  { name: 'get_imperial_mark_prices', group: 'imperial', core: true, custody: 'read-only', description: `Multi-venue Imperial mark prices (per symbol × venue, including index/Pyth). Use for multi-venue mark comparison. Read-only.` },
  { name: 'get_imperial_order_history', group: 'imperial', core: false, custody: 'read-only', description: `Historical Imperial order rows for a wallet (filters: market, underwriter, side, status, from, to). Read-only.` },
  { name: 'get_imperial_order_history_detail', group: 'imperial', core: false, custody: 'read-only', description: `Single Imperial order history detail by order PDA. Read-only.` },
  { name: 'get_imperial_orders', group: 'imperial', core: true, custody: 'read-only', description: `Combined open/working Imperial orders for a wallet across underwriters. Read-only.` },
  { name: 'get_imperial_passthrough_orders', group: 'imperial', core: false, custody: 'read-only', description: `Passthrough-program orders for a wallet (Imperial subset). Optional status/limit/profile_index. Read-only.` },
  { name: 'get_imperial_phoenix_depth', group: 'imperial', core: true, custody: 'read-only', description: `Imperial-cached Phoenix L2 depth (all symbols or one). Phoenix-raw symbols (SOL, GOLD for XAU). Prefer over raw Phoenix when comparing Imperial venues. Read-only.` },
  { name: 'get_imperial_phoenix_direct_positions', group: 'imperial', core: false, custody: 'read-only', description: `Wallet-owned Phoenix positions via Imperial (independent of core lifecycle). Read-only.` },
  { name: 'get_imperial_phoenix_mark_prices', group: 'imperial', core: true, custody: 'read-only', description: `Phoenix mark prices as served by Imperial (venue=phoenix). Read-only.` },
  { name: 'get_imperial_phoenix_markets', group: 'imperial', core: true, custody: 'read-only', description: `Phoenix markets listed through Imperial (orderbooks, asset maps, underwriter phoenix). Read-only.` },
  { name: 'get_imperial_pnl_history', group: 'imperial', core: false, custody: 'read-only', description: `Wallet PnL history series via Imperial (resolution/since/until/underwriter). Read-only.` },
  { name: 'get_imperial_positions', group: 'imperial', core: true, custody: 'read-only', description: `Open Imperial position lifecycles across all underwriters for a wallet (live PnL when available). Public read — walletAddress required or uses connected wallet. Read-only.` },
  { name: 'get_imperial_priority_fee', group: 'imperial', core: true, custody: 'read-only', description: `Suggested Solana priority fee (micro-lamports) from Imperial. Read-only.` },
  { name: 'get_imperial_route', group: 'imperial', core: true, custody: 'read-only', description: `Imperial smart venue router: recommended underwriter (Jupiter/Flash/Phoenix/GMTrade) and expected cost for a notional. Params: asset (SOL/BTC/…), side (long\\` },
  { name: 'get_imperial_stats_markets', group: 'imperial', core: true, custody: 'read-only', description: `Per-asset Imperial volume + OI breakdown (period: 24h, 7d, …). Read-only.` },
  { name: 'get_imperial_stats_open_interest', group: 'imperial', core: true, custody: 'read-only', description: `Current Imperial open-interest snapshot. grouping: venue \\` },
  { name: 'get_imperial_stats_open_interest_history', group: 'imperial', core: false, custody: 'read-only', description: `Historical Imperial OI time series (period + grouping). currentOiUsd is live truth. Read-only.` },
  { name: 'get_imperial_stats_summary', group: 'imperial', core: true, custody: 'read-only', description: `Imperial protocol stats: 24h/7d/all volume, open interest, active traders, fee revenue, per-venue breakdown. Read-only.` },
  { name: 'get_imperial_stats_volume', group: 'imperial', core: true, custody: 'read-only', description: `Imperial volume time series. period + grouping + optional venue filter. Read-only.` },
  { name: 'get_imperial_status', group: 'imperial', core: true, custody: 'read-only', description: `Imperial protocol health (db, indexer, order bot). Read-only. Prefer before heavy Imperial research.` },
  { name: 'get_imperial_touch_deals', group: 'imperial', core: false, custody: 'read-only', description: `Imperial Touch pre-priced barriers/deals. Optional marketId. Read-only.` },
  { name: 'get_imperial_touch_markets', group: 'imperial', core: false, custody: 'read-only', description: `Imperial Touch (one-touch binary) markets list. Read-only research.` },
  { name: 'get_imperial_touch_positions', group: 'imperial', core: false, custody: 'read-only', description: `A wallet's Imperial Touch contracts. Read-only.` },
  { name: 'get_imperial_trades', group: 'imperial', core: false, custody: 'read-only', description: `Imperial position lifecycles (open + closed) with actions for a wallet. Paginated multi-venue. Read-only.` },
  { name: 'get_birdeye_security', group: 'market', core: false, custody: 'read-only', description: `Birdeye-native token security/risk fields.` },
  { name: 'get_creation_info', group: 'market', core: false, custody: 'read-only', description: `Token creation info.` },
  { name: 'get_holder_distribution', group: 'market', core: false, custody: 'read-only', description: `Token holder distribution.` },
  { name: 'get_meme_list', group: 'market', core: false, custody: 'read-only', description: `Meme token list / discovery.` },
  { name: 'get_meme_listings', group: 'market', core: false, custody: 'read-only', description: `New meme token listings.` },
  { name: 'get_multi_price', group: 'market', core: false, custody: 'read-only', description: `Spot USD prices for up to 50 Solana mints from authenticated Jupiter Price V3 (Birdeye fallback).` },
  { name: 'get_price', group: 'market', core: true, custody: 'read-only', description: `Spot USD price from authenticated Jupiter Price V3 (Birdeye fallback), including 24h change and liquidity.` },
  { name: 'get_smart_money', group: 'market', core: false, custody: 'read-only', description: `Smart-money / top trader signals.` },
  { name: 'get_token_fees', group: 'market', core: false, custody: 'read-only', description: `Global fees paid for Solana tokens (Birdeye fee API).` },
  { name: 'get_token_markets', group: 'market', core: false, custody: 'read-only', description: `DEX markets / pools for a token.` },
  { name: 'get_token_overview', group: 'market', core: true, custody: 'read-only', description: `Rich token overview: price, market cap, FDV, volume, holders, social links.` },
  { name: 'get_token_security', group: 'market', core: false, custody: 'read-only', description: `Solana Tracker / security checks for a mint.` },
  { name: 'get_top_traders', group: 'market', core: false, custody: 'read-only', description: `Top traders for a token.` },
  { name: 'get_trending', group: 'market', core: true, custody: 'read-only', description: `Trending tokens list sorted by rank, volume, or liquidity.` },
  { name: 'list_tokens', group: 'market', core: false, custody: 'read-only', description: `DEX token list with fee/liquidity filters.` },
  { name: 'resolve_token', group: 'market', core: true, custody: 'read-only', description: `Resolve a ticker symbol to a Solana mint address.` },
  { name: 'search_market_data', group: 'market', core: false, custody: 'read-only', description: `Search tokens and markets (Birdeye search).` },
  { name: 'search_tokens', group: 'market', core: true, custody: 'read-only', description: `Search tokens by symbol or name (e.g. 'BONK', 'JUP'). Returns mint addresses and metadata.` },
  { name: 'get_base_quote_chart', group: 'ohlcv', core: false, custody: 'read-only', description: `Historical base/quote OHLCV (two mints, no pair address).` },
  { name: 'get_base_quote_live_price', group: 'ohlcv', core: false, custody: 'read-only', description: `Live SUBSCRIBE_BASE_QUOTE_PRICE OHLCV for two mints without a pair address.` },
  { name: 'get_chart', group: 'ohlcv', core: false, custody: 'read-only', description: `Historical OHLCV candlesticks for a token mint (Birdeye). UI renders an interactive chart.` },
  { name: 'get_history_price', group: 'ohlcv', core: false, custody: 'read-only', description: `Historical price line (unixTime, value).` },
  { name: 'get_live_price', group: 'ohlcv', core: false, custody: 'read-only', description: `Live SUBSCRIBE_PRICE OHLCV ticks (token usd or pair; mode raw\\` },
  { name: 'get_live_txs', group: 'ohlcv', core: false, custody: 'read-only', description: `Live Birdeye transaction tape (SUBSCRIBE_TXS snapshot).` },
  { name: 'get_net_worth_chart', group: 'ohlcv', core: false, custody: 'read-only', description: `Net-worth history chart points for a wallet.` },
  { name: 'get_pair_chart', group: 'ohlcv', core: false, custody: 'read-only', description: `Historical OHLCV for a pair/market address.` },
  { name: 'get_pair_trades', group: 'ohlcv', core: false, custody: 'read-only', description: `Recent trades for a pair/market address.` },
  { name: 'get_token_trades', group: 'ohlcv', core: false, custody: 'read-only', description: `Recent trades for a token mint.` },
  { name: 'get_net_worth', group: 'wallet', core: true, custody: 'read-only', description: `Wallet net worth — SOL + top holdings by USD (holders/paid get DAS enrichment).` },
  { name: 'get_pnl', group: 'wallet', core: true, custody: 'read-only', description: `Wallet PnL estimates.` },
  { name: 'get_sol_balance', group: 'wallet', core: false, custody: 'read-only', description: `Native SOL balance for a wallet.` },
  { name: 'get_wallet_assets', group: 'wallet', core: true, custody: 'read-only', description: `Wallet assets / holdings overview.` },
  { name: 'batch_wallet_identity', group: 'helius', core: true, custody: 'read-only', description: `Batch identity lookup (up to 100 addresses).` },
  { name: 'get_wallet_balance_at', group: 'helius', core: true, custody: 'read-only', description: `Historical balance at a timestamp.` },
  { name: 'get_wallet_balances_helius', group: 'helius', core: true, custody: 'read-only', description: `Live token balances via Helius Wallet API.` },
  { name: 'get_wallet_funded_by', group: 'helius', core: true, custody: 'read-only', description: `Who funded this wallet.` },
  { name: 'get_wallet_history', group: 'helius', core: true, custody: 'read-only', description: `Transaction history for a wallet.` },
  { name: 'get_wallet_identity', group: 'helius', core: true, custody: 'read-only', description: `Resolve identity labels for a wallet or domain.` },
  { name: 'get_wallet_transfers', group: 'helius', core: true, custody: 'read-only', description: `Transfer history for a wallet.` },
  { name: 'stream_wallet_activity', group: 'helius', core: true, custody: 'read-only', description: `Composite activity stream (history + transfers).` },
  { name: 'st_das_get_asset', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker DAS getAsset (10 credits): NFT/cNFT/fungible mint metadata, ownership, compression. Requires SOLANA_TRACKER_RPC_URL.` },
  { name: 'st_das_get_asset_proof', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker DAS getAssetProof (10 credits): Merkle proof for compressed NFTs.` },
  { name: 'st_das_get_assets_by_authority', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker DAS getAssetsByAuthority (10 credits): assets by update authority.` },
  { name: 'st_das_get_assets_by_creator', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker DAS getAssetsByCreator (10 credits): assets by creator address.` },
  { name: 'st_das_get_assets_by_group', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker DAS getAssetsByGroup (10 credits): assets by collection (groupKey + groupValue).` },
  { name: 'st_das_get_assets_by_owner', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker DAS getAssetsByOwner (10 credits): assets owned by a wallet (NFTs + optional fungibles).` },
  { name: 'st_das_get_nft_editions', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker DAS getNFTEditions (10 credits): NFT edition details for a master mint.` },
  { name: 'st_das_get_signatures_for_asset', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker DAS getSignaturesForAsset (10 credits): transaction history for an asset.` },
  { name: 'st_das_get_token_accounts', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker DAS getTokenAccounts (10 credits): token account info by owner and/or mint.` },
  { name: 'st_das_search_assets', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker DAS searchAssets (10 credits): search assets by owner/creator/authority/interface/compressed/etc.` },
  { name: 'st_get_chart', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: OHLCV / price chart for a token (type, time_from, time_to, marketCap).` },
  { name: 'st_get_first_buyers', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: first buyers of a token mint.` },
  { name: 'st_get_graduated_tokens', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: recently graduated tokens.` },
  { name: 'st_get_graduating_tokens', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: tokens near bonding-curve graduation (pump.fun style).` },
  { name: 'st_get_latest_tokens', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: newest tokens feed.` },
  { name: 'st_get_multi_tokens', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: batch token info for up to ~20 mints (POST /tokens/multi).` },
  { name: 'st_get_multiple_prices', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: batch spot prices for multiple mints (Client.getMultiplePrices). Optional priceChanges.` },
  { name: 'st_get_price', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: spot price for a mint (optional priceChanges).` },
  { name: 'st_get_price_history', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: historical price series for a mint (Client.getPriceHistory).` },
  { name: 'st_get_token', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: full token info (pools, risk score, snipers/bundlers/insiders, holders, buys/sells).` },
  { name: 'st_get_token_bundlers', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: bundler wallets for a mint (count, % supply, wallet list).` },
  { name: 'st_get_token_events', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: lifecycle events for a token.` },
  { name: 'st_get_token_holders', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: token holder list (optional enrich).` },
  { name: 'st_get_token_stats', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: aggregated stats for a token.` },
  { name: 'st_get_token_top_holders', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: top holders for a token mint.` },
  { name: 'st_get_token_top_traders', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: top traders for one token mint.` },
  { name: 'st_get_token_trades', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: recent trades for a token mint.` },
  { name: 'st_get_tokens_by_deployer', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: tokens created by a deployer wallet.` },
  { name: 'st_get_tokens_by_volume', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: tokens ranked by volume (optional timeframe).` },
  { name: 'st_get_top_performers', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: top performers for a timeframe (required).` },
  { name: 'st_get_top_traders', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: global top traders leaderboard.` },
  { name: 'st_get_trending_tokens', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: trending tokens. Optional timeframe e.g. 5m, 1h, 6h, 24h.` },
  { name: 'st_get_wallet', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: full wallet portfolio (tokens, USD total, SOL balance). Use when Helius/Birdeye net-worth fails or for ST-native holdings. Requires SOLANA_TRACKER_API_KEY.` },
  { name: 'st_get_wallet_basic', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: lightweight wallet balances (address, balance, value, price) — cheaper than full wallet.` },
  { name: 'st_get_wallet_chart', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: historical portfolio value chart (date, value, pnlPercentage).` },
  { name: 'st_get_wallet_page', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: paginated wallet token holdings.` },
  { name: 'st_get_wallet_pnl', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: wallet PnL summary (realized/unrealized when available). Prefer over Birdeye get_pnl when ST is configured.` },
  { name: 'st_get_wallet_token_pnl', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: PnL for one wallet + token mint pair.` },
  { name: 'st_get_wallet_trades', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: recent trades for a wallet (cursor pagination).` },
  { name: 'st_rpc_get_account_info', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getAccountInfo — raw account data for a pubkey (lamports, owner, data).` },
  { name: 'st_rpc_get_balance', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getBalance — native SOL lamports for a wallet/system account.` },
  { name: 'st_rpc_get_block', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getBlock — block at slot.` },
  { name: 'st_rpc_get_block_height', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getBlockHeight — current block height.` },
  { name: 'st_rpc_get_block_production', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getBlockProduction — leader production stats.` },
  { name: 'st_rpc_get_blocks', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getBlocks — confirmed slots in a range.` },
  { name: 'st_rpc_get_fee_for_message', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getFeeForMessage — estimate fee for a serialized message (base64).` },
  { name: 'st_rpc_get_multiple_accounts', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getMultipleAccounts — batch account info for many pubkeys.` },
  { name: 'st_rpc_get_program_accounts', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getProgramAccounts — all accounts owned by a program (can be large).` },
  { name: 'st_rpc_get_signature_statuses', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getSignatureStatuses — confirmation status for tx signatures.` },
  { name: 'st_rpc_get_signatures_for_address', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getSignaturesForAddress — recent signatures for an address.` },
  { name: 'st_rpc_get_token_account_balance', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getTokenAccountBalance — SPL balance for a token account address.` },
  { name: 'st_rpc_get_token_accounts_by_delegate', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getTokenAccountsByDelegate — token accounts for a delegate.` },
  { name: 'st_rpc_get_token_accounts_by_owner', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getTokenAccountsByOwner — SPL token accounts for a wallet. Use mint= for a single token (e.g. $CLAWD).` },
  { name: 'st_rpc_get_token_largest_accounts', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getTokenLargestAccounts — top holders of an SPL mint.` },
  { name: 'st_rpc_get_token_supply', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getTokenSupply — total supply / decimals for an SPL mint.` },
  { name: 'st_rpc_get_transaction', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getTransaction — full transaction by signature.` },
  { name: 'st_rpc_get_transaction_count', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC getTransactionCount — network tx count.` },
  { name: 'st_rpc_send_transaction', group: 'solanatracker', core: true, custody: 'user-signed', description: `Solana Tracker RPC sendTransaction — submit an ALREADY SIGNED base64/base58 transaction. Server never signs keys.` },
  { name: 'st_rpc_simulate_transaction', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker RPC simulateTransaction — dry-run a base64 transaction (no broadcast).` },
  { name: 'st_search_tokens', group: 'solanatracker', core: true, custody: 'read-only', description: `Solana Tracker: advanced token search (query/symbol + liquidity/mcap/volume/holders/risk filters). Docs /search.` },
  { name: 'get_dflow_priority_fees', group: 'trading', core: false, custody: 'read-only', description: `DFlow priority fee hints.` },
  { name: 'get_quote', group: 'trading', core: true, custody: 'read-only', description: `Spot swap quote (DFlow / Jupiter).` },
  { name: 'list_dflow_tokens', group: 'trading', core: false, custody: 'read-only', description: `DFlow tradeable token list.` },
  { name: 'prepare_user_swap', group: 'trading', core: true, custody: 'user-signed', description: `Build unsigned Jupiter swap for the connected wallet (UI signs).` },
  { name: 'prepare_user_transfer', group: 'trading', core: true, custody: 'user-signed', description: `Build unsigned SOL/SPL transfer for the connected wallet (UI signs).` },
  { name: 'get_prediction_market', group: 'prediction', core: false, custody: 'read-only', description: `Prediction market snapshot by ticker.` },
  { name: 'get_prediction_orderbook', group: 'prediction', core: false, custody: 'read-only', description: `Prediction market orderbook depth.` },
  { name: 'search_prediction_markets', group: 'prediction', core: false, custody: 'read-only', description: `Search DFlow/Kalshi prediction markets.` },
  { name: 'browse_web', group: 'browser', core: true, custody: 'read-only', description: `Open a real cloud browser (Browser Use) and complete a research or navigation task on external sites — e.g. DexScreener, Birdeye web, TradingView, news, pump.fun listings, CEX public pages. Returns extracted text output, status, sessionId, and optional live view URL. Use for live web data that APIs do not cover. Does NOT spend user funds on Solana — for on-platform buys use get_quote + prepare_user_swap. Never send passwords or private keys in the task string.` },
  { name: 'browser_followup', group: 'browser', core: false, custody: 'read-only', description: `Dispatch a follow-up task on an existing keepAlive Browser Use session (same cookies/tabs). Use after browse_web with keepAlive=true.` },
  { name: 'browser_session_status', group: 'browser', core: false, custody: 'read-only', description: `Poll Browser Use session status, output, and live URL by session id.` },
  { name: 'browser_session_stop', group: 'browser', core: false, custody: 'read-only', description: `Stop a Browser Use session (task or full session). Call when research is done or user cancels.` },
  { name: 'get_asset', group: 'agents', core: false, custody: 'read-only', description: `Helius DAS getAsset for mint/NFT metadata.` },
  { name: 'search_solana_agents', group: 'agents', core: false, custody: 'read-only', description: `Search Solana agent / Metaplex identities.` },
  { name: 'search_tools', group: 'platform', core: true, custody: 'read-only', description: `Search the SOL GPT tool catalog by keyword (loads extra tools mid-chat).` },
  { name: 'sponge_status', group: 'platform', core: false, custody: 'read-only', description: `PaySponge bridge / agent wallet status.` },
];

export const SOL_GPT_TOOL_COUNT = SOL_GPT_TOOL_DEFS.length;
export const SOL_GPT_CORE_COUNT = SOL_GPT_TOOL_DEFS.filter((t) => t.core).length;

const byName = new Map(SOL_GPT_TOOL_DEFS.map((t) => [t.name, t]));

export function getSolGptShippedToolCatalog() {
  return {
    product: 'Dark Clawd' as const,
    catalog: 'sol-gpt' as const,
    total: SOL_GPT_TOOL_COUNT,
    core: SOL_GPT_CORE_COUNT,
    specialty: SOL_GPT_TOOL_COUNT - SOL_GPT_CORE_COUNT,
    groups: SOL_GPT_TOOL_GROUPS.map((g) => ({
      ...g,
      count: SOL_GPT_TOOL_DEFS.filter((t) => t.group === g.id).length,
      tools: SOL_GPT_TOOL_DEFS.filter((t) => t.group === g.id).map((t) => t.name),
    })),
    tools: SOL_GPT_TOOL_DEFS,
  };
}

export function availableSolGptTools(defs: SolGptToolDef[] = SOL_GPT_TOOL_DEFS): SolGptToolDef[] {
  return defs.slice();
}

export function getToolDef(name: string): SolGptToolDef | undefined {
  return byName.get(name);
}

export function searchTools(query: string, limit = 25): SolGptToolDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return SOL_GPT_TOOL_DEFS.slice(0, limit);
  const scored = SOL_GPT_TOOL_DEFS.map((t) => {
    const hay = `${t.name} ${t.group} ${t.description}`.toLowerCase();
    let score = 0;
    if (t.name === q) score += 100;
    if (t.name.includes(q)) score += 40;
    if (t.group.includes(q)) score += 20;
    if (hay.includes(q)) score += 10;
    for (const part of q.split(/\s+/)) {
      if (part && hay.includes(part)) score += 3;
    }
    return { t, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.t.name.localeCompare(b.t.name));
  return scored.slice(0, limit).map((x) => x.t);
}

export function coreTools(): SolGptToolDef[] {
  return SOL_GPT_TOOL_DEFS.filter((t) => t.core);
}

export function toolsByGroup(group: ToolGroupId): SolGptToolDef[] {
  return SOL_GPT_TOOL_DEFS.filter((t) => t.group === group);
}
