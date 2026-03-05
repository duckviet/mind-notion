import { Mic, Paperclip, Send } from "lucide-react";
import type { ChatbotPendingConsent } from "../../model/use-chatbot";

interface ChatbotComposerProps {
  quickPrompts: string[];
  inputValue: string;
  setInputValue: (value: string) => void;
  isStreaming: boolean;
  streamError: string | null;
  pendingConsent: ChatbotPendingConsent | null;
  isSubmittingConsent: boolean;
  hasActivePinnedNote: boolean;
  onSend: (forcedPrompt?: string) => Promise<void>;
  onApproveConsent: () => void;
  onDenyConsent: () => void;
}

export function ChatbotComposer({
  quickPrompts,
  inputValue,
  setInputValue,
  isStreaming,
  streamError,
  pendingConsent,
  isSubmittingConsent,
  hasActivePinnedNote,
  onSend,
  onApproveConsent,
  onDenyConsent,
}: ChatbotComposerProps) {
  return (
    <div className="px-4 pb-4 pt-2 border-t border-border/60 space-y-3">
      <div className="flex gap-2 overflow-x-auto">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => {
              void onSend(prompt);
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
          <p className="text-xs text-text-muted">Permission required</p>
          <p className="mt-1 text-sm text-text-primary">
            AI wants to run{" "}
            <span className="font-medium">{pendingConsent.toolName}</span>.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onDenyConsent}
              disabled={isSubmittingConsent}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-primary hover:bg-muted/70 disabled:opacity-60"
            >
              Deny
            </button>
            <button
              type="button"
              onClick={onApproveConsent}
              disabled={isSubmittingConsent}
              className="rounded-lg bg-foreground px-3 py-1.5 text-xs text-background hover:opacity-90 disabled:opacity-60"
            >
              Approve
            </button>
            {isSubmittingConsent ? (
              <span className="text-xs text-text-muted">Submitting...</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {streamError ? (
        <p className="text-xs text-red-500">{streamError}</p>
      ) : null}

      {!hasActivePinnedNote ? (
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
                void onSend();
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
                void onSend();
              }}
              disabled={isStreaming || inputValue.trim().length === 0}
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
  );
}
