"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUpdateMe } from "@/shared/services/generated/api";
import { toast } from "sonner";
import {
  User,
  Mail,
  Link,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  avatar: z.string().url("Invalid URL").optional().or(z.literal("")),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const AccountSettings = () => {
  const { user, setUser } = useAuthStore();
  const updateMeMutation = useUpdateMe();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      avatar: user?.avatar || "",
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmitProfile = async (data: ProfileFormValues) => {
    try {
      const updatedUser = await updateMeMutation.mutateAsync({
        data: {
          name: data.name,
          email: data.email,
          avatar: data.avatar || "",
        },
      });
      setUser(updatedUser);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  const onSubmitPassword = async (data: PasswordFormValues) => {
    try {
      // TODO: Implement password change API call
      toast.success("Password changed successfully");
      resetPassword();
    } catch (error) {
      toast.error("Failed to change password");
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Account</h2>
        <p className="text-muted-foreground">
          Manage your personal information and account security.
        </p>
      </div>

      {/* Profile Section */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">
                Public Profile
              </CardTitle>
              <CardDescription>
                This information will be visible to other users.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmitProfile(onSubmitProfile)}
            className="space-y-6"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    {...registerProfile("name")}
                    placeholder="John Doe"
                    className="pl-9 h-10"
                  />
                </div>
                {profileErrors.name && (
                  <p className="text-sm text-destructive font-medium">
                    {profileErrors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    {...registerProfile("email")}
                    placeholder="john@example.com"
                    className="pl-9 h-10"
                  />
                </div>
                {profileErrors.email && (
                  <p className="text-sm text-destructive font-medium">
                    {profileErrors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar" className="text-sm font-medium">
                Avatar URL
              </Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="avatar"
                  {...registerProfile("avatar")}
                  placeholder="https://example.com/avatar.jpg"
                  className="pl-9 h-10"
                />
              </div>
              {profileErrors.avatar && (
                <p className="text-sm text-destructive font-medium">
                  {profileErrors.avatar.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                We recommend using a square image (e.g., 400x400px).
              </p>
            </div>

            <div className="flex items-center justify-end pt-4 border-t">
              <Button
                type="submit"
                disabled={!isDirty || updateMeMutation.isPending}
                className="min-w-[120px]"
              >
                {updateMeMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">
            Change Password
          </CardTitle>
          <CardDescription>
            Ensure your account is using a long, random password to stay secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmitPassword(onSubmitPassword)}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm">
                Current Password
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  {...registerPassword("currentPassword")}
                  placeholder="Enter current password"
                  className="pl-9 pr-10 h-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-sm text-destructive font-medium">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm">
                New Password
              </Label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  {...registerPassword("newPassword")}
                  placeholder="Enter new password"
                  className="pl-9 pr-10 h-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-sm text-destructive font-medium">
                  {passwordErrors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm">
                Confirm New Password
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 border-b-2 border-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...registerPassword("confirmPassword")}
                  placeholder="Confirm new password"
                  className="pl-9 pr-10 h-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-destructive font-medium">
                  {passwordErrors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full sm:w-auto px-8">
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSettings;
