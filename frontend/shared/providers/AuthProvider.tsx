"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuth, fetchMe } = useAuthStore();

  // Chỉ đồng bộ user info khi đã authenticated
  // Redirect/guard routes được xử lý bởi middleware ở server-side
  useEffect(() => {
    if (isAuth === true) {
      fetchMe();
    }
  }, [isAuth, fetchMe]);

  return <>{children}</>;
}
