import {
  FileText,
  File,
  BookOpen,
  LayoutDashboard,
  Presentation,
} from "lucide-react";
import { LAYOUTS, type NoteLayout } from "./layouts";
import type { Editor } from "@tiptap/core";
import { useNoteLayout } from "./useNoteLayout";
import { cn } from "@/lib/utils";

const ICONS: Record<NoteLayout, React.ReactNode> = {
  default: <LayoutDashboard size={14} />,
  a4: <FileText size={14} />,
  a5: <BookOpen size={14} />,
  letter: <File size={14} />,
  presentation: <Presentation size={14} />,
};

interface Props {
  editor: Editor;
  noteId: string;
}

export function NoteLayoutPicker({ editor, noteId }: Props) {
  const { layout, changeLayout } = useNoteLayout(editor, noteId);

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-background/80 backdrop-blur-sm border-b border-border print:hidden">
      {LAYOUTS.map((l) => (
        <button
          key={l.key}
          title={`${l.label} — ${l.description}`}
          onClick={() => changeLayout(l.key)}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
            "border transition-all duration-150 cursor-pointer",
            layout === l.key
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-transparent border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {ICONS[l.key]}
          <span>{l.label}</span>
        </button>
      ))}
    </div>
  );
}
