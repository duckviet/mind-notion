from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Awaitable, Callable

ExecuteFn = Callable[[dict[str, Any]], Awaitable[str]]


@dataclass(slots=True)
class ToolSpec:
    name: str
    description: str
    input_schema: dict[str, Any]
    execute: ExecuteFn | None = None
    provider_tool: bool = False

    def to_openai_tool(self) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.input_schema,
            },
        }
