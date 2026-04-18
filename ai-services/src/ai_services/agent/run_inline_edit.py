from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from openai import AsyncOpenAI

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
    selected_text: str,
    custom_prompt: str,
    context_blocks: list[dict[str, Any]],
    resource_context: dict[str, Any],
) -> list[dict[str, str]]:
    system_prompt = build_system_prompt(resource_context)
    action_hint = _ACTION_HINTS.get(action, "Rewrite the selected text helpfully.")

    inline_instruction = (
        "You are an inline editor for a rich-text document. "
        "Return only the edited text with no markdown fences, labels, or extra commentary."
    )

    user_prompt = {
        "action": action,
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


async def run_inline_edit(
    *,
    action: str,
    selected_text: str,
    custom_prompt: str,
    context_blocks: list[dict[str, Any]],
    client: AsyncOpenAI,
    model_name: str = MODEL_NAME,
    run_id: str | None = None,
    actor: dict[str, str] | None = None,
    resource_context: dict[str, Any] | None = None,
    timeout_ms: int = 10_000,
    max_tokens: int = 1_024,
) -> str:
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
        selected_text=selected_text,
        custom_prompt=custom_prompt,
        context_blocks=context_blocks,
        resource_context=resource_context_data,
    )

    try:
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
        return ""

    message_content = response.choices[0].message.content or ""
    if isinstance(message_content, str):
        return message_content.strip()

    parts: list[str] = []
    for part in message_content:
        text = getattr(part, "text", None)
        if isinstance(text, str) and text.strip():
            parts.append(text.strip())

    return "\n".join(parts).strip()
