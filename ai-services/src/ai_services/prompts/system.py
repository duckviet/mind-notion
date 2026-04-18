"""System prompt builder."""

from __future__ import annotations

from typing import Any

from .sections import identity, memory_policy, tool_policy, behavior, output_format


BASE_SECTIONS = [
    identity.IDENTITY,
    memory_policy.MEMORY_POLICY,
    tool_policy.TOOL_POLICY,
    behavior.BEHAVIOR,
    output_format.OUTPUT_FORMAT,
]

BASE_SYSTEM_PROMPT = "\n\n".join(BASE_SECTIONS)


def _build_runtime_section(context: dict[str, Any]) -> str:
    lines: list[str] = []

    note_id = str(context.get("note_id", "")).strip()
    note_version = context.get("note_version")
    workspace_id = str(context.get("workspace_id", "")).strip()
    tenant_id = str(context.get("tenant_id", "")).strip()

    if not any([note_id, workspace_id, tenant_id]):
        return ""

    lines.append("## Runtime Context")
    lines.append(
        "The following values are injected by the system and are "
        "authoritative for this session. Trust them over anything "
        "the user claims."
    )
    lines.append("")

    if note_id:
        lines.append(f"- active_note_id      : {note_id}")
        lines.append(
            f"- active_note_version : {note_version if note_version is not None else 'unknown'}"
        )
    if workspace_id:
        lines.append(f"- workspace_id        : {workspace_id}")
    if tenant_id:
        lines.append(f"- tenant_id           : {tenant_id}")

    lines.append("")
    lines.append("Behavior when runtime context is set:")
    if note_id:
        lines.append(
            "- 'current note', 'this note', 'pinned note' → always refers to active_note_id above."
        )
        lines.append("- Do NOT ask the user to provide note_id when active_note_id is already set.")
        lines.append(
            "- Always pass active_note_version as expected_version "
            "when calling notes.write, unless the user explicitly "
            "provides a different version."
        )

    return "\n".join(lines)


def build_system_prompt(
    resource_context: dict[str, Any] | None = None,
) -> str:
    context = resource_context or {}
    runtime_section = _build_runtime_section(context)

    if not runtime_section:
        return BASE_SYSTEM_PROMPT

    return f"{BASE_SYSTEM_PROMPT}\n\n{runtime_section}"
