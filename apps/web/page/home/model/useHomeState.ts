import { useState } from "react";
import { useDebounce } from "use-debounce";
import { useModal } from "@/shared/contexts/ModalContext";

export function useHomeState() {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [focusEditNoteId, setFocusEditNoteId] = useState<string | null>(null);
  const { isModalOpen, openModal, closeModal } = useModal();

  const handleFocusEdit = (id: string) => {
    setFocusEditNoteId(id);
    openModal();
  };

  const handleCloseFocusEdit = (onAfterClose?: () => void) => {
    setFocusEditNoteId(null);
    closeModal();
    onAfterClose?.();
  };

  const handleDeleteRequest = (id: string) => setDeleteTargetId(id);

  return {
    query,
    setQuery,
    debouncedQuery,
    deleteTargetId,
    setDeleteTargetId,
    isDeleting,
    setIsDeleting,
    focusEditNoteId,
    isModalOpen,
    handleFocusEdit,
    handleCloseFocusEdit,
    handleDeleteRequest,
  };
}
