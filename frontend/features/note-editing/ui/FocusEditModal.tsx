import React, { useState, useRef, Fragment, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Portal from "@/shared/components/PortalModal/PortalModal";
import { toast } from "sonner";
import { ReqUpdateNote, useGetNote } from "@/shared/services/generated/api";
import usePersistentState from "@/shared/hooks/usePersistentState/usePersistentState";
import { LocalStorageKeys } from "@/shared/configs/localStorageKeys";
import { useNoteForm } from "../hooks/useNoteForm";
import FocusEditModalContent from "./FocusEditModalContent";
import { useCollabSession } from "../hooks/useCollabSession";
import { useCollabProvider } from "../hooks/useCollabProvider";
import { useNoteSnapshot } from "../hooks/useNoteSnapshot";
import { useAuthStore } from "@/features/auth";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { Editor } from "@tiptap/react";

interface FocusEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  onSave?: (id: string, data: ReqUpdateNote) => void;
}

export default function FocusEditModal({
  isOpen,
  onClose,
  noteId,
  onSave,
}: FocusEditModalProps) {
  const { user } = useAuthStore();

  const { data: collabSession, isLoading: collabLoading } = useCollabSession(
    noteId,
    undefined,
    isOpen && !!noteId,
  );
  const note = collabSession?.note;
  const collabToken = collabSession?.token ?? "";
  const collabEnabled = Boolean(collabToken);
  const collabPending = isOpen && collabLoading;

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

  // const { updateNoteMutation } = useAutoSave(
  //   noteId,
  //   form,
  //   note,
  //   isSaving,
  //   setIsSaving,
  //   !collabEnabled,
  // );

  const modalRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);

  // Pass initialHtml for automatic Yjs hydration
  const { doc, provider, isSynced, isHydrated } = useCollabProvider({
    noteId,
    token: collabToken,
    enabled: isOpen && collabEnabled,
    user: user?.name
      ? {
          name: user.name,
          color: "#6366f1",
        }
      : undefined,
    initialHtml: note?.content ? sanitizeHtml(note.content) : undefined,
  });

  const { scheduleSnapshot } = useNoteSnapshot({
    noteId,
    enabled: isOpen && collabEnabled,
  });

  const handleEditorReady = useCallback(
    (editor: import("@tiptap/react").Editor) => {
      editorRef.current = editor;
    },
    [],
  );

  const handleContentUpdate = useCallback(
    (value: string) => {
      console.log("Content updated:", value);

      if (collabEnabled) {
        scheduleSnapshot(value);
      } else {
        handleContentChange(value);
      }
    },
    [collabEnabled, scheduleSnapshot, handleContentChange],
  );

  // Wait for Yjs hydration before showing editor
  const showEditor = !collabPending && (!collabEnabled || isHydrated);

  const handleSave = () => {
    const errorMsg = validateTitle();
    if (errorMsg) {
      titleRef.current?.focus();
      return;
    }

    const payload: ReqUpdateNote = {
      ...note!,
      title: form.title,
      content: collabEnabled ? undefined : form.content,
      tags: form.tags,
      content_type: "text",
    };

    onSave?.(noteId, payload);
    toast.success("Saved");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === "Enter") {
      console.log("Ctrl+Enter pressed");
      handleSave();
    }
    if (e.key === "Escape") onClose();
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
              <div className="w-[95vw] h-full max-h-[90vh] items-center space-x-4 pointer-events-auto flex flex-col ">
                <FocusEditModalContent
                  form={form}
                  newTag={newTag}
                  error={error}
                  isSaving={isSaving}
                  isSidebarCollapsed={isSidebarCollapsed}
                  titleRef={titleRef}
                  // note={note}
                  noteId={noteId}
                  isPublic={note?.is_public}
                  onTitleChange={handleTitleChange}
                  onContentChange={handleContentUpdate}
                  onNewTagChange={setNewTag}
                  onTagAdd={handleTagAdd}
                  onTagRemove={handleTagRemove}
                  onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
                  collaboration={
                    doc && provider
                      ? {
                          document: doc,
                          provider,
                          user: {
                            name: user?.name ?? "Anonymous",
                            color: "#6366f1",
                          },
                        }
                      : undefined
                  }
                  onEditorReady={handleEditorReady}
                  showEditor={showEditor}
                />
              </div>
            </motion.div>
          </Fragment>
        )}
      </AnimatePresence>
    </Portal>
  );
}
