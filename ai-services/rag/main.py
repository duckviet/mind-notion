from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel, Field

from chunking import chunk_note_event, embed_chunks_for_note


app = FastAPI(title="mind-notion ai-service", version="0.1.0")


class ChunkNoteRequest(BaseModel):
    note_id: str
    user_id: str
    title: str = ""
    content: str = ""
    status: str = "draft"
    content_type: str = "text"
    updated_at: str | None = None
    event: str = Field(default="note.save")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/notes/chunk")
def chunk_note(req: ChunkNoteRequest) -> dict[str, object]:
    result = chunk_note_event(req.model_dump())
    return {
        "message": "chunk completed",
        "result": result,
    }


@app.post("/notes/embed-chunks")
def embed_note_chunks(req: ChunkNoteRequest) -> dict[str, object]:
    """Chunk note and return embeddings for each chunk.

    This endpoint is used by the Go backend to persist chunk vectors into Postgres.
    """

    result = embed_chunks_for_note(req.model_dump())
    return result

