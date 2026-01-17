import React from "react";
import { DraggableItem, DroppableZone } from "@/shared/components/dnd";
import { ResDetailNote } from "@/shared/services/generated/api";
import TopOfMindCard from "./TopOfMindCard";

type Props = {
  notes: ResDetailNote[];
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, note: ResDetailNote) => void;
  onUnpin?: (id: string, tom: boolean) => void;
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
      activeClassName="ring-2 ring-blue-300/20 ring-offset-1 ring-offset-blue-300/20 rounded-2xl"
    >
      <div
        style={{
          scrollbarWidth: "none",
          scrollBehavior: "smooth",
          scrollbarGutter: "stable",
        }}
        className="flex gap-3  items-center bg-[#dee2ea] w-full rounded-2xl my-4 p-4 h-[154px] transition-all overflow-x-auto"
      >
        {notes.length === 0 ? (
          <div className="text-text-muted text-sm">
            Drag notes here to pin them
          </div>
        ) : (
          notes.map((note) => (
            // <SortableItem key={note.id} id={note.id}>
            <DraggableItem
              key={note.id}
              id={`${draggableIdPrefix}${note.id}`}
              disabled={dragDisabled}
            >
              <TopOfMindCard
                note={note}
                onUnpin={() => onUnpin?.(note.id, false)}
                onFocusEdit={() => onFocusEdit?.(note.id)}
              />
            </DraggableItem>
            // </SortableItem>
          ))
        )}
      </div>
    </DroppableZone>
  );
};

export default TopOfMind;
