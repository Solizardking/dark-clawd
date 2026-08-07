def test_memory_notes_search_and_links(client):
    response = client.post(
        "/api/v1/memory/notes",
        json={
            "title": "OpenClawd Vault",
            "body": "Connect [[Dark Ralph]] with [[LLM Wiki]] research.",
            "tags": ["Memory", "CLAWD"],
            "source": "manual",
        },
    )

    assert response.status_code == 200
    note = response.json()
    assert note["slug"] == "openclawd-vault"
    assert note["links"] == ["Dark Ralph", "LLM Wiki"]

    results = client.get("/api/v1/memory/search", params={"q": "dark ralph"}).json()
    assert results[0]["note"]["title"] == "OpenClawd Vault"

    links = client.get("/api/v1/memory/links").json()["links"]
    assert len(links) == 2


def test_research_writes_memory_note(client):
    client.post("/api/v1/research/market", json={"focus": "alpha", "tokens": ["CLAWD"]})

    notes = client.get("/api/v1/memory/notes", params={"source": "llm_wiki"}).json()
    assert len(notes) == 1
    assert notes[0]["title"] == "Research/market/alpha"
    assert "research" in notes[0]["tags"]
