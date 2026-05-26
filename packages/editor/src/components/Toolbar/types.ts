import { Editor } from "@tiptap/react";

export interface ToolbarItem {
  icon: React.ReactNode;
  label?: string;
  tooltip: string;
  isActive: () => boolean;
  disabled?: () => boolean;
  onClick: () => void;
  isDropdown?: boolean;
  DropdownNode?: React.ReactNode;
  isPopover?: boolean;
  PopoverNode?: React.ReactNode;
  variants?: ToolbarItem[];
  className?: string;
}

export interface ToolbarGroup {
  name: string;
  items: ToolbarItem[];
}

export interface ToolbarConfigProps {
  editor: Editor;
  options: {
    onAddImage?: () => void;
    onAddDrawing?: () => void;
    noteId?: string;
    createComment?: (input: { noteId: string; content: string }) => Promise<string | { id?: string } | null | undefined>;
  };
}
