"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useAuthStore } from "./authStore";

import { AxiosError } from "axios";
import { getMe, refreshToken } from "@/shared/services/generated/api";
import { clientInstance, ClientRequest } from "@/shared/services/axios";

type Props = {
  children?: React.ReactNode;
  pathname?: string;
};

export default function AutoLogin({ children }: Props) {
  const { login, logout, setUser, removeUser, isAuth } = useAuthStore();
  const refreshTokenFlag = useRef(false); // Semaphore to prevent multiple refresh token request
  const initialized = useRef(false);

  // Initialize auth state from localStorage/cookies on mount
  // Middleware already handles redirects, so we just sync the state
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (!isAuth) return;

    // Sync tokens from localStorage to cookies if needed (for migration from old sessions)
    const accessToken = clientInstance.getAccessToken();
    const refreshToken = clientInstance.getRefreshToken();

    // If we have tokens in localStorage but not in cookies, sync them
    if (accessToken && typeof document !== "undefined") {
      const cookieAccessToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];

      if (!cookieAccessToken) {
        // Sync to cookies
        clientInstance.setAccessToken(accessToken);
      }
    }

    if (refreshToken && typeof document !== "undefined") {
      const cookieRefreshToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("refresh_token="))
        ?.split("=")[1];

      if (!cookieRefreshToken) {
        // Sync to cookies
        clientInstance.setRefreshToken(refreshToken);
      }
    }

    // Check if we have a valid token
    if (
      clientInstance.hasAccessToken() &&
      clientInstance.isAccessTokenValid()
    ) {
      // Fetch user info to sync state
      getMe()
        .then((user) => {
          setUser(user);
          login();
        })
        .catch(() => {
          logout();
        });
    } else {
      logout();
    }
  }, [login, logout, setUser, isAuth]);

  // Handle token refresh when token expires during session
  useLayoutEffect(() => {
    const handleTokenExpired = async () => {
      if (refreshTokenFlag.current) {
        return;
      }
      try {
        const refresh_token = clientInstance.getRefreshToken() ?? "";
        refreshTokenFlag.current = true;
        const res = await refreshToken({ refresh_token });
        refreshTokenFlag.current = false;
        const { access_token, refresh_token: newRefreshToken } = res;

        if (access_token) {
          clientInstance.setAccessToken(access_token);
        }
        if (newRefreshToken) {
          clientInstance.setRefreshToken(newRefreshToken);
        }
        setUser(await getMe());
        login();
      } catch (error) {
        if (error instanceof AxiosError) {
          clientInstance.removeRefreshToken();
          clientInstance.removeAccessToken();
          logout();
          removeUser();
        }
      }
    };

    clientInstance.events.on(
      ClientRequest.EVENTS.TOKEN_EXPIRED,
      handleTokenExpired
    );

    return () => {
      clientInstance.events.off(
        ClientRequest.EVENTS.TOKEN_EXPIRED,
        handleTokenExpired
      );
    };
  }, [login, logout, setUser, removeUser]);

  // No loading screen needed - middleware handles initial auth check
  return <>{children}</>;
}
