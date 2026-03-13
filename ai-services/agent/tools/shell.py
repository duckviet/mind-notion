from __future__ import annotations

import asyncio

from .types import ToolSpec


async def _run_command(args: dict[str, object]) -> str:
    command = str(args.get("command", "")).strip()
    if not command:
        return "Command failed: missing command"

    proc = await asyncio.create_subprocess_shell(
        command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    output = (stdout.decode("utf-8", errors="replace") if stdout else "") + (
        stderr.decode("utf-8", errors="replace") if stderr else ""
    )

    if proc.returncode != 0:
        return f"Command failed (exit code {proc.returncode}):\n{output}"

    return output or "Command completed successfully (no output)"


run_command = ToolSpec(
    name="runCommand",
    description="Execute a shell command and return its output. Use this for system operations, running scripts, or interacting with the operating system.",
    input_schema={
        "type": "object",
        "properties": {"command": {"type": "string", "description": "The shell command to execute"}},
        "required": ["command"],
        "additionalProperties": False,
    },
    execute=_run_command,
)
