import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getMe, User } from "@/shared/services/generated/api";

type AuthState = {
  isAuth: boolean | null;
  user: User | null;
  isRefreshing: boolean;
};

type AuthAction = {
  login: () => void;
  logout: () => void;
  setUser: (user: User) => void;
  removeUser: () => void;
  fetchMe: () => void;
  setRefreshing: (status: boolean) => void;
};

const initialState: AuthState = {
  isAuth: null,
  user: null,
  isRefreshing: false,
};

type AuthStore = AuthState & AuthAction;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      login() {
        set({ isAuth: true });
      },
      logout() {
        // Reset state trước
        set({ isAuth: false, user: null, isRefreshing: false });

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
        set({ user });
      },
      removeUser: () => set({ user: null }),
      fetchMe: async () => {
        const user = await getMe();
        set({ user });
      },
      setRefreshing: (status: boolean) => set({ isRefreshing: status }),
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
