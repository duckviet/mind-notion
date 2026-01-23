"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  CheckSquare,
  Lightbulb,
  Calendar,
  Code,
  ListTodo,
  Briefcase,
  Plus,
} from "lucide-react";
import { useMemo } from "react";

import type { Template } from "./templates";
import { defaultTemplates } from "./templates";
import Portal from "@/shared/components/PortalModal/PortalModal";
import { useTemplates } from "@/features/template-management/hooks/useTemplates";

type TemplatesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
  onManageTemplates?: () => void;
};

const iconMap: Record<
  Template["icon"],
  React.ComponentType<{ size?: number; className?: string }>
> = {
  FileText,
  CheckSquare,
  Lightbulb,
  Calendar,
  Code,
  ListTodo,
  Briefcase,
};

export function TemplatesModal({
  isOpen,
  onClose,
  onSelectTemplate,
  onManageTemplates,
}: TemplatesModalProps) {
  const { templates: userTemplates, isLoading } = useTemplates();

  // Combine default templates with user templates
  const allTemplates = useMemo(() => {
    const userTemplateMapped: Template[] = (userTemplates || []).map((t) => ({
      id: t.id,
      name: t.name,
      icon: t.icon as Template["icon"],
      content: t.content,
      tags: t.tags || [],
      color: t.color,
    }));

    return [...defaultTemplates, ...userTemplateMapped];
  }, [userTemplates]);

  return (
    <Portal lockScroll={isOpen}>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={onClose}
            />
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="fixed left-1/2 top-1/2 z-50 w-[900px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[1.5rem] border border-border bg-card   shadow-2xl"
            >
              {/* Minimal Header */}
              <div className="flex items-center justify-between px-8 py-6 ">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-text-primary">
                    Choose a Template
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">
                    {isLoading
                      ? "Loading templates..."
                      : `${allTemplates.length} templates available`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onManageTemplates && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onManageTemplates}
                      className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent-50"
                    >
                      <Plus size={16} />
                      Create Template
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="flex h-10 w-10 items-center justify-center rounded-full  -elevated text-text-primary transition-colors hover:bg-destructive hover:text-white"
                  >
                    <X size={20} />
                  </motion.button>
                </div>
              </div>

              {/* Grid Content */}
              <div className="grid max-h-[600px] grid-cols-2 gap-4 overflow-y-auto p-8 pt-2 md:grid-cols-3">
                {allTemplates.map((template, index) => {
                  const Icon = iconMap[template.icon] ?? FileText;

                  return (
                    <motion.button
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onSelectTemplate(template);
                        onClose();
                      }}
                      className="group flex flex-col items-start justify-between gap-4 rounded-[1rem] border border-border  -elevated/30 p-4 text-left transition-all hover:border-accent/50 hover:shadow-lg hover: -elevated/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg   text-accent shadow-sm transition-colors group-hover:bg-accent group-hover:text-white">
                          <Icon />
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary transition-colors">
                          {template.name}
                        </h3>
                      </div>

                      <div className="w-full">
                        {template.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {template.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-xl border border-border   px-2.5 py-1 text-[11px] font-medium text-text-secondary transition-colors group-hover:border-accent/20"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
}
