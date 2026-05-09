import Link from "next/link";
import { FileText, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { SortableItem } from "@/shared/components/dnd";
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
      //   useDragHandle
      className="pr-2"
      style={{ paddingLeft: `${depth * 16 + 36}px` }}
    >
      {/* {({ dragHandleProps }) => ( */}
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
        {/* <button
            type="button"
            {...dragHandleProps}
            onClick={(event) => event.preventDefault()}
            className="inline-flex size-6 touch-none items-center justify-center rounded-md text-text-muted hover:bg-surface-100/70 cursor-grab active:cursor-grabbing"
            aria-label="Drag note to reorder"
          >
            <GripVertical className="size-4" />
          </button> */}
      </div>
      {/* )} */}
    </div>
  );
}
