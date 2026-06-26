import { useEffect, useState, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";
import type { AIAction } from "../extensions/ExtAI";
import type { AISelectionContext } from "../extensions/ExtAI/types";
import type { AIActionResult, AIMenuState } from "../types";
import { useAIMenu } from "./useAIMenu";

interface UseAIActionsProps {
  noteId?: string;
  onAIAction?: (
    action: string,
    selectedText: string,
    customPrompt?: string,
    context?: AISelectionContext,
  ) => Promise<AIActionResult>;
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
        const response = onAIAction
          ? await onAIAction(
              action,
              aiMenuState.selection,
              customPrompt,
              aiMenuState.context ?? undefined,
            )
          : "";

        if (
          typeof response === "object" &&
          "type" in response &&
          (response.type === "inline_assist" || response.type === "rag_answer")
        ) {
          return;
        }

        let proposedText: string;
        if (typeof response === "string") {
          proposedText = response;
        } else if ("type" in response && response.type === "edit_proposal") {
          proposedText = response.proposed;
        } else if ("type" in response && response.type === "inline_transform") {
          proposedText = response.replacement;
        } else if ("text" in response) {
          proposedText = response.text;
        } else {
          return;
        }
        const modelName =
          typeof response === "object" ? response.model : undefined;
        const originalText =
          typeof response === "object" &&
          "type" in response &&
          response.type === "edit_proposal"
            ? response.original
            : aiMenuState.selection;

        const creator = "You";
        const modelInfo = modelName ? ` - ${modelName}` : " - using AI";

        editor.commands.setProposedEdit({
          range: aiMenuState.range,
          originalText,
          proposedText,
          action,
          customPrompt,
          createdBy: `${creator}${modelInfo}`,
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
