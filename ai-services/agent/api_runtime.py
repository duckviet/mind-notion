from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass, field
from typing import Any

from fastapi import HTTPException
from openai import AsyncOpenAI

from .api_contracts import (
    AgentInlineEditRequest,
    AgentInlineEditResponse,
    AgentRunRequest,
    AwaitingConsentEvent,
    DeltaEvent,
    RunCompletedEvent,
    RunFailedEvent,
    ToolCallEvent,
    ToolResultEvent,
)
from .contracts import AgentCallbacks, TokenUsageInfo
from .run import MODEL_NAME, run_agent
from .run_inline_edit import run_inline_edit
from .tools import tools


def now_payload(event: Any) -> str:
    event_type = getattr(event, "type", "message")
    event_json = event.model_dump_json()
    return f"event: {event_type}\ndata: {event_json}\n\n"


def bearer_token(authorization: str | None) -> str:
    if not authorization:
        return ""
    prefix = "Bearer "
    if not authorization.startswith(prefix):
        return ""
    return authorization[len(prefix) :].strip()


def internal_token() -> str:
    return os.getenv("AI_INTERNAL_TOKEN", "")


def auth_or_raise(authorization: str | None) -> None:
    expected = internal_token()
    if not expected:
        return
    provided = bearer_token(authorization)
    if provided != expected:
        raise HTTPException(status_code=401, detail="invalid internal token")


def tool_call_id_from_args(args: Any) -> str:
    if not isinstance(args, dict):
        return ""
    return str(args.get("_tool_call_id", ""))


def queue_event(state: "RunState", event: Any) -> None:
    state.queue.put_nowait(now_payload(event))


def close_queue(state: "RunState") -> None:
    state.queue.put_nowait(None)


def queue_failed_event(
    state: "RunState",
    run_id: str,
    code: str,
    message: str,
    retryable: bool = False,
) -> None:
    queue_event(
        state,
        RunFailedEvent(
            run_id=run_id,
            code=code,
            message=message,
            retryable=retryable,
        ),
    )


def usage_payload(usage: TokenUsageInfo | None) -> dict[str, int]:
    if usage is None:
        return {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
        }
    return {
        "prompt_tokens": usage.input_tokens,
        "completion_tokens": usage.output_tokens,
        "total_tokens": usage.total_tokens,
    }


def actor_payload(request: AgentRunRequest) -> dict[str, str]:
    return {
        "user_id": request.actor.user_id,
        "tenant_id": request.actor.tenant_id,
        "workspace_id": request.actor.workspace_id,
    }


def resource_context_payload(request: AgentRunRequest) -> dict[str, Any]:
    return {
        "note_id": request.resource_context.note_id,
        "note_version": request.resource_context.note_version,
    }


def stream_headers() -> dict[str, str]:
    return {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }


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
        queue_event(self.state, event)

    def on_token(self, token: str) -> None:
        self._emit(DeltaEvent(run_id=self.request.run_id, content=token))

    def on_tool_call_start(self, name: str, args: Any) -> None:
        tool_call_id = tool_call_id_from_args(args)
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

        tool_call_id = tool_call_id_from_args(args)

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


def prepare_user_message(conversation: list[dict[str, Any]]) -> tuple[str, list[dict[str, Any]]]:
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


def select_tool_registry(request: AgentRunRequest) -> dict[str, Any]:
    if not request.allowed_tools:
        return tools
    selected: dict[str, Any] = {}
    for tool in request.allowed_tools:
        spec = tools.get(tool.name)
        if spec is not None:
            selected[tool.name] = spec
    return selected


async def run_agent_task(request: AgentRunRequest, state: RunState) -> None:
    callbacks = StreamCallbacks(request=request, state=state)
    conversation = [message.model_dump(exclude_none=True) for message in request.conversation]
    user_message, history = prepare_user_message(conversation)

    if not user_message:
        queue_failed_event(
            state,
            request.run_id,
            code="INVALID_INPUT",
            message="conversation must include at least one user message",
        )
        close_queue(state)
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
            actor=actor_payload(request),
            resource_context=resource_context_payload(request),
            tool_registry=select_tool_registry(request),
        )

        payload = usage_payload(callbacks.state.last_usage)
        queue_event(state, RunCompletedEvent(run_id=request.run_id, usage=payload))
    except Exception as exc:  # noqa: BLE001
        queue_failed_event(
            state,
            request.run_id,
            code="INTERNAL",
            message=str(exc),
            retryable=False,
        )
    finally:
        close_queue(state)


async def run_inline_edit_task(
    request: AgentInlineEditRequest,
) -> AgentInlineEditResponse:
    client = AsyncOpenAI()
    try:
        text = await run_inline_edit(
            action=request.action,
            selected_text=request.selected_text,
            custom_prompt=request.custom_prompt,
            context_blocks=request.context_blocks,
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
            timeout_ms=request.policy.timeout_ms,
            max_tokens=request.policy.max_tokens,
        )
    except TimeoutError as exc:
        raise HTTPException(
            status_code=504,
            detail="inline edit timed out",
        ) from exc

    return AgentInlineEditResponse(text=text)


async def event_generator(registry: RunRegistry, run_id: str, state: RunState) -> Any:
    try:
        while True:
            item = await state.queue.get()
            if item is None:
                break
            yield item
    finally:
        await registry.remove(run_id)
