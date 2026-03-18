import { useQuery } from "@tanstack/react-query";
import { client } from "@/shared/services/axios";
import { useAuthStore } from "@/features/auth";

export interface GoogleCalendarStatus {
  connected: boolean;
}

export const useGoogleCalendarStatus = () => {
  const { isAuth, user, isInitialized } = useAuthStore();

  return useQuery<GoogleCalendarStatus>({
    queryKey: ["/auth/google/calendar/status"],
    queryFn: () =>
      client.get("/auth/google/calendar/status").then((res) => res.data),
    enabled: isInitialized && isAuth === true && !!user,
    initialData: { connected: false },
    retry: false,
  });
};
