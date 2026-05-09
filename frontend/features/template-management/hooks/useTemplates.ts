import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useListTemplates as useGeneratedListTemplates,
  createTemplate as apiCreateTemplate,
  updateTemplate as apiUpdateTemplate,
  deleteTemplate as apiDeleteTemplate,
  CreateTemplateMutationBody,
  UpdateTemplateMutationBody,
} from "@/shared/services/generated/api";
import { invalidateTemplateLists } from "@/shared/hooks/query-invalidations";

export function useTemplates() {
  const queryClient = useQueryClient();

  // Fetch user templates
  const templatesQuery = useGeneratedListTemplates({
    query: {
      retry: false,
    },
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTemplateMutationBody) => apiCreateTemplate(data),
    onSuccess: async () => {
      await invalidateTemplateLists(queryClient);
    },
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTemplateMutationBody;
    }) => await apiUpdateTemplate(id, data),
    onSuccess: async () => {
      await invalidateTemplateLists(queryClient);
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteTemplate(id),
    onSuccess: async () => {
      await invalidateTemplateLists(queryClient);
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
