from .types import ToolSpec
from .web_search import web_search
from .notes import notes_read, notes_write
from importlib import import_module

rag = import_module("agent.tools.rag")
rag_search = rag.rag_search

tools: dict[str, ToolSpec] = {
    "notes.read": notes_read,
    "notes.write": notes_write,
    "rag.search": rag_search,
    "web.search": web_search,
} 

__all__ = [
    "ToolSpec",
    "tools",
    "web_search",
    "notes_read",
    "notes_write",
    "rag",
    "rag_search",
]
