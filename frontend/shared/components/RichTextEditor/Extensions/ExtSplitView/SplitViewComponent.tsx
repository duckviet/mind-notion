"use client";

import React, { useCallback, useRef, useState } from "react";
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from "@tiptap/react";
import { Trash2, Columns2, PanelTopDashed, PanelTop } from "lucide-react";
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
  const border = node.attrs.border !== false;
  const padding = node.attrs.padding !== false;
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
    [leftWidth, updateAttributes],
  );

  return (
    <NodeViewWrapper
      className={cn(
        "split-view-wrapper relative  rounded-lg transition-all duration-200 overflow-visible",
        border ? "border" : "border-none",
        padding ? "p-5" : "p-0",
        selected
          ? "border-accent ring-2 ring-accent/20 z-50 shadow-lg"
          : "border-border z-20",
        isDragging && "select-none",
        isHovered && !selected && "border-border-subtle z-40",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Toolbar - Higher z-index and better visibility */}
      <div
        className={cn(
          "absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-md px-2 py-1 shadow-2xl border border-border transition-all duration-300 z-50 whitespace-nowrap",
          isHovered || selected
            ? "opacity-100 translate-y-0 visible  "
            : "opacity-0 translate-y-2 invisible pointer-events-none",
        )}
      >
        <div className="flex items-center gap-2 text-xs font-medium text-text-primary mr-2">
          <div className="p-1 rounded bg-background text-accent">
            <Columns2 className="h-3.5 w-3.5" />
          </div>
          <span className="opacity-70 text-[10px] uppercase tracking-wider font-bold">
            Split {leftWidth}:{100 - leftWidth}
          </span>
        </div>
        <div className="h-4 w-px bg-border mx-1" />
        <button
          onClick={(e) => {
            e.preventDefault();
            updateAttributes({ border: !border });
          }}
          className={cn(
            "p-1.5 rounded-full transition-all duration-200",
            border
              ? "bg-accent/10 text-text-primary hover:bg-accent/20"
              : "bg-accent/10   hover:text-text-primary",
          )}
          title="Toggle split view border"
        >
          <Columns2
            className={cn(
              "h-4 w-4 bg-accent",
              border && "[stroke-dasharray:2_4] stroke-primary",
            )}
          />
        </button>{" "}
        <button
          onClick={(e) => {
            e.preventDefault();
            updateAttributes({ padding: !padding });
          }}
          className={cn(
            "p-1.5 rounded-full transition-all duration-200",
            padding
              ? "bg-accent/10 text-text-primary hover:bg-accent/20"
              : "bg-accent/10   hover:text-text-primary",
          )}
          title="Padding toggle"
        >
          {padding ? (
            <PanelTop className={cn("h-4 w-4 bg-accent")} />
          ) : (
            <PanelTopDashed className={cn("h-4 w-4 bg-accent")} />
          )}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            deleteNode();
          }}
          className="p-1.5 text-text-muted hover:text-destructive hover:bg-destructive/10 rounded-full transition-all duration-200 ml-1"
          title="Delete split view"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Main container */}
      <div
        ref={containerRef}
        className="split-view-container w-full relative h-full group"
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
            "split-view-resizer absolute top-0 bottom-0 w-4 -ml-2 cursor-col-resize z-10 flex items-center justify-center group",
            isDragging && "bg-accent/10",
          )}
          style={{ left: `${leftWidth}%` }}
          onMouseDown={handleMouseDown}
        >
          <div
            className={cn(
              "h-12 w-1.5 rounded-full transition-all duration-200 shadow-sm opacity-0 group-hover:opacity-100",
              isDragging
                ? "bg-accent scale-y-125"
                : "bg-border group-hover:scale-y-110",
            )}
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default SplitViewComponent;
