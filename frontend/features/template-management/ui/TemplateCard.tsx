"use client";

import { motion } from "framer-motion";
import { Edit2, Trash2 } from "lucide-react";
import type { TemplateResponse } from "../types/template";

type TemplateCardProps = {
  template: TemplateResponse;
  onEdit: (template: TemplateResponse) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function TemplateCard({
  template,
  onEdit,
  onDelete,
  isDeleting,
}: TemplateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between rounded-lg border border-border p-4 hover:border-accent/40 bg-surface-elevated/30 transition-colors"
    >
      <div className="flex-1">
        <h3 className="font-semibold text-text-primary">{template.name}</h3>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {template.tags?.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-surface-elevated px-2 py-0.5 text-xs text-text-secondary border border-border"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(template)}
          className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-elevated hover:text-accent"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={() => onDelete(template.id)}
          disabled={isDeleting}
          className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-elevated hover:text-destructive disabled:opacity-50"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
}
