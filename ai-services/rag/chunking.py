from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv


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

BLOCK_TAG_NEWLINE_PATTERN = re.compile(
    r"</?(p|div|section|article|header|footer|blockquote|pre|ul|ol|li|h[1-6]|table|tr|td|th|hr)\b[^>]*>",
    re.IGNORECASE,
)
BR_TAG_PATTERN = re.compile(r"<br\s*/?>", re.IGNORECASE)
SCRIPT_STYLE_PATTERN = re.compile(r"<(script|style)\b[^>]*>.*?</\1>", re.IGNORECASE | re.DOTALL)
TAG_PATTERN = re.compile(r"<[^>]+>")
MULTI_NEWLINE_PATTERN = re.compile(r"\n{3,}")
SPACE_BEFORE_NEWLINE_PATTERN = re.compile(r"[ \t]+\n")
PRE_CODE_OPEN_PATTERN = re.compile(r"<pre\b[^>]*><code\b[^>]*>", re.IGNORECASE)
PRE_CODE_CLOSE_PATTERN = re.compile(r"</code>\s*</pre>", re.IGNORECASE)
CODE_TAG_PATTERN = re.compile(r"</?code\b[^>]*>", re.IGNORECASE)

HEADING_LINE_PATTERN = re.compile(r"^#{1,6}\s+.+")
LIST_ITEM_PATTERN = re.compile(r"^(?:[-*+]\s+|\d+[.)]\s+).+")
CODE_FENCE_PATTERN = re.compile(r"^```")
SENTENCE_SPLIT_PATTERN = re.compile(r"(?<=[.!?])\s+(?=[^\s])")
TOKEN_PATTERN = re.compile(r"\w+|[^\w\s]", re.UNICODE)


@dataclass
class Settings:
    chunk_size: int
    chunk_overlap: int
    output_dir: Path


def load_settings() -> Settings:
    root = Path(__file__).resolve().parent

    load_dotenv(root / ".env", override=False)

    return Settings(
        chunk_size=int(os.getenv("CHUNK_SIZE", "1000")),
        chunk_overlap=int(os.getenv("CHUNK_OVERLAP", "200")),
        output_dir=Path(os.getenv("CHUNKS_OUTPUT_DIR", str(root / "data" / "chunks"))),
    )


def clean_content(content: str) -> str:
    result = content or ""

    # Fast replacements kept for backward compatibility
    for old, new in REPLACEMENTS:
        result = result.replace(old, new)

    # Remove noisy non-content blocks
    result = SCRIPT_STYLE_PATTERN.sub(" ", result)

    # Preserve code blocks
    result = PRE_CODE_OPEN_PATTERN.sub("\n```\n", result)
    result = PRE_CODE_CLOSE_PATTERN.sub("\n```\n", result)

    # Preserve semantic line breaks for block tags before stripping all tags
    result = BR_TAG_PATTERN.sub("\n", result)
    result = BLOCK_TAG_NEWLINE_PATTERN.sub("\n", result)

    # Drop remaining HTML tags and decode entities
    result = CODE_TAG_PATTERN.sub("", result)
    result = TAG_PATTERN.sub(" ", result)
    result = unescape(result)

    # Normalize whitespace/newlines
    result = result.replace("\r\n", "\n").replace("\r", "\n")
    result = SPACE_BEFORE_NEWLINE_PATTERN.sub("\n", result)
    result = MULTI_NEWLINE_PATTERN.sub("\n\n", result)

    # Normalize spaces in each line while preserving paragraph breaks
    normalized_lines: list[str] = []
    for line in result.split("\n"):
        compact = " ".join(line.split())
        normalized_lines.append(compact)

    result = "\n".join(normalized_lines).strip()
    return result


def _estimate_tokens(text: str) -> int:
    if not text:
        return 0
    return len(TOKEN_PATTERN.findall(text))


def _split_to_units(text: str) -> list[str]:
    if not text:
        return []

    lines = [line.rstrip() for line in text.split("\n")]
    units: list[str] = []
    buffer: list[str] = []
    in_code_block = False

    for line in lines:
        if CODE_FENCE_PATTERN.match(line.strip()):
            if in_code_block:
                buffer.append(line)
                units.append("\n".join(buffer).strip())
                buffer = []
                in_code_block = False
                continue

            if buffer:
                units.append("\n".join(buffer).strip())
                buffer = []
            buffer.append(line)
            in_code_block = True
            continue

        if in_code_block:
            buffer.append(line)
            continue

        if not line.strip():
            if buffer:
                units.append("\n".join(buffer).strip())
                buffer = []
            continue

        if HEADING_LINE_PATTERN.match(line.strip()):
            if buffer:
                units.append("\n".join(buffer).strip())
                buffer = []
            units.append(line.strip())
            continue

        if LIST_ITEM_PATTERN.match(line.strip()):
            if buffer:
                units.append("\n".join(buffer).strip())
                buffer = []
            units.append(line.strip())
            continue

        buffer.append(line)

    if buffer:
        units.append("\n".join(buffer).strip())

    return [unit for unit in units if unit]


def _split_large_unit(unit: str, max_tokens: int) -> list[str]:
    if _estimate_tokens(unit) <= max_tokens:
        return [unit]

    sentences = SENTENCE_SPLIT_PATTERN.split(unit)
    if len(sentences) <= 1:
        return _split_by_token_window(unit, max_tokens)

    chunks: list[str] = []
    current: list[str] = []
    current_tokens = 0
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        token_count = _estimate_tokens(sentence)
        if current and current_tokens + token_count > max_tokens:
            chunks.append(" ".join(current).strip())
            current = [sentence]
            current_tokens = token_count
        else:
            current.append(sentence)
            current_tokens += token_count
    if current:
        chunks.append(" ".join(current).strip())

    return chunks if chunks else _split_by_token_window(unit, max_tokens)


def _split_by_token_window(text: str, max_tokens: int) -> list[str]:
    tokens = TOKEN_PATTERN.findall(text)
    if not tokens:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(tokens):
        end = min(start + max_tokens, len(tokens))
        chunk = " ".join(tokens[start:end]).strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(tokens):
            break
        start = end
    return chunks


def prepare_note_text(title: str, content: str) -> str:
    parts: list[str] = []
    if title and title.strip():
        parts.append(title.strip())

    cleaned = clean_content(content or "")
    if cleaned:
        parts.append(cleaned)

    return "\n\n".join(parts)


def chunk_text(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    if not text:
        return []
    if chunk_size <= 0:
        raise ValueError("chunk_size must be > 0")
    if chunk_overlap < 0 or chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be >= 0 and < chunk_size")

    units = _split_to_units(text)
    chunks: list[str] = []
    current_units: list[str] = []
    current_tokens = 0

    for unit in units:
        unit_tokens = _estimate_tokens(unit)
        if unit_tokens > chunk_size:
            for split_unit in _split_large_unit(unit, chunk_size):
                split_tokens = _estimate_tokens(split_unit)
                if current_units and current_tokens + split_tokens > chunk_size:
                    chunks.append("\n".join(current_units).strip())
                    current_units, current_tokens = _apply_overlap(chunks[-1], chunk_overlap)
                current_units.append(split_unit)
                current_tokens += split_tokens
            continue

        if current_units and current_tokens + unit_tokens > chunk_size:
            chunks.append("\n".join(current_units).strip())
            current_units, current_tokens = _apply_overlap(chunks[-1], chunk_overlap)

        current_units.append(unit)
        current_tokens += unit_tokens

    if current_units:
        chunks.append("\n".join(current_units).strip())

    return [chunk for chunk in chunks if chunk]


def _apply_overlap(chunk: str, overlap_tokens: int) -> tuple[list[str], int]:
    if overlap_tokens <= 0 or not chunk:
        return [], 0

    tokens = TOKEN_PATTERN.findall(chunk)
    if not tokens:
        return [], 0

    overlap_tokens = min(overlap_tokens, len(tokens))
    overlap_text = " ".join(tokens[-overlap_tokens:]).strip()
    if not overlap_text:
        return [], 0

    return [overlap_text], _estimate_tokens(overlap_text)


def _keep_non_target_note_lines(file_path: Path, note_id: str) -> tuple[int, int]:
    if not file_path.exists():
        return 0, 0

    kept: list[str] = []
    removed = 0
    total = 0

    with file_path.open("r", encoding="utf-8") as f:
        for line in f:
            total += 1
            raw = line.strip()
            if not raw:
                continue
            try:
                item = json.loads(raw)
            except json.JSONDecodeError:
                kept.append(line)
                continue

            metadata = item.get("metadata") or {}
            if str(metadata.get("note_id") or "") == note_id:
                removed += 1
                continue
            kept.append(line)

    with file_path.open("w", encoding="utf-8") as f:
        f.writelines(kept)

    return total, removed


def purge_note_chunks(output_dir: Path, user_id: str, note_id: str) -> int:
    user_dir = output_dir / f"user_id={user_id}"
    if not user_dir.exists():
        return 0

    removed_total = 0
    for file_path in sorted(user_dir.glob("dt=*/chunks.jsonl")):
        _, removed = _keep_non_target_note_lines(file_path, note_id)
        if removed > 0:
            print(f"[DEBUG] Purged {removed} old chunks from {file_path}")
        removed_total += removed

    return removed_total


def write_chunks_for_note(
    output_dir: Path,
    note_id: str,
    user_id: str,
    status: str,
    content_type: str,
    updated_at: str,
    chunks: list[str],
) -> int:
    run_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    out_file = output_dir / f"user_id={user_id}" / f"dt={run_date}" / "chunks.jsonl"
    out_file.parent.mkdir(parents=True, exist_ok=True)

    written = 0
    total_chunks = len(chunks)
    with out_file.open("a", encoding="utf-8") as f:
        for idx, ch in enumerate(chunks):
            record = {
                "id": f"{note_id}:{idx}",
                "text": ch,
                "metadata": {
                    "note_id": note_id,
                    "user_id": user_id,
                    "chunk_index": idx,
                    "total_chunks": total_chunks,
                    "status": status,
                    "content_type": content_type,
                    "updated_at": updated_at,
                    "source": "note.save",
                },
            }
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
            written += 1

    return written


def chunk_note_event(note: dict[str, Any]) -> dict[str, Any]:
    settings = load_settings()

    note_id = str(note["note_id"])
    user_id = str(note["user_id"])
    title = str(note.get("title") or "")
    content = str(note.get("content") or "")
    status = str(note.get("status") or "")
    content_type = str(note.get("content_type") or "")
    updated_at = str(note.get("updated_at") or datetime.now(timezone.utc).isoformat())

    print("=" * 80)
    print("[START] Chunk note event")
    print(f"[DEBUG] note_id={note_id}")
    print(f"[DEBUG] user_id={user_id}")
    print(f"[DEBUG] chunk_size={settings.chunk_size}")
    print(f"[DEBUG] chunk_overlap={settings.chunk_overlap}")
    print(f"[DEBUG] output_dir={settings.output_dir}")

    removed = purge_note_chunks(settings.output_dir, user_id, note_id)

    prepared = prepare_note_text(title, content)
    if not prepared.strip():
        print(f"[DEBUG] Note {note_id} is empty after normalization. Removed={removed}, write=0")
        print("=" * 80)
        return {
            "note_id": note_id,
            "user_id": user_id,
            "removed": removed,
            "written": 0,
            "chunks": 0,
            "message": "empty note",
        }

    chunks = chunk_text(prepared, settings.chunk_size, settings.chunk_overlap)
    written = write_chunks_for_note(
        output_dir=settings.output_dir,
        note_id=note_id,
        user_id=user_id,
        status=status,
        content_type=content_type,
        updated_at=updated_at,
        chunks=chunks,
    )

    print(
        f"[DEBUG] note={note_id} text_len={len(prepared)} chunks={len(chunks)} "
        f"removed_old={removed} written={written}"
    )
    if chunks:
        sample = chunks[0][:200].replace("\n", " ")
        print(f"[DEBUG] sample_chunk={sample}...")

    print("[DONE] Chunk note event")
    print("=" * 80)

    return {
        "note_id": note_id,
        "user_id": user_id,
        "removed": removed,
        "written": written,
        "chunks": len(chunks),
    }


def _get_embed_url() -> str:
    return os.getenv("EMBED_URL", "https://vuttc-bge-m3-onnx.hf.space/embed")


def _normalize_embedding_vector(value: Any) -> list[float]:
    if not isinstance(value, list):
        return []

    vector: list[float] = []
    for item in value:
        if isinstance(item, (int, float)):
            vector.append(float(item))
    return vector


def embed_chunks_for_note(note: dict[str, Any]) -> dict[str, Any]:
    """Prepare, chunk and embed a note using external embedding service.

    Returns a dict with note_id, user_id and a list of chunks:
    {
        "note_id": str,
        "user_id": str,
        "chunks": [
            {"chunk_index": int, "text": str, "embedding": list[float]},
            ...
        ],
    }
    """

    settings = load_settings()

    note_id = str(note["note_id"])
    user_id = str(note["user_id"])
    title = str(note.get("title") or "")
    content = str(note.get("content") or "")

    print("=" * 80)
    print("[EMBED][START] Embed chunks for note")
    print(f"[EMBED][DEBUG] note_id={note_id}")
    print(f"[EMBED][DEBUG] user_id={user_id}")
    print(f"[EMBED][DEBUG] chunk_size={settings.chunk_size}")
    print(f"[EMBED][DEBUG] chunk_overlap={settings.chunk_overlap}")

    prepared = prepare_note_text(title, content)
    if not prepared.strip():
        print(f"[EMBED][DEBUG] Note {note_id} is empty after normalization. Skip embedding.")
        print("[EMBED][DONE]")
        print("=" * 80)
        return {
            "note_id": note_id,
            "user_id": user_id,
            "chunks": [],
        }

    chunks = chunk_text(prepared, settings.chunk_size, settings.chunk_overlap)
    print(f"[EMBED][DEBUG] prepared_len={len(prepared)} chunks={len(chunks)}")
    print(f"[CHUNK][DEBUG] Chunking {chunks}")

    if not chunks:
        print(f"[EMBED][DEBUG] No chunks produced for note {note_id}.")
        print("[EMBED][DONE]")
        print("=" * 80)
        return {
            "note_id": note_id,
            "user_id": user_id,
            "chunks": [],
        }

    embed_url = _get_embed_url()
    print(f"[EMBED][DEBUG] embed_url={embed_url}")

    try:
        resp = httpx.post(embed_url, json={"texts": chunks}, timeout=60.0)
        resp.raise_for_status()
    except Exception as exc:  # noqa: BLE001
        print(f"[EMBED][ERROR] Failed to call embed service: {exc}")
        print("[EMBED][DONE]")
        print("=" * 80)
        return {
            "note_id": note_id,
            "user_id": user_id,
            "chunks": [],
        }

    data = resp.json()
    embeddings = data.get("embeddings") or []
    print(f"[EMBED][DEBUG] Received {len(embeddings)} embeddings from service")
    
    if not isinstance(embeddings, list):
        print("[EMBED][ERROR] Invalid embeddings format from service")
        print("[EMBED][DONE]")
        print("=" * 80)
        return {
            "note_id": note_id,
            "user_id": user_id,
            "chunks": [],
        }

    if len(embeddings) != len(chunks):
        print(
            f"[EMBED][WARN] embeddings count ({len(embeddings)}) != chunks count ({len(chunks)}). "
            "Using min length for zipping.",
        )

    result_chunks: list[dict[str, Any]] = []
    invalid_embeddings = 0
    expected_dim = 0
    for idx, (text, emb) in enumerate(zip(chunks, embeddings)):
        vector = _normalize_embedding_vector(emb)
        if not vector:
            invalid_embeddings += 1
            continue

        if expected_dim == 0:
            expected_dim = len(vector)
        elif len(vector) != expected_dim:
            invalid_embeddings += 1
            continue

        result_chunks.append(
            {
                "chunk_index": idx,
                "text": text,
                "embedding": vector,
            }
        )

    print(f"[EMBED][DEBUG] embedded_chunks={len(result_chunks)}")
    if invalid_embeddings > 0:
        print(f"[EMBED][WARN] skipped_invalid_embeddings={invalid_embeddings}")
    if result_chunks:
        sample = result_chunks[0]["text"][:200].replace("\n", " ")
        print(f"[EMBED][DEBUG] sample_chunk={sample}...")

    print("[EMBED][DONE]")
    print("=" * 80)

    return {
        "note_id": note_id,
        "user_id": user_id,
        "chunks": result_chunks,
    }
