from __future__ import annotations

import argparse
import asyncio
import os
from pathlib import Path

from openai import AsyncOpenAI

from agent import run_agent
from agent.contracts import TokenUsageInfo


def _load_dotenv() -> None:
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key and key not in os.environ:
            os.environ[key] = value


class SmokeCallbacks:
    def on_token(self, token: str) -> None:
        print(token, end="", flush=True)

    def on_tool_call_start(self, name: str, args):
        print(f"\n\n[tool:start] {name} {args}")

    def on_tool_call_end(self, name: str, result: str):
        preview = result if len(result) <= 300 else f"{result[:300]}..."
        print(f"[tool:end] {name} -> {preview}")

    def on_complete(self, response: str):
        print("\n\n[complete]")

    async def on_tool_approval(self, name: str, args) -> bool:
        print(f"[tool:approve] {name} -> approved")
        return True

    def on_token_usage(self, usage: TokenUsageInfo) -> None:
        print(
            f"\n[tokens] in={usage.input_tokens} out={usage.output_tokens} "
            f"total={usage.total_tokens}/{usage.context_window} "
            f"({usage.percentage:.2f}%)"
        )


async def _run(question: str, model: str) -> None:
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is not set")

    client = AsyncOpenAI()
    callbacks = SmokeCallbacks()

    await run_agent(
        user_message=question,
        conversation_history=[],
        callbacks=callbacks,
        client=client,
        model_name=model,
    )


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Smoke test for agent-py")
    parser.add_argument("--question", "-q", type=str, default="", help="Question for the agent")
    parser.add_argument("--model", type=str, default="gpt-5-mini", help="Model name")
    return parser.parse_args()


def main() -> None:
    _load_dotenv()

    args = _parse_args()
    question = args.question.strip()

    if not question:
        question = input("Nhập câu hỏi cho agent: ").strip()

    if not question:
        raise ValueError("Question is required")

    asyncio.run(_run(question, args.model))


if __name__ == "__main__":
    main()
