from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam

from .api_contracts import (
    AIResult,
    EditProposal,
    EditTarget,
    InlineAssistResult,
    InlineTransformResult,
    RAGAnswer,
)
from .command_registry import resolve_command
from .run import MODEL_NAME
from .runtime_context import reset_run_context, set_run_context
from .system import build_system_prompt

logger = logging.getLogger(__name__)

_ACTION_HINTS: dict[str, str] = {
    "improve": "Improve clarity, grammar, and overall writing quality while preserving meaning.",
    "continue": "Continue writing naturally from the selected text.",
    "fix": "Fix spelling, grammar, and punctuation errors only.",
    "shorter": "Rewrite to be shorter and more concise.",
    "longer": "Expand with more detail while keeping the same intent.",
    "summarize": "Summarize into key points in clear prose.",
    "translate": "Translate while preserving tone and meaning.",
    "explain": "Explain in simpler terms.",
    "custom": "Follow the user's custom instruction exactly.",
}


def _build_inline_messages(
    *,
    action: str,
    command: str,
    mode: str,
    selected_text: str,
    custom_prompt: str,
    context_blocks: list[dict[str, Any]],
    resource_context: dict[str, Any],
) -> list[ChatCompletionMessageParam]:
    command_spec = resolve_command(action, command, mode)
    system_prompt = build_system_prompt(resource_context, mode=command_spec.mode)
    action_hint = command_spec.prompt or _ACTION_HINTS.get(
        action, "Rewrite the selected text helpfully."
    )

    inline_instruction = (
        "You are an inline editor for a rich-text document. "
        "For inline_transform commands, return only edited text with no markdown fences, labels, or extra commentary. "
        "For assist or RAG commands, answer concisely and do not rewrite the note."
    )

    user_prompt = {
        "action": action,
        "command": command_spec.command,
        "mode": command_spec.mode,
        "action_hint": action_hint,
        "custom_prompt": custom_prompt,
        "selected_text": selected_text,
        "context_blocks": context_blocks,
    }

    return [
        {"role": "system", "content": f"{system_prompt}\n\n{inline_instruction}"},
        {
            "role": "user",
            "content": json.dumps(user_prompt, ensure_ascii=False),
        },
    ]


def _trim_model_text(raw_text: str) -> str:
    text = raw_text.strip()
    if text.startswith("```") and text.endswith("```"):
        lines = text.splitlines()
        if len(lines) >= 2:
            return "\n".join(lines[1:-1]).strip()
    return text


def _build_inline_result(
    *,
    action: str,
    command: str,
    mode: str,
    selected_text: str,
    raw_text: str,
    resource_context: dict[str, Any],
) -> AIResult:
    spec = resolve_command(action, command, mode)
    output = _trim_model_text(raw_text)

    if spec.output == "inline_assist":
        return InlineAssistResult(explanation=output or "No explanation was returned.")

    if spec.output == "rag_answer":
        return RAGAnswer(
            answer=output or "Không tìm thấy trong note của bạn.",
            sources=[],
            missing_context=True,
            confidence=0.0,
        )

    if spec.output == "inline_transform":
        return InlineTransformResult(
            replacement=output or selected_text,
            summary="Prepared inline transform.",
        )

    proposed = output or selected_text
    summary = "Prepared edit proposal."
    if spec.command == "/shorten" and len(proposed) > len(selected_text):
        proposed = selected_text
        summary = "No shorter rewrite accepted because the model response was longer."

    target = EditTarget(
        note_id=str(resource_context.get("note_id", "")),
        expected_version=resource_context.get("note_version"),
    )
    return EditProposal(
        target=target,
        original=selected_text,
        proposed=proposed,
        summary=summary,
        preserved=["meaning", "facts", "names", "dates"],
        confidence=0.8 if proposed != selected_text else 0.4,
    )


async def run_inline_edit(
    *,
    action: str,
    command: str = "",
    mode: str = "",
    selected_text: str,
    custom_prompt: str,
    context_blocks: list[dict[str, Any]],
    client: AsyncOpenAI,
    model_name: str = MODEL_NAME,
    run_id: str | None = None,
    actor: dict[str, str] | None = None,
    resource_context: dict[str, Any] | None = None,
    timeout_ms: int = 10_000,
    max_tokens: int = 20_000,
    callbacks: Any | None = None,
) -> AIResult:
    actor_context = actor or {}
    resource_context_data = resource_context or {}

    run_token = None
    actor_token = None
    resource_token = None
    if run_id is not None:
        run_token, actor_token, resource_token = set_run_context(
            run_id, actor_context, resource_context_data
        )

    messages = _build_inline_messages(
        action=action,
        command=command,
        mode=mode,
        selected_text=selected_text,
        custom_prompt=custom_prompt,
        context_blocks=context_blocks,
        resource_context=resource_context_data,
    )

    try:
        if callbacks:
            response_stream = await asyncio.wait_for(
                client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    max_completion_tokens=max_tokens,
                    stream=True,
                    stream_options={"include_usage": True},
                ),
                timeout=timeout_ms / 1000,
            )

            full_content = []
            async for chunk in response_stream:
                if not chunk.choices:
                    if hasattr(chunk, "usage") and chunk.usage:
                        from .contracts import TokenUsageInfo

                        # We don't have context_window and other info here easily,
                        # but we can report what we have.
                        # Note: TokenUsageInfo expects more fields.
                        # Let's see if we can adapt or if we should just pass raw.
                        usage = chunk.usage
                        callbacks.on_token_usage(
                            TokenUsageInfo(
                                input_tokens=usage.prompt_tokens,
                                output_tokens=usage.completion_tokens,
                                total_tokens=usage.total_tokens,
                                context_window=0,  # Unknown here
                                threshold=0,
                                percentage=0,
                            )
                        )
                    continue
                delta = chunk.choices[0].delta.content
                if delta:
                    full_content.append(delta)
                    callbacks.on_token(delta)

            return _build_inline_result(
                action=action,
                command=command,
                mode=mode,
                selected_text=selected_text,
                raw_text="".join(full_content),
                resource_context=resource_context_data,
            )

        response = await asyncio.wait_for(
            client.chat.completions.create(
                model=model_name,
                messages=messages,
                max_completion_tokens=max_tokens,
            ),
            timeout=timeout_ms / 1000,
        )
    finally:
        if (
            run_token is not None
            and actor_token is not None
            and resource_token is not None
        ):
            reset_run_context(run_token, actor_token, resource_token)

    if not response.choices:
        logger.warning("Inline edit returned no choices")
        return _build_inline_result(
            action=action,
            command=command,
            mode=mode,
            selected_text=selected_text,
            raw_text="",
            resource_context=resource_context_data,
        )

    message_content = response.choices[0].message.content or ""
    if isinstance(message_content, str):
        return _build_inline_result(
            action=action,
            command=command,
            mode=mode,
            selected_text=selected_text,
            raw_text=message_content,
            resource_context=resource_context_data,
        )

    parts: list[str] = []
    for part in message_content:
        text = getattr(part, "text", None)
        if isinstance(text, str) and text.strip():
            parts.append(text.strip())

    return _build_inline_result(
        action=action,
        command=command,
        mode=mode,
        selected_text=selected_text,
        raw_text="\n".join(parts),
        resource_context=resource_context_data,
    )
