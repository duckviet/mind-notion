"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, type Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { useTiptapEditor } from "./useTiptapEditor";
import type { CollaborationConfig } from "./useTiptapEditor";
import { SlashCommandMenu } from "./SplashCommand";
import Portal from "@/shared/components/PortalModal/PortalModal";
import { TemplatesModal } from "./TemplatesModal";
import { ManageTemplatesModal } from "../../../features/template-management/ui/ManageTemplatesModal";
import { TableOfContents } from "./TableOfContents";
import { useSlashMenu } from "./hooks/useSlashMenu";
import { useTemplateModals } from "./hooks/useTemplateModals";
import { useEditorKeyboard } from "./hooks/useEditorKeyboard";
import { BASE_SLASH_COMMANDS, createTemplateCommand } from "./slashCommands";
import { Toolbar } from "./Toolbar";
import { Skeleton } from "../ui/skeleton";

interface TiptapProps {
  toolbar?: boolean;
  ref?: React.RefObject<HTMLDivElement>;
  className?: string;
  content?: string;
  placeholder?: string;
  editable?: boolean;
  onUpdate?: (content: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onEditorReady?: (editor: Editor) => void;
  showEditor?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  collaboration?: CollaborationConfig;
  // Thêm editorKey để force remount khi cần
  editorKey?: string;
  contentRef?: React.RefObject<HTMLDivElement | null>;
}

const Tiptap = ({
  toolbar = true,
  placeholder = "Type your message here...",
  ref,
  className,
  content = "",
  onUpdate,
  editable = true,
  onKeyDown,
  onEditorReady,
  showEditor = true,
  onFocus,
  onBlur,
  collaboration,
  editorKey,
  contentRef,
}: TiptapProps) => {
  const editorRef = useRef<Editor | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const {
    isTemplatesModalOpen,
    isManageTemplatesOpen,
    openTemplatesModal,
    closeTemplatesModal,
    openManageTemplates,
    closeManageTemplates,
    applyTemplate,
  } = useTemplateModals(editorRef.current);

  const slashCommands = useMemo(
    () => [...BASE_SLASH_COMMANDS, createTemplateCommand(openTemplatesModal)],
    [openTemplatesModal],
  );

  const {
    slashMenu,
    closeSlashMenu,
    openSlashMenu,
    selectCommand,
    moveSelection,
  } = useSlashMenu(editorRef.current, slashCommands, editable);

  const { handleKeyDown } = useEditorKeyboard({
    editor: editorRef.current,
    editable,
    slashMenuOpen: slashMenu.isOpen,
    selectedIndex: slashMenu.selectedIndex,
    commands: slashCommands,
    onSlashTrigger: openSlashMenu,
    onCloseMenu: closeSlashMenu,
    onSelectCommand: selectCommand,
    onMoveSelection: moveSelection,
    onKeyDown,
  });
  console.log(content);

  const editor = useTiptapEditor({
    content,
    placeholder,
    onUpdate,
    editable,
    onKeyDown: handleKeyDown,
    collaboration,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    editorRef.current = editor;
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  if (!editor || !isMounted) {
    return (
      <div
        className={cn(
          "w-full h-full animate-pulse bg-gray-100 rounded",
          className,
        )}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2" key={editorKey}>
      {toolbar && (
        <div className="sticky top-2 z-15 px-6">
          <Toolbar editor={editor} />
        </div>
      )}

      {showEditor ? (
        <div ref={contentRef} className="relative flex gap-6 cursor-text px-6">
          <div className="flex-1">
            <EditorContent
              ref={ref}
              editor={editor}
              className={cn(
                "w-full min-h-[300px] focus:outline-none ring-0 ring-offset-0 resize-none",
                className,
              )}
              onFocus={onFocus}
              onBlur={onBlur}
            />

            {slashMenu.isOpen && (
              <Portal lockScroll={true}>
                <div
                  className="fixed inset-0 z-100 bg-black/5"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    closeSlashMenu();
                  }}
                />
                <SlashCommandMenu
                  position={slashMenu.position}
                  commands={slashCommands}
                  selectedIndex={slashMenu.selectedIndex}
                  onSelect={selectCommand}
                />
              </Portal>
            )}
          </div>

          <TableOfContents editor={editor} />
        </div>
      ) : (
        <div className="px-6 pb-6">
          <Skeleton className="h-[300px] w-full" />
        </div>
      )}

      {/* <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={closeTemplatesModal}
        onSelectTemplate={applyTemplate}
        onManageTemplates={openManageTemplates}
      /> */}

      <ManageTemplatesModal
        isOpen={isManageTemplatesOpen}
        onClose={closeManageTemplates}
      />
    </div>
  );
};

export default Tiptap;
