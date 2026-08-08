# llm-wiki-tang

Local OpenClawd AutoResearch API used by `clawd-tui` / Dark Clawd.

## Local (dev)

```bash
python3 -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

Smoke-check:

```bash
curl -s http://127.0.0.1:8000/health    # {"status":"ok"}
curl -s http://127.0.0.1:8000/          # JSON landing + endpoint map
open http://127.0.0.1:8000/docs         # interactive OpenAPI UI
```

## Production-style local (same as Fly CMD)

```bash
# no --reload; bind all interfaces; honor PORT
PORT=8000 python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000
```

Or Docker:

```bash
docker build -t llm-wiki-tang .
docker run --rm -p 8000:8000 llm-wiki-tang
```

## Deploy to Fly.io

| | |
|---|---|
| **App** | `dark-clawd-research` |
| **Region** | `iad` |
| **Public URL** | https://dark-clawd-research.fly.dev |
| **Health** | `GET /health` → `{"status":"ok"}` |
| **Config** | `fly.toml` · `Dockerfile` |

```bash
cd llm-wiki-tang
fly apps create dark-clawd-research   # first time only
fly deploy
curl -sS https://dark-clawd-research.fly.dev/health
```

## Point Dark Clawd TUI at the API

```bash
# Local
export RESEARCH_API_URL=http://127.0.0.1:8000

# Fly
export RESEARCH_API_URL=https://dark-clawd-research.fly.dev

# From monorepo tui/
bun run research-api:health
bun start
# or: npm start / dark-clawd
```

The service is intentionally offline-safe for demos and local development. It does
not require API keys and returns deterministic research summaries for the
`/research` and `/autoloop` commands.
# OpenClawd Memory Integration

`llm-wiki-tang` writes every research run into OpenClawd Memory as a
Markdown note with tags, metadata, and `[[wikilinks]]`.

Local/offline mode is automatic and stores notes in
`.openclawd-memory/notes.jsonl`.

To send notes to the full OpenClawd memory service instead:

```bash
export OPENCLAWD_MEMORY_URL=http://localhost:8000
```

Memory endpoints exposed by this local API:

```text
POST /api/v1/memory/notes
GET  /api/v1/memory/notes
GET  /api/v1/memory/search?q=dark+ralph
GET  /api/v1/memory/links
```
