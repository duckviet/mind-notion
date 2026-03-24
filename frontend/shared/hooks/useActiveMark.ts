import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";

interface UseActiveMarkOptions<T> {
  /** TipTap mark name, e.g. "comment", "link", "highlight" */
  markName: string;
  /** Extract ID/value from mark attributes */
  extractId?: (attrs: Record<string, unknown>) => T | null;
  /** Callback when active mark changes */
  onChange?: (value: T | null) => void;
}

export function useActiveMark<T = string>(
  editor: Editor | null,
  {
    markName,
    extractId = (attrs) => (attrs.id as T) ?? null,
    onChange,
  }: UseActiveMarkOptions<T>,
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!editor) return;

    let last: T | null = null;

    const emit = (value: T | null) => {
      if (value === last) return;
      last = value;
      onChangeRef.current?.(value);
    };

    const onSelection = () => {
      emit(
        editor.isActive(markName)
          ? extractId(editor.getAttributes(markName))
          : null,
      );
    };

    const onBlur = () => emit(null);

    onSelection();
    editor.on("selectionUpdate", onSelection);
    editor.on("blur", onBlur);

    return () => {
      editor.off("selectionUpdate", onSelection);
      editor.off("blur", onBlur);
    };
  }, [editor, markName, extractId]);
}
