import Cookies from "js-cookie"; // npm install js-cookie
import {
  logout as logoutApi,
  refreshToken as refreshTokenApi,
} from "../generated/api";

const authAction = {
  async refreshToken() {
    try {
      // 1. Gọi API Refresh Token
      // Ta truyền chuỗi rỗng "" vì trình duyệt sẽ TỰ ĐỘNG gửi HttpOnly Cookie "refresh_token" đi kèm request.
      // Backend (Golang) cần ưu tiên đọc từ Cookie trước, nếu không có mới đọc body.
      const response = await refreshTokenApi({
        refresh_token: "",
      });

      // 2. Lưu Access Token mới vào Cookie
      // Để Middleware và Axios Interceptor đều dùng được.
      if (response.access_token) {
        Cookies.set("access_token", response.access_token, {
          expires: 1, // Hết hạn sau 1 ngày (hoặc parse từ token)
          // secure: true, // Bật khi chạy production (HTTPS)
          // sameSite: 'lax'
        });

        // Lưu ý: Refresh Token mới (nếu có) sẽ được Backend tự động cập nhật
        // vào HttpOnly Cookie thông qua header "Set-Cookie". Frontend không cần làm gì.
      }

      return response;
    } catch (error) {
      // Nếu refresh thất bại (Token hết hạn hẳn hoặc không hợp lệ) -> Logout
      authAction.handleLogoutCleanup();
      throw error;
    }
  },

  async logout() {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Dù API logout thành công hay thất bại, Client vẫn phải dọn dẹp và redirect
      authAction.handleLogoutCleanup();
    }
  },

  // Hàm tiện ích để dọn dẹp (Dùng chung cho logout và lỗi refresh)
  handleLogoutCleanup() {
    // Note: cancelRefresh được gọi từ authStore.logout() để tránh circular dependency

    // Xóa Access Token (Client xóa được)
    Cookies.remove("access_token");

    // Xóa cờ hiệu đăng nhập (nếu bạn dùng như comment ở bài trước)
    Cookies.remove("is_logged_in");

    // Xóa dữ liệu rác cũ nếu còn sót
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }

    // Refresh Token (HttpOnly) Client KHÔNG xóa được bằng JS.
    // Tuy nhiên, endpoint /logout của Backend đã gửi header để xóa nó rồi (MaxAge=-1).

    // Redirect về login (Dùng window.location để force reload trắng trang, đảm bảo sạch state)
    window.location.href = "/auth";
  },
};

export default authAction;
