"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useSettingsStore } from "@/shared/stores/settingsStore";

const accentPalette: Record<
  string,
  { primary: string; strong: string; subtle: string }
> = {
  neutral: { primary: "#adadad", strong: "#5e5e5e", subtle: "#e3e3e3" },
  blue: { primary: "#2563eb", strong: "#1d4ed8", subtle: "#dbeafe" },
  purple: { primary: "#7c3aed", strong: "#6d28d9", subtle: "#ede9fe" },
  green: { primary: "#16a34a", strong: "#15803d", subtle: "#dcfce7" },
  red: { primary: "#dc2626", strong: "#b91c1c", subtle: "#fee2e2" },
  orange: { primary: "#ea580c", strong: "#c2410c", subtle: "#ffedd5" },
};

const fontStacks: Record<string, string> = {
  inter:
    '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  geist:
    '"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

/**
 * Syncs user appearance preferences (accent, font, density) to document-level
 * CSS variables and data attributes so the entire app can respond.
 */
export function AppearanceApplier() {
  const { resolvedTheme } = useTheme();
  const { primaryColor, fontFamily, viewMode } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    const palette = accentPalette[primaryColor];
    root.dataset.accent = primaryColor;
    root.style.setProperty("--accent-500", palette.primary);
    root.style.setProperty("--accent-600", palette.strong);
    root.style.setProperty("--accent-100", palette.subtle);
  }, [primaryColor]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.font = fontFamily;
    root.style.setProperty("--app-font-family", fontStacks[fontFamily]);
  }, [fontFamily]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.density = viewMode;
    root.classList.toggle("density-compact", viewMode === "compact");
  }, [viewMode]);

  useEffect(() => {
    const root = document.documentElement;
    const scheme = resolvedTheme === "light" ? "light" : "dark";
    root.dataset.theme = resolvedTheme ?? "auto";
    root.style.setProperty("color-scheme", scheme);
  }, [resolvedTheme]);

  return null;
}
