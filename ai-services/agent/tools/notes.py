from __future__ import annotations

import json
import os
from typing import Any

import httpx

from ..runtime_context import get_actor, get_resource_context, get_run_id, get_tool_call_id
from .types import ToolSpec


def _backend_base_url() -> str:
    return os.getenv("BACKEND_INTERNAL_BASE_URL", "http://localhost:8080").rstrip("/")


def _backend_token() -> str:
    token = os.getenv("BACKEND_INTERNAL_TOKEN", "").strip()
    if token and not token.startswith("/"):
        return token

    for env_name in ("AI_SERVICE_TOKEN", "AI_INTERNAL_TOKEN"):
        fallback = os.getenv(env_name, "").strip()
        if fallback:
            return fallback

    return token


def _timeout_seconds() -> float:
    timeout_ms = os.getenv("BACKEND_TOOL_TIMEOUT_MS", "30000")
    try:
        return max(float(timeout_ms) / 1000.0, 1.0)
    except ValueError:
        return 30.0


async def _execute_backend_tool(tool: str, input_payload: dict[str, Any]) -> str:
    run_id = get_run_id() or ""
    tool_call_id = get_tool_call_id() or ""
    actor = get_actor()

    payload = {
        "run_id": run_id,
        "tool_call_id": tool_call_id,
        "tool": tool,
        "actor": {
            "user_id": actor.get("user_id", ""),
            "tenant_id": actor.get("tenant_id", ""),
            "workspace_id": actor.get("workspace_id", ""),
        },
        "input": input_payload,
    }

    headers = {"Content-Type": "application/json"}
    token = _backend_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"

    url = f"{_backend_base_url()}/internal/v1/ai/tools/execute"
    timeout = httpx.Timeout(_timeout_seconds())

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(url, json=payload, headers=headers)

    if response.status_code >= 400:
        return f"Error executing tool {tool}: status={response.status_code}, body={response.text}"

    data = response.json()
    if not data.get("ok", False):
        error = data.get("error", {})
        code = error.get("code", "TOOL_EXECUTION_FAILED")
        message = error.get("message", "unknown error")
        return f"Error {code}: {message}"

    output = data.get("output", {})
    return json.dumps(output, ensure_ascii=False)


async def _notes_read(args: dict[str, Any]) -> str:
    resource_context = get_resource_context()
    note_id = str(args.get("note_id") or resource_context.get("note_id", "")).strip()
    if not note_id:
        return "Error INVALID_INPUT: note_id is required"

    input_payload: dict[str, Any] = {"note_id": note_id}
    if "range" in args and isinstance(args.get("range"), dict):
        input_payload["range"] = args["range"]

    return await _execute_backend_tool("notes.read", input_payload)


async def _notes_write(args: dict[str, Any]) -> str:
    resource_context = get_resource_context()
    note_id = str(args.get("note_id") or resource_context.get("note_id", "")).strip()
    operation = str(args.get("operation", "")).strip()
    expected_version = args.get("expected_version")
    if expected_version is None:
        expected_version = resource_context.get("note_version")

    if not note_id:
        return "Error INVALID_INPUT: note_id is required"
    if operation not in {"replace", "append", "patch"}:
        return "Error INVALID_INPUT: operation must be one of replace|append|patch"
    if not isinstance(expected_version, int) or expected_version < 0:
        return "Error INVALID_INPUT: expected_version must be a non-negative integer"

    input_payload: dict[str, Any] = {
        "note_id": note_id,
        "operation": operation,
        "expected_version": expected_version,
    }

    if "content" in args:
        input_payload["content"] = args.get("content")
    if "patch" in args:
        input_payload["patch"] = args.get("patch")
    if "idempotency_key" in args:
        input_payload["idempotency_key"] = args.get("idempotency_key")

    return await _execute_backend_tool("notes.write", input_payload)


notes_read = ToolSpec(
    name="notes.read",
    description="Read note content and metadata by note_id through backend policy checks. Uses active runtime note_id when omitted.",
    input_schema={
        "type": "object",
        "properties": {
            "note_id": {"type": "string", "description": "The note identifier"},
            "range": {
                "type": "object",
                "properties": {
                    "start": {"type": "integer", "minimum": 0},
                    "end": {"type": "integer", "minimum": 0},
                },
                "additionalProperties": False,
            },
        },
        "required": ["note_id"],
        "additionalProperties": False,
    },
    execute=_notes_read,
)


notes_write = ToolSpec(
    name="notes.write",
    description="Write note content through backend policy checks with optimistic concurrency. Uses active runtime note_id/note_version when omitted.",
    input_schema={
        "type": "object",
        "properties": {
            "note_id": {"type": "string", "description": "The note identifier"},
            "operation": {
                "type": "string",
                "enum": ["replace", "append", "patch"],
                "description": "Write operation type",
            },
            "content": {"type": "string", "description": "Content for replace/append"},
            "patch": {
                "type": "array",
                "items": {"type": "object"},
                "description": "Patch payload for patch operation",
            },
            "expected_version": {
                "type": "integer",
                "minimum": 0,
                "description": "Expected current note version",
            },
            "idempotency_key": {
                "type": "string",
                "description": "Optional key for deduplication",
            },
        },
        "required": ["note_id", "operation", "expected_version"],
        "additionalProperties": False,
    },
    execute=_notes_write,
)
