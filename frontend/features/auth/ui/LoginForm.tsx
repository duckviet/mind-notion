// LoginForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, Loader2, User, Lock } from "lucide-react";
import { useLogin } from "../api/useLogin";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginForm = ({
  onSuccess,
  onSwitchToRegister,
}: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Card className="w-full backdrop-blur-sm  /80 border-0 shadow-xl shadow-shadow-lg">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold text-center text-text-primary">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-center text-text-secondary">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {loginMutation.error && (
            <Alert
              variant="destructive"
              className="bg-red-50 border-red-200 text-red-700"
            >
              <AlertDescription>
                {loginMutation.error.message ||
                  "Login failed. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="username"
              className="text-sm font-medium text-text-primary"
            >
              Username or Email
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                id="username"
                type="text"
                placeholder="Enter your username or email"
                {...register("username")}
                className={`pl-10 h-11 focus:border-primary/40 transition-all shadow-none ${
                  errors.username
                    ? "border-destructive focus:border-destructive"
                    : ""
                }`}
              />
            </div>
            {errors.username && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <span className="inline-block w-1 h-1 bg-red-500 rounded-full" />
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-text-primary"
            >
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password")}
                className={`pl-10 pr-10 h-11 focus:border-primary/40 transition-all shadow-none ${
                  errors.password
                    ? "border-destructive focus:border-destructive"
                    : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <span className="inline-block w-1 h-1 bg-destructive rounded-full" />
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="default"
            className="w-full h-11 bg-primary text-white border-transparent   hover:bg-primary/80 cursor-pointer transition-all"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-accent  px-2 text-text-muted">
                New to our platform?
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onSwitchToRegister}
            className="w-full h-11 border-border hover: -elevated hover:border-border text-text-primary transition-all"
          >
            Create an account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
