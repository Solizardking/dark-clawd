# Changelog

## 1.1.0 — SOL GPT tools + OpenRouter agent harness

- **171 SOL GPT tools** shipped (`dark-clawd tools`) — Phoenix, Imperial, market, OHLCV, wallet, Helius, Solana Tracker (60), trading, prediction, browser, agents, platform
- **OpenRouter agent harness** (`dark-clawd agent`) — multi-turn tool loop with core tools always loaded, `search_tools` for specialty, max-steps stop condition
- Non-custodial `prepare_*` plans; install.sh documents tools + agent + env keys
- Product hub: https://cheshireterminal.ai/dark-clawd · GitHub: https://github.com/Solizardking/dark-clawd

```bash
npm install -g @x402solana/dark-clawd
dark-clawd tools
dark-clawd agent
```

## 1.0.0 — First public release

**Product hub:** [cheshireterminal.ai/dark-clawd](https://cheshireterminal.ai/dark-clawd)  
**Source:** [github.com/Solizardking/dark-clawd](https://github.com/Solizardking/dark-clawd)  
**npm package name:** `@x402solana/dark-clawd`  
**Release asset:** [x402solana-dark-clawd-1.0.0.tgz](https://github.com/Solizardking/dark-clawd/releases/download/v1.0.0/x402solana-dark-clawd-1.0.0.tgz)

### Install (Node.js ≥18 — Bun not required)

```bash
# Recommended for v1.0.0 (GitHub release tarball)
npm install -g https://github.com/Solizardking/dark-clawd/releases/download/v1.0.0/x402solana-dark-clawd-1.0.0.tgz
dark-clawd welcome
dark-clawd --help
dark-clawd status
dark-clawd run
```

Or installer (registry → tarball fallback):

```bash
curl -fsSL https://raw.githubusercontent.com/Solizardking/dark-clawd/main/tui/install.sh | bash
```

### Highlights

- Bloomberg-style Solana TUI (`dark-clawd run`)
- One-shot npm package with Node shebang bins: `dark-clawd` · `clawd` · `clawd-tui`
- Friendly commands: `welcome`, `info`, `setup`, `status`
- Trade automation kit (paper by default) + sandbox HTTP API
- Automaton sovereign-runtime bridge (when vendored sibling is present)
- Product identity wired to Cheshire hub + public GitHub repo

### Notes

- Prefer installing from the `tui/` package surface (this package).
- API keys are optional to boot; missing providers show as disconnected.
