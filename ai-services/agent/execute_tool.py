from __future__ import annotations

from typing import Mapping

from .tools.types import ToolSpec
from .tools import tools


async def execute_tool(
    name: str,
    args: dict[str, object],
    tool_registry: Mapping[str, ToolSpec] | None = None,
) -> str:
    registry = tool_registry or tools
    tool = registry.get(name)
    if not tool:
        return f"Unknown tool: {name}"

    if not tool.execute:
        return f"Provider tool {name} - executed by model provider"

    return str(await tool.execute(args))
