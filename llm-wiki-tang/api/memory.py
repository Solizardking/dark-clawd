from __future__ import annotations

import json
import os
import re
import threading
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field

WIKILINK_RE = re.compile(r"\[\[([^\]\|#]+)(?:[#|][^\]]*)?\]\]")
TOKEN_RE = re.compile(r"[A-Za-z0-9_$]{2,}")


class MemoryNoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = ""
    tags: list[str] = Field(default_factory=list)
    source: Literal["manual", "llm_wiki", "dark_ralph", "clawd_tui", "system"] = "manual"
    metadata: dict[str, Any] = Field(default_factory=dict)


class MemoryNote(MemoryNoteCreate):
    id: str
    slug: str
    links: list[str] = Field(default_factory=list)
    backlinks: list[str] = Field(default_factory=list)
    created_at: str
    updated_at: str


class MemorySearchResult(BaseModel):
    note: MemoryNote
    score: float
    highlights: list[str] = Field(default_factory=list)


class LocalMemoryStore:
    def __init__(self, path: str | Path | None = None) -> None:
        self.path = Path(path or os.getenv("OPENCLAWD_MEMORY_PATH") or ".openclawd-memory/notes.jsonl")
        self._lock = threading.Lock()
        self._notes: dict[str, MemoryNote] = {}
        self._load()

    def reset(self) -> None:
        with self._lock:
            self._notes = {}
            self._persist_locked()

    def upsert(self, payload: MemoryNoteCreate) -> MemoryNote:
        now = datetime.now(timezone.utc).isoformat()
        slug = _slug(payload.title)
        links = _links(payload.body)
        tags = sorted({_tag(tag) for tag in payload.tags if tag.strip()})
        with self._lock:
            existing = next((note for note in self._notes.values() if note.slug == slug), None)
            note = MemoryNote(
                id=existing.id if existing else f"mem_{uuid4().hex[:16]}",
                slug=slug,
                title=payload.title,
                body=payload.body,
                tags=tags,
                source=payload.source,
                metadata=payload.metadata,
                links=links,
                backlinks=[],
                created_at=existing.created_at if existing else now,
                updated_at=now,
            )
            self._notes[note.id] = note
            self._rebuild_backlinks_locked()
            self._persist_locked()
            return self._notes[note.id]

    def list_notes(self, tag: str | None = None, source: str | None = None, limit: int = 100) -> list[MemoryNote]:
        with self._lock:
            notes = sorted(self._notes.values(), key=lambda item: item.updated_at, reverse=True)
        if tag:
            wanted = _tag(tag)
            notes = [note for note in notes if wanted in note.tags]
        if source:
            notes = [note for note in notes if note.source == source]
        return notes[: max(1, min(limit, 500))]

    def search(self, query: str, limit: int = 20) -> list[MemorySearchResult]:
        q_tokens = set(_tokens(query))
        with self._lock:
            notes = list(self._notes.values())
        results: list[MemorySearchResult] = []
        for note in notes:
            text = f"{note.title}\n{' '.join(note.tags)}\n{note.body}"
            overlap = q_tokens & set(_tokens(text))
            if not overlap and query.lower() not in text.lower():
                continue
            score = len(overlap) / max(len(q_tokens), 1)
            if query.lower() in note.title.lower():
                score += 1
            results.append(MemorySearchResult(note=note, score=round(score, 4), highlights=_highlights(note.body, q_tokens)))
        results.sort(key=lambda item: item.score, reverse=True)
        return results[: max(1, min(limit, 100))]

    def links(self) -> list[dict[str, str]]:
        with self._lock:
            return [{"source_id": note.id, "target": target, "relation": "wikilink"} for note in self._notes.values() for target in note.links]

    def _load(self) -> None:
        if not self.path.exists():
            return
        for line in self.path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                note = MemoryNote.model_validate_json(line)
                self._notes[note.id] = note
        self._rebuild_backlinks_locked()

    def _persist_locked(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        lines = [note.model_dump_json() for note in sorted(self._notes.values(), key=lambda item: item.created_at)]
        self.path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")

    def _rebuild_backlinks_locked(self) -> None:
        by_slug = {note.slug: note.id for note in self._notes.values()}
        refs = {note.id: [] for note in self._notes.values()}
        for note in self._notes.values():
            for target in note.links:
                target_id = by_slug.get(_slug(target))
                if target_id and note.id not in refs[target_id]:
                    refs[target_id].append(note.id)
        for note_id, backlinks in refs.items():
            self._notes[note_id] = self._notes[note_id].model_copy(update={"backlinks": backlinks})


store = LocalMemoryStore()


def reset_memory() -> None:
    store.reset()


def remember(payload: MemoryNoteCreate) -> MemoryNote:
    remote = os.getenv("OPENCLAWD_MEMORY_URL", "").rstrip("/")
    if remote:
        try:
            req = urllib.request.Request(
                f"{remote}/v1/openclawd/memory/notes",
                data=payload.model_dump_json().encode("utf-8"),
                headers={"content-type": "application/json", "accept": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=3) as response:
                return MemoryNote.model_validate_json(response.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, ValueError):
            pass
    return store.upsert(payload)


def remember_research_run(kind: str, response: Any) -> MemoryNote:
    title = f"Research/{kind}/{response.query}"
    body = "\n".join(
        [
            f"# {title}",
            "",
            f"Agent: {response.agent}",
            f"Confidence: {response.confidence}",
            f"Sources: {', '.join(response.sources)}",
            "",
            "```json",
            json.dumps(response.results, indent=2, sort_keys=True),
            "```",
            "",
            "[[OpenClawd Research]] [[Dark Ralph]]",
        ]
    )
    return remember(
        MemoryNoteCreate(
            title=title,
            body=body,
            tags=["openclawd", "research", kind],
            source="llm_wiki",
            metadata={"research_id": response.id, "kind": kind, "query": response.query},
        )
    )


def _slug(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or f"note-{uuid4().hex[:8]}"


def _tag(tag: str) -> str:
    return tag.strip().lower().lstrip("#").replace(" ", "-")


def _links(body: str) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for match in WIKILINK_RE.finditer(body):
        target = match.group(1).strip()
        if target and target not in seen:
            seen.add(target)
            out.append(target)
    return out


def _tokens(text: str):
    return (match.group(0).lower() for match in TOKEN_RE.finditer(text))


def _highlights(body: str, tokens: set[str]) -> list[str]:
    out: list[str] = []
    for line in body.splitlines():
        lowered = line.lower()
        if any(token in lowered for token in tokens):
            out.append(line[:240])
        if len(out) >= 3:
            break
    return out
