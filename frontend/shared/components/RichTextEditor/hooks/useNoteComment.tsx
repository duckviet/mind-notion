import { useState, useCallback } from "react";
import { type Editor } from "@tiptap/react";
import { useComments } from "@/features/note-editing/hooks/useComments";

type UseNoteCommentResult = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  content: string;
  setContent: (value: string) => void;
  submitComment: () => Promise<void>;
  isSubmitting: boolean;
};

export function useNoteComment(
  editor: Editor | null,
  noteId?: string,
): UseNoteCommentResult {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addComment } = useComments(noteId ?? "");

  const submitComment = useCallback(async () => {
    console.log("Submitting comment...", editor?.state.selection.empty);
    if (!editor || editor.state.selection.empty) return;
    const trimmed = content.trim();
    // if (!trimmed) return;

    setIsSubmitting(true);
    try {
      let commentId: string | null = null;
      if (noteId) {
        const res = await addComment(trimmed);
        if (res && typeof res === "object" && "id" in res && res.id) {
          commentId = String(res.id);
        }
      }

      editor
        .chain()
        .focus()
        .setComment({ id: commentId || "" })
        .run();
      setContent("");
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [addComment, content, editor, noteId]);

  return {
    isOpen,
    setIsOpen,
    content,
    setContent,
    submitComment,
    isSubmitting,
  };
}
