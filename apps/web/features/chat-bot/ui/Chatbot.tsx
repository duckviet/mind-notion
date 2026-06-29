"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/utils/cn";
import { DroppableZone } from "@/shared/components/dnd";
import { useChatbot } from "../model/use-chatbot";
import { ChatbotChatHeader } from "./components/ChatbotChatHeader";
import { ChatbotListView } from "./components/ChatbotHistory";
import { ChatbotMessages } from "./components/ChatbotMessages";
import { ChatbotComposer } from "./components/ChatbotComposer";
import { ChatbotPinnedNotes } from "./components/ChatbotPinnedNotes";
import { useChatbotSidebarStore } from "../store/chatbot-sidebar.store";
import type {
  ChatbotDropPayload,
  ChatbotDroppedNote,
} from "../model/use-chatbot";

export type { ChatbotDropPayload, ChatbotDroppedNote };

interface ChatbotProps {
  className?: string;
  droppedNotePayload?: ChatbotDropPayload | null;
  droppableId?: string;
}

const QUICK_PROMPTS = [
  "What's causing this error?",
  "Is contrast strong enough?",
];

type View = "list" | "chat";

export default function Chatbot({
  className,
  droppedNotePayload,
  droppableId = "chat-bot-sidebar",
}: ChatbotProps) {
  const { setIsOpen } = useChatbotSidebarStore();
  const [view, setView] = useState<View>("list");
  const prevConversationIdRef = useRef<string | null>(null);

  const {
    pinnedNotes,
    activePinnedId,
    setActivePinnedId,
    activePinnedNote,
    conversations,
    activeConversationId,
    isLoadingConversations,
    messages,
    inputValue,
    setInputValue,
    isStreaming,
    streamError,
    pendingConsent,
    isSubmittingConsent,
    handleApproveConsent,
    handleDenyConsent,
    handleNewConversation,
    handleSelectConversation,
    handleRenameConversation,
    handleDeleteConversation,
    handleRemovePinnedNote,
    handleClearPinnedNotes,
    handleSend,
  } = useChatbot({ droppedNotePayload });

  // Auto-navigate to chat view when an existing conversation is selected
  useEffect(() => {
    if (
      activeConversationId !== null &&
      activeConversationId !== prevConversationIdRef.current
    ) {
      setView("chat");
    }
    prevConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // When a note is dropped into the sidebar, auto-navigate to chat view
  useEffect(() => {
    if (droppedNotePayload) {
      setView("chat");
    }
  }, [droppedNotePayload]);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );

  const handleSelectAndNavigate = (id: string) => {
    handleSelectConversation(id);
    // view will flip via the useEffect above
  };

  const handleNewAndNavigate = () => {
    handleNewConversation();
    // handleNewConversation sets activeConversationId → null (blank slate),
    // so we can't rely on the useEffect. Navigate directly.
    setView("chat");
  };

  return (
    <DroppableZone
      id={droppableId}
      className="h-full"
      activeClassName="ring-2 ring-yellow-300/20 ring-offset-1 ring-offset-green-300/20 rounded-md"
    >
      <div className={cn("h-full w-full overflow-hidden relative", className)}>
        {/* ── LIST VIEW ────────────────────────────────────── */}
        <div
          className={cn(
            "absolute inset-0 transition-transform duration-300 ease-in-out will-change-transform",
            view === "list" ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <ChatbotListView
            conversations={conversations}
            activeConversationId={activeConversationId}
            isLoading={isLoadingConversations}
            isStreaming={isStreaming}
            onNew={handleNewAndNavigate}
            onSelect={handleSelectAndNavigate}
            onRename={handleRenameConversation}
            onDelete={handleDeleteConversation}
            onClose={() => setIsOpen(false)}
          />
        </div>

        {/* ── CHAT VIEW ────────────────────────────────────── */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out will-change-transform",
            view === "chat" ? "translate-x-0" : "translate-x-full",
          )}
        >
          <ChatbotChatHeader
            title={activeConversation?.title ?? ""}
            isStreaming={isStreaming}
            onBack={() => setView("list")}
            onNew={handleNewAndNavigate}
            onClose={() => setIsOpen(false)}
          />

          <ChatbotPinnedNotes
            pinnedNotes={pinnedNotes}
            activePinnedId={activePinnedId}
            onSelect={setActivePinnedId}
            onRemove={handleRemovePinnedNote}
            onClear={handleClearPinnedNotes}
          />

          <ChatbotMessages
            messages={messages}
            activePinnedNote={activePinnedNote}
            isStreaming={isStreaming}
          />

          <ChatbotComposer
            quickPrompts={messages.length > 0 ? [] : QUICK_PROMPTS}
            inputValue={inputValue}
            setInputValue={setInputValue}
            isStreaming={isStreaming}
            streamError={streamError}
            pendingConsent={pendingConsent}
            isSubmittingConsent={isSubmittingConsent}
            hasActivePinnedNote={Boolean(activePinnedNote)}
            onSend={handleSend}
            onApproveConsent={handleApproveConsent}
            onDenyConsent={handleDenyConsent}
          />
        </div>
      </div>
    </DroppableZone>
  );
}
