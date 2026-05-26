import { Button } from "@/shared/components/ui/button";
import { ArrowUp, ArrowUpIcon, Send, X, XIcon } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Textarea } from "@/shared/components/ui/textarea";

interface CommentFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  placeholder?: string;
  submitLabel?: string;
  isEditing?: boolean;
  showMotion?: boolean;
  className?: string;
}

const CommentForm = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  isLoading,
  placeholder = "Share your thoughts...",
  submitLabel = "Send",
  isEditing = false,
  showMotion = true,
  className,
}: CommentFormProps) => {
  const content = (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        className,
      )}
    >
      <div className="space-y-3">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={1000}
          rows={3}
          style={{
            scrollbarGutter: "stable",
          }}
          className="max-h-[300px] w-full resize-none overflow-y-auto rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 dark:bg-surface"
          autoFocus
        />
        <div className="flex items-end justify-between">
          <span className="text-xs text-text-muted">{value.length}/1000</span>
          <div className="flex gap-2">
            <button
              className="m-0 rounded-full bg-accent p-2 hover:bg-muted-hover"
              onClick={onCancel}
            >
              <XIcon width={14} height={14} />
            </button>
            <button
              onClick={onSubmit}
              disabled={isLoading || !value.trim()}
              className="m-0 rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <ArrowUpIcon width={14} height={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!showMotion) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -20 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      exit={{ opacity: 0, height: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mb-6 overflow-hidden"
    >
      {content}
    </motion.div>
  );
};

export default CommentForm;
