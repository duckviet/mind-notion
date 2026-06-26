import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/shared/services/axios";
import { toast } from "sonner";
import {
  getApiErrorMessage,
  googleCalendarStatusQueryKey,
  type GoogleCalendarMessageResponse,
} from "./googleCalendarApi";

export const useGoogleCalendarDisconnect = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await client.delete<GoogleCalendarMessageResponse>(
        "/auth/google/calendar",
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Disconnected from Google Calendar");
      queryClient.setQueryData(googleCalendarStatusQueryKey, {
        connected: false,
        configured: true,
      });
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error, "Failed to disconnect Google Calendar"),
      );
    },
  });
};
