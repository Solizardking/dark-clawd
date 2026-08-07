from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class Cost(BaseModel):
    sol: float = 0.0
    clawd: float = 0.0
    tier: str = "local"


class ResearchResponse(BaseModel):
    id: str
    agent: str
    query: str
    results: dict[str, Any]
    confidence: float = Field(ge=0.0, le=1.0)
    sources: list[str]
    cost: Cost
    metadata: dict[str, Any]


class ChainResearchPayload(BaseModel):
    query: str
    focus: list[Literal["pump_fun", "tokens", "protocols", "nfts", "wallets", "graduation"]] | None = None
    timeframe: str | None = None
    limit: int | None = Field(default=None, ge=1, le=100)
    mint: str | None = None
    wallet: str | None = None


class DefiResearchPayload(BaseModel):
    action: Literal["yield_scan", "lp_analysis", "arbitrage", "protocol_research", "swap_route"]
    protocols: list[str] | None = None
    assets: list[str] | None = None
    focus: list[str] | None = None
    amount: float | None = Field(default=None, ge=0)
    risk_tolerance: Literal["low", "medium", "high"] | None = None


class MarketResearchPayload(BaseModel):
    focus: Literal["sentiment", "trends", "alpha", "narratives", "whale_moves"]
    tokens: list[str] | None = None
    sources: list[str] | None = None
    timeframe: str | None = None
    include_social: bool | None = None


class AutoloopMandate(BaseModel):
    name: str = Field(min_length=1)
    kind: Literal["chain", "defi", "market"]
    payload: dict[str, Any]
    enabled: bool = True
    interval_seconds: int | None = Field(default=None, ge=5)


class AutoloopStatus(BaseModel):
    running: bool
    last_tick: str | None
    tick_count: int
    mandates: list[AutoloopMandate]
    interval_seconds: int
    max_concurrent: int
    recent_errors: list[str]


class ResearchRun(BaseModel):
    id: str
    kind: str
    agent: str
    query: str
    sources: list[str]
    confidence: float | None
    metadata: dict[str, Any]
    created_at: str | None
