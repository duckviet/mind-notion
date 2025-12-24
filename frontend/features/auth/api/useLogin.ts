import { useMutation } from "@tanstack/react-query";
import { login } from "@/shared/services/generated/api";
import { toast } from "sonner";
import { clientInstance } from "@/shared/services/axios";
import { useAuthStore } from "../store/authStore";

export const useLogin = () => {
  const { fetchMe, login: loginStore } = useAuthStore();
  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await login(credentials);
      return response;
    },
    onSuccess: (data) => {
      // Backend now sets HttpOnly cookies automatically
      // We still store in localStorage for axios interceptor to read
      // Note: Response may not contain tokens if backend only sets cookies
      // Check if tokens are in response (backward compatibility) or just proceed
      if (data.access_token && data.refresh_token) {
        clientInstance.setAccessToken(data.access_token);
        clientInstance.setRefreshToken(data.refresh_token);
      }
      // Even if no tokens in response, cookies are set by backend
      // So we can proceed with login

      toast.success("Login successful");
      loginStore();
      fetchMe();
    },
    onError: (error) => {
      toast.error("Login failed");
    },
  });
};
