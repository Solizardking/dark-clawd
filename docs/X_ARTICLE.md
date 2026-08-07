# X Article Draft: Dark Clawd x Clawd

Huge shoutout to @GeoffreyHuntley for the Ralph pattern and the idea that useful agents get better when they operate in tight, inspectable loops:

Observe.
Orient.
Decide.
Act.
Journal.

That frame clicked for us immediately.

We have been building around it inside the Clawd stack: **Dark Clawd** as the OODA orchestrator (forged from Ralph on Solana), the Clawd TUI (`tui/` package — `clawd` · `dark-clawd` · `clawd-tui`) as the approved local development terminal, Clawd Code for deeper repo work, Automaton for heartbeat/agent loops, Solana MPP (x402 / HTTP 402) for agent payments, and Solana programs for the onchain pieces.

The result is a single working direction:

Dark Clawd watches the objective and keeps the loop honest.
Clawd does the development work on the computer with approval gates.
CLAWD bot adds commit context so changes carry a trace of what happened.
The public app shows the safe surface; secrets stay in local `.env` (never the public package) or server-side.

This matters because “autonomous agent” should not mean “unbounded agent.”

The useful version is smaller and more rigorous:

- scoped task
- fresh context
- explicit decision
- guarded action
- journaled state
- human-owned commit

That is the bridge from Ralph to Clawd.

Ralph gives the loop.
Clawd gives the hands.
Dark Clawd gives the discipline.

Shoutout @clawddevs and @GeoffreyHuntley.

We are tying these pieces together in the open: terminal UX (Bun + Ink), agent orchestration (`ClawdAgent`), Solana finance, x402 payments, local-first development, Fly sandbox surfaces, and public-safe dashboards.

The next wave of agents will not just chat. They will operate, leave receipts, and make it obvious what they did.

That is the standard we are building toward.

🦞

## Short X Post

Shoutout @GeoffreyHuntley for the Ralph OODA pattern.

We are tying it into @clawddevs:

Dark Clawd = orchestrator  
Clawd TUI = approved local dev terminal  
Clawd Code = repo work  
CLAWD bot = commit context  
Solana + x402 = agent economy

Agents should operate, leave receipts, and keep secrets out of public surfaces.
