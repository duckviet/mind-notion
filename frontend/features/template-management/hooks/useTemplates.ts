import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListTemplates as useGeneratedListTemplates,
  createTemplate as apiCreateTemplate,
  updateTemplate as apiUpdateTemplate,
  deleteTemplate as apiDeleteTemplate,
  CreateTemplateBody,
  UpdateTemplateBody,
  getListTemplatesQueryKey,
} from "@/shared/services/generated/api";

export function useTemplates() {
  const queryClient = useQueryClient();
  const queryKey = getListTemplatesQueryKey();

  // Fetch user templates
  const templatesQuery = useGeneratedListTemplates({
    query: {
      retry: false,
    },
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTemplateBody) => apiCreateTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey,
      });
    },
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTemplateBody;
    }) => await apiUpdateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey,
      });
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey,
      });
    },
  });

  return {
    // Query
    templates: templatesQuery.data?.templates || [],
    isLoading: templatesQuery.isLoading,
    isError: templatesQuery.isError,
    error: templatesQuery.error,

    // Mutations
    createTemplate: createMutation.mutateAsync,
    updateTemplate: updateMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
