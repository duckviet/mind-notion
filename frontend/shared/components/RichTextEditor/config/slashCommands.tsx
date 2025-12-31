import React from "react";
import {
  Bold,
  Code2,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import { type SlashCommand } from "../SplashCommand";

export const BASE_SLASH_COMMANDS: SlashCommand[] = [
  {
    label: "Heading 1",
    description: "Large section title",
    icon: <Heading1 size={16} />,
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: "Heading 2",
    description: "Medium section title",
    icon: <Heading2 size={16} />,
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "Heading 3",
    description: "Small section title",
    icon: <Heading3 size={16} />,
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: "Bullet List",
    description: "Unordered list",
    icon: <List size={16} />,
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    label: "Numbered List",
    description: "Ordered list",
    icon: <ListOrdered size={16} />,
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "Quote",
    description: "Call out a quote",
    icon: <Quote size={16} />,
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    label: "Code Block",
    description: "Insert code block",
    icon: <Code2 size={16} />,
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    label: "Bold",
    description: "Emphasize text",
    icon: <Bold size={16} />,
    action: (editor) => editor.chain().focus().toggleBold().run(),
  },
];

export function createTemplateCommand(
  onOpenTemplates: () => void
): SlashCommand {
  return {
    label: "Browse Templates",
    description: "Open the template gallery",
    icon: <FileText size={16} />,
    action: onOpenTemplates,
  };
}
