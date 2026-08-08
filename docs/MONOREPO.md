# Dark Clawd monorepo map

Workspace root: `dark-clawd/`. Product hub: [cheshireterminal.ai/dark-clawd](https://cheshireterminal.ai/dark-clawd).

This document is the **source of truth** for where each integrated tree lives after the TUI upgrade and channel/package port wave.

---

## TUI upgrade (canonical product surface)

| Item | Path | Notes |
|------|------|--------|
| **Preferred publishable package** | [`tui/`](../tui/) | npm `@x402solana/dark-clawd` · bins `dark-clawd` · `clawd` · `clawd-tui` |
| Package sources | `tui/src/` | CLI, Ink App, Bloomberg views, tools, agent harness, automation kit |
| Monorepo `runTui` bridge | [`tui/tui.ts`](../tui/tui.ts) | Exported `runTui()` — consumed by `scripts/run-tui.ts` and `wizard/onboarding.finalize.ts` |
| Product identity | `tui/src/product.ts` | Hub, GitHub, npm, install curl (GitHub raw `tui/install.sh`) |
| SOL GPT tools (171) | `tui/src/tools/` | Catalog + non-custodial runner + OpenRouter harness |
| Build / ship | `tui/dist/` | `cli.js`, `index.js`, `yoga.wasm` — rebuild via `cd tui && bun run build` |
| Installer | `tui/install.sh` | One-shot global install path |
| Sandbox | `tui/Dockerfile`, `tui/fly.toml` | HTTP kit sandbox (`sandbox` command) |
| Communication tests | `tui/src/package-communication.test.ts` | Inventory, `runTui` entry, catalog, internal import graph |

### Dev vs publish

| Surface | Role |
|---------|------|
| **`tui/`** | Ship product behavior, publish to npm, Fly sandbox, install docs |
| **`src/`** | Root monorepo TUI (dev entry in root `package.json`); keep OpenClawd/Birdeye/Automaton wiring aligned with `tui/` |

```bash
# Preferred product TUI
cd tui && bun install && bun run run

# Monorepo script entry (imports tui/tui.ts → runTui)
bun scripts/run-tui.ts

# npm global (consumers)
npm install -g @x402solana/dark-clawd
dark-clawd run
```

See also: [tui/README.md](../tui/README.md), [SOL_GPT_TOOLS.md](./SOL_GPT_TOOLS.md), [OPENCLAWD_ADAPTATION.md](./OPENCLAWD_ADAPTATION.md).

---

## Workspace inventory (integrated trees)

### Product & agents

| Path | Role |
|------|------|
| [`tui/`](../tui/) | **Canonical** Bun + Ink Dark Clawd TUI package (publish surface) |
| [`src/`](../src/) | Root workspace TUI / library entry (dev monorepo; mirror of product family) |
| [`agent/`](../agent/) | Python OODA / Ralph harness (`loop.py`, `RALPH.md`, journal, memory) |
| [`automaton/`](../automaton/) | Sovereign agent runtime (heartbeat, constitution, CLI, self-mod) |
| [`skills/`](../skills/) | Local agent skills (e.g. `zkrouter/SKILL.md`) |

### Channels (messaging)

| Path | Role |
|------|------|
| [`telegram/`](../telegram/) | Grammy Telegram bot, pairing, media, webhooks |
| [`signal/`](../signal/) | Signal daemon / monitor / send (uses `web/media` helpers) |
| [`slack/`](../slack/) | Slack client, monitor, threading, directory |
| [`web/`](../web/) | WhatsApp **web** channel (Baileys lineage): login, inbound, auto-reply, media, `vcard` |
| [`whatsapp/`](../whatsapp/) | Shared WhatsApp normalize helpers |
| [`wizard/`](../wizard/) | Gateway onboarding wizard (calls `runTui` from `tui/tui.ts`) |

### Routing, sessions, providers, utils

| Path | Role |
|------|------|
| [`routing/`](../routing/) | Agent route resolution, session keys (`DEFAULT_ACCOUNT_ID`, `resolveAgentRoute`) |
| [`sessions/`](../sessions/) | Session labels, send policy, model/level overrides, transcript events |
| [`providers/`](../providers/) | Model provider helpers (GitHub Copilot token/auth, Qwen OAuth, Google shared) |
| [`utils/`](../utils/) | Shared helpers (message channel, delivery context, usage format, booleans) |
| [`scripts/`](../scripts/) | Repo tooling: package checks, `run-tui.ts`, setup, smoke, git hooks |

### Solana / payments / research

| Path | Role |
|------|------|
| [`mpp/`](../mpp/) | Solana Machine Payments Protocol (HTTP 402 / x402 kit) |
| [`clawdbot-pumpfun/`](../clawdbot-pumpfun/) | Rust PumpFun copy-trading crate (`solana-vntr-sniper`) |
| [`llm-wiki-tang/`](../llm-wiki-tang/) | Research / memory API (Python + tests; Helius examples) |

### Docs & assets

| Path | Role |
|------|------|
| [`docs/`](./) | Public adaptation notes, tool catalog, Birdeye, Automaton, monorepo map |
| [`docs/assets/`](./assets/) | Brand assets (`dark-clawd-hero.svg`) |

---

## How the pieces communicate

```text
                    ┌─────────────────────┐
                    │  cheshireterminal / │
                    │  npm @x402solana/   │
                    │  dark-clawd         │
                    └──────────┬──────────┘
                               │ publish from tui/
                               ▼
┌──────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│ scripts/     │────▶│ tui/tui.ts runTui   │────▶│ tui/src App+CLI  │
│ wizard/      │     └─────────────────────┘     └────────┬─────────┘
└──────────────┘                                          │
                                                          ├─▶ tools/ (171)
                                                          ├─▶ automaton-bridge → automaton/
                                                          └─▶ services (Helius, Birdeye, …)

┌ telegram/ ─┐   ┌ signal/ ──┐   ┌ slack/ ───┐   ┌ web/ (WhatsApp) ─┐
│ bot/send   │   │ send      │──▶│ send      │──▶│ media, inbound   │
└─────┬──────┘   └─────┬─────┘   └─────┬─────┘   └────────┬─────────┘
      │                │               │                  │
      └────────────────┴───────────────┴──────────────────┘
                       use routing/, utils/, sessions/
```

| Consumer | Depends on |
|----------|------------|
| `scripts/run-tui.ts`, `wizard/onboarding.finalize.ts` | `tui/tui.ts` → `runTui` |
| `signal/send.ts`, `telegram/send.ts`, `slack/send.ts` | `web/media` (`loadWebMedia`) |
| `web/accounts`, auto-reply | `routing/session-key`, `routing/resolve-route` |
| `tui` Automaton panel / CLI | sibling `automaton/` via `automaton-bridge` |
| Channel monitors | `sessions/*`, `utils/message-channel` (as wired) |

---

## Quick commands by tree

```bash
# Product TUI (canonical)
cd tui && bun test --pass-with-no-tests src && bun run build

# Root monorepo TUI tests
bun test './src/**/*.test.ts'

# PumpFun pure units (Rust)
cd clawdbot-pumpfun && cargo test --lib common::cache::tests

# Automaton
cd automaton && pnpm test   # or npm test
bun run automaton:status    # from monorepo root

# MPP
cd mpp && npm test          # if configured

# Channel pure helpers (examples)
bun test web/vcard.test.ts web/integration.communication.test.ts
```

---

## Related docs

| Doc | Topic |
|-----|--------|
| [OPENCLAWD_ADAPTATION.md](./OPENCLAWD_ADAPTATION.md) | OpenClawd path map + TUI package layout |
| [AUTOMATON_INTEGRATION.md](./AUTOMATON_INTEGRATION.md) | Sovereign runtime bridge |
| [BIRDEYE_INTEGRATION.md](./BIRDEYE_INTEGRATION.md) | Market data in TUI |
| [SOL_GPT_TOOLS.md](./SOL_GPT_TOOLS.md) | 171-tool catalog + agent CLI |
| [X_ARTICLE.md](./X_ARTICLE.md) | Narrative / social draft |
| [../tui/README.md](../tui/README.md) | Package-level TUI guide |
| [../clawdbot-pumpfun/README.md](../clawdbot-pumpfun/README.md) | PumpFun bot |
| [../automaton/README.md](../automaton/README.md) | Automaton runtime |
| [../agent/README.md](../agent/README.md) | Python OODA agent |
