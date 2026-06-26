import { useQuery } from "@tanstack/react-query";
import { client } from "@/shared/services/axios";
import { useAuthStore } from "@/shared/stores/authStore";
import {
  googleCalendarStatusQueryKey,
  type GoogleCalendarStatus,
} from "./googleCalendarApi";

export const useGoogleCalendarStatus = () => {
  const { isAuth, user, isInitialized } = useAuthStore();

  return useQuery<GoogleCalendarStatus>({
    queryKey: googleCalendarStatusQueryKey,
    queryFn: async () => {
      const response = await client.get<GoogleCalendarStatus>(
        "/auth/google/calendar/status",
      );
      return response.data;
    },
    enabled: isInitialized && isAuth === true && !!user,
    initialData: { connected: false, configured: true },
    retry: false,
  });
};
