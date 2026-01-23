"use client";

import { Save } from "lucide-react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import type { TemplateFormData } from "../types/template";
import { Toolbar } from "@/shared/components/RichTextEditor/Toolbar";

type TemplateFormProps = {
  editor: Editor;
  formData: TemplateFormData;
  tagsInput: string;
  onFormDataChange: (data: Partial<TemplateFormData>) => void;
  onTagsInputChange: (tags: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
};

export function TemplateForm({
  editor,
  formData,
  tagsInput,
  onFormDataChange,
  onTagsInputChange,
  onSave,
  onCancel,
  isSaving,
}: TemplateFormProps) {
  // Update editor content when formData.content changes
  useEffect(() => {
    if (editor && formData.content !== editor.getHTML()) {
      editor.commands.setContent(formData.content);
    }
  }, [formData.content, editor]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Template Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onFormDataChange({ name: e.target.value })}
          className="w-full rounded-lg border border-border  -elevated px-4 py-2 text-text-primary focus:border-accent focus:outline-none"
          placeholder="My Custom Template"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Icon
          </label>
          <input
            type="text"
            value={formData.icon}
            onChange={(e) => onFormDataChange({ icon: e.target.value })}
            className="w-full rounded-lg border border-border  -elevated px-4 py-2 text-text-primary focus:border-accent focus:outline-none"
            placeholder="FileText"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Color
          </label>
          <input
            type="text"
            value={formData.color}
            onChange={(e) => onFormDataChange({ color: e.target.value })}
            className="w-full rounded-lg border border-border  -elevated px-4 py-2 text-text-primary focus:border-accent focus:outline-none"
            placeholder="#5a8a7d"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => onTagsInputChange(e.target.value)}
          className="w-full rounded-lg border border-border  -elevated px-4 py-2 text-text-primary focus:border-accent focus:outline-none"
          placeholder="Work, Meeting, Project"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Content
        </label>
        {editor && <Toolbar className="mb-2" editor={editor} />}

        <EditorContent
          className="h-full min-h-[300px] rounded-lg border border-border  -elevated/30 p-4 focus:outline-none"
          editor={editor}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover: -elevated hover:text-text-primary"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Save Template"}
        </button>
      </div>
    </div>
  );
}
