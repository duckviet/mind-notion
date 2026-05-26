import { Button } from "@/shared/components/ui/button";
import { Edit2, Trash2, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CommentForm from "./CommentForm";
import { cn } from "@/lib/utils";
import { formatDate } from "@/shared/utils/date-format";
import { Comment } from "@/shared/services/generated/api";

interface CommentItemProps {
  comment: Comment;
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReply?: (content: string, parentId: string) => Promise<void> | void;
  isLoading?: boolean;
  editing?: boolean;
  isActive?: boolean;
  depth?: number;
}

const CommentItem = ({
  comment,
  onUpdate,
  onDelete,
  onReply,
  isLoading,
  editing = false,
  isActive = false,
  depth = 0,
}: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(editing || false);
  const [editContent, setEditContent] = useState(comment.content || "");
  const [isExpanded, setIsExpanded] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    await onUpdate(comment.id, editContent.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(comment.content || "");
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || !onReply) return;
    await onReply(replyContent.trim(), comment.id);
    setReplyContent("");
    setIsReplying(false);
  };

  const handleReplyCancel = () => {
    setIsReplying(false);
    setReplyContent("");
  };

  return (
    <div
      className={cn(
        "relative my-1 mb-2",
        // Thread line: chỉ hiển thị border-left cho replies (depth > 0)
        depth > 0 && "ml-3 border-l-2 border-border/60 pl-3 md:ml-6 md:pl-4",
      )}
    >
      {/* Main Comment Block */}
      <div className="group relative transition-all duration-200">
        <div
          className={cn(
            "flex dark:bg-surface-50 bg-card w-full flex-col rounded-xl border border-border p-3.5 transition-all duration-200",
            isActive
              ? "shadow-sm"
              : "hover:border-border-strong",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-text-primary">
                {comment.user_name}
              </span>
              <span className="text-[11px] text-text-muted">
                {formatDate(comment?.created_at || "")}
              </span>
            </div>

            {/* Actions: Reply, Edit, Delete */}
            {!isEditing && (
              <div className="flex items-center gap-1 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                {onReply && (
                  <button
                    className="rounded-md p-1 hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
                    onClick={() => setIsReplying(!isReplying)}
                    title="Reply"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  className="rounded-md p-1 hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
                  onClick={() => setIsEditing(true)}
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  className="rounded-md p-1 hover:bg-surface-hover text-text-muted hover:text-destructive transition-colors"
                  onClick={() => onDelete(comment.id)}
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className={cn("", !isEditing && "min-h-[24px]")}>
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="mt-1"
                >
                  <CommentForm
                    value={editContent}
                    onChange={setEditContent}
                    onSubmit={handleUpdate}
                    onCancel={handleCancel}
                    isLoading={!!isLoading}
                    placeholder="Edit your comment..."
                    submitLabel="Save"
                    className="p-0 border-none bg-transparent"
                    showMotion={false}
                  />
                </motion.div>
              ) : (
                <p className="break-words whitespace-pre-wrap text-[14px] leading-relaxed text-text-secondary">
                  {comment.content}
                </p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Inline Reply Form */}
      <AnimatePresence mode="wait">
        {isReplying && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -5 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -5 }}
            className="mt-2 ml-4 pl-2 border-l border-border/60"
          >
            <CommentForm
              value={replyContent}
              onChange={setReplyContent}
              onSubmit={handleReplySubmit}
              onCancel={handleReplyCancel}
              isLoading={!!isLoading}
              placeholder="Write a reply..."
              submitLabel="Reply"
              className="p-3 border-none bg-surface-100 dark:bg-surface-50"
              showMotion={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Replies */}
      {hasReplies && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-[12px] font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors ml-2"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Hide replies
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Show {comment.replies?.length} replies
            </>
          )}
        </button>
      )}

      {/* Nested Replies */}
      <AnimatePresence>
        {isExpanded && hasReplies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {comment.replies!.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onReply={onReply}
                isLoading={isLoading}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommentItem;
