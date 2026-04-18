"""Main entry point for the service."""

from __future__ import annotations

import os
from pathlib import Path

import uvicorn

from .app import create_app

app = create_app()


def _load_dotenv() -> None:
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key and key not in os.environ:
            os.environ[key] = value


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def main() -> None:
    _load_dotenv()
    host = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
    port = int(os.getenv("PORT", os.getenv("AI_SERVICE_PORT", "8090")))
    reload = os.getenv("AI_SERVICE_RELOAD", "false").lower() in {"1", "true", "yes"}
    uvicorn.run("ai_services.main:app", host=host, port=port, reload=reload)


if __name__ == "__main__":
    main()
