# Changelog

## 1.0.0 — First public release

**Product hub:** [cheshireterminal.ai/dark-clawd](https://cheshireterminal.ai/dark-clawd)  
**Source:** [github.com/Solizardking/dark-clawd](https://github.com/Solizardking/dark-clawd)  
**npm:** `@openclawdsolana/dark-clawd`

### Install (Node.js ≥18 — Bun not required)

```bash
npm install -g @openclawdsolana/dark-clawd
dark-clawd welcome
dark-clawd --help
dark-clawd status
dark-clawd run
```

Or:

```bash
curl -fsSL https://cheshireterminal.ai/api/dark-clawd/install.sh | bash
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
