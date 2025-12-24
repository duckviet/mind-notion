import { motion } from "framer-motion";
import React from "react";
import ToolbarButton from "./ToolbarButton";
import { Editor, useEditor } from "@tiptap/react";
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
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Undo,
} from "lucide-react";

const Toolbar = ({ editor }: { editor: Editor }) => {
  const addLink = () => {
    editor.chain().focus().toggleLink({ href: "https://www.google.com" }).run();
  };

  const addImage = () => {
    editor.chain().focus().setImage({ src: "https://www.google.com" }).run();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex   gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200 sticky -top-4 z-15 shadow-md"
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
      />
    </motion.div>
  );
};

export default Toolbar;
