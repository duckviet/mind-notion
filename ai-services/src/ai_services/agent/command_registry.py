from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, cast


Mode = Literal[
    "inline_transform",
    "inline_assist",
    "current_note_qa",
    "extract",
    "personal_knowledge_search",
]


@dataclass(frozen=True, slots=True)
class CommandSpec:
    command: str
    mode: Mode
    prompt: str
    output: str


COMMANDS: dict[str, CommandSpec] = {
    "/improve": CommandSpec(
        command="/improve",
        mode="inline_transform",
        prompt="Improve clarity, grammar, and writing quality while preserving meaning.",
        output="edit_proposal",
    ),
    "/shorten": CommandSpec(
        command="/shorten",
        mode="inline_transform",
        prompt="Make the selected text shorter while preserving facts, numbers, names, and dates.",
        output="edit_proposal",
    ),
    "/expand": CommandSpec(
        command="/expand",
        mode="inline_transform",
        prompt="Expand the selected text with useful detail while preserving intent.",
        output="edit_proposal",
    ),
    "/translate": CommandSpec(
        command="/translate",
        mode="inline_transform",
        prompt="Translate the selected text while preserving proper nouns and tone.",
        output="inline_transform",
    ),
    "/explain": CommandSpec(
        command="/explain",
        mode="inline_assist",
        prompt="Explain the selected text without rewriting or applying it to the note.",
        output="inline_assist",
    ),
    "/summarize": CommandSpec(
        command="/summarize",
        mode="inline_assist",
        prompt="Summarize the current note or selected text into concise bullets.",
        output="inline_assist",
    ),
    "/tasks": CommandSpec(
        command="/tasks",
        mode="extract",
        prompt="Extract actionable tasks from the current note.",
        output="inline_assist",
    ),
    "/ask": CommandSpec(
        command="/ask",
        mode="current_note_qa",
        prompt="Answer using the current note context and cite note sources.",
        output="rag_answer",
    ),
    "/find": CommandSpec(
        command="/find",
        mode="personal_knowledge_search",
        prompt="Search private notes and answer only with cited note sources.",
        output="rag_answer",
    ),
}


ACTION_ALIASES: dict[str, str] = {
    "improve": "/improve",
    "shorter": "/shorten",
    "shorten": "/shorten",
    "longer": "/expand",
    "expand": "/expand",
    "translate": "/translate",
    "explain": "/explain",
    "summarize": "/summarize",
    "tasks": "/tasks",
    "ask": "/ask",
    "find": "/find",
    "fix": "/improve",
    "continue": "/expand",
    "custom": "/improve",
}


def resolve_command(action: str, command: str = "", mode: str = "") -> CommandSpec:
    key = (command or ACTION_ALIASES.get(action, action)).strip()
    if key and not key.startswith("/"):
        key = ACTION_ALIASES.get(key, f"/{key}")
    spec = COMMANDS.get(key)
    if spec is None:
        return COMMANDS["/improve"]
    if mode and mode != spec.mode:
        return CommandSpec(
            command=spec.command,
            mode=cast(Mode, mode),
            prompt=spec.prompt,
            output=spec.output,
        )
    return spec
