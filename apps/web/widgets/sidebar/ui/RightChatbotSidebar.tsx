"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Chatbot } from "@/features/chat-bot";
import { useChatbotSidebarStore } from "@/features/chat-bot";
import { DroppableZone } from "@/shared/components/dnd";

const MIN_WIDTH = 300;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 360;

export function RightChatbotSidebar() {
  const { isOpen, droppedNotePayload } = useChatbotSidebarStore();
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      // Dragging left (smaller clientX) → increase width; right → decrease
      const delta = startX.current - e.clientX;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setWidth(next);
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  if (!isOpen) {
    // Keep a zero-size droppable zone in DOM so drops can still register
    return (
      <DroppableZone
        id="chat-bot-right-sidebar"
        className="w-0 h-0 overflow-hidden pointer-events-none absolute"
        activeClassName="w-4 h-4"
      >
        <span />
      </DroppableZone>
    );
  }

  return (
    <div
      className="h-full shrink-0 flex flex-row rounded-lg bg-sidebar text-text-primary overflow-visible relative"
      style={{ width }}
    >
      {/* Resize handle — left edge */}
      <div
        onMouseDown={onMouseDown}
        className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize z-10 group flex items-center justify-center"
        title="Drag to resize"
      >
        {/* Visual indicator strip */}
        <div className="w-0.5 h-8 rounded-full bg-border/0 group-hover:bg-border/60 transition-colors duration-150" />
      </div>

      {/* Chatbot content */}
      <div className="flex-1 overflow-hidden rounded-lg">
        <Chatbot
          droppableId="chat-bot-right-sidebar"
          className="h-full w-full"
          droppedNotePayload={droppedNotePayload}
        />
      </div>
    </div>
  );
}
