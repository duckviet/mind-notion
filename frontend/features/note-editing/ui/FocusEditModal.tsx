import React, { useState, useRef, useMemo, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Portal from "@/shared/components/PortalModal/PortalModal";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ReqUpdateNote, useGetNote } from "@/shared/services/generated/api";
import usePersistentState from "@/shared/hooks/usePersistentState/usePersistentState";
import { LocalStorageKeys } from "@/shared/configs/localStorageKeys";
import { useNoteForm } from "../hooks/useNoteForm";
import { useAutoSave } from "../hooks/useAutoSave";
import FocusEditModalContent from "./FocusEditModalContent";

interface FocusEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  onSave?: (data: ReqUpdateNote) => void;
}

export default function FocusEditModal({
  isOpen,
  onClose,
  noteId,
  onSave,
}: FocusEditModalProps) {
  const queryClient = useQueryClient();

  const { data: note } = useGetNote(
    noteId,
    {
      query: {
        enabled: isOpen && !!noteId,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
      },
    },
    queryClient,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = usePersistentState(
    LocalStorageKeys.FOCUS_EDIT_SIDEBAR_COLLAPSED,
    () => false,
  );

  const {
    form,
    newTag,
    error,
    titleRef,
    setNewTag,
    handleTitleChange,
    handleContentChange,
    handleTagAdd,
    handleTagRemove,
    validateTitle,
  } = useNoteForm(isOpen, note);

  const { updateNoteMutation } = useAutoSave(
    noteId,
    form,
    note,
    isSaving,
    setIsSaving,
  );

  const modalRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    const errorMsg = validateTitle();
    if (errorMsg) {
      titleRef.current?.focus();
      return;
    }

    const payload: ReqUpdateNote = {
      id: noteId,
      title: form.title,
      content: form.content,
      content_type: "text",
      status: note?.status ?? "draft",
      thumbnail: note?.thumbnail ?? "",
      tags: form.tags,
      is_public: note?.is_public ?? false,
    };

    onSave?.(payload);
    updateNoteMutation.mutate({ noteId: noteId, data: payload });
    toast.success("Saved");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSave();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (!modalRef.current?.contains(e.target as Node)) onClose();
  };

  if (typeof window === "undefined") return null;

  return (
    <Portal lockScroll={isOpen}>
      <AnimatePresence>
        {isOpen && (
          <Fragment>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100"
              onClick={handleBackdropClick}
            />
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onKeyDown={handleKeyDown}
              tabIndex={-1}
              className="fixed inset-0 z-100 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="w-[95vw] h-full max-h-[90vh] items-center space-x-4 pointer-events-auto flex flex-col">
                <FocusEditModalContent
                  form={form}
                  newTag={newTag}
                  error={error}
                  isSaving={isSaving}
                  isSidebarCollapsed={isSidebarCollapsed}
                  titleRef={titleRef}
                  note={note}
                  onTitleChange={handleTitleChange}
                  onContentChange={handleContentChange}
                  onNewTagChange={setNewTag}
                  onTagAdd={handleTagAdd}
                  onTagRemove={handleTagRemove}
                  onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
                />
              </div>
            </motion.div>
          </Fragment>
        )}
      </AnimatePresence>
    </Portal>
  );
}
