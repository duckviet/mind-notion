"""Centralized configuration using pydantic-settings."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    backend_base_url: str = Field(default="http://localhost:3000", description="Backend server URL")
    backend_token: str = Field(default="", description="Backend authentication token")
    embed_url: str = Field(default="http://localhost:8080", description="Embedding service URL")

    default_model: str = Field(default="gpt-4o-mini", description="Default LLM model")
    tool_timeout_ms: int = Field(default=30_000, description="Tool execution timeout in ms")

    ai_internal_token: str = Field(default="", description="Internal API token")
    ai_service_host: str = Field(default="0.0.0.0", description="Service host")
    ai_service_port: int = Field(default=8090, description="Service port")
    ai_service_reload: bool = Field(default=False, description="Enable auto-reload")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
