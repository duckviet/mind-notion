import React, { CSSProperties, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export interface DraggableItemProps {
  id: string | number;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
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
}: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      disabled,
    });
  useEffect(() => {
    // console.log("id", id, "isDragging", isDragging);
  }, [id, isDragging]);
  const draggableStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    ...style,
  };

  return (
    <div
      data-id={id}
      ref={setNodeRef}
      // style={draggableStyle}
      className={className}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
