from .types import ToolSpec
from .web_search import web_search
from .notes import notes_read, notes_write, notes_list, folders_list, folders_read
from .rag import rag_search

tools: dict[str, ToolSpec] = {
    "notes.read": notes_read,
    "notes.write": notes_write,
    "notes.list": notes_list,
    "folders.list": folders_list,
    "folders.read": folders_read,
    "rag.search": rag_search,
    "web.search": web_search,
} 

__all__ = [
    "ToolSpec",
    "tools",
    "web_search",
    "notes_read",
    "notes_write",
    "notes_list",
    "folders_list",
    "folders_read",
    "rag",
    "rag_search",
]
