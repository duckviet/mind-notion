import { useMutation } from "@tanstack/react-query";
import { register } from "@/shared/services/generated/api";
import { toast } from "sonner";
import { useAuthStore } from "../store/authStore";
import Cookies from "js-cookie"; // Import thư viện quản lý cookie

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
      if (data.access_token) {
        Cookies.set("access_token", data.access_token, {
          expires: 1, // 1 ngày (hoặc theo exp của token)
          // secure: true, // Bật nếu dùng HTTPS
          // sameSite: 'strict'
        });
      }

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
