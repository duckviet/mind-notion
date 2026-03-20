// SlashCommandMenu.tsx
import React from "react";
import { type Editor } from "@tiptap/react";
import { Toolbar } from "./Toolbar";
import { getSplashMenuToolbarConfigs } from "./Toolbar/ToolbarConfig";

interface SlashCommandMenuProps {
  menuRef: React.RefObject<HTMLDivElement | null>;
  editor: Editor;
  position: { x: number; y: number };
  selectedIndex: number;
}

export const SlashCommandMenu = ({
  menuRef,
  editor,
  position,
  selectedIndex,
}: SlashCommandMenuProps) => {
  return (
    <div
      ref={menuRef}
      className="fixed"
      style={{ top: position.y, left: position.x }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Toolbar
        editor={editor}
        getConfig={getSplashMenuToolbarConfigs}
        selectedIndex={selectedIndex}
        direction="horizontal"
      />
    </div>
  );
};
