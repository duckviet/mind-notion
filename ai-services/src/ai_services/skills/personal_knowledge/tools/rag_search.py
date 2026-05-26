"""RAG search tool."""

from __future__ import annotations

import json

from ....core.config import settings
from ....providers.backend.client import get_backend_client


async def rag_search_impl(query: str, top_k: int = 5, min_score: float = 0.2) -> str:
    """Execute RAG search."""
    from ....agent.runtime_context import get_actor, get_run_id, get_tool_call_id

    run_id = get_run_id() or ""
    tool_call_id = get_tool_call_id() or ""
    actor = get_actor()
    user_id = str(actor.get("user_id", ""))

    if not user_id:
        return "Error INVALID_INPUT: actor.user_id is required"

    client = get_backend_client()

    try:
        results = await client.search_notes(
            query=query,
            tenant_id=actor.get("tenant_id", ""),
            workspace_id=actor.get("workspace_id", ""),
            limit=top_k,
        )
    except Exception as exc:
        return f"Error RAG_SEARCH_FAILED: {exc}"

    chunks = [
        {"note_id": r.note_id, "content": r.content, "score": r.score}
        for r in results
        if r.score >= min_score
    ]

    return json.dumps(
        {
            "query": query,
            "top_k": top_k,
            "min_score": min_score,
            "total": len(chunks),
            "chunks": chunks,
        },
        ensure_ascii=False,
    )
