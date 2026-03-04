# agent-py

Python port of the TypeScript agent runtime from `src/agent`.

## What's included

- Agent loop with tool-calling and approval callbacks
- Context utilities (token estimation, model limits, compaction)
- System prompt + message compatibility filter
- Tool implementations:
  - `readFile`, `writeFile`, `listFiles`, `deleteFile`
  - `runCommand`
  - `executeCode`
  - `webSearch` (provider-tool placeholder)

## Install

```bash
cd agent-py
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Usage

```python
import asyncio
from openai import AsyncOpenAI

from agent import run_agent
from agent.contracts import TokenUsageInfo


class Callbacks:
    def on_token(self, token: str) -> None:
        print(token, end="", flush=True)

    def on_tool_call_start(self, name: str, args):
        print(f"\n[tool:start] {name} {args}")

    def on_tool_call_end(self, name: str, result: str):
        print(f"[tool:end] {name} -> {result[:80]}")

    def on_complete(self, response: str):
        print("\n[complete]")

    async def on_tool_approval(self, name: str, args) -> bool:
        return True

    def on_token_usage(self, usage: TokenUsageInfo) -> None:
        print(f"\n[tokens] {usage.total_tokens}/{usage.context_window} ({usage.percentage:.2f}%)")


async def main():
    client = AsyncOpenAI()
    callbacks = Callbacks()

    history = []
    history = await run_agent(
        user_message="List files in current directory",
        conversation_history=history,
        callbacks=callbacks,
        client=client,
    )


asyncio.run(main())
```

## Run as service (MVP+)

```bash
cd agent-py
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

Required environment variables for integration:

- `OPENAI_API_KEY`
- `AI_INTERNAL_TOKEN` (token expected by `/internal/v1/agent/runs`)
- `BACKEND_INTERNAL_BASE_URL` (default: `http://localhost:8080`)
- `BACKEND_INTERNAL_TOKEN` (token sent to BE `/internal/v1/ai/tools/execute`)

`main.py` auto-loads variables from `ai-services/agent-py/.env` if present, so local development can set these values there.

## Notes

- Current implementation emits text per model turn (`on_token` gets full chunk at once), not token-by-token streaming.
- `webSearch` is registered as a provider tool placeholder. If your model/provider does not execute provider-native tools in Chat Completions, it returns a provider-tool message.
- For production: add tool sandboxing, command allowlist, workspace isolation, and persistent session storage.
