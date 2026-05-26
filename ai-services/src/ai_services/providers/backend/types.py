"""Backend types."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class Note:
    id: str
    content: str
    version: int
    created_at: str
    updated_at: str


@dataclass
class NoteSearchResult:
    note_id: str
    content: str
    score: float
    highlights: list[str]


@dataclass
class NoteCreateRequest:
    content: str
    tenant_id: str
    workspace_id: str
    user_id: str


@dataclass
class NoteUpdateRequest:
    content: str
    expected_version: int
