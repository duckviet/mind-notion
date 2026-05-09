import { useEffect } from "react";
import type { Editor } from "@tiptap/react";

export function useEditorLifecycle(
  editor: Editor | null,
  {
    editable = true,
    className,
    readonlyClassName,
  }: {
    editable?: boolean;
    className?: string;
    readonlyClassName?: string;
  },
) {
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(editable);

    if (className || readonlyClassName) {
      editor.view.dom.className = editable
        ? (className ?? "")
        : (readonlyClassName ?? className ?? "");
    }
  }, [editor, editable, className, readonlyClassName]);
}
