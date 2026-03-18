import React, { CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type DragHandleProps = React.HTMLAttributes<HTMLElement> & {
    ref: (node: HTMLElement | null) => void;
  };

type SortableRenderProps = {
  dragHandleProps: DragHandleProps;
  isDragging: boolean;
};

export interface SortableItemProps {
  id: string | number;
  children: React.ReactNode | ((props: SortableRenderProps) => React.ReactNode);
  disabled?: boolean;
  useDragHandle?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function SortableItem({
  id,
  children,
  disabled = false,
  useDragHandle = false,
  className = "",
  style = {},
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });

  const sortableStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    ...style,
  };

  const rootDragProps = useDragHandle
    ? {}
    : ({
        ...attributes,
        ...(listeners ?? {}),
      } as React.HTMLAttributes<HTMLDivElement>);

  const dragHandleProps: DragHandleProps = {
    ref: setActivatorNodeRef,
    ...attributes,
    ...(listeners ?? {}),
  };

  const content =
    typeof children === "function"
      ? children({ dragHandleProps, isDragging })
      : children;

  return (
    <div
      data-id={id}
      ref={setNodeRef}
      style={sortableStyle}
      className={className}
      {...rootDragProps}
    >
      {content}
    </div>
  );
}
