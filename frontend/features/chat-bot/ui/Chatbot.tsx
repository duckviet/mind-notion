"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  ChevronUp,
  FileText,
  Lightbulb,
  Mic,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DroppableZone } from "../../../shared/components/dnd";
import { useChatbot } from "../model/use-chatbot";
import type {
  ChatbotDropPayload,
  ChatbotDroppedNote,
} from "../model/use-chatbot";

export type { ChatbotDropPayload, ChatbotDroppedNote };

interface ChatbotProps {
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
  droppedNotePayload?: ChatbotDropPayload | null;
}

export default function Chatbot({
  isOpen = false,
  onToggle,
  className,
  droppedNotePayload,
}: ChatbotProps) {
  const quickPrompts = [
    "What's causing this error?",
    "Is contrast strong enough?",
  ];

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
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <AnimatePresence>
        {isOpen && (
          <DroppableZone
            id="chat-bot"
            activeClassName="ring-2 ring-yellow-300/20 ring-offset-1 ring-offset-green-300/20 rounded-md"
          >
            <motion.section
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mb-4 w-[360px] max-w-[calc(100vw-2rem)] h-[640px] rounded-[1rem] border border-border bg-background shadow-xl overflow-hidden"
            >
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="w-4 h-4 text-text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        Maind
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onToggle}
                    className="w-8 h-8 rounded-full hover:bg-muted/70 transition-colors flex items-center justify-center"
                    aria-label="Close chat"
                  >
                    <X className="w-4 h-4 text-text-primary" />
                  </button>
                </div>

                {pinnedNotes.length > 0 ? (
                  <div className="border-b border-border/60 px-2 py-2">
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {pinnedNotes.map((note) => {
                        const isActive = activePinnedId === note.id;

                        return (
                          <div
                            key={note.id}
                            className={cn(
                              "group shrink-0 flex items-center rounded-md text-xs border transition-colors",
                              isActive
                                ? "bg-muted border-border text-text-primary"
                                : "bg-background border-transparent text-text-muted hover:bg-muted/60",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => setActivePinnedId(note.id)}
                              className="flex items-center gap-1.5 px-2 py-1"
                              title={note.title}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="max-w-[140px] truncate">
                                {note.title}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePinnedNote(note.id)}
                              className="rounded-sm p-0.5 mr-1 hover:bg-muted"
                              aria-label={`Remove pinned note ${note.title}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={handleClearPinnedNotes}
                        className="shrink-0 ml-1 rounded-md px-2 py-1 text-xs text-text-muted hover:bg-muted/60"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full min-h-[120px] flex items-center justify-center text-center">
                      <h3 className="text-3xl leading-tight font-semibold text-text-primary max-w-[230px]">
                        What can I help with?
                      </h3>
                    </div>
                  ) : null}

                  {activePinnedNote ? (
                    <div className="rounded-2xl border border-border bg-muted/40 p-3">
                      <p className="text-xs text-text-muted mb-2">
                        Pinned note
                      </p>
                      <div className="rounded-xl border border-border bg-background px-3 py-2">
                        <p className="text-base font-semibold leading-snug line-clamp-2">
                          {activePinnedNote.title}
                        </p>
                        {activePinnedNote.preview ? (
                          <p className="text-sm text-text-muted mt-2 line-clamp-4 whitespace-pre-line">
                            {activePinnedNote.preview}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {messages.map((message) => {
                    const isUser = message.role === "user";
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isUser ? "justify-end" : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[82%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line",
                            isUser
                              ? "bg-muted text-text-primary"
                              : "bg-muted/60 text-text-primary",
                          )}
                        >
                          {message.content}
                        </div>
                      </div>
                    );
                  })}

                  {isStreaming ? (
                    <p className="text-xs text-text-muted">Thinking...</p>
                  ) : null}
                </div>

                <div className="px-4 pb-4 pt-2 border-t border-border/60 space-y-3">
                  <div className="flex gap-2 overflow-x-auto">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => {
                          void handleSend(prompt);
                        }}
                        disabled={isStreaming}
                        className="shrink-0 rounded-xl bg-muted px-3 py-2 text-xs text-text-primary hover:bg-muted/80 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {pendingConsent ? (
                    <div className="rounded-xl border border-border bg-muted/40 p-3">
                      <p className="text-xs text-text-muted">
                        Permission required
                      </p>
                      <p className="mt-1 text-sm text-text-primary">
                        AI wants to run{" "}
                        <span className="font-medium">
                          {pendingConsent.toolName}
                        </span>
                        .
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDenyConsent}
                          disabled={isSubmittingConsent}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-primary hover:bg-muted/70 disabled:opacity-60"
                        >
                          Deny
                        </button>
                        <button
                          type="button"
                          onClick={handleApproveConsent}
                          disabled={isSubmittingConsent}
                          className="rounded-lg bg-foreground px-3 py-1.5 text-xs text-background hover:opacity-90 disabled:opacity-60"
                        >
                          Approve
                        </button>
                        {isSubmittingConsent ? (
                          <span className="text-xs text-text-muted">
                            Submitting...
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {streamError ? (
                    <p className="text-xs text-red-500">{streamError}</p>
                  ) : null}

                  {!activePinnedNote ? (
                    <p className="text-xs text-text-muted">
                      Optionally drag notes into chat to add more context.
                    </p>
                  ) : null}

                  <div className="rounded-2xl border border-border bg-background px-3 py-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={inputValue}
                        onChange={(event) => setInputValue(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            void handleSend();
                          }
                        }}
                        placeholder="Ask anything"
                        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                      />
                      <div className="flex items-center gap-1 text-text-muted">
                        <button
                          type="button"
                          disabled
                          className="w-8 h-8 rounded-full hover:bg-muted/60 transition-colors flex items-center justify-center"
                          aria-label="Attach file"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled
                          className="w-8 h-8 rounded-full hover:bg-muted/60 transition-colors flex items-center justify-center"
                          aria-label="Voice input"
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void handleSend();
                          }}
                          disabled={
                            isStreaming || inputValue.trim().length === 0
                          }
                          className="w-8 h-8 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity flex items-center justify-center"
                          aria-label="Send message"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-center text-text-muted">
                    AI can make mistakes. Please double-check responses.
                  </p>
                </div>
              </div>
            </motion.section>
          </DroppableZone>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          className={cn(
            "ml-auto w-14 h-14 rounded-full",
            "glass-bg shadow-glass-lg border-glass-border",
            "flex items-center justify-center",
            "focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2",
            "transition-all duration-200 ease-out",
          )}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 8px 32px rgba(102, 126, 234, 0.25)",
          }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          aria-label={isOpen ? "Close chat" : "Open chat"}
          role="button"
          tabIndex={0}
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {isOpen ? (
              <ChevronUp className="w-6 h-6 text-text-primary" />
            ) : (
              <Lightbulb className="w-6 h-6 text-text-primary" />
            )}
          </motion.div>
        </motion.button>
      )}
    </div>
  );
}
