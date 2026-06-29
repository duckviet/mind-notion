import { MessageSquarePlus, Pencil, Trash2 } from "lucide-react";

import { cn } from "@/shared/utils/cn";
import type { ChatbotConversation } from "../../model/use-chatbot";

type ChatbotHistoryProps = {
  conversations: ChatbotConversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  onNew: () => void;
  onSelect: (conversationId: string) => void;
  onRename: (conversationId: string, title: string) => void;
  onDelete: (conversationId: string) => void;
};

export function ChatbotHistory({
  conversations,
  activeConversationId,
  isLoading,
  isStreaming,
  onNew,
  onSelect,
  onRename,
  onDelete,
}: ChatbotHistoryProps) {
  return (
    <div className="border-b border-border/60 px-3 py-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          title="New chat"
          onClick={onNew}
          disabled={isStreaming}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 text-text-secondary hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1 text-xs font-medium uppercase tracking-normal text-text-secondary">
          Chats
        </div>
        {isLoading && (
          <div className="text-xs text-text-secondary">Loading</div>
        )}
      </div>

      {conversations.length > 0 && (
        <div className="mt-2 max-h-36 space-y-1 overflow-y-auto pr-1">
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;

            return (
              <div
                key={conversation.id}
                className={cn(
                  "group flex h-8 items-center gap-1 rounded-md px-1",
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
                  title="Rename chat"
                  onClick={() => {
                    const title = window.prompt(
                      "Rename chat",
                      conversation.title,
                    );
                    if (title !== null) onRename(conversation.id, title);
                  }}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-secondary opacity-0 hover:bg-background group-hover:opacity-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Delete chat"
                  onClick={() => {
                    if (window.confirm("Delete this chat?"))
                      onDelete(conversation.id);
                  }}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-secondary opacity-0 hover:bg-background group-hover:opacity-100"
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
