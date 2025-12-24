import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getMe, User } from "@/shared/services/generated/api";
import { clientInstance } from "@/shared/services/axios";

type AuthState = {
  isAuth: boolean | null;
  user: User | null;
};

type AuthAction = {
  login: () => void;
  logout: () => void;
  setUser: (user: User) => void;
  removeUser: () => void;
  fetchMe: () => void;
};

const initialState: AuthState = {
  isAuth: null,
  user: null,
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
        set({ isAuth: false, user: null });
        clientInstance.removeAccessToken();
        clientInstance.removeRefreshToken();
      },
      setUser(user: User) {
        set({ user });
      },
      removeUser: () => set({ user: null }),
      fetchMe: async () => {
        const user = await getMe();
        set({ user });
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
