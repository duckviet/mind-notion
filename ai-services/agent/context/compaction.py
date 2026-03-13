from __future__ import annotations

from typing import Any

from openai import AsyncOpenAI

from .token_estimator import extract_message_text

_SUMMARIZATION_PROMPT = """You are a conversation summarizer. Your task is to create a concise summary of the conversation so far that preserves:

1. Key decisions and conclusions reached
2. Important context and facts mentioned
3. Any pending tasks or questions
4. The overall goal of the conversation

Be concise but complete. The summary should allow the conversation to continue naturally.

Conversation to summarize:
"""


def _messages_to_text(messages: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for msg in messages:
        role = str(msg.get("role", "unknown")).upper()
        content = extract_message_text(msg)
        lines.append(f"[{role}]: {content}")
    return "\n\n".join(lines)


async def compact_conversation(
    messages: list[dict[str, Any]],
    client: AsyncOpenAI,
    model: str = "gpt-5-mini",
) -> list[dict[str, Any]]:
    conversation_messages = [m for m in messages if m.get("role") != "system"]
    if not conversation_messages:
        return []

    conversation_text = _messages_to_text(conversation_messages)
    completion = await client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "user",
                "content": _SUMMARIZATION_PROMPT + conversation_text,
            }
        ],
    )

    summary = completion.choices[0].message.content or ""

    return [
        {
            "role": "user",
            "content": (
                "[CONVERSATION SUMMARY]\n"
                "The following is a summary of our conversation so far:\n\n"
                f"{summary}\n\n"
                "Please continue from where we left off."
            ),
        },
        {
            "role": "assistant",
            "content": (
                "I understand. I've reviewed the summary of our conversation "
                "and I'm ready to continue. How can I help you next?"
            ),
        },
    ]
