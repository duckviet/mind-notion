"use client";

import React, { useEffect, useRef, useState } from "react";
import { EditorContent, type Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { useTiptapEditor } from "./useTiptapEditor";
import type { CollaborationConfig } from "./useTiptapEditor";
import { SlashCommandMenu } from "./SplashCommand";
import { ManageTemplatesModal } from "../../../features/template-management/ui/ManageTemplatesModal";
import { TableOfContents } from "./TableOfContents";
import { useSlashMenu } from "./hooks/useSlashMenu";
import { useTemplateModals } from "./hooks/useTemplateModals";
import { useEditorKeyboard } from "./hooks/useEditorKeyboard";
import { useEditorReady } from "./hooks/useEditorReady";
import { useAIActions } from "./hooks/useAIActions";
import { Toolbar } from "./Toolbar";
import { Skeleton } from "../ui/skeleton";
import { AIMenu } from "./Extensions/ExtAI";
import SharedBubbleMenu from "./Extensions/SharedBubbleMenu";
import { getHeaderToolbarConfigs } from "./Toolbar/ToolbarConfig";
import LinkHoverPopup from "./Extensions/ExtLink/LinkHoverPopup";
import type { AISelectionContext } from "./Extensions/ExtAI/types";
import CommentHoverPopup from "./Extensions/ExtComment/CommentPopup";

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
  editorKey?: string;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  onActiveCommentChange?: (commentId: string | null) => void;
  onAIAction?: (
    action: string,
    selectedText: string,
    customPrompt?: string,
    context?: AISelectionContext,
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
  const [isMounted, setIsMounted] = useState(false);

  // --- AI ---
  const ai = useAIActions({ noteId, onAIAction });

  // --- Menus ---
  const { menuRef, slashMenu, handleSlashKeyDown, setEditor } =
    useSlashMenu(editable);

  const { handleKeyDown } = useEditorKeyboard({
    editable,
    keyboardHandlers: [handleSlashKeyDown],
    onKeyDown,
  });
  // --- Editor ---
  const { editor } = useTiptapEditor({
    noteId,
    content,
    placeholder,
    onUpdate,
    editable,
    collaboration,
    onActiveCommentChange,
    onOpenAI: ai.openAIMenu,
    onKeyDown: handleKeyDown, // set below after keyboard hook
  });

  ai.setEditor(editor); // sync ref mỗi render
  setEditor(editor); // Update slash menu's editor reference
  // Update AI hook's editor reference

  // --- Modals ---
  const { isManageTemplatesOpen, closeManageTemplates } =
    useTemplateModals(editor);

  // --- Lifecycle ---
  useEffect(() => setIsMounted(true), []);
  useEditorReady(editor, onEditorReady);

  // --- Loading state ---
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
        <EditorArea
          ref={ref}
          contentRef={contentRef}
          editor={editor}
          className={className}
          onFocus={onFocus}
          onBlur={onBlur}
          slashMenu={slashMenu}
          menuRef={menuRef}
          ai={ai}
        />
      ) : (
        <div className="px-6 pb-6">
          <Skeleton className="h-[300px] w-full" />
        </div>
      )}

      <ManageTemplatesModal
        isOpen={isManageTemplatesOpen}
        onClose={closeManageTemplates}
      />
    </div>
  );
};

export default Tiptap;

// ─── Sub-components ──────────────────────────────────────

interface EditorAreaProps {
  ref?: React.RefObject<HTMLDivElement>;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  editor: Editor;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  slashMenu: {
    isOpen: boolean;
    position: { x: number; y: number };
    selectedIndex: number;
  };
  menuRef: React.RefObject<HTMLDivElement | null>;
  ai: ReturnType<typeof useAIActions>;
}

function EditorArea({
  ref,
  contentRef,
  editor,
  className,
  onFocus,
  onBlur,
  slashMenu,
  menuRef,
  ai,
}: EditorAreaProps) {
  return (
    <div ref={contentRef} className="relative flex gap-6 px-6">
      <div className="flex-1 relative">
        <EditorContent
          ref={ref}
          editor={editor}
          className={cn(
            "w-full min-h-[300px] focus:outline-none",
            "ring-0 ring-offset-0 resize-none overflow-hidden",
            className,
          )}
          onFocus={onFocus}
          onBlur={onBlur}
        />

        {slashMenu.isOpen && (
          <SlashCommandMenu
            menuRef={menuRef}
            editor={editor}
            position={slashMenu.position}
            selectedIndex={slashMenu.selectedIndex}
          />
        )}

        {ai.aiMenuState.isOpen && (
          <AIMenu
            isOpen
            onClose={ai.closeAIMenu}
            position={ai.aiMenuPosition}
            selectedText={ai.aiMenuState.selection}
            onAction={ai.handleAIAction}
            isLoading={ai.isAILoading}
            streamingPreview={ai.aiStreamingPreview}
          />
        )}

        <SharedBubbleMenu editor={editor} />
        <LinkHoverPopup editor={editor} />
        <CommentHoverPopup editor={editor} />
      </div>

      <TableOfContents editor={editor} />
    </div>
  );
}
