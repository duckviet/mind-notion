import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";

export function useEditorReady(
  editor: Editor | null,
  onEditorReady?: (editor: Editor) => void,
) {
  const calledRef = useRef(false);

  useEffect(() => {
    if (!editor || calledRef.current) return;
    calledRef.current = true;
    onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  // Reset khi editor thay đổi (recreated)
  useEffect(() => {
    return () => {
      calledRef.current = false;
    };
  }, [editor]);
}
