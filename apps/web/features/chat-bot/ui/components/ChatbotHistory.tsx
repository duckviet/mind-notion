import { MessageSquarePlus, Pencil, Trash2, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/shared/utils/cn";
import type { ChatbotConversation } from "../../model/use-chatbot";
import { MindNotionAi } from "@/shared/assets";

type ChatbotListViewProps = {
  conversations: ChatbotConversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  onNew: () => void;
  onSelect: (conversationId: string) => void;
  onRename: (conversationId: string, title: string) => void;
  onDelete: (conversationId: string) => void;
  onClose: () => void;
};

/**
 * Full-height list view — shown when no conversation is active.
 * Provides a master list of all conversations with actions.
 */
export function ChatbotListView({
  conversations,
  activeConversationId,
  isLoading,
  isStreaming,
  onNew,
  onSelect,
  onRename,
  onDelete,
  onClose,
}: ChatbotListViewProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border/60 shrink-0">
        <div className="flex aspect-square size-8 items-center justify-center rounded-md border border-sidebar-border/50">
          <MindNotionAi className="rounded-lg dark:text-white" />
        </div>
        <p className="text-sm font-semibold text-text-primary flex-1 min-w-0">
          Maind
        </p>
        <button
          type="button"
          onClick={onNew}
          disabled={isStreaming}
          className="w-8 h-8 rounded-full hover:bg-muted/70 transition-colors flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="New chat"
          title="New chat"
        >
          <MessageSquarePlus className="w-4 h-4 text-text-muted" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-muted/70 transition-colors flex items-center justify-center shrink-0"
          aria-label="Close chatbot"
          title="Close"
        >
          <X className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      {/* Body */}
      {conversations.length === 0 ? (
        /* Empty state — hero */
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="flex aspect-square size-14 items-center justify-center rounded-2xl bg-muted/60 border border-border/40">
            <Image
              src="/mind-notion-ai.svg"
              alt="Maind"
              width={36}
              height={36}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-2xl font-semibold text-text-primary leading-tight">
              What can I help with?
            </h3>
            <p className="text-sm text-text-muted">
              Start a conversation or pick an old one.
            </p>
          </div>
          <button
            type="button"
            onClick={onNew}
            disabled={isStreaming}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <MessageSquarePlus className="w-4 h-4" />
            New chat
          </button>
        </div>
      ) : (
        /* Conversation list */
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {isLoading && (
            <p className="px-2 py-1 text-xs text-text-muted">Loading…</p>
          )}
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;
            return (
              <div
                key={conversation.id}
                className={cn(
                  "group flex h-9 items-center gap-1 rounded-lg px-1 cursor-pointer",
                  isActive ? "bg-muted/80" : "hover:bg-muted/50",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  disabled={isStreaming}
                  className="min-w-0 flex-1 truncate px-2 text-left text-sm text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  title={conversation.title}
                >
                  {conversation.title}
                </button>

                <button
                  type="button"
                  title="Rename"
                  onClick={() => {
                    const title = window.prompt("Rename chat", conversation.title);
                    if (title !== null) onRename(conversation.id, title);
                  }}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-secondary opacity-0 hover:bg-background group-hover:opacity-100 transition-opacity"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  title="Delete"
                  onClick={() => {
                    if (window.confirm("Delete this chat?")) onDelete(conversation.id);
                  }}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-secondary opacity-0 hover:bg-background group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Keep old name exported for any existing imports
export { ChatbotListView as ChatbotHistory };
