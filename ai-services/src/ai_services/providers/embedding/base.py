"""Embedding provider protocol."""

from __future__ import annotations

from typing import Protocol


class EmbeddingProvider(Protocol):
    """Protocol for embedding providers."""

    async def embed(self, texts: list[str], model: str = "bge-m3") -> list[list[float]]:
        """Generate embeddings for texts."""
        ...


class BGEEmbeddingProvider:
    """BGE-M3 embedding provider."""

    def __init__(self, url: str = "http://localhost:8080") -> None:
        self._url = url

    async def embed(self, texts: list[str], model: str = "bge-m3") -> list[list[float]]:
        import httpx

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self._url,
                json={"inputs": texts, "model": model},
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("embeddings", [])
