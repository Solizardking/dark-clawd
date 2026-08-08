/**
 * Monorepo TUI entry for Dark Clawd.
 *
 * Consumers (scripts/run-tui.ts, wizard onboarding) import `runTui` from
 * `../tui/tui.js`. This module is the canonical bridge into the package under
 * `tui/src/` (Ink App + product identity).
 */
import React from "react";
import { render } from "ink";
import { config as dotenvConfig } from "dotenv";

import { App } from "./src/App.js";
import { loadConfigFromEnv } from "./src/config/schema.js";
import { PRODUCT_NAME, PACKAGE_VERSION } from "./src/product.js";

export type RunTuiOptions = {
  /** Gateway / control-plane URL (accepted for openclaw-compatible callers). */
  url?: string;
  token?: string;
  password?: string;
  session?: string;
  /** When true, reserved for auto-delivery to last channel (Dark Clawd ignores). */
  deliver?: boolean;
  thinking?: string;
  /** Optional wake/bootstrap message shown in the session feed. */
  message?: string;
  timeoutMs?: number;
  historyLimit?: number;
};

/**
 * Launch the Dark Clawd Bloomberg TUI.
 * Openclaw-style options are accepted for monorepo compatibility; the live UI
 * is the Ink App in `tui/src/App.tsx`.
 */
export async function runTui(opts: RunTuiOptions = {}): Promise<void> {
  dotenvConfig();
  const envConfig = loadConfigFromEnv();

  if (opts.message?.trim()) {
    // Surface hatch/bootstrap text on stderr so non-TTY onboarding still sees it.
    console.error(`[${PRODUCT_NAME} v${PACKAGE_VERSION}] ${opts.message.trim()}`);
  }

  const { waitUntilExit } = render(
    React.createElement(App, {
      config: {
        heliusKey: envConfig.apiKeys?.HELIUS_API_KEY,
        heliusRpc: envConfig.apiKeys?.HELIUS_RPC_URL,
        birdeyeKey: envConfig.apiKeys?.BIRDEYE_API_KEY,
        grokKey: envConfig.apiKeys?.XAI_API_KEY,
        perplexityKey: envConfig.apiKeys?.PERPLEXITY_API_KEY,
        openRouterKey: envConfig.apiKeys?.OPENROUTER_API_KEY,
        openRouterModel: envConfig.apiKeys?.OPENROUTER_MODEL,
        newsApiKey: envConfig.apiKeys?.NEWS_API_KEY,
        serpApiKey: envConfig.apiKeys?.SERP_API_KEY,
        financialDatasetKey: envConfig.apiKeys?.FINANCIAL_DATASET_API_KEY,
        walletAddress: envConfig.solana?.privateKey,
        autoMode: true,
        openclawd: envConfig.openclawd,
        phoenix: envConfig.phoenix,
        automaton: envConfig.automaton,
      },
    }),
  );

  // Optional timeout for scripted onboarding / CI smoke.
  if (opts.timeoutMs && opts.timeoutMs > 0) {
    await Promise.race([
      waitUntilExit(),
      new Promise<void>((resolve) => {
        setTimeout(resolve, opts.timeoutMs);
      }),
    ]);
    return;
  }

  await waitUntilExit();
}

export { PRODUCT_NAME, PACKAGE_VERSION };
