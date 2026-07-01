import { cn } from "@/shared/utils/cn";
import { markdownToHtml } from "@mind-notion/editor";
import { ToolCallBubble } from "./ToolCallBubble";
import type { ActivePinnedNote, ChatMessageItem } from "./types";
import { Copy, FileDown } from "lucide-react";
import { toast } from "sonner";
import { MindNotionAi } from "@/shared/assets";
import { prepareWithSegments, layoutWithLines } from "@chenglou/pretext";

interface ChatbotMessagesProps {
  messages: ChatMessageItem[];
  activePinnedNote: ActivePinnedNote;
  isStreaming: boolean;
  onInsertToNote?: (text: string) => void;
}

function PretextStreamingMessage({ content }: { content: string }) {
  // Compute fast, reflow-free layout for the streaming response
  const font = "14px ui-sans-serif, system-ui, -apple-system, sans-serif";
  const prepared = prepareWithSegments(content, font);
  // Calculate text lines wrapped at a typical chat bubble width
  const { lines } = layoutWithLines(prepared, 300, 20);

  return (
    <div className="select-text font-sans text-sm leading-relaxed text-text-primary space-y-0.5">
      {lines.map((line, idx) => (
        <div key={idx} className="whitespace-pre-wrap min-h-[20px] break-words">
          {line.text}
        </div>
      ))}
    </div>
  );
}

export function ChatbotMessages({
  messages,
  activePinnedNote: _activePinnedNote,
  isStreaming,
  onInsertToNote,
}: ChatbotMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
      {messages.length === 0 && (
        <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-center gap-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center select-none relative group transition-transform duration-300 hover:scale-105"
          >
            <MindNotionAi className="rounded-lg text-text-primary size-10" />
          </div>
          <h3 className="text-2xl leading-tight font-semibold text-text-primary max-w-[230px]">
            Hỏi Maind về ghi chú
          </h3>
        </div>
      )}

      {messages.map((message, index) => {
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
        const isLast = index === messages.length - 1;
        const showPretext = !isUser && isStreaming && isLast;

        return (
          <div
            key={message.id}
            className={cn("flex gap-3 items-start w-full", isUser ? "justify-end" : "justify-start")}
          >
            {!isUser && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 select-none"
              >
                <MindNotionAi className="rounded-lg dark:text-white size-6" />
              </div>
            )}
            <div className={cn("flex flex-col gap-1.5", isUser ? "max-w-[82%]" : "flex-1 max-w-[85%]")}>
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm transition-all duration-200",
                  isUser
                    ? "bg-surface-100/60 text-text-primary whitespace-pre-line"
                    : "bg-surface-50 border border-border/40 text-text-primary w-full shadow-sm shadow-black/[0.01]",
                )}
              >
                {isUser ? (
                  message.content
                ) : showPretext ? (
                  <PretextStreamingMessage content={message.content} />
                ) : (
                  <div
                    className="prose prose-sm max-w-none text-text-primary select-text"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }}
                  />
                )}
              </div>
              
              {/* Action Bar for AI answers */}
              {!isUser && (
                <div className="flex items-center gap-3 px-1">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(message.content);
                      toast.success("Copied to clipboard!");
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer select-none"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onInsertToNote?.(message.content)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer select-none"
                  >
                    <FileDown className="w-3 h-3" />
                    <span>Insert to note</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isStreaming && (
        <div className="flex gap-3 items-center">
          <MindNotionAi className="rounded-lg dark:text-white size-6" />
          <p className="text-xs text-text-muted">Thinking...</p>
        </div>
      )}
    </div>
  );
}
