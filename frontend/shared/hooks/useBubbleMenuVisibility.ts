import { useCallback } from "react";
import type { Editor } from "@tiptap/react";

/**
 * Returns a stable `shouldShow` callback for BubbleMenu
 * that checks if a given mark/node is active.
 */
export function useBubbleMenuVisibility(markName: string) {
  return useCallback(
    ({ editor }: { editor: Editor }) => editor.isActive(markName),
    [markName],
  );
}
