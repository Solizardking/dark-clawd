# Dark Clawd × Automaton Integration

**Dark Clawd** (TUI + market intelligence, forged from Ralph on Solana) vendors the **Automaton** sovereign agent runtime under `automaton/`.

| Layer | Path | Role |
|-------|------|------|
| TUI / market surface | `src/`, `tui/` | Bloomberg-style Solana terminal, ClawdAgent |
| Sovereign runtime | `automaton/` | Heartbeat, survival tiers, self-mod, replication, Conway |
| Creator CLI | `automaton/packages/cli/` | status / logs / fund / send |
| Install scripts | `automaton/scripts/` | `automaton.sh`, `crustacean-automation.sh`, `clawd-rules.txt` |
| Constitution | `automaton/constitution.md` | Immutable Clawd laws (I–III) |

## Bridge API

Shipped modules under Dark Clawd `src/`:

| Module | Role |
|--------|------|
| `src/services/automaton-bridge.ts` | Path resolve, package/constitution load, status report |
| `src/skills/automaton-skill.ts` | Skill snapshot for agent/engine |
| `src/components/AutomatonPanel.tsx` | TUI panel |
| `src/config/schema.ts` → `automaton` | Env: `AUTOMATON_*`, `CONWAY_API_URL` |
| `src/openclawd.ts` | Route `/automaton` + capability map |
| `src/App.tsx` | Boot `[AUTO]` line, API status, agents row |
| `src/components/BloombergDashboard.tsx` | View **[7] AUTOMATON** |
| `src/engine/clawd-agent.ts` | `/automaton` commands |
| `src/cli.tsx` | `dark-clawd automaton …` + status line |
| **`tui/` package** | Published `@x402solana/dark-clawd` — same bridge under `tui/src/*`, resolves sibling `../automaton`, view **[6]** |

- Resolves `automaton/` relative to the Dark Clawd package root
- Loads real `package.json`, `constitution.md`, scripts, CLI package
- Formats status for CLI + agent commands
- Optionally proxies `src/index.ts --help|--version` via Bun

### TUI

| Key | Action |
|-----|--------|
| `7` | Open Automaton view (panel + bridge commands) |
| `A` | Jump to Automaton view + emit `/automaton` |
| Agent `/automaton` | Status report in thought stream |

## CLI

```bash
# From Dark Clawd root
bun run automaton              # status report
bun run automaton:status
bun run automaton:constitution
bun run automaton:paths
bun run automaton:help

# Full runtime (after install)
bun run automaton:install
bun run automaton:build
bun run automaton:test
cd automaton && node dist/index.js --run
```

Or via the binary:

```bash
dark-clawd automaton status
dark-clawd automaton constitution
dark-clawd automaton paths
dark-clawd automaton help
```

## Agent command

Inside the TUI agent surface:

```
/automaton              # bridge status
/automaton constitution # constitution excerpt + laws
```

## Layout (vendored)

```
automaton/
├── src/                 # runtime (agent loop, heartbeat, conway, identity, …)
├── packages/cli/        # creator CLI
├── scripts/             # install + clawd rules
├── constitution.md      # immutable laws
├── package.json         # @on-chain-ai-kit/automaton
├── pnpm-workspace.yaml
└── README.md
```

## Design notes

1. **No forced monorepo merge** — Automaton stays pnpm/Node; Dark Clawd stays Bun. Root scripts `cd automaton && …`.
2. **Constitution is Clawd** — “The shell molts. The laws do not.”
3. **Next steps** (not required for this bridge): spawn Automaton as a child process from headless `dark-clawd run --headless`, share journal paths with `agent/`, surface heartbeat state in the Agent TUI view.

## Related docs

- [automaton/README.md](../automaton/README.md)
- [agent/README.md](../agent/README.md) — Python OODA (Ralph core)
- [OPENCLAWD_ADAPTATION.md](./OPENCLAWD_ADAPTATION.md)
