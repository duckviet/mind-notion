from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field


def new_id() -> str:
    return str(uuid4())


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


class BaseContract(BaseModel):
    model_config = {"extra": "forbid"}


class Actor(BaseContract):
    user_id: str
    tenant_id: str = ""
    workspace_id: str = ""


class Quota(BaseContract):
    tokens_remaining: int = 0
    calls_today: int = 0
    tier: str = "free"


class Message(BaseContract):
    role: Literal["system", "user", "assistant", "tool"]
    content: str
    tool_call_id: str | None = None


class ResourceContext(BaseContract):
    note_id: str = ""
    note_version: int = 0


class RunPolicy(BaseContract):
    max_tool_calls: int = Field(default=5, ge=1, le=20)
    timeout_ms: int = Field(default=30_000, ge=1_000, le=180_000)
    redact_pii: bool = True
    max_tokens: int = Field(default=4096, ge=256)


class ToolConstraints(BaseContract):
    workspace_id: str = ""
    require_user_consent: bool = False


class AllowedTool(BaseContract):
    name: str
    constraints: ToolConstraints = Field(default_factory=ToolConstraints)


class AgentRunRequest(BaseContract):
    run_id: str = Field(default_factory=new_id)
    trace_id: str = Field(default_factory=new_id)
    actor: Actor
    conversation: list[Message]
    resource_context: ResourceContext = Field(default_factory=ResourceContext)
    allowed_tools: list[AllowedTool] = Field(default_factory=list)
    policy: RunPolicy = Field(default_factory=RunPolicy)
    quota: Quota = Field(default_factory=Quota)


class InlineEditPolicy(BaseContract):
    timeout_ms: int = Field(default=30_000, ge=1_000, le=60_000)
    max_tokens: int = Field(default=1_024, ge=128, le=32_768)


class AgentInlineEditRequest(BaseContract):
    run_id: str = Field(default_factory=new_id)
    trace_id: str = Field(default_factory=new_id)
    actor: Actor
    action: str
    command: str = ""
    mode: str = ""
    selected_text: str = Field(min_length=1)
    custom_prompt: str = ""
    context_blocks: list[dict[str, Any]] = Field(default_factory=list)
    resource_context: ResourceContext = Field(default_factory=ResourceContext)
    policy: InlineEditPolicy = Field(default_factory=InlineEditPolicy)


class EditTarget(BaseContract):
    note_id: str = ""
    expected_version: int | None = None
    selection_id: str | None = None


class EditProposal(BaseContract):
    type: Literal["edit_proposal"] = "edit_proposal"
    operation: Literal["replace", "append", "patch"] = "replace"
    target: EditTarget = Field(default_factory=EditTarget)
    original: str = Field(min_length=1)
    proposed: str = Field(min_length=1)
    summary: str = Field(min_length=1)
    preserved: list[str] = Field(default_factory=list)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class InlineTransformResult(BaseContract):
    type: Literal["inline_transform"] = "inline_transform"
    replacement: str = Field(min_length=1)
    target_language: str = ""
    summary: str = ""


class InlineAssistResult(BaseContract):
    type: Literal["inline_assist"] = "inline_assist"
    explanation: str = ""
    summary: str = ""
    bullets: list[str] = Field(default_factory=list)
    tasks: list[str] = Field(default_factory=list)


class RAGSource(BaseContract):
    note_id: str
    chunk_index: int = Field(ge=0)
    snippet: str = Field(min_length=1)
    score: float = Field(ge=0.0)


class RAGAnswer(BaseContract):
    type: Literal["rag_answer"] = "rag_answer"
    answer: str = Field(min_length=1)
    sources: list[RAGSource] = Field(default_factory=list)
    missing_context: bool = False
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


AIResult = EditProposal | InlineTransformResult | InlineAssistResult | RAGAnswer


class AgentInlineEditResponse(BaseContract):
    text: str = ""
    result: AIResult | None = None


class ConsentDecisionRequest(BaseContract):
    run_id: str
    tool_call_id: str
    approved: bool


class StreamEventBase(BaseContract):
    run_id: str
    event_id: str = Field(default_factory=new_id)
    created_at: str = Field(default_factory=now_utc)


class RunStartedEvent(StreamEventBase):
    type: Literal["run.started"] = "run.started"
    resume_token: str = Field(default_factory=new_id)


class DeltaEvent(StreamEventBase):
    type: Literal["assistant.delta"] = "assistant.delta"
    content: str


class ToolCallEvent(StreamEventBase):
    type: Literal["tool.call"] = "tool.call"
    tool_call_id: str
    tool: str


class ToolResultEvent(StreamEventBase):
    type: Literal["tool.result"] = "tool.result"
    tool_call_id: str
    tool: str
    ok: bool


class AwaitingConsentEvent(StreamEventBase):
    type: Literal["run.awaiting_consent"] = "run.awaiting_consent"
    consent: dict[str, Any]


class RunCompletedEvent(StreamEventBase):
    type: Literal["run.completed"] = "run.completed"
    usage: dict[str, Any]
    model_name: str | None = None
    result: AIResult | None = None


class RunFailedEvent(StreamEventBase):
    type: Literal["run.failed"] = "run.failed"
    code: str
    message: str
    retryable: bool = False
