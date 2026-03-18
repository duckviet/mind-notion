import { useEffect } from "react";
import type { Editor } from "@tiptap/react";

export function useActiveComment(
  editor: Editor | null,
  onChangeRef: React.RefObject<
    ((commentId: string | null) => void) | undefined
  >,
) {
  useEffect(() => {
    if (!editor || !onChangeRef.current) return;

    let lastActiveId: string | null = null;

    const emitActiveComment = () => {
      const isCommentActive = editor.isActive("comment");
      const nextId = isCommentActive
        ? ((editor.getAttributes("comment")?.id as string | undefined) ?? null)
        : null;

      if (nextId !== lastActiveId) {
        lastActiveId = nextId;
        onChangeRef.current?.(nextId);
      }
    };

    const handleBlur = () => {
      if (lastActiveId !== null) {
        lastActiveId = null;
        onChangeRef.current?.(null);
      }
    };

    emitActiveComment();
    editor.on("selectionUpdate", emitActiveComment);
    editor.on("blur", handleBlur);

    return () => {
      editor.off("selectionUpdate", emitActiveComment);
      editor.off("blur", handleBlur);
    };
  }, [editor, onChangeRef]);
}
