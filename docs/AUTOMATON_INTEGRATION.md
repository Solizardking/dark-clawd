# Dark Clawd × Automaton Integration

**Dark Clawd** (TUI + market intelligence, forged from Ralph on Solana) vendors the **Automaton** sovereign agent runtime under `automaton/`.

After the **TUI upgrade**, the preferred product surface is the published package under **`tui/`** (`@x402solana/dark-clawd`). Root `src/` remains a monorepo dev mirror.

| Layer | Path | Role |
|-------|------|------|
| **Product TUI (canonical)** | `tui/` · `tui/src/` | Bloomberg Solana terminal, ClawdAgent, view **[6] AUTOMATON** |
| Monorepo TUI bridge | `tui/tui.ts` | `runTui()` for scripts/wizard |
| Root TUI (dev) | `src/` | Same bridge pattern; keep aligned with `tui/` |
| Sovereign runtime | `automaton/` | Heartbeat, survival tiers, self-mod, replication, Conway |
| Creator CLI | `automaton/packages/cli/` | status / logs / fund / send |
| Install scripts | `automaton/scripts/` | `automaton.sh`, `crustacean-automation.sh`, `clawd-rules.txt` |
| Constitution | `automaton/constitution.md` | Immutable Clawd laws (I–III) |

Full monorepo inventory: [MONOREPO.md](./MONOREPO.md).

## Bridge API

Shipped modules (prefer **`tui/src/*`** for product; root `src/*` for monorepo dev):

| Module | Role |
|--------|------|
| `*/services/automaton-bridge.ts` | Path resolve, package/constitution load, status report |
| `*/skills/automaton-skill.ts` | Skill snapshot for agent/engine |
| `*/components/AutomatonPanel.tsx` | TUI panel |
| `*/config/schema.ts` → `automaton` | Env: `AUTOMATON_*`, `CONWAY_API_URL` |
| `*/openclawd.ts` | Route `/automaton` + capability map |
| `*/App.tsx` | Boot `[AUTO]` line, API status, agents row |
| `*/components/BloombergDashboard.tsx` | Automaton view key |
| `*/engine/clawd-agent.ts` | `/automaton` commands |
| `*/cli.tsx` | `dark-clawd automaton …` + status line |
| **`tui/` package** | Published `@x402solana/dark-clawd` — resolves sibling `../automaton` |

- Resolves `automaton/` relative to the Dark Clawd package / monorepo root
- Loads real `package.json`, `constitution.md`, scripts, CLI package
- Formats status for CLI + agent commands
- Optionally proxies Automaton entrypoint help/version via Bun

### TUI (product package)

| Key | Action |
|-----|--------|
| `6` | Open Automaton view (panel + bridge commands) in **`tui/`** |
| `A` | Jump to Automaton view + emit `/automaton` |
| Agent `/automaton` | Status report in thought stream |
| `7` | Root `src/` dashboard may still map Automaton to view 7 — prefer package **[6]** when using `tui/` |

## CLI

```bash
# From monorepo root (root package scripts)
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

# From product package
cd tui && bun run automaton:status
```

Or via the installed binary:

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
3. **TUI upgrade** — publish and document Automaton UX from `tui/`; monorepo scripts may still call root `src/cli.tsx`.
4. **Next steps** (optional): spawn Automaton as a child process from headless `dark-clawd run --headless`, share journal paths with `agent/`, surface heartbeat state in the Agent TUI view.

## Related docs

- [MONOREPO.md](./MONOREPO.md) — full tree map
- [automaton/README.md](../automaton/README.md)
- [agent/README.md](../agent/README.md) — Python OODA (Ralph core)
- [tui/README.md](../tui/README.md) — product TUI
- [OPENCLAWD_ADAPTATION.md](./OPENCLAWD_ADAPTATION.md)
