import { Mic, Paperclip, Send, FileText, Folder } from "lucide-react";
import type { ChatbotPendingConsent } from "../../model/use-chatbot";
import { useState, useMemo } from "react";
import { useFolders } from "@/shared/hooks/useFolders";
import { useNotes } from "@/shared/hooks/useNotes";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";

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
  onPinNote?: (note: { id: string; title: string; content?: string; type?: "note" | "folder" }) => void;
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
  onPinNote,
}: ChatbotComposerProps) {
  // Query notes and folders for autocomplete list
  const { folders } = useFolders({ limit: 200, offset: 0 });
  const { notes } = useNotes({ limit: 200, offset: 0, folder_id: "" });

  // Autocomplete state
  const [showMention, setShowMention] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const autocompleteItems = useMemo(() => {
    const noteItems = (notes || []).map((n) => ({
      id: n.id,
      title: n.title || "Untitled Note",
      type: "note" as const,
      content: n.content || "",
    }));
    const folderItems = (folders || []).map((f) => ({
      id: f.id,
      title: f.name || "Untitled Folder",
      type: "folder" as const,
      content: "",
    }));
    return [...noteItems, ...folderItems];
  }, [notes, folders]);

  const filteredItems = useMemo(() => {
    if (!showMention) return [];
    const filter = mentionFilter.toLowerCase().trim();
    return autocompleteItems.filter((item) => item.title.toLowerCase().includes(filter));
  }, [showMention, mentionFilter, autocompleteItems]);

  const handleInputChange = (val: string) => {
    setInputValue(val);

    // Detect if '@' is typed
    const lastAtIdx = val.lastIndexOf("@");
    if (lastAtIdx !== -1) {
      if (lastAtIdx === 0 || val[lastAtIdx - 1] === " ") {
        const afterAt = val.slice(lastAtIdx + 1);
        if (!afterAt.includes(" ")) {
          setMentionFilter(afterAt);
          setMentionIndex(lastAtIdx);
          setShowMention(true);
          setHighlightedIndex(0);
          return;
        }
      }
    }
    setShowMention(false);
  };

  const handleSelectItem = (item: typeof autocompleteItems[number]) => {
    if (!onPinNote) return;

    // Pin/Attach the item (note or folder)
    onPinNote({
      id: item.id,
      title: item.title,
      content: item.content,
      type: item.type,
    });

    // Remove the '@mention' search term from the input value
    const prefix = inputValue.slice(0, mentionIndex);
    setInputValue(prefix);
    setShowMention(false);
    toast.success(`Đã đính kèm ${item.type === "folder" ? "thư mục" : "ghi chú"}: ${item.title}`);
  };

  return (
    <div className="px-4 pb-4 pt-2 border-t border-border/60 space-y-3 bg-transparent">
      {quickPrompts.length > 0 && (
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
      )}

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

      <div className="rounded-xl border border-border px-3 py-1 relative bg-surface-50/50">
        {/* Mentions dropdown list */}
        {showMention && filteredItems.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-2 border border-border/80 bg-surface-elevated rounded-lg shadow-lg z-50 overflow-hidden max-h-56 overflow-y-auto">
            <div className="py-1">
              {filteredItems.map((item, idx) => {
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs transition-colors cursor-pointer select-none",
                      isHighlighted ? "bg-muted text-text-primary" : "text-text-secondary"
                    )}
                  >
                    {item.type === "folder" ? (
                      <Folder className="w-3.5 h-3.5 shrink-0 text-text-muted text-[#8b5cf6]" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 shrink-0 text-text-muted text-[#3b82f6]" />
                    )}
                    <span className="truncate font-medium">{item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            value={inputValue}
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (showMention && filteredItems.length > 0) {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setHighlightedIndex((prev) => (prev + 1) % filteredItems.length);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setHighlightedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  handleSelectItem(filteredItems[highlightedIndex]);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  setShowMention(false);
                }
              } else {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void onSend();
                }
              }
            }}
            placeholder="Ask anything, @ to mention, / for actions"
            className="flex-1 text-sm placeholder:text-xs text-text-primary placeholder:text-text-muted outline-none bg-transparent"
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
              className="w-8 h-8 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity flex items-center justify-center cursor-pointer"
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
