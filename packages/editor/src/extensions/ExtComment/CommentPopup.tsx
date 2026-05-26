"use client";

import { Editor } from "@tiptap/react";
import { Trash2 } from "lucide-react";
import { IconButton, PopupContainer } from "../../components/PopupContainer";
import { useMarkHoverPopup } from "../../hooks/useMarkHoverPopup";

export interface CommentHoverPopupProps {
  editor: Editor;
  getCommentDetail?: (commentId: string) =>
    | {
        user_name?: string;
        created_at?: string;
      }
    | undefined;
}

const CommentHoverPopup = ({ editor, getCommentDetail }: CommentHoverPopupProps) => {
  const { popup, handleRemove, containerProps } = useMarkHoverPopup<{
    id: string;
  }>(editor, "comment", {
    selector: "span[data-comment-id]",
    extract: (el) => {
      const id = el.getAttribute("data-comment-id");
      return id ? { id } : null;
    },
  });

  const comment = popup?.data.id ? getCommentDetail?.(popup.data.id) : undefined;

  if (!popup || !containerProps) return null;

  return (
    <PopupContainer {...containerProps} className="min-w-[200px]">
      <div className="flex flex-1 items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">
            {comment?.user_name || "..."}
          </span>
          {comment?.created_at && (
            <span className="text-xs text-text-muted">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          )}
        </div>

        <IconButton
          icon={Trash2}
          title="Remove Comment"
          onClick={handleRemove}
          hoverColor="text-destructive"
        />
      </div>
    </PopupContainer>
  );
};

export default CommentHoverPopup;
