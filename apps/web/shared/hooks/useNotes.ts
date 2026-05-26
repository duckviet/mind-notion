import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListNotes,
  createNote as apiCreateNote,
  updateNote as apiUpdateNote,
  deleteNote as apiDeleteNote,
  ReqCreateNote,
  ReqUpdateNote,
} from "@/shared/services/generated/api";
import {
  invalidateNotesAfterCreate,
  invalidateNotesAfterDelete,
  invalidateNotesAfterUpdate,
  invalidateNotesAndFoldersAfterMove,
} from "./query-invalidations";

export type ListParams = {
  limit?: number;
  offset?: number;
  query?: string;
  folder_id?: string;
};

export function useNotes(
  params: ListParams = { limit: 50, offset: 0, query: "", folder_id: "" },
) {
  const queryClient = useQueryClient();
  // Chỉ wrap generated hook - đơn giản và mạnh mẽ
  const notesQuery = useListNotes(params, {
    query: {
      retry: false,
    },
  });

  // Mutations đơn giản với automatic invalidation
  const createMutation = useMutation({
    mutationFn: (data: ReqCreateNote) => apiCreateNote(data),
    // Automatic invalidation - không cần manual queryKey
    onSuccess: async () => {
      await invalidateNotesAfterCreate(queryClient);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReqUpdateNote }) =>
      apiUpdateNote(id, data),
    onSuccess: async (_data, variables) => {
      await invalidateNotesAfterUpdate(queryClient, variables.id);
    },
  });

  const moveToFolderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReqUpdateNote }) =>
      apiUpdateNote(id, data),
    onSuccess: async (_data, variables) => {
      await invalidateNotesAndFoldersAfterMove(queryClient, variables.id);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiDeleteNote,
    onSuccess: async () => {
      await invalidateNotesAfterDelete(queryClient);
    },
  });

  // Thêm refetch
  const refetch = notesQuery.refetch;

  return {
    // List data
    notes: notesQuery.data?.notes ?? [],
    total: notesQuery.data?.total ?? 0,
    isLoading: notesQuery.isLoading,
    isError: notesQuery.isError,
    error: notesQuery.error,
    refetch,

    // Mutations
    createNote: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateNote: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    moveNoteToFolder: moveToFolderMutation.mutateAsync,
    isMovingNoteToFolder: moveToFolderMutation.isPending,

    deleteNote: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
