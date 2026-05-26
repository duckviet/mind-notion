"""Base skill classes."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ToolConstraint:
    require_user_consent: bool = False


@dataclass
class ToolSpec:
    name: str
    description: str
    input_schema: dict[str, Any]
    execute: Any | None = None
    provider_tool: bool = False
    constraints: ToolConstraint = field(default_factory=ToolConstraint)
    resource_files: list[str] = field(default_factory=list)

    def to_openai_tool(self) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.input_schema,
            },
        }


@dataclass
class Skill:
    name: str
    description: str
    triggers: list[str]
    tools: list[ToolSpec]
    instructions: str = ""
    version: str = "0.1.0"

    def __post_init__(self) -> None:
        if not self.tools:
            self.tools = []
        if not self.triggers:
            self.triggers = []
        if not self.instructions:
            self.instructions = self.description
