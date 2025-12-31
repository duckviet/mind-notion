import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createEvent,
  type ReqCreateEvent,
} from "@/shared/services/generated/api";
import { toast } from "sonner";

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: ReqCreateEvent) => createEvent(data),
    onSuccess: () => {
      toast.success("Event created");
      queryClient.invalidateQueries({ queryKey: ["/events"] });
      queryClient.invalidateQueries({ queryKey: ["/events/list"] });
      queryClient.invalidateQueries({ queryKey: ["/events/range"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create event");
    },
  });

  return mutation;
};

export type { ReqCreateEvent };
