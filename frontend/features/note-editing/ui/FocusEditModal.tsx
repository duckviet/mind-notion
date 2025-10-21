import React, { useState, useEffect, useRef, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Tag, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import Portal from "@/shared/components/PortalModal/PortalModal";
import { Textarea } from "@/shared/components/ui/textarea";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
import { CollaborativeEditor } from "@/features/collaborative-editor/ui/CollaborativeEditor";
import { NoteCardProps } from "@/entities/note/ui/NoteCard";
import { useMutation } from "@tanstack/react-query";
import { updateNote } from "@/shared/services/generated/api";

interface FocusEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: NoteCardProps;
  onSave?: (data: { title: string; content: string; tags?: string[] }) => void;
}

export default function FocusEditModal({
  isOpen,
  onClose,
  note,
  onSave,
}: FocusEditModalProps) {
  const [formData, setFormData] = useState({
    title: note?.title || "",
    content: note?.content || "",
    tags: note?.tags || [],
  });
  const [newTag, setNewTag] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  // react-query mutation for updating the note
  const { mutateAsync: updateNoteMutate, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!note?.id) return;
      await updateNote(note.id, {
        id: note.id,
        title: formData.title,
        content: formData.content,
        thumbnail: note.thumbnail || "",
        tags: formData.tags,
        content_type: "text",
        status: "draft",
        is_public: note.is_public || false,
      });
    },
    onSuccess: () => {
      onClose();
    },
    onError: (err) => {
      // Optionally show error UI/toast here
      // Could call onClose or leave open for retry
    },
  });

  // Focus title input when modal opens
  useEffect(() => {
    if (isOpen && titleRef.current) {
      setTimeout(() => {
        titleRef.current?.focus();
        titleRef.current?.select();
      }, 100);
    }
  }, [isOpen]);

  // Update form data when note changes
  useEffect(() => {
    setFormData({
      title: note?.title || "",
      content: note?.content || "",
      tags: note?.tags || [],
    });
  }, [note]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  // Save: Ctrl+Enter only
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSave = async () => {
    try {
      await updateNoteMutate();
      if (onSave) onSave(formData);
      // onClose will happen in onSuccess of mutation
    } catch (e) {
      // Optionally error UI
    }
  };

  // Don't render on server side
  if (typeof window === "undefined") {
    return null;
  }

  return (
    <Portal lockScroll={isOpen || false}>
      <AnimatePresence>
        {isOpen && (
          <Fragment>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-4 z-50 flex flex-col max-w-7xl w-full mx-auto"
              onKeyDown={handleKeyDown}
              tabIndex={-1}
            >
              <div className="flex-1 flex glass-bg rounded-xl  rounded-glass shadow-glass-xl border border-glass-border overflow-hidden">
                {/* Content */}
                <div className="flex-1 flex flex-col p-6 pr-0 overflow-scroll">
                  <RichTextEditor
                    onContentChange={(content) => {
                      setFormData((prev) => ({ ...prev, content }));
                    }}
                    content={formData.content}
                    className=""
                  />
                </div>

                <div className="p-6 w-[400px] bg-transparent">
                  {/* Title Input */}
                  <div className="mb-6">
                    <input
                      ref={titleRef}
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Note title..."
                      className="w-full text-2xl font-semibold bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted resize-none"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Tags Section */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-text-muted" />
                      <span className="text-sm font-medium text-text-secondary">
                        Tags
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.tags?.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm glass-bg rounded-full border border-glass-border"
                        >
                          <span className="text-text-secondary">#{tag}</span>
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="text-text-muted hover:text-text-secondary transition-colors"
                            disabled={isSaving}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Add tag and press Enter..."
                      className="w-full px-3 py-2 glass-bg rounded-lg border border-glass-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2"
                      disabled={isSaving}
                    />
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
