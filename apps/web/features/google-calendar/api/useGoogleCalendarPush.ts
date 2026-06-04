import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/shared/services/axios";
import { toast } from "sonner";
import { invalidateEventCollections } from "@/shared/hooks/query-invalidations";
import { eventsKeys } from "@/shared/hooks/query-keys";
import {
  getApiErrorMessage,
  type GoogleCalendarMessageResponse,
} from "./googleCalendarApi";

export const useGoogleCalendarPush = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await client.post<GoogleCalendarMessageResponse>(
        `/calendar/google/push/${eventId}`,
      );
      return response.data;
    },
    onSuccess: async (_data, eventId) => {
      toast.success("Event pushed to Google Calendar");
      await Promise.all([
        invalidateEventCollections(queryClient),
        queryClient.invalidateQueries({ queryKey: eventsKeys.detail(eventId) }),
      ]);
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error, "Failed to push event to Google Calendar"),
      );
    },
  });
};
