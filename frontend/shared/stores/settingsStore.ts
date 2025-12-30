import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "black" | "auto";
export type ViewMode = "default" | "compact";
export type FontFamily = "inter" | "geist" | "system";
export type PrimaryColor =
  | "neutral"
  | "blue"
  | "purple"
  | "green"
  | "red"
  | "orange";

interface SettingsState {
  theme: Theme;
  viewMode: ViewMode;
  fontFamily: FontFamily;
  primaryColor: PrimaryColor;
  setTheme: (theme: Theme) => void;
  setViewMode: (mode: ViewMode) => void;
  setFontFamily: (font: FontFamily) => void;
  setPrimaryColor: (color: PrimaryColor) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "auto",
      viewMode: "default",
      fontFamily: "inter",
      primaryColor: "blue",
      setTheme: (theme) => set({ theme }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setFontFamily: (font) => set({ fontFamily: font }),
      setPrimaryColor: (color) => set({ primaryColor: color }),
    }),
    {
      name: "settings-storage",
    }
  )
);
