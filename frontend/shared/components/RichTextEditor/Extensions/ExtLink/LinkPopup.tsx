// components/link-bubble-menu.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { Editor } from "@tiptap/react";
import { getMarkRange } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import { Pencil, Trash2, ExternalLink, Check, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

interface LinkBubbleMenuProps {
  editor: Editor;
  isActive?: boolean;
}

const LinkBubbleMenu = ({ editor, isActive }: LinkBubbleMenuProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    if (!isActive) {
      setIsEditing(false);
    }
  }, [isActive]);

  // Bắt đầu chỉnh sửa: lấy dữ liệu từ link hiện tại
  const handleStartEdit = useCallback(() => {
    const { href } = editor.getAttributes("link");
    const { state } = editor;
    const { from } = state.selection;
    const range = getMarkRange(
      state.doc.resolve(from),
      state.schema.marks.link,
    );
    const fromPos = range?.from ?? state.selection.from;
    const toPos = range?.to ?? state.selection.to;
    const selectedText = state.doc.textBetween(fromPos, toPos);

    setUrl(href || "");
    setText(selectedText || "");
    setIsEditing(true);
    editor.commands.setTextSelection({ from: fromPos, to: toPos });
  }, [editor]);

  const handleSave = useCallback(() => {
    if (!url.trim()) return;

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .deleteSelection() // Xóa text cũ
      .insertContent({
        type: "text",
        text: text || url, // Dùng text mới hoặc url nếu text rỗng
        marks: [{ type: "link", attrs: { href: url } }],
      })
      .run();

    setIsEditing(false);
  }, [editor, url, text]);

  const handleRemove = useCallback(() => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setIsEditing(false); // Reset trạng thái
  }, [editor]);

  const handleOpenLink = useCallback(() => {
    const href = editor.getAttributes("link").href;
    if (href) window.open(href, "_blank");
  }, [editor]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Reset về chế độ xem khi selection thay đổi (người dùng click ra chỗ khác)
  // shouldShow sẽ lo việc ẩn hiện menu, nhưng ta cần reset state isEditing
  const shouldShow = useCallback(({ editor }: { editor: Editor }) => {
    const isActive = editor.isActive("link");
    if (!isActive) {
      setIsEditing(false);
    }
    return isActive;
  }, []);

  return (
    <BubbleMenu className="bottom-0" editor={editor} shouldShow={shouldShow}>
      <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1.5 shadow-lg">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Text"
              className="h-8 w-48 px-2 text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL"
              className="h-8 w-48 px-2 text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 px-0 hover:bg-green-100 hover:text-green-600"
              onClick={handleSave}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 px-0 hover:bg-red-100 hover:text-red-600"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              onClick={handleOpenLink}
              title="Open Link"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <div className="mx-1 h-4 w-[1px] bg-border" /> {/* Separator */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-blue-600"
              onClick={handleStartEdit}
              title="Edit Link"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <div className="mx-1 h-4 w-[1px] bg-border" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-red-600"
              onClick={handleRemove}
              title="Remove Link"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </BubbleMenu>
  );
};

export default LinkBubbleMenu;
