// useEditorKeyboard.ts - Chỉ compose keyboard handlers
import { useCallback } from "react";
import { type Editor } from "@tiptap/react";

interface UseEditorKeyboardProps {
  editor: Editor | null;
  editable: boolean;
  /** Mỗi handler return true nếu đã xử lý event */
  keyboardHandlers: Array<
    (event: React.KeyboardEvent<HTMLDivElement>) => boolean
  >;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export function useEditorKeyboard({
  editor,
  editable,
  keyboardHandlers,
  onKeyDown,
}: UseEditorKeyboardProps) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || !editor || !editable) return;

      for (const handler of keyboardHandlers) {
        if (handler(event)) return;
      }
    },
    [onKeyDown, editor, editable, keyboardHandlers],
  );

  return { handleKeyDown };
}
