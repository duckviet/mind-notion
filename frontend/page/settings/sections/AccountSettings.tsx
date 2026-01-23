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
import { User, Mail, Link } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  avatar: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const AccountSettings = () => {
  const { user, setUser } = useAuthStore();
  const updateMeMutation = useUpdateMe();

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          Account
        </h2>
        <p className="text-text-secondary">
          Manage your personal information and account security.
        </p>
      </div>

      {/* Profile Section */}
      <Card className="border border-border shadow-sm  ">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-text-primary">
                Public Profile
              </CardTitle>
              <CardDescription className="text-text-secondary">
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
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-text-primary"
                >
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <Input
                    id="name"
                    {...registerProfile("name")}
                    placeholder="John Doe"
                    className="pl-9 h-10 shadow-none  border-border"
                  />
                </div>
                {profileErrors.name && (
                  <p className="text-sm text-destructive font-medium">
                    {profileErrors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-text-primary"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <Input
                    id="email"
                    type="email"
                    {...registerProfile("email")}
                    placeholder="john@example.com"
                    className="pl-9 h-10 shadow-none  border-border"
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
              <Label
                htmlFor="avatar"
                className="text-sm font-medium text-text-primary"
              >
                Avatar URL
              </Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="avatar"
                  {...registerProfile("avatar")}
                  placeholder="https://example.com/avatar.jpg"
                  className="pl-9 h-10 shadow-none  border-border"
                />
              </div>
              {profileErrors.avatar && (
                <p className="text-sm text-destructive font-medium">
                  {profileErrors.avatar.message}
                </p>
              )}
              <p className="text-xs text-text-muted">
                We recommend using a square image (e.g., 400x400px).
              </p>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-border">
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
    </div>
  );
};

export default AccountSettings;
