import { useMutation } from "@tanstack/react-query";
import { client } from "@/shared/services/axios";
import { toast } from "sonner";

export const useGoogleCalendarPush = () => {
  return useMutation({
    mutationFn: (eventId: string) => client.post(`/calendar/google/push/${eventId}`).then((res) => res.data),
    onSuccess: () => {
      toast.success("Event pushed to Google Calendar");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to push event to Google Calendar");
    },
  });
};
