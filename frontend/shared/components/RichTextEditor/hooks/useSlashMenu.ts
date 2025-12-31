import { useState, useCallback, useEffect } from "react";
import { type Editor } from "@tiptap/react";
import { type SlashCommand } from "../SplashCommand";

interface SlashMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  selectedIndex: number;
}

export function useSlashMenu(
  editor: Editor | null,
  commands: SlashCommand[],
  editable: boolean
) {
  const [slashMenu, setSlashMenu] = useState<SlashMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    selectedIndex: 0,
  });

  const closeSlashMenu = useCallback(() => {
    setSlashMenu((prev) => ({
      ...prev,
      isOpen: false,
      selectedIndex: 0,
    }));
  }, []);

  const openSlashMenu = useCallback(() => {
    if (!editor) return;

    const { from } = editor.state.selection;
    const coords = editor.view.coordsAtPos(from);

    setSlashMenu({
      isOpen: true,
      position: { x: coords.left, y: coords.bottom + 8 },
      selectedIndex: 0,
    });
  }, [editor]);

  const selectCommand = useCallback(
    (command: SlashCommand) => {
      if (!editor) return;
      command.action(editor);
      closeSlashMenu();
    },
    [editor, closeSlashMenu]
  );

  const moveSelection = useCallback(
    (direction: "up" | "down") => {
      setSlashMenu((prev) => {
        if (commands.length === 0) return prev;

        const delta = direction === "down" ? 1 : -1;
        const newIndex =
          (prev.selectedIndex + delta + commands.length) % commands.length;

        return { ...prev, selectedIndex: newIndex };
      });
    },
    [commands.length]
  );

  // Close menu on outside click
  useEffect(() => {
    if (!slashMenu.isOpen) return;

    const handleClick = () => closeSlashMenu();
    window.addEventListener("mousedown", handleClick);

    return () => window.removeEventListener("mousedown", handleClick);
  }, [slashMenu.isOpen, closeSlashMenu]);

  return {
    slashMenu,
    closeSlashMenu,
    openSlashMenu,
    selectCommand,
    moveSelection,
  };
}
