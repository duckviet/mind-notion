"use client";

import React, { useEffect, useRef } from "react";
import { useAuthStore } from "./authStore";
import { getMe } from "@/shared/services/generated/api";

export default function AutoLogin({ children }: { children: React.ReactNode }) {
  const { setUser, login, logout, isRefreshing, isAuth } = useAuthStore();
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const initAuth = async () => {
      try {
        // Gọi API lấy thông tin user.
        // Nếu access token hết hạn, Axios Interceptor sẽ tự refresh âm thầm
        // bằng HttpOnly refresh_token cookie.
        const user = await getMe();
        setUser(user);
        login();
      } catch (error) {
        console.error("Auto login failed", error);
        // Nếu backend trả 401 và refresh cũng fail, coi như chưa đăng nhập
        logout();
      }
    };

    initAuth();
  }, [setUser, login, logout]);

  const canPopup = isRefreshing && !isAuth;

  return (
    <>
      {canPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-6 shadow-xl">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-gray-700">
              Phiên đăng nhập hết hạn, đang tự động kết nối lại...
            </p>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
