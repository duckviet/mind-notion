"use client";

import { useCallback } from "react";
import { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Toolbar } from "../Toolbar";
import { getBubbleToolbarConfigs } from "../Toolbar/ToolbarConfig";

interface SharedBubbleMenuProps {
  editor: Editor;
}

const SharedBubbleMenu = ({ editor }: SharedBubbleMenuProps) => {
  const shouldShow = useCallback(({ editor }: { editor: Editor }) => {
    const hasSelection = !editor.state.selection.empty;

    return hasSelection;
  }, []);

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "bottom", offset: 8, flip: true }}
      shouldShow={shouldShow}
      className="z-9999"
    >
      <Toolbar editor={editor} getConfig={getBubbleToolbarConfigs} />;
    </BubbleMenu>
  );
};

export default SharedBubbleMenu;
