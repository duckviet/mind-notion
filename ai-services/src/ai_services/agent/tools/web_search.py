from __future__ import annotations

import asyncio
from typing import Any
from .types import ToolSpec

async def _execute_web_search(args: dict[str, Any]) -> str:
    query = args.get("query")
    if not isinstance(query, str):
        return "Error: query must be a string."
    
    try:
        def _search():
            from ddgs import DDGS
            return list(DDGS().text(query, max_results=10))
            
        results = await asyncio.to_thread(_search)
        if not results:
            return "No results found."
        
        output = [f"Search results for '{query}':\n"]
        for r in results:
            title = r.get('title', 'No Title')
            href = r.get('href', '')
            body = r.get('body', '')
            output.append(f"### {title}\n**URL**: {href}\n{body}\n")
        
        return "\n".join(output)
    except Exception as e:
        return f"Error executing web search: {e}"

web_search = ToolSpec(
    name="web.search",
    description=(
        "Search the public web for general, current, or external information "
        "NOT contained in the user's personal notes. "
        "Use for: news, public facts, library/package docs, current events, "
        "anything about named tools, frameworks, people, or concepts.\n\n"
        "BEHAVIOR RULES:\n"
        "- When the user explicitly asks to 'search', 'look up', 'find' "
        "something → call this tool IMMEDIATELY without asking for "
        "clarification.\n"
        "- For ambiguous names (e.g. a library that could mean multiple "
        "things), run 1-2 parallel queries covering the likely "
        "interpretations; do NOT ask the user to disambiguate first.\n"
        "- This tool is read-only and zero-risk — prefer calling it "
        "over asking clarifying questions.\n\n"
        "Do NOT use for the user's private/personal data → use `rag.search`."
    ),
    input_schema={
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search query"},
        },
        "required": ["query"],
        "additionalProperties": False,
    },
    execute=_execute_web_search,
    provider_tool=False,
)
