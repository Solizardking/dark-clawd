# Dark Clawd · SOL GPT tool catalog

> Full **171**-tool non-custodial Solana catalog (same surface as SOL GPT / cheshireterminal.ai).
> Source: `tui/src/tools/catalog.ts` · runner: `tui/src/tools/runner.ts`

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
```

## Agent chat

```
/tools
/tools search phoenix
/tools run get_price mint=<MINT>
/tool list_phoenix_markets
```

## Env (selected)

```bash
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

## Product links

- Hub: https://cheshireterminal.ai/dark-clawd
- GitHub: https://github.com/Solizardking/dark-clawd
- npm package: `@x402solana/dark-clawd`
