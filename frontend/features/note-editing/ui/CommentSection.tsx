import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Plus, Send, Trash2, Edit2, X } from "lucide-react";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComments } from "@/features/note-editing/hooks/useComments";
import CommentForm from "./CommentForm";

interface CommentSectionProps {
  noteId: string;
}

const CommentSection = ({ noteId }: CommentSectionProps) => {
  const { comments, isLoading, addComment, updateComment, deleteComment } =
    useComments(noteId);
  const [isAdding, setIsAdding] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment.trim());
    setNewComment("");
    setIsAdding(false);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    await updateComment({ commentId, content: editContent.trim() });
    setEditingId(null);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    await deleteComment(commentId);
  };

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

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Comments {comments.length > 0 && <>({comments.length})</>}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsAdding(!isAdding)}
          className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
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
            }}
            isLoading={isLoading}
            placeholder="Share your thoughts..."
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
              <p className="text-gray-400 text-sm">
                No comments yet. Be the first to share your thoughts!
              </p>
            </motion.div>
          ) : (
            comments.map((comment: any) => (
              <motion.div
                key={comment.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group relative flex gap-3 p-4 rounded-lg hover:border-gray-300 bg-gray-50 transition-all"
              >
                {/* Avatar */}
                {/* <div className="flex-shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-gradient-to-br from-blue-300 to-blue-600 text-xs font-semibold"
                  >
                    {getUserInitials(comment.user_name || "U")}
                  </motion.div>
                </div> */}

                {/* Content */}
                <div className="w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm text-gray-900">
                      {comment.user_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment?.created_at || "")}
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    {editingId === comment.id ? (
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
                          onSubmit={() => handleUpdateComment(comment.id || "")}
                          onCancel={() => setEditingId(null)}
                          isLoading={isLoading}
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
                        className="text-sm text-gray-700 break-words"
                      >
                        {comment.content}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                {editingId !== comment.id && (
                  <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => {
                        setEditingId(comment.id || "");
                        setEditContent(comment.content || "");
                      }}
                      title="Edit comment"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteComment(comment.id || "")}
                      title="Delete comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CommentSection;
