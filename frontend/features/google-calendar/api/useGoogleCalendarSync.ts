import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/shared/services/axios";
import { toast } from "sonner";
import { invalidateEventCollections } from "@/shared/hooks/query-invalidations";

export const useGoogleCalendarSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      client.post("/calendar/google/sync").then((res) => res.data),
    onSuccess: async (data: { synced: number; message: string }) => {
      toast.success(`Google Calendar synced: ${data.synced} events`);
      await invalidateEventCollections(queryClient);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error || "Failed to sync with Google Calendar",
      );
    },
  });
};
