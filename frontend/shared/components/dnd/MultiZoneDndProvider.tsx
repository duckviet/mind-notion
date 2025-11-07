import React, { useState } from "react";
import {
  DndContext,
  closestCorners,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
  DragOverEvent,
} from "@dnd-kit/core";
import { useCustomDndSensors } from "./useCustomDndSensors";

export interface MultiZoneDndProviderProps {
  children: React.ReactNode;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  renderOverlay?: (activeId: UniqueIdentifier | null) => React.ReactNode;
  disabled?: boolean;
}

/**
 * MultiZoneDndProvider - Provider for drag and drop between multiple zones
 * Use with DroppableZone and DraggableItem components
 */
export function MultiZoneDndProvider({
  children,
  onDragEnd,
  onDragStart,
  onDragOver,
  renderOverlay,
  disabled = false,
}: MultiZoneDndProviderProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // Use custom sensors hook that removes Space and Enter keys by default
  // Only allows mouse/touch drag and arrow keys for navigation
  const sensors = useCustomDndSensors({
    disabled,
    activationDistance: 8,
  });

  const handleDragStart = (event: DragStartEvent) => {
    // Prevent drag when disabled
    if (disabled) {
      return;
    }
    setActiveId(event.active.id);
    if (onDragStart) {
      onDragStart(event);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (onDragOver) {
      onDragOver(event);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (onDragEnd) {
      onDragEnd(event);
    }
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay>
        {activeId && renderOverlay ? renderOverlay(activeId) : null}
      </DragOverlay>
    </DndContext>
  );
}
