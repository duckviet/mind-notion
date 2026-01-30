"use client";

import { useState, useCallback, useEffect } from "react";
import { Editor } from "@tiptap/react";
import { getMarkRange } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import { Pencil, Trash2, ExternalLink, Check, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useCommentDetail } from "@/shared/services/generated/api";
import { formatDate } from "@/shared/utils/date-format";

interface CommentBubblePopupProps {
  editor: Editor;
  isActive?: boolean;
}

const CommentBubblePopup = ({ editor, isActive }: CommentBubblePopupProps) => {
  const commentId = editor.getAttributes("comment")?.id as string | undefined;

  const { data: comment } = useCommentDetail(commentId || ""); // Giả sử có hàm lấy comment theo ID

  const handleRemove = useCallback(() => {
    editor.chain().focus().extendMarkRange("comment").unsetComment().run();
  }, [editor]);

  // Reset về chế độ xem khi selection thay đổi (người dùng click ra chỗ khác)
  // shouldShow sẽ lo việc ẩn hiện menu, nhưng ta cần reset state isEditing
  const shouldShow = useCallback(({ editor }: { editor: Editor }) => {
    const isActive = editor.isActive("comment");

    return isActive;
  }, []);

  return (
    <BubbleMenu
      options={{
        placement: "bottom",
      }}
      className="top-0"
      editor={editor}
      pluginKey="commentMenu"
      shouldShow={shouldShow}
    >
      <div className="flex w-54 justify-between items-center gap-1 rounded-lg border border-border bg-surface py-1 px-2 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-text-primary">
            {comment?.user_name}
          </span>
          <span className="text-xs text-text-muted">
            {formatDate(comment?.created_at || "")}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground hover:text-red-600"
          onClick={handleRemove}
          title="Remove Comment"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </BubbleMenu>
  );
};

export default CommentBubblePopup;
