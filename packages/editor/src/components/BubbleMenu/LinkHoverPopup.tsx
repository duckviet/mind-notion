"use client";

import { useCallback } from "react";
import { Editor } from "@tiptap/react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import {
  Divider,
  IconButton,
  PopupContainer,
} from "../PopupContainer";
import { useMarkHoverPopup } from "../../hooks/useMarkHoverPopup";

interface LinkHoverPopupProps {
  editor: Editor;
}

const LinkHoverPopup = ({ editor }: LinkHoverPopupProps) => {
  const { popup, activeElement, resolve, handleRemove, hide, containerProps } =
    useMarkHoverPopup<{ href: string }>(editor, "link", {
      selector: "a",
      extract: (el) => {
        const href = el.getAttribute("href");
        return href ? { href } : null;
      },
    });

  const handleOpen = useCallback(() => {
    if (popup?.data.href) window.open(popup.data.href, "_blank");
  }, [popup]);

  const handleEdit = useCallback(() => {
    if (!activeElement.current) return;

    const href = activeElement.current.getAttribute("href") || "";
    const range = resolve(activeElement.current);

    if (range) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: range.from, to: range.to })
        .run();

      hide();
    }
  }, [activeElement, resolve, hide, editor]);

  // Hide logic
  if (!popup || !containerProps) return null;
  if (editor.isActive("link") && !editor.state.selection.empty) return null;

  return (
    <PopupContainer {...containerProps}>
      <span
        className="max-w-[200px] truncate text-xs text-muted-foreground"
        title={popup.data.href}
      >
        {popup.data.href}
      </span>

      <Divider />
      <IconButton icon={ExternalLink} title="Open link" onClick={handleOpen} />
      <IconButton
        icon={Pencil}
        title="Edit link"
        onClick={handleEdit}
        hoverColor="text-brand-600"
      />
      <IconButton
        icon={Trash2}
        title="Remove link"
        onClick={handleRemove}
        hoverColor="text-destructive"
      />
    </PopupContainer>
  );
};

export default LinkHoverPopup;
