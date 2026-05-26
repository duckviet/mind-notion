import React from "react";
import { DroppableZone, SortableItem } from "@/shared/components/dnd";
import { ResDetailNote } from "@/shared/services/generated/api";
import TopOfMindCard from "./TopOfMindCard";

type Props = {
  notes: ResDetailNote[];
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, note: ResDetailNote) => void;
  onUnpin?: (id: string, tomOrder: number | null) => void;
  onFocusEdit?: (id: string) => void;
  dragDisabled?: boolean;
  droppableId?: string;
  draggableIdPrefix?: string;
};

const TopOfMind = ({
  notes,
  onDelete,
  onUpdate,
  onUnpin,
  onFocusEdit,
  dragDisabled = false,
  droppableId = "top-of-mind-zone",
  draggableIdPrefix = "",
}: Props) => {
  return (
    <DroppableZone
      id={droppableId}
      activeClassName="ring-2 ring-brand-600/20 ring-offset-1 ring-offset-background rounded-2xl"
    >
      <div
        style={{
          scrollbarWidth: "none",
          scrollBehavior: "smooth",
          scrollbarGutter: "stable",
        }}
        className="my-4 flex h-[154px] w-full items-center gap-3 overflow-x-auto rounded-2xl border border-border bg-surface-50/30 dark:bg-surface-100/40 dark:border-border p-4 transition-all scrollbar-hide"
      >
        {notes.length === 0 ? (
          <div className="text-text-muted mx-auto">
            Drag notes here to pin them
          </div>
        ) : (
          notes.map((note) => (
            // <SortableItem key={note.id} id={note.id}>
            <SortableItem
              key={note.id}
              id={`${draggableIdPrefix}${note.id}`}
              disabled={dragDisabled}
              className="shrink-0"
            // type="tom-note"
            >
              <TopOfMindCard
                note={note}
                onUnpin={() => onUnpin?.(note.id, null)}
                onFocusEdit={() => onFocusEdit?.(note.id)}
              />
            </SortableItem>
            // </SortableItem>
          ))
        )}
      </div>
    </DroppableZone>
  );
};

export default TopOfMind;
