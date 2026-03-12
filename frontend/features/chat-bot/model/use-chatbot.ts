import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetNoteQueryKey,
  getListNotesQueryKey,
  getListNotesTOMQueryKey,
  provideAiRunConsent,
  type ReqCreateAIRun,
} from "@/shared/services/generated/api";
import { streamAiRun } from "@/shared/services/ai/stream-ai-run";

export type ChatbotDroppedNote = {
  id: string;
  title?: string | null;
  content?: string | null;
};

export type ChatbotDropPayload = {
  note: ChatbotDroppedNote;
  droppedAt: number;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type PinnedNote = {
  id: string;
  title: string;
  content: string;
  preview: string;
  droppedAt: number;
};

export type ChatbotPendingConsent = {
  toolName: string;
};

type UseChatbotParams = {
  droppedNotePayload?: ChatbotDropPayload | null;
};

const buildMessageWithPinnedNotes = (
  prompt: string,
  notes: PinnedNote[],
): string => {
  if (!notes.length) {
    return prompt;
  }

  const notesContext = notes
    .map((note, index) => {
      const content = note.content.trim();
      const clipped =
        content.length > 3000 ? `${content.slice(0, 3000)}...` : content;

      return [
        `Pinned note ${index + 1}: ${note.title}`,
        clipped ? `Content:\n${clipped}` : "Content: (empty)",
      ].join("\n");
    })
    .join("\n\n---\n\n");

  return [
    "Use the pinned notes below as context when relevant.",
    "",
    notesContext,
    "",
    "User prompt:",
    prompt,
  ].join("\n");
};

export function useChatbot({ droppedNotePayload }: UseChatbotParams) {
  const queryClient = useQueryClient();
  const [pinnedNotes, setPinnedNotes] = useState<PinnedNote[]>([]);
  const [activePinnedId, setActivePinnedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [pendingConsent, setPendingConsent] =
    useState<ChatbotPendingConsent | null>(null);
  const [isSubmittingConsent, setIsSubmittingConsent] = useState(false);
  const sessionIdRef = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}`,
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const consentResolverRef = useRef<((approved: boolean) => void) | null>(null);

  useEffect(() => {
    if (!droppedNotePayload) {
      return;
    }

    const title = (droppedNotePayload.note.title || "Untitled note").trim();
    const content = (droppedNotePayload.note.content || "").trim();
    const preview = content.slice(0, 240);

    setPinnedNotes((prev) => {
      const next = prev.filter(
        (item) => item.id !== droppedNotePayload.note.id,
      );
      next.push({
        id: droppedNotePayload.note.id,
        title,
        content,
        preview,
        droppedAt: droppedNotePayload.droppedAt,
      });
      return next;
    });

    setActivePinnedId(droppedNotePayload.note.id);
  }, [droppedNotePayload]);

  const activePinnedNote = useMemo(
    () => pinnedNotes.find((item) => item.id === activePinnedId) ?? null,
    [activePinnedId, pinnedNotes],
  );

  const handleRemovePinnedNote = (id: string) => {
    setPinnedNotes((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (activePinnedId === id) {
        setActivePinnedId(next.length ? next[next.length - 1].id : null);
      }
      return next;
    });
  };

  const handleClearPinnedNotes = () => {
    setPinnedNotes([]);
    setActivePinnedId(null);
  };

  const resolveConsentDecision = (approved: boolean) => {
    if (!consentResolverRef.current || isSubmittingConsent) {
      return;
    }

    const resolve = consentResolverRef.current;
    consentResolverRef.current = null;
    setIsSubmittingConsent(true);
    resolve(approved);
  };

  const handleApproveConsent = () => {
    resolveConsentDecision(true);
  };

  const handleDenyConsent = () => {
    resolveConsentDecision(false);
  };

  const handleSend = async (forcedPrompt?: string) => {
    const prompt = (forcedPrompt ?? inputValue).trim();
    if (!prompt || isStreaming) {
      return;
    }

    setInputValue("");
    setStreamError(null);

    const selectedNoteId = activePinnedNote?.id ?? pinnedNotes[0]?.id ?? "";
    const messageContent = buildMessageWithPinnedNotes(prompt, pinnedNotes);

    const userMessageId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `user-${Date.now()}`;
    const assistantMessageId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `assistant-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content: prompt },
      { id: assistantMessageId, role: "assistant", content: "" },
    ]);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);

    let currentRunId = "";
    let assistantHasContent = false;

    const payload: ReqCreateAIRun = {
      workspace_id: "default-workspace",
      session_id: sessionIdRef.current,
      note_id: selectedNoteId,
      // queryKeys:[""]
      message: {
        role: "user",
        content: messageContent,
      },
    };

    const refreshNotesData = async () => {
      const invalidations: Promise<void>[] = [
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListNotesTOMQueryKey() }),
        queryClient.invalidateQueries({
          queryKey: selectedNoteId
            ? ["collab-session", selectedNoteId]
            : ["collab-session"],
        }),
      ];

      if (selectedNoteId) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: getGetNoteQueryKey(selectedNoteId),
          }),
        );
      }

      await Promise.all(invalidations);
    };

    try {
      await streamAiRun(payload, {
        signal: controller.signal,
        onEvent: async ({ event, payload: eventPayload }) => {
          const payloadObj =
            eventPayload && typeof eventPayload === "object"
              ? (eventPayload as Record<string, unknown>)
              : {};

          const runIdFromEvent = payloadObj.run_id;
          if (typeof runIdFromEvent === "string") {
            currentRunId = runIdFromEvent;
          }

          if (event === "assistant.delta") {
            const delta = payloadObj.content;
            if (typeof delta === "string" && delta.length > 0) {
              assistantHasContent = true;
              setMessages((prev) =>
                prev.map((item) =>
                  item.id === assistantMessageId
                    ? { ...item, content: `${item.content}${delta}` }
                    : item,
                ),
              );
            }
            return;
          }

          if (event === "run.awaiting_consent") {
            const consentRaw = payloadObj.consent;
            const consentObj =
              consentRaw && typeof consentRaw === "object"
                ? (consentRaw as Record<string, unknown>)
                : {};

            const toolCallId = consentObj.tool_call_id;
            const toolName = consentObj.tool;

            if (
              !currentRunId ||
              typeof toolCallId !== "string" ||
              typeof toolName !== "string"
            ) {
              return;
            }

            if (consentResolverRef.current) {
              const resolvePrevious = consentResolverRef.current;
              consentResolverRef.current = null;
              resolvePrevious(false);
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
              await provideAiRunConsent(currentRunId, {
                tool_call_id: toolCallId,
                approved,
              });

              if (!approved) {
                setMessages((prev) =>
                  prev.map((item) =>
                    item.id === assistantMessageId && item.content.length === 0
                      ? {
                          ...item,
                          content:
                            "Permission denied. Tool execution was not approved.",
                        }
                      : item,
                  ),
                );
              }
            } finally {
              setPendingConsent(null);
              setIsSubmittingConsent(false);
            }

            return;
          }

          if (event === "tool.result") {
            const toolName = payloadObj.tool;
            const ok = payloadObj.ok;

            if (toolName === "notes.write" && ok === true) {
              await refreshNotesData();
            }

            return;
          }

          if (event === "run.failed") {
            const errorMessage =
              typeof payloadObj.message === "string" &&
              payloadObj.message.length > 0
                ? payloadObj.message
                : "AI run failed";

            if (!assistantHasContent) {
              setMessages((prev) =>
                prev.map((item) =>
                  item.id === assistantMessageId && item.content.length === 0
                    ? { ...item, content: errorMessage }
                    : item,
                ),
              );
            }

            throw new Error(errorMessage);
          }
        },
      });
    } catch (error) {
      const aborted =
        error instanceof DOMException && error.name === "AbortError";
      if (!aborted) {
        const message =
          error instanceof Error ? error.message : "Failed to stream AI run";
        setStreamError(message);
      }
    } finally {
      setIsStreaming(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }

      if (consentResolverRef.current) {
        const resolve = consentResolverRef.current;
        consentResolverRef.current = null;
        resolve(false);
      }

      setPendingConsent(null);
      setIsSubmittingConsent(false);
    }
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (consentResolverRef.current) {
        const resolve = consentResolverRef.current;
        consentResolverRef.current = null;
        resolve(false);
      }
    };
  }, []);

  return {
    pinnedNotes,
    activePinnedId,
    setActivePinnedId,
    activePinnedNote,
    messages,
    inputValue,
    setInputValue,
    isStreaming,
    streamError,
    pendingConsent,
    isSubmittingConsent,
    handleApproveConsent,
    handleDenyConsent,
    handleRemovePinnedNote,
    handleClearPinnedNotes,
    handleSend,
  };
}
