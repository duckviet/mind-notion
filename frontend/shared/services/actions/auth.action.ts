import axios, { AxiosError } from "axios";

import authEndpoint from "../endpoints/auth.endpoint";

// Create a local axios instance to avoid circular dependency with ClientRequest
const backendUrl =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BACKEND_URL) || "";
const http = axios.create({
  baseURL: backendUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

const authAction = {
  async login(email: string, password: string) {
    try {
      const res = await http.post(authEndpoint.login, {
        email,
        password,
      });

      const data = res.data;

      return data;
    } catch (error) {
      return error;
    }
  },
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string
  ) {
    try {
      const res = await http.post(authEndpoint.register, {
        email,
        password,
        firstName,
        lastName,
        phone,
      });

      const data = res.data.data;
      return data;
    } catch (error) {
      return error;
    }
  },

  async refreshToken() {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token found");
    }
    try {
      const res = await http.post(
        authEndpoint.refresh,
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );
      const data = res.data;
      return data;
    } catch (error) {
      // If refresh fails, log out the user
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      delete axios.defaults.headers.common["Authorization"];
      window.location.href = "/login"; // Force reload and redirect to login
      throw error;
    }
  },
};

export default authAction;
