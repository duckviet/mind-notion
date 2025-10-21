"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";
import { getMe } from "../services/generated/api";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated: isAuth, fetchMe } = useAuthStore();
  const router = useRouter();
  // Server-side redirect for better performance and SEO
  if (typeof window === "undefined" && isAuth === false) {
    router.replace("/");
  }

  // Client-side redirect as fallback
  useEffect(() => {
    if (isAuth === false) {
      router.replace("/auth");
    } else {
      fetchMe();
    }
  }, [isAuth, router, fetchMe]);

  // // Show nothing while checking auth status
  // if (isAuth === null) {
  //   return null;
  // }

  // // Show nothing if not authenticated
  // if (isAuth === false) {
  //   return null;
  // }

  // Only render children if authenticated
  return <>{children}</>;
}
