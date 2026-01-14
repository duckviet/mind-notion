"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { RegisterForm } from "@/features/auth/ui/RegisterForm";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/features/auth";

function AuthPageContent() {
  const { isAuth, isRefreshing, user } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const redirectingRef = useRef(false);

  useEffect(() => {
    // Chỉ redirect khi:
    // 1. Đã auth (isAuth = true)
    // 2. Không đang refresh
    // 3. Đã có thông tin user (nghĩa là AutoLogin hoặc refresh đã chạy xong)
    // 4. Chưa bắt đầu redirect
    if (isAuth && !isRefreshing && user && !redirectingRef.current) {
      redirectingRef.current = true;
      router.replace(callbackUrl);
    }
  }, [isAuth, isRefreshing, user, callbackUrl, router]);

  // Nếu đang refresh hoặc (đã auth và có user),
  // không render gì cả để tránh hiện Form Login rồi biến mất (Flicker)
  if (isAuth && user) {
    return null;
  }
  const handleSuccess = () => {
    router.push(callbackUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-[#FAFAFA] to-[#e7e7eb] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <LoginForm
                onSuccess={handleSuccess}
                onSwitchToRegister={() => setIsLogin(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RegisterForm
                onSuccess={handleSuccess}
                onSwitchToLogin={() => setIsLogin(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// 2. Export mặc định phải được bọc trong Suspense
export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
