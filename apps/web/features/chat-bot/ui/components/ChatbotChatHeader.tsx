import { ArrowLeft, MessageSquarePlus, X } from "lucide-react";

interface ChatbotChatHeaderProps {
  title: string;
  isStreaming: boolean;
  onBack: () => void;
  onNew: () => void;
  onClose: () => void;
}

export function ChatbotChatHeader({
  title,
  isStreaming,
  onBack,
  onNew,
  onClose,
}: ChatbotChatHeaderProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-3 border-b border-border/60 shrink-0">
      {/* Back to list */}
      <button
        type="button"
        onClick={onBack}
        className="w-8 h-8 rounded-full hover:bg-muted/70 transition-colors flex items-center justify-center shrink-0"
        aria-label="Back to conversations"
        title="Back"
      >
        <ArrowLeft className="w-4 h-4 text-text-muted" />
      </button>

      {/* Conversation title */}
      <p className="flex-1 min-w-0 text-sm font-medium text-text-primary truncate px-1">
        {title || "New chat"}
      </p>

      {/* New chat */}
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

      {/* Close sidebar */}
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
  );
}
