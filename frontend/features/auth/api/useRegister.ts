import { useMutation } from "@tanstack/react-query";
import { register } from "@/shared/services/generated/api";
import { toast } from "sonner";
import { useAuthStore } from "../store/authStore";
import { clientInstance } from "@/shared/services/axios";

export const useRegister = () => {
  const { login: loginStore, fetchMe } = useAuthStore();
  return useMutation({
    mutationFn: async (userData: {
      username: string;
      email: string;
      password: string;
    }) => {
      const response = await register(userData);
      return response;
    },
    onSuccess: (data) => {
      // Backend now sets HttpOnly cookies automatically
      // Store tokens in localStorage if provided (backward compatibility)
      if (data.access_token && data.refresh_token) {
        clientInstance.setAccessToken(data.access_token);
        clientInstance.setRefreshToken(data.refresh_token);
      }
      // Even if no tokens in response, cookies are set by backend
      loginStore();
      fetchMe();
      toast.success("Registration successful");
    },
    onError: (error) => {
      console.error("Registration failed:", error);
      toast.error("Registration failed");
    },
  });
};
