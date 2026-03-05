"use client";

import { cn } from "@/lib/utils";
import { DroppableZone } from "@/shared/components/dnd";
import { useChatbot } from "../model/use-chatbot";
import { ChatbotComposer } from "./components/ChatbotComposer";
import { ChatbotMessages } from "./components/ChatbotMessages";
import { ChatbotPinnedNotes } from "./components/ChatbotPinnedNotes";
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

export default function Chatbot({
  className,
  droppedNotePayload,
  droppableId = "chat-bot-sidebar",
}: ChatbotProps) {
  const {
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
  } = useChatbot({ droppedNotePayload });

  return (
    <div className={cn("h-full w-full", className)}>
      <DroppableZone
        id={droppableId}
        className="h-full"
        activeClassName="ring-2 ring-yellow-300/20 ring-offset-1 ring-offset-green-300/20 rounded-md"
      >
        <section className="h-full w-full bg-background overflow-hidden">
          <div className="h-full flex flex-col">
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
              quickPrompts={QUICK_PROMPTS}
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
        </section>
      </DroppableZone>
    </div>
  );
}
