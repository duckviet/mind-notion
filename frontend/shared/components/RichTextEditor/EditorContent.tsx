import React from "react";
import { EditorContent as TiptapEditorContent } from "@tiptap/react";
import { type Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import Portal from "@/shared/components/PortalModal/PortalModal";
import { SlashCommandMenu, type SlashCommand } from "./SplashCommand";
import { TableOfContents } from "./TableOfContents";

interface EditorContentProps {
  editor: Editor;
  className?: string;
  showTOC?: boolean;
  slashMenuOpen: boolean;
  slashMenuPosition: { x: number; y: number };
  slashCommands: SlashCommand[];
  selectedCommandIndex: number;
  onSelectCommand: (command: SlashCommand) => void;
  onCloseSlashMenu: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function EditorContentArea({
  editor,
  className,
  showTOC = false,
  slashMenuOpen,
  slashMenuPosition,
  slashCommands,
  selectedCommandIndex,
  onSelectCommand,
  onCloseSlashMenu,
  onFocus,
  onBlur,
}: EditorContentProps) {
  return (
    <div className="relative flex gap-6">
      <div className="flex-1">
        <TiptapEditorContent
          editor={editor}
          className={cn(
            "w-full min-h-[300px] focus:outline-none ring-0 ring-offset-0 resize-none",
            className
          )}
          onFocus={onFocus}
          onBlur={onBlur}
        />

        {slashMenuOpen && (
          <Portal lockScroll={true}>
            <div
              className="fixed inset-0 z-40 bg-black/5"
              onMouseDown={(e) => {
                e.stopPropagation();
                onCloseSlashMenu();
              }}
            />
            <SlashCommandMenu
              position={slashMenuPosition}
              commands={slashCommands}
              selectedIndex={selectedCommandIndex}
              onSelect={onSelectCommand}
            />
          </Portal>
        )}
      </div>
      {showTOC && <TableOfContents editor={editor} />}
    </div>
  );
}
