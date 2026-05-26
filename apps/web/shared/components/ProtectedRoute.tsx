"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuth) {
      router.push("/auth");
    }
  }, [isAuth, router]);

  if (!isAuth) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
