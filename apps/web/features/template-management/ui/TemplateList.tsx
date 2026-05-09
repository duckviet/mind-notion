"use client";

import { TemplateCard } from "./TemplateCard";
import type { TemplateResponse } from "../types/template";

type TemplateListProps = {
  templates: TemplateResponse[];
  isLoading: boolean;
  isDeleting: boolean;
  onEdit: (template: TemplateResponse) => void;
  onDelete: (id: string) => void;
};

export function TemplateList({
  templates,
  isLoading,
  isDeleting,
  onEdit,
  onDelete,
}: TemplateListProps) {
  if (isLoading) {
    return <p className="text-center text-text-muted">Loading templates...</p>;
  }

  if (templates.length === 0) {
    return (
      <p className="text-center text-text-muted">
        No custom templates yet. Create your first one!
      </p>
    );
  }

  return (
    <div className="space-y-3 bg-card">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      ))}
    </div>
  );
}
