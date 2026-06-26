import { useMutation } from "@tanstack/react-query";
import { client } from "@/shared/services/axios";
import { toast } from "sonner";
import {
  getApiErrorMessage,
  type GoogleCalendarConnectResponse,
} from "./googleCalendarApi";

export const useGoogleCalendarConnect = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const response = await client.get<GoogleCalendarConnectResponse>(
        "/auth/google/calendar",
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Failed to initiate Google Calendar connection",
        ),
      );
    },
  });

  return { connect: mutate, isConnecting: isPending };
};
