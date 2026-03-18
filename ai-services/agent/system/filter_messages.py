from __future__ import annotations

from typing import Any


def filter_compatible_messages(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    filtered: list[dict[str, Any]] = []
    for message in messages:
        role = message.get("role")

        if role in ("user", "system", "tool"):
            filtered.append(message)
            continue

        if role == "assistant":
            content = message.get("content")
            if isinstance(content, str) and content.strip():
                filtered.append(message)
                continue
            if isinstance(content, list):
                has_text = False
                for part in content:
                    if isinstance(part, str) and part.strip():
                        has_text = True
                        break
                    if isinstance(part, dict) and isinstance(part.get("text"), str) and part["text"].strip():
                        has_text = True
                        break
                if has_text:
                    filtered.append(message)

    return filtered
