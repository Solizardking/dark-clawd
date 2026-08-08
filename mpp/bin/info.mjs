#!/usr/bin/env node
console.log(`@x402solana/solana-mpp — Solana Payment Integration for MPP (HTTP 402)

⚠ Unscoped npm package "solana-mpp" is a *different* project (sendaifun).
  Always install the scoped package for Dark Clawd.

Install (consumers):
  npm install @x402solana/solana-mpp
  # optional peers for full on-chain charge:
  npm install mppx @solana/kit

Install (from this monorepo — do NOT run "npm install solana-mpp"):
  cd mpp && npm install && npm run build
  npm install mppx            # optional peer for /server and /client
  # or from repo root:
  #   npm install ./mpp mppx

Dark Clawd paper path (no peers):
  import { createDarkClawdMpp } from '@x402solana/solana-mpp/dark-clawd'
  // full charge (needs peers):
  // import { Mppx, solana, Store } from '@x402solana/solana-mpp/server'

Hub: https://cheshireterminal.ai/dark-clawd
CLI product install (GitHub — hub /api may return 402 until proxied free):
  curl -fsSL https://raw.githubusercontent.com/Solizardking/dark-clawd/main/tui/install.sh | bash
`);
