# Dark Clawd · SOL GPT tool catalog

> Full **171**-tool non-custodial Solana catalog (same surface as SOL GPT / cheshireterminal.ai).  
> **Canonical source (TUI upgrade):** `tui/src/tools/catalog.ts` · runner: `tui/src/tools/runner.ts` · harness: `tui/src/agent/openrouter-harness.ts`

Product package: **`tui/`** → npm `@x402solana/dark-clawd`.  
Monorepo map: [MONOREPO.md](./MONOREPO.md).

## Totals

| Metric | Count |
|--------|------:|
| **Shipped tools** | **171** |
| Core (Kimi always-on set) | 122 |
| Specialty | 49 |
| Groups | 12 |

### Groups

| Group | Id | Tools |
|-------|----|------:|
| Phoenix Eternal | `phoenix` | 23 |
| Imperial router | `imperial` | 32 |
| Market data | `market` | 18 |
| OHLCV & live tape | `ohlcv` | 10 |
| Wallet & portfolio | `wallet` | 4 |
| Helius Wallet API | `helius` | 8 |
| Solana Tracker | `solanatracker` | 60 |
| Swaps & sends | `trading` | 5 |
| Prediction markets | `prediction` | 3 |
| Cloud browser | `browser` | 4 |
| Agents & DAS | `agents` | 2 |
| Platform | `platform` | 2 |

## Execution model

- **Research tools** return JSON (read-only HTTP / RPC).
- **Live spends** never use a server hot wallet: `prepare_user_*` and `prepare_phoenix_*` return **unsigned plans** only.
- `st_rpc_send_transaction` broadcasts **already signed** txs only.

## CLI

Run from an install of `@x402solana/dark-clawd` (built from **`tui/`**), or `cd tui && bun run src/cli.tsx …`:

```bash
dark-clawd tools                 # summary
dark-clawd tools catalog         # JSON totals
dark-clawd tools list            # full list
dark-clawd tools list --group phoenix
dark-clawd tools list --core
dark-clawd tools search wallet
dark-clawd tools run search_tools --arg query=phoenix
dark-clawd tools run get_price --arg mint=<MINT>
dark-clawd tools run prepare_user_swap --arg inputMint=… --arg outputMint=… --arg amount=…

# OpenRouter agent harness (core tools every turn + search_tools)
export OPENROUTER_API_KEY=sk-or-…
dark-clawd agent
dark-clawd agent -m poolside/laguna-s-2.1:free -p "What is trending?"
dark-clawd agent --wallet <addr> --max-steps 12
```

### Agent harness

- Module: `tui/src/agent/openrouter-harness.ts`
- OpenRouter Chat Completions (`OPENROUTER_API_KEY`)
- Loads **122 core tools** every turn (SOL GPT / Kimi style)
- Specialty tools via `search_tools` then exact name
- Stop condition: `--max-steps` (default 8)
- Tool display: start/end lines (create-agent-tui-style)

## Agent chat (TUI)

Inside the Bloomberg / Agent view (`dark-clawd run`):

```
/tools
/tools search phoenix
/tools run get_price mint=<MINT>
/tool list_phoenix_markets
```

## Env (selected)

Template: `tui/.env.example`

```bash
OPENROUTER_API_KEY=              # dark-clawd agent
OPENROUTER_DEFAULT_MODEL=poolside/laguna-s-2.1:free

HELIUS_API_KEY=
HELIUS_RPC_URL=
BIRDEYE_API_KEY=
SOLANA_TRACKER_API_KEY=          # or SOLANA_TRACKER_DATA_API_KEY
SOLANA_TRACKER_RPC_URL=          # DAS (10 credits/call)
SOLANA_TRACKER_RPC_API_KEY=
PHOENIX_API_URL=https://perp-api.phoenix.trade
IMPERIAL_API_BASE=https://api.imperial.space/api/v1
DFLOW_API_URL=
BROWSER_USE_API_KEY=             # cloud browser tools
SOLANA_WALLET=                   # default wallet context
```

## Tests (shipped catalog)

```bash
cd tui && bun test src/tools/catalog.test.ts src/agent/openrouter-harness.test.ts src/package-communication.test.ts
```

Asserts 171 tools, group totals, non-custodial `prepare_*`, and product communication.

## Product links

- Hub: https://cheshireterminal.ai/dark-clawd
- GitHub: https://github.com/Solizardking/dark-clawd
- npm package: `@x402solana/dark-clawd` (publish root: **`tui/`**)
- Install: `curl -fsSL https://raw.githubusercontent.com/Solizardking/dark-clawd/main/tui/install.sh | bash`
