# `agent/` - Dark Ralph OODA loop (v1)

A paper-trading, devnet-only, stdlib-Python implementation of the
"Dark Ralph" adaptation of Geoffrey Huntley's Ralph harness.

v1 upgrades: DataProvider abstraction, LLM decision function (OpenAI-compatible),
hybrid strategy mode, backtesting support, and PnL metrics (win rate, Sharpe,
max drawdown).

## Safety contract for v1

These are enforced in code. If you extend the loop, do not weaken them
without an explicit review.

| Guarantee | Where it lives |
| --- | --- |
| Mode is `paper` only | `loop.py:run_loop` rejects any other `mode:` in `RALPH.md` |
| Network is `devnet` only | `loop.py:run_loop` rejects any other `network:` in `RALPH.md` |
| Mainnet RPC URLs are rejected | `loop.py:reject_mainnet` |
| No key handling | There is no signing path in v1 |
| Position size capped per tick | `validate_decision` enforces `max_position_size_lamports` |
| One position at a time | `act` rejects a second open |
| Kill-switch on N consecutive losses | `run_loop` exits non-zero with `event: killswitch` |
| Every decision is journalled | `journal/ticks.jsonl`, append-only |

## Strategy modes

Set in `RALPH.md` frontmatter or override with `--strategy`:

| Mode | Description |
| --- | --- |
| `rule_based` | Deterministic 3-bar reversal strategy (default) |
| `llm` | OpenAI-compatible API decision function (requires `OPENAI_API_KEY`) |
| `hybrid` | Rule-based first; falls through to LLM on `hold` |

## Running it

Stdlib only. Python 3.10+.

```bash
# Default: 50 ticks, rule_based, synthetic data
python3 agent/loop.py --ticks 50 --sleep 0.0 --commit-every 0
```

With the dark TUI:

```bash
python3 agent/loop.py --ticks 200 --sleep 0.4 --tui --commit-every 0 \
  | python3 agent/tui.py
```

LLM mode (set `OPENAI_API_KEY`):

```bash
python3 agent/loop.py --ticks 50 --strategy llm --sleep 0.5
```

Backtesting with historical data:

```bash
python3 agent/loop.py --ticks 1000 --backtest path/to/candles.json
```

With git-committed journal every 10 ticks:

```bash
python3 agent/loop.py --ticks 100 --sleep 0.2 --commit-every 10
```

## CLI flags

```text
--ticks N            number of OODA iterations, default 50
--sleep SECONDS      delay between ticks, default 0.25
--seed N             RNG seed for synthesized candles, default 42
--commit-every N     git-commit the journal every N ticks; 0 disables
--tui                emit JSONL on stdout for tui.py
--memory-url URL     optional OpenClawd memory service URL
--strategy NAME      override strategy: rule_based, llm, hybrid
--backtest PATH      replay candles from JSON file; disables sleep
--mode paper         v1 only supports paper
```

## Environment

```text
SOLANA_RPC_URL       optional, devnet endpoint only
OPENCLAWD_MEMORY_URL optional memory service URL; falls back to journal/memory.jsonl
OPENAI_API_KEY       required for llm and hybrid strategies
OPENAI_API_BASE      optional API base URL (default https://api.openai.com/v1)
MAINNET_OK           do not set this for v1; there is no signing path
```

## OpenClawd Memory

Each tick is also rendered as an Obsidian-style Markdown note:

- title: `Dark Ralph Tick N`
- source: `dark_ralph`
- tags: `openclawd`, `dark-ralph`, `ooda`, action, tick number, strategy
- links: `[[Dark Ralph]]` and `[[OpenClawd Research]]`

If `OPENCLAWD_MEMORY_URL` or `--memory-url` is set, the loop posts notes
to `/v1/openclawd/memory/notes` and falls back to `/api/v1/memory/notes`.
If neither endpoint is available, it appends local notes to
`agent/journal/memory.jsonl`.

## Backtesting

Pass `--backtest path/to/candles.json` to replay historical data instead
of generating synthetic candles. The JSON file must be an array of candles:

```json
[
  {"t": 1700000000.0, "o": 100.0, "h": 101.5, "l": 99.8, "c": 100.3, "v": 500.0},
  ...
]
```

Sleep is automatically disabled during backtest (no delay between ticks).

## PnL Metrics

After the loop finishes (or on kill-switch), a summary is printed to stderr:

```
============================================================
  DARK RALPH v1 — SUMMARY
============================================================
  Strategy:     rule_based
  Mode:         paper
  Ticks:        50
  Total trades: 12
  Win rate:     58.3%
  Gross PnL:    +42,500 lamports
  Equity:       10,042,500 lamports
  Max DD:       125,000 lamports
  Sharpe:       1.234
============================================================
```

## Files

```text
agent/
├── README.md
├── RALPH.md
├── loop.py
├── tui.py
├── memory.py
└── journal/
    ├── .gitkeep
    ├── ticks.jsonl
    └── memory.jsonl
```

## Mapping back to the Ralph playbook

| Ralph rule | How this code respects it |
| --- | --- |
| Small scoped task | `RALPH.md` asks for one decision per tick, one action max |
| Fresh context per iteration | The prompt is re-read each tick; there is no conversation |
| State lives in git | `journal/ticks.jsonl`, committed every `--commit-every` ticks |
| Strong feedback loop | Paper PnL accounting, kill-switch, metrics summary |
| Branch isolation | Strategy changes should be backtested before touching main config |
| Walk-away safety | Kill-switch, size caps, one-position-at-a-time, paper-only |

Credit: the Ralph harness pattern is Geoffrey Huntley's work. Dark Ralph
is only a trading/OODA adaptation of that pattern.