from __future__ import annotations

from .types import ToolSpec


web_search = ToolSpec(
    name="webSearch",
    description="Web search provider tool. Executed by model provider when supported.",
    input_schema={
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search query"},
        },
        "required": ["query"],
        "additionalProperties": False,
    },
    execute=None,
    provider_tool=True,
)
