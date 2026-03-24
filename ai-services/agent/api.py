from __future__ import annotations

import asyncio
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse

from .api_contracts import (
    AgentInlineEditRequest,
    AgentInlineEditResponse,
    AgentRunRequest,
    ConsentDecisionRequest,
    RunStartedEvent,
)
from .api_runtime import (
    RunRegistry,
    auth_or_raise,
    event_generator,
    queue_event,
    run_agent_task,
    run_inline_edit_task,
    stream_headers,
)


app = FastAPI(title="mind-notion agent-service", version="0.1.0")
registry = RunRegistry()
router = app.router


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/internal/v1/agent/runs")
async def create_run(
    request: AgentRunRequest,
    authorization: str | None = Header(default=None),
) -> StreamingResponse:
    auth_or_raise(authorization)

    state = await registry.create(request.run_id)
    queue_event(state, RunStartedEvent(run_id=request.run_id))
    asyncio.create_task(run_agent_task(request, state))

    return StreamingResponse(
        event_generator(registry, request.run_id, state),
        media_type="text/event-stream",
        headers=stream_headers(),
    )


@app.post("/internal/v1/agent/inline-edit")
async def create_inline_edit(
    request: AgentInlineEditRequest,
    authorization: str | None = Header(default=None),
) -> AgentInlineEditResponse:
    auth_or_raise(authorization)
    return await run_inline_edit_task(request)


@app.patch("/internal/v1/agent/runs/{run_id}/consent")
async def provide_consent(
    run_id: str,
    decision: ConsentDecisionRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    auth_or_raise(authorization)
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


@app.get("/internal/v1/agent/runs/{run_id}")
async def get_run_state(
    run_id: str,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    auth_or_raise(authorization)
    state = await registry.get(run_id)
    pending_consents = []
    if state is not None:
        pending_consents = list(state.pending_consents.keys())

    return {
        "run_id": run_id,
        "exists": state is not None,
        "pending_consents": pending_consents,
    }
