from __future__ import annotations

from datetime import datetime, timezone

from .types import ToolSpec


async def _get_current_time(_: dict[str, object]) -> str:
    return datetime.now(timezone.utc).isoformat()


get_current_time = ToolSpec(
    name="getCurrentTime",
    description="Get the current server time in ISO 8601 format (UTC).",
    input_schema={
        "type": "object",
        "properties": {},
        "additionalProperties": False,
    },
    execute=_get_current_time,
)
