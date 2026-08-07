from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from typing import Any
from uuid import uuid4

from .models import (
    AutoloopMandate,
    AutoloopStatus,
    ChainResearchPayload,
    Cost,
    DefiResearchPayload,
    MarketResearchPayload,
    ResearchResponse,
    ResearchRun,
)
from .memory import remember_research_run


DEFAULT_INTERVAL_SECONDS = 300
MAX_CONCURRENT = 2


class ResearchStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self.running = False
        self.last_tick: str | None = None
        self.tick_count = 0
        self.recent_errors: list[str] = []
        self.mandates: dict[str, AutoloopMandate] = {}
        self.runs: list[ResearchRun] = []

    def reset(self) -> None:
        with self._lock:
            self.running = False
            self.last_tick = None
            self.tick_count = 0
            self.recent_errors = []
            self.mandates = {}
            self.runs = []

    def add_run(self, kind: str, response: ResearchResponse, created_at: str) -> None:
        run = ResearchRun(
            id=response.id,
            kind=kind,
            agent=response.agent,
            query=response.query,
            sources=response.sources,
            confidence=response.confidence,
            metadata=response.metadata,
            created_at=created_at,
        )
        with self._lock:
            self.runs.insert(0, run)
            self.runs = self.runs[:500]

    def list_runs(self, kind: str | None = None, limit: int = 20) -> list[ResearchRun]:
        with self._lock:
            runs = [run for run in self.runs if kind is None or run.kind == kind]
            return runs[: max(1, min(limit, 100))]

    def upsert_mandate(self, mandate: AutoloopMandate) -> AutoloopMandate:
        with self._lock:
            self.mandates[mandate.name] = mandate
            return mandate

    def delete_mandate(self, name: str) -> bool:
        with self._lock:
            return self.mandates.pop(name, None) is not None

    def list_mandates(self) -> list[AutoloopMandate]:
        with self._lock:
            return list(self.mandates.values())

    def start(self) -> bool:
        with self._lock:
            newly_started = not self.running
            self.running = True
            self.last_tick = _now()
            self.tick_count += 1
            return newly_started

    def stop(self) -> None:
        with self._lock:
            self.running = False

    def status(self) -> AutoloopStatus:
        with self._lock:
            return AutoloopStatus(
                running=self.running,
                last_tick=self.last_tick,
                tick_count=self.tick_count,
                mandates=list(self.mandates.values()),
                interval_seconds=DEFAULT_INTERVAL_SECONDS,
                max_concurrent=MAX_CONCURRENT,
                recent_errors=self.recent_errors[-10:],
            )


store = ResearchStore()


def reset_state() -> None:
    store.reset()


def chain_research(payload: ChainResearchPayload, tier: str = "local") -> ResearchResponse:
    focus = payload.focus or ["tokens"]
    limit = payload.limit or 10
    subject = payload.mint or payload.wallet or payload.query
    results: dict[str, Any] = {
        "summary": f"Local chain research for {subject}",
        "focus": focus,
        "timeframe": payload.timeframe or "24h",
        "signals": [
            {"name": "liquidity_watch", "status": "monitor", "detail": "Verify pool depth before execution."},
            {"name": "holder_concentration", "status": "review", "detail": "Check top holder distribution."},
            {"name": "momentum", "status": "neutral", "detail": "Use live Birdeye/Helius keys for market data."},
        ][: min(limit, 3)],
    }
    if payload.mint:
        results["mint"] = payload.mint
    if payload.wallet:
        results["wallet"] = payload.wallet
    if "pump_fun" in focus:
        results["watchlist"] = ["new_launches", "graduation_progress", "dev_wallet_activity"]
    if "graduation" in focus:
        results["graduation"] = {"status": "needs_live_data", "next_check": "bonding_curve_progress"}

    return _response(
        kind="chain",
        agent="chain-researcher",
        query=payload.query,
        results=results,
        sources=["local:openclawd-chain-template", "local:solana-risk-checklist"],
        confidence=0.72,
        tier=tier,
        metadata={"focus": focus, "offline": True},
    )


def defi_research(payload: DefiResearchPayload, tier: str = "local") -> ResearchResponse:
    assets = payload.assets or ["SOL", "USDC"]
    results: dict[str, Any] = {
        "action": payload.action,
        "assets": assets,
        "risk_tolerance": payload.risk_tolerance or "medium",
        "recommendations": [],
    }
    if payload.action == "yield_scan":
        results["recommendations"] = [
            {"asset": asset, "strategy": "compare blue-chip lending and LP venues", "risk": "medium"}
            for asset in assets
        ]
    elif payload.action == "arbitrage":
        results["recommendations"] = [
            {"asset": asset, "strategy": "compare Jupiter route quotes across venues", "risk": "execution"}
            for asset in assets
        ]
    else:
        results["recommendations"] = [
            {"strategy": "run live protocol checks before capital allocation", "risk": "data_required"}
        ]

    return _response(
        kind="defi",
        agent="defi-researcher",
        query=payload.action,
        results=results,
        sources=["local:openclawd-defi-template", "local:jupiter-routing-checklist"],
        confidence=0.7,
        tier=tier,
        metadata={"protocols": payload.protocols or [], "offline": True},
    )


def market_research(payload: MarketResearchPayload, tier: str = "local") -> ResearchResponse:
    tokens = payload.tokens or []
    results = {
        "focus": payload.focus,
        "tokens": tokens,
        "timeframe": payload.timeframe or "24h",
        "include_social": bool(payload.include_social),
        "narratives": _narratives(payload.focus),
        "operator_notes": [
            "Treat this local result as a planning scaffold.",
            "Connect Birdeye, Helius, and social sources for live conviction.",
        ],
    }
    return _response(
        kind="market",
        agent="market-researcher",
        query=payload.focus,
        results=results,
        sources=payload.sources or ["local:openclawd-market-template"],
        confidence=0.68,
        tier=tier,
        metadata={"offline": True},
    )


def _response(
    *,
    kind: str,
    agent: str,
    query: str,
    results: dict[str, Any],
    sources: list[str],
    confidence: float,
    tier: str,
    metadata: dict[str, Any],
) -> ResearchResponse:
    created_at = _now()
    response = ResearchResponse(
        id=f"rs_{uuid4().hex[:16]}",
        agent=agent,
        query=query,
        results=results,
        confidence=confidence,
        sources=sources,
        cost=Cost(tier=tier),
        metadata={**metadata, "created_at": created_at},
    )
    store.add_run(kind, response, created_at)
    remember_research_run(kind, response)
    return response


def _narratives(focus: str) -> list[dict[str, str]]:
    by_focus = {
        "trends": ["Solana DeFi rotation", "AI agent wallets", "new token launches"],
        "alpha": ["early liquidity migration", "wallet cluster accumulation", "graduation setups"],
        "sentiment": ["risk-on watch", "social momentum validation", "headline sensitivity"],
        "narratives": ["agentic finance", "consumer DeFi", "compressed NFT utility"],
        "whale_moves": ["large holder changes", "CEX flow checks", "LP add/remove events"],
    }
    return [{"name": item, "status": "watch"} for item in by_focus.get(focus, [])]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()
