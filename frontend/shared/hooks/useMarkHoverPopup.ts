import { useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { useHoverPopup, type UseHoverPopupOptions } from "./useHoverPopup";
import { useEditorMarkRange } from "./useEditorMarkRange";

export function useMarkHoverPopup<T>(
  editor: Editor,
  markName: string,
  options: UseHoverPopupOptions<T>,
) {
  // 1. Hover detection
  const { popup, popupRef, popupHandlers, activeElement, hide } =
    useHoverPopup<T>(editor.view.dom, options);

  // 2. Mark range actions
  const { resolve, remove } = useEditorMarkRange(editor, markName);

  // 3. Shared remove handler
  const handleRemove = useCallback(() => {
    if (activeElement.current) {
      remove(activeElement.current);
      hide();
    }
  }, [activeElement, remove, hide]);

  // 4. Props gom sẵn cho PopupContainer
  const containerProps = popup
    ? {
        ref: popupRef,
        x: popup.x,
        y: popup.y,
        ...popupHandlers,
      }
    : null;

  return {
    popup,
    activeElement,
    resolve,
    handleRemove,
    hide,
    containerProps, // Spread cái này thẳng vào <PopupContainer>
  };
}
