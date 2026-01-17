import { Button } from "@/shared/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CommentForm from "./CommentForm";

interface CommentItemProps {
  comment: any;
  onUpdate: (content: string) => Promise<void>;
  onDelete: () => Promise<void>;
  isLoading?: boolean;
}

const formatDate = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
};

const CommentItem = ({
  comment,
  onUpdate,
  onDelete,
  isLoading,
}: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || "");

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    await onUpdate(editContent.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(comment.content || "");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative flex gap-3 p-4 rounded-lg hover:border-border bg-surface transition-all"
    >
      {/* Content */}
      <div className="w-full">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-sm text-text-primary">
            {comment.user_name}
          </span>
          <span className="text-xs text-text-muted">
            {formatDate(comment?.created_at || "")}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 mt-2 overflow-hidden"
            >
              <CommentForm
                value={editContent}
                onChange={setEditContent}
                onSubmit={handleUpdate}
                onCancel={handleCancel}
                isLoading={!!isLoading}
                placeholder="Edit your comment..."
                submitLabel="Save"
                showMotion={false}
              />
            </motion.div>
          ) : (
            <motion.p
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-text-secondary break-words"
            >
              {comment.content}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-text-muted hover:text-accent hover:bg-accent/10"
            onClick={() => {
              setIsEditing(true);
              setEditContent(comment.content || "");
            }}
            title="Edit comment"
          >
            <Edit2 className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-text-muted hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
            title="Delete comment"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default CommentItem;
