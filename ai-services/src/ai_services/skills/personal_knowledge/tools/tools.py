"""Notes read tool."""

from __future__ import annotations

import json


async def notes_read_impl(
    note_id: str, range_start: int | None = None, range_end: int | None = None
) -> str:
    """Execute notes read."""
    from ....agent.runtime_context import get_actor, get_resource_context

    resource_context = get_resource_context()
    note_id = note_id or resource_context.get("note_id", "")

    if not note_id:
        return "Error INVALID_INPUT: note_id is required"

    from ....providers.backend.client import get_backend_client

    client = get_backend_client()

    note = await client.get_note(note_id)
    if not note:
        return f"Error NOT_FOUND: note {note_id} not found"

    result = {
        "note_id": note.id,
        "version": note.version,
        "content": note.content,
    }

    return json.dumps(result, ensure_ascii=False)


async def notes_write_impl(
    note_id: str,
    operation: str,
    content: str | None = None,
    expected_version: int = 0,
) -> str:
    """Execute notes write."""
    from ....agent.runtime_context import get_actor, get_resource_context

    resource_context = get_resource_context()
    note_id = note_id or resource_context.get("note_id", "")

    if not note_id:
        return "Error INVALID_INPUT: note_id is required"
    if operation not in {"replace", "append", "patch"}:
        return "Error INVALID_INPUT: operation must be replace|append|patch"

    from ....providers.backend.client import get_backend_client

    client = get_backend_client()

    if operation == "replace":
        note = await client.update_note(note_id, content or "", expected_version)
    else:
        return f"Error NOT_IMPLEMENTED: operation {operation} not supported"

    if not note:
        return f"Error UPDATE_FAILED: could not update note {note_id}"

    return json.dumps({"note_id": note.id, "version": note.version, "ok": True}, ensure_ascii=False)
