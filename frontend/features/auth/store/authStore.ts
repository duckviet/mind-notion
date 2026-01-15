import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getMe, User } from "@/shared/services/generated/api";

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

        // Cancel refresh nếu đang diễn ra (dùng dynamic import để tránh circular dependency)
        import("@/shared/services/axios/ClientRequest")
          .then(({ ClientRequest }) => {
            const clientRequest = ClientRequest.getInstance();
            clientRequest.cancelRefresh();
          })
          .catch(() => {
            // Ignore nếu không thể cancel
          });
      },
      setUser(user: User) {
        console.log("[AuthStore] setUser() called with:", user);
        set({ user });
      },
      removeUser: () => set({ user: null }),
      fetchMe: async () => {
        const user = await getMe();
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
