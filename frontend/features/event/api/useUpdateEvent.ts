import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateEvent,
  type ReqUpdateEvent,
} from "@/shared/services/generated/api";
import { toast } from "sonner";

type UpdateVars = { id: string; data: ReqUpdateEvent };

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    // backend uses string UUID; generated path expects number, cast to any to satisfy client typing
    mutationFn: ({ id, data }: UpdateVars) => updateEvent(id, data),
    onSuccess: () => {
      toast.success("Event updated");
      queryClient.invalidateQueries({ queryKey: ["/events"] });
      queryClient.invalidateQueries({ queryKey: ["/events/list"] });
      queryClient.invalidateQueries({ queryKey: ["/events/range"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update event");
    },
  });

  return mutation;
};

export type { ReqUpdateEvent };
