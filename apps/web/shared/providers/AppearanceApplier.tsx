"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useSettingsStore } from "@/shared/stores/settingsStore";

const fontStacks: Record<string, string> = {
  inter:
    '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  geist:
    '"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

/**
 * Syncs user appearance preferences (accent, font, density) to document-level
 * data attributes so the entire app can respond via CSS.
 *
 * Note: Accent colors are defined in globals.css using [data-accent="..."] selectors.
 * This component only sets the data-accent attribute - no inline style overrides.
 */
export function AppearanceApplier() {
  const { resolvedTheme } = useTheme();
  const { primaryColor, fontFamily, viewMode } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    // Only set data attribute - let CSS handle the colors
    root.dataset.accent = primaryColor;
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
