// ═══════════════════════════════════════════════════════════════════════════════
// DARK CLAWD TUI - Trade automation for Solana + Robinhood Chain tokens
// Paper plans by default; live execution is opt-in and key-gated.
// ═══════════════════════════════════════════════════════════════════════════════

import {
  PACKAGE_NAME,
  PRODUCT_GITHUB_URL,
  PRODUCT_HUB_URL,
  PRODUCT_INSTALL_CURL,
  PRODUCT_NPM_INSTALL,
  PRODUCT_NPX_HELP,
} from '../product.js';

export type TradeChain = 'solana' | 'robinhood';
export type TradeSide = 'buy' | 'sell';
export type TradeMode = 'paper' | 'live';

export interface TradeRequest {
  chain: TradeChain;
  /** Token mint (Solana) or contract address (Robinhood Chain / EVM). */
  token: string;
  side: TradeSide;
  /** Human amount in quote asset (USDC/SOL) for buys, base token for sells. */
  amount: number;
  /** Optional symbol label for UI. */
  symbol?: string;
  slippageBps?: number;
  mode?: TradeMode;
  wallet?: string;
}

export interface TradeLeg {
  venue: string;
  action: string;
  detail: string;
}

export interface TradePlan {
  id: string;
  chain: TradeChain;
  token: string;
  symbol: string;
  side: TradeSide;
  amount: number;
  mode: TradeMode;
  slippageBps: number;
  status: 'planned' | 'simulated' | 'blocked' | 'ready';
  quoteAsset: string;
  estimatedOut?: number | null;
  priceImpactBps?: number | null;
  legs: TradeLeg[];
  warnings: string[];
  createdAt: string;
  automationId?: string;
}

export interface AutomationJob {
  id: string;
  name: string;
  chain: TradeChain;
  token: string;
  side: TradeSide;
  amount: number;
  cadence: 'once' | 'interval' | 'trigger';
  intervalMs?: number;
  trigger?: string;
  mode: TradeMode;
  enabled: boolean;
  lastRunAt?: string | null;
  runs: number;
  plans: TradePlan[];
}

export interface AutomationKitManifest {
  product: string;
  version: string;
  package: string;
  chains: TradeChain[];
  modes: TradeMode[];
  install: {
    curl: string;
    npm: string;
    npx: string;
  };
  sandbox: {
    health: string;
    status: string;
    automations: string;
    tradePlan: string;
  };
  productUrl: string;
  githubUrl: string;
  flyHint: string;
}

const SOLANA_QUOTE = 'So11111111111111111111111111111111111111112'; // wSOL
const USDC_SOL = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const RH_USDC = '0x0000000000000000000000000000000000000000'; // placeholder stable

export const DARK_CLAWD_PRODUCT_URL = PRODUCT_HUB_URL;
export const DARK_CLAWD_GITHUB_URL = PRODUCT_GITHUB_URL;
export const DARK_CLAWD_INSTALL_CURL = PRODUCT_INSTALL_CURL;
export const DARK_CLAWD_NPM = PRODUCT_NPM_INSTALL;
export const DARK_CLAWD_NPX = PRODUCT_NPX_HELP;
export const DARK_CLAWD_PACKAGE = PACKAGE_NAME;

function uid(prefix = 'plan'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeTokenAddress(token: string, chain: TradeChain): string {
  const t = token.trim();
  if (!t) throw new Error('token is required');
  if (chain === 'solana') {
    // base58-ish length guard
    if (t.length < 32 || t.length > 48) {
      throw new Error('Solana token mint looks invalid (expected base58 mint)');
    }
    return t;
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(t)) {
    throw new Error('Robinhood token must be a 0x… EVM address');
  }
  return t.toLowerCase();
}

export function buildAutomationKitManifest(opts?: {
  sandboxBase?: string;
  version?: string;
}): AutomationKitManifest {
  const base = (opts?.sandboxBase || 'http://127.0.0.1:18790').replace(/\/$/, '');
  return {
    product: 'Dark Clawd Automation Kit',
    version: opts?.version || '1.0.0',
    package: DARK_CLAWD_PACKAGE,
    chains: ['solana', 'robinhood'],
    modes: ['paper', 'live'],
    install: {
      curl: DARK_CLAWD_INSTALL_CURL,
      npm: DARK_CLAWD_NPM,
      npx: DARK_CLAWD_NPX,
    },
    sandbox: {
      health: `${base}/health`,
      status: `${base}/api/status`,
      automations: `${base}/api/automations`,
      tradePlan: `${base}/api/trade/plan`,
    },
    productUrl: DARK_CLAWD_PRODUCT_URL,
    githubUrl: DARK_CLAWD_GITHUB_URL,
    flyHint: 'fly launch --config fly.toml && fly deploy',
  };
}

/** Pure plan builder — no network. Used by CLI, sandbox API, and tests. */
export function planTrade(req: TradeRequest): TradePlan {
  const chain = req.chain;
  const token = normalizeTokenAddress(req.token, chain);
  const side = req.side;
  const amount = Number(req.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('amount must be a positive number');
  }
  const mode: TradeMode = req.mode === 'live' ? 'live' : 'paper';
  const slippageBps = Math.min(Math.max(req.slippageBps ?? 50, 1), 5000);
  const symbol = (req.symbol || token.slice(0, 6)).toUpperCase();
  const quoteAsset = chain === 'solana' ? (side === 'buy' ? 'SOL/USDC' : symbol) : 'USDC';

  const warnings: string[] = [];
  if (mode === 'live') {
    warnings.push(
      'Live mode requires wallet keys and never runs without explicit --live confirmation.',
    );
  } else {
    warnings.push('Paper mode: plan only — no broadcast.');
  }

  const legs: TradeLeg[] =
    chain === 'solana'
      ? [
          {
            venue: 'Jupiter',
            action: side === 'buy' ? 'swap_in' : 'swap_out',
            detail:
              side === 'buy'
                ? `Route ${amount} quote → ${symbol} via Jupiter Ultra/aggregator`
                : `Route ${amount} ${symbol} → quote via Jupiter Ultra/aggregator`,
          },
          {
            venue: 'Helius',
            action: 'simulate',
            detail: 'Simulate transaction against Helius RPC before send',
          },
          {
            venue: 'Dark Clawd',
            action: 'agent_guard',
            detail: 'ClawdAgent risk checks (slippage, liquidity, recursion depth)',
          },
        ]
      : [
          {
            venue: 'Robinhood Chain',
            action: side === 'buy' ? 'swap_in' : 'swap_out',
            detail: `Route ${amount} on RH (4663) for ${symbol}`,
          },
          {
            venue: 'Cheshire RH',
            action: 'route',
            detail: 'Prefer bonded/launchpad or Uniswap V3 path via cheshireterminal.ai/rh-launch',
          },
          {
            venue: 'Dark Clawd',
            action: 'agent_guard',
            detail: 'ClawdAgent chain-aware risk checks before any live submit',
          },
        ];

  const status: TradePlan['status'] = mode === 'live' ? 'blocked' : 'planned';
  if (mode === 'live') {
    warnings.push('Live execution is blocked until keys + --confirm are supplied in the runner.');
  }

  return {
    id: uid('plan'),
    chain,
    token,
    symbol,
    side,
    amount,
    mode,
    slippageBps,
    status,
    quoteAsset,
    estimatedOut: null,
    priceImpactBps: null,
    legs,
    warnings,
    createdAt: new Date().toISOString(),
  };
}

/** Optional Jupiter quote enrichment (Solana paper/live prep). Failures keep the plan. */
export async function enrichSolanaQuote(
  plan: TradePlan,
  fetchImpl: typeof fetch = fetch,
): Promise<TradePlan> {
  if (plan.chain !== 'solana') return plan;
  try {
    const inputMint = plan.side === 'buy' ? SOLANA_QUOTE : plan.token;
    const outputMint = plan.side === 'buy' ? plan.token : SOLANA_QUOTE;
    // amount in atomic units is unknown without decimals; use quote API with small unit probe
    const amountAtomic = Math.floor(plan.amount * 1e6); // assume 6 decimals for paper estimate
    const url = new URL('https://quote-api.jup.ag/v6/quote');
    url.searchParams.set('inputMint', inputMint);
    url.searchParams.set('outputMint', outputMint);
    url.searchParams.set('amount', String(Math.max(amountAtomic, 1000)));
    url.searchParams.set('slippageBps', String(plan.slippageBps));
    const res = await fetchImpl(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      return {
        ...plan,
        warnings: [...plan.warnings, `Jupiter quote HTTP ${res.status} — plan remains paper-only`],
      };
    }
    const json = (await res.json()) as {
      outAmount?: string;
      priceImpactPct?: string | number;
    };
    const out = json.outAmount ? Number(json.outAmount) / 1e6 : null;
    const impact =
      json.priceImpactPct != null ? Math.round(Number(json.priceImpactPct) * 100) : null;
    return {
      ...plan,
      status: plan.mode === 'paper' ? 'simulated' : plan.status,
      estimatedOut: Number.isFinite(out as number) ? out : null,
      priceImpactBps: Number.isFinite(impact as number) ? impact : null,
      quoteAsset: plan.side === 'buy' ? plan.symbol : 'SOL',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ...plan,
      warnings: [...plan.warnings, `Jupiter quote skipped: ${message}`],
    };
  }
}

export class AutomationRegistry {
  private jobs = new Map<string, AutomationJob>();

  list(): AutomationJob[] {
    return [...this.jobs.values()];
  }

  get(id: string): AutomationJob | undefined {
    return this.jobs.get(id);
  }

  create(input: {
    name: string;
    chain: TradeChain;
    token: string;
    side: TradeSide;
    amount: number;
    cadence?: AutomationJob['cadence'];
    intervalMs?: number;
    trigger?: string;
    mode?: TradeMode;
  }): AutomationJob {
    const token = normalizeTokenAddress(input.token, input.chain);
    const job: AutomationJob = {
      id: uid('auto'),
      name: input.name.trim() || `auto-${input.chain}`,
      chain: input.chain,
      token,
      side: input.side,
      amount: input.amount,
      cadence: input.cadence || 'once',
      intervalMs: input.intervalMs,
      trigger: input.trigger,
      mode: input.mode === 'live' ? 'live' : 'paper',
      enabled: true,
      lastRunAt: null,
      runs: 0,
      plans: [],
    };
    this.jobs.set(job.id, job);
    return job;
  }

  /** Run one cycle: build plan and attach (paper by default). */
  run(id: string): TradePlan {
    const job = this.jobs.get(id);
    if (!job) throw new Error(`automation not found: ${id}`);
    if (!job.enabled) throw new Error(`automation disabled: ${id}`);
    const plan = planTrade({
      chain: job.chain,
      token: job.token,
      side: job.side,
      amount: job.amount,
      mode: job.mode,
    });
    plan.automationId = job.id;
    job.plans = [plan, ...job.plans].slice(0, 50);
    job.runs += 1;
    job.lastRunAt = new Date().toISOString();
    return plan;
  }

  disable(id: string): void {
    const job = this.jobs.get(id);
    if (!job) throw new Error(`automation not found: ${id}`);
    job.enabled = false;
  }
}

/** Shared registry for sandbox process. */
export const globalAutomationRegistry = new AutomationRegistry();

export function formatTradePlan(plan: TradePlan): string {
  const lines = [
    `╔══ TRADE PLAN ${plan.id} ══╗`,
    ` chain     ${plan.chain}`,
    ` token     ${plan.token}`,
    ` symbol    ${plan.symbol}`,
    ` side      ${plan.side}`,
    ` amount    ${plan.amount}`,
    ` mode      ${plan.mode}`,
    ` status    ${plan.status}`,
    ` slippage  ${plan.slippageBps} bps`,
    ` quote     ${plan.quoteAsset}`,
    plan.estimatedOut != null ? ` est.out   ${plan.estimatedOut}` : null,
    plan.priceImpactBps != null ? ` impact    ${plan.priceImpactBps} bps` : null,
    ' legs:',
    ...plan.legs.map((l) => `  · [${l.venue}] ${l.action} — ${l.detail}`),
    ' warnings:',
    ...plan.warnings.map((w) => `  ! ${w}`),
    ` created   ${plan.createdAt}`,
    '╚════════════════════════════╝',
  ].filter(Boolean) as string[];
  return lines.join('\n');
}

// Keep USDC constants referenced for future live routing
void USDC_SOL;
void RH_USDC;
