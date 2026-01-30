"use client";

import { useCallback, useMemo } from "react";
import { Editor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import LinkBubbleMenuContent from "./ExtLink/LinkPopup";
import { Toolbar } from "../Toolbar";
import {
  getBubbleToolbarConfigs,
  getHeaderToolbarConfigs,
} from "../Toolbar/ToolbarConfig";
import CommentBubblePopup from "./ExtComment/CommentPopup";

interface SharedBubbleMenuProps {
  editor: Editor;
}

const SharedBubbleMenu = ({ editor }: SharedBubbleMenuProps) => {
  const { isLinkActive, isCommentActive, hasSelection, commentId } =
    useEditorState({
      editor,
      selector: ({ editor }) => ({
        isLinkActive: editor.isActive("link"),
        isCommentActive: editor.isActive("comment"),

        hasSelection: !editor.state.selection.empty,
        commentId: editor.getAttributes("comment")?.id as string | undefined,
      }),
    });

  const shouldShow = useCallback(({ editor }: { editor: Editor }) => {
    const hasSelection = !editor.state.selection.empty;
    const isCommentActive = editor.isActive("comment");
    const isLinkActive = editor.isActive("link");

    return hasSelection || isCommentActive || isLinkActive;
  }, []);

  const handleAddComment = useCallback(() => {
    if (editor.state.selection.empty) return;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `comment-${Date.now()}`;
    editor.chain().focus().setComment({ id }).run();
  }, [editor]);

  const handleRemoveComment = useCallback(() => {
    editor.chain().focus().unsetComment().run();
  }, [editor]);

  const content = useMemo(() => {
    if (isLinkActive) {
      return <LinkBubbleMenuContent editor={editor} isActive={isLinkActive} />;
    }

    if (isCommentActive) {
      return <CommentBubblePopup editor={editor} isActive={isCommentActive} />;
    }

    return <Toolbar editor={editor} getConfig={getBubbleToolbarConfigs} />;
  }, [
    commentId,
    editor,
    handleAddComment,
    handleRemoveComment,
    hasSelection,
    isCommentActive,
    isLinkActive,
  ]);

  if (!content) return null;

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "bottom", offset: 8, flip: true }}
      shouldShow={shouldShow}
    >
      <div className="">{content}</div>
    </BubbleMenu>
  );
};

export default SharedBubbleMenu;
