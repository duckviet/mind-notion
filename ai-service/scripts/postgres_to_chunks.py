#!/usr/bin/env python3
"""Extract notes from Postgres -> normalize text -> chunk -> export JSONL.

Debug-friendly script with verbose prints for each stage.
"""

from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row


# Keep replacement logic aligned with backend/internal/service/search_service.go
REPLACEMENTS = [
    ("<br>", "\n"),
    ("<br/>", "\n"),
    ("<br />", "\n"),
    ("<p>", ""),
    ("</p>", "\n"),
    ("<div>", ""),
    ("</div>", "\n"),
    ("&nbsp;", " "),
    ("&amp;", "&"),
    ("&lt;", "<"),
    ("&gt;", ">"),
]


@dataclass
class Settings:
    db_host: str
    db_port: int
    db_user: str
    db_password: str
    db_name: str
    db_ssl_mode: str
    chunk_size: int
    chunk_overlap: int
    output_dir: Path
    state_file: Path


def load_settings() -> Settings:
    root = Path(__file__).resolve().parents[1]

    # Load ai-service/.env first, then backend/.env as fallback
    load_dotenv(root / ".env", override=False)
    load_dotenv(root.parent / "backend" / ".env", override=False)

    return Settings(
        db_host=os.getenv("DATABASE_HOST", "localhost"),
        db_port=int(os.getenv("DATABASE_PORT", "5432")),
        db_user=os.getenv("DATABASE_USER", "postgres"),
        db_password=os.getenv("DATABASE_PASSWORD", ""),
        db_name=os.getenv("DATABASE_NAME", "collaborative_editor"),
        db_ssl_mode=os.getenv("DATABASE_SSL_MODE", "disable"),
        chunk_size=int(os.getenv("CHUNK_SIZE", "1000")),
        chunk_overlap=int(os.getenv("CHUNK_OVERLAP", "200")),
        output_dir=Path(os.getenv("CHUNKS_OUTPUT_DIR", str(root / "data" / "chunks"))),
        state_file=Path(os.getenv("STATE_FILE", str(root / "state" / "ingest_state.json"))),
    )


def mask_secret(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 4:
        return "****"
    return value[:2] + "***" + value[-2:]


def clean_content(content: str) -> str:
    result = content or ""
    for old, new in REPLACEMENTS:
        result = result.replace(old, new)
    return result.strip()


def prepare_note_text(title: str, content: str) -> str:
    parts: List[str] = []
    if title and title.strip():
        parts.append(title.strip())
    cleaned = clean_content(content or "")
    if cleaned:
        parts.append(cleaned)
    return "\n\n".join(parts)


def chunk_text(text: str, chunk_size: int, chunk_overlap: int) -> List[str]:
    if not text:
        return []
    if chunk_size <= 0:
        raise ValueError("chunk_size must be > 0")
    if chunk_overlap < 0 or chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be >= 0 and < chunk_size")

    chunks: List[str] = []
    start = 0
    step = chunk_size - chunk_overlap

    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        if end >= len(text):
            break
        start += step

    return chunks


def load_state(state_file: Path) -> Dict[str, Any]:
    if not state_file.exists():
        return {"global": {"last_watermark": None}, "users": {}}
    with state_file.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_state(state_file: Path, state: Dict[str, Any]) -> None:
    state_file.parent.mkdir(parents=True, exist_ok=True)
    with state_file.open("w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def get_watermark(state: Dict[str, Any], user_id: Optional[str]) -> Optional[str]:
    if user_id:
        return state.get("users", {}).get(user_id, {}).get("last_watermark")
    return state.get("global", {}).get("last_watermark")


def set_watermark(state: Dict[str, Any], user_id: Optional[str], watermark: str) -> None:
    if user_id:
        state.setdefault("users", {})
        state["users"].setdefault(user_id, {})
        state["users"][user_id]["last_watermark"] = watermark
    else:
        state.setdefault("global", {})
        state["global"]["last_watermark"] = watermark


def build_conn_string(s: Settings) -> str:
    return (
        f"host={s.db_host} "
        f"port={s.db_port} "
        f"dbname={s.db_name} "
        f"user={s.db_user} "
        f"password={s.db_password} "
        f"sslmode={s.db_ssl_mode}"
    )


def fetch_batch(
    conn: psycopg.Connection,
    batch_size: int,
    user_id: Optional[str],
    watermark: Optional[str],
    cursor_updated_at: Optional[datetime],
    cursor_id: Optional[str],
) -> List[Dict[str, Any]]:
    where = ["deleted_at IS NULL"]
    params: Dict[str, Any] = {"limit": batch_size}

    if user_id:
        where.append("user_id = %(user_id)s")
        params["user_id"] = user_id

    if watermark:
        where.append("updated_at > %(watermark)s")
        params["watermark"] = watermark

    if cursor_updated_at and cursor_id:
        where.append("(updated_at > %(cursor_updated_at)s OR (updated_at = %(cursor_updated_at)s AND id > %(cursor_id)s))")
        params["cursor_updated_at"] = cursor_updated_at
        params["cursor_id"] = cursor_id

    sql = f"""
        SELECT id, user_id, title, content, status, content_type, updated_at, deleted_at
        FROM notes
        WHERE {' AND '.join(where)}
        ORDER BY updated_at ASC, id ASC
        LIMIT %(limit)s
    """

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, params)
        return list(cur.fetchall())


def export_chunks_for_note(
    note: Dict[str, Any],
    chunks: List[str],
    output_dir: Path,
    run_date: str,
) -> int:
    user_id = str(note["user_id"])
    note_id = str(note["id"])
    updated_at = note["updated_at"]

    out_file = output_dir / f"user_id={user_id}" / f"dt={run_date}" / "chunks.jsonl"
    out_file.parent.mkdir(parents=True, exist_ok=True)

    written = 0
    with out_file.open("a", encoding="utf-8") as f:
        total_chunks = len(chunks)
        for idx, ch in enumerate(chunks):
            record = {
                "id": f"{note_id}:{idx}",
                "text": ch,
                "metadata": {
                    "note_id": note_id,
                    "user_id": user_id,
                    "chunk_index": idx,
                    "total_chunks": total_chunks,
                    "status": str(note.get("status") or ""),
                    "content_type": str(note.get("content_type") or ""),
                    "updated_at": updated_at.isoformat() if hasattr(updated_at, "isoformat") else str(updated_at),
                    "source": "postgres.notes",
                },
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
            written += 1

    return written


def run(args: argparse.Namespace) -> int:
    s = load_settings()
    # (thông tin DB, kích thước chunk) từ file .env
    print("=" * 80)
    print("[START] Postgres -> Chunk JSONL")
    print("[DEBUG] DB host:", s.db_host)
    print("[DEBUG] DB port:", s.db_port)
    print("[DEBUG] DB name:", s.db_name)
    print("[DEBUG] DB user:", s.db_user)
    print("[DEBUG] DB pass:", mask_secret(s.db_password))
    print("[DEBUG] Chunk size:", s.chunk_size)
    print("[DEBUG] Chunk overlap:", s.chunk_overlap)
    print("[DEBUG] Output dir:", s.output_dir)
    print("[DEBUG] State file:", s.state_file)
    print("[DEBUG] User scope:", args.user_id or "ALL")
    print("[DEBUG] Mode:", "FULL" if args.full else "INCREMENTAL")
    print("=" * 80)

    state = load_state(s.state_file)
    # để xem lần trước script này chạy đến đâu rồi.
    # # Dùng --full thì quét từ đầu, hoặc chỉ quét thay đổi (Incremental Sync)
    watermark = None if args.full else get_watermark(state, args.user_id)
    print("[DEBUG] Current watermark:", watermark)

    conn_str = build_conn_string(s)
    run_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    total_notes = 0
    total_chunks = 0
    skipped_empty = 0
    last_seen_updated_at: Optional[datetime] = None
    last_seen_id: Optional[str] = None
    max_updated_at: Optional[datetime] = None

    with psycopg.connect(conn_str) as conn:
        print("[DEBUG] Connected Postgres successfully")

        while True:
            # lặp để kéo 1 batch mấy note từ postgres
            rows = fetch_batch(
                conn=conn,
                batch_size=args.batch_size,
                user_id=args.user_id,
                watermark=watermark,
                cursor_updated_at=last_seen_updated_at,
                cursor_id=last_seen_id,
            )

            if not rows:
                print("[DEBUG] No more rows")
                break

            print(f"[DEBUG] Batch fetched: {len(rows)} rows")

            for note in rows:
                note_id = str(note["id"])
                title = note.get("title") or ""
                content = note.get("content") or ""
                # clean html + gộp title + content
                prepared = prepare_note_text(title, content)

                if not prepared.strip():
                    skipped_empty += 1
                    print(f"[DEBUG] Skip empty note={note_id}")
                    continue

                # chia 1 note thành phần nhỏ        
                chunks = chunk_text(prepared, s.chunk_size, s.chunk_overlap)
                # lưu phần nhỏ vô ổ cứng theo cấu trúc <user_id=xxx/dt=yyy/chunks.jsonl>
                written = export_chunks_for_note(note, chunks, s.output_dir, run_date)

                total_notes += 1
                total_chunks += written

                updated_at = note["updated_at"]
                if max_updated_at is None or updated_at > max_updated_at:
                    max_updated_at = updated_at

                print(
                    f"[DEBUG] note={note_id} user={note['user_id']} "
                    f"text_len={len(prepared)} chunks={len(chunks)} written={written}"
                )

                if args.print_sample and chunks:
                    sample = chunks[0][:200].replace("\n", " ")
                    print(f"[DEBUG] sample_chunk note={note_id}: {sample}...")

            # Move keyset cursor
            last_row = rows[-1]
            last_seen_updated_at = last_row["updated_at"]
            last_seen_id = str(last_row["id"])

            if args.max_batches and args.max_batches > 0:
                args.max_batches -= 1
                if args.max_batches == 0:
                    print("[DEBUG] Reached --max-batches limit, stopping early")
                    break

    if max_updated_at is not None:
        # để lưu lại mốc thời gian cập nhật
        set_watermark(state, args.user_id, max_updated_at.isoformat())
        save_state(s.state_file, state)
        print("[DEBUG] Watermark updated to:", max_updated_at.isoformat())

    print("=" * 80)
    print("[DONE] Export finished")
    print("[STATS] indexed_notes:", total_notes)
    print("[STATS] skipped_empty:", skipped_empty)
    print("[STATS] total_chunks:", total_chunks)
    print("=" * 80)

    return 0


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Extract notes from Postgres and export chunks as JSONL")
    p.add_argument("--full", action="store_true", help="Run full export (ignore watermark)")
    p.add_argument("--user-id", type=str, default=None, help="Export for one user only")
    p.add_argument("--batch-size", type=int, default=200, help="Rows per DB batch")
    p.add_argument("--max-batches", type=int, default=0, help="Stop after N batches (debug)")
    p.add_argument("--print-sample", action="store_true", help="Print first chunk sample per note")
    return p.parse_args()


if __name__ == "__main__":
    raise SystemExit(run(parse_args()))
