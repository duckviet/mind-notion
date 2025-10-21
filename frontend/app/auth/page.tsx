"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { RegisterForm } from "@/features/auth/ui/RegisterForm";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/");
  };

  const handleSwitchToRegister = () => {
    setIsLogin(false);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {isLogin ? (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={handleSwitchToRegister}
          />
        ) : (
          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchToLogin={handleSwitchToLogin}
          />
        )}
      </div>
    </div>
  );
}
