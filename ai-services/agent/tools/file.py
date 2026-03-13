from __future__ import annotations

import asyncio
from pathlib import Path

from .types import ToolSpec


async def _read_file(args: dict[str, object]) -> str:
    file_path = str(args.get("path", ""))
    try:
        return await asyncio.to_thread(Path(file_path).read_text, encoding="utf-8")
    except FileNotFoundError:
        return f"Error: File not found: {file_path}"
    except Exception as exc:  # noqa: BLE001
        return f"Error reading file: {exc}"


async def _write_file(args: dict[str, object]) -> str:
    file_path = str(args.get("path", ""))
    content = str(args.get("content", ""))
    try:
        path = Path(file_path)
        await asyncio.to_thread(path.parent.mkdir, parents=True, exist_ok=True)
        await asyncio.to_thread(path.write_text, content, encoding="utf-8")
        return f"Successfully wrote {len(content)} characters to {file_path}"
    except Exception as exc:  # noqa: BLE001
        return f"Error writing file: {exc}"


async def _list_files(args: dict[str, object]) -> str:
    directory = str(args.get("directory", "."))
    try:
        entries = await asyncio.to_thread(lambda: list(Path(directory).iterdir()))
        items = [f"[dir] {p.name}" if p.is_dir() else f"[file] {p.name}" for p in entries]
        return "\n".join(items) if items else f"Directory {directory} is empty"
    except FileNotFoundError:
        return f"Error: Directory not found: {directory}"
    except Exception as exc:  # noqa: BLE001
        return f"Error listing directory: {exc}"


async def _delete_file(args: dict[str, object]) -> str:
    file_path = str(args.get("path", ""))
    try:
        await asyncio.to_thread(Path(file_path).unlink)
        return f"Successfully deleted {file_path}"
    except FileNotFoundError:
        return f"Error: File not found: {file_path}"
    except Exception as exc:  # noqa: BLE001
        return f"Error deleting file: {exc}"


read_file = ToolSpec(
    name="readFile",
    description="Read the contents of a file at the specified path. Use this to examine file contents.",
    input_schema={
        "type": "object",
        "properties": {"path": {"type": "string", "description": "The path to the file to read"}},
        "required": ["path"],
        "additionalProperties": False,
    },
    execute=_read_file,
)

write_file = ToolSpec(
    name="writeFile",
    description="Write content to a file at the specified path. Creates the file if it doesn't exist, overwrites if it does.",
    input_schema={
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "The path to the file to write"},
            "content": {"type": "string", "description": "The content to write to the file"},
        },
        "required": ["path", "content"],
        "additionalProperties": False,
    },
    execute=_write_file,
)

list_files = ToolSpec(
    name="listFiles",
    description="List all files and directories in the specified directory path.",
    input_schema={
        "type": "object",
        "properties": {
            "directory": {
                "type": "string",
                "description": "The directory path to list contents of",
                "default": ".",
            }
        },
        "additionalProperties": False,
    },
    execute=_list_files,
)

delete_file = ToolSpec(
    name="deleteFile",
    description="Delete a file at the specified path. Use with caution as this is irreversible.",
    input_schema={
        "type": "object",
        "properties": {"path": {"type": "string", "description": "The path to the file to delete"}},
        "required": ["path"],
        "additionalProperties": False,
    },
    execute=_delete_file,
)
