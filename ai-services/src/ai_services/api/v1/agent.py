"""API v1 routes - Agent endpoints."""

from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse

from ai_services.agent.api_contracts import (
    AgentRunRequest,
    RunStartedEvent,
    AgentInlineEditRequest,
    AgentInlineEditResponse,
    ConsentDecisionRequest,
)
from ai_services.agent.api_runtime import (
    RunRegistry,
    event_generator,
    queue_event,
    run_agent_task,
    run_inline_edit_task,
    stream_headers,
)
from ai_services.core.config import settings

router = APIRouter()
registry = RunRegistry()

@router.post("/runs")
async def create_run(request: AgentRunRequest, authorization: str | None = Header(None)) -> StreamingResponse:
    """Create a new agent run."""
    expected = settings.ai_internal_token
    if expected and authorization != expected:
        raise HTTPException(status_code=401, detail="invalid token")

    state = await registry.create(request.run_id)
    queue_event(state, RunStartedEvent(run_id=request.run_id))
    asyncio.create_task(run_agent_task(request, state))

    return StreamingResponse(
        event_generator(registry, request.run_id, state),
        media_type="text/event-stream",
        headers=stream_headers(),
    )


@router.get("/runs/{run_id}")
async def get_run(run_id: str, authorization: str | None = Header(None)) -> dict[str, Any]:
    """Get run status."""
    expected = settings.ai_internal_token
    if expected and authorization != expected:
        raise HTTPException(status_code=401, detail="invalid token")

    state = await registry.get(run_id)
    pending_consents = []
    if state is not None:
        pending_consents = list(state.pending_consents.keys())

    return {
        "run_id": run_id,
        "exists": state is not None,
        "pending_consents": pending_consents,
    }

@router.post("/inline-edit")
async def create_inline_edit(
    request: AgentInlineEditRequest,
    authorization: str | None = Header(default=None),
) -> AgentInlineEditResponse:
    expected = settings.ai_internal_token
    if expected and authorization != expected:
        raise HTTPException(status_code=401, detail="invalid token")
    return await run_inline_edit_task(request)


@router.patch("/runs/{run_id}/consent")
async def provide_consent(
    run_id: str,
    decision: ConsentDecisionRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    expected = settings.ai_internal_token
    if expected and authorization != expected:
        raise HTTPException(status_code=401, detail="invalid token")

    if run_id != decision.run_id:
        raise HTTPException(status_code=400, detail="run_id mismatch")

    state = await registry.get(run_id)
    if state is None:
        raise HTTPException(status_code=404, detail="run not found")

    waiter = state.pending_consents.get(decision.tool_call_id)
    if waiter is None:
        raise HTTPException(status_code=404, detail="consent request not found")

    if not waiter.done():
        waiter.set_result(decision.approved)

    return {
        "ok": True,
        "run_id": run_id,
        "tool_call_id": decision.tool_call_id,
        "approved": decision.approved,
    }
