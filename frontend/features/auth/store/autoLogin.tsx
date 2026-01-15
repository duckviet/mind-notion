"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuthStore } from "./authStore";
import { getMe } from "@/shared/services/generated/api";

const REFRESH_TIMEOUT = 1200;
export default function AutoLogin({ children }: { children: React.ReactNode }) {
  const { setUser, login, logout, isRefreshing, isAuth, setInitialized } =
    useAuthStore();
  const mounted = useRef(false);
  const [canPopup, setCanPopup] = useState(false);

  // Dùng ref để ghi nhớ thời điểm bắt đầu hiển thị popup
  const showStartTime = useRef<number | null>(null);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const initAuth = async () => {
      try {
        console.log("[AutoLogin] Calling getMe()...");
        const user = await getMe();
        console.log("[AutoLogin] getMe() success, user:", user);
        setUser(user);
        login();
        setInitialized(true); // Đánh dấu đã init xong và thành công
        console.log("[AutoLogin] setUser() and login() called");
      } catch (error: any) {
        console.error("[AutoLogin] Auto login failed", error);
        console.error("[AutoLogin] Error details:", {
          message: error?.message,
          response: error?.response,
          status: error?.response?.status,
        });
        logout(); // logout() sẽ set isInitialized = true
      }
    };

    initAuth();
  }, [setUser, login, logout, setInitialized]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isRefreshing && isAuth) {
      // 1. Nếu đang refresh, hiện popup ngay lập tức
      setCanPopup(true);
      if (!showStartTime.current) {
        showStartTime.current = Date.now();
      }
    } else if (!isRefreshing) {
      // 2. Nếu đã refresh xong, kiểm tra xem đã đủ REFRESH_TIMEOUT chưa
      const currentTime = Date.now();
      const timeElapsed = showStartTime.current
        ? currentTime - showStartTime.current
        : 0;
      const remainingTime = Math.max(0, REFRESH_TIMEOUT - timeElapsed);

      timer = setTimeout(() => {
        setCanPopup(false);
        showStartTime.current = null;
      }, remainingTime);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isRefreshing, isAuth]);

  return (
    <>
      {canPopup && (
        <div className="fixed inset-0 z-[9999] flex justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex h-fit mt-2 flex-col items-center gap-4 rounded-lg bg-white p-6 shadow-xl">
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
