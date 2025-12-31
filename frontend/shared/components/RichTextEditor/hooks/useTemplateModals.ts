import { useState, useCallback } from "react";
import { type Editor } from "@tiptap/react";
import { type Template } from "../templates";

export function useTemplateModals(editor: Editor | null) {
  const [isTemplatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [isManageTemplatesOpen, setManageTemplatesOpen] = useState(false);

  const openTemplatesModal = useCallback(() => {
    setTemplatesModalOpen(true);
  }, []);

  const closeTemplatesModal = useCallback(() => {
    setTemplatesModalOpen(false);
  }, []);

  const openManageTemplates = useCallback(() => {
    setTemplatesModalOpen(false);
    setManageTemplatesOpen(true);
  }, []);

  const closeManageTemplates = useCallback(() => {
    setManageTemplatesOpen(false);
  }, []);

  const applyTemplate = useCallback(
    (template: Template) => {
      if (!editor) return;
      editor.chain().focus().setContent(template.content).run();
    },
    [editor]
  );

  return {
    isTemplatesModalOpen,
    isManageTemplatesOpen,
    openTemplatesModal,
    closeTemplatesModal,
    openManageTemplates,
    closeManageTemplates,
    applyTemplate,
  };
}
