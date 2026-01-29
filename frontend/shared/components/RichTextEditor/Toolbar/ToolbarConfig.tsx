import { Editor } from "@tiptap/react";
import { is } from "date-fns/locale";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code2,
  Link2,
  ImageIcon,
  Undo,
  Redo,
  ListCollapseIcon,
  Columns2,
} from "lucide-react";

interface ToolbarItem {
  icon: React.ReactNode;
  label?: string;
  tooltip: string;
  isActive: () => boolean;
  disabled?: () => boolean;
  onClick: () => void;
  isDropdown?: boolean;
  variants?: ToolbarItem[];
}

interface ToolbarGroup {
  name: string;
  items: ToolbarItem[];
}

export const getToolbarGroups = (
  editor: Editor,
  options: { onAddImage: () => void },
): ToolbarGroup[] => [
  {
    name: "formatting",
    items: [
      {
        icon: <Bold size={16} />,
        tooltip: "Bold",
        isActive: () => editor.isActive("bold"),
        onClick: () => editor.chain().focus().toggleBold().run(),
      },
      {
        icon: <Italic size={16} />,
        tooltip: "Italic",
        isActive: () => editor.isActive("italic"),
        onClick: () => editor.chain().focus().toggleItalic().run(),
      },
      {
        icon: <Strikethrough size={16} />,
        tooltip: "Strikethrough",
        isActive: () => editor.isActive("strike"),
        onClick: () => editor.chain().focus().toggleStrike().run(),
      },
      {
        icon: <Highlighter size={16} />,
        tooltip: "Highlighter",
        isActive: () => editor.isActive("highlight"),
        onClick: () => editor.chain().focus().toggleHighlight().run(),
      },
    ],
  },
  {
    name: "headings",
    items: [1, 2, 3].map((level) => ({
      icon:
        level === 1 ? (
          <Heading1 size={16} />
        ) : level === 2 ? (
          <Heading2 size={16} />
        ) : (
          <Heading3 size={16} />
        ),
      tooltip: `Heading ${level}`,
      isActive: () => editor.isActive("heading", { level }),
      onClick: () =>
        editor
          .chain()
          .focus()
          .toggleHeading({ level: level as any })
          .run(),
    })),
  },
  {
    name: "lists",
    items: [
      {
        icon: <List size={16} />,
        tooltip: "Bullet List",
        isActive: () => editor.isActive("bulletList"),
        onClick: () => editor.chain().focus().toggleBulletList().run(),
      },
      {
        icon: <ListOrdered size={16} />,
        tooltip: "Numbered List",
        isActive: () => editor.isActive("orderedList"),
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        icon: <CheckSquare size={16} />,
        tooltip: "Task List",
        isActive: () => editor.isActive("taskList"),
        onClick: () => editor.chain().focus().toggleTaskList().run(),
      },
    ],
  },
  {
    name: "insert",
    items: [
      {
        icon: null,
        tooltip: "Table",
        isActive: () => editor.isActive("table"),
        onClick: () => {}, // Handled by component
        isDropdown: true,
      },

      {
        icon: <Quote size={16} />,
        tooltip: "Quote",
        isActive: () => editor.isActive("blockquote"),
        onClick: () => editor.chain().focus().toggleBlockquote().run(),
      },
      {
        icon: <Code2 size={16} />,
        tooltip: "Code Block",
        isActive: () => editor.isActive("codeBlock"),
        onClick: () => editor.chain().focus().toggleCodeBlock().run(),
      },
      {
        icon: <Link2 size={16} />,
        tooltip: "Add Link",
        isActive: () => editor.isActive("link"),
        onClick: () => {
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: "https://" })
            .run();
        },
      },
      {
        icon: <ImageIcon size={16} />,
        tooltip: "Add Image",
        isActive: () => false,
        onClick: options.onAddImage,
      },
      {
        icon: <Columns2 size={16} />,
        tooltip: "Split View",
        isActive: () => editor.isActive("splitView"),
        onClick: () => editor.commands.insertSplitView(),
        variants: [
          {
            icon: <Columns2 size={16} />,
            label: "Insert Split View",
            tooltip: "Insert Split View",
            isActive: () => editor.isActive("splitView"),
            onClick: () => editor.commands.insertSplitView(),
          },
          {
            icon: <Columns2 className="[stroke-dasharray:2_4]" size={16} />,
            label: "Toggle Split View Border",
            tooltip: "Toggle Split View Border",
            isActive: () => editor.isActive("splitView"),
            onClick: () => {
              editor.commands.insertSplitView({
                border: false,
              });
            },
          },
        ],
      },
    ],
  },
  {
    name: "history",
    items: [
      {
        icon: <Undo size={16} />,
        tooltip: "Undo",
        isActive: () => false,
        // disabled: () => !editor.can().undo(),
        onClick: () => editor.chain().focus().undo().run(),
      },
      {
        icon: <Redo size={16} />,
        tooltip: "Redo",
        isActive: () => false,
        // disabled: () => !editor.can().redo(),
        onClick: () => editor.chain().focus().redo().run(),
      },
      {
        icon: <ListCollapseIcon size={16} />,
        tooltip: "Table of Contents",
        isActive: () => !!editor.storage.extTableOfContents?.toc,
        onClick: () => editor.commands.toggleTableOfContents(),
      },
    ],
  },
];
