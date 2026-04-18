"""LLM provider protocol."""

from __future__ import annotations

from typing import Any, AsyncIterator, Protocol


class LLMProvider(Protocol):
    """Protocol for LLM providers."""

    async def chat_stream(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        model: str = "gpt-4o-mini",
    ) -> AsyncIterator[Any]:
        """Stream chat completions."""
        ...


class OpenAILLMProvider:
    """OpenAI LLM provider."""

    def __init__(self, api_key: str | None = None) -> None:
        self._api_key = api_key

    async def chat_stream(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        model: str = "gpt-4o-mini",
    ) -> AsyncIterator[Any]:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=self._api_key)
        stream = await client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tools,
            tool_choice="auto",
            stream=True,
        )
        async for chunk in stream:
            yield chunk
