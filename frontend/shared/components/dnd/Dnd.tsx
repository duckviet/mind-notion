import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useCustomDndSensors } from "./useCustomDndSensors";

export interface DndItem {
  id: string | number;
  [key: string]: any;
}

export interface DndProviderProps<T extends DndItem> {
  items: T[];
  onReorder?: (items: T[]) => void;
  children: React.ReactNode;
  strategy?: "vertical" | "grid";
  renderOverlay?: (activeItem: T | null) => React.ReactNode;
}

export function DndProvider<T extends DndItem>({
  items,
  onReorder,
  children,
  strategy = "grid",
  renderOverlay,
}: DndProviderProps<T>) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // Use custom sensors hook that removes Space and Enter keys by default
  const sensors = useCustomDndSensors({
    activationDistance: 8,
    navigationKeys: {
      up: ["ArrowUp"],
      down: ["ArrowDown"],
      left: ["ArrowLeft"],
      right: ["ArrowRight"],
    },
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const reorderedItems = arrayMove(items, oldIndex, newIndex);

      if (onReorder) {
        onReorder(reorderedItems);
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeItem = items.find((item) => item.id === activeId) || null;

  const sortingStrategy =
    strategy === "vertical" ? verticalListSortingStrategy : rectSortingStrategy;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={sortingStrategy}
      >
        {children}
      </SortableContext>
      <DragOverlay>
        {activeId && renderOverlay ? renderOverlay(activeItem) : null}
      </DragOverlay>
    </DndContext>
  );
}
