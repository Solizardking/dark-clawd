#!/usr/bin/env python3
"""Dark Ralph TUI v1.

Reads the loop's JSONL on stdin and renders an 80-column ANSI dashboard.
Stdlib only, no curses, no Ink.
v1 adds: equity curve sparkline, PnL stats panel, strategy pill.
"""

from __future__ import annotations

import json
import sys
from typing import Any

RESET = "\033[0m"
HOME = "\033[H"
CLEAR = "\033[2J"
HIDE_CURSOR = "\033[?25l"
SHOW_CURSOR = "\033[?25h"

LOBSTER = "\033[38;5;160m"
CLAW = "\033[38;5;124m"
SHELL = "\033[38;5;94m"
GREEN = "\033[38;5;46m"
DIM = "\033[38;5;245m"
BOLD = "\033[1m"
CYAN = "\033[38;5;45m"
YELLOW = "\033[38;5;220m"

SPARK = "▁▂▃▄▅▆▇█"

CLAW_BORDER_TOP = "╔" + "═" * 78 + "╗"
CLAW_BORDER_MID = "╠" + "═" * 78 + "╣"
CLAW_BORDER_BOT = "╚" + "═" * 78 + "╝"


def sparkline(values: list[float], width: int = 60) -> str:
    if not values:
        return ""
    vals = values[-width:]
    lo, hi = min(vals), max(vals)
    if hi - lo < 1e-9:
        return SPARK[0] * len(vals)
    out = []
    for value in vals:
        idx = int((value - lo) / (hi - lo) * (len(SPARK) - 1))
        out.append(SPARK[idx])
    return "".join(out)


def sparkline_int(values: list[int], width: int = 40) -> str:
    if not values:
        return ""
    vals = values[-width:]
    lo, hi = min(vals), max(vals)
    if hi - lo < 1:
        return SPARK[0] * len(vals)
    out = []
    for value in vals:
        idx = int((value - lo) / (hi - lo) * (len(SPARK) - 1))
        out.append(SPARK[idx])
    return "".join(out)


def fmt_lamports(value: int) -> str:
    sign = "-" if value < 0 else " "
    return f"{sign}{abs(value):>11,}ł"


def strip_ansi(text: str) -> str:
    out: list[str] = []
    i = 0
    while i < len(text):
        if text[i] == "\033":
            j = text.find("m", i)
            if j < 0:
                break
            i = j + 1
            continue
        out.append(text[i])
        i += 1
    return "".join(out)


def line(left: str, right: str = "", inner: int = 76) -> str:
    visible = strip_ansi(left) + strip_ansi(right)
    pad = max(0, inner - len(visible))
    return f"║ {left}{' ' * pad}{right} ║"


class Dashboard:
    def __init__(self) -> None:
        self.tick = 0
        self.frontmatter: dict[str, Any] = {}
        self.closes: list[float] = []
        self.last_decision: dict[str, Any] = {"action": "—", "reason": "waiting for first tick"}
        self.book: dict[str, Any] = {"positions": [], "cash_lamports": 0, "realized_pnl_lamports": 0}
        self.consecutive_losses = 0
        self.killswitch_threshold = 3
        self.killed: dict[str, Any] | None = None
        self.done: dict[str, Any] | None = None
        self.strategy: str = "rule_based"
        self.pnl_stats: dict[str, Any] = {}
        self.equity_series: list[int] = []

    def ingest(self, event: dict[str, Any]) -> None:
        kind = event.get("event")
        if kind == "start":
            self.frontmatter = event.get("frontmatter", {})
            self.killswitch_threshold = int(self.frontmatter.get("loss_killswitch_consecutive", 3))
            self.strategy = str(self.frontmatter.get("strategy", "rule_based"))
        elif kind == "tick":
            self.tick = int(event["tick"])
            self.closes.append(float(event["candle"]["c"]))
            self.last_decision = event.get("decision", self.last_decision)
            self.book = event.get("book", self.book)
            self.consecutive_losses = int(event.get("consecutive_losses", self.consecutive_losses))
            self.strategy = str(event.get("strategy", self.strategy))
            self.pnl_stats = event.get("pnl_stats", self.pnl_stats)
            # Build equity curve from PnL stats
            initial = self.frontmatter.get("initial_capital", 10_000_000)
            if isinstance(initial, str):
                initial = int(initial)
            gross = self.pnl_stats.get("gross_pnl", 0)
            if isinstance(gross, str):
                gross = int(gross)
            self.equity_series.append(initial + gross)
        elif kind == "killswitch":
            self.killed = event
        elif kind == "done":
            self.done = event

    def render(self) -> str:
        mode = self.frontmatter.get("mode", "?")
        network = self.frontmatter.get("network", "?")
        pnl = int(self.book.get("realized_pnl_lamports", 0))
        pnl_color = GREEN if pnl >= 0 else LOBSTER
        status_pill = (
            f"{LOBSTER}● {BOLD}OODA{RESET}{DIM}  ·  {RESET}"
            f"{SHELL}{str(mode).upper()}{RESET}{DIM}  ·  {RESET}"
            f"{SHELL}{str(network).upper()}{RESET}{DIM}  ·  {RESET}"
            f"{CYAN}{str(self.strategy)}{RESET}"
        )
        header_left = f"{LOBSTER}{BOLD}DARK RALPH{RESET}   {status_pill}"
        header_right = (
            f"{DIM}tick{RESET} {BOLD}{self.tick:>5}{RESET}   "
            f"{DIM}pnl{RESET} {pnl_color}{pnl:+,}{RESET}"
        )

        # Price sparkline
        spark = sparkline(self.closes, width=66)
        last_close = self.closes[-1] if self.closes else 0.0

        # Position
        positions = self.book.get("positions", [])
        if positions:
            position = positions[0]
            mark = last_close
            entry = float(position["entry"])
            delta = (mark - entry) if position["side"] == "long" else (entry - mark)
            unrealized = int(delta * int(position["size_lamports"]) / max(entry, 1.0))
            unreal_color = GREEN if unrealized >= 0 else LOBSTER
            pos_line = (
                f"{BOLD}{position['side'].upper():<5}{RESET} "
                f"{fmt_lamports(int(position['size_lamports']))}   "
                f"{DIM}entry{RESET} {entry:7.3f}   "
                f"{DIM}mark{RESET} {mark:7.3f}   "
                f"{DIM}u-pnl{RESET} {unreal_color}{unrealized:+,}{RESET}"
            )
        else:
            pos_line = f"{DIM}(no open position){RESET}"

        # Decision
        action = str(self.last_decision.get("action", "—"))
        reason = str(self.last_decision.get("reason", ""))
        action_color = {"open": GREEN, "close": SHELL, "hold": DIM}.get(action, LOBSTER)
        decision_line = f"{action_color}{BOLD}{action:<6}{RESET}{DIM}—{RESET} {reason[:60]}"

        # Killswitch
        losses = self.consecutive_losses
        threshold = self.killswitch_threshold
        dots = "".join(("●" if i < losses else "○") for i in range(threshold))
        ks_color = LOBSTER if losses >= threshold else (SHELL if losses > 0 else DIM)
        ks_line = f"{ks_color}{dots}{RESET}  {DIM}({losses} / {threshold} consecutive losses){RESET}"

        # PnL stats panel
        ps = self.pnl_stats
        total_trades = ps.get("total_trades", 0)
        win_rate = ps.get("winning_trades", 0) / max(total_trades, 1) * 100
        gross_pnl = ps.get("gross_pnl", 0)
        max_dd = ps.get("max_drawdown", 0)
        sharpe = ps.get("sharpe", 0.0)

        pnl_panel = (
            f"{DIM}trades:{RESET} {total_trades:>3}  "
            f"{DIM}win:{RESET} {CYAN}{win_rate:5.1f}%{RESET}  "
            f"{DIM}gross:{RESET} {pnl_color}{gross_pnl:+,}{RESET}  "
            f"{DIM}dd:{RESET} {YELLOW}{max_dd:+,}{RESET}  "
            f"{DIM}sharpe:{RESET} {BOLD}{sharpe:>6.3f}{RESET}"
        )

        # Equity curve sparkline
        equity_spark = sparkline_int(self.equity_series, width=40) if self.equity_series else ""
        equity_current = self.equity_series[-1] if self.equity_series else 0
        equity_color = GREEN if equity_current >= self.frontmatter.get("initial_capital", 10_000_000) else LOBSTER

        rows = [
            f"{CLAW}{CLAW_BORDER_TOP}{RESET}",
            line(header_left, header_right),
            f"{CLAW}{CLAW_BORDER_MID}{RESET}",
            line(""),
            line(f"{DIM}PRICE  (last 66 closes){RESET}"),
            line(f"  {LOBSTER}{spark}{RESET}", f"{BOLD}{last_close:7.3f}{RESET}"),
            line(""),
            line(f"{DIM}POSITION{RESET}"),
            line(f"  {pos_line}"),
            line(""),
            line(f"{DIM}LAST DECISION{RESET}"),
            line(f"  {decision_line}"),
            line(""),
            line(f"{DIM}KILLSWITCH{RESET}"),
            line(f"  {ks_line}"),
            line(""),
            line(f"{DIM}PNL STATS{RESET}"),
            line(f"  {pnl_panel}"),
            line(""),
            line(f"{DIM}EQUITY CURVE{RESET}"),
            line(f"  {equity_color}{equity_spark}{RESET}  {equity_color}{BOLD}{equity_current:>10,}{RESET} lamports"),
            line(""),
        ]

        if self.killed:
            rows.append(line(f"{LOBSTER}{BOLD}HALTED{RESET}  {self.killed.get('reason', '')}"[:78]))
        elif self.done:
            rows.append(line(f"{GREEN}DONE{RESET}    tick {self.done.get('tick', '?')}"))
        else:
            rows.append(line(f"{DIM}running...{RESET}"))

        rows.append(f"{CLAW}{CLAW_BORDER_BOT}{RESET}")
        return "\n".join(rows)


def main() -> int:
    sys.stdout.write(HIDE_CURSOR + CLEAR)
    sys.stdout.flush()
    dashboard = Dashboard()
    try:
        for raw in sys.stdin:
            raw = raw.strip()
            if not raw:
                continue
            try:
                event = json.loads(raw)
            except json.JSONDecodeError:
                continue
            dashboard.ingest(event)
            sys.stdout.write(HOME + dashboard.render() + "\n")
            sys.stdout.flush()
    except KeyboardInterrupt:
        pass
    finally:
        sys.stdout.write(SHOW_CURSOR + "\n")
        sys.stdout.flush()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())