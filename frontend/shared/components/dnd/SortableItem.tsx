import React, { CSSProperties, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface SortableItemProps {
  id: string | number;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function SortableItem({
  id,
  children,
  disabled = false,
  className = "",
  style = {},
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });
  useEffect(() => {
    // console.log("id", id, "isDragging", isDragging);
  }, [id, isDragging]);
  const sortableStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    ...style,
  };

  return (
    <div
      data-id={id}
      ref={setNodeRef}
      style={sortableStyle}
      className={className}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
