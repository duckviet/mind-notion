from .types import ToolSpec
from .file import read_file, write_file, list_files, delete_file
from .shell import run_command
from .code_execution import execute_code
from .web_search import web_search
from .time import get_current_time
from .notes import notes_read, notes_write
from importlib import import_module

rag = import_module("agent.tools.rag")
rag_search = rag.rag_search

tools: dict[str, ToolSpec] = {
    "notes.read": notes_read,
    "notes.write": notes_write,
    "rag.search": rag_search,
    # "readFile": read_file,
    # "writeFile": write_file,
    # "listFiles": list_files,
    # "deleteFile": delete_file,
    # "runCommand": run_command,
    # "executeCode": execute_code,
    "webSearch": web_search,
    # "getCurrentTime": get_current_time,
}

# file_tools: dict[str, ToolSpec] = {
#     "readFile": read_file,
#     "writeFile": write_file,
#     "listFiles": list_files,
#     "deleteFile": delete_file,
# }

# shell_tools: dict[str, ToolSpec] = {
#     "runCommand": run_command,
# }

__all__ = [
    "ToolSpec",
    "tools",
    # "file_tools",
    # "shell_tools",
    # "read_file",
    # "write_file",
    # "list_files",
    # "delete_file",
    # "run_command",
    # "execute_code",
    "web_search",
    # "get_current_time",
    "notes_read",
    "notes_write",
    "rag",
    "rag_search",
]
