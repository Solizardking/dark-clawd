"""Structural checks for Fly deploy artifacts (real files on disk)."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_dockerfile_production_entry_no_reload():
    text = (ROOT / "Dockerfile").read_text()
    assert "uvicorn" in text
    assert "api.main:app" in text
    assert "0.0.0.0" in text
    assert "PORT" in text
    # CMD must not enable reload (comment may mention it)
    cmd_lines = [ln for ln in text.splitlines() if "CMD" in ln or "uvicorn api.main" in ln]
    assert cmd_lines, "expected CMD/uvicorn entry"
    assert all("--reload" not in ln for ln in cmd_lines if "CMD" in ln or ln.strip().startswith("CMD"))


def test_fly_toml_health_and_port():
    text = (ROOT / "fly.toml").read_text()
    assert 'app = "dark-clawd-research"' in text
    assert "internal_port = 8000" in text
    assert 'path = "/health"' in text
    assert "force_https = true" in text
    assert "dockerfile" in text.lower() or "Dockerfile" in text


def test_readme_documents_fly_and_research_api_url():
    text = (ROOT / "README.md").read_text()
    assert "dark-clawd-research" in text
    assert "fly deploy" in text
    assert "RESEARCH_API_URL" in text
    assert "https://dark-clawd-research.fly.dev" in text
