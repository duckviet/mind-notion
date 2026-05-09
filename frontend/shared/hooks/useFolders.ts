import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListFolders as useGeneratedListFolders,
  useGetFolder as useGeneratedGetFolder,
  createFolder as apiCreateFolder,
  updateFolder as apiUpdateFolder,
  deleteFolder as apiDeleteFolder,
  addNoteToFolder as apiAddNoteToFolder,
  ReqCreateFolder,
  ReqUpdateFolder,
  ReqAddNote,
  ListFoldersParams,
} from "@/shared/services/generated/api";
import {
  invalidateFoldersAfterAddNote,
  invalidateFoldersAfterCreate,
  invalidateFoldersAfterDelete,
  invalidateFoldersAfterUpdate,
} from "./query-invalidations";

export type ListFoldersParamsInput = {
  limit?: number;
  offset?: number;
  parent_id?: string;
};

export function useFolders(
  params: ListFoldersParamsInput = { limit: 50, offset: 0 }
) {
  const stableParams: ListFoldersParams = params;
  const queryClient = useQueryClient();
  const foldersQuery = useGeneratedListFolders(stableParams, {
    query: {
      retry: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ReqCreateFolder) => apiCreateFolder(data),
    onSuccess: async () => {
      await invalidateFoldersAfterCreate(queryClient);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReqUpdateFolder }) =>
      await apiUpdateFolder(id, data),
    onSuccess: async (_data, variables) => {
      await invalidateFoldersAfterUpdate(queryClient, variables.id);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteFolder(id),
    onSuccess: async (_data, variables) => {
      await invalidateFoldersAfterDelete(queryClient, variables);
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({
      folderId,
      data,
    }: {
      folderId: string;
      data: ReqAddNote;
    }) => await apiAddNoteToFolder(folderId, data),
    onSuccess: async (_data, variables) => {
      await invalidateFoldersAfterAddNote(
        queryClient,
        variables.folderId  ,
        variables.data.note_id,
      );
    },
  });

  const refetch = foldersQuery.refetch;

  return {
    // List data
    folders: foldersQuery.data?.folders ?? [],
    total: foldersQuery.data?.total ?? 0,
    isLoading: foldersQuery.isLoading,
    isError: foldersQuery.isError,
    error: foldersQuery.error,
    refetch,

    // Mutations
    createFolder: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateFolder: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    deleteFolder: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    addNoteToFolder: addNoteMutation.mutateAsync,
    isAddingNote: addNoteMutation.isPending,
  };
}

export function useFolder(folderId: string) {
  const queryClient = useQueryClient();

  const folderQuery = useGeneratedGetFolder(folderId, {
    query: {
      retry: false,
      enabled: !!folderId,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ReqUpdateFolder) =>
      await apiUpdateFolder(folderId, data),
    onSuccess: async () => {
      await invalidateFoldersAfterUpdate(queryClient, folderId);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiDeleteFolder(folderId),
    onSuccess: async () => {
      await invalidateFoldersAfterDelete(queryClient, folderId);
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (data: ReqAddNote) =>
      await apiAddNoteToFolder(folderId, data),
    onSuccess: async (_data, variables) => {
      await invalidateFoldersAfterAddNote(
        queryClient,
        folderId,
        variables.note_id,
      );
    },
  });

  const refetch = folderQuery.refetch;

  return {
    // Folder data
    folder: folderQuery.data ?? null,
    isLoading: folderQuery.isLoading,
    isError: folderQuery.isError,
    error: folderQuery.error,
    refetch,

    // Mutations
    updateFolder: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    deleteFolder: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    addNoteToFolder: addNoteMutation.mutateAsync,
    isAddingNote: addNoteMutation.isPending,
  };
}
