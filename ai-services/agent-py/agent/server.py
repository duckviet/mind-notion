from __future__ import annotations

import asyncio
import json
import os
from dataclasses import dataclass, field
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI

from .api_contracts import (
    AgentRunRequest,
    AwaitingConsentEvent,
    ConsentDecisionRequest,
    DeltaEvent,
    RunCompletedEvent,
    RunFailedEvent,
    RunStartedEvent,
    ToolCallEvent,
    ToolResultEvent,
)
from .contracts import AgentCallbacks, TokenUsageInfo
from .run import MODEL_NAME, run_agent
from .tools import tools


def _now_payload(event: Any) -> str:
    event_type = getattr(event, "type", "message")
    event_json = event.model_dump_json()
    return f"event: {event_type}\ndata: {event_json}\n\n"


def _bearer_token(authorization: str | None) -> str:
    if not authorization:
        return ""
    prefix = "Bearer "
    if not authorization.startswith(prefix):
        return ""
    return authorization[len(prefix) :].strip()


def _internal_token() -> str:
    return os.getenv("AI_INTERNAL_TOKEN", "")


def _auth_or_raise(authorization: str | None) -> None:
    expected = _internal_token()
    if not expected:
        return
    provided = _bearer_token(authorization)
    if provided != expected:
        raise HTTPException(status_code=401, detail="invalid internal token")


@dataclass(slots=True)
class RunState:
    run_id: str
    queue: asyncio.Queue[str | None] = field(default_factory=asyncio.Queue)
    pending_consents: dict[str, asyncio.Future[bool]] = field(default_factory=dict)
    last_usage: TokenUsageInfo | None = None


class RunRegistry:
    def __init__(self) -> None:
        self._runs: dict[str, RunState] = {}
        self._lock = asyncio.Lock()

    async def create(self, run_id: str) -> RunState:
        async with self._lock:
            state = RunState(run_id=run_id)
            self._runs[run_id] = state
            return state

    async def get(self, run_id: str) -> RunState | None:
        async with self._lock:
            return self._runs.get(run_id)

    async def remove(self, run_id: str) -> None:
        async with self._lock:
            self._runs.pop(run_id, None)


class StreamCallbacks(AgentCallbacks):
    def __init__(self, request: AgentRunRequest, state: RunState):
        self.request = request
        self.state = state
        self._tool_call_by_name: dict[str, str] = {}
        self._consent_by_tool: dict[str, bool] = {
            tool.name: bool(tool.constraints.require_user_consent)
            for tool in request.allowed_tools
        }

    def _emit(self, event: Any) -> None:
        self.state.queue.put_nowait(_now_payload(event))

    def on_token(self, token: str) -> None:
        self._emit(DeltaEvent(run_id=self.request.run_id, content=token))

    def on_tool_call_start(self, name: str, args: Any) -> None:
        tool_call_id = ""
        if isinstance(args, dict):
            tool_call_id = str(args.get("_tool_call_id", ""))
        self._tool_call_by_name[name] = tool_call_id
        self._emit(ToolCallEvent(run_id=self.request.run_id, tool_call_id=tool_call_id, tool=name))

    def on_tool_call_end(self, name: str, result: str) -> None:
        tool_call_id = self._tool_call_by_name.get(name, "")
        self._emit(
            ToolResultEvent(
                run_id=self.request.run_id,
                tool_call_id=tool_call_id,
                tool=name,
                ok=not result.startswith("Error "),
            )
        )

    def on_complete(self, response: str) -> None:
        return

    async def on_tool_approval(self, name: str, args: Any) -> bool:
        requires_consent = self._consent_by_tool.get(name, False)
        if not requires_consent:
            return True

        tool_call_id = ""
        if isinstance(args, dict):
            tool_call_id = str(args.get("_tool_call_id", ""))

        self._emit(
            AwaitingConsentEvent(
                run_id=self.request.run_id,
                consent={
                    "run_id": self.request.run_id,
                    "tool_call_id": tool_call_id,
                    "tool": name,
                    "summary": f"Agent requests permission to execute {name}",
                },
            )
        )

        loop = asyncio.get_running_loop()
        future: asyncio.Future[bool] = loop.create_future()
        self.state.pending_consents[tool_call_id] = future

        try:
            return await asyncio.wait_for(future, timeout=300)
        except TimeoutError:
            return False
        finally:
            self.state.pending_consents.pop(tool_call_id, None)

    def on_token_usage(self, usage: TokenUsageInfo) -> None:
        self.state.last_usage = usage


def _prepare_user_message(conversation: list[dict[str, Any]]) -> tuple[str, list[dict[str, Any]]]:
    if not conversation:
        return "", []

    last_user_idx = -1
    for idx, message in enumerate(conversation):
        if message.get("role") == "user":
            last_user_idx = idx

    if last_user_idx < 0:
        return "", [m for m in conversation if m.get("role") != "system"]

    user_message = str(conversation[last_user_idx].get("content", ""))
    history = [
        message
        for idx, message in enumerate(conversation)
        if idx != last_user_idx and message.get("role") != "system"
    ]
    return user_message, history


def _select_tool_registry(request: AgentRunRequest) -> dict[str, Any]:
    if not request.allowed_tools:
        return tools
    selected: dict[str, Any] = {}
    for tool in request.allowed_tools:
        spec = tools.get(tool.name)
        if spec is not None:
            selected[tool.name] = spec
    return selected


async def _run_agent_task(request: AgentRunRequest, state: RunState) -> None:
    callbacks = StreamCallbacks(request=request, state=state)
    conversation = [message.model_dump(exclude_none=True) for message in request.conversation]
    user_message, history = _prepare_user_message(conversation)

    if not user_message:
        state.queue.put_nowait(
            _now_payload(
                RunFailedEvent(
                    run_id=request.run_id,
                    code="INVALID_INPUT",
                    message="conversation must include at least one user message",
                )
            )
        )
        state.queue.put_nowait(None)
        return

    try:
        client = AsyncOpenAI()
        await run_agent(
            user_message=user_message,
            conversation_history=history,
            callbacks=callbacks,
            client=client,
            model_name=MODEL_NAME,
            run_id=request.run_id,
            actor={
                "user_id": request.actor.user_id,
                "tenant_id": request.actor.tenant_id,
                "workspace_id": request.actor.workspace_id,
            },
            resource_context={
                "note_id": request.resource_context.note_id,
                "note_version": request.resource_context.note_version,
            },
            tool_registry=_select_tool_registry(request),
        )

        usage = callbacks.state.last_usage
        payload = {
            "prompt_tokens": usage.input_tokens if usage else 0,
            "completion_tokens": usage.output_tokens if usage else 0,
            "total_tokens": usage.total_tokens if usage else 0,
        }
        state.queue.put_nowait(_now_payload(RunCompletedEvent(run_id=request.run_id, usage=payload)))
    except Exception as exc:  # noqa: BLE001
        state.queue.put_nowait(
            _now_payload(
                RunFailedEvent(
                    run_id=request.run_id,
                    code="INTERNAL",
                    message=str(exc),
                    retryable=False,
                )
            )
        )
    finally:
        state.queue.put_nowait(None)


app = FastAPI(title="agent-py-service", version="0.1.0")
registry = RunRegistry()


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/internal/v1/agent/runs")
async def create_run(
    request: AgentRunRequest,
    authorization: str | None = Header(default=None),
) -> StreamingResponse:
    _auth_or_raise(authorization)

    state = await registry.create(request.run_id)
    state.queue.put_nowait(_now_payload(RunStartedEvent(run_id=request.run_id)))
    asyncio.create_task(_run_agent_task(request, state))

    async def event_generator() -> Any:
        try:
            while True:
                item = await state.queue.get()
                if item is None:
                    break
                yield item
        finally:
            await registry.remove(request.run_id)

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }
    return StreamingResponse(event_generator(), media_type="text/event-stream", headers=headers)


@app.patch("/internal/v1/agent/runs/{run_id}/consent")
async def provide_consent(
    run_id: str,
    decision: ConsentDecisionRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    _auth_or_raise(authorization)
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
    _auth_or_raise(authorization)
    state = await registry.get(run_id)
    return {"run_id": run_id, "exists": state is not None, "pending_consents": list((state.pending_consents or {}).keys())}
