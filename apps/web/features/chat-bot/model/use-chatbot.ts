import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  deleteAiConversation,
  getAiConversation,
  getNote,
  listAiConversations,
  provideAiRunConsent,
  updateAiConversation,
  type ListNotes200,
  type ReqCreateAIRun,
} from "@/shared/services/generated/api";
import { streamAiRun } from "@/shared/services/ai/stream-ai-run";
import {
  invalidateCollabSession,
  invalidateNoteDetail,
  invalidateNoteLists,
  invalidateTopOfMindNotes,
} from "@/shared/hooks/query-invalidations";
import { notesKeys } from "@/shared/hooks/query-keys";

import type { ChatMessage, ChatbotPendingConsent } from "./chatbot-types";
import { usePinnedNotes } from "./use-pinned-notes";
import { buildMessageWithPinnedNotes, newId } from "./stream-helpers";

export type {
  ChatbotDropPayload,
  ChatbotDroppedNote,
  ChatbotPendingConsent,
} from "./chatbot-types";

type UseChatbotParams = {
  droppedNotePayload?: import("./chatbot-types").ChatbotDropPayload | null;
};

export type ChatbotConversation = {
  id: string;
  title: string;
  lastMessageAt: string;
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
  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  // ── Consent state ──────────────────────────────────────────────────────────
  const [pendingConsent, setPendingConsent] =
    useState<ChatbotPendingConsent | null>(null);
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

  const refreshConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const response = await listAiConversations();
      const items = Array.isArray(response.items) ? response.items : [];
      setConversations(
        items
          .filter((item) => item.id && item.title)
          .map((item) => ({
            id: item.id,
            title: item.title,
            lastMessageAt: item.last_message_at ?? item.created_at ?? "",
          })),
      );
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  const handleNewConversation = () => {
    abortControllerRef.current?.abort();
    setActiveConversationId(null);
    setMessages([]);
    setStreamError(null);
    setInputValue("");
  };

  const handleSelectConversation = async (conversationId: string) => {
    if (isStreaming || conversationId === activeConversationId) return;

    setIsLoadingConversation(true);
    setStreamError(null);
    try {
      const response = await getAiConversation(conversationId);
      const restoredMessages = (response.messages ?? [])
        .filter(
          (message) => message.role === "user" || message.role === "assistant",
        )
        .map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
        }));
      setMessages(restoredMessages);
      setActiveConversationId(response.conversation.id);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const handleRenameConversation = async (
    conversationId: string,
    title: string,
  ) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const updated = await updateAiConversation(conversationId, {
      title: trimmedTitle,
    });
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              title: updated.title,
              lastMessageAt:
                updated.last_message_at ?? conversation.lastMessageAt,
            }
          : conversation,
      ),
    );
  };

  const handleDeleteConversation = async (conversationId: string) => {
    await deleteAiConversation(conversationId);
    setConversations((prev) =>
      prev.filter((conversation) => conversation.id !== conversationId),
    );
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  // ── Send ────────────────────────────────────────────────────────────────────

  const handleSend = async (forcedPrompt?: string) => {
    const prompt = (forcedPrompt ?? inputValue).trim();
    if (!prompt || isStreaming) return;

    setInputValue("");
    setStreamError(null);

    const selectedNoteId =
      pinned.activePinnedNote?.id ?? pinned.pinnedNotes[0]?.id ?? "";
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
      conversation_id: activeConversationId ?? undefined,
      display_user_message: prompt,
      message: {
        role: "user",
        content: buildMessageWithPinnedNotes(prompt, pinned.pinnedNotes),
      },
    };

    const refreshNotes = async () => {
      const tasks: Promise<void>[] = [
        invalidateNoteLists(queryClient),
        invalidateTopOfMindNotes(queryClient),
      ];
      if (selectedNoteId) {
        tasks.push(invalidateNoteDetail(queryClient, selectedNoteId));
        tasks.push(invalidateCollabSession(queryClient, selectedNoteId));
      } else {
        tasks.push(
          queryClient.invalidateQueries({ queryKey: ["collab-session"] }),
        );
      }
      await Promise.all(tasks);
    };

    let currentRunId = "";
    let assistantHasContent = false;

    try {
      await streamAiRun(payload, {
        signal: controller.signal,
        onEvent: async ({ event, payload: raw }) => {
          const p =
            raw && typeof raw === "object"
              ? (raw as Record<string, unknown>)
              : {};
          if (typeof p.run_id === "string") currentRunId = p.run_id;

          switch (event) {
            case "conversation.created": {
              const conversationId = p.conversation_id;
              const title = p.title;
              const created = p.created === true;
              if (
                typeof conversationId === "string" &&
                conversationId.length > 0
              ) {
                setActiveConversationId(conversationId);
                setConversations((prev) => {
                  const existing = prev.find(
                    (conversation) => conversation.id === conversationId,
                  );
                  if (existing) return prev;
                  return [
                    {
                      id: conversationId,
                      title:
                        typeof title === "string" && title.length > 0
                          ? title
                          : prompt,
                      lastMessageAt: new Date().toISOString(),
                    },
                    ...prev,
                  ];
                });
                if (created) void refreshConversations();
              }
              return;
            }

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
                      idx === prev.length - 1
                        ? { ...m, content: `${m.content}${delta}` }
                        : m,
                    );
                  } else {
                    return [
                      ...prev,
                      {
                        id: newId("assistant"),
                        role: "assistant",
                        content: delta,
                      },
                    ];
                  }
                });
              }
              return;
            }

            case "run.awaiting_consent": {
              const consent =
                p.consent && typeof p.consent === "object"
                  ? (p.consent as Record<string, unknown>)
                  : {};
              const { tool_call_id: callId, tool: toolName } = consent;
              if (
                !currentRunId ||
                typeof callId !== "string" ||
                typeof toolName !== "string"
              )
                return;

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
                await provideAiRunConsent(currentRunId, {
                  tool_call_id: callId,
                  approved,
                });
                if (!approved) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: newId("assistant"),
                      role: "assistant",
                      content:
                        "Permission denied. Tool execution was not approved.",
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
                    m.id === callId
                      ? { ...m, toolStatus: ok === true ? "done" : "error" }
                      : m,
                  ),
                );
              }
              if (toolName === "notes.write" && ok === true) {
                await refreshNotes();
                // Optimistic update: proactively fetch updated note and set in
                // list + detail caches so the list page and note detail show fresh
                // content immediately without waiting for background refetch.
                if (selectedNoteId) {
                  getNote(selectedNoteId).then((updatedNote) => {
                    queryClient.setQueryData(
                      notesKeys.detail(selectedNoteId),
                      updatedNote,
                    );
                    queryClient.setQueriesData<ListNotes200>(
                      { queryKey: notesKeys.lists() },
                      (oldData) => {
                        if (!oldData?.notes) return oldData;
                        return {
                          ...oldData,
                          notes: oldData.notes.map((n) =>
                            n.id === selectedNoteId
                              ? { ...n, ...updatedNote }
                              : n,
                          ),
                        };
                      },
                    );
                  }).catch(() => {
                    // Fetch failed — leave invalidation to refetch on next access
                  });
                }
              }
              return;
            }

            case "run.failed": {
              const errorMessage =
                typeof p.message === "string" && p.message.length > 0
                  ? p.message
                  : "AI run failed";
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
        setStreamError(
          error instanceof Error ? error.message : "Failed to stream AI run",
        );
      }
    } finally {
      setIsStreaming(false);
      void refreshConversations();
      if (abortControllerRef.current === controller)
        abortControllerRef.current = null;
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
    conversations,
    activeConversationId,
    isLoadingConversations,
    isLoadingConversation,
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
    handleNewConversation,
    handleSelectConversation,
    handleRenameConversation,
    handleDeleteConversation,
    handleSend,
  };
}
