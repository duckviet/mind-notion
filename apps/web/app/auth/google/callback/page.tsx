"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { useAuthStore } from "@/features/auth";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { fetchMe, login, setInitialized } = useAuthStore();

  useEffect(() => {
    // 1. Check for Calendar connection params
    const error = searchParams.get("error");
    const connected = searchParams.get("google_connected");

    if (error) {
      toast.error(`Google Auth failed: ${error}`);
      router.replace("/auth");
      return;
    }

    if (connected === "true") {
      toast.success("Successfully connected to Google Calendar!");
      router.replace("/calendar");
      return;
    }

    // 2. Check for hash fragments containing Auth Tokens (Login flow)
    const hash = window.location.hash.substring(1);
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      if (accessToken) {
        // Save token to JS cookie. HttpOnly token is already set by backend
        Cookies.set("access_token", accessToken, { expires: 1 });
        Cookies.set("is_logged_in", "true", { expires: 7 });

        void (async () => {
          try {
            await fetchMe();
            login();
            setInitialized(true);
            toast.success("Successfully logged in with Google!");
            router.replace("/");
          } catch {
            toast.error("Google login succeeded, but profile sync failed");
            router.replace("/auth");
          }
        })();
        return;
      }
    }

    // Fallback redirect if accessed without params
    router.replace("/auth");
  }, [fetchMe, login, router, searchParams, setInitialized]);

  return null;
}

export default function GoogleCallbackPage() {
  return (
    <div className="flex w-full flex-col items-center justify-center h-[calc(100vh-64px)] bg-transparent">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <h2 className="text-xl font-medium text-text-primary">
          Authenticating with Google...
        </h2>
        <p className="text-text-secondary text-sm">
          Please wait while we complete the process.
        </p>
      </div>
      <Suspense fallback={null}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
