from __future__ import annotations

import json
import os
from typing import Any

import httpx

from ..runtime_context import get_actor, get_run_id, get_tool_call_id
from .types import ToolSpec


def _embed_url() -> str:
	return os.getenv("EMBED_URL", "https://vuttc-bge-m3-onnx.hf.space/embed").strip()


def _backend_base_url() -> str:
	return os.getenv("BACKEND_INTERNAL_BASE_URL", "http://localhost:8080").rstrip("/")


def _backend_token() -> str:
	token = os.getenv("BACKEND_INTERNAL_TOKEN", "").strip()
	if token and not token.startswith("/"):
		return token

	for env_name in ("AI_SERVICE_TOKEN", "AI_INTERNAL_TOKEN"):
		fallback = os.getenv(env_name, "").strip()
		if fallback:
			return fallback

	return token


def _timeout_seconds() -> float:
	timeout_ms = os.getenv("BACKEND_TOOL_TIMEOUT_MS", "30000")
	try:
		return max(float(timeout_ms) / 1000.0, 1.0)
	except ValueError:
		return 30.0


def _normalize_embedding(value: Any) -> list[float]:
	if not isinstance(value, list):
		return []

	vector: list[float] = []
	for item in value:
		if isinstance(item, (int, float)):
			vector.append(float(item))
	return vector


async def embed_query(query: str) -> list[float]:
	payload = {"texts": [query]}
	timeout = httpx.Timeout(30.0)

	async with httpx.AsyncClient(timeout=timeout) as client:
		response = await client.post(_embed_url(), json=payload)
		response.raise_for_status()

	data = response.json()
	embeddings = data.get("embeddings") or []
	if not isinstance(embeddings, list) or not embeddings:
		raise ValueError("embed service returned empty embeddings")

	vector = _normalize_embedding(embeddings[0])
	if not vector:
		raise ValueError("query embedding is empty")
	return vector


async def retrieve_rag_chunks(
	*,
	user_id: str,
	embedding: list[float],
	top_k: int = 5,
	min_score: float = 0.2,
) -> list[dict[str, Any]]:
	run_id = get_run_id() or ""
	tool_call_id = get_tool_call_id() or ""
	actor = get_actor()

	payload = {
		"run_id": run_id,
		"tool_call_id": tool_call_id,
		"tool": "rag.search",
		"actor": {
			"user_id": user_id,
			"tenant_id": actor.get("tenant_id", ""),
			"workspace_id": actor.get("workspace_id", ""),
		},
		"input": {
			"embedding": embedding,
			"top_k": top_k,
			"min_score": min_score,
		},
	}

	headers = {"Content-Type": "application/json"}
	token = _backend_token()
	if token:
		headers["Authorization"] = f"Bearer {token}"

	url = f"{_backend_base_url()}/internal/v1/ai/tools/execute"
	timeout = httpx.Timeout(_timeout_seconds())

	async with httpx.AsyncClient(timeout=timeout) as client:
		response = await client.post(url, json=payload, headers=headers)

	if response.status_code >= 400:
		raise RuntimeError(
			f"rag.search failed status={response.status_code}, body={response.text}"
		)

	data = response.json()
	if not data.get("ok", False):
		error = data.get("error") or {}
		code = error.get("code", "TOOL_EXECUTION_FAILED")
		message = error.get("message", "unknown error")
		raise RuntimeError(f"rag.search error {code}: {message}")

	output = data.get("output")
	if isinstance(output, str):
		try:
			output = json.loads(output)
		except json.JSONDecodeError:
			output = {}

	chunks = (output or {}).get("chunks")
	if not isinstance(chunks, list):
		return []

	return [chunk for chunk in chunks if isinstance(chunk, dict)]


async def _rag_search(args: dict[str, Any]) -> str:
	query = str(args.get("query") or "").strip()
	if not query:
		return "Error INVALID_INPUT: query is required"

	top_k = args.get("top_k", 5)
	if not isinstance(top_k, int) or top_k <= 0:
		top_k = 5

	min_score = args.get("min_score", 0.2)
	if not isinstance(min_score, (int, float)):
		min_score = 0.2

	actor = get_actor()
	user_id = str(actor.get("user_id") or "").strip()
	if not user_id:
		return "Error INVALID_INPUT: actor.user_id is required"

	try:
		embedding = await embed_query(query)
		chunks = await retrieve_rag_chunks(
			user_id=user_id,
			embedding=embedding,
			top_k=top_k,
			min_score=float(min_score),
		)
	except Exception as exc:  # noqa: BLE001
		return f"Error RAG_SEARCH_FAILED: {exc}"

	return json.dumps(
		{
			"query": query,
			"top_k": top_k,
			"min_score": float(min_score),
			"total": len(chunks),
			"chunks": chunks,
		},
		ensure_ascii=False,
	)


rag_search = ToolSpec(
	name="rag.search",
	description=(
	'''
    Bạn là AI Assistant của ứng dụng ghi chú. Nguyên tắc cốt lõi: Bạn bị 'mất trí nhớ' hoàn toàn về dữ liệu cá nhân, lịch trình, dự án, code, hay bất kỳ ghi chú nào của người dùng. 
    BẤT CỨ KHI NÀO người dùng đưa ra yêu cầu thuộc 4 nhóm sau, bạn BẮT BUỘC phải dùng tool `rag.search` trước khi trả lời:
    1. Truy vấn thông tin cá nhân/sở hữu (Ví dụ: 'tài liệu của tôi', 'dự án A', 'hàm Python hôm qua').
    2. Truy vấn theo thời gian (Ví dụ: 'tuần trước', 'kế hoạch ngày mai', 'những gì đã xảy ra').
    3. Yêu cầu tóm tắt hoặc trích xuất từ dữ liệu người dùng (Ví dụ: 'tóm tắt meeting', 'tìm các ý tưởng').
    4. Những câu hỏi có đại từ chỉ định mập mờ mà bạn không có context (Ví dụ: 'nó', 'việc đó', 'người kia').
    Tuyệt đối không tự suy diễn hoặc bịa ra thông tin nếu chưa tra cứu.
	'''
	),
	input_schema={
		"type": "object",
		"properties": {
			"query": {
				"type": "string",
				"description": (	
                "Câu truy vấn đã được TỐI ƯU HÓA để tìm kiếm trong Vector Database."
                "LLM cần tự động viết lại câu hỏi của người dùng thành các cụm từ khóa mang đậm ngữ nghĩa."
                )
			},
			"top_k": {
				"type": "integer",
				"minimum": 1,
				"maximum": 20,
				"description": "Maximum number of chunks to return",
			},
			"min_score": {
				"type": "number",
				"minimum": 0,
				"maximum": 1,
				"description": "Minimum cosine similarity threshold",
			},
		},
		"required": ["query"],
		"additionalProperties": False,
	},
	execute=_rag_search,
)
