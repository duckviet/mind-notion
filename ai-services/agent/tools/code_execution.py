from __future__ import annotations

import asyncio
import os
import tempfile
from pathlib import Path

from .types import ToolSpec


async def _execute_code(args: dict[str, object]) -> str:
    code = str(args.get("code", ""))
    language = str(args.get("language", "javascript"))

    extensions = {
        "javascript": ".js",
        "python": ".py",
        "typescript": ".ts",
    }

    commands = {
        "javascript": lambda file_path: ["node", file_path],
        "python": lambda file_path: ["python3", file_path],
        "typescript": lambda file_path: ["npx", "tsx", file_path],
    }

    ext = extensions.get(language)
    cmd_builder = commands.get(language)
    if not ext or not cmd_builder:
        return f"Error executing code: unsupported language '{language}'"

    fd, tmp_path = tempfile.mkstemp(prefix="code-exec-", suffix=ext)
    os.close(fd)

    try:
        await asyncio.to_thread(Path(tmp_path).write_text, code, encoding="utf-8")
        cmd = cmd_builder(tmp_path)
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
        output = (stdout.decode("utf-8", errors="replace") if stdout else "") + (
            stderr.decode("utf-8", errors="replace") if stderr else ""
        )

        if proc.returncode != 0:
            return f"Execution failed (exit code {proc.returncode}):\n{output}"

        return output or "Code executed successfully (no output)"
    except Exception as exc:  # noqa: BLE001
        return f"Error executing code: {exc}"
    finally:
        try:
            await asyncio.to_thread(Path(tmp_path).unlink)
        except Exception:  # noqa: BLE001
            pass


execute_code = ToolSpec(
    name="executeCode",
    description="Execute code for anything you need compute for. Supports JavaScript (Node.js), Python, and TypeScript. Returns the output of the execution.",
    input_schema={
        "type": "object",
        "properties": {
            "code": {"type": "string", "description": "The code to execute"},
            "language": {
                "type": "string",
                "enum": ["javascript", "python", "typescript"],
                "description": "The programming language of the code",
                "default": "javascript",
            },
        },
        "required": ["code"],
        "additionalProperties": False,
    },
    execute=_execute_code,
)
