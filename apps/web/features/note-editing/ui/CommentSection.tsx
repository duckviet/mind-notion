import { MessageSquare } from "lucide-react";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComments } from "../hooks/useComments";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog/ConfirmDialog";

interface CommentSectionProps {
  noteId: string;
  activeCommentId?: string | null;
}

const CommentSection = ({ noteId, activeCommentId }: CommentSectionProps) => {
  const { comments, isLoading, addComment, updateComment, deleteComment } =
    useComments(noteId);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null,
  );
  const [newComment, setNewComment] = useState("");

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment({
      content: newComment.trim(),
    });
    setNewComment("");
  };

  const handleReply = async (content: string, parentId: string) => {
    await addComment({
      content,
      parentId,
    });
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    await updateComment({ commentId, content });
  };

  const handleDeleteComment = async (commentId: string) => {
    setSelectedCommentId(commentId);
  };
  const handleConfirmDeleteComment = async () => {
    await deleteComment(selectedCommentId || "");
    setSelectedCommentId(null);
  };
  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-serif text-heading font-normal text-text-primary">
          Comments {comments.length > 0 && <>({comments.length})</>}
        </h3>
      </div>

      {/* Add comment form */}
      <CommentForm
        value={newComment}
        onChange={setNewComment}
        onSubmit={handleAddComment}
        onCancel={() => setNewComment("")}
        isLoading={isLoading}
        placeholder="Share your thoughts..."
        submitLabel="Send"
        showMotion={false}
        className="mb-4"
      />

      {/* Comments list */}
      <div className="flex-1 space-y-4">
        <AnimatePresence>
          {comments.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 px-4 flex flex-col items-center justify-center"
            >
              <div className="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5 text-text-muted" />
              </div>
              <p className="text-text-muted text-xs leading-relaxed max-w-[200px]">
                No comments yet. Be the first to share your thoughts!
              </p>
            </motion.div>
          ) : (
            comments.map((comment: any) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onUpdate={(id, content) => handleUpdateComment(id, content)}
                onDelete={() => handleDeleteComment(comment.id || "")}
                onReply={handleReply}
                isLoading={isLoading}
                isActive={comment.id === activeCommentId}
              />
            ))
          )}
        </AnimatePresence>
      </div>
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!selectedCommentId}
        onOpenChange={(open) => !open && setSelectedCommentId(null)}
        onConfirm={handleConfirmDeleteComment}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
      />
    </div>
  );
};

export default CommentSection;
