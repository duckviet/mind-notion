// AuthPage.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { RegisterForm } from "@/features/auth/ui/RegisterForm";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/features/auth";

export default function AuthPage() {
  const { isAuth, isRefreshing } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lấy callbackUrl từ Middleware (nếu bạn đã set ở middleware)
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    // Nếu đã auth thì không cho ở lại trang này
    if (isAuth) {
      router.replace(callbackUrl); // Dùng replace để tránh lưu lịch sử trang login
    }
  }, [isAuth, router, callbackUrl]);

  // Nếu đang refresh (AutoLogin đang chạy) hoặc đã auth,
  // không render gì cả để tránh hiện Form Login rồi biến mất (Flicker)
  if (isAuth) {
    return null;
  }

  const handleSuccess = () => {
    router.push(callbackUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-[#FAFAFA] to-[#e7e7eb] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
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
