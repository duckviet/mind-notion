import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createEvent,
  type ReqCreateEvent,
} from "@/shared/services/generated/api";
import { toast } from "sonner";
import { invalidateEventCollections } from "@/shared/hooks/query-invalidations";

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: ReqCreateEvent) => createEvent(data),
    onSuccess: async () => {
      toast.success("Event created");
      await invalidateEventCollections(queryClient);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create event");
    },
  });

  return mutation;
};

export type { ReqCreateEvent };
