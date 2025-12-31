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
      className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
    >
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{template.name}</h3>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {template.tags?.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(template)}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-blue-600"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={() => onDelete(template.id)}
          disabled={isDeleting}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-red-600 disabled:opacity-50"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
}
