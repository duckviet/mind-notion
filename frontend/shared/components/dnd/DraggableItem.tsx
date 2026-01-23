import React, { CSSProperties, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export interface DraggableItemProps {
  id: string | number;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  type?: string;
}

/**
 * DraggableItem - wraps a component and makes it draggable via dnd-kit
 */
export function DraggableItem({
  id,
  children,
  className = "",
  style = {},
  disabled = false,
  type = "note",
}: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      disabled,
    });

  const draggableStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0 : 1,
    ...style,
  };

  return (
    <div
      data-id={id}
      data-type={type}
      ref={setNodeRef}
      style={draggableStyle}
      className={className}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
