import type {
  AIAction,
  AISelectionContext,
} from "@/shared/components/RichTextEditor/Extensions/ExtAI/types";
import { streamAiRun } from "@/shared/services/ai/stream-ai-run";
import {
  inlineEditAi,
  type ReqCreateAIRun,
  type ReqInlineEdit,
} from "@/shared/services/generated/api";

export type InlineEditAction = AIAction;

type InlineEditRequest = {
  workspaceId: string;
  noteId?: string;
  action: InlineEditAction;
  selectedText: string;
  customPrompt?: string;
  context?: AISelectionContext;
};

type RequestInlineEditOptions = {
  signal?: AbortSignal;
  onDelta?: (deltaText: string, fullText: string) => void;
};

type InlineEditResponse = {
  text: string;
};

type InlineEditTransportPayload = {
  streamBody: ReqCreateAIRun;
  inlineEditBody: ReqInlineEdit;
};

const buildInlineEditPrompt = (payload: ReqInlineEdit): string => {
  const contextBlocks = payload.context_blocks ?? [];

  return [
    "You are an inline editor for a rich-text document.",
    "Return only the edited text. Do not include markdown fences, labels, or explanations.",
    "Do not call tools.",
    "",
    `Action: ${payload.action}`,
    payload.custom_prompt?.trim()
      ? `Custom instruction: ${payload.custom_prompt.trim()}`
      : "Custom instruction: (none)",
    "",
    "Selected text:",
    payload.selected_text,
    "",
    "Context blocks (JSON):",
    JSON.stringify(contextBlocks),
  ].join("\n");
};

const buildInlineEditPayload = (
  payload: InlineEditRequest,
): InlineEditTransportPayload => {
  const inlineEditBody: ReqInlineEdit = {
    workspace_id: payload.workspaceId,
    note_id: payload.noteId ?? "",
    action: payload.action,
    selected_text: payload.selectedText,
    custom_prompt: payload.customPrompt ?? "",
    context_blocks: payload.context?.contextBlocks ?? [],
  };

  const streamBody: ReqCreateAIRun = {
    workspace_id: inlineEditBody.workspace_id,
    session_id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `inline-${Date.now()}`,
    note_id: inlineEditBody.note_id ?? "",
    message: {
      role: "user",
      content: buildInlineEditPrompt(inlineEditBody),
    },
  };

  return {
    streamBody,
    inlineEditBody,
  };
};

const requestInlineEditFallback = async (
  payload: ReqInlineEdit,
): Promise<string> => {
  const data = (await inlineEditAi(payload)) as InlineEditResponse;

  return (data.text || "").trim();
};

export async function requestInlineEdit(
  payload: InlineEditRequest,
  options?: RequestInlineEditOptions,
): Promise<string> {
  const transportPayload = buildInlineEditPayload(payload);
  let streamedText = "";
  let failedMessage = "";

  try {
    await streamAiRun(transportPayload.streamBody, {
      signal: options?.signal,
      onEvent: ({ event, payload: eventPayload }) => {
        const payloadObj =
          eventPayload && typeof eventPayload === "object"
            ? (eventPayload as Record<string, unknown>)
            : {};

        if (event === "assistant.delta") {
          const delta = payloadObj.content;
          if (typeof delta === "string" && delta.length > 0) {
            streamedText += delta;
            options?.onDelta?.(delta, streamedText);
          }
          return;
        }

        if (event === "run.failed") {
          const message = payloadObj.message;
          if (typeof message === "string" && message.trim().length > 0) {
            failedMessage = message;
          }
        }
      },
    });

    const normalized = streamedText.trim();
    if (normalized.length > 0) {
      return normalized;
    }

    if (failedMessage) {
      throw new Error(failedMessage);
    }
  } catch (error) {
    const aborted =
      error instanceof DOMException && error.name === "AbortError";
    if (aborted) {
      throw error;
    }
  }

  return requestInlineEditFallback(transportPayload.inlineEditBody);
}
