import { useEffect, useState, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";
import type { AIAction } from "../Extensions/ExtAI";
import type { AISelectionContext } from "../Extensions/ExtAI/types";
import type { AIMenuState } from "../types";
import { useAIMenu } from "./useAIMenu";
import { requestInlineEdit } from "@/shared/services/ai/inline-edit";

interface UseAIActionsProps {
  noteId?: string;
  onAIAction?: (
    action: string,
    selectedText: string,
    customPrompt?: string,
    context?: AISelectionContext,
  ) => Promise<string>;
}

interface AIActionsReturn {
  setEditor: (editor: Editor | null) => void;
  aiMenuState: AIMenuState;
  openAIMenu: (
    selection: string,
    range: { from: number; to: number },
    context: AISelectionContext,
  ) => void;
  closeAIMenu: () => void;
  handleAIAction: (action: AIAction, customPrompt?: string) => Promise<void>;
  isAILoading: boolean;
  aiStreamingPreview: string;
  aiMenuPosition: { top: number; left: number };
}

export function useAIActions({
  noteId,
  onAIAction,
}: UseAIActionsProps): AIActionsReturn {
  const editorRef = useRef<Editor | null>(null);
  const editor = editorRef.current;
  // Stable setter — gọi mỗi render
  const setEditor = useCallback((e: Editor | null) => {
    editorRef.current = e;
  }, []);
  const { aiMenuState, openAIMenu, closeAIMenu } = useAIMenu();
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiStreamingPreview, setAIStreamingPreview] = useState("");
  const [aiMenuPosition, setAIMenuPosition] = useState({ top: 0, left: 0 });

  // --- AI selection highlight ---
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    if (aiMenuState.range && (aiMenuState.isOpen || isAILoading)) {
      editor.commands.setAISelection(
        isAILoading ? "processing" : "menu",
        aiMenuState.range,
      );
      return;
    }

    editor.commands.clearAISelection();
  }, [aiMenuState.isOpen, aiMenuState.range, isAILoading, editor]);

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      if (editor && !editor.isDestroyed) {
        editor.commands.clearAISelection();
      }
    };
  }, [editor]);

  // --- Menu position ---
  useEffect(() => {
    if (!aiMenuState.isOpen || !editor || editor.isDestroyed) return;

    try {
      const { from } = editor.view.state.selection;
      const coords = editor.view.coordsAtPos(from);
      setAIMenuPosition({
        top: coords.top + window.scrollY + 30,
        left: coords.left + window.scrollX,
      });
    } catch {
      // View unavailable during mount/unmount
    }
  }, [aiMenuState.isOpen, editor]);

  // --- Action handler ---
  const handleAIAction = useCallback(
    async (action: AIAction, customPrompt?: string) => {
      if (!editor || !aiMenuState.range) return;

      setIsAILoading(true);
      setAIStreamingPreview("");

      try {
        const result = onAIAction
          ? await onAIAction(
              action,
              aiMenuState.selection,
              customPrompt,
              aiMenuState.context ?? undefined,
            )
          : await requestInlineEdit(
              {
                workspaceId: "default-workspace",
                noteId,
                action: action as Parameters<
                  typeof requestInlineEdit
                >[0]["action"],
                selectedText: aiMenuState.selection,
                customPrompt,
                context: aiMenuState.context ?? undefined,
              },
              {
                onDelta: (_delta, fullText) => setAIStreamingPreview(fullText),
              },
            );

        editor.commands.setProposedEdit({
          range: aiMenuState.range,
          originalText: aiMenuState.selection,
          proposedText: result,
          action,
          customPrompt,
        });
      } catch (error) {
        console.error("AI action failed:", error);
      } finally {
        setIsAILoading(false);
        setAIStreamingPreview("");
        closeAIMenu();
      }
    },
    [editor, aiMenuState, noteId, onAIAction, closeAIMenu],
  );

  return {
    setEditor,
    aiMenuState,
    openAIMenu,
    closeAIMenu,
    handleAIAction,
    isAILoading,
    aiStreamingPreview,
    aiMenuPosition,
  };
}
