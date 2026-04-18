from __future__ import annotations

from .types import ToolSpec


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
    execute=None,
    provider_tool=True,
)
