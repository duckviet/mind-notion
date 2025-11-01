import React from "react";
import {
  DraggableItem,
  DroppableZone,
  SortableItem,
} from "@/shared/components/dnd";
import {
  ResDetailNote,
  useUpdateNoteTOM,
} from "@/shared/services/generated/api";
import TopOfMindCard from "./TopOfMindCard";

type Props = {
  notes: ResDetailNote[];
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, note: ResDetailNote) => void;
  onUnpin?: (id: string, tom: boolean) => void;
};

const TopOfMind = ({ notes, onDelete, onUpdate, onUnpin }: Props) => {
  return (
    <DroppableZone
      id="top-of-mind-zone"
      activeClassName="ring-2 ring-blue-400 bg-blue-50"
    >
      <div className="flex gap-3 justify-center items-center bg-[#dee2ea] w-full rounded-md my-4 p-4 min-h-[120px] transition-all">
        {notes.length === 0 ? (
          <div className="text-text-muted text-sm">
            Drag notes here to pin them
          </div>
        ) : (
          notes.map((note) => (
            // <SortableItem key={note.id} id={note.id}>
            <DraggableItem key={note.id} id={note.id}>
              <TopOfMindCard
                note={note}
                onUnpin={() => onUnpin?.(note.id, false)}
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
