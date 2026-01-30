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
import { AIMenu } from "./Extensions/ExtAI";
import type { AIAction } from "./Extensions/ExtAI";
import SharedBubbleMenu from "./Extensions/SharedBubbleMenu";
import { getHeaderToolbarConfigs } from "./Toolbar/ToolbarConfig";

interface TiptapProps {
  noteId?: string;
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
  onActiveCommentChange?: (commentId: string | null) => void;
  onAIAction?: (
    action: string,
    selectedText: string,
    customPrompt?: string,
  ) => Promise<string>;
}

const Tiptap = ({
  noteId,
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
  onActiveCommentChange,
  onAIAction,
}: TiptapProps) => {
  const editorRef = useRef<Editor | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiMenuPosition, setAIMenuPosition] = useState({ top: 0, left: 0 });

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

  const { editor, aiMenuState, closeAIMenu } = useTiptapEditor({
    noteId,
    content,
    placeholder,
    onUpdate,
    editable,
    onKeyDown: handleKeyDown,
    collaboration,
    onActiveCommentChange,
    onAIAction,
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

  // Update AI menu position when it opens
  useEffect(() => {
    if (aiMenuState.isOpen && editor) {
      const { view } = editor;
      const { from } = view.state.selection;
      const coords = view.coordsAtPos(from);
      setAIMenuPosition({
        top: coords.top + window.scrollY + 30,
        left: coords.left + window.scrollX,
      });
    }
  }, [aiMenuState.isOpen, editor]);

  const handleAIAction = async (action: AIAction, customPrompt?: string) => {
    if (!onAIAction || !editor || !aiMenuState.range) return;

    setIsAILoading(true);
    try {
      const result = await onAIAction(
        action,
        aiMenuState.selection,
        customPrompt,
      );

      // Replace selected text with AI result
      editor
        .chain()
        .focus()
        .deleteRange(aiMenuState.range)
        .insertContent(result)
        .run();
    } catch (error) {
      console.error("AI action failed:", error);
    } finally {
      setIsAILoading(false);
      closeAIMenu();
    }
  };

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
          <Toolbar editor={editor} getConfig={getHeaderToolbarConfigs} />
        </div>
      )}

      {showEditor ? (
        <div ref={contentRef} className="relative flex gap-6 cursor-text px-6">
          <div className="flex-1">
            <EditorContent
              ref={ref}
              editor={editor}
              className={cn(
                "w-full min-h-[300px] focus:outline-none ring-0 ring-offset-0 resize-none overflow-hidden",
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

            {aiMenuState.isOpen && (
              <AIMenu
                isOpen={aiMenuState.isOpen}
                onClose={closeAIMenu}
                position={aiMenuPosition}
                selectedText={aiMenuState.selection}
                onAction={handleAIAction}
                isLoading={isAILoading}
              />
            )}

            <SharedBubbleMenu editor={editor} />
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
