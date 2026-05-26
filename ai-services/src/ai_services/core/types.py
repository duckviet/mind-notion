"""Core shared types."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(slots=True)
class ModelLimits:
    input_limit: int
    output_limit: int
    context_window: int


@dataclass(slots=True)
class TokenUsageInfo:
    input_tokens: int
    output_tokens: int
    total_tokens: int
    context_window: int
    threshold: float
    percentage: float


@dataclass(slots=True)
class Actor:
    user_id: str
    tenant_id: str
    workspace_id: str


@dataclass(slots=True)
class ResourceContext:
    note_id: str | None = None
    note_version: int | None = None


@dataclass(slots=True)
class ToolCallInfo:
    tool_call_id: str
    tool_name: str
    args: dict[str, Any]
