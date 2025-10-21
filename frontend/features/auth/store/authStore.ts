import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getMe, User } from "@/shared/services/generated/api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean | null;
}

interface AuthActions {
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  logout: () => void;
  fetchMe: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", accessToken);
          if (refreshToken) {
            localStorage.setItem("refresh_token", refreshToken);
          }
        }
        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: null,
        });
      },
      fetchMe: async () => {
        const user = await getMe();
        set({ user, isAuthenticated: true });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
