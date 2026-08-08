# llm-wiki-tang — OpenClawd AutoResearch API for Dark Clawd TUI
# Deploy: fly apps create dark-clawd-research && fly deploy
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    HOST=0.0.0.0

# Install runtime deps from pyproject (no need for full poetry/uv for this thin API)
COPY pyproject.toml README.md ./
COPY api ./api
COPY src ./src

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir \
        "fastapi>=0.115" \
        "pydantic>=2" \
        "python-dotenv>=1" \
        "uvicorn[standard]>=0.30"

# Optional offline memory path (ephemeral on Fly unless a volume is attached)
RUN mkdir -p /app/.openclawd-memory

EXPOSE 8000

# Fly injects PORT; bind all interfaces (no --reload in production)
CMD ["sh", "-c", "exec uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
