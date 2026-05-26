"""Structured run logger."""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


logger = logging.getLogger(__name__)

LOG_DIR = Path(__file__).resolve().parents[2] / "log"


@dataclass
class ToolCallEvent:
    tool_call_id: str
    tool_name: str
    arguments: dict[str, Any]
    result: str
    started_at: str
    finished_at: str | None = None
    duration_ms: int | None = None
    status: str = "pending"


@dataclass
class RunLog:
    run_id: str
    model: str
    started_at: str
    finished_at: str | None = None
    status: str = "running"
    error: str | None = None
    user_message: str = ""
    tool_calls: list[ToolCallEvent] = field(default_factory=list)
    token_usage: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)


class RunLogger:
    """Structured log for agent runs."""

    def __init__(self, log_dir: Path | None = None) -> None:
        self._log_dir = log_dir or LOG_DIR

    def log_llm_call(
        self,
        iteration: int,
        messages: list[dict[str, Any]],
        tokens: dict[str, int],
    ) -> None:
        logger.debug(
            "LLM call #%d — input_tokens=%d, output_tokens=%d",
            iteration,
            tokens.get("input", 0),
            tokens.get("output", 0),
        )

    def log_tool_call(
        self,
        tool: str,
        args: dict[str, Any],
        result: str,
        duration_ms: int,
    ) -> None:
        logger.info(
            "Tool call — tool=%s, duration_ms=%d, result_len=%d",
            tool,
            duration_ms,
            len(result),
        )

    def log_error(self, exc: Exception) -> None:
        logger.exception("Run error — %s: %s", type(exc).__name__, exc)

    def to_json(self, run_log: RunLog) -> dict[str, Any]:
        return asdict(run_log)


def _ensure_safe_filename(run_id: str) -> str:
    return "".join(c if c.isalnum() or c in "-_." else "_" for c in run_id).strip("._")


def write_run_log(run_log: RunLog) -> None:
    """Write run log to file."""
    safe_id = _ensure_safe_filename(run_log.run_id)
    log_path = LOG_DIR / f"run_log_{safe_id}.json"
    log_path.parent.mkdir(parents=True, exist_ok=True)

    payload = json.dumps(asdict(run_log), ensure_ascii=True, indent=2)
    log_path.write_text(payload, encoding="utf-8")
