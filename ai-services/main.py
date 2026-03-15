from __future__ import annotations

import os
from pathlib import Path

import uvicorn
from fastapi import FastAPI

from agent import router as agent_router
from rag.api import router as rag_router


def _load_dotenv() -> None:
    env_path = Path(__file__).resolve().parent / ".env"
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


def create_app() -> FastAPI:
    app = FastAPI(title="mind-notion ai-services", version="0.1.0")
    app.include_router(agent_router)
    app.include_router(rag_router)
    return app


app = create_app()


def main() -> None:
    _load_dotenv()
    host = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
    port = int(os.getenv("AI_SERVICE_PORT", "8090"))
    reload_enabled = os.getenv("AI_SERVICE_RELOAD", "true").lower() in {"1", "true", "yes"}
    uvicorn.run("main:app", host=host, port=port, reload=reload_enabled)


if __name__ == "__main__":
    main()
