"use client";

import React, { useCallback, useRef, useState } from "react";
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from "@tiptap/react";
import { Trash2, Columns2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SplitViewComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const leftWidth = (node.attrs.leftWidth as number) || 50;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);

      const startX = e.clientX;
      const startWidth = leftWidth;
      const containerWidth = containerRef.current?.offsetWidth || 0;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaPercent = (deltaX / containerWidth) * 100;
        const newWidth = Math.min(Math.max(startWidth + deltaPercent, 20), 80);
        updateAttributes({ leftWidth: Math.round(newWidth) });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [leftWidth, updateAttributes]
  );

  return (
    <NodeViewWrapper
      className={cn(
        "split-view-wrapper relative my-4 rounded-lg border transition-all duration-200",
        selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200",
        isDragging && "select-none",
        isHovered && !selected && "border-gray-300"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Toolbar */}
      <div
        className={cn(
          "absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-md bg-white px-2 py-1 shadow-md border border-gray-200 transition-opacity z-10",
          isHovered || selected
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Columns2 className="h-3 w-3" />
          <span>Split View</span>
          <span className="ml-1 text-gray-400">
            ({leftWidth}% / {100 - leftWidth}%)
          </span>
        </div>
        <div className="h-4 w-px bg-gray-200 mx-1" />
        <button
          onClick={deleteNode}
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          title="Delete split view"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Main container */}
      <div
        ref={containerRef}
        className="split-view-container w-full relative h-full"
        style={
          {
            "--split-left-width": `${leftWidth}%`,
            "--split-right-width": `${100 - leftWidth}%`,
          } as React.CSSProperties
        }
      >
        {/* Columns content - rendered by ProseMirror via NodeViewContent */}
        <NodeViewContent className="split-view-columns" />

        {/* Resizer handle */}
        <div
          className={cn(
            "split-view-resizer absolute top-0 bottom-0 w-4 -ml-2 cursor-col-resize z-20 flex items-center justify-center group",
            isDragging && "bg-blue-100/50"
          )}
          style={{ left: `${leftWidth}%` }}
          onMouseDown={handleMouseDown}
        >
          <div
            className={cn(
              "h-12 w-1.5 rounded-full transition-all duration-200 shadow-sm",
              isDragging
                ? "bg-blue-500 scale-y-125"
                : "bg-gray-300 group-hover:bg-blue-400 group-hover:scale-y-110"
            )}
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default SplitViewComponent;
