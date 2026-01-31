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
        "p-4 bg-accent/80 rounded-lg border border-border",
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
          className="w-full max-h-[300px] overflow-y-auto  focus:ring-none focus:border-none px-3 py-2 bg-accent-50  border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none text-sm border-none"
          autoFocus
        />
        <div className="flex items-end justify-between">
          <span className="text-xs text-text-muted">{value.length}/1000</span>
          <div className="flex gap-2">
            <button
              className="rounded-full bg-accent-50 hover:bg-accent-100 m-0 p-2"
              onClick={onCancel}
            >
              <XIcon width={14} height={14} />
            </button>
            <button
              onClick={onSubmit}
              disabled={isLoading || !value.trim()}
              className="rounded-full bg-accent-50 hover:bg-accent-100 m-0 p-2"
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
