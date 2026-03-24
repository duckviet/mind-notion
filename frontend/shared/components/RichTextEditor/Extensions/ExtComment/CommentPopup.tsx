"use client";

import { Editor } from "@tiptap/react";
import { Trash2 } from "lucide-react";
import { IconButton, PopupContainer } from "@/shared/components/PopupContainer";
import { useMarkHoverPopup } from "@/shared/hooks/useMarkHoverPopup";
import { useCommentDetail } from "@/shared/services/generated/api";
import { formatDate } from "@/shared/utils/date-format";

interface CommentHoverPopupProps {
  editor: Editor;
}

const CommentHoverPopup = ({ editor }: CommentHoverPopupProps) => {
  const { popup, handleRemove, containerProps } = useMarkHoverPopup<{
    id: string;
  }>(editor, "comment", {
    selector: "span[data-comment-id]",
    extract: (el) => {
      const id = el.getAttribute("data-comment-id");
      return id ? { id } : null;
    },
  });

  const { data: comment } = useCommentDetail(popup?.data.id || "", {
    query: { enabled: !!popup?.data.id },
  });

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
              {formatDate(comment.created_at)}
            </span>
          )}
        </div>

        <IconButton
          icon={Trash2}
          title="Remove Comment"
          onClick={handleRemove}
          hoverColor="text-red-600"
        />
      </div>
    </PopupContainer>
  );
};

export default CommentHoverPopup;
