<p align="center">
  <img src="docs/assets/dark-clawd-hero.svg" alt="Dark Clawd — forged from Ralph on Solana" width="920" />
</p>

<p align="center">
  <a href="https://github.com/Solizardking/dark-clawd"><img src="https://img.shields.io/github/stars/Solizardking/dark-clawd?style=for-the-badge" alt="GitHub stars"></a>
  <a href="https://github.com/Solizardking/dark-clawd/releases/tag/v1.1.1"><img src="https://img.shields.io/badge/release-v1.1.1-blue?style=for-the-badge" alt="v1.1.1"></a>
  <a href="https://www.npmjs.com/package/@x402solana/dark-clawd"><img src="https://img.shields.io/npm/v/@x402solana/dark-clawd?style=for-the-badge" alt="npm"></a>
  <a href="docs/SOL_GPT_TOOLS.md"><img src="https://img.shields.io/badge/tools-171-14F195?style=for-the-badge&labelColor=0b1220" alt="171 tools"></a>
  <a href="docs/SOL_GPT_TOOLS.md"><img src="https://img.shields.io/badge/core-122-9945FF?style=for-the-badge&labelColor=0b1220" alt="122 core"></a>
  <a href="https://cheshireterminal.ai/dark-clawd"><img src="https://img.shields.io/badge/Hub-cheshireterminal.ai-8A2BE2?style=for-the-badge" alt="Product hub"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

## Install (live on npm)

**Public package:** [`@x402solana/dark-clawd@1.1.1`](https://www.npmjs.com/package/@x402solana/dark-clawd) · **Node ≥18** · Bun not required for consumers

```bash
# Preferred — global install from the public registry
npm install -g @x402solana/dark-clawd

# Verify
dark-clawd --help
dark-clawd welcome
dark-clawd status
```

| | |
|--|--|
| **Package** | `@x402solana/dark-clawd` (`latest` → `1.1.1`) |
| **Bins** | `dark-clawd` · `clawd` · `clawd-tui` (all → `dist/cli.js`, Node shebang) |
| **Runtime** | Node.js ≥18 (no Bun at install or runtime) |
| **Hub** | [cheshireterminal.ai/dark-clawd](https://cheshireterminal.ai/dark-clawd) |
| **GitHub** | [github.com/Solizardking/dark-clawd](https://github.com/Solizardking/dark-clawd) |
| **npm** | [npmjs.com/package/@x402solana/dark-clawd](https://www.npmjs.com/package/@x402solana/dark-clawd) |
| **Release** | [v1.1.1](https://github.com/Solizardking/dark-clawd/releases/tag/v1.1.1) |
| **Hub handoff** | [`darkclawd.md`](darkclawd.md) — wire the product client on Cheshire Terminal |

### Alternate install paths

```bash
# One-shot installer (GitHub raw — preferred; free)
curl -fsSL https://raw.githubusercontent.com/Solizardking/dark-clawd/main/tui/install.sh | bash

# Hub installer (optional — may return HTTP 402 until route is free)
# curl -fsSL https://cheshireterminal.ai/api/dark-clawd/install.sh | bash

# Release tarball mirror (works offline from npm registry)
npm install -g https://github.com/Solizardking/dark-clawd/releases/download/v1.1.1/x402solana-dark-clawd-1.1.1.tgz

# One-off without global install
npx @x402solana/dark-clawd --help
```

### First commands after install

```bash
dark-clawd welcome          # hub · GitHub · install · next steps
dark-clawd tools            # 171 SOL GPT tools catalog
dark-clawd agent            # OpenRouter multi-turn tool loop (needs OPENROUTER_API_KEY)
dark-clawd run              # Bloomberg-style TUI
dark-clawd setup            # interactive env wizard
```

> **Publish surface:** package is built and published from [`tui/`](tui/) (`prepack` builds `dist/cli.js` + Node shebang).  
> **Hub client work:** give agents [`darkclawd.md`](darkclawd.md) to implement/support [cheshireterminal.ai/dark-clawd](https://cheshireterminal.ai/dark-clawd).

---

```
          ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
        ▐█▌  ░▒▓█  D A R K   C L A W D  █▓▒░   · SOLANA · ONLINE  ▐█▌
          ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ██████╗  █████╗ ██████╗ ██╗  ██╗     ██████╗██╗      █████╗ ██╗    ██╗██████╗ ║
║   ██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝    ██╔════╝██║     ██╔══██╗██║    ██║██╔══██╗║
║   ██║  ██║███████║██████╔╝█████╔╝     ██║     ██║     ███████║██║ █╗ ██║██║  ██║║
║   ██║  ██║██╔══██║██╔══██╗██╔═██╗     ██║     ██║     ██╔══██║██║███╗██║██║  ██║║
║   ██████╔╝██║  ██║██║  ██║██║  ██╗    ╚██████╗███████╗██║  ██║╚███╔███╔╝██████╔╝║
║   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝     ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═════╝ ║
║                                                                               ║
║                         🦞  T E R M I N A L   I N T E L  🦞                   ║
║                                                                               ║
║              ◈  forged from Ralph on Solana  ·  OpenClawd lineage  ◈          ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

```
  frame 0 ░░░░░░░░░░   frame 1 ▒▒▒▒▒▒▒▒▒▒   frame 2 ▓▓▓▓▓▓▓▓▓▓   frame 3 ██████████
  ░ CLAWD ░            ▒ CLAWD ▒            ▓ CLAWD ▓            █ CLAWD █
  ░●······░            ▒·●·····▒            ▓··●····▓            █···●···█
  ░·······░  boot…     ▒·······▒  link…     ▓·······▓  sync…     █·······█  LIVE
```

<p align="center">
  <strong>DARK CLAWD</strong> — Autonomous Solana Terminal Intelligence<br/>
  <em>Bloomberg TUI · 171 SOL GPT tools · OpenRouter agent harness</em><br/>
  <em>Forged from Ralph on Solana · OpenClawd terminal layer</em>
</p>

> *"The chain never sleeps. Neither does the claw."*

**Dark Clawd** is the OpenClawd terminal intelligence layer — a Bloomberg-style TUI, **171 non-custodial SOL GPT tools**, and an **OpenRouter multi-turn agent harness** for Solana market surveillance, wallet context, Phoenix/Imperial perps, AI analysis, and holder operations.

| | |
|--|--|
| **npm** | `@x402solana/dark-clawd@1.1.1` |
| **Bins** | `dark-clawd` · `clawd` · `clawd-tui` |
| **Hub** | [cheshireterminal.ai/dark-clawd](https://cheshireterminal.ai/dark-clawd) |
| **Repo** | [github.com/Solizardking/dark-clawd](https://github.com/Solizardking/dark-clawd) |
| **Release** | [v1.1.1](https://github.com/Solizardking/dark-clawd/releases/tag/v1.1.1) |

**Lineage:** forged from **Ralph** on Solana — same recursive OODA heart, darker shell, claw-forward identity. Workspace lineage path: `dark-ralph` → Dark Clawd; OODA prompt: [`agent/RALPH.md`](agent/RALPH.md).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ████████████████████████████████████████████████████████████████████████████ │
│  █ █████ DARK CLAWD ● OPERATIONAL ████ Uptime: 00:04:35 ████ 8:36 AM ██████ │
│  ████████████████████████████████████████████████████████████████████████████ │
│  SOL $150.25 +2.34% │ BONK $0.00002345 +5.67% │ WIF $2.85 -1.20% │ JUP +3.80│
│ ┌────────────────────────────────────────┐ ┌────────────────────────────────┐ │
│ │ SOL/USDC │ 1H           $132.97        │ │ ORDER BOOK        SOL/USDC    │ │
│ │ 152.42 ▒██▒▒││││                    █  │ │ DEPTH  PRICE      SIZE       │ │
│ │       ▒█▒█▒▒││ │   ·                 ██│ │ ██████ 150.288   260.26      │ │
│ │         │▒│ ▒█▒▒▒││ ││██▒▒·│         ██│ │ ██████ 150.278   960.39      │ │
│ │ VOL▁▃▄▄▃▂▂▃▃▃▁▃▃▄▃▂▃▂▄▂▃▃▃▂▂▃▂▂▄▃▁▂▂▃▁│ │ ── SPREAD: 0.0405 ──          │ │
│ └────────────────────────────────────────┘ └────────────────────────────────┘ │
│ [1] MARKET [2] TRADING [3] PORTFOLIO [4] ANALYTICS [5] AGENT                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🦞 SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DARK CLAWD ECOSYSTEM  v1.1.1                         │
│         cheshireterminal.ai/dark-clawd  ·  @x402solana/dark-clawd           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │  BLOOMBERG TUI   │  │  OPENROUTER      │  │  SOL GPT TOOL CATALOG    │   │
│  │  dark-clawd run  │  │  AGENT HARNESS   │  │  171 tools (122 core)    │   │
│  │  Ink + React     │  │  dark-clawd agent│  │  dark-clawd tools        │   │
│  │  Market/Perps/   │  │  multi-turn loop │  │  Phoenix 23 · Imperial 32│   │
│  │  Automaton views │  │  core tools on   │  │  Tracker 60 · Helius 8   │   │
│  └────────┬─────────┘  │  every turn      │  │  + market/wallet/trade   │   │
│           │            └────────┬─────────┘  └────────────┬─────────────┘   │
│           └─────────────────────┼──────────────────────────┘                │
│                                 ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  SERVICES  Birdeye · Helius · Phoenix · Imperial · Solana Tracker    │   │
│  │            OpenRouter · Grok · Perplexity · DFlow · Browser Use      │   │
│  │  CUSTODY   prepare_* = user-signed only · server never holds keys    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  SUBSYSTEMS  automaton/ · agent/ (Ralph OODA) · mpp/ · llm-wiki-tang (Fly)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 QUICK START

Install is at the **[top of this README](#install-live-on-npm)** — package is live on npm as `@x402solana/dark-clawd@1.1.1`.  
Hub client handoff for Cheshire: [`darkclawd.md`](darkclawd.md).

| Surface | URL |
|---------|-----|
| **Product hub** | [cheshireterminal.ai/dark-clawd](https://cheshireterminal.ai/dark-clawd) |
| **GitHub** | [github.com/Solizardking/dark-clawd](https://github.com/Solizardking/dark-clawd) |
| **npm** | [`@x402solana/dark-clawd`](https://www.npmjs.com/package/@x402solana/dark-clawd) |
| **Release** | [v1.1.1](https://github.com/Solizardking/dark-clawd/releases/tag/v1.1.1) |
| **Research API (Fly)** | [https://dark-clawd-research.fly.dev](https://dark-clawd-research.fly.dev) · [`GET /health`](https://dark-clawd-research.fly.dev/health) |
| **Tools docs** | [`docs/SOL_GPT_TOOLS.md`](docs/SOL_GPT_TOOLS.md) |
| **Hub handoff** | [`darkclawd.md`](darkclawd.md) |

### First commands (after `npm install -g @x402solana/dark-clawd`)

```bash
# bins: dark-clawd · clawd · clawd-tui
dark-clawd welcome
dark-clawd --help
dark-clawd status
dark-clawd setup

# 171 SOL GPT tools
dark-clawd tools
dark-clawd tools list --group phoenix
dark-clawd tools search wallet
dark-clawd tools run get_price --arg mint=<MINT>
dark-clawd tools run search_tools --arg query=imperial

# OpenRouter agent harness (multi-turn tool loop)
export OPENROUTER_API_KEY=sk-or-…          # https://openrouter.ai/settings/keys
dark-clawd agent
dark-clawd agent -m poolside/laguna-s-2.1:free -p "What is trending on Solana?"
dark-clawd agent --wallet <addr> --max-steps 12

# Bloomberg TUI
dark-clawd run
dark-clawd run --auto
dark-clawd run --wallet <addr>
```

### Local development

```bash
git clone https://github.com/Solizardking/dark-clawd.git
cd dark-clawd
bun install
# optional: copy keys into .env / tui/.env
bun run run

# preferred package surface (what ships to npm)
cd tui && bun install && bun run build && node dist/cli.js tools
```

### Python OODA loop (Ralph core)

```bash
python3 agent/loop.py --ticks 50 --sleep 0.0
python3 agent/loop.py --ticks 200 --sleep 0.4 --tui | python3 agent/tui.py
python3 agent/loop.py --ticks 50 --strategy llm --sleep 0.5
```

---

## 🧰 SOL GPT TOOL CATALOG (171)

Full **non-custodial** Solana tool surface (research + user-signed prepare) — same catalog the OpenRouter agent harness uses.

| Group | Id | Tools | Blurb |
|-------|----|------:|-------|
| **Phoenix Eternal** | `phoenix` | 23 | Perps research + user-signed trade prep |
| **Imperial router** | `imperial` | 32 | Multi-venue perps (Jupiter / Flash / Phoenix / GMTrade) |
| **Market data** | `market` | 18 | Prices, search, trending, memes, security |
| **OHLCV & live tape** | `ohlcv` | 10 | Candles, live price, trades |
| **Wallet & portfolio** | `wallet` | 4 | Net worth, PnL, assets, balances |
| **Helius Wallet API** | `helius` | 8 | Identity, history, transfers, activity |
| **Solana Tracker** | `solanatracker` | 60 | Portfolio, PnL, trending, DAS + RPC |
| **Swaps & sends** | `trading` | 5 | Quotes + user-signed swap/transfer prep |
| **Prediction markets** | `prediction` | 3 | DFlow / Kalshi read-only |
| **Cloud browser** | `browser` | 4 | Browser Use research |
| **Agents & DAS** | `agents` | 2 | Metaplex / agent discovery |
| **Platform** | `platform` | 2 | `search_tools`, sponge status |
| **Total** | | **171** | **122 core** · 49 specialty |

### Execution model

| Mode | Behavior |
|------|----------|
| **Research** | Tools return JSON (HTTP / RPC). No keys leave the host. |
| **Live spends** | `prepare_user_*` / `prepare_phoenix_*` → **unsigned plans**; your wallet signs. Server never holds private keys. |
| **Agent loop** | `dark-clawd agent` loads **122 core tools every turn**; specialty via `search_tools` then exact name. Stop: `--max-steps` (default 8). |
| **Broadcast** | `st_rpc_send_transaction` only accepts **already-signed** txs. |

```bash
dark-clawd tools catalog
dark-clawd tools list --core
dark-clawd tools list --group solanatracker
dark-clawd tools run list_phoenix_markets
dark-clawd tools run prepare_user_swap --arg inputMint=… --arg outputMint=… --arg amount=…
dark-clawd agent -p "Show Phoenix SOL-PERP mark and funding"
```

Full reference: **[`docs/SOL_GPT_TOOLS.md`](docs/SOL_GPT_TOOLS.md)**

---

## 🤖 OPENROUTER AGENT HARNESS

`dark-clawd agent` is a create-agent-tui–style **harness**: model call → tool execution → stop conditions, wired to the SOL GPT catalog over **OpenRouter Chat Completions** (no private keys in the loop).

| Flag | Purpose |
|------|---------|
| `-m, --model <id>` | OpenRouter model (default `poolside/laguna-s-2.1:free` or env) |
| `-p, --prompt <text>` | One-shot non-interactive turn |
| `--max-steps <n>` | Max model↔tool steps per turn (default 8) |
| `--wallet <addr>` | Default wallet for portfolio / perps tools |
| `-q, --quiet` | Less step/usage noise |

```bash
export OPENROUTER_API_KEY=sk-or-…
export OPENROUTER_DEFAULT_MODEL=poolside/laguna-s-2.1:free   # optional
dark-clawd agent
# REPL: type naturally · /tools · /exit
```

Requires `OPENROUTER_API_KEY` — [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys).

---

## 🎮 COMMAND MATRIX

### CLI

```
╔══════════════════════════════════════════════════════════════════════════╗
║  dark-clawd / clawd / clawd-tui                            v1.1.1        ║
║  ──────────────────────────────────────────────────────────────────────  ║
║  welcome · --help · info · status · setup · wallet                       ║
║  run [--auto|--interactive|--wallet|--headless]              Bloomberg   ║
║  tools · tools list|search|run|catalog                       171 tools   ║
║  agent [-m model] [-p prompt] [--max-steps] [--wallet]       OpenRouter  ║
║  trade · automate · sandbox · kit                            automation  ║
║  automaton status|constitution|paths                         bridge      ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### TUI Keyboard Shortcuts

| Key | Action |
|:---:|--------|
| `1` | Market view |
| `2` | Trading view |
| `3` | Portfolio view |
| `4` | Analytics view |
| `5` | Agent view |
| `6` | Perps view |
| `7` | Automaton view (sovereign runtime bridge) |
| `Tab` | Cycle display mode |
| `H` | Help overlay |
| `R` | Refresh all data |
| `A` | Jump to Automaton view |
| `Q` / `Esc` | Quit |

### Agent Commands

| Command | Description |
|---------|-------------|
| `/help` | Show command matrix |
| `/analyze` | Run market analysis |
| `/trending` | Show trending Solana tokens |
| `/wallet` | Display wallet context |
| `/price <addr>` | Get token price |
| `/news` | Fetch crypto news |
| `/search <query>` | Search through Grok |
| `/research <topic>` | Deep research via Perplexity |
| `/perps` | List Phoenix perpetual markets |
| `/perp <sym>` | Inspect one perp market |
| `/prophecy` | Generate Dark Clawd prediction |
| `/think` | Trigger recursive thought spiral |
| `/stats` | Display system statistics |
| `/automaton` | Automaton bridge status (sovereign runtime) |
| `/automaton constitution` | Clawd Automaton constitution excerpt |
| `/tools` | SOL GPT catalog summary (171 tools) |
| `/tools search <q>` | Search catalog |
| `/tools run <name> k=v` | Run one tool (non-custodial) |
| `/mode <type>` | Switch auto / interactive |
| `/clear` | Clear message history |

---

## 🤖 AUTOMATON (SOVEREIGN RUNTIME)

Dark Clawd vendors **Automaton** under `automaton/` — the self-improving, survival-pressured agent loop (heartbeat, Conway, replication, immutable Clawd constitution).

```bash
# Bridge status (no Conway provision required)
bun run automaton:status
bun run automaton:constitution
bun run automaton:paths

# Full runtime lifecycle
bun run automaton:install
bun run automaton:build
bun run automaton:test
cd automaton && node dist/index.js --run
```

| Surface | Path |
|---------|------|
| Bridge API | `src/services/automaton-bridge.ts` |
| Runtime | `automaton/src/` |
| Creator CLI | `automaton/packages/cli/` |
| Scripts | `automaton/scripts/` |
| Constitution | `automaton/constitution.md` |
| Integration guide | [`docs/AUTOMATON_INTEGRATION.md`](docs/AUTOMATON_INTEGRATION.md) |

---

## 🧠 AUTONOMOUS AGENT

The **Clawd OODA Loop** (Observe–Orient–Decide–Act) is the beating heart — **forged from Ralph on Solana**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DARK CLAWD OODA LOOP                             │
│                 (forged from Ralph on Solana)                       │
│                                                                     │
│   ┌─────────┐     ┌──────────┐     ┌─────────┐     ┌────────┐     │
│   │ OBSERVE │────▶│  ORIENT  │────▶│ DECIDE  │────▶│  ACT   │     │
│   │ Market  │     │ Analyze  │     │ Hold /  │     │ Execute │     │
│   │ Data    │     │ Context  │     │ Open /  │     │ Action  │     │
│   └─────────┘     └──────────┘     │ Close   │     └────────┘     │
│                                     └─────────┘                    │
│                                          │                         │
│                                    ┌─────▼─────┐                   │
│                                    │  Journal   │                   │
│                                    │ ticks.jsonl│                   │
│                                    └───────────┘                   │
│                                                                     │
│   Strategy Modes: rule_based │ llm │ hybrid                         │
│   Safety: kill-switch │ size caps │ paper-only │ devnet-only       │
│   PnL: win rate │ Sharpe │ max drawdown │ equity                   │
└─────────────────────────────────────────────────────────────────────┘
```

```
  ░ → ▒ → ▓ → █ → ▓ → ▒ → ░     recursive pulse
  O     O     D     A     …     never idles on mainnet noise
```

### Agent Safety Contract

| Guarantee | Enforcement |
|-----------|-------------|
| Paper-only mode | `loop.py` rejects non-paper modes |
| Devnet-only | Mainnet RPC URLs rejected |
| No signing | No private key handling in v1 |
| Position caps | `max_position_size_lamports` enforced |
| One position at a time | Second open rejected |
| Kill-switch | Exit on N consecutive losses |
| Full journaling | Append-only `journal/ticks.jsonl` |

---

## 🔌 SERVICE INTEGRATIONS

| Service | Enables |
|---------|---------|
| **OpenRouter** | Agent harness + model routing (`dark-clawd agent`) |
| **Helius** | Solana RPC, DAS, balances, history |
| **Birdeye** | Prices, OHLCV, trending, security |
| **Phoenix Perps** | Eternal markets, funding, user-signed prepare |
| **Imperial** | Multi-venue perps intel (read-only) |
| **Solana Tracker** | Portfolio, PnL, trending, DAS + RPC (60 tools) |
| **DFlow** | Spot quotes / prediction markets |
| **xAI Grok / Perplexity / Moonshot** | Optional research / chat providers |
| **Browser Use** | Cloud browser research tools |

### Configuration

Create `.env` (or `~/.darkclawd/config.env` — also written by `install.sh`):

```env
# —— Agent harness (OpenRouter) ——
OPENROUTER_API_KEY=
OPENROUTER_DEFAULT_MODEL=poolside/laguna-s-2.1:free
OPENROUTER_MODEL=

# —— Market / chain ——
HELIUS_API_KEY=
HELIUS_RPC_URL=
BIRDEYE_API_KEY=
SOLANA_WALLET=
PHOENIX_API_URL=https://perp-api.phoenix.trade
IMPERIAL_API_BASE=https://api.imperial.space/api/v1

# —— Solana Tracker (60 tools) ——
SOLANA_TRACKER_API_KEY=
SOLANA_TRACKER_RPC_URL=
SOLANA_TRACKER_RPC_API_KEY=

# —— Optional ——
XAI_API_KEY=
PERPLEXITY_API_KEY=
MOONSHOT_API_KEY=
DFLOW_API_URL=
BROWSER_USE_API_KEY=
NEWS_API_KEY=
SERP_API_KEY=
CLAWD_AUTO_MODE=true
CLAWD_SANDBOX_PORT=18790
```

---

## 📁 PROJECT LAYOUT

Full deep map: **[`docs/MONOREPO.md`](docs/MONOREPO.md)**. Below is the GitHub-facing inventory of first-class workspace areas (what you see after `git clone`).

### Monorepo at a glance

| Area | Path | Role |
|------|------|------|
| **Product TUI (publish)** | [`tui/`](tui/) | Canonical npm package `@x402solana/dark-clawd` — CLI, Bloomberg TUI, 171 tools, agent harness, `install.sh`, Docker/Fly; monorepo bridge [`tui/tui.ts`](tui/tui.ts) → `runTui` |
| **Root TUI (dev)** | [`src/`](src/) | Monorepo Ink/CLI entry + package registry; keep aligned with `tui/` before publish |
| **Telegram** | [`telegram/`](telegram/) | Grammy bot, pairing, media, send |
| **Signal** | [`signal/`](signal/) | Daemon / monitor / send (uses `web/media`) |
| **Slack** | [`slack/`](slack/) | Client, monitor, threading |
| **WhatsApp web** | [`web/`](web/) | Baileys-lineage web channel (login, inbound, auto-reply, media) |
| **WhatsApp helpers** | [`whatsapp/`](whatsapp/) | Shared normalize helpers |
| **Routing** | [`routing/`](routing/) | Agent route + session key helpers |
| **Sessions** | [`sessions/`](sessions/) | Labels, send policy, model/level overrides |
| **Utils** | [`utils/`](utils/) | Message channel, delivery context, formatting |
| **Providers** | [`providers/`](providers/) | Model provider helpers (Copilot, Qwen OAuth, …) |
| **Scripts** | [`scripts/`](scripts/) | Package checks, `run-tui.ts`, setup, smoke |
| **Wizard** | [`wizard/`](wizard/) | Gateway onboarding (imports `runTui`) |
| **Skills** | [`skills/`](skills/) | Local agent skills (e.g. zkrouter) |
| **Automaton** | [`automaton/`](automaton/) | Sovereign agent runtime + constitution |
| **Agent (Ralph)** | [`agent/`](agent/) | Python OODA loop (`loop.py`, `RALPH.md`) |
| **MPP** | [`mpp/`](mpp/) | Solana Machine Payments Protocol (HTTP 402 / x402) |
| **PumpFun bot** | [`clawdbot-pumpfun/`](clawdbot-pumpfun/) | Rust copy-trading crate |
| **Research API** | [`llm-wiki-tang/`](llm-wiki-tang/) | AutoResearch + OpenClawd memory (Python FastAPI) · **Fly:** [dark-clawd-research.fly.dev](https://dark-clawd-research.fly.dev) |
| **Docs** | [`docs/`](docs/) | MONOREPO, OpenClawd, tools, Birdeye, Automaton |

Root metadata: [`package.json`](package.json) · [`bun.lock`](bun.lock) · [`tsconfig.json`](tsconfig.json) · [`LICENSE`](LICENSE) · [`CHANGELOG.md`](CHANGELOG.md) · [`darkclawd.md`](darkclawd.md) · [`.gitignore`](.gitignore).

```
dark-clawd/                      # github.com/Solizardking/dark-clawd
├── package.json                 # workspace meta (@x402solana/dark-clawd)
├── README.md · CHANGELOG.md · LICENSE · darkclawd.md
│
├── tui/                         # ★ Preferred npm surface (publish from here)
│   ├── package.json             # @x402solana/dark-clawd@1.1.1
│   ├── tui.ts                   # monorepo runTui() for scripts/ + wizard/
│   ├── install.sh · scripts/fix-shebang.mjs
│   └── src/ cli · tools (171) · agent harness · services · components
│
├── src/                         # core TUI + package registry (dev monorepo)
│   ├── packages/                # ★ discovers root channel/support packages
│   │   ├── registry.ts          # bootstrapPackageRegistry · softLoad · session keys
│   │   └── registry.test.ts     # interop tests (routing↔sessions, utils, soft-fail)
│   └── … engine · services · components
│
├── telegram/ · slack/ · signal/ · web/ · whatsapp/   # messaging channel packages
├── routing/ · sessions/ · utils/ · providers/        # support packages (pure interop)
├── scripts/ · skills/ · wizard/ · automaton/         # meta / tooling + sovereign runtime
├── llm-wiki-tang/               # ★ AutoResearch + OpenClawd memory API (Python FastAPI)
│
├── agent/                       # Python OODA (Ralph) loop
├── mpp/                         # Solana MPP / HTTP 402 payments kit
├── clawdbot-pumpfun/            # Rust PumpFun copy-trading crate
└── docs/                        # MONOREPO.md · OPENCLAWD · SOL_GPT_TOOLS · AUTOMATON · …
```

### Channel / support package discovery

Root trees (`telegram`, `slack`, `signal`, `web`, `whatsapp`, `routing`, `sessions`, `utils`, `providers`, `scripts`, `wizard`, `skills`, `automaton`, `agent`, `mpp`, `clawdbot-pumpfun`, `llm-wiki-tang`, …) are first-class workspace packages. Core discovers many of them via:

```ts
import {
  bootstrapPackageRegistry,
  roundTripChannelSessionKey,
  getAutomatonInterop,
  getLlmWikiTangInterop,
} from './src/packages/index.ts';

const boot = bootstrapPackageRegistry();
// boot.channels · boot.support · boot.meta · boot.sessionKeys · boot.utils
// boot.automaton · boot.llmWikiTang
const { key } = roundTripChannelSessionKey(); // agent:main:telegram:dm:user1
const auto = getAutomatonInterop();           // constitution + status via automaton-bridge
const wiki = getLlmWikiTangInterop();         // pyproject name/version + api/main.py paths
```

- **Channels** (telegram/slack/signal/web): listed when present; full `index.ts` load is **optional** (soft-fail if OpenClaw parents like grammy are missing).
- **Support** (routing/sessions/utils/providers): pure modules load for session-key + boolean helpers without a full bot runtime.
- **Automaton** (`automaton/`): registered as meta; bridge surfaces package name, constitution laws, bins, and entrypoints without a full Conway provision. Heavy `src/index.ts` soft-fails when runtime deps are incomplete. CLI: `bun run automaton:status`.
- **llm-wiki-tang** (`llm-wiki-tang/`): AutoResearch / OpenClawd memory API for Dark Clawd TUI. Core reads `pyproject.toml` + key paths (`api/main.py`, `src/`, `tests/`) without starting uvicorn. **Deployed on Fly.**

### Research API (Fly production)

| | |
|---|---|
| **App** | `dark-clawd-research` |
| **Public URL** | https://dark-clawd-research.fly.dev |
| **Health** | https://dark-clawd-research.fly.dev/health → `{"status":"ok"}` |
| **Docs UI** | https://dark-clawd-research.fly.dev/docs |
| **Config** | [`llm-wiki-tang/fly.toml`](llm-wiki-tang/fly.toml) · [`llm-wiki-tang/Dockerfile`](llm-wiki-tang/Dockerfile) |
| **Package README** | [`llm-wiki-tang/README.md`](llm-wiki-tang/README.md) |

```bash
# Point Dark Clawd at the live API
export RESEARCH_API_URL=https://dark-clawd-research.fly.dev
dark-clawd   # or: cd tui && bun start
# /research <topic> uses this URL first (Perplexity fallback)

# Local dev API
cd llm-wiki-tang && python3 -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
export RESEARCH_API_URL=http://127.0.0.1:8000

# Re-deploy
cd llm-wiki-tang && fly deploy
curl -sS https://dark-clawd-research.fly.dev/health
```

- Run package interop: `bun run test:interop`

---

## 🛠️ BUILT WITH

| Layer | Stack |
|-------|--------|
| CLI / package | Node ≥18, Commander, TypeScript, `bun build --target node` |
| TUI | Bun + Ink + React |
| Solana | `@solana/web3.js`, Helius, Birdeye, Phoenix Rise SDK |
| Agent | OpenRouter Chat Completions tool loop |
| OODA | Python 3.10+ (stdlib) |
| Automation | Fly sandbox · MPP (HTTP 402) |

---

## 🔗 LINKS

| Surface | URL |
|---------|-----|
| Product hub | https://cheshireterminal.ai/dark-clawd |
| GitHub | https://github.com/Solizardking/dark-clawd |
| Release v1.1.1 | https://github.com/Solizardking/dark-clawd/releases/tag/v1.1.1 |
| npm | https://www.npmjs.com/package/@x402solana/dark-clawd |
| OpenClawd site | https://solanaclawd.com |
| Holder vault | https://solanaclawd.com/vault |
| Chat & voice | https://solanaclawd.com/chat |
| Trading console | https://solanaclawd.com/trading |
| Agent API | https://agents.openclawd.biz |

---

## 📈 PERFORMANCE METRICS

After each Python OODA agent run, a PnL summary is output:

```
============================================================
  DARK CLAWD v1 — SUMMARY
  (forged from Ralph on Solana)
============================================================
  Strategy:     rule_based
  Mode:         paper
  Ticks:        50
  Total trades: 12
  Win rate:     58.3%
  Gross PnL:    +42,500 lamports
  Equity:       10,042,500 lamports
  Max DD:       125,000 lamports
  Sharpe:       1.234
============================================================
```

---

## 📚 DOCUMENTATION

- [`docs/MONOREPO.md`](docs/MONOREPO.md) — **full workspace map** (TUI upgrade + all integrated trees)
- [`darkclawd.md`](darkclawd.md) — **Cheshire hub handoff** (add client at cheshireterminal.ai/dark-clawd)
- [`docs/SOL_GPT_TOOLS.md`](docs/SOL_GPT_TOOLS.md) — **171-tool catalog**, CLI, agent, env
- [`docs/OPENCLAWD_ADAPTATION.md`](docs/OPENCLAWD_ADAPTATION.md) — OpenClawd mapping + **TUI upgrade**
- [`tui/README.md`](tui/README.md) — package surface (npm install surface; `tui/tui.ts` → `runTui`)
- [`tui/CHANGELOG.md`](tui/CHANGELOG.md) · [`CHANGELOG.md`](CHANGELOG.md)
- [`docs/AUTOMATON_INTEGRATION.md`](docs/AUTOMATON_INTEGRATION.md) — Automaton bridge
- [`docs/BIRDEYE_INTEGRATION.md`](docs/BIRDEYE_INTEGRATION.md) — Birdeye setup
- [`docs/X_ARTICLE.md`](docs/X_ARTICLE.md) — narrative / social draft
- [`agent/README.md`](agent/README.md) · [`agent/RALPH.md`](agent/RALPH.md) — OODA loop
- [`automaton/README.md`](automaton/README.md) — sovereign runtime
- [`clawdbot-pumpfun/README.md`](clawdbot-pumpfun/README.md) — PumpFun copy-trading (Rust)

---

---

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║   "In recursion, we find infinity. In infinity, we find alpha."       ║
║                                                                       ║
║   "The charts don't lie, but they do speak in riddles."               ║
║                                                                       ║
║   "Between the candlesticks, I see truth."                            ║
║                                                                       ║
║   "Forged from Ralph on Solana — the claw remembers the loop."        ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝

  ░▒▓█ CLAWD █▓▒░  ·  pulse ·  scan ·  decide ·  act ·  repeat
```

**License:** MIT

<p align="center">
  <sub>Built on Solana · Forged from Ralph · Powered by recursion · <a href="https://solanaclawd.com">solanaclawd.com</a></sub>
</p>
