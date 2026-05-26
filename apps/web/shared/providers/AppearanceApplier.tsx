"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import {
  FontFamily,
  PrimaryColor,
  useSettingsStore,
} from "@/shared/stores/settingsStore";

const fontStacks: Record<string, string> = {
  academic: "var(--font-anthropic-sans)",
  inter:
    'var(--font-inter), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const normalizeAccent = (value: string): PrimaryColor => {
  if (value === "neutral" || value === "terra" || value === "azure") {
    return value;
  }

  return "terra";
};

const normalizeFont = (value: string): FontFamily => {
  if (value === "academic" || value === "inter" || value === "system") {
    return value;
  }

  return "academic";
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
  const {
    primaryColor,
    fontFamily,
    viewMode,
    setPrimaryColor,
    setFontFamily,
  } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    const normalized = normalizeAccent(primaryColor);
    root.dataset.accent = normalized;

    if (normalized !== primaryColor) {
      setPrimaryColor(normalized);
    }
  }, [primaryColor, setPrimaryColor]);

  useEffect(() => {
    const root = document.documentElement;
    const normalized = normalizeFont(fontFamily);
    root.dataset.font = normalized;
    root.style.setProperty("--app-font-family", fontStacks[normalized]);
    root.style.setProperty(
      "--heading-font-family",
      normalized === "academic"
        ? "var(--font-anthropic-serif)"
        : fontStacks[normalized],
    );

    if (normalized !== fontFamily) {
      setFontFamily(normalized);
    }
  }, [fontFamily, setFontFamily]);

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
