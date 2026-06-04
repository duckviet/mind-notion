import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";

type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  avatar_url: string;
  status: "active" | "inactive" | "suspended";
  email_verified: boolean;
  created_at?: string;
  updated_at?: string;
};

type AuthState = {
  isAuth: boolean | null;
  user: User | null;
  isRefreshing: boolean;
  isInitialized: boolean; // Đã chạy AutoLogin xong chưa
};

type AuthAction = {
  login: () => void;
  logout: () => void;
  setUser: (user: User) => void;
  removeUser: () => void;
  fetchMe: () => void;
  setRefreshing: (status: boolean) => void;
  setInitialized: (status: boolean) => void;
};

const initialState: AuthState = {
  isAuth: null,
  user: null,
  isRefreshing: false,
  isInitialized: false,
};

type AuthStore = AuthState & AuthAction;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      login() {
        console.log("[AuthStore] login() called");
        set({ isAuth: true });
      },
      logout() {
        console.log("[AuthStore] logout() called");
        // Reset state trước
        set({ isAuth: false, user: null, isRefreshing: false, isInitialized: true });
      },
      setUser(user: User) {
        console.log("[AuthStore] setUser() called with:", user);
        set({ user });
      },
      removeUser: () => set({ user: null }),
      fetchMe: async () => {
        const token = Cookies.get("access_token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1"}/user/me`,
          {
            credentials: "include",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch current user: ${response.status}`);
        }
        const user = (await response.json()) as User;
        set({ user });
      },
      setRefreshing: (status: boolean) => {
        console.log("[AuthStore] setRefreshing() called with:", status);
        set({ isRefreshing: status });
      },
      setInitialized: (status: boolean) => {
        console.log("[AuthStore] setInitialized() called with:", status);
        set({ isInitialized: status });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuth: state.isAuth,
      }),
    }
  )
);
