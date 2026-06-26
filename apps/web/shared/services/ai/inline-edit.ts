import type { AIAction } from "@mind-notion/editor";
import Cookies from "js-cookie";

export type InlineEditAction = AIAction;

export type TokenUsage = {
  total_tokens?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
};

export type EditProposalResult = {
  type: "edit_proposal";
  operation: "replace" | "append" | "patch";
  target?: {
    note_id?: string;
    expected_version?: number;
    selection_id?: string;
  };
  original: string;
  proposed: string;
  summary: string;
  preserved?: string[];
  confidence?: number;
  model?: string;
  usage?: TokenUsage;
};

export type InlineTransformResult = {
  type: "inline_transform";
  replacement: string;
  target_language?: string;
  summary?: string;
  model?: string;
  usage?: TokenUsage;
  confidence?: number;
  metadata?: {
    model?: string;
    provider?: string;
    action?: string;
    runId?: string;
    summary?: string;
    original?: string;
  };
};

export type InlineAssistResult = {
  type: "inline_assist";
  explanation?: string;
  summary?: string;
  bullets?: string[];
  tasks?: string[];
  model?: string;
  usage?: TokenUsage;
};

export type RAGSource = {
  note_id: string;
  chunk_index: number;
  snippet: string;
  score: number;
};

export type RAGAnswerResult = {
  type: "rag_answer";
  answer: string;
  sources: RAGSource[];
  missing_context: boolean;
  confidence?: number;
  model?: string;
  usage?: TokenUsage;
};

export type AIActionResult =
  | string
  | EditProposalResult
  | InlineTransformResult
  | InlineAssistResult
  | RAGAnswerResult
  | {
      text: string;
      model?: string;
      usage?: TokenUsage;
    };

export type RequestInlineEditOptions = {
  workspaceId: string;
  noteId?: string;
  action: InlineEditAction;
  selectedText: string;
  customPrompt?: string;
  context?: unknown;
  expectedVersion?: number;
};

type StreamPayload = {
  event: string;
  data: Record<string, unknown>;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1").replace(/\/api\/v1\/?$/, "")
).replace(/\/$/, "");

function buildPayload(options: RequestInlineEditOptions): Record<string, unknown> {
  return {
    workspace_id: options.workspaceId,
    note_id: options.noteId ?? "",
    expected_version: options.expectedVersion ?? 0,
    action: options.action,
    command: actionToCommand(options.action),
    mode: actionToMode(options.action),
    selected_text: options.selectedText,
    custom_prompt: options.customPrompt ?? "",
    context_blocks: options.context ? [{ type: "editor_context", content: options.context }] : [],
    resource_context: {
      workspace_id: options.workspaceId,
      note_id: options.noteId ?? "",
      expected_version: options.expectedVersion ?? 0,
    },
  };
}

function actionToCommand(action: string): string {
  const normalized = action.startsWith("/") ? action : `/${action}`;
  if (normalized === "/shorter") return "/shorten";
  if (normalized === "/longer") return "/expand";
  return normalized;
}

function actionToMode(action: string): string {
  const command = actionToCommand(action);
  if (command === "/explain" || command === "/summarize") return "inline_assist";
  if (command === "/ask") return "current_note_qa";
  if (command === "/find") return "personal_knowledge_search";
  if (command === "/tasks") return "extract";
  return "inline_transform";
}

function normalizeResult(value: unknown, fallbackText: string): AIActionResult {
  if (typeof value === "string") {
    return value;
  }
  if (!value || typeof value !== "object") {
    return fallbackText;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.text === "string" && record.result === undefined) {
    return {
      text: record.text,
      model: typeof record.model === "string" ? record.model : undefined,
      usage: isUsage(record.usage) ? record.usage : undefined,
    };
  }

  const result = record.result ?? record;
  if (!result || typeof result !== "object") {
    return fallbackText;
  }

  const resObj = result as Record<string, unknown>;
  if (
    "type" in result &&
    resObj.type === "edit_proposal" &&
    typeof resObj.proposed === "string"
  ) {
    return {
      type: "inline_transform",
      replacement: resObj.proposed,
      confidence:
        typeof resObj.confidence === "number" ? resObj.confidence : undefined,
      metadata: {
        model: typeof record.model === "string" ? record.model : undefined,
        provider: typeof record.provider === "string" ? record.provider : undefined,
        action: typeof record.action === "string" ? record.action : undefined,
        runId: typeof record.run_id === "string" ? record.run_id : undefined,
        summary: typeof resObj.summary === "string" ? resObj.summary : undefined,
        original: typeof resObj.original === "string" ? resObj.original : undefined,
      },
    };
  }

  return result as AIActionResult;
}

function isUsage(value: unknown): value is TokenUsage {
  return Boolean(value && typeof value === "object");
}

function parseSSEChunk(buffer: string): { events: StreamPayload[]; rest: string } {
  const events: StreamPayload[] = [];
  const frames = buffer.split("\n\n");
  const rest = frames.pop() ?? "";

  for (const frame of frames) {
    const lines = frame.split("\n");
    const eventLine = lines.find((line) => line.startsWith("event:"));
    const dataLine = lines.find((line) => line.startsWith("data:"));
    if (!eventLine || !dataLine) continue;

    const event = eventLine.slice("event:".length).trim();
    const dataRaw = dataLine.slice("data:".length).trim();
    try {
      const data = JSON.parse(dataRaw) as Record<string, unknown>;
      events.push({ event, data });
    } catch {
      continue;
    }
  }

  return { events, rest };
}

async function requestStreamingInlineEdit(
  options: RequestInlineEditOptions,
): Promise<AIActionResult | null> {
  const token = Cookies.get("access_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/v1/ai/inline-edit/runs`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(buildPayload(options)),
  });
  if (!response.ok || !response.body) {
    return null;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let completed: unknown;
  let failedMessage = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSSEChunk(buffer);
    buffer = parsed.rest;
    for (const { event, data } of parsed.events) {
      if (event === "assistant.delta" && typeof data.content === "string") {
        text += data.content;
      }
      if (event === "run.completed") {
        completed = data.response ?? data.result ?? data;
      }
      if (event === "run.failed" && typeof data.message === "string") {
        failedMessage = data.message;
      }
    }
  }

  if (failedMessage) {
    throw new Error(failedMessage);
  }
  return normalizeResult(completed, text.trim());
}

async function requestInlineEditFallback(
  options: RequestInlineEditOptions,
): Promise<AIActionResult> {
  const token = Cookies.get("access_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/v1/ai/inline-edit`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(buildPayload(options)),
  });
  if (!response.ok) {
    throw new Error(`Inline edit failed with status ${response.status}`);
  }
  const data = (await response.json()) as unknown;
  return normalizeResult(data, "");
}

export async function requestInlineEdit(
  options: RequestInlineEditOptions,
): Promise<AIActionResult> {
  try {
    const streamed = await requestStreamingInlineEdit(options);
    if (streamed !== null) {
      return streamed;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    console.error("Streaming inline edit failed, falling back to non-streamed:", error);
  }
  return requestInlineEditFallback(options);
}
