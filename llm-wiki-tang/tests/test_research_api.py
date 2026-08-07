def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_chain_research_contract_and_run_history(client):
    response = client.post(
        "/api/v1/research/chain",
        json={"query": "token CLAWD", "focus": ["tokens"], "mint": "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"].startswith("rs_")
    assert body["agent"] == "chain-researcher"
    assert body["query"] == "token CLAWD"
    assert body["cost"]["tier"] == "local"
    assert body["metadata"]["offline"] is True

    runs = client.get("/api/v1/research/runs", params={"kind": "chain", "limit": 5}).json()["runs"]
    assert len(runs) == 1
    assert runs[0]["id"] == body["id"]
    assert runs[0]["kind"] == "chain"


def test_defi_and_market_research(client):
    defi = client.post("/api/v1/research/defi", json={"action": "yield_scan", "assets": ["SOL", "USDC"]})
    market = client.post("/api/v1/research/market", json={"focus": "alpha", "tokens": ["CLAWD"]})

    assert defi.status_code == 200
    assert defi.json()["results"]["action"] == "yield_scan"
    assert market.status_code == 200
    assert market.json()["results"]["focus"] == "alpha"

    runs = client.get("/api/v1/research/runs", params={"limit": 10}).json()["runs"]
    assert [run["kind"] for run in runs] == ["market", "defi"]


def test_autoloop_lifecycle_and_mandates(client):
    status = client.get("/api/v1/research/autoloop/status").json()
    assert status["running"] is False
    assert status["tick_count"] == 0

    started = client.post("/api/v1/research/autoloop/start").json()
    assert started["running"] is True
    assert started["newly_started"] is True

    mandate = {
        "name": "alpha-watch",
        "kind": "market",
        "payload": {"focus": "alpha"},
        "enabled": True,
    }
    added = client.post("/api/v1/research/autoloop/mandates", json=mandate)
    assert added.status_code == 200

    mandates = client.get("/api/v1/research/autoloop/mandates").json()["mandates"]
    assert mandates == [mandate | {"interval_seconds": None}]

    status = client.get("/api/v1/research/autoloop/status").json()
    assert status["running"] is True
    assert status["mandates"][0]["name"] == "alpha-watch"

    removed = client.delete("/api/v1/research/autoloop/mandates/alpha-watch")
    assert removed.status_code == 200
    assert client.get("/api/v1/research/autoloop/mandates").json()["mandates"] == []

    stopped = client.post("/api/v1/research/autoloop/stop").json()
    assert stopped == {"running": False}
