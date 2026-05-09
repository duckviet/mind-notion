import type {
  AIAction,
  AISelectionContext,
} from "@/shared/components/RichTextEditor/Extensions/ExtAI/types";
import { streamAiRun } from "@/shared/services/ai/stream-ai-run";
import {
  inlineEditAi,
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

const buildInlineEditPayload = (
  payload: InlineEditRequest,
): ReqInlineEdit => {
  return {
    workspace_id: payload.workspaceId,
    note_id: payload.noteId ?? "",
    action: payload.action,
    selected_text: payload.selectedText,
    custom_prompt: payload.customPrompt ?? "",
    context_blocks: payload.context?.contextBlocks ?? [],
  };
};

const requestInlineEditFallback = async (
  payload: ReqInlineEdit,
): Promise<string> => {
  const data = (await inlineEditAi(payload)) as InlineEditResponse;
  return (data.text || "").trim();
};

/**
 * Request an inline edit from the AI service.
 * Supports streaming if onDelta callback is provided.
 * Prompt building logic now lives entirely on the backend for consistency.
 */
export async function requestInlineEdit(
  payload: InlineEditRequest,
  options?: RequestInlineEditOptions,
): Promise<{
  text: string;
  model?: string;
  usage?: {
    total_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}> {
  const inlineEditBody = buildInlineEditPayload(payload);
  let streamedText = "";
  let failedMessage = "";
  let modelName = "";
  let usage: any = undefined;

  try {
    // We use the specialized streaming endpoint for inline edits
    await streamAiRun(inlineEditBody, {
      url: "/ai/inline-edit/runs",
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

        if (event === "run.completed") {
          const model = payloadObj.model_name || payloadObj.model;
          if (typeof model === "string") {
            modelName = model;
          }
          if (payloadObj.usage) {
            usage = payloadObj.usage;
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
      return { text: normalized, model: modelName, usage };
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
    console.error(
      "Streaming inline edit failed, falling back to non-streamed:",
      error,
    );
  }

  // Fallback to non-streaming endpoint
  const text = await requestInlineEditFallback(inlineEditBody);
  return { text };
}
