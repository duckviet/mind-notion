import { Button } from "@/shared/components/ui/button";
import { Edit2, Trash2, MessageSquare } from "lucide-react"; // Đổi ChevronUp thành MessageSquare cho Reply
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
  onReply?: (parentId: string) => void;
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

  return (
    <div
      className={cn(
        "relative my-4",
        // Thread line: chỉ hiển thị border-left cho replies (depth > 0)
        depth > 0 && "ml-3 md:ml-6 border-l-2 border-slate-200 pl-3 md:pl-4",
      )}
    >
      {/* Main Comment Block */}
      <div
        className={cn(
          "group relative",
          // Highlight khi active nhưng nhẹ nhàng, không shadow nặng
          isActive && "-translate-x-2",
        )}
      >
        <div className="flex flex-col w-full dark:bg-surface-50 bg-accent-50 border border-transparent dark:border-border p-2 rounded-lg">
          {/* Header */}
          <div className="relative mb-2">
            <div className="flex items-baseline gap-2 ">
              <span className="font-semibold text-[14px] text-slate-800">
                {comment.user_name}faefe
              </span>
              <span className="text-[12px] text-slate-400">
                {formatDate(comment?.created_at || "")}
              </span>
            </div>

            {/* Actions: Reply, Edit, Delete - Hiển thị dưới dạng text links nhỏ hoặc icons */}
            {!isEditing && (
              <div className="absolute bg-accent-50 dark:bg-surface-50 shadow-sm p-1 rounded-md right-0 top-0 flex items-center gap-1  opacity-0 group-hover:opacity-100 transition-opacity">
                {onReply && (
                  <button
                    className="p-0.5 hover:bg-accent-500/20 rounded-sm"
                    onClick={() => onReply(comment.id)}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
                <button
                  className="p-0.5 hover:bg-accent-500/20 rounded-sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  className="p-0.5 hover:bg-accent-500/20 rounded-sm"
                  onClick={() => onDelete(comment.id)}
                >
                  <Trash2 className="w-4 h-4" />
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
                <p className="text-[14px] leading-relaxed text-slate-700 break-words whitespace-pre-wrap">
                  {comment.content}
                </p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Toggle Replies - Đặt ngay dưới comment, trước replies */}
      {hasReplies && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="my-2 text-[13px] font-medium text-text-primary hover:text-text-primary/70 flex items-center gap-1.5 transition-colors ml-0"
        >
          {isExpanded
            ? "Hide Replies"
            : `Show ${comment.replies?.length} replies`}
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
            <div className="pt-1">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommentItem;
