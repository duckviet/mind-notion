"use client";

import { Fragment, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Edit2, Save } from "lucide-react";
import Portal from "@/shared/components/PortalModal/PortalModal";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/lib/utils";
import ExtTableKit from "../../../shared/components/RichTextEditor/ExtTable";
import ExtMathematics from "../../../shared/components/RichTextEditor/ExtMathematics";
import ExtHeading from "../../../shared/components/RichTextEditor/ExtHeading";
import ExtCodeBlock from "../../../shared/components/RichTextEditor/ExtCodeBlock";
import ExtListKit from "../../../shared/components/RichTextEditor/ExtListKit";
import ExtLink from "../../../shared/components/RichTextEditor/ExtLink";
import { TemplateForm } from "./TemplateForm";
import { TemplateList } from "./TemplateList";
import { useTemplates } from "../hooks/useTemplates";

type ManageTemplatesModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type TemplateFormData = {
  name: string;
  icon: string;
  content: string;
  tags: string[];
  color?: string;
};

export function ManageTemplatesModal({
  isOpen,
  onClose,
}: ManageTemplatesModalProps) {
  const {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    isCreating,
    isUpdating,
    isDeleting,
  } = useTemplates();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: "",
    icon: "FileText",
    content: "",
    tags: [],
    color: "#5a8a7d",
  });
  const [tagsInput, setTagsInput] = useState("");

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        heading: false,
      }),
      ExtLink,
      ...ExtListKit,
      ExtCodeBlock,
      ExtHeading,
      ExtMathematics,
      ...ExtTableKit,
    ],
    []
  );

  // TipTap editor for content
  const editor = useEditor({
    extensions,
    content: formData.content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setFormData((prev) => ({ ...prev, content: editor.getHTML() }));
    },
    editorProps: {
      attributes: {
        class: cn("min-h-[300px] focus:outline-none"),
      },
    },
  });

  const handleCreate = () => {
    setIsEditing(true);
    setEditingId(null);
    setFormData({
      name: "",
      icon: "FileText",
      content: "<p>Start writing your template...</p>",
      tags: [],
      color: "#5a8a7d",
    });
    editor?.commands.setContent("<p>Start writing your template...</p>");
  };

  const handleEdit = (template: any) => {
    setIsEditing(true);
    setEditingId(template.id);
    setFormData({
      name: template.name,
      icon: template.icon,
      content: template.content,
      tags: template.tags || [],
      color: template.color,
    });
    setTagsInput((template.tags || []).join(", "));
    editor?.commands.setContent(template.content);
  };

  const handleSave = async () => {
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const data = {
        ...formData,
        tags,
      };

      if (editingId) {
        await updateTemplate({ id: editingId, data });
      } else {
        await createTemplate(data);
      }

      setIsEditing(false);
      setEditingId(null);
      setFormData({
        name: "",
        icon: "FileText",
        content: "",
        tags: [],
        color: "#5a8a7d",
      });
      setTagsInput("");
    } catch (error) {
      console.error("Failed to save template:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteTemplate(id);
      } catch (error) {
        console.error("Failed to delete template:", error);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      name: "",
      icon: "FileText",
      content: "",
      tags: [],
      color: "#5a8a7d",
    });
    setTagsInput("");
  };

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <Fragment>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={onClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="fixed left-1/2 top-1/2 z-50 w-[900px] max-h-[80vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-black">
                    Manage Templates
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Create and manage your custom templates
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCreate}
                      className="rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                    >
                      Create New
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-black transition-colors hover:bg-black hover:text-white"
                  >
                    <X size={20} />
                  </motion.button>
                </div>
              </div>
              {/* Content */}
              <div className="p-8 overflow-y-auto max-h-[calc(80vh-120px)]">
                {isEditing && editor ? (
                  <TemplateForm
                    editor={editor}
                    formData={formData}
                    tagsInput={tagsInput}
                    onFormDataChange={(data) =>
                      setFormData((prev) => ({ ...prev, ...data }))
                    }
                    onTagsInputChange={setTagsInput}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    isSaving={isCreating || isUpdating}
                  />
                ) : (
                  <div className="space-y-3">
                    {isLoading ? (
                      <p className="text-center text-gray-500">
                        Loading templates...
                      </p>
                    ) : templates.length === 0 ? (
                      <p className="text-center text-gray-500">
                        No custom templates yet. Create your first one!
                      </p>
                    ) : (
                      <TemplateList
                        templates={templates}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isDeleting={isDeleting}
                        isLoading={isLoading}
                      />
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </Fragment>
        )}
      </AnimatePresence>
    </Portal>
  );
}
