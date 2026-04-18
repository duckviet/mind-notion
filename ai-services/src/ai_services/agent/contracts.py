from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Protocol


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
class ToolCallInfo:
    tool_call_id: str
    tool_name: str
    args: dict[str, Any]


class AgentCallbacks(Protocol):
    def on_token(self, token: str) -> None: ...

    def on_tool_call_start(self, name: str, args: Any) -> None: ...

    def on_tool_call_end(self, name: str, result: str) -> None: ...

    def on_complete(self, response: str) -> None: ...

    async def on_tool_approval(self, name: str, args: Any) -> bool: ...

    def on_token_usage(self, usage: TokenUsageInfo) -> None: ...


OnToken = Callable[[str], None]
OnToolCallStart = Callable[[str, Any], None]
OnToolCallEnd = Callable[[str, str], None]
OnComplete = Callable[[str], None]
OnToolApproval = Callable[[str, Any], Awaitable[bool]]
OnTokenUsage = Callable[[TokenUsageInfo], None]