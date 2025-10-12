import React from "react";
import { motion } from "framer-motion";
import { Search, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  type: "search" | "new" | "no-results";
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const emptyStateConfig = {
  search: {
    icon: Search,
    title: "Start typing to discover your saved content",
    description: "Search through your notes, articles, and saved links",
    color: "text-accent-blue",
  },
  new: {
    icon: Plus,
    title: "Ready to capture your first memory ✨",
    description: "Add your first note, save an article, or bookmark a link",
    color: "text-green-500",
  },
  "no-results": {
    icon: Search,
    title: "No matches found",
    description: "Try different keywords or check your spelling",
    color: "text-text-muted",
  },
};

export default function EmptyState({
  type,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className={cn(
          "w-16 h-16 rounded-full glass-bg flex items-center justify-center mb-6",
          "shadow-glass-md border border-glass-border"
        )}
      >
        <Icon className={cn("w-8 h-8", config.color)} />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-xl font-semibold text-text-primary mb-2"
      >
        {title || config.title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="text-text-secondary mb-6 max-w-md leading-relaxed"
      >
        {description || config.description}
      </motion.p>

      {action && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className={cn(
            "px-6 py-3 glass-bg rounded-glass shadow-glass-md border border-glass-border",
            "text-text-primary font-medium transition-all duration-200",
            "hover:shadow-glass-lg hover:border-accent-blue",
            "focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2"
          )}
        >
          {action.label}
        </motion.button>
      )}

      {type === "search" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-8 flex items-center gap-2 text-sm text-text-muted"
        >
          <Sparkles className="w-4 h-4" />
          <span>Try searching for "react", "notes", or "articles"</span>
        </motion.div>
      )}
    </motion.div>
  );
}
