import { logout as logoutApi } from "../generated/api";

const authAction = {
  async refreshToken() {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      // TODO: Implement refresh token API when available
      throw new Error("Refresh token not implemented yet");
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
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/auth";
    }
  },
};

export default authAction;
