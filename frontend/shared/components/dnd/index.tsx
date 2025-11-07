export { DndProvider } from "./Dnd";
export type { DndItem, DndProviderProps } from "./Dnd";

export { MultiZoneDndProvider } from "./MultiZoneDndProvider";
export type { MultiZoneDndProviderProps } from "./MultiZoneDndProvider";

export { SortableItem } from "./SortableItem";
export type { SortableItemProps } from "./SortableItem";

export { DraggableItem } from "./DraggableItem";
export type { DraggableItemProps } from "./DraggableItem";

export { DroppableZone } from "./DroppableZone";
export type { DroppableZoneProps } from "./DroppableZone";

export { useCustomDndSensors } from "./useCustomDndSensors";
export type { UseCustomDndSensorsOptions } from "./useCustomDndSensors";

// Re-export commonly used dnd-kit components and hooks
export {
  useSortable,
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

export {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";

export { CSS } from "@dnd-kit/utilities";

export type {
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
