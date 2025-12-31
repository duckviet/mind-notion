import { useCallback } from "react";
import { type Editor } from "@tiptap/react";
import { type SlashCommand } from "../SplashCommand";

interface UseEditorKeyboardProps {
  editor: Editor | null;
  editable: boolean;
  slashMenuOpen: boolean;
  selectedIndex: number;
  commands: SlashCommand[];
  onSlashTrigger: () => void;
  onCloseMenu: () => void;
  onSelectCommand: (command: SlashCommand) => void;
  onMoveSelection: (direction: "up" | "down") => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export function useEditorKeyboard({
  editor,
  editable,
  slashMenuOpen,
  selectedIndex,
  commands,
  onSlashTrigger,
  onCloseMenu,
  onSelectCommand,
  onMoveSelection,
  onKeyDown,
}: UseEditorKeyboardProps) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Call external handler first
      if (onKeyDown) {
        onKeyDown(event);
      }

      if (event.defaultPrevented || !editor || !editable) return;

      // Handle slash menu interactions
      if (slashMenuOpen) {
        if (event.key === "Escape") {
          event.preventDefault();
          onCloseMenu();
          return;
        }

        if (
          event.key === "ArrowDown" ||
          (event.key === "Tab" && !event.shiftKey)
        ) {
          event.preventDefault();
          onMoveSelection("down");
          return;
        }

        if (
          event.key === "ArrowUp" ||
          (event.key === "Tab" && event.shiftKey)
        ) {
          event.preventDefault();
          onMoveSelection("up");
          return;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          if (commands.length > 0) {
            onSelectCommand(commands[selectedIndex]);
          }
          return;
        }

        // Dismiss menu on other keys (except modifiers)
        if (
          event.key !== "Shift" &&
          event.key !== "Control" &&
          event.key !== "Meta" &&
          event.key !== "Alt"
        ) {
          onCloseMenu();
        }
        return;
      }

      // Trigger slash menu with Ctrl+/
      if (
        event.key === "/" &&
        event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        onSlashTrigger();
      }
    },
    [
      onKeyDown,
      editor,
      editable,
      slashMenuOpen,
      commands,
      selectedIndex,
      onCloseMenu,
      onMoveSelection,
      onSelectCommand,
      onSlashTrigger,
    ]
  );

  return { handleKeyDown };
}
