// useEditorKeyboard.ts - Chỉ compose keyboard handlers
import { useCallback } from "react";

interface UseEditorKeyboardProps {
  editable: boolean;
  /** Mỗi handler return true nếu đã xử lý event */
  keyboardHandlers: Array<
    (event: React.KeyboardEvent<HTMLDivElement>) => boolean
  >;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export function useEditorKeyboard({
  editable,
  keyboardHandlers,
  onKeyDown,
}: UseEditorKeyboardProps) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || !editable) return;

      for (const handler of keyboardHandlers) {
        if (handler(event)) return;
      }
    },
    [onKeyDown, editable, keyboardHandlers],
  );

  return { handleKeyDown };
}
