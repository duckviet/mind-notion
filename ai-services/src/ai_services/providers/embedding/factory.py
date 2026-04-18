"""Embedding provider factory."""

from functools import lru_cache

from .base import BGEEmbeddingProvider, EmbeddingProvider


@lru_cache(maxsize=1)
def get_embedding_provider(model_name: str = "bge-m3", url: str | None = None) -> EmbeddingProvider:
    """Get embedding provider."""
    return BGEEmbeddingProvider(url=url or "http://localhost:8080")
