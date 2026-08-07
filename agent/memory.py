"""Stdlib OpenClawd memory sink for Dark Ralph v1.

If OPENCLAWD_MEMORY_URL is set, ticks are posted to the memory service.
If it is unset or unavailable, ticks are mirrored to journal/memory.jsonl.
"""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
LOCAL_MEMORY_FILE = ROOT / "journal" / "memory.jsonl"


def remember_tick(entry: dict[str, Any], memory_url: str | None = None) -> None:
    note = _tick_note(entry)
    remote = (memory_url or os.environ.get("OPENCLAWD_MEMORY_URL") or "").rstrip("/")
    if remote and _post(remote, note):
        return
    _append_local(note)


def _tick_note(entry: dict[str, Any]) -> dict[str, Any]:
    tick = entry["tick"]
    decision = entry["decision"]
    outcome = entry["outcome"]
    candle = entry["candle"]
    pnl_stats = entry.get("pnl_stats", {})
    title = f"Dark Ralph Tick {tick}"
    body = "\n".join(
        [
            f"# {title}",
            "",
            f"**Strategy:** {entry.get('strategy', 'rule_based')}",
            f"**Decision:** `{decision.get('action')}`",
            f"**Reason:** {decision.get('reason', '—')}",
            f"**Outcome:** `{outcome.get('kind')}` applied={outcome.get('applied')}",
            f"**Close:** `{candle.get('c'):.4f}`",
            f"**PnL (gross):** `{pnl_stats.get('gross_pnl', 0):+,}` lamports",
            f"**Win rate:** `{pnl_stats.get('win_rate', '—')}`",
            "",
            "---",
            "### Full tick data",
            "",
            "```json",
            json.dumps(entry, indent=2, sort_keys=True),
            "```",
        ]
    )
    tags = [
        "openclawd",
        "dark-ralph",
        "ooda",
        f"tick-{tick}",
        str(decision.get("action", "hold")),
        str(entry.get("strategy", "rule_based")),
    ]
    return {
        "title": title,
        "body": body,
        "tags": tags,
        "source": "dark_ralph",
        "metadata": {
            "tick": tick,
            "strategy": entry.get("strategy"),
            "decision": decision.get("action"),
            "outcome": outcome.get("kind"),
            "pnl": pnl_stats.get("gross_pnl", 0),
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    }


def _post(base_url: str, note: dict[str, Any]) -> bool:
    for path in ("/v1/openclawd/memory/notes", "/api/v1/memory/notes"):
        try:
            req = urllib.request.Request(
                f"{base_url}{path}",
                data=json.dumps(note).encode("utf-8"),
                headers={"content-type": "application/json", "accept": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=2) as response:
                return 200 <= response.status < 300
        except (urllib.error.URLError, TimeoutError, ValueError):
            continue
    return False


def _append_local(note: dict[str, Any]) -> None:
    LOCAL_MEMORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    note_id = re.sub(r"[^a-z0-9]+", "-", note["title"].lower()).strip("-")
    record = {
        "id": f"local-{note_id}",
        "slug": note_id,
        "links": ["Dark Ralph", "OpenClawd Research"],
        "backlinks": [],
        "created_at": note["metadata"]["created_at"],
        "updated_at": note["metadata"]["created_at"],
        **note,
    }
    with LOCAL_MEMORY_FILE.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, separators=(",", ":")) + "\n")