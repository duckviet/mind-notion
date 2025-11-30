"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EditorContent, type Editor } from "@tiptap/react";

import {
  Bold,
  Code2,
  FileText,
  CheckSquare,
  Lightbulb,
  Calendar,
  Code,
  ListTodo,
  Briefcase,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Text,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useTiptapEditor } from "./useTiptapEditor";
import Toolbar from "./Toolbar";
import { SlashCommand, SlashCommandMenu } from "./SplashCommand";
import Portal from "@/shared/components/PortalModal/PortalModal";
import { TemplatesModal } from "./TemplatesModal";
import { defaultTemplates, type Template } from "./templates";

interface TiptapProps {
  toolbar?: boolean;
  ref?: React.RefObject<HTMLDivElement>;
  className?: string;
  content?: string;
  placeholder?: string;
  editable?: boolean;
  onUpdate?: (content: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;

  onFocus?: () => void;
  onBlur?: () => void;
}

const BASE_SLASH_COMMANDS: SlashCommand[] = [
  {
    label: "Paragraph",
    description: "Plain text",
    icon: <Text size={16} />,
    action: (editor) => editor.chain().focus().setParagraph().run(),
  },
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

const templateIconComponents: Record<
  Template["icon"],
  React.ComponentType<{ size?: number }>
> = {
  FileText,
  CheckSquare,
  Lightbulb,
  Calendar,
  Code,
  ListTodo,
  Briefcase,
};

const Tiptap = ({
  toolbar = true,
  placeholder = "Type your message here...",
  ref,
  className,
  content = "",
  onUpdate,
  editable = true,
  onKeyDown,

  onFocus,
  onBlur,
}: TiptapProps) => {
  const [isTemplatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [slashMenu, setSlashMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    selectedIndex: 0,
  });
  const editorRef = useRef<Editor | null>(null);

  const templateCommands = useMemo(
    () =>
      defaultTemplates.map<SlashCommand>((template) => {
        const Icon = templateIconComponents[template.icon] ?? FileText;
        return {
          label: template.name,
          description:
            template.tags.length > 0
              ? `Template · ${template.tags.join(", ")}`
              : "Template",
          icon: <Icon size={16} />,
          action: (editor) => {
            editor.chain().focus().setContent(template.content).run();
          },
        };
      }),
    []
  );

  const slashCommands = useMemo<SlashCommand[]>(
    () => [
      ...BASE_SLASH_COMMANDS,
      {
        label: "Browse Templates",
        description: "Open the template gallery",
        icon: <FileText size={16} />,
        action: () => setTemplatesModalOpen(true),
      },
      ...templateCommands,
    ],
    [templateCommands]
  );

  const closeSlashMenu = useCallback(() => {
    setSlashMenu((prev) => ({
      ...prev,
      isOpen: false,
      selectedIndex: 0,
    }));
  }, []);

  const handleCommandSelect = useCallback(
    (command: SlashCommand) => {
      if (!editorRef.current) return;
      command.action(editorRef.current);
      closeSlashMenu();
    },
    [closeSlashMenu]
  );

  const handleSlashTrigger = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const { from } = editor.state.selection;
    const coords = editor.view.coordsAtPos(from);

    setSlashMenu({
      isOpen: true,
      position: { x: coords.left, y: coords.bottom + 8 },
      selectedIndex: 0,
    });
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (onKeyDown) {
        onKeyDown(event);
      }

      if (event.defaultPrevented) return;

      const editor = editorRef.current;
      if (!editor || !editable) return;

      if (slashMenu.isOpen) {
        if (event.key === "Escape") {
          event.preventDefault();
          closeSlashMenu();
          return;
        }

        if (
          event.key === "ArrowDown" ||
          (event.key === "Tab" && !event.shiftKey)
        ) {
          event.preventDefault();
          setSlashMenu((prev) => ({
            ...prev,
            selectedIndex:
              slashCommands.length === 0
                ? 0
                : (prev.selectedIndex + 1) % slashCommands.length,
          }));
          return;
        }

        if (
          event.key === "ArrowUp" ||
          (event.key === "Tab" && event.shiftKey)
        ) {
          event.preventDefault();
          setSlashMenu((prev) => ({
            ...prev,
            selectedIndex:
              slashCommands.length === 0
                ? 0
                : (prev.selectedIndex - 1 + slashCommands.length) %
                  slashCommands.length,
          }));
          return;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          if (slashCommands.length > 0) {
            handleCommandSelect(slashCommands[slashMenu.selectedIndex]);
          }
          return;
        }

        if (
          event.key !== "Shift" &&
          event.key !== "Control" &&
          event.key !== "Meta" &&
          event.key !== "Alt"
        ) {
          closeSlashMenu();
        }
      }

      if (
        event.key === "/" &&
        event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        handleSlashTrigger();
      }
    },
    [
      closeSlashMenu,
      editable,
      handleCommandSelect,
      handleSlashTrigger,
      onKeyDown,
      slashCommands,
      slashMenu.isOpen,
      slashMenu.selectedIndex,
    ]
  );

  const editor = useTiptapEditor({
    content,
    placeholder,
    onUpdate,
    editable,
    onKeyDown: handleKeyDown,
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (!slashMenu.isOpen) return;

    const handleClick = () => closeSlashMenu();
    window.addEventListener("mousedown", handleClick);

    return () => window.removeEventListener("mousedown", handleClick);
  }, [slashMenu.isOpen, closeSlashMenu]);

  if (!editor) {
    return (
      <div
        className={cn(
          "w-full h-full animate-pulse bg-gray-100 rounded",
          className
        )}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {toolbar && <Toolbar editor={editor} />}
      <div className="relative">
        <EditorContent
          ref={ref}
          editor={editor}
          className={cn(
            "w-full h-full focus:outline-none ring-0 ring-offset-0 resize-none",
            className
          )}
          onFocus={onFocus}
          onBlur={onBlur}
        />

        {slashMenu.isOpen && (
          <Portal lockScroll={true}>
            <div
              className="fixed inset-0 z-40 bg-black/5"
              onMouseDown={(e) => {
                e.stopPropagation();
                closeSlashMenu();
              }}
            />
            <SlashCommandMenu
              position={slashMenu.position}
              commands={slashCommands}
              selectedIndex={slashMenu.selectedIndex}
              onSelect={handleCommandSelect}
            />
          </Portal>
        )}
      </div>
      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        onSelectTemplate={(template) => {
          if (!editorRef.current) return;
          editorRef.current.chain().focus().setContent(template.content).run();
        }}
      />
    </div>
  );
};

export default Tiptap;
