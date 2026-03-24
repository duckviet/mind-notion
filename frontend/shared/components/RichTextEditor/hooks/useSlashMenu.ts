// hooks/useSlashMenu.ts
import { useCallback, useEffect, useMemo, useRef } from "react";
import { type Editor } from "@tiptap/react";
import { getSplashMenuToolbarConfigs } from "../Toolbar/ToolbarConfig";
import { useOpenState } from "@/shared/hooks/useOpenState";

interface SlashMenuData {
  position: { x: number; y: number };
  selectedIndex: number;
}

interface SlashMenuState extends SlashMenuData {
  isOpen: boolean;
}

const INITIAL_SLASH_MENU_DATA: SlashMenuData = {
  position: { x: 0, y: 0 },
  selectedIndex: 0,
};

export function useSlashMenu(editable: boolean) {
  const editorRef = useRef<Editor | null>(null);
  const editor = editorRef.current;
  // Stable setter — gọi mỗi render
  const setEditor = useCallback((e: Editor | null) => {
    editorRef.current = e;
  }, []);

  const menuRef = useRef<HTMLDivElement>(null);
  const { state, open, close, setData } = useOpenState<SlashMenuData>(
    INITIAL_SLASH_MENU_DATA,
  );

  const slashMenu = useMemo<SlashMenuState>(
    () => ({
      isOpen: state.isOpen,
      position: state.data.position,
      selectedIndex: state.data.selectedIndex,
    }),
    [state],
  );

  // Get total item count from config
  const totalItems = useMemo(() => {
    if (!editor) return 0;
    const groups = getSplashMenuToolbarConfigs({
      editor,
      options: {},
    });
    return groups.reduce((sum, g) => sum + g.items.length, 0);
  }, [editor]);

  const closeSlashMenu = useCallback(() => {
    close();
  }, [close]);

  const openSlashMenu = useCallback(() => {
    if (!editor || editor.isDestroyed) return;

    try {
      const { from } = editor.state.selection;
      const coords = editor.view.coordsAtPos(from);
      open({
        position: { x: coords.left, y: coords.top + 8 },
        selectedIndex: 0,
      });
    } catch {
      // TipTap view can be unavailable briefly during mount/unmount cycles.
      return;
    }
  }, [editor, open]);

  const moveSelection = useCallback(
    (direction: "up" | "down") => {
      setData((prev) => {
        if (totalItems === 0) return prev;
        const delta = direction === "down" ? 1 : -1;
        const newIndex = (prev.selectedIndex + delta + totalItems) % totalItems;
        return { ...prev, selectedIndex: newIndex };
      });
    },
    [setData, totalItems],
  );

  const selectCurrent = useCallback(() => {
    if (!editor) return;
    const groups = getSplashMenuToolbarConfigs({
      editor,
      options: {},
    });
    const flatItems = groups.flatMap((g) => g.items);
    const item = flatItems[slashMenu.selectedIndex];
    if (item) {
      item.onClick();
      closeSlashMenu();
    }
  }, [editor, slashMenu.selectedIndex, closeSlashMenu]);

  // Keyboard handler
  const handleSlashKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): boolean => {
      if (!editable || !editor) return false;

      if (
        event.key === "/" &&
        event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        openSlashMenu();
        return true;
      }

      if (!slashMenu.isOpen) return false;

      switch (event.key) {
        case "Escape":
          event.preventDefault();
          closeSlashMenu();
          return true;
        case "ArrowDown":
          event.preventDefault();
          moveSelection("down");
          return true;
        case "ArrowUp":
          event.preventDefault();
          moveSelection("up");
          return true;
        case "Enter":
          event.preventDefault();
          selectCurrent();
          return true;
        default:
          if (!["Shift", "Control", "Meta", "Alt"].includes(event.key)) {
            closeSlashMenu();
          }
          return false;
      }
    },
    [
      editor,
      editable,
      slashMenu.isOpen,
      openSlashMenu,
      closeSlashMenu,
      moveSelection,
      selectCurrent,
    ],
  );

  // Close on outside click
  useEffect(() => {
    if (!slashMenu.isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Don't close if clicking inside the menu
      if (menuRef.current?.contains(e.target as Node)) return;
      closeSlashMenu();
    };

    window.addEventListener("mousedown", handleMouseDown);
    return () => window.removeEventListener("mousedown", handleMouseDown);
  }, [slashMenu.isOpen, closeSlashMenu]);

  return {
    setEditor,
    slashMenu,
    menuRef,
    closeSlashMenu,
    openSlashMenu,
    handleSlashKeyDown,
  };
}
