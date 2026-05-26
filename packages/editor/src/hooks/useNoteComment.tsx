import { useState, useCallback } from "react";
import { type Editor } from "@tiptap/react";

type UseNoteCommentResult = {
  content: string;
  setContent: (value: string) => void;
  submitComment: () => Promise<void>;
  isSubmitting: boolean;
};

export function useNoteComment(
  editor: Editor | null,
  noteId?: string,
  createComment?: (input: { noteId: string; content: string }) => Promise<string | { id?: string } | null | undefined>,
): UseNoteCommentResult {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitComment = useCallback(async () => {
    console.log("Submitting comment...", editor?.state.selection.empty);
    if (!editor || editor.state.selection.empty) return;
    const trimmed = content.trim();
    // if (!trimmed) return;

    setIsSubmitting(true);
    try {
      let commentId: string | null = null;
      if (noteId && createComment) {
        const res = await createComment({ noteId, content: trimmed });
        if (typeof res === "string") {
          commentId = res;
        } else if (res && typeof res === "object" && "id" in res && res.id) {
          commentId = String(res.id);
        }
      }

      editor
        .chain()
        .focus()
        .setComment({ id: commentId || "" })
        .run();

      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  }, [content, createComment, editor, noteId]);

  return {
    content,
    setContent,
    submitComment,
    isSubmitting,
  };
}
