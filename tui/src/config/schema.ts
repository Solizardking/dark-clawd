// ═══════════════════════════════════════════════════════════════════════════════
// DARK CLAWD TUI - Configuration Schema
// ═══════════════════════════════════════════════════════════════════════════════

import { z } from 'zod';
import {
  DEFAULT_PHOENIX_API_URL,
  DEFAULT_PHOENIX_RPC_URL,
} from '../services/phoenix-perps.js';
import {
  OPENCLAWD_AGENT_API_URL,
  OPENCLAWD_BACKEND_URL,
  OPENCLAWD_SITE_URL,
  getOpenClawdRouteUrl,
} from '../openclawd.js';

// API Keys Schema
export const ApiKeysSchema = z.object({
  HELIUS_API_KEY: z.string().optional(),
  HELIUS_RPC_URL: z.string().url().optional(),
  BIRDEYE_API_KEY: z.string().optional(),
  XAI_API_KEY: z.string().optional(),
  PERPLEXITY_API_KEY: z.string().optional(),
  NEWS_API_KEY: z.string().optional(),
  SERP_API_KEY: z.string().optional(),
  FINANCIAL_DATASET_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default('minimax/minimax-m2.7'),
});

export const OpenClawdConfigSchema = z.object({
  siteUrl: z.string().url().default(OPENCLAWD_SITE_URL),
  backendUrl: z.string().url().default(OPENCLAWD_BACKEND_URL),
  agentApiUrl: z.string().url().default(OPENCLAWD_AGENT_API_URL),
  vaultUrl: z.string().url().default(getOpenClawdRouteUrl('vault')),
  voiceUrl: z.string().url().default(getOpenClawdRouteUrl('chat')),
  vimUrl: z.string().url().default(getOpenClawdRouteUrl('chat')),
});

export const PhoenixConfigSchema = z.object({
  apiUrl: z.string().url().default(DEFAULT_PHOENIX_API_URL),
  rpcUrl: z.string().url().default(DEFAULT_PHOENIX_RPC_URL),
  wsEnabled: z.boolean().default(false),
});

// Solana Config Schema
export const SolanaConfigSchema = z.object({
  network: z.enum(['mainnet-beta', 'devnet', 'testnet']).default('mainnet-beta'),
  rpcUrl: z.string().url().optional(),
  privateKey: z.string().optional(),
});

// Clawd Agent Config Schema
export const ClawdConfigSchema = z.object({
  autoMode: z.boolean().default(true),
  recursionDepth: z.number().min(1).max(10).default(5),
  thoughtInterval: z.number().min(5000).max(60000).default(15000),
  maxIterations: z.number().min(0).max(1000).default(10),
  personality: z.enum(['cryptic', 'analytical', 'aggressive', 'cautious']).default('cryptic'),
});

/**
 * Vendored Automaton sovereign runtime (../automaton relative to tui/).
 */
export const AutomatonConfigSchema = z.object({
  enabled: z.boolean().default(true),
  /** Directory name/path; default resolves to sibling ../automaton */
  packageDir: z.string().default('../automaton'),
  showInBoot: z.boolean().default(true),
  tuiViewEnabled: z.boolean().default(true),
  conwayApiUrl: z.string().url().optional(),
});

// Error Handling Schema
export const ErrorHandlingSchema = z.object({
  strategy: z.enum(['retry', 'skip', 'abort']).default('skip'),
  maxRetries: z.number().min(0).max(10).default(3),
  retryDelayMs: z.number().min(1000).max(60000).default(5000),
});

// Full Config Schema
export const ConfigSchema = z.object({
  apiKeys: ApiKeysSchema,
  openclawd: OpenClawdConfigSchema,
  phoenix: PhoenixConfigSchema,
  solana: SolanaConfigSchema,
  clawd: ClawdConfigSchema,
  automaton: AutomatonConfigSchema,
  errorHandling: ErrorHandlingSchema,
});

// Types
export type ApiKeys = z.infer<typeof ApiKeysSchema>;
export type OpenClawdConfig = z.infer<typeof OpenClawdConfigSchema>;
export type PhoenixConfig = z.infer<typeof PhoenixConfigSchema>;
export type SolanaConfig = z.infer<typeof SolanaConfigSchema>;
export type ClawdConfig = z.infer<typeof ClawdConfigSchema>;
export type AutomatonConfig = z.infer<typeof AutomatonConfigSchema>;
export type ErrorHandling = z.infer<typeof ErrorHandlingSchema>;
export type Config = z.infer<typeof ConfigSchema>;

// Default Configuration
export const defaultConfig: Config = {
  apiKeys: {
    OPENROUTER_MODEL: 'minimax/minimax-m2.7',
  },
  openclawd: {
    siteUrl: OPENCLAWD_SITE_URL,
    backendUrl: OPENCLAWD_BACKEND_URL,
    agentApiUrl: OPENCLAWD_AGENT_API_URL,
    vaultUrl: getOpenClawdRouteUrl('vault'),
    voiceUrl: getOpenClawdRouteUrl('chat'),
    vimUrl: getOpenClawdRouteUrl('chat'),
  },
  phoenix: {
    apiUrl: DEFAULT_PHOENIX_API_URL,
    rpcUrl: DEFAULT_PHOENIX_RPC_URL,
    wsEnabled: false,
  },
  solana: {
    network: 'mainnet-beta',
  },
  clawd: {
    autoMode: true,
    recursionDepth: 5,
    thoughtInterval: 15000,
    maxIterations: 10,
    personality: 'cryptic',
  },
  automaton: {
    enabled: true,
    packageDir: '../automaton',
    showInBoot: true,
    tuiViewEnabled: true,
  },
  errorHandling: {
    strategy: 'skip',
    maxRetries: 3,
    retryDelayMs: 5000,
  },
};

// Load config from environment
export function loadConfigFromEnv(): Partial<Config> {
  const solanaRpcUrl = process.env.SOLANA_RPC_URL || process.env.HELIUS_RPC_URL;
  const phoenixRpcUrl = process.env.PHOENIX_RPC_URL || solanaRpcUrl || DEFAULT_PHOENIX_RPC_URL;

  return {
    apiKeys: {
      HELIUS_API_KEY: process.env.HELIUS_API_KEY,
      HELIUS_RPC_URL: process.env.HELIUS_RPC_URL,
      BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY,
      XAI_API_KEY: process.env.XAI_API_KEY,
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
      NEWS_API_KEY: process.env.NEWS_API_KEY,
      SERP_API_KEY: process.env.SERP_API_KEY,
      FINANCIAL_DATASET_API_KEY: process.env.FINANCIAL_DATASET_API_KEY,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'minimax/minimax-m2.7',
    },
    openclawd: {
      siteUrl: process.env.OPENCLAWD_SITE_URL || OPENCLAWD_SITE_URL,
      backendUrl: process.env.OPENCLAWD_BACKEND_URL || OPENCLAWD_BACKEND_URL,
      agentApiUrl: process.env.OPENCLAWD_AGENT_API_URL || OPENCLAWD_AGENT_API_URL,
      vaultUrl: process.env.OPENCLAWD_VAULT_URL || getOpenClawdRouteUrl('vault'),
      voiceUrl: process.env.OPENCLAWD_VOICE_URL || getOpenClawdRouteUrl('chat'),
      vimUrl: process.env.OPENCLAWD_VIM_URL || getOpenClawdRouteUrl('chat'),
    },
    phoenix: {
      apiUrl: process.env.PHOENIX_API_URL || DEFAULT_PHOENIX_API_URL,
      rpcUrl: phoenixRpcUrl,
      wsEnabled: process.env.PHOENIX_WS_ENABLED === 'true',
    },
    solana: {
      network: (process.env.SOLANA_NETWORK as 'mainnet-beta' | 'devnet' | 'testnet') || 'mainnet-beta',
      rpcUrl: solanaRpcUrl,
      privateKey: process.env.SOLANA_PRIVATE_KEY,
    },
    clawd: {
      autoMode: process.env.CLAWD_AUTO_MODE === 'true',
      recursionDepth: parseInt(process.env.CLAWD_RECURSION_DEPTH || '5'),
      thoughtInterval: parseInt(process.env.CLAWD_THOUGHT_INTERVAL || '15000'),
      maxIterations: parseInt(process.env.CLAWD_MAX_ITERATIONS || '10'),
      personality: 'cryptic',
    },
    automaton: {
      enabled: process.env.AUTOMATON_ENABLED !== 'false',
      packageDir: process.env.AUTOMATON_PACKAGE_DIR || '../automaton',
      showInBoot: process.env.AUTOMATON_SHOW_IN_BOOT !== 'false',
      tuiViewEnabled: process.env.AUTOMATON_TUI_VIEW !== 'false',
      conwayApiUrl: process.env.CONWAY_API_URL,
    },
    errorHandling: defaultConfig.errorHandling,
  };
}
