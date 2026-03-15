import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/shared/services/axios";
import { toast } from "sonner";

export const useGoogleCalendarDisconnect = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => client.delete("/auth/google/calendar").then((res) => res.data),
    onSuccess: () => {
      toast.success("Disconnected from Google Calendar");
      queryClient.setQueryData(["/auth/google/calendar/status"], { connected: false });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to disconnect Google Calendar");
    },
  });
};
