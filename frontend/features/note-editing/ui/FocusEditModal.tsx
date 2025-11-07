// FocusEditModal.tsx - Cải tiến
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Fragment,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag, AlertCircle } from "lucide-react";
import Portal from "@/shared/components/PortalModal/PortalModal";
import { Input } from "@/shared/components/ui/input";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
import { NoteCardProps } from "@/entities/note/ui/NoteCard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ReqUpdateNote, updateNote } from "@/shared/services/generated/api";

interface FocusEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: NoteCardProps;
  onSave?: (data: ReqUpdateNote) => void;
  onDelete?: () => void;
}

export default function FocusEditModal({
  isOpen,
  onClose,
  note,
  onSave,
  onDelete,
}: FocusEditModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [titleError, setTitleError] = useState("");

  const titleRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentInputRef = useRef<HTMLDivElement>(null);

  // Track initial values when modal opens to prevent auto-save on mount
  const initialFormDataRef = useRef({
    title: "",
    content: "",
    tags: [] as string[],
  });

  // Track previous saved values to avoid unnecessary auto-saves
  const prevSavedDataRef = useRef({
    title: "",
    content: "",
    tags: [] as string[],
  });

  // Track if modal just opened to prevent immediate auto-save
  const justOpenedRef = useRef(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && note) {
      const initialData = {
        title: note.title || "",
        content: note.content || "",
        tags: note.tags || [],
      };
      setFormData(initialData);
      // Initialize initial and saved refs to prevent auto-save on mount
      initialFormDataRef.current = { ...initialData };
      prevSavedDataRef.current = { ...initialData };
      setNewTag("");
      setTitleError("");
    }
  }, [isOpen, note]);

  // Validate title
  const validateTitle = useCallback((title: string) => {
    if (!title.trim()) {
      setTitleError("Title cannot be empty");
      return false;
    }
    if (title.length > 200) {
      setTitleError("Title cannot exceed 200 characters");
      return false;
    }
    setTitleError("");
    return true;
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (name === "title") {
        validateTitle(value);
      }
    },
    [validateTitle]
  );

  const handleContentChange = useCallback((content: string) => {
    setFormData((prev) => ({ ...prev, content }));
  }, []);

  const handleAddTag = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && newTag.trim()) {
        e.preventDefault();

        // Validate tag
        const trimmedTag = newTag.trim();
        if (trimmedTag.length > 50) {
          toast.error("Tag cannot exceed 50 characters");
          return;
        }

        if (formData.tags.includes(trimmedTag)) {
          toast.warning("Tag already exists");
          setNewTag("");
          return;
        }

        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, trimmedTag],
        }));
        setNewTag("");
      }
    },
    [newTag, formData.tags]
  );

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  }, []);

  // Optimistic auto-save with setQueryData on onSuccess
  const autoSaveMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) =>
      updateNote(note.id, {
        id: note.id,
        title: data.title,
        content: data.content,
        tags: formData.tags,
        content_type: "text",
        status: "draft",
        thumbnail: note.thumbnail || "",
        is_public: note.is_public || false,
      }),
    onMutate: () => setIsSaving(true),
    onSuccess: (updated, variables) => {
      // Optimistically update cache for the list and individual note
      queryClient.setQueryData(["note", note.id], (old: any) => ({
        ...old,
        ...{
          ...note,
          ...{
            title: variables.title,
            content: variables.content,
            tags: formData.tags,
          },
        },
      }));

      // Optimistically update the notes list if available
      queryClient.setQueryData(["notes"], (old: any) => {
        if (!old) return old;
        // Support paginated or flat arrays of notes
        // Simple flat array
        if (Array.isArray(old)) {
          return old.map((item) =>
            item.id === note.id
              ? {
                  ...item,
                  title: variables.title,
                  content: variables.content,
                  tags: formData.tags,
                }
              : item
          );
        }
        // Paginated data (e.g., {pages: [{items: []}, ...]})
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: page.items.map((item: any) =>
                item.id === note.id
                  ? {
                      ...item,
                      title: variables.title,
                      content: variables.content,
                      tags: formData.tags,
                    }
                  : item
              ),
            })),
          };
        }
        return old;
      });

      toast.success("Note auto-saved");
    },
    onError: (error) => {
      toast.error("Failed to auto-save note");
      console.error("Auto-save error:", error);
    },
    onSettled: () => setIsSaving(false),
  });

  useEffect(() => {
    if (isOpen && note) {
      justOpenedRef.current = true;
      // Reset flag after a short delay to allow user to start typing
      const timer = setTimeout(() => {
        justOpenedRef.current = false;
      }, 3000); // Prevent auto-save for 3 seconds after opening
      return () => clearTimeout(timer);
    }
  }, [isOpen, note]);

  useEffect(() => {
    // Don't auto-save if modal just opened
    if (justOpenedRef.current) {
      return;
    }

    // Check if there are actual changes from the last saved state
    const hasChanges =
      prevSavedDataRef.current.title !== formData.title ||
      prevSavedDataRef.current.content !== formData.content ||
      JSON.stringify(prevSavedDataRef.current.tags) !==
        JSON.stringify(formData.tags);

    // Only auto-save if:
    // 1. There are actual changes from last saved state
    // 2. Title is not empty (at least one character)
    // 3. No validation errors
    // 4. Not currently saving
    if (hasChanges && formData.title.trim() && !titleError && !isSaving) {
      const timer = setTimeout(() => {
        // Double-check that values haven't changed while waiting
        const stillHasChanges =
          prevSavedDataRef.current.title !== formData.title ||
          prevSavedDataRef.current.content !== formData.content ||
          JSON.stringify(prevSavedDataRef.current.tags) !==
            JSON.stringify(formData.tags);

        if (
          stillHasChanges &&
          formData.title.trim() &&
          !titleError &&
          !isSaving
        ) {
          // Update ref before mutation to avoid duplicate saves
          prevSavedDataRef.current = {
            title: formData.title,
            content: formData.content,
            tags: formData.tags,
          };

          autoSaveMutation.mutate({
            title: formData.title,
            content: formData.content,
          });
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [
    formData.title,
    formData.content,
    formData.tags,
    titleError,
    isSaving,
    autoSaveMutation,
  ]);

  const handleSave = useCallback(async () => {
    // Final validation
    if (!validateTitle(formData.title)) {
      titleRef.current?.focus();
      return;
    }

    if (!formData.content.trim() && !formData.title.trim()) {
      toast.error("Note must have either title or content");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        id: note.id,
        title: formData.title.trim(),
        content: formData.content.trim(),
        content_type: "text",
        status: "draft",
        thumbnail: note.thumbnail || "",
        tags: formData.tags,
        is_public: note.is_public || false,
      };

      if (onSave) {
        await onSave(payload);
      }

      // Optimistically update the cache
      queryClient.setQueryData(["note", note.id], (old: any) => ({
        ...old,
        ...note,
        title: formData.title,
        content: formData.content,
        tags: formData.tags,
      }));

      queryClient.setQueryData(["notes"], (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((item) =>
            item.id === note.id
              ? {
                  ...item,
                  title: formData.title,
                  content: formData.content,
                  tags: formData.tags,
                }
              : item
          );
        }
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: page.items.map((item: any) =>
                item.id === note.id
                  ? {
                      ...item,
                      title: formData.title,
                      content: formData.content,
                      tags: formData.tags,
                    }
                  : item
              ),
            })),
          };
        }
        return old;
      });

      toast.success("Note saved successfully");
    } catch (err) {
      toast.error("Failed to save note");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [
    validateTitle,
    formData.title,
    formData.content,
    formData.tags,
    note,
    onSave,
    queryClient,
  ]);

  // Save: Ctrl+Enter only
  const isEscapeKey = (e: React.KeyboardEvent) => e.key === "Escape";
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEscapeKey(e)) {
      onClose();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  const handleTitleBlur = useCallback(() => {
    if (formData.title.trim()) {
      validateTitle(formData.title);
    }
  }, [formData.title, validateTitle]);

  const handleClickOutside = useCallback(
    (e: React.MouseEvent) => {
      // Only close if clicking directly on backdrop or outside modal content
      const target = e.target as HTMLElement;
      if (!modalRef.current?.contains(target)) {
        onClose();
      }
    },
    [onClose]
  );

  // Focus title when modal opens
  useEffect(() => {
    if (isOpen && titleRef.current) {
      // Wait for animation to complete
      const timer = setTimeout(() => {
        titleRef.current?.focus();
        titleRef.current?.select();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Don't render on server side
  if (typeof window === "undefined") {
    return null;
  }

  return (
    <Portal lockScroll={isOpen}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <Fragment>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={handleClickOutside}
            />

            {/* Modal */}
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
              onKeyDown={handleKeyDown}
              tabIndex={-1}
            >
              <div className="w-full max-w-7xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
                {/* Content Area */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Editor */}
                  <div className="flex-1 min-w-0 overflow-y-auto p-6">
                    {/* Title Input */}
                    <div className="mb-6">
                      <input
                        ref={titleRef}
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        onBlur={handleTitleBlur}
                        placeholder="Note title..."
                        className="w-full text-2xl font-semibold bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted resize-none"
                        maxLength={200}
                      />
                      {titleError && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>{titleError}</span>
                        </div>
                      )}
                    </div>

                    {/* Rich Text Editor */}
                    <RichTextEditor
                      ref={contentInputRef as React.RefObject<HTMLDivElement>}
                      onContentChange={handleContentChange}
                      content={formData.content}
                      className="max-h-full min-h-[600px]"
                      editable={true}
                    />
                  </div>

                  {/* Sidebar */}
                  <div className="w-80 border-l border-gray-200 bg-gray-50 p-6 flex flex-col">
                    {/* Tags Section */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <Tag className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Tags ({formData.tags.length})
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4 max-h-48 overflow-y-auto">
                        {formData.tags.map((tag) => (
                          <div
                            key={tag}
                            className="px-3 py-1 cursor-pointer hover:bg-red-100"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            <span className="mr-1">#{tag}</span>
                            <X className="w-3 h-3 ml-1" />
                          </div>
                        ))}
                      </div>

                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Add tag and press Enter..."
                        className="w-full px-3 py-2"
                        disabled={isSaving}
                        maxLength={50}
                      />
                    </div>

                    {/* Character count */}
                    <div className="text-xs text-gray-500 text-right mt-4 pt-4 border-t border-gray-200">
                      {formData.content.length} characters
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </Fragment>
        )}
      </AnimatePresence>
    </Portal>
  );
}
