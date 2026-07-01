import Link from "next/link";
import { FileText } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { DraggableItem } from "@/shared/components/dnd";
import { NoteNode } from "./types";
import { isNoteRoute } from "./utils";

type NoteItemProps = {
  note: NoteNode;
  depth: number;
  pathname: string;
};

export function NoteItem({ note, depth, pathname }: NoteItemProps) {
  const isActive = isNoteRoute(pathname, note.id);

  return (
    <div
      id={note.id}
      className="pr-2"
      style={{ paddingLeft: `${depth * 16 + 36}px` }}
    >
      <DraggableItem
        id={`sidebar-note-${note.id}`}
        data={{
          type: "note",
          note: {
            id: note.id,
            title: note.name,
            content: "",
            type: "note",
          },
        }}
      >
        <div className="flex w-full items-center justify-between">
          <Link
            href={`/note/${note.id}/edit`}
            className={cn(
              "flex w-full max-w-[170px] items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              isActive
                ? "bg-surface-100 font-medium text-text-primary"
                : "text-text-muted hover:bg-surface-100/60 hover:text-text-primary",
            )}
          >
            <FileText className="size-4 shrink-0" />
            <span className="truncate">{note.name}</span>
          </Link>
        </div>
      </DraggableItem>
    </div>
  );
}
