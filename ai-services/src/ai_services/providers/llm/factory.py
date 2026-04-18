"""LLM provider factory."""

from __future__ import annotations

from functools import lru_cache

from .base import LLMProvider, OpenAILLMProvider


@lru_cache(maxsize=1)
def get_llm_provider(model_name: str = "gpt-4o-mini", api_key: str | None = None) -> LLMProvider:
    """Get LLM provider based on model name."""
    if model_name.startswith("gpt-") or model_name.startswith("o1-"):
        return OpenAILLMProvider(api_key=api_key)
    if model_name.startswith("claude-"):
        return AnthropicLLMProvider(api_key=api_key)
    return OpenAILLMProvider(api_key=api_key)


class AnthropicLLMProvider:
    """Anthropic LLM provider (placeholder)."""

    def __init__(self, api_key: str | None = None) -> None:
        self._api_key = api_key

    async def chat_stream(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        model: str = "claude-3-5-sonnet-20241022",
    ):
        raise NotImplementedError("Anthropic provider not yet implemented")
