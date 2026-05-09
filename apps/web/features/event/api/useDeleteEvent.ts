import { deleteEvent } from "@/shared/services/generated/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateEventCollections } from "@/shared/hooks/query-invalidations";

type DeleteVars = { id: string };

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id }: DeleteVars) => deleteEvent(id as any),
    onSuccess: async () => {
      toast.success("Event deleted");
      await invalidateEventCollections(queryClient);
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message || "Failed to delete event");
    },
  });

  return mutation;
};
