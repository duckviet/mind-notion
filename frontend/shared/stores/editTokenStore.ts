// store/edit-token.ts
import { create } from "zustand";

interface EditTokenStore {
  editToken: string | null;
  setEditToken: (token: string | null) => void;
}

export const useEditTokenStore = create<EditTokenStore>((set) => ({
  editToken: null,
  setEditToken: (token) => set({ editToken: token }),
}));
