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
} from "lucide-react";

import type { Template } from "./templates";
import { defaultTemplates } from "./templates";
import Portal from "@/shared/components/PortalModal/PortalModal";

type TemplatesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
  templates?: Template[];
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
  templates = defaultTemplates,
}: TemplatesModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Portal>
          <>
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="fixed left-1/2 top-1/2 z-50 w-[900px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl"
            >
              {/* Minimal Header */}
              <div className="flex items-center justify-between px-8 py-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-black">
                    Choose a Template
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Select a starting point for your project
                  </p>
                </div>
                <motion.button
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-black transition-colors hover:bg-black hover:text-white"
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Grid Content */}
              <div className="grid max-h-[600px] grid-cols-2 gap-4 overflow-y-auto p-8 pt-2 md:grid-cols-3">
                {templates.map((template, index) => {
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
                      className="group flex   items-start justify-between gap-4 rounded-[1.5rem] border border-gray-100 bg-gray-50/50 p-6 text-left transition-all  hover:shadow-lg"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-black shadow-sm transition-colors group-hover:bg-white/10 group-hover:text-white">
                        <Icon />
                      </div>

                      <div className="w-full">
                        <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-white">
                          {template.name}
                        </h3>
                        {template.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {template.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors 
                                
                                -hover:border-transparent group-hover:bg-white/20 group-hover:text-white"
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
        </Portal>
      )}
    </AnimatePresence>
  );
}
