"use client";

import React, { useEffect, useRef, useState } from "react";
import { EditorContent, type Editor } from "@tiptap/react";
import { cn } from "../../utils/cn";
import { useTiptapEditor } from "../../hooks/useRichTextEditor";
import type { AIActionResult, CollaborationConfig } from "../../types";
import { SlashCommandMenu } from "../SlashCommand/SlashCommand";
import TableOfContents from "../TableOfContents/TableOfContents";
import { useSlashMenu } from "../../hooks/useSlashMenu";
import { useEditorKeyboard } from "../../hooks/useEditorKeyboard";
import { useEditorReady } from "../../hooks/useEditorReady";
import { useAIActions } from "../../hooks/useAIActions";
import { Toolbar } from "../Toolbar/Toolbar";
import { AIMenu } from "../../extensions/ExtAI";
import SharedBubbleMenu from "../BubbleMenu/SharedBubbleMenu";
import LinkHoverPopup from "../BubbleMenu/LinkHoverPopup";
import { getHeaderToolbarConfigs, getBubbleToolbarConfigs } from "../Toolbar/ToolbarConfig";
import type { AISelectionContext } from "../../extensions/ExtAI/types";
import CommentHoverPopup, { type CommentHoverPopupProps } from "../../extensions/ExtComment/CommentPopup";

export interface RichTextEditorProps {
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
  ) => Promise<AIActionResult>;
  uploadMedia?: (file: File) => Promise<string>;
  drawingSyncUri?: string;
  createComment?: (input: { noteId: string; content: string }) => Promise<string | { id?: string } | null | undefined>;
  getCommentDetail?: CommentHoverPopupProps["getCommentDetail"];
  editorAreaClassName?: string;
  editorClassName?: string;
  editorReadonlyClassName?: string;
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
  uploadMedia,
  drawingSyncUri,
  createComment,
  getCommentDetail,
  editorAreaClassName,
  editorClassName,
  editorReadonlyClassName,
}: RichTextEditorProps) => {
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
    uploadMedia,
    drawingSyncUri,
    editorClassName,
    editorReadonlyClassName,
  });

  ai.setEditor(editor); // sync ref mỗi render
  setEditor(editor); // Update slash menu's editor reference
  // Update AI hook's editor reference

  // --- Lifecycle ---
  useEffect(() => setIsMounted(true), []);
  useEditorReady(editor, onEditorReady);

  // --- Loading state ---
  if (!editor || !isMounted) {
    return (
      <div
        className={cn(
          "h-full w-full animate-pulse rounded bg-muted",
          className,
        )}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2" key={editorKey}>
      {toolbar && (
        <div className="sticky top-2 z-15 px-6">
          <Toolbar
            editor={editor}
            getConfig={getHeaderToolbarConfigs}
            noteId={noteId}
            createComment={createComment}
          />
        </div>
      )}

      {showEditor ? (
        <EditorArea
          ref={ref}
          contentRef={contentRef}
          editor={editor}
          className={className}
          editorAreaClassName={editorAreaClassName}
          editable={editable}
          onFocus={onFocus}
          onBlur={onBlur}
          slashMenu={slashMenu}
          menuRef={menuRef}
          ai={ai}
          createComment={createComment}
          getCommentDetail={getCommentDetail}
        />
      ) : (
        <div className="px-6 pb-6">
          <div className="h-[300px] w-full animate-pulse rounded bg-muted" />
        </div>
      )}
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
  createComment?: RichTextEditorProps["createComment"];
  getCommentDetail?: RichTextEditorProps["getCommentDetail"];
  editorAreaClassName?: string;
  editable?: boolean;
}

function EditorArea({
  ref,
  contentRef,
  editor,
  className,
  editorAreaClassName,
  editable = true,
  onFocus,
  onBlur,
  slashMenu,
  menuRef,
  ai,
  createComment,
  getCommentDetail,
}: EditorAreaProps) {
  return (
    <div ref={contentRef} className={cn("relative flex gap-6 px-6", editorAreaClassName)}>
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

        {editable && slashMenu.isOpen && (
          <SlashCommandMenu
            menuRef={menuRef}
            editor={editor}
            position={slashMenu.position}
            selectedIndex={slashMenu.selectedIndex}
          />
        )}

        {editable && ai.aiMenuState.isOpen && (
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

        {editable && (
          <>
            <SharedBubbleMenu
              editor={editor}
              getConfig={getBubbleToolbarConfigs}
              createComment={createComment}
            />
            <LinkHoverPopup editor={editor} />
            <CommentHoverPopup editor={editor} getCommentDetail={getCommentDetail} />
          </>
        )}
      </div>

      {editable && <TableOfContents editor={editor} />}
    </div>
  );
}
