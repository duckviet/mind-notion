import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createComment,
  listComments,
  updateComment,
  deleteComment,
  ListComments200,
} from "@/shared/services/generated/api";
import { toast } from "sonner";

const commentKeys = {
  list: (noteId: string) => ["comments", noteId] as const,
};

export function useComments(noteId: string) {
  const queryClient = useQueryClient();

  const commentsQuery = useQuery<ListComments200>({
    queryKey: commentKeys.list(noteId),
    queryFn: () => listComments(noteId),
    enabled: Boolean(noteId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: commentKeys.list(noteId) });

  const addCommentMutation = useMutation({
    mutationFn: (payload: { content: string; parentId?: string }) =>
      createComment(noteId, {
        content: payload.content,
        parent_id: payload.parentId,
      }),
    onSuccess: async () => {
      toast.success("Comment added");
      await invalidate();
    },
    onError: () => toast.error("Failed to add comment"),
  });

  const updateCommentMutation = useMutation({
    mutationFn: (payload: { commentId: string; content: string }) =>
      updateComment(noteId, payload.commentId, { content: payload.content }),
    onSuccess: async (res) => {
      toast.success("Comment updated");
      console.log("Updated comment response:", res);
      await invalidate();
    },
    onError: () => toast.error("Failed to update comment"),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(noteId, commentId),
    onSuccess: async () => {
      toast.success("Comment deleted");
      await invalidate();
    },
    onError: () => toast.error("Failed to delete comment"),
  });

  return {
    comments: commentsQuery.data?.comments ?? [],
    isLoading: commentsQuery.isLoading,
    isFetching: commentsQuery.isFetching,
    refetch: commentsQuery.refetch,
    addComment: addCommentMutation.mutateAsync,
    updateComment: updateCommentMutation.mutateAsync,
    deleteComment: deleteCommentMutation.mutateAsync,
    adding: addCommentMutation.isPending,
    updating: updateCommentMutation.isPending,
    deleting: deleteCommentMutation.isPending,
  };
}
