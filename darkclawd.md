# Dark Clawd — Cheshire Terminal hub handoff

**Audience:** coding agents implementing or updating the product client at **https://cheshireterminal.ai/dark-clawd**  
**Source package:** `@x402solana/dark-clawd` (published from repo `tui/`)  
**Status:** **live on the public npm registry** at **1.1.1** (`dist-tags.latest`)

Use this file as the single handoff. Do not invent alternate package names, bin names, or install URLs.

---

## 1. Mission

Add / update a **Dark Clawd client surface** on Cheshire Terminal so users can:

1. Discover Dark Clawd (what it is, tools, agent, TUI).
2. Install in one shot (`npm install -g` or curl installer).
3. Deep-link into verified CLI commands and optional sandbox/kit endpoints.
4. Stay aligned with the shipped npm package (no stale “coming soon” / 404 registry copy).

Primary route: **`/dark-clawd`** on `cheshireterminal.ai`.

---

## 2. Canonical identity (do not drift)

| Field | Value |
|-------|--------|
| Product name | Dark Clawd |
| Tagline | Autonomous Solana terminal intelligence — Bloomberg TUI + 171 SOL GPT tools + OpenRouter agent harness |
| npm package | `@x402solana/dark-clawd` |
| Version (current latest) | `1.1.1` |
| Registry | `https://registry.npmjs.org/@x402solana/dark-clawd` |
| npm page | `https://www.npmjs.com/package/@x402solana/dark-clawd` |
| Bins | `dark-clawd`, `clawd`, `clawd-tui` (all → package `dist/cli.js`) |
| Runtime | **Node.js ≥18** (Bun **not** required for consumers) |
| Hub | `https://cheshireterminal.ai/dark-clawd` |
| GitHub | `https://github.com/Solizardking/dark-clawd` |
| Issues | `https://github.com/Solizardking/dark-clawd/issues` |
| Release | `https://github.com/Solizardking/dark-clawd/releases/tag/v1.1.1` |
| Publish surface in monorepo | `tui/` (`package.json` `name`, `bin`, `prepack` → build + Node shebang) |
| License | MIT |

Source of truth in package code: `tui/src/product.ts` (`PACKAGE_NAME`, `PACKAGE_VERSION`, `PRODUCT_*` URLs).

---

## 3. Install paths the hub must advertise

### Preferred (registry — works today)

```bash
npm install -g @x402solana/dark-clawd
dark-clawd --help
```

Pin optional:

```bash
npm install -g @x402solana/dark-clawd@1.1.1
```

### One-shot installer scripts

```bash
# GitHub raw (always available from this repo)
curl -fsSL https://raw.githubusercontent.com/Solizardking/dark-clawd/main/tui/install.sh | bash

# Hub proxy (implement this on Cheshire if not already)
curl -fsSL https://cheshireterminal.ai/api/dark-clawd/install.sh | bash
```

`install.sh` behavior (see `tui/install.sh`):

1. Prefer `npm install -g @x402solana/dark-clawd@VERSION`
2. Fallback: user prefix under `~/.darkclawd` + link bins to `~/.local/bin`
3. Fallback: GitHub release tarball  
   `https://github.com/Solizardking/dark-clawd/releases/download/v1.1.1/x402solana-dark-clawd-1.1.1.tgz`

### npx / no global install

```bash
npx @x402solana/dark-clawd --help
npx @x402solana/dark-clawd welcome
```

### Release tarball only

```bash
npm install -g https://github.com/Solizardking/dark-clawd/releases/download/v1.1.1/x402solana-dark-clawd-1.1.1.tgz
```

**UI copy rules**

- Lead with registry install. Do **not** say “not published” / “private beta only”.
- Note Node ≥18.
- Show bins: `dark-clawd` · `clawd` · `clawd-tui`.
- After install, primary CTA: `dark-clawd welcome` or `dark-clawd run`.

---

## 4. Hub page product blocks (recommended UI)

Implement (or update) `/dark-clawd` with these sections:

### A. Hero

- Title: **Dark Clawd**
- Subtitle: Bloomberg-style Solana TUI · 171 SOL GPT tools · OpenRouter agent harness
- Badges/links: npm version, GitHub, release v1.1.1, tools count
- Primary CTA button: copy `npm install -g @x402solana/dark-clawd`
- Secondary CTA: copy curl installer / open GitHub

### B. Install card (copy buttons)

1. Registry: `npm install -g @x402solana/dark-clawd`
2. Curl: `curl -fsSL https://cheshireterminal.ai/api/dark-clawd/install.sh | bash`
3. Verify: `dark-clawd --help && dark-clawd welcome`

### C. First-run commands

| Command | Purpose |
|---------|---------|
| `dark-clawd welcome` | First-run guide (hub, GitHub, install, next steps) |
| `dark-clawd --help` | Full CLI map |
| `dark-clawd status` | API / config health |
| `dark-clawd setup` | Interactive env wizard |
| `dark-clawd tools` | 171-tool catalog |
| `dark-clawd agent` | OpenRouter multi-turn tool loop |
| `dark-clawd run` | Ink/React Bloomberg TUI |
| `dark-clawd kit` | Automation kit manifest (install + sandbox URLs) |
| `dark-clawd sandbox` | Local/Fly sandbox HTTP API |

### D. Capabilities

- **TUI** — market, trading, portfolio, analytics, agent, automaton views
- **171 SOL GPT tools** — Phoenix, Imperial, Tracker, Helius, Birdeye, etc. (see `docs/SOL_GPT_TOOLS.md`)
- **OpenRouter agent** — multi-turn tool loop over the catalog (`OPENROUTER_API_KEY`)
- **Non-custodial** — `prepare_*` tools = user-signed; server never holds keys
- **Automaton** — sovereign agent runtime bridge (`dark-clawd automaton …`)

### E. Links footer

- npm · GitHub · Release · Issues · monorepo README · this handoff for agents

---

## 5. Cheshire API / proxy endpoints to implement

Mirror what the package already expects in `tui/src/product.ts` and `tui/install.sh`.

### Required

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/api/dark-clawd/install.sh` | Proxy or serve `tui/install.sh` from GitHub main (or pin to release tag). `Content-Type: text/x-shellscript` or `text/plain`. Cache short TTL. |
| `GET` | `/dark-clawd` | Product landing page (HTML/Next/etc.) with install CTAs above. |

### Recommended

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/api/dark-clawd` | JSON product card (see schema below) for other Cheshire pages / agents. |
| `GET` | `/api/dark-clawd/version` | `{ "package": "@x402solana/dark-clawd", "latest": "1.1.1", "fetchedAt": "…" }` — optionally live-`npm view` with cache. |
| `GET` | `/api/dark-clawd/kit` | Proxy sample automation kit manifest (from CLI `dark-clawd kit` shape). |

### Optional deep links

- `/dark-clawd/tools` → docs or embed of tool groups (171 / 122 core)
- `/dark-clawd/install` → redirect or focus install card
- `/dark-clawd/agent` → OpenRouter agent instructions + env vars

### Product card JSON schema (`GET /api/dark-clawd`)

```json
{
  "product": "Dark Clawd",
  "package": "@x402solana/dark-clawd",
  "version": "1.1.1",
  "distTag": "latest",
  "bins": ["dark-clawd", "clawd", "clawd-tui"],
  "engines": { "node": ">=18.0.0" },
  "install": {
    "npm": "npm install -g @x402solana/dark-clawd",
    "npmPinned": "npm install -g @x402solana/dark-clawd@1.1.1",
    "curl": "curl -fsSL https://cheshireterminal.ai/api/dark-clawd/install.sh | bash",
    "curlGithub": "curl -fsSL https://raw.githubusercontent.com/Solizardking/dark-clawd/main/tui/install.sh | bash",
    "tarball": "npm install -g https://github.com/Solizardking/dark-clawd/releases/download/v1.1.1/x402solana-dark-clawd-1.1.1.tgz",
    "npx": "npx @x402solana/dark-clawd --help"
  },
  "commands": {
    "help": "dark-clawd --help",
    "welcome": "dark-clawd welcome",
    "status": "dark-clawd status",
    "setup": "dark-clawd setup",
    "tools": "dark-clawd tools",
    "agent": "dark-clawd agent",
    "run": "dark-clawd run",
    "kit": "dark-clawd kit",
    "sandbox": "dark-clawd sandbox"
  },
  "urls": {
    "hub": "https://cheshireterminal.ai/dark-clawd",
    "npm": "https://www.npmjs.com/package/@x402solana/dark-clawd",
    "github": "https://github.com/Solizardking/dark-clawd",
    "release": "https://github.com/Solizardking/dark-clawd/releases/tag/v1.1.1",
    "issues": "https://github.com/Solizardking/dark-clawd/issues",
    "toolsDoc": "https://github.com/Solizardking/dark-clawd/blob/main/docs/SOL_GPT_TOOLS.md"
  },
  "features": {
    "toolsTotal": 171,
    "toolsCore": 122,
    "tui": true,
    "openRouterAgent": true,
    "nonCustodial": true,
    "automaton": true
  }
}
```

Keep this JSON in sync with npm latest (poll `npm view @x402solana/dark-clawd version` or hardcode + bump on release).

---

## 6. Client integration patterns

### A. Static marketing page only

- Hardcode install commands + links from §2–§3.
- Version badge: use shields.io npm v badge or live `/api/dark-clawd/version`.

### B. “Install” button that copies command

- Clipboard: `npm install -g @x402solana/dark-clawd`
- Toast: “Paste in a terminal with Node ≥18”

### C. In-browser “connected” agent UX (optional)

If Cheshire already spawns agent sandboxes / terminals:

1. Prefer ensuring Node ≥18 in the box.
2. Run `npm install -g @x402solana/dark-clawd` (or `npx`).
3. Exec `dark-clawd tools` / `dark-clawd agent` with user-provided API keys via env (never log secrets).
4. For TUI (`dark-clawd run`), need a real PTY / terminal emulator surface — do not fake Ink output in DOM without a terminal.

### D. Sandbox / automation kit

Local default sandbox base: `http://127.0.0.1:18790`

Manifest fields (from `buildAutomationKitManifest` in `tui/src/services/trade-automation.ts`):

- `install.npm` / `install.curl` / `install.tarball` / `install.npx`
- `sandbox.health` → `/health`
- `sandbox.status` → `/api/status`
- `sandbox.automations` → `/api/automations`
- `sandbox.tradePlan` → `/api/trade/plan`

CLI: `dark-clawd kit` prints the manifest; `dark-clawd sandbox` starts the server.

Hub may document these as **local/Fly operator** endpoints, not public Cheshire multi-tenant APIs, unless you deliberately host a shared sandbox.

---

## 7. Env / keys the hub should document (not collect unless user opts in)

| Variable | Used for |
|----------|----------|
| `OPENROUTER_API_KEY` | `dark-clawd agent` multi-turn harness |
| `HELIUS_API_KEY` / RPC URLs | wallet + DAS tooling |
| `BIRDEYE_API_KEY` | market data |
| Other provider keys | Grok, Perplexity, etc. via `dark-clawd setup` |

Prefer linking to `dark-clawd setup` / local `.env` rather than storing keys on Cheshire unless product already has a secrets vault.

---

## 8. Acceptance checklist for the hub agent

- [ ] `/dark-clawd` loads and shows **npm registry install** as primary CTA  
- [ ] Copy-paste `npm install -g @x402solana/dark-clawd` works on a clean machine (Node ≥18)  
- [ ] Page lists bins `dark-clawd` · `clawd` · `clawd-tui`  
- [ ] `GET /api/dark-clawd/install.sh` returns the installer (or 302 to GitHub raw) and is referenced on the page  
- [ ] Links: npm package, GitHub, release v1.1.1, issues  
- [ ] Version shown matches registry `latest` (1.1.1 as of this handoff)  
- [ ] No copy claiming package is unpublished / private-only  
- [ ] Optional: `GET /api/dark-clawd` returns product JSON schema above  
- [ ] Optional: live version endpoint backed by `npm view` with cache  

### Local verification the implementer can run

```bash
npm view @x402solana/dark-clawd name version dist-tags bin
npm install -g @x402solana/dark-clawd
dark-clawd --help
dark-clawd welcome
# hub
curl -fsSL https://cheshireterminal.ai/api/dark-clawd/install.sh | head
curl -fsSL https://cheshireterminal.ai/api/dark-clawd | head
```

---

## 9. Repo map (for implementers who need source)

| Path | Role |
|------|------|
| `tui/` | **Published** npm package surface |
| `tui/package.json` | name, version, bins, `prepack` / `publishConfig.access=public` |
| `tui/src/product.ts` | Canonical URLs + install strings |
| `tui/src/cli.tsx` | Commander CLI entry |
| `tui/install.sh` | One-shot installer |
| `tui/src/services/trade-automation.ts` | Automation kit manifest |
| `tui/src/services/sandbox-server.ts` | Sandbox HTTP API |
| `docs/SOL_GPT_TOOLS.md` | Tool catalog narrative |
| `README.md` | Monorepo overview + top install section |
| `darkclawd.md` | **This handoff** |

---

## 10. Out of scope / non-goals for the hub client

- Do not republish the package under a different npm name.
- Do not require Bun for end users.
- Do not store private keys or auto-sign transactions server-side.
- Do not replace the CLI with a partial browser-only reimplementation unless feature-flagged as “preview” — the product is the terminal package.

---

## 11. Release bump protocol (when version changes)

1. Bump `tui/package.json` + `tui/src/product.ts` `PACKAGE_VERSION`.
2. `cd tui && npm publish --access public` (OTP as needed).
3. Tag GitHub `vX.Y.Z` and attach `x402solana-dark-clawd-X.Y.Z.tgz` if using release tarball fallback.
4. Update hub hardcodes / cache for version + release URLs.
5. Refresh this file’s version table if still used as agent context.

---

*Handoff generated for parallel work: ship hub client while the monorepo remains source of truth for `@x402solana/dark-clawd`.*
