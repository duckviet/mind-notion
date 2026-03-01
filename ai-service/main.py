from __future__ import annotations

from argparse import Namespace
from fastapi import FastAPI
from pydantic import BaseModel, Field

from scripts.postgres_to_chunks import run


app = FastAPI(title="mind-notion ai-service", version="0.1.0")


class IngestRequest(BaseModel):
    full: bool = False
    user_id: str | None = None
    batch_size: int = Field(default=200, ge=1)
    max_batches: int = Field(default=0, ge=0)
    print_sample: bool = False


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/ingest")
def ingest(req: IngestRequest) -> dict[str, str]:
    args = Namespace(
        full=req.full,
        user_id=req.user_id,
        batch_size=req.batch_size,
        max_batches=req.max_batches,
        print_sample=req.print_sample,
    )
    run(args)
    return {"message": "ingest completed"}
