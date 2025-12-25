import { useMutation } from "@tanstack/react-query";
import { login } from "@/shared/services/generated/api";
import { toast } from "sonner";
import { useAuthStore } from "../store/authStore";
import Cookies from "js-cookie"; // Import thư viện quản lý cookie
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";

export const useLogin = () => {
  const { fetchMe, login: loginStore } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await login(credentials);
      return response;
    },
    onSuccess: async (data) => {
      // 1. Xử lý lưu Access Token
      // Quan trọng: Lưu vào Cookie để Middleware (Next.js Edge) đọc được
      // Nếu Backend đã tự set Access Token qua Cookie thì bỏ qua bước này.
      // Nếu Backend trả token dạng JSON body:
      if (data.access_token) {
        Cookies.set("access_token", data.access_token, {
          expires: 1, // 1 ngày (hoặc theo exp của token)
          // secure: true, // Bật nếu dùng HTTPS
          // sameSite: 'strict'
        });

        // Cập nhật token cho instance axios hiện tại (để request fetchMe ngay sau đó dùng được luôn)
        // clientInstance.setAccessToken(data.access_token); // Nếu bạn giữ logic cũ
      }

      // Refresh Token nên được Backend set HttpOnly Cookie, JS không nên đụng vào.

      try {
        // 2. Fetch User Profile TRƯỚC khi báo login thành công
        // Dùng await để đảm bảo data user đã có trong store trước khi UI render
        await fetchMe();

        // 3. Update trạng thái Auth
        loginStore();

        toast.success("Login successful");

        // 4. Redirect (Optional: Xử lý ở đây hoặc ở Component gọi hook)
        router.push("/");
      } catch (error) {
        console.error("Fetch profile failed after login", error);
        toast.error("Login success but failed to load profile");
      }
    },
    onError: (error) => {
      // Xử lý hiển thị lỗi chi tiết từ Backend
      if (error instanceof AxiosError && error.response?.data) {
        // Giả sử backend trả về { message: "Wrong password" }
        const msg = (error.response.data as any).message || "Login failed";
        toast.error(msg);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    },
  });
};
