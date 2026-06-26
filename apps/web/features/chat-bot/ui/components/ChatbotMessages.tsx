import { cn } from "@/shared/utils/cn";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
import { markdownToHtml } from "@mind-notion/editor";
import { ToolCallBubble } from "./ToolCallBubble";
import type { ActivePinnedNote, ChatMessageItem } from "./types";

interface ChatbotMessagesProps {
  messages: ChatMessageItem[];
  activePinnedNote: ActivePinnedNote;
  isStreaming: boolean;
}

export function ChatbotMessages({
  messages,
  activePinnedNote: _activePinnedNote,
  isStreaming,
}: ChatbotMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
      {messages.length === 0 && (
        <div className="h-full min-h-[120px] flex items-center justify-center text-center">
          <h3 className="text-3xl leading-tight font-semibold text-text-primary max-w-[230px]">
            What can I help with?
          </h3>
        </div>
      )}

      {messages.map((message) => {
        if (message.role === "tool") {
          return (
            <ToolCallBubble
              key={message.id}
              id={message.id}
              toolName={message.toolName}
              toolStatus={message.toolStatus}
            />
          );
        }

        const isUser = message.role === "user";

        return (
          <div
            key={message.id}
            className={cn("flex", isUser ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[82%] rounded-2xl px-4 py-3 text-sm",
                isUser
                  ? "bg-surface-100/60 text-text-primary whitespace-pre-line"
                  : "bg-surface-100 text-text-primary w-full max-w-[85%]",
              )}
            >
              {isUser ? (
                message.content
              ) : (
                <RichTextEditor
                  content={markdownToHtml(message.content)}
                  editable={false}
                  toolbar={false}
                  editorAreaClassName="px-0 gap-0"
                  editorReadonlyClassName="min-h-0 pointer-events-none select-text cursor-default pr-0"
                  className="p-0 border-0 bg-transparent min-h-0 text-text-primary"
                />
              )}
            </div>
          </div>
        );
      })}

      {isStreaming && (
        <p className="text-xs text-text-muted">Thinking...</p>
      )}
    </div>
  );
}
