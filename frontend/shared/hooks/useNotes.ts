import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListNotes as useGeneratedListNotes,
  createNote as apiCreateNote,
  updateNote as apiUpdateNote,
  deleteNote as apiDeleteNote,
  ReqCreateNote,
  ReqUpdateNote,
  getListNotesQueryKey,
  ResDetailNote,
} from "@/shared/services/generated/api";
import { useEffect, useState } from "react";

export type ListParams = {
  limit?: number;
  offset?: number;
};

export function useNotes(params: ListParams = { limit: 50, offset: 0 }) {
  const [notes, setNotes] = useState<ResDetailNote[]>([]);
  const queryClient = useQueryClient();
  const queryKey = getListNotesQueryKey(params);
  // Chỉ wrap generated hook - đơn giản và mạnh mẽ
  const notesQuery = useGeneratedListNotes(params);

  useEffect(() => {
    setNotes(notesQuery.data?.notes ?? []);
  }, [notesQuery.data?.notes]);

  // Mutations đơn giản với automatic invalidation
  const createMutation = useMutation({
    mutationFn: (data: ReqCreateNote) => apiCreateNote(data),
    // Automatic invalidation - không cần manual queryKey
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey, // Chỉ cần predicate broad
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReqUpdateNote }) =>
      apiUpdateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiDeleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });

  // Thêm refetch
  const refetch = notesQuery.refetch;

  return {
    // List data
    notes,
    setNotes,
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

    deleteNote: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
