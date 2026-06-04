import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/shared/services/axios";
import { toast } from "sonner";
import { invalidateEventCollections } from "@/shared/hooks/query-invalidations";
import {
  getApiErrorMessage,
  googleCalendarStatusQueryKey,
  type GoogleCalendarSyncResponse,
} from "./googleCalendarApi";

export const useGoogleCalendarSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await client.post<GoogleCalendarSyncResponse>(
        "/calendar/google/sync",
      );
      return response.data;
    },
    onSuccess: async (data) => {
      toast.success(`Google Calendar synced: ${data.synced} events`);
      await Promise.all([
        invalidateEventCollections(queryClient),
        queryClient.invalidateQueries({ queryKey: googleCalendarStatusQueryKey }),
      ]);
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error, "Failed to sync with Google Calendar"),
      );
    },
  });
};
