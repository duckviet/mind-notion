import { cn } from "@/lib/utils";

type ChatMessageItem = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type ActivePinnedNote = {
  title: string;
  preview: string;
} | null;

interface ChatbotMessagesProps {
  messages: ChatMessageItem[];
  activePinnedNote: ActivePinnedNote;
  isStreaming: boolean;
}

export function ChatbotMessages({
  messages,
  activePinnedNote,
  isStreaming,
}: ChatbotMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
      {messages.length === 0 ? (
        <div className="h-full min-h-[120px] flex items-center justify-center text-center">
          <h3 className="text-3xl leading-tight font-semibold text-text-primary max-w-[230px]">
            What can I help with?
          </h3>
        </div>
      ) : null}

      {messages.map((message) => {
        const isUser = message.role === "user";

        return (
          <div
            key={message.id}
            className={cn("flex", isUser ? "justify-end" : "justify-start")}
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
  );
}
