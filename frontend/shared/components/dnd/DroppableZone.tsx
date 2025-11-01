import React, { CSSProperties, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";

export interface DroppableZoneProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  style?: CSSProperties;
}

/**
 * DroppableZone - creates a zone where items can be dropped
 */
export function DroppableZone({
  id,
  children,
  className = "",
  activeClassName = "",
  style = {},
}: DroppableZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });
  useEffect(() => {
    console.log("id", id, "isOver", isOver);
  }, [id, isOver]);
  const combinedClassName =
    `${className} ${isOver ? activeClassName : ""}`.trim();

  return (
    <div id={id} ref={setNodeRef} className={combinedClassName} style={style}>
      {children}
    </div>
  );
}
