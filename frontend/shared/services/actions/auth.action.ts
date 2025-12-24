import {
  logout as logoutApi,
  refreshToken as refreshTokenApi,
} from "../generated/api";

const authAction = {
  async refreshToken() {
    // Try to get refresh token from localStorage first
    // If not available, backend will read from HttpOnly cookie
    const refreshToken = localStorage.getItem("refresh_token");

    try {
      // Backend will read refresh token from cookie if not provided in body
      // This works with HttpOnly cookies
      const response = await refreshTokenApi({
        refresh_token: refreshToken || "", // Empty string if not in localStorage
      });

      // Backend sets new tokens in HttpOnly cookies
      // Also store in localStorage if tokens are returned (backward compatibility)
      if (response.access_token && response.refresh_token) {
        localStorage.setItem("access_token", response.access_token);
        localStorage.setItem("refresh_token", response.refresh_token);
      }

      return response;
    } catch (error) {
      // Clear tokens and redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/auth";
      throw error;
    }
  },

  async logout() {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Backend clears HttpOnly cookies
      // Also clear localStorage
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/auth";
    }
  },
};

export default authAction;
