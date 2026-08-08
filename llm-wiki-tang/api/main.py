from __future__ import annotations

from fastapi import FastAPI, Header, HTTPException, Query

from .memory import MemoryNoteCreate, store as memory_store, remember
from .models import AutoloopMandate, ChainResearchPayload, DefiResearchPayload, MarketResearchPayload
from .research import chain_research, defi_research, market_research, store

app = FastAPI(
    title="OpenClawd AutoResearch API",
    version="0.1.0",
    description="Local offline-safe research API for clawd-tui.",
)


@app.get("/")
def root() -> dict[str, object]:
    """Browser-friendly landing — bare / used to 404 (API has no HTML UI at /)."""
    return {
        "service": "llm-wiki-tang",
        "title": "OpenClawd AutoResearch API",
        "version": "0.1.0",
        "status": "ok",
        "health": "/health",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "endpoints": {
            "memory": [
                "POST /api/v1/memory/notes",
                "GET  /api/v1/memory/notes",
                "GET  /api/v1/memory/search?q=",
                "GET  /api/v1/memory/links",
            ],
            "research": [
                "POST /api/v1/research/chain",
                "POST /api/v1/research/defi",
                "POST /api/v1/research/market",
                "GET  /api/v1/research/runs",
            ],
            "autoloop": [
                "POST /api/v1/research/autoloop/start",
                "POST /api/v1/research/autoloop/stop",
                "GET  /api/v1/research/autoloop/status",
            ],
        },
        "tui": {
            "env": "RESEARCH_API_URL=http://127.0.0.1:8000",
            "cli": "clawd research-api status|health",
        },
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> dict[str, str]:
    """Avoid noisy 404s when opening the API URL in a browser."""
    return {"status": "no-favicon"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/memory/notes")
def memory_upsert(payload: MemoryNoteCreate):
    return remember(payload)


@app.get("/api/v1/memory/notes")
def memory_list(tag: str | None = None, source: str | None = None, limit: int = Query(default=100, ge=1, le=500)):
    return memory_store.list_notes(tag=tag, source=source, limit=limit)


@app.get("/api/v1/memory/search")
def memory_search(q: str, limit: int = Query(default=20, ge=1, le=100)):
    return memory_store.search(q, limit=limit)


@app.get("/api/v1/memory/links")
def memory_links():
    return {"links": memory_store.links()}


@app.post("/api/v1/research/chain")
def research_chain(payload: ChainResearchPayload, x_tier: str | None = Header(default=None)):
    return chain_research(payload, tier=x_tier or "local")


@app.post("/api/v1/research/defi")
def research_defi(payload: DefiResearchPayload, x_tier: str | None = Header(default=None)):
    return defi_research(payload, tier=x_tier or "local")


@app.post("/api/v1/research/market")
def research_market(payload: MarketResearchPayload, x_tier: str | None = Header(default=None)):
    return market_research(payload, tier=x_tier or "local")


@app.post("/api/v1/research/autoloop/start")
def start_autoloop() -> dict[str, int | bool]:
    newly_started = store.start()
    return {
        "running": True,
        "newly_started": newly_started,
        "interval_seconds": store.status().interval_seconds,
    }


@app.post("/api/v1/research/autoloop/stop")
def stop_autoloop() -> dict[str, bool]:
    store.stop()
    return {"running": False}


@app.get("/api/v1/research/autoloop/status")
def autoloop_status():
    return store.status()


@app.post("/api/v1/research/autoloop/mandates")
def add_mandate(mandate: AutoloopMandate):
    return store.upsert_mandate(mandate)


@app.get("/api/v1/research/autoloop/mandates")
def list_mandates() -> dict[str, list[AutoloopMandate]]:
    return {"mandates": store.list_mandates()}


@app.delete("/api/v1/research/autoloop/mandates/{name}")
def remove_mandate(name: str) -> dict[str, bool | str]:
    removed = store.delete_mandate(name)
    if not removed:
        raise HTTPException(status_code=404, detail=f"mandate not found: {name}")
    return {"removed": True, "name": name}


@app.get("/api/v1/research/runs")
def list_runs(kind: str | None = None, limit: int = Query(default=20, ge=1, le=100)):
    return {"runs": store.list_runs(kind=kind, limit=limit)}
