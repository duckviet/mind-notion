import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { login } from "@/shared/services/generated/api";

export const useLogin = () => {
  const { setTokens, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await login(credentials);
      return response;
    },
    onSuccess: (data) => {
      // Store tokens and user info
      if (data.access_token) {
        setTokens(data.access_token, data.refresh_token);

        // You might want to fetch user info here
        // For now, we'll create a basic user object
        setUser({
          id: "1", // This should come from the API response
          name: "User", // This should come from the API response
          email: "user@example.com", // This should come from the API response
          avatar: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });
};
