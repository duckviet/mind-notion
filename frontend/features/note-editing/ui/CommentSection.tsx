import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Plus, Send, Trash2, Edit2, X } from "lucide-react";
import React, { useState } from "react";
import { useComments } from "../hooks/useComments";

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

  // Add comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    await addComment(newComment.trim());
    setNewComment("");
    setIsAdding(false);
  };

  // Update comment
  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    await updateComment({ commentId, content: editContent.trim() });
    setEditingId(null);
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    await deleteComment(commentId);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-gray-500 text-lg font-medium">
          Comments ({comments.length})
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsAdding(!isAdding)}
          className="cursor-pointer text-gray-600 hover:text-gray-800"
        >
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </Button>
      </div>

      {/* Add comment form */}
      {isAdding && (
        <div className="mb-4 space-y-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full"
            maxLength={1000}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={isLoading || !newComment.trim()}
            >
              <Send className="w-4 h-4 mr-1" />
              Send
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setNewComment("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="flex flex-col gap-3">
        {comments.length === 0 ? (
          <span className="text-center text-gray-400 text-sm mt-3 bg-gray-50 rounded-md p-4">
            No comments yet
          </span>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gray-50 rounded-md p-3 space-y-2"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.user_name}
                    </span>
                    {/* <span className="text-xs text-gray-400">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span> */}
                  </div>
                  {editingId === comment.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full"
                        maxLength={1000}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateComment(comment?.id || "")}
                          disabled={isLoading}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  )}
                </div>
                {editingId !== comment.id && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setEditingId(comment?.id || "");
                        setEditContent(comment?.content || "");
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteComment(comment?.id || "")}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
