import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/shared/services/axios";
import { toast } from "sonner";

export const useGoogleCalendarSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => client.post("/calendar/google/sync").then((res) => res.data),
    onSuccess: (data: { synced: number; message: string }) => {
      toast.success(`Google Calendar synced: ${data.synced} events`);
      // Invalidate relevant event queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["/events"] });
      queryClient.invalidateQueries({ queryKey: ["/events/list"] });
      queryClient.invalidateQueries({ queryKey: ["/events/range"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to sync with Google Calendar");
    },
  });
};
