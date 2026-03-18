import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { migrateMathStrings } from "@tiptap/extension-mathematics";

interface UseEditorUpdatesProps {
  editor: Editor | null;
  collabEnabled: boolean;
  onUpdateRef: React.RefObject<((content: string) => void) | undefined>;
  isUserEditingRef: React.MutableRefObject<boolean>;
  lastSentContentRef: React.MutableRefObject<string>;
}

export function useEditorUpdates({
  editor,
  collabEnabled,
  onUpdateRef,
  isUserEditingRef,
  lastSentContentRef,
}: UseEditorUpdatesProps) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!editor) return;

    let lastContent = editor.getHTML();

    const handleUpdate = () => {
      const html = editor.getHTML();
      if (html !== lastContent) {
        lastContent = html;
        lastSentContentRef.current = html;
        onUpdateRef.current?.(html);
      }
      isUserEditingRef.current = false;
    };

    const handleEditorUpdate = () => {
      isUserEditingRef.current = true;

      if (collabEnabled) {
        handleUpdate();
        return;
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(handleUpdate, 300);
    };

    const handleFocus = () => {
      isUserEditingRef.current = true;
    };

    const handleBlur = () => {
      setTimeout(() => {
        isUserEditingRef.current = false;
      }, 100);
    };

    editor.on("update", handleEditorUpdate);
    editor.on("focus", handleFocus);
    editor.on("blur", handleBlur);
    migrateMathStrings(editor);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      editor.off("update", handleEditorUpdate);
      editor.off("focus", handleFocus);
      editor.off("blur", handleBlur);
    };
  }, [
    editor,
    collabEnabled,
    onUpdateRef,
    isUserEditingRef,
    lastSentContentRef,
  ]);
}
