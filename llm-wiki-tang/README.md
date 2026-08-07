# llm-wiki-tang

Local OpenClawd AutoResearch API used by `clawd-tui`.

Run it:

```bash
python3 -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

Then point the TUI at it:

```bash
RESEARCH_API_URL=http://localhost:8000 npm start
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
