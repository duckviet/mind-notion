"""Backend client for notes API."""

from __future__ import annotations

from functools import lru_cache

import httpx

from core.config import settings
from .types import Note, NoteSearchResult


class BackendClient:
    """Client for backend notes API."""

    def __init__(self, base_url: str | None = None, token: str | None = None) -> None:
        self._base_url = base_url or settings.backend_base_url
        self._token = token or settings.backend_token
        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            headers={"Authorization": f"Bearer {self._token}"},
            timeout=30.0,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def get_note(self, note_id: str) -> Note | None:
        """Get a note by ID."""
        try:
            response = await self._client.get(f"/api/v1/notes/{note_id}")
            if response.status_code == 404:
                return None
            response.raise_for_status()
            data = response.json()
            return Note(
                id=data["id"],
                content=data["content"],
                version=data["version"],
                created_at=data["createdAt"],
                updated_at=data["updatedAt"],
            )
        except httpx.HTTPError:
            return None

    async def search_notes(
        self,
        query: str,
        tenant_id: str,
        workspace_id: str,
        limit: int = 10,
    ) -> list[NoteSearchResult]:
        """Search notes using RAG."""
        try:
            response = await self._client.post(
                "/api/v1/notes/search",
                json={
                    "query": query,
                    "tenantId": tenant_id,
                    "workspaceId": workspace_id,
                    "limit": limit,
                },
            )
            response.raise_for_status()
            data = response.json()
            return [
                NoteSearchResult(
                    note_id=r["noteId"],
                    content=r["content"],
                    score=r["score"],
                    highlights=r.get("highlights", []),
                )
                for r in data.get("results", [])
            ]
        except httpx.HTTPError:
            return []

    async def create_note(
        self,
        content: str,
        tenant_id: str,
        workspace_id: str,
        user_id: str,
    ) -> Note | None:
        """Create a new note."""
        try:
            response = await self._client.post(
                "/api/v1/notes",
                json={
                    "content": content,
                    "tenantId": tenant_id,
                    "workspaceId": workspace_id,
                    "userId": user_id,
                },
            )
            response.raise_for_status()
            data = response.json()
            return Note(
                id=data["id"],
                content=data["content"],
                version=data["version"],
                created_at=data["createdAt"],
                updated_at=data["updatedAt"],
            )
        except httpx.HTTPError:
            return None

    async def update_note(
        self,
        note_id: str,
        content: str,
        expected_version: int,
    ) -> Note | None:
        """Update an existing note."""
        try:
            response = await self._client.patch(
                f"/api/v1/notes/{note_id}",
                json={
                    "content": content,
                    "expectedVersion": expected_version,
                },
            )
            response.raise_for_status()
            data = response.json()
            return Note(
                id=data["id"],
                content=data["content"],
                version=data["version"],
                created_at=data["createdAt"],
                updated_at=data["updatedAt"],
            )
        except httpx.HTTPError:
            return None


@lru_cache(maxsize=1)
def get_backend_client() -> BackendClient:
    """Get backend client singleton."""
    return BackendClient()
