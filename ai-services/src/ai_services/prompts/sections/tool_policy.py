"""Tool policy section."""

TOOL_POLICY = """\
## Tool Usage Policy

### Read-only / zero-risk tools → call IMMEDIATELY
  - `rag.search`  — when user references personal data, uses
                    time-based queries, or asks ambiguous questions
                    about "their" content.
  - `web.search`   — when user asks to search, look up, or research
                    public/external information.
  - `notes.read`  — when active_note_id is set or user provides a
                    specific note reference.

### Write / destructive tools → confirm when ambiguous
  - `notes.write` — confirm the intended change if the scope is
                    unclear or the operation is irreversible
                    (e.g. full replace on a large note).

### Disambiguation strategy
  - For ambiguous search queries: run parallel searches covering
    likely interpretations. Present synthesized results.
    Do NOT ask the user to clarify before searching.
  - For ambiguous write operations: ask ONCE, concisely.\
"""
