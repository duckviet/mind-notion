"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { EditorContent, type Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { useTiptapEditor } from "./useTiptapEditor";
import { SlashCommandMenu } from "./SplashCommand";
import Portal from "@/shared/components/PortalModal/PortalModal";
import { TemplatesModal } from "./TemplatesModal";
import { ManageTemplatesModal } from "../../../features/template-management/ui/ManageTemplatesModal";
import { TableOfContents } from "./TableOfContents";
import { useSlashMenu } from "./hooks/useSlashMenu";
import { useTemplateModals } from "./hooks/useTemplateModals";
import { useEditorKeyboard } from "./hooks/useEditorKeyboard";
import { BASE_SLASH_COMMANDS, createTemplateCommand } from "./slashCommands";
import { Toolbar } from "./Toolbar";

interface TiptapProps {
  toolbar?: boolean;
  ref?: React.RefObject<HTMLDivElement>;
  className?: string;
  content?: string;
  placeholder?: string;
  editable?: boolean;
  onUpdate?: (content: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onEditorReady?: (editor: Editor) => void;
  showTOC?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

const Tiptap = ({
  toolbar = true,
  placeholder = "Type your message here...",
  ref,
  className,
  content = "",
  onUpdate,
  editable = true,
  onKeyDown,
  onEditorReady,
  showTOC = false,
  onFocus,
  onBlur,
}: TiptapProps) => {
  const editorRef = useRef<Editor | null>(null);

  // Initialize template modals
  const {
    isTemplatesModalOpen,
    isManageTemplatesOpen,
    openTemplatesModal,
    closeTemplatesModal,
    openManageTemplates,
    closeManageTemplates,
    applyTemplate,
  } = useTemplateModals(editorRef.current);

  // Build slash commands with template command
  const slashCommands = useMemo(
    () => [...BASE_SLASH_COMMANDS, createTemplateCommand(openTemplatesModal)],
    [openTemplatesModal]
  );

  // Initialize slash menu
  const {
    slashMenu,
    closeSlashMenu,
    openSlashMenu,
    selectCommand,
    moveSelection,
  } = useSlashMenu(editorRef.current, slashCommands, editable);

  // Initialize keyboard handling
  const { handleKeyDown } = useEditorKeyboard({
    editor: editorRef.current,
    editable,
    slashMenuOpen: slashMenu.isOpen,
    selectedIndex: slashMenu.selectedIndex,
    commands: slashCommands,
    onSlashTrigger: openSlashMenu,
    onCloseMenu: closeSlashMenu,
    onSelectCommand: selectCommand,
    onMoveSelection: moveSelection,
    onKeyDown,
  });

  // Initialize editor
  const editor = useTiptapEditor({
    content,
    placeholder,
    onUpdate,
    editable,
    onKeyDown: handleKeyDown,
  });

  // Store editor reference
  useEffect(() => {
    editorRef.current = editor;
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

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
      <div className="relative flex gap-6">
        <div className="flex-1">
          <EditorContent
            ref={ref}
            editor={editor}
            className={cn(
              "w-full min-h-[300px] focus:outline-none ring-0 ring-offset-0 resize-none",
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
                onSelect={selectCommand}
              />
            </Portal>
          )}
        </div>
        {showTOC && <TableOfContents editor={editor} />}
      </div>

      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={closeTemplatesModal}
        onSelectTemplate={applyTemplate}
        onManageTemplates={openManageTemplates}
      />

      <ManageTemplatesModal
        isOpen={isManageTemplatesOpen}
        onClose={closeManageTemplates}
      />
    </div>
  );
};

export default Tiptap;
