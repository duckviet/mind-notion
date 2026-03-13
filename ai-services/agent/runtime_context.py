from __future__ import annotations

from contextvars import ContextVar
from typing import Any


_current_run_id: ContextVar[str | None] = ContextVar("current_run_id", default=None)
_current_tool_call_id: ContextVar[str | None] = ContextVar("current_tool_call_id", default=None)
_current_actor: ContextVar[dict[str, str]] = ContextVar("current_actor", default={})
_current_resource_context: ContextVar[dict[str, Any]] = ContextVar("current_resource_context", default={})


def set_run_context(
    run_id: str,
    actor: dict[str, str],
    resource_context: dict[str, Any] | None = None,
) -> tuple[Any, Any, Any]:
    run_token = _current_run_id.set(run_id)
    actor_token = _current_actor.set(actor)
    resource_token = _current_resource_context.set(resource_context or {})
    return run_token, actor_token, resource_token


def reset_run_context(run_token: Any, actor_token: Any, resource_token: Any) -> None:
    _current_run_id.reset(run_token)
    _current_actor.reset(actor_token)
    _current_resource_context.reset(resource_token)


def set_tool_call_context(tool_call_id: str) -> Any:
    return _current_tool_call_id.set(tool_call_id)


def reset_tool_call_context(token: Any) -> None:
    _current_tool_call_id.reset(token)


def get_run_id() -> str | None:
    return _current_run_id.get()


def get_tool_call_id() -> str | None:
    return _current_tool_call_id.get()


def get_actor() -> dict[str, str]:
    actor = _current_actor.get()
    return dict(actor)


def get_resource_context() -> dict[str, Any]:
    resource_context = _current_resource_context.get()
    return dict(resource_context)
