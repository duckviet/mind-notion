"""FastAPI app factory."""

from __future__ import annotations

from fastapi import FastAPI

from .api.v1 import agent as agent_routes
from .rag.api import router as rag_router

def create_app() -> FastAPI:
    app = FastAPI(title="ai-services", version="0.1.0")
    app.include_router(agent_routes.router, prefix="/internal/v1/agent", tags=["agent"])
    app.include_router(rag_router, tags=["rag"])
    return app
