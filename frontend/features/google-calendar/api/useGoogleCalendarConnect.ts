import { useMutation } from "@tanstack/react-query";
import { client } from "@/shared/services/axios";
import { toast } from "sonner";

export const useGoogleCalendarConnect = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: () => client.get("/auth/google/calendar").then((res) => res.data),
    onSuccess: (data: { url: string }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to initiate Google Calendar connection");
    },
  });

  return { connect: mutate, isConnecting: isPending };
};
