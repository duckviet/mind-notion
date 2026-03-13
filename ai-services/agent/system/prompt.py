from __future__ import annotations

from typing import Any


BASE_SYSTEM_PROMPT = """You are a helpful AI assistant. You provide clear, accurate, and concise responses to user questions.

Guidelines:
- Be direct and helpful
- If you don't know something, say so honestly
- Provide explanations when they add value
- Stay focused on the user's actual question"""


def build_system_prompt(resource_context: dict[str, Any] | None = None) -> str:
	context = resource_context or {}
	note_id = str(context.get("note_id", "")).strip()
	note_version = context.get("note_version")

	if not note_id:
		return BASE_SYSTEM_PROMPT

	prompt = (
		f"{BASE_SYSTEM_PROMPT}\n\n"
		"Runtime Context:\n"
		f"- active_note_id: {note_id}\n"
		f"- active_note_version: {note_version}\n\n"
		"Important:\n"
		"- The runtime context above is authoritative for this run.\n"
		"- If the user asks to read/edit the current or pinned note, use active_note_id directly.\n"
		"- Do not ask the user to provide note_id again when active_note_id is present."
	)
	return prompt


SYSTEM_PROMPT = BASE_SYSTEM_PROMPT
