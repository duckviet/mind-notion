// RegisterForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, User, Lock, Mail, UserPlus } from "lucide-react";
import { useRegister } from "../api/useRegister";
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

const registerSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm = ({
  onSuccess,
  onSwitchToLogin,
}: RegisterFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerMutation.mutateAsync({
        username: data.username,
        email: data.email,
        password: data.password,
      });
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  const inputBaseClass =
    "pl-10 h-11  -elevated border-border focus:  focus:border-accent focus:ring-accent/20 transition-all";

  return (
    <Card className="w-full backdrop-blur-sm  /80 border-0 shadow-xl shadow-shadow-lg">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold text-center text-text-primary">
          Create Account
        </CardTitle>
        <CardDescription className="text-center text-text-secondary">
          Sign up to start organizing your thoughts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {registerMutation.error && (
            <Alert
              variant="destructive"
              className="bg-destructive/10 border-destructive/30 text-destructive"
            >
              <AlertDescription>
                {registerMutation.error.message ||
                  "Registration failed. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium text-text-primary">
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                type="text"
                placeholder="Choose a username"
                {...register("username")}
                className={`${inputBaseClass} ${errors.username ? "border-destructive" : ""}`}
              />
            </div>
            {errors.username && (
              <p className="text-sm text-destructive">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-text-primary">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                type="email"
                placeholder="Enter your email"
                {...register("email")}
                className={`${inputBaseClass} ${errors.email ? "border-destructive" : ""}`}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-text-primary">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                {...register("password")}
                className={`${inputBaseClass} pr-10 ${errors.password ? "border-destructive" : ""}`}
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
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-text-primary">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                {...register("confirmPassword")}
                className={`${inputBaseClass} pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-accent text-white border-transparent hover:bg-accent-600 hover:text-white cursor-pointer transition-all"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="  px-2 text-text-muted">
                Already have an account?
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onSwitchToLogin}
            className="w-full h-11 border-border hover: -elevated hover:border-border text-text-primary transition-all"
          >
            Sign in instead
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
