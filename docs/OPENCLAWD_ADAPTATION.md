# OpenClawd Adaptation Map

**Dark Clawd** is the OpenClawd terminal intelligence layer (forged from Ralph on Solana).

After the **TUI upgrade**, the monorepo has a single preferred product package at **`tui/`**, a root dev surface at **`src/`**, messaging channels, routing/session utilities, and supporting runtimes (Automaton, agent, MPP, PumpFun).

Hub: [https://cheshireterminal.ai/dark-clawd](https://cheshireterminal.ai/dark-clawd)

For the full inventory of integrated trees, see **[MONOREPO.md](./MONOREPO.md)**.

---

## TUI upgrade summary

| Before / parallel | After (canonical) |
| --- | --- |
| Dual product surfaces easy to drift | **`tui/` is the publishable product** (`@x402solana/dark-clawd`) |
| Missing monorepo `runTui` entry | **`tui/tui.ts`** exports `runTui()` for `scripts/run-tui.ts` + wizard |
| Install path ambiguity | Product identity in **`tui/src/product.ts`** → GitHub raw `tui/install.sh` |
| Tool catalog docs only | **171 tools** live under `tui/src/tools/` + CLI `dark-clawd tools` / `agent` |
| Communication untested | **`tui/src/package-communication.test.ts`** + product/npm/automaton tests |

| Surface | Path | Package / bins | Role |
| --- | --- | --- | --- |
| **Preferred publishable package** | `tui/` | `@x402solana/dark-clawd` → `dark-clawd` · `clawd` · `clawd-tui` | Full product TUI + tools + automation kit + Fly sandbox |
| Root workspace TUI | `src/` (+ root `package.json`) | same product name; bins include legacy `dark-ralph` · `ralph` · `ralph-tui` | Dev monorepo entry; keep aligned with `tui/` before publish |
| Monorepo TUI bridge | `tui/tui.ts` | `runTui(opts?)` | Openclaw-compatible launcher → Ink `App` |

Shared OpenClawd routing defaults live in:

- `src/openclawd.ts` (root)
- `tui/src/openclawd.ts` (package)

Both are re-exported from `src/index.ts` / `tui/src/index.ts`.

---

## Workspace path map

| Path | OpenClawd / product role |
| --- | --- |
| **`tui/`** | **Canonical package root** — CLI, Bloomberg TUI, 171 tools, automation, sandbox, install, Docker/Fly |
| `tui/src/` | Package TypeScript tree (`cli.tsx`, `App.tsx`, `tools/`, `agent/`, services, skills) |
| `tui/tui.ts` | **`runTui`** monorepo entry (scripts + wizard) |
| `tui/dist/` | Build output — rebuild with `cd tui && bun run build` / `build:lib` |
| `tui/.env.example` | Committed provider + OpenClawd env template |
| **`src/`** | Root TUI sources (dev); mirror product behavior into `tui/` when shipping |
| `agent/` | Paper/devnet OODA loop (Ralph harness: `loop.py`, `RALPH.md`, journal) |
| `automaton/` | Sovereign loop runtime / constitution / creator CLI |
| `telegram/` · `signal/` · `slack/` · `web/` | Messaging channels (web = WhatsApp Baileys lineage) |
| `whatsapp/` | Shared WhatsApp normalize helpers |
| `wizard/` | Gateway onboarding (imports `../tui/tui.js`) |
| `routing/` · `sessions/` · `providers/` · `utils/` | Route keys, session policy, model providers, shared helpers |
| `scripts/` | Package checks, `run-tui.ts`, setup, smoke |
| `mpp/` | Solana Machine Payments Protocol (HTTP 402 / x402) |
| `clawdbot-pumpfun/` | Rust PumpFun copy-trading crate |
| `llm-wiki-tang/` | Research / memory API |
| `skills/` | Local agent skills (e.g. zkrouter) |
| `docs/` | Public notes + monorepo map; hero at `docs/assets/dark-clawd-hero.svg` |
| Root `package.json` · `bun.lock` · `tsconfig.json` | Workspace install + root `src/` scripts |
| Root `README.md` | Product surface + install matrix |

### Generated / dependency folders (do not hand-edit)

`dist/`, `tui/dist/`, `node_modules/`, `mpp/dist/`, `clawdbot-pumpfun/target/`, lockfile-driven installs — rebuild from source when publishing.

---

## Root `src/` layout

```text
src/
├── cli.tsx                 # Commander CLI → dark-clawd / clawd / clawd-tui (+ legacy aliases)
├── App.tsx                 # Ink app shell
├── index.ts                # Library exports
├── openclawd.ts            # OPENCLAWD_* URLs + routes
├── config/
│   ├── schema.ts           # Zod config (apiKeys, openclawd, phoenix, solana, clawd, automaton)
│   └── themes.ts           # dark-clawd theme + palettes
├── engine/
│   └── clawd-agent.ts      # ClawdAgent OODA-style recursive agent
├── components/             # Bloomberg panels + Perps* (root-only extras)
├── services/               # birdeye, helius, phoenix, automaton-bridge, ai, news
├── skills/
│   ├── solana-wallet.ts
│   └── automaton-skill.ts
├── packages/               # optional package registry helpers
└── *.test.ts               # rebrand, readme, automaton integration
```

**Scripts (root `package.json`):** `dev`, `run`, `build`, `build:lib`, `start`, `setup`, `status`, `wallet`, `automaton:*`, `typecheck`, `lint`, `test`, `clean`.  
**Engines:** Node ≥ 18, Bun ≥ 1.0 for monorepo scripts.

---

## Package `tui/` layout (upgraded)

```text
tui/
├── package.json            # @x402solana/dark-clawd (directory: "tui")
├── tsconfig.json
├── tui.ts                  # ★ monorepo runTui() entry
├── .env.example            # committed template
├── .eslintrc.cjs
├── install.sh              # one-shot installer (GitHub raw preferred)
├── Dockerfile              # sandbox image
├── fly.toml                # dark-clawd-sandbox
├── CHANGELOG.md
├── LICENSE
├── README.md
├── scripts/fix-shebang.mjs
├── dist/                   # cli.js · index.js · yoga.wasm
└── src/
    ├── cli.tsx             # tools · agent · trade · automate · kit · sandbox · automaton
    ├── App.tsx             # Ink shell · views [1]–[6] AUTOMATON
    ├── index.ts
    ├── product.ts          # hub / npm / install identity
    ├── openclawd.ts
    ├── config/
    ├── engine/clawd-agent.ts
    ├── components/         # market TUI + AutomatonPanel
    ├── services/
    │   ├── birdeye* · helius · phoenix · ai · news
    │   ├── automaton-bridge.ts
    │   ├── trade-automation.ts
    │   ├── sandbox-server.ts
    │   └── mpp-payments.ts
    ├── tools/              # 171 SOL GPT catalog + runner
    ├── agent/              # OpenRouter harness
    ├── skills/
    └── *.test.ts           # product, npm, catalog, package-communication, …
```

**Bins:** `dark-clawd` · `clawd` · `clawd-tui` → `dist/cli.js` (Node shebang).  
**Publish files:** `dist`, `install.sh`, `fly.toml`, `Dockerfile`, `README.md`, `LICENSE`, `CHANGELOG.md`.

### Deploy / install

```bash
# Preferred one-shot (GitHub raw — free)
curl -fsSL https://raw.githubusercontent.com/Solizardking/dark-clawd/main/tui/install.sh | bash

# npm
npm install -g @x402solana/dark-clawd

# Local package
cd tui && bun install && cp .env.example .env && bun run run

# Monorepo bridge
bun scripts/run-tui.ts

# Fly sandbox
cd tui && fly launch --copy-config && fly deploy
```

---

## Runtime defaults (`OPENCLAWD_*`)

From `openclawd.ts` + `tui/.env.example`:

```env
OPENCLAWD_SITE_URL=https://solanaclawd.com
OPENCLAWD_BACKEND_URL=https://solanaclawd.com
OPENCLAWD_AGENT_API_URL=https://agents.openclawd.biz
OPENCLAWD_VAULT_URL=https://solanaclawd.com/vault
OPENCLAWD_VOICE_URL=https://solanaclawd.com/chat
OPENCLAWD_VIM_URL=https://solanaclawd.com/chat
OPENROUTER_MODEL=minimax/minimax-m2.7
```

### Routes exposed by `OPENCLAWD_ROUTES`

`home` `/` · `vault` `/vault` · `chat` `/chat` · `trading` `/trading` · `agents` `/agents` · `staking` `/staking` · `mining` `/mining` · `docs` `/docs`

### Config schema keys (Zod)

`apiKeys` · `openclawd` · `phoenix` · `solana` · `clawd` · `automaton` · `errorHandling`  
Agent env: `CLAWD_AUTO_MODE`, `CLAWD_RECURSION_DEPTH`, `CLAWD_THOUGHT_INTERVAL`, `CLAWD_MAX_ITERATIONS`.

---

## Keep `src/` and `tui/` aligned

Before publishing the package surface:

1. Prefer developing and testing in **`tui/`** when changing product behavior.
2. Mirror shared OpenClawd defaults and Birdeye/provider/Automaton wiring into root `src/` when both trees are used.
3. Rebuild `tui/dist/` via `cd tui && bun run build && bun run build:lib`.
4. Never commit `tui/.env` secrets — only `.env.example`.
5. Ensure monorepo consumers still resolve **`tui/tui.ts`** (`runTui`).

---

## Messaging channels (port wave)

| Channel | Path | Notes |
| --- | --- | --- |
| Telegram | `telegram/` | Grammy bot, pairing, media |
| Signal | `signal/` | Daemon + monitor; `loadWebMedia` from `web/media` |
| Slack | `slack/` | Monitor, threads, registry |
| WhatsApp web | `web/` | Login QR, inbound, auto-reply; pure units e.g. `vcard` |
| WhatsApp helpers | `whatsapp/` | Normalize |

Shared: `routing/`, `sessions/`, `utils/`. See [MONOREPO.md](./MONOREPO.md).
