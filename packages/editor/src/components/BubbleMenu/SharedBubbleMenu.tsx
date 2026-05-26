"use client";

import { useCallback } from "react";
import { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Toolbar } from "../Toolbar/Toolbar";
import { ToolbarConfigProps, ToolbarGroup } from "../Toolbar/types";

interface SharedBubbleMenuProps {
  editor: Editor;
  getConfig?: (props: ToolbarConfigProps) => ToolbarGroup[];
  createComment?: ToolbarConfigProps["options"]["createComment"];
}

const SharedBubbleMenu = ({ editor, getConfig, createComment }: SharedBubbleMenuProps) => {
  const shouldShow = useCallback(({ editor }: { editor: Editor }) => {
    const hasSelection = !editor.state.selection.empty;

    return hasSelection;
  }, []);

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "bottom", offset: 8, flip: true }}
      shouldShow={shouldShow}
      className="z-[9999]"
    >
      <Toolbar editor={editor} getConfig={getConfig} createComment={createComment} />
    </BubbleMenu>
  );
};

export default SharedBubbleMenu;
