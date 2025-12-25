"use client";

import React, { useEffect, useRef } from "react";
import { useAuthStore } from "./authStore";
import { getMe } from "@/shared/services/generated/api";
import Cookies from "js-cookie";

export default function AutoLogin({ children }: { children: React.ReactNode }) {
  const { setUser, login, logout } = useAuthStore();
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const initAuth = async () => {
      const hasToken =
        !!Cookies.get("access_token") || !!Cookies.get("refresh_token");

      if (hasToken) {
        try {
          // Gọi API lấy thông tin user.
          // Nếu access token hết hạn, Axios Interceptor sẽ tự refresh âm thầm ở đây.
          const user = await getMe();
          setUser(user);
          login();
        } catch (error) {
          console.error("Auto login failed", error);
          logout();
          // Xóa cookie rác nếu cần
          Cookies.remove("access_token");
        }
      } else {
        logout();
      }
    };

    initAuth();
  }, [setUser, login, logout]);

  return <>{children}</>;
}
