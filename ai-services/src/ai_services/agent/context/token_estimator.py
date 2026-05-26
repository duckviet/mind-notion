"""Token estimation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class TokenCount:
    input: int
    output: int
    total: int


TOKEN_PER_MESSAGE_BASE = 4
TOKEN_PER_MESSAGE_PER_ROLE = 2


def estimate_messages_tokens(messages: list[Any]) -> TokenCount:
    input_tokens = 0
    output_tokens = 0

    for msg in messages:
        content = str(msg.get("content", ""))
        input_tokens += TOKEN_PER_MESSAGE_BASE + (len(content) // 4)

        role = msg.get("role", "")
        if role == "assistant":
            output_tokens += TOKEN_PER_MESSAGE_PER_ROLE + (len(content) // 4)

    return TokenCount(input=input_tokens, output=output_tokens, total=input_tokens + output_tokens)


def calculate_usage_percentage(total_tokens: int, context_window: int) -> float:
    if context_window <= 0:
        return 0.0
    return min(total_tokens / context_window, 1.0)


def is_over_threshold(total_tokens: int, context_window: int, threshold: float = 0.85) -> bool:
    return calculate_usage_percentage(total_tokens, context_window) >= threshold
