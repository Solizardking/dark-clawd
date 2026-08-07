# OpenClawd Adaptation Map

**Dark Clawd** is the OpenClawd terminal intelligence layer (forged from Ralph on Solana).
This workspace ships **two parallel Bun + Ink TUI surfaces** that share the same product name and OpenClawd defaults:

| Surface | Path | Package / bins | Role |
| --- | --- | --- | --- |
| Preferred publishable package | `tui/` | `@x402solana/dark-clawd` → `dark-clawd` · `clawd` · `clawd-tui` | Full product TUI + automation kit + Fly sandbox |
| Root workspace TUI | `src/` (+ root `package.json`) | same package name; bins include legacy `dark-ralph` · `ralph` · `ralph-tui` aliases | Dev monorepo entry; keep aligned with `tui/` before publish |

Shared OpenClawd routing defaults live in:

- `src/openclawd.ts` (root)
- `tui/src/openclawd.ts` (package)

Both are re-exported from `src/index.ts` / `tui/src/index.ts`.

Hub: [https://cheshireterminal.ai/dark-clawd](https://cheshireterminal.ai/dark-clawd)

---

## Workspace path map

Workspace directory on disk may still be named `dark-ralph/`; the product is **Dark Clawd**.

| Path | OpenClawd / product role |
| --- | --- |
| `src/` | Root TUI sources: CLI (`cli.tsx`), app shell (`App.tsx`), Bloomberg components, `engine/clawd-agent.ts`, providers, skills. |
| `tui/` | Preferred package root: same TUI family plus trade automation, sandbox HTTP API, `install.sh`, `Dockerfile`, `fly.toml`. |
| `tui/src/` | Package TypeScript entry tree (see layout below). |
| `tui/dist/` | Build output (`cli.js`, `index.js`, `yoga.wasm`) — rebuild with `bun run build` / `build:lib`; do not hand-edit. |
| `tui/.env.example` | Documented provider + OpenClawd env template (committed). |
| `tui/.env` | Local secrets only — gitignored via root `.gitignore` (`*.env` patterns; `!.env.example` kept). |
| `agent/` | Paper/devnet OODA loop (Ralph harness lineage: `loop.py`, `RALPH.md`, journal). |
| `automaton/` | Sovereign loop runtime / background agent pattern. |
| `docs/` | Public notes: Birdeye, OpenClawd adaptation, X narrative; hero at `docs/assets/dark-clawd-hero.svg`. |
| `llm-wiki-tang/` | Research / memory API for vault-backed notes. |
| `mpp/` | Solana Machine Payments Protocol (HTTP 402) kit (`solana-mpp` / `dark-clawd` helpers). |
| Root `package.json` · `bun.lock` · `tsconfig.json` | Workspace install, lockfile, strict Bun/TS config for root `src/`. |
| Root `README.md` | Product surface + command matrix (must stay Dark Clawd branded). |
| Root `.gitignore` | Secrets, `node_modules/`, `dist/`, wallets, local state (`.clawdbot/`, sessions). |

### Generated / dependency folders (do not hand-edit)

`dist/`, `tui/dist/`, `node_modules/`, `mpp/dist/`, `target/`, lockfile-driven installs — rebuild from source when publishing.

---

## Root `src/` layout

```text
src/
├── cli.tsx                 # Commander CLI → dark-clawd / clawd / clawd-tui (+ legacy aliases)
├── App.tsx                 # Ink app shell
├── index.ts                # Library exports
├── openclawd.ts            # OPENCLAWD_* URLs + routes
├── config/
│   ├── schema.ts           # Zod config (apiKeys, openclawd, phoenix, solana, clawd)
│   └── themes.ts           # dark-clawd theme + palettes
├── engine/
│   └── clawd-agent.ts      # ClawdAgent OODA-style recursive agent
├── components/             # Bloomberg panels (PriceChart, Heatmap, OrderBook, …)
│                           # Root also includes Perps* panels
├── services/
│   ├── birdeye-api.ts
│   ├── birdeye-websocket.ts
│   ├── birdeye.ts          # legacy helper
│   ├── market-data-provider.ts
│   ├── helius.ts
│   ├── phoenix-perps.ts
│   ├── ai-providers.ts
│   ├── news-search.ts
│   └── index.ts
├── skills/
│   └── solana-wallet.ts
├── rebrand.test.ts
└── readme-brand.test.ts
```

**Scripts (root `package.json`):** `dev`, `run`, `build`, `build:lib`, `start`, `setup`, `status`, `wallet`, `typecheck`, `lint`, `test`, `clean`.  
**Engines:** Node ≥ 18, Bun ≥ 1.0.  
**TS:** `tsconfig.json` — ES2022, `moduleResolution: bundler`, `jsx: react-jsx`, path aliases `@/*`, `@components/*`, `@services/*`, `@engine/*`, `@skills/*`, `@config/*`.

---

## Package `tui/` layout

```text
tui/
├── package.json            # @x402solana/dark-clawd
├── bun.lock
├── tsconfig.json           # same path-alias shape as root
├── .env.example            # committed template
├── .eslintrc.cjs
├── install.sh              # one-shot installer → cheshireterminal.ai/dark-clawd
├── Dockerfile              # sandbox image: dark-clawd sandbox :18790
├── fly.toml                # app dark-clawd-sandbox, region iad, /health
├── LICENSE
├── README.md
├── dist/                   # cli.js · index.js · yoga.wasm (build artifacts)
└── src/
    ├── cli.tsx             # + trade / automate / kit / sandbox commands
    ├── App.tsx
    ├── index.ts
    ├── openclawd.ts
    ├── config/
    ├── engine/clawd-agent.ts
    ├── components/         # market TUI (no Perps* panels in this tree)
    ├── services/
    │   ├── …birdeye/helius/phoenix/ai/news…
    │   ├── trade-automation.ts
    │   ├── sandbox-server.ts
    │   └── mpp-payments.ts
    ├── skills/solana-wallet.ts
    ├── rebrand.test.ts
    └── trade-automation.test.ts
```

**Bins (built package):** `dark-clawd` · `clawd` · `clawd-tui` → `dist/cli.js`.  
**Publish files:** `dist`, `install.sh`, `fly.toml`, `Dockerfile`, `README.md`, `LICENSE`.  
**Repository field (package):** `directory: dark-clawd` (product path); root package may still list workspace `directory: dark-ralph`.

### Deploy / install (from real package files)

```bash
# One-shot
curl -fsSL https://cheshireterminal.ai/api/dark-clawd/install.sh | bash

# Local package
cd tui && bun install && cp .env.example .env && bun run run

# Fly sandbox
cd tui && fly launch --copy-config && fly deploy
# Dockerfile CMD: bun run dist/cli.js sandbox --port 18790 --host 0.0.0.0
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

`apiKeys` · `openclawd` · `phoenix` · `solana` · `clawd` · `errorHandling`  
Agent env: `CLAWD_AUTO_MODE`, `CLAWD_RECURSION_DEPTH`, `CLAWD_THOUGHT_INTERVAL`, `CLAWD_MAX_ITERATIONS` (see `config/schema.ts`).

---

## Keep `src/` and `tui/` aligned

Before publishing the package surface:

1. Prefer developing and testing in `tui/` when changing product behavior.
2. Mirror shared OpenClawd defaults and Birdeye/provider wiring into root `src/` when both trees are used.
3. Rebuild `tui/dist/` via `bun run build && bun run build:lib` (copies `yoga.wasm`).
4. Never commit `tui/.env` secrets — only `.env.example`.
