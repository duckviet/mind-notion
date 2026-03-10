from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any


@dataclass(slots=True)
class TokenUsage:
    input: int
    output: int
    total: int


def estimate_tokens(text: str) -> int:
    return (len(text) + 3) // 4 if text else 0


def extract_message_text(message: dict[str, Any]) -> str:
    content = message.get("content", "")

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts: list[str] = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
                continue
            if isinstance(part, dict):
                text = part.get("text")
                if isinstance(text, str):
                    parts.append(text)
                    continue
                value = part.get("value")
                if isinstance(value, str):
                    parts.append(value)
                    continue
                output = part.get("output")
                if isinstance(output, dict) and isinstance(output.get("value"), str):
                    parts.append(output["value"])
                    continue
            parts.append(json.dumps(part, ensure_ascii=False))
        return " ".join(parts)

    return json.dumps(content, ensure_ascii=False)


def estimate_messages_tokens(messages: list[dict[str, Any]]) -> TokenUsage:
    input_tokens = 0
    output_tokens = 0

    for message in messages:
        text = extract_message_text(message)
        tokens = estimate_tokens(text)
        if message.get("role") == "assistant":
            output_tokens += tokens
        else:
            input_tokens += tokens

    return TokenUsage(
        input=input_tokens,
        output=output_tokens,
        total=input_tokens + output_tokens,
    )
