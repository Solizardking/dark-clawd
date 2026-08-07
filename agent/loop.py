#!/usr/bin/env python3
"""Dark Ralph OODA-loop driver v1.

Paper-trading only, devnet-only, stdlib only. v1 adds:
  - DataProvider abstraction (synthetic default, real API ready)
  - LLM decision function (OpenAI-compatible)
  - Three strategy modes: rule_based, llm, hybrid
  - Backtesting mode (--backtest path/to/candles.json)
  - PnL metrics: win rate, Sharpe ratio, max drawdown
"""

from __future__ import annotations

import argparse
import dataclasses
import json
import math
import os
import random
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from memory import remember_tick

ROOT = Path(__file__).resolve().parent
JOURNAL_DIR = ROOT / "journal"
JOURNAL_FILE = JOURNAL_DIR / "ticks.jsonl"
RALPH_MD = ROOT / "RALPH.md"

DISALLOWED_RPC_HOSTS = (
    "api.mainnet-beta.solana.com",
    "solana-mainnet",
    "mainnet.helius-rpc.com",
    "rpc.helius.xyz",
    "rpc.ankr.com/solana",
)
VALID_STRATEGIES = {"rule_based", "llm", "hybrid"}

# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------


@dataclasses.dataclass
class Candle:
    t: float
    o: float
    h: float
    l: float
    c: float
    v: float

    def to_dict(self) -> dict:
        return dataclasses.asdict(self)


@dataclasses.dataclass
class Position:
    id: str
    side: str
    size_lamports: int
    entry: float
    opened_tick: int

    def to_dict(self) -> dict:
        return dataclasses.asdict(self)


@dataclasses.dataclass
class Book:
    positions: list[Position]
    cash_lamports: int
    realized_pnl_lamports: int = 0

    def to_dict(self) -> dict:
        return {
            "positions": [p.to_dict() for p in self.positions],
            "cash_lamports": self.cash_lamports,
            "realized_pnl_lamports": self.realized_pnl_lamports,
        }


@dataclasses.dataclass
class PnLStats:
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    gross_pnl: int = 0
    peak_capital: int = 10_000_000
    max_drawdown: int = 0
    pnl_series: list[float] = dataclasses.field(default_factory=list)
    equity_series: list[float] = dataclasses.field(default_factory=list)
    returns: list[float] = dataclasses.field(default_factory=list)

    @property
    def win_rate(self) -> float:
        if self.total_trades == 0:
            return 0.0
        return self.winning_trades / self.total_trades * 100.0

    @property
    def sharpe(self) -> float:
        if len(self.returns) < 2:
            return 0.0
        avg_r = sum(self.returns) / len(self.returns)
        std_r = math.sqrt(sum((r - avg_r) ** 2 for r in self.returns) / len(self.returns))
        if std_r < 1e-12:
            return 0.0
        return avg_r / std_r * math.sqrt(252 * 390)  # annualized: ~390 ticks/day, 252 trading days


@dataclasses.dataclass
class State:
    tick: int
    initial_capital: int
    candles: list[Candle]
    book: Book
    consecutive_losses: int
    last_decisions: list[dict]
    pnl: PnLStats
    strategy: str = "rule_based"


# ---------------------------------------------------------------------------
# Data provider abstraction
# ---------------------------------------------------------------------------


class DataProvider:
    """Abstracts market data. Extend with real API adapters."""

    def __init__(self, seed: int = 42) -> None:
        self.rng = random.Random(seed)

    def fetch_candle(self, state: State) -> Candle:
        return self._synth_candle(state)

    def _synth_candle(self, state: State) -> Candle:
        last_close = state.candles[-1].c if state.candles else 100.0
        drift = self.rng.uniform(-0.6, 0.6)
        open_price = last_close
        close_price = max(1.0, last_close + drift)
        high = max(open_price, close_price) + abs(self.rng.uniform(0.0, 0.25))
        low = max(0.5, min(open_price, close_price) - abs(self.rng.uniform(0.0, 0.25)))
        volume = self.rng.uniform(100.0, 1000.0)
        return Candle(t=time.time(), o=open_price, h=high, l=low, c=close_price, v=volume)


class BacktestProvider(DataProvider):
    """Replays pre-recorded candles from a JSON file."""

    def __init__(self, path: str) -> None:
        self.path = path
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        self.candles: list[Candle] = [Candle(**c) for c in data]
        self.index = 0
        super().__init__()

    def fetch_candle(self, state: State) -> Candle:
        if self.index >= len(self.candles):
            raise SystemExit(f"backtest: exhausted {len(self.candles)} candles at tick {state.tick}")
        candle = self.candles[self.index]
        self.index += 1
        return candle


# ---------------------------------------------------------------------------
# Decision functions
# ---------------------------------------------------------------------------


def rule_based_decision(state: State, caps: dict) -> dict:
    if len(state.candles) < 3:
        return {"action": "hold", "reason": "warmup: fewer than 3 candles"}

    closes = [c.c for c in state.candles[-3:]]
    monotonic_up = closes[0] < closes[1] < closes[2]
    monotonic_down = closes[0] > closes[1] > closes[2]

    if state.book.positions:
        pos = state.book.positions[0]
        if pos.side == "long" and monotonic_down:
            return {"action": "close", "position_id": pos.id, "reason": "2-bar reversal against long"}
        if pos.side == "short" and monotonic_up:
            return {"action": "close", "position_id": pos.id, "reason": "2-bar reversal against short"}
        return {"action": "hold", "reason": "position open without reversal"}

    cap = int(caps.get("max_position_size_lamports", 1_000_000))
    size = min(cap, 500_000)
    if monotonic_up:
        return {"action": "open", "side": "long", "size_lamports": size, "reason": "3 closes monotonic up"}
    if monotonic_down:
        return {"action": "open", "side": "short", "size_lamports": size, "reason": "3 closes monotonic down"}
    return {"action": "hold", "reason": "no signal"}


def llm_decision(state: State, caps: dict) -> dict:
    """Call an OpenAI-compatible API for a decision.

    Uses env vars OPENAI_API_KEY and OPENAI_API_BASE (defaults to OpenAI).
    Falls back to rule_based on any failure.
    """
    api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("DASHSCOPE_API_KEY")
    base_url = os.environ.get("OPENAI_API_BASE", "https://api.openai.com/v1")
    model = caps.get("llm_model", "gpt-4o-mini")
    temperature = float(caps.get("llm_temperature", 0.3))

    if not api_key:
        print("llm: no API key, falling back to rule_based", file=sys.stderr)
        return rule_based_decision(state, caps)

    prompt = _build_llm_prompt(state, caps)
    try:
        import urllib.request  # noqa: lazy import / style choice
        body = json.dumps({
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": 150,
            "response_format": {"type": "json_object"},
        }).encode("utf-8")
        req = urllib.request.Request(
            f"{base_url.rstrip('/')}/chat/completions",
            data=body,
            headers={
                "content-type": "application/json",
                "authorization": f"Bearer {api_key}",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
            content = raw["choices"][0]["message"]["content"]
            decision = json.loads(content)
    except Exception as exc:
        print(f"llm: error {exc}, falling back to rule_based", file=sys.stderr)
        return rule_based_decision(state, caps)

    # Validate LLM output shape
    if not isinstance(decision, dict) or "action" not in decision:
        return {"action": "hold", "reason": f"llm returned malformed output"}
    if "reason" not in decision:
        decision["reason"] = "llm decision"
    return decision


def _build_llm_prompt(state: State, caps: dict) -> str:
    closes = [c.c for c in state.candles[-10:]]
    prompt = f"""You are a paper-trading Solana futures agent. One decision per tick.

Constraints:
- max position size: {caps.get('max_position_size_lamports', 1_000_000)} lamports
- one position at a time
- no batched actions
- reason < 140 chars

Current state:
  tick: {state.tick}
  cash: {state.book.cash_lamports} lamports
  position: {state.book.positions[0].to_dict() if state.book.positions else 'none'}
  last 10 closes: {closes}
  recent decisions (last 3): {[d.get('decision', {}).get('action') for d in state.last_decisions]}

Return exactly one of these JSON objects:
  {{"action": "hold", "reason": "<why>"}}
  {{"action": "open", "side": "long"|"short", "size_lamports": <int>, "reason": "<why>"}}
  {{"action": "close", "position_id": "<id>", "reason": "<why>"}}"""
    return prompt


def hybrid_decision(state: State, caps: dict) -> dict:
    """Try rule_based first; if hold, fall through to LLM."""
    decision = rule_based_decision(state, caps)
    if decision["action"] != "hold":
        return decision
    llm = llm_decision(state, caps)
    return llm


STRATEGY_FN: dict[str, Callable[[State, dict], dict]] = {
    "rule_based": rule_based_decision,
    "llm": llm_decision,
    "hybrid": hybrid_decision,
}


# ---------------------------------------------------------------------------
# Validation & actions
# ---------------------------------------------------------------------------


def parse_frontmatter(md_path: Path) -> dict:
    text = md_path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise SystemExit(f"{md_path} is missing frontmatter")
    end = text.find("\n---", 4)
    if end < 0:
        raise SystemExit(f"{md_path} frontmatter is unterminated")

    out: dict = {}
    for line in text[4:end].splitlines():
        line = line.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        key, value = line.split(":", 1)
        value = value.strip()
        # Try int, float, bool, or keep as string
        if value.lstrip("-").isdigit():
            value = int(value)
        elif _is_float(value):
            value = float(value)
        elif value.lower() == "true":
            value = True
        elif value.lower() == "false":
            value = False
        out[key.strip()] = value
    return out


def _is_float(s: str) -> bool:
    try:
        float(s)
        return True
    except ValueError:
        return False


def reject_mainnet(rpc_url: str | None) -> None:
    if not rpc_url:
        return
    lowered = rpc_url.lower()
    if any(host in lowered for host in DISALLOWED_RPC_HOSTS):
        sys.exit(
            f"refusing to start: RPC URL {rpc_url!r} looks like mainnet. "
            "v1 is paper-only, devnet-only, and has no signing path."
        )


def validate_decision(decision: dict, caps: dict) -> str | None:
    action = decision.get("action")
    if action not in {"hold", "open", "close"}:
        return f"unknown action {action!r}"
    if action == "open":
        side = decision.get("side")
        if side not in {"long", "short"}:
            return f"open requires side in long/short, got {side!r}"
        size = decision.get("size_lamports")
        if not isinstance(size, int) or size <= 0:
            return "open requires positive int size_lamports"
        cap = int(caps.get("max_position_size_lamports", 0))
        if size > cap:
            return f"size {size} > cap {cap}"
    if action == "close" and not decision.get("position_id"):
        return "close requires position_id"
    reason = decision.get("reason", "")
    if not isinstance(reason, str) or len(reason) > 140:
        return "reason must be a short string"
    return None


def act(decision: dict, state: State, last_close: float) -> dict:
    action = decision["action"]
    if action == "hold":
        return {"applied": True, "kind": "hold"}

    if action == "open":
        if state.book.positions:
            return {"applied": False, "kind": "open", "reason": "position already open"}
        pos = Position(
            id=f"p-{uuid.uuid4().hex[:8]}",
            side=decision["side"],
            size_lamports=int(decision["size_lamports"]),
            entry=last_close,
            opened_tick=state.tick,
        )
        state.book.positions.append(pos)
        return {"applied": True, "kind": "open", "position": pos.to_dict()}

    if action == "close":
        target_id = decision["position_id"]
        for index, pos in enumerate(state.book.positions):
            if pos.id == target_id:
                state.book.positions.pop(index)
                price_delta = last_close - pos.entry
                if pos.side == "short":
                    price_delta = -price_delta
                pnl = int(price_delta * pos.size_lamports / max(pos.entry, 1.0))
                state.book.realized_pnl_lamports += pnl
                state.book.cash_lamports += pnl
                state.consecutive_losses = state.consecutive_losses + 1 if pnl < 0 else 0

                # Track PnL stats
                pnl_stats = state.pnl
                pnl_stats.total_trades += 1
                if pnl >= 0:
                    pnl_stats.winning_trades += 1
                else:
                    pnl_stats.losing_trades += 1
                pnl_stats.gross_pnl += pnl
                pnl_stats.pnl_series.append(pnl)
                equity = state.initial_capital + state.book.realized_pnl_lamports
                equity += sum(
                    (last_close - p.entry) * p.size_lamports / max(p.entry, 1.0)
                    for p in state.book.positions
                )
                pnl_stats.equity_series.append(equity)
                if equity > pnl_stats.peak_capital:
                    pnl_stats.peak_capital = equity
                dd = pnl_stats.peak_capital - equity
                if dd > pnl_stats.max_drawdown:
                    pnl_stats.max_drawdown = dd

                if len(pnl_stats.pnl_series) >= 2:
                    prev_equity = pnl_stats.equity_series[-2]
                    ret = (equity - prev_equity) / max(prev_equity, 1.0)
                    if abs(ret) > 1e-12:
                        pnl_stats.returns.append(ret)

                return {
                    "applied": True,
                    "kind": "close",
                    "position_id": target_id,
                    "exit": last_close,
                    "pnl_lamports": pnl,
                    "consecutive_losses": state.consecutive_losses,
                }
        return {"applied": False, "kind": "close", "reason": f"position {target_id!r} not found"}

    return {"applied": False, "kind": action, "reason": "unhandled action"}


# ---------------------------------------------------------------------------
# Journal & reporting
# ---------------------------------------------------------------------------


def journal_append(entry: dict) -> None:
    JOURNAL_DIR.mkdir(parents=True, exist_ok=True)
    with JOURNAL_FILE.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry, separators=(",", ":")) + "\n")


def git_commit_journal(tick: int) -> None:
    journal_rel = str(JOURNAL_FILE.relative_to(ROOT.parent))
    try:
        subprocess.run(
            ["git", "add", "--", journal_rel],
            cwd=ROOT.parent, check=False, capture_output=True,
        )
        subprocess.run(
            ["git", "commit", "--only", "--allow-empty", "-m", f"agent: tick {tick}", "--", journal_rel],
            cwd=ROOT.parent, check=False, capture_output=True,
        )
    except FileNotFoundError:
        pass


def emit(payload: dict, tui: bool) -> None:
    sys.stdout.write(json.dumps(payload, separators=(",", ":")) + "\n")
    sys.stdout.flush()


def print_summary(state: State) -> None:
    pnl = state.pnl
    equity = state.initial_capital + state.book.realized_pnl_lamports
    print(f"\n{'=' * 60}", file=sys.stderr)
    print(f"  DARK RALPH v1 — SUMMARY", file=sys.stderr)
    print(f"{'=' * 60}", file=sys.stderr)
    print(f"  Strategy:     {state.strategy}", file=sys.stderr)
    print(f"  Mode:         paper", file=sys.stderr)
    print(f"  Ticks:        {state.tick}", file=sys.stderr)
    print(f"  Total trades: {pnl.total_trades}", file=sys.stderr)
    print(f"  Win rate:     {pnl.win_rate:.1f}%", file=sys.stderr)
    print(f"  Gross PnL:    {pnl.gross_pnl:+,} lamports", file=sys.stderr)
    print(f"  Equity:       {equity:,} lamports", file=sys.stderr)
    print(f"  Max DD:       {pnl.max_drawdown:,} lamports", file=sys.stderr)
    print(f"  Sharpe:       {pnl.sharpe:.3f}", file=sys.stderr)
    print(f"{'=' * 60}\n", file=sys.stderr)


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------


def run_loop(
    *,
    ticks: int,
    sleep_s: float,
    seed: int,
    commit_every: int,
    tui: bool,
    memory_url: str | None = None,
    decision_fn: Callable[[State, dict], dict] | None = None,
    data_provider: DataProvider | None = None,
) -> int:
    frontmatter = parse_frontmatter(RALPH_MD)
    if frontmatter.get("mode") != "paper":
        sys.exit("v1 only supports mode: paper in RALPH.md frontmatter")
    if frontmatter.get("network") != "devnet":
        sys.exit("v1 only supports network: devnet in RALPH.md frontmatter")

    reject_mainnet(os.environ.get("SOLANA_RPC_URL"))

    strategy = str(frontmatter.get("strategy", "rule_based"))
    if strategy not in VALID_STRATEGIES:
        print(f"unknown strategy {strategy!r}, defaulting to rule_based", file=sys.stderr)
        strategy = "rule_based"

    if decision_fn is None:
        decision_fn = STRATEGY_FN.get(strategy, rule_based_decision)

    provider = data_provider or DataProvider(seed=seed)
    initial_capital = 10_000_000

    pnl = PnLStats(peak_capital=initial_capital, equity_series=[float(initial_capital)])

    state = State(
        tick=0,
        initial_capital=initial_capital,
        candles=[],
        book=Book(positions=[], cash_lamports=initial_capital),
        consecutive_losses=0,
        last_decisions=[],
        pnl=pnl,
        strategy=strategy,
    )
    kill_threshold = int(frontmatter.get("loss_killswitch_consecutive", 3))

    emit({"event": "start", "frontmatter": frontmatter, "seed": seed, "ticks": ticks}, tui)

    for tick in range(1, ticks + 1):
        state.tick = tick
        candle = provider.fetch_candle(state)
        state.candles.append(candle)
        state.candles = state.candles[-256:]  # keep last 256

        decision = decision_fn(state, frontmatter)
        error = validate_decision(decision, frontmatter)
        if error:
            decision = {"action": "hold", "reason": f"rejected by harness: {error}"}

        outcome = act(decision, state, last_close=candle.c)
        entry: dict[str, Any] = {
            "tick": tick,
            "now": datetime.now(timezone.utc).isoformat(),
            "mode": "paper",
            "network": "devnet",
            "strategy": strategy,
            "candle": candle.to_dict(),
            "decision": decision,
            "outcome": outcome,
            "book": state.book.to_dict(),
            "consecutive_losses": state.consecutive_losses,
            "pnl_stats": {
                "total_trades": state.pnl.total_trades,
                "winning_trades": state.pnl.winning_trades,
                "losing_trades": state.pnl.losing_trades,
                "gross_pnl": state.pnl.gross_pnl,
                "max_drawdown": state.pnl.max_drawdown,
                "sharpe": round(state.pnl.sharpe, 4),
            },
        }
        journal_append(entry)
        remember_tick(entry, memory_url=memory_url)
        state.last_decisions = (state.last_decisions + [entry])[-3:]
        emit({"event": "tick", **entry}, tui)

        if state.consecutive_losses >= kill_threshold:
            emit(
                {
                    "event": "killswitch",
                    "tick": tick,
                    "reason": f"{state.consecutive_losses} consecutive losses >= threshold {kill_threshold}",
                },
                tui,
            )
            print_summary(state)
            return 2

        if commit_every > 0 and tick % commit_every == 0:
            git_commit_journal(tick)
        if sleep_s > 0:
            time.sleep(sleep_s)

    if commit_every > 0:
        git_commit_journal(state.tick)
    emit({"event": "done", "tick": state.tick, "book": state.book.to_dict()}, tui)
    print_summary(state)
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Dark Ralph OODA loop v1 (paper, devnet)")
    parser.add_argument("--ticks", type=int, default=50)
    parser.add_argument("--sleep", type=float, default=0.25, help="seconds between ticks")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--commit-every", type=int, default=10,
        help="git-commit journal every N ticks; 0 disables"
    )
    parser.add_argument("--tui", action="store_true", help="emit TUI-consumable JSONL")
    parser.add_argument("--memory-url", default=None, help="OpenClawd memory service URL")
    parser.add_argument(
        "--mode", default="paper", choices=["paper"],
        help="v1 only supports paper"
    )
    parser.add_argument(
        "--strategy", default=None,
        choices=sorted(VALID_STRATEGIES),
        help="override strategy from RALPH.md frontmatter"
    )
    parser.add_argument(
        "--backtest", default=None, metavar="CANDLES_JSON",
        help="path to candles.json for backtesting (disables sleep)"
    )

    args = parser.parse_args(argv)

    data_provider: DataProvider | None = None
    if args.backtest:
        data_provider = BacktestProvider(args.backtest)
        args.sleep = 0.0  # don't sleep during backtest
        print(f"backtest mode: {args.backtest}", file=sys.stderr)

    # If --strategy was passed, temporarily patch RALPH.md frontmatter
    frontmatter = parse_frontmatter(RALPH_MD)
    if args.strategy and args.strategy != frontmatter.get("strategy"):
        _patch_frontmatter_value(RALPH_MD, "strategy", args.strategy)
        print(f"patched RALPH.md strategy -> {args.strategy}", file=sys.stderr)
    elif args.strategy:
        pass
    elif frontmatter.get("strategy") not in VALID_STRATEGIES:
        print(f"frontmatter strategy {frontmatter.get('strategy')!r} unknown, using rule_based", file=sys.stderr)
        _patch_frontmatter_value(RALPH_MD, "strategy", "rule_based")

    return run_loop(
        ticks=args.ticks,
        sleep_s=args.sleep,
        seed=args.seed,
        commit_every=args.commit_every,
        tui=args.tui,
        memory_url=args.memory_url,
        data_provider=data_provider,
    )


def _patch_frontmatter_value(path: Path, key: str, value: Any) -> None:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    patched = False
    for i, line in enumerate(lines):
        if line.startswith(f"{key}:"):
            lines[i] = f"{key}: {value}\n"
            patched = True
            break
    if not patched:
        # Insert after ---\n
        lines.insert(1, f"{key}: {value}\n")
    path.write_text("".join(lines), encoding="utf-8")


if __name__ == "__main__":
    raise SystemExit(main())