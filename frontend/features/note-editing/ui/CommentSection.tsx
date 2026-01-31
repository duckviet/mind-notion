import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Plus, X } from "lucide-react";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComments } from "@/features/note-editing/hooks/useComments";
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
  const [isAdding, setIsAdding] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null,
  );
  const [newComment, setNewComment] = useState("");

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment({
      content: newComment.trim(),
      parentId: replyingTo || undefined,
    });
    setNewComment("");
    setIsAdding(false);
    setReplyingTo(null);
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    setIsAdding(true);
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
        <h3 className="text-lg font-semibold text-text-primary">
          Comments {comments.length > 0 && <>({comments.length})</>}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsAdding(!isAdding)}
          className="text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
        >
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </Button>
      </div>

      {/* Add comment form */}
      <AnimatePresence mode="wait">
        {isAdding && (
          <CommentForm
            value={newComment}
            onChange={setNewComment}
            onSubmit={handleAddComment}
            onCancel={() => {
              setIsAdding(false);
              setNewComment("");
              setReplyingTo(null);
            }}
            isLoading={isLoading}
            placeholder={
              replyingTo ? "Write a reply..." : "Share your thoughts..."
            }
            submitLabel="Send"
          />
        )}
      </AnimatePresence>

      {/* Comments list */}
      <div className="flex-1 space-y-4">
        <AnimatePresence>
          {comments.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <p className="text-text-muted text-sm">
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
