import { FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PinnedNoteItem = {
  id: string;
  title: string;
};

interface ChatbotPinnedNotesProps {
  pinnedNotes: PinnedNoteItem[];
  activePinnedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function ChatbotPinnedNotes({
  pinnedNotes,
  activePinnedId,
  onSelect,
  onRemove,
  onClear,
}: ChatbotPinnedNotesProps) {
  if (pinnedNotes.length === 0) {
    return null;
  }

  return (
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
                onClick={() => onSelect(note.id)}
                className="flex items-center gap-1.5 px-2 py-1"
                title={note.title}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="max-w-[140px] truncate">{note.title}</span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(note.id)}
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
          onClick={onClear}
          className="shrink-0 ml-1 rounded-md px-2 py-1 text-xs text-text-muted hover:bg-muted/60"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
