import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { provideAiRunConsent, type ReqCreateAIRun } from "@/shared/services/generated/api";
import { streamAiRun } from "@/shared/services/ai/stream-ai-run";
import {
  invalidateNoteDetail,
  invalidateNoteLists,
  invalidateTopOfMindNotes,
} from "@/shared/hooks/query-invalidations";

import type { ChatMessage, ChatbotPendingConsent } from "./chatbot-types";
import { usePinnedNotes } from "./use-pinned-notes";
import { buildMessageWithPinnedNotes, newId } from "./stream-helpers";

export type { ChatbotDropPayload, ChatbotDroppedNote, ChatbotPendingConsent } from "./chatbot-types";

type UseChatbotParams = {
  droppedNotePayload?: import("./chatbot-types").ChatbotDropPayload | null;
};

export function useChatbot({ droppedNotePayload }: UseChatbotParams) {
  const queryClient = useQueryClient();

  // ── Sub-hooks ──────────────────────────────────────────────────────────────
  const pinned = usePinnedNotes({ droppedNotePayload });

  // ── Messaging state ────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // ── Consent state ──────────────────────────────────────────────────────────
  const [pendingConsent, setPendingConsent] = useState<ChatbotPendingConsent | null>(null);
  const [isSubmittingConsent, setIsSubmittingConsent] = useState(false);
  const consentResolverRef = useRef<((approved: boolean) => void) | null>(null);

  const resolveConsent = (approved: boolean) => {
    if (!consentResolverRef.current || isSubmittingConsent) return;
    const resolve = consentResolverRef.current;
    consentResolverRef.current = null;
    setIsSubmittingConsent(true);
    resolve(approved);
  };

  // ── Refs ────────────────────────────────────────────────────────────────────
  const sessionIdRef = useRef(newId("session"));
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Send ────────────────────────────────────────────────────────────────────

  const handleSend = async (forcedPrompt?: string) => {
    const prompt = (forcedPrompt ?? inputValue).trim();
    if (!prompt || isStreaming) return;

    setInputValue("");
    setStreamError(null);

    const selectedNoteId = pinned.activePinnedNote?.id ?? pinned.pinnedNotes[0]?.id ?? "";
    const userMessageId = newId("user");

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content: prompt },
    ]);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);

    const payload: ReqCreateAIRun = {
      workspace_id: "default-workspace",
      session_id: sessionIdRef.current,
      note_id: selectedNoteId,
      message: { role: "user", content: buildMessageWithPinnedNotes(prompt, pinned.pinnedNotes) },
    };

    const refreshNotes = async () => {
      const tasks: Promise<void>[] = [
        invalidateNoteLists(queryClient),
        invalidateTopOfMindNotes(queryClient),
        queryClient.invalidateQueries({
          queryKey: selectedNoteId ? ["collab-session", selectedNoteId] : ["collab-session"],
        }),
      ];
      if (selectedNoteId) tasks.push(invalidateNoteDetail(queryClient, selectedNoteId));
      await Promise.all(tasks);
    };

    let currentRunId = "";
    let assistantHasContent = false;

    try {
      await streamAiRun(payload, {
        signal: controller.signal,
        onEvent: async ({ event, payload: raw }) => {
          const p = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
          if (typeof p.run_id === "string") currentRunId = p.run_id;

          switch (event) {
            case "tool.call": {
              const { tool_call_id: callId, tool: toolName } = p;
              if (typeof callId === "string" && typeof toolName === "string") {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === callId)) return prev;
                  return [
                    ...prev,
                    {
                      id: callId,
                      role: "tool",
                      content: "",
                      toolName,
                      toolStatus: "running",
                    },
                  ];
                });
              }
              return;
            }

            case "assistant.delta": {
              const delta = p.content;
              if (typeof delta === "string" && delta.length > 0) {
                assistantHasContent = true;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last && last.role === "assistant") {
                    return prev.map((m, idx) =>
                      idx === prev.length - 1 ? { ...m, content: `${m.content}${delta}` } : m,
                    );
                  } else {
                    return [
                      ...prev,
                      { id: newId("assistant"), role: "assistant", content: delta },
                    ];
                  }
                });
              }
              return;
            }

            case "run.awaiting_consent": {
              const consent = p.consent && typeof p.consent === "object"
                ? (p.consent as Record<string, unknown>)
                : {};
              const { tool_call_id: callId, tool: toolName } = consent;
              if (!currentRunId || typeof callId !== "string" || typeof toolName !== "string") return;

              // Dismiss any stale consent
              if (consentResolverRef.current) {
                consentResolverRef.current(false);
                consentResolverRef.current = null;
              }

              setIsSubmittingConsent(false);
              setPendingConsent({ toolName });

              const approved = await new Promise<boolean>((resolve) => {
                consentResolverRef.current = resolve;
              });

              if (controller.signal.aborted) {
                setPendingConsent(null);
                setIsSubmittingConsent(false);
                return;
              }

              try {
                await provideAiRunConsent(currentRunId, { tool_call_id: callId, approved });
                if (!approved) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: newId("assistant"),
                      role: "assistant",
                      content: "Permission denied. Tool execution was not approved.",
                    },
                  ]);
                }
              } finally {
                setPendingConsent(null);
                setIsSubmittingConsent(false);
              }
              return;
            }

            case "tool.result": {
              const { tool_call_id: callId, tool: toolName, ok } = p;
              if (typeof callId === "string") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === callId ? { ...m, toolStatus: ok === true ? "done" : "error" } : m,
                  ),
                );
              }
              if (toolName === "notes.write" && ok === true) await refreshNotes();
              return;
            }

            case "run.failed": {
              const errorMessage =
                typeof p.message === "string" && p.message.length > 0 ? p.message : "AI run failed";
              if (!assistantHasContent) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: newId("assistant"),
                    role: "assistant",
                    content: errorMessage,
                  },
                ]);
              }
              throw new Error(errorMessage);
            }
          }
        },
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setStreamError(error instanceof Error ? error.message : "Failed to stream AI run");
      }
    } finally {
      setIsStreaming(false);
      if (abortControllerRef.current === controller) abortControllerRef.current = null;
      if (consentResolverRef.current) {
        consentResolverRef.current(false);
        consentResolverRef.current = null;
      }
      setPendingConsent(null);
      setIsSubmittingConsent(false);
    }
  };

  // ── Cleanup on unmount ─────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (consentResolverRef.current) {
        consentResolverRef.current(false);
        consentResolverRef.current = null;
      }
    };
  }, []);

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    // Pinned notes (delegated)
    ...pinned,
    // Messages
    messages,
    inputValue,
    setInputValue,
    isStreaming,
    streamError,
    // Consent
    pendingConsent,
    isSubmittingConsent,
    handleApproveConsent: () => resolveConsent(true),
    handleDenyConsent: () => resolveConsent(false),
    // Actions
    handleSend,
  };
}
