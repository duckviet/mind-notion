import { deleteEvent } from "@/shared/services/generated/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type DeleteVars = { id: string };

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id }: DeleteVars) => deleteEvent(id as any),
    onSuccess: () => {
      toast.success("Event deleted");
      queryClient.invalidateQueries({ queryKey: ["/events"] });
      queryClient.invalidateQueries({ queryKey: ["/events/list"] });
      queryClient.invalidateQueries({ queryKey: ["/events/range"] });
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message || "Failed to delete event");
    },
  });

  return mutation;
};
