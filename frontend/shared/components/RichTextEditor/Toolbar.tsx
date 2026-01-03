import { motion } from "framer-motion";
import React, { useRef } from "react";
import ToolbarButton from "./ToolbarButton";
import { Editor } from "@tiptap/react";
import {
  Bold,
  CheckSquare,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListCollapseIcon,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Undo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUploadMedia } from "@/shared/services/generated/api";

const Toolbar = ({
  editor,
  className,
}: {
  editor: Editor;
  className?: string;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: uploadMedia, isPending: isUploading } = useUploadMedia({
    mutation: {
      onError: () => toast.error("Failed to upload image"),
    },
  });

  const addLink = () => {
    editor.chain().focus().toggleLink({ href: "https://www.google.com" }).run();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      event.target.value = "";
      return;
    }

    const toastId = toast.loading("Uploading image...");

    try {
      const res = await uploadMedia({ data: { file } });
      editor
        .chain()
        .focus()
        .setImage({ src: res.url, alt: file.name, title: file.name })
        .run();
      toast.success("Image uploaded", { id: toastId });
    } catch {
      toast.error("Failed to upload image", { id: toastId });
    } finally {
      event.target.value = "";
    }
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200 sticky -top-4 z-15 shadow-md",
        className
      )}
    >
      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        icon={<Bold size={16} />}
        tooltip="Bold"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        icon={<Italic size={16} />}
        tooltip="Italic"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        icon={<Strikethrough size={16} />}
        tooltip="Strikethrough"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        icon={<Code size={16} />}
        tooltip="Inline Code"
      />
      <ToolbarButton
        onClick={
          () => {}
          // editor.chain().focus().toggleMark().run()
        }
        isActive={editor.isActive("highlight")}
        icon={<Highlighter size={16} />}
        tooltip="Highlight"
      />
      <div className="w-px h-6 bg-gray-300 mx-1" />
      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        icon={<Heading1 size={16} />}
        tooltip="Heading 1"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        icon={<Heading2 size={16} />}
        tooltip="Heading 2"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        icon={<Heading3 size={16} />}
        tooltip="Heading 3"
      />
      <div className="w-px h-6 bg-gray-300 mx-1" />
      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        icon={<List size={16} />}
        tooltip="Bullet List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        icon={<ListOrdered size={16} />}
        tooltip="Numbered List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive("taskList")}
        icon={<CheckSquare size={16} />}
        tooltip="Task List"
      />
      <div className="w-px h-6 bg-gray-300 mx-1" />
      {/* Other */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        icon={<Quote size={16} />}
        tooltip="Quote"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        icon={<Code2 size={16} />}
        tooltip="Code Block"
      />
      <ToolbarButton
        onClick={addLink}
        isActive={editor.isActive("link")}
        icon={<Link2 size={16} />}
        tooltip="Add Link"
      />
      <ToolbarButton
        onClick={addImage}
        isActive={false}
        icon={<ImageIcon size={16} />}
        tooltip="Add Image"
        disabled={isUploading}
      />
      <div className="w-px h-6 bg-gray-300 mx-1" />
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        isActive={false}
        icon={<Undo size={16} />}
        tooltip="Undo"
        disabled={!editor.can().undo()}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        isActive={false}
        icon={<Redo size={16} />}
        tooltip="Redo"
        disabled={!editor.can().redo()}
      />{" "}
      <div className="w-px h-6 bg-gray-300 mx-1" />
      {/* Table of Contents */}
      <ToolbarButton
        onClick={() => editor.commands.toggleTableOfContents()}
        // 3. Truy cập vào storage thay vì dùng isActive()
        isActive={!!editor.storage.extTableOfContents?.toc}
        icon={<ListCollapseIcon size={16} />}
        tooltip="Table of Contents"
        disabled={typeof editor.commands.toggleTableOfContents !== "function"}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </motion.div>
  );
};

export default Toolbar;
