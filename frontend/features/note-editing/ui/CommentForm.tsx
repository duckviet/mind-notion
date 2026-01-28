import { Button } from "@/shared/components/ui/button";
import { Send, X } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
        "p-4 bg-accent/80 rounded-lg border border-border",
        className,
      )}
    >
      <div className="space-y-3">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={1000}
          rows={3}
          className="w-full min-h-[200px] px-3 py-2 bg-accent-50  border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none text-sm"
          autoFocus
        />
        <div className="flex items-end justify-between">
          <span className="text-xs text-text-muted">{value.length}/1000</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={isLoading || !value.trim()}
            >
              <Send className="w-4 h-4 mr-1" />
              {submitLabel}
            </Button>
            <Button size="sm" onClick={onCancel}>
              Cancel
            </Button>
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
