"""Context compaction."""

from __future__ import annotations

from typing import Any

from openai.types.chat import ChatCompletionMessageParam

from .model_limits import DEFAULT_THRESHOLD, get_model_limits
from .token_estimator import estimate_messages_tokens


async def compact_conversation(
    messages: list[ChatCompletionMessageParam],
    client: Any,
    model: str,
) -> list[ChatCompletionMessageParam]:
    """Compact conversation history when over threshold."""
    model_limits = get_model_limits(model)

    current_tokens = estimate_messages_tokens(messages)
    target_tokens = int(model_limits.context_window * (1 - DEFAULT_THRESHOLD))

    if current_tokens.total <= target_tokens:
        return messages

    compacted = list(messages)

    while len(compacted) > 1 and estimate_messages_tokens(compacted).total > target_tokens:
        compacted.pop(0)

    return compacted
