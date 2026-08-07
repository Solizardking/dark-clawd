# OpenClawd Dark Clawd TUI

Dark Clawd is the OpenClawd Bun + Ink terminal app for Solana market surveillance, wallet context, autonomous AI analysis, and holder operations. The default experience is the **CLAWD Market View**: a Bloomberg-style terminal surface with live tickers, a candlestick chart, order book, heatmap, top movers, network stats, activity, and agent controls.

```
┌──────────────────────────────────────────────────────────────────────────────┐
└─🦞 CLAWD │ MARKET VIEW────────────────────────────Uptime: 00:04:35 │ 8:36 AM─┘
┌──────────────────────────────────────────────────────────────────────────────┐
└─SOL $150.25 +2.34% │ BONK $0.00002345 +5.67% │ WIF $2.85 -1.20% │ JUP +3.80%┘

 ┌──────────────────────────────────────────────┐  ┌──────────────────────────┐
 │ SOL/USDC │ 1H              $132.97 (-11.36%)│  │ ORDER BOOK       SOL/USDC │
 │ 152.42 ▒██▒▒││││                           │  │ DEPTH    PRICE      SIZE  │
 │        ▒█▒█▒▒││ │   ·                      │  │ ██████  150.288   260.26 │
 │          │▒│ ▒█▒▒▒││ ││██▒▒·│              │  │ ██████  150.278   960.39 │
 │ VOL▁▃▄▄▃▂▂▃▃▃▁▃▃▄▃▂▃▂▄▂▃▃▃▂▂▃▂▂▄▃▁▂▂▃▁   │  │ ─── SPREAD: 0.0405 ───    │
 │ O: 134.42     H: 135.72     L: 131.50      │  │ ███     150.188   422.84 │
 └──────────────────────────────────────────────┘  └──────────────────────────┘

 ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────────┐
 │ MARKET HEATMAP       │ │ TOP MOVERS           │ │ LIVE FEED          ● LIVE│
 │ ╭────╮ ╭────╮ ╭────╮ │ │ ▲ BONK +15.3%        │ │ 🐋 5,000 SOL to exchange│
 │ ╰+3.5╯ ╰+12╯ ╰+8.3╯ │ │ ▲ WIF  +12.5%        │ │ 📈 SOL crossed $150     │
 │ ╰-4.8╯ ╰-1.5╯ ╰-8.2╯│ │ ▼ MNGO -12.5%        │ │ ⚡ BONK divergence       │
 └──────────────────────┘ └──────────────────────┘ └──────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
└─[1] MARKET │ [2] TRADING │ [3] PORTFOLIO │ [4] ANALYTICS │ [5] AGENT │ [6] AUTOMATON─┘
```

## Features

- **CLAWD market dashboard** with ticker tape, SOL/USDC chart, order book, spread, volume bars, heatmap, top movers, live feed, network stats, and activity stream.
- **Six terminal views**: Market, Trading, Portfolio, Analytics, Agent, and **Automaton** (sovereign runtime bridge).
- **Autonomous agent loop** through `ClawdAgent`, with configurable auto/interactive mode and recursive market thoughts.
- **Automaton integration** via sibling `../automaton` — constitution laws, bridge status, CLI `clawd automaton …`.
- **Provider integrations** for Helius, Birdeye, Phoenix perps through the Rise SDK, xAI Grok, Perplexity, OpenRouter, News API, SERP API, and Financial Datasets.
- **Solana wallet tools** for local wallet creation, address display, balance lookup, and portfolio context.
- **Terminal-native controls** with number-key navigation, refresh/help shortcuts, and an agent command surface.
- **OpenClawd backend links** for `solanaclawd.com`, `/vault`, voice, vim-style command flow, trading routes, staking, mining, and agent API surfaces.

## OpenClawd Mapping

| Surface | Route / API |
| --- | --- |
| Site | `https://solanaclawd.com` |
| Holder vault | `https://solanaclawd.com/vault` |
| Chat, voice, and vim command surfaces | `https://solanaclawd.com/chat` |
| Trading console | `https://solanaclawd.com/trading` |
| Agent API | `https://agents.openclawd.biz` |
| Local config module | `src/openclawd.ts` |
| Automaton (local) | sibling `../automaton` · view **[6]** · `/automaton` |

## Automaton bridge

```bash
bun run automaton:status
bun run automaton:constitution
bun run automaton:paths
# full runtime (from monorepo)
bun run automaton:install && bun run automaton:build
```

TUI: press **`6`** (or **`A`**) for the Automaton panel. Agent chat: `/automaton`, `/automaton constitution`.

See also monorepo docs: [`../docs/AUTOMATON_INTEGRATION.md`](../docs/AUTOMATON_INTEGRATION.md).

## Quick Start

### One-shot install via npm (recommended)

```bash
# Global install (Node.js ≥18; Bun not required at runtime)
npm install -g @openclawdsolana/dark-clawd

# Bins: dark-clawd · clawd · clawd-tui
dark-clawd --help
dark-clawd status
dark-clawd run
```

Or use the installer script (prefers npm, falls back to bun / npx):

```bash
curl -fsSL https://cheshireterminal.ai/api/dark-clawd/install.sh | bash
# local copy: bash install.sh
dark-clawd --help
```

Hub: **[https://cheshireterminal.ai/dark-clawd](https://cheshireterminal.ai/dark-clawd)**

### From source (maintainers)

```bash
cd tui   # package root (preferred npm surface)
bun install
bun run build          # produces dist/cli.js with Node shebang for npm bins
cp .env.example .env
bun run run            # dev: Bun runs TypeScript sources
# after build: node dist/cli.js --help
```

The TUI can boot without every key configured. Missing providers are shown as disconnected and their dependent commands fail closed.

## Commands

```bash
bun run run                         # Start CLAWD TUI
bun run src/cli.tsx run --auto      # Autonomous mode
bun run src/cli.tsx run --interactive
bun run src/cli.tsx run --wallet <address>
bun run src/cli.tsx run --headless  # Daemon mode

bun run status                      # API configuration status
bun run setup                       # Setup instructions
bun run wallet -- --create          # Create local wallet
bun run wallet -- --balance         # Show wallet balance
bun run wallet -- --address         # Show wallet address

# Automaton sovereign runtime bridge (../automaton)
bun run automaton:status
bun run automaton:constitution
bun run automaton:paths

# Automation kit
dark-clawd trade --chain solana --token <mint> --side buy --amount 0.1
dark-clawd trade --chain robinhood --token 0x… --side buy --amount 10
dark-clawd automate create --name dca --chain solana --token <mint> --amount 0.05
dark-clawd automate list
dark-clawd kit
dark-clawd sandbox                  # HTTP sandbox API (Fly / local)
```

When installed from a built package, the binaries are:

```bash
dark-clawd run
clawd run
clawd-tui run
```

## Automation kit & Fly sandbox

Dark Clawd ships an **automation kit** for Solana + Robinhood token trade plans (paper by default) and a **sandbox HTTP API** for remote inspection of agents/automations.

```bash
# Local sandbox
dark-clawd sandbox --port 18790
# → GET  /health  /api/status  /api/kit  /api/automations  /api/mpp
# → POST /api/trade/plan  /api/mpp/charge  /api/mpp/trade/plan
```

### Fly Machine

```bash
cd tui
fly launch --copy-config   # uses fly.toml
fly deploy
# default app hint: dark-clawd-sandbox.fly.dev
```

`Dockerfile` runs `dark-clawd sandbox` on port `18790` with health checks on `/health`.

## Solana MPP (HTTP 402)

Machine Payments Protocol over SPL — pay-per-call charges and prepaid sessions.

```bash
npm install solana-mpp mppx
```

Local package: `../mpp` (vendors `@solana/mpp` 0.5 charge methods + Dark Clawd paper/live helpers).

| Intent | Use |
| --- | --- |
| **Charge** | One-time payment per API call / trade plan |
| **Session** | Deposit → metered requests → top-up → refund on close |

```ts
import { createDarkClawdMpp } from 'solana-mpp/dark-clawd'

const mpp = createDarkClawdMpp({
  recipient: process.env.MPP_RECIPIENT!,
  mode: 'paper', // or 'live'
  network: 'mainnet-beta',
  currency: 'USDC',
})

const result = await mpp.charge({ amount: '0.01', description: 'trade plan' })
// result.status === 402 → pay → retry with Authorization: Payment <credential>
```

Sandbox paid trade plan:

```bash
curl -sX POST http://127.0.0.1:18790/api/mpp/trade/plan \
  -H 'content-type: application/json' \
  -d '{"chain":"solana","token":"So11111111111111111111111111111111111111112","side":"buy","amount":0.1}'
# → 402 + mpp challenge (paper)
```

See [mpp/README.md](../mpp/README.md) for full Solana MPP docs.

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `1` | Market view |
| `2` | Trading view |
| `3` | Portfolio view |
| `4` | Analytics view |
| `5` | Agent view |
| `Tab` | Cycle display mode |
| `H` | Help |
| `R` | Refresh |
| `Q` / `Esc` | Quit |

## Agent Commands

| Command | Description |
| --- | --- |
| `/help` | Show available commands |
| `/analyze` | Run market analysis |
| `/trending` | Show trending Solana tokens |
| `/wallet` | Display wallet context |
| `/news` | Fetch crypto news |
| `/search <query>` | Search through Grok |
| `/research <topic>` | Research through Perplexity |
| `/perps` | List Phoenix perpetual futures markets |
| `/perp <symbol>` | Inspect one Phoenix perpetual futures market |
| `/prophecy` | Generate Dark Clawd predictions |
| `/clear` | Clear agent messages |

## Configuration

Create `.env` from `.env.example` and add the keys you want to enable:

```env
HELIUS_API_KEY=
HELIUS_RPC_URL=
BIRDEYE_API_KEY=
XAI_API_KEY=
PERPLEXITY_API_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=minimax/minimax-m2.7
OPENCLAWD_SITE_URL=https://solanaclawd.com
OPENCLAWD_BACKEND_URL=https://solanaclawd.com
OPENCLAWD_AGENT_API_URL=https://agents.openclawd.biz
OPENCLAWD_VAULT_URL=https://solanaclawd.com/vault
OPENCLAWD_VOICE_URL=https://solanaclawd.com/chat
OPENCLAWD_VIM_URL=https://solanaclawd.com/chat
PHOENIX_API_URL=https://perp-api.phoenix.trade
PHOENIX_RPC_URL=https://api.mainnet-beta.solana.com
PHOENIX_WS_ENABLED=false
NEWS_API_KEY=
SERP_API_KEY=
FINANCIAL_DATASET_API_KEY=
```

| Service | Enables |
| --- | --- |
| Helius | Solana RPC, DAS, balances, transactions |
| Birdeye | Token prices, OHLCV, trending tokens, market data |
| Phoenix Perps | Rise SDK exchange metadata, market stats, and perps commands |
| xAI Grok | Search and market reasoning |
| Perplexity | Research workflows |
| OpenRouter | Model-backed reasoning |
| News API | Crypto news feed |
| SERP API | Search result enrichment |
| Financial Datasets | Additional market and sentiment data |

## Project Layout

Package root is `tui/` inside the workspace (product **Dark Clawd**; workspace folder may still be `dark-ralph/`).

```text
tui/
├── package.json              # @openclawdsolana/dark-clawd
├── bun.lock
├── tsconfig.json
├── .env.example              # committed template (never commit .env)
├── .eslintrc.cjs
├── install.sh                # one-shot installer
├── Dockerfile                # sandbox: dark-clawd sandbox :18790
├── fly.toml                  # dark-clawd-sandbox (iad)
├── LICENSE
├── README.md
├── dist/                     # build: cli.js · index.js · yoga.wasm
└── src/
    ├── cli.tsx               # run / setup / status / wallet / trade / automate / sandbox
    ├── App.tsx
    ├── index.ts
    ├── openclawd.ts          # OPENCLAWD_* defaults + routes
    ├── config/
    │   ├── schema.ts
    │   └── themes.ts
    ├── engine/
    │   └── clawd-agent.ts
    ├── components/
    │   ├── BloombergDashboard.tsx
    │   ├── PriceChart.tsx
    │   ├── OrderBook.tsx
    │   ├── Heatmap.tsx
    │   ├── ActivityFeed.tsx
    │   └── …
    ├── services/
    │   ├── birdeye-api.ts
    │   ├── birdeye-websocket.ts
    │   ├── birdeye.ts
    │   ├── market-data-provider.ts
    │   ├── helius.ts
    │   ├── phoenix-perps.ts
    │   ├── ai-providers.ts
    │   ├── news-search.ts
    │   ├── trade-automation.ts
    │   ├── sandbox-server.ts
    │   ├── mpp-payments.ts
    │   └── index.ts
    ├── skills/
    │   └── solana-wallet.ts
    ├── rebrand.test.ts
    └── trade-automation.test.ts
```

Workspace docs (parent): `../docs/BIRDEYE_INTEGRATION.md`, `../docs/OPENCLAWD_ADAPTATION.md`, `../docs/X_ARTICLE.md`.  
Root TUI twin: `../src/` (keep OpenClawd + Birdeye wiring aligned before publish).

## Built With

- Bun
- Ink
- React
- `@solana/web3.js`
- `@ellipsis-labs/rise`
- Zod
- Commander

## License

MIT
