"use client";

import React from "react";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import {
  useSettingsStore,
  Theme,
  ViewMode,
  FontFamily,
  PrimaryColor,
} from "@/shared/stores/settingsStore";
import { cn } from "@/lib/utils";
import { Check, Monitor, Moon, Sun } from "lucide-react";

const AppearanceSettings = () => {
  const { theme: currentTheme, setTheme: setNextTheme } = useTheme();
  const {
    theme: settingsTheme,
    viewMode,
    fontFamily,
    primaryColor,
    setTheme,
    setViewMode,
    setFontFamily,
    setPrimaryColor,
  } = useSettingsStore();

  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
    { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
    {
      value: "black",
      label: "Black",
      icon: (
        <div className="h-4 w-4 rounded-full bg-black border border-gray-700" />
      ),
    },
    { value: "auto", label: "Auto", icon: <Monitor className="h-4 w-4" /> },
  ];

  const viewModes: { value: ViewMode; label: string; desc: string }[] = [
    { value: "default", label: "Default", desc: "Standard spacing and layout" },
    {
      value: "compact",
      label: "Compact",
      desc: "Denser layout for more content",
    },
  ];

  const fonts: { value: FontFamily; label: string; preview: string }[] = [
    { value: "inter", label: "Inter", preview: "Aa" },
    { value: "geist", label: "Geist", preview: "Aa" },
    { value: "system", label: "System", preview: "Aa" },
  ];

  const colors: { value: PrimaryColor; label: string; color: string }[] = [
    { value: "neutral", label: "Neutral", color: "bg-neutral-600" },
    { value: "blue", label: "Blue", color: "bg-blue-600" },
    { value: "purple", label: "Purple", color: "bg-purple-600" },
    { value: "green", label: "Green", color: "bg-green-600" },
  ];

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
    if (theme === "auto") {
      setNextTheme("system");
    } else {
      setNextTheme(theme);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 ">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          Appearance
        </h2>
        <p className="text-text-secondary">
          Customize the look and feel of your workspace.
        </p>
      </div>

      {/* Theme Section */}
      <Card className="border border-border shadow-sm bg-surface">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-text-primary">
            Theme
          </CardTitle>
          <CardDescription className="text-sm text-text-secondary">
            Select the color scheme that suits your environment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {themes.map((theme) => {
              const isSelected =
                settingsTheme === theme.value ||
                (theme.value === "auto" && currentTheme === "system");
              return (
                <button
                  key={theme.value}
                  onClick={() => handleThemeChange(theme.value)}
                  className={cn(
                    "group relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-4 transition-all hover:scale-[1.02]",
                    isSelected
                      ? "border-accent bg-accent-50 shadow-sm"
                      : "border-border bg-surface-elevated hover:border-accent",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                      isSelected
                        ? "bg-accent text-white"
                        : "bg-accent-100 text-accent group-hover:bg-accent group-hover:text-white",
                    )}
                  >
                    {theme.icon}
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium text-text-primary">
                      {theme.label}
                    </span>
                    {isSelected && (
                      <div className="mt-1 flex items-center justify-center">
                        <Check className="h-3 w-3 text-accent" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Primary Color & Font Family Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-border shadow-sm bg-surface">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-text-primary">
              Primary Color
            </CardTitle>
            <CardDescription className="text-sm text-text-secondary">
              Pick a color for accents and highlights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {colors.map((color) => {
                const isSelected = primaryColor === color.value;
                return (
                  <button
                    key={color.value}
                    onClick={() => setPrimaryColor(color.value)}
                    className={cn(
                      "relative flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none",
                      color.color,
                      isSelected &&
                        "ring-2 ring-offset-2 ring-accent ring-offset-surface",
                    )}
                    title={color.label}
                  >
                    {isSelected && <Check className="h-5 w-5 text-white" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm bg-surface">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-text-primary">
              Typography
            </CardTitle>
            <CardDescription className="text-sm text-text-secondary">
              Choose the font family for the interface.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {fonts.map((font) => {
                const isSelected = fontFamily === font.value;
                return (
                  <button
                    key={font.value}
                    onClick={() => setFontFamily(font.value)}
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all hover:border-accent",
                      isSelected
                        ? "border-accent bg-accent-50 shadow-sm"
                        : "border-border bg-surface-elevated",
                    )}
                  >
                    <span
                      className={cn(
                        "text-lg font-bold text-text-primary",
                        `font-${font.value}`,
                      )}
                    >
                      {font.preview}
                    </span>
                    <span className="text-xs text-text-muted mt-1">
                      {font.label}
                    </span>
                    {isSelected && (
                      <Check className="absolute top-2 right-2 h-3 w-3 text-accent" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Section */}
      <Card className="border border-border shadow-sm bg-surface">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-text-primary">
            Layout Density
          </CardTitle>
          <CardDescription className="text-sm text-text-secondary">
            Adjust the spacing of elements in the interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {viewModes.map((mode) => {
              const isSelected = viewMode === mode.value;
              return (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value)}
                  className={cn(
                    "relative flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all hover:border-accent",
                    isSelected
                      ? "border-accent bg-accent-50"
                      : "border-border bg-surface-elevated",
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full border-2 mt-0.5 flex items-center justify-center",
                      isSelected ? "border-accent" : "border-border",
                    )}
                  >
                    {isSelected && (
                      <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">
                      {mode.label}
                    </div>
                    <div className="text-sm text-text-secondary mt-1">
                      {mode.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card className="border border-border shadow-sm bg-surface">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-text-primary">
            Live Preview
          </CardTitle>
          <CardDescription className="text-sm text-text-secondary">
            See how accent, typography, and density feel in the interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-elevated p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    Project card
                  </div>
                  <div className="text-xs text-text-secondary">
                    Updated just now
                  </div>
                </div>
                <span className="rounded-full bg-accent-100 px-2.5 py-1 text-[11px] font-medium text-accent">
                  Accent chip
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <div className="h-2 rounded-full bg-accent-100" />
                <div className="h-2 w-3/4 rounded-full bg-border" />
              </div>
              <div className="mt-4 flex gap-2 text-sm">
                <button className="rounded-lg bg-accent px-3 py-2 font-medium text-white shadow-sm transition hover:brightness-110">
                  Primary action
                </button>
                <button className="rounded-lg border border-border bg-transparent px-3 py-2 font-medium text-text-primary transition hover:border-accent hover:text-accent">
                  Secondary
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-elevated p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    Form preview
                  </div>
                  <div className="text-xs text-text-secondary">
                    Adapts to density
                  </div>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  {viewMode === "compact" ? "Compact" : "Default"}
                </span>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-text-muted">Label</span>
                  <div className="rounded-lg border border-border bg-surface px-3 py-2 text-text-primary shadow-inner" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2 text-xs text-text-secondary">
                  <span>Toggle</span>
                  <div className="h-5 w-9 rounded-full bg-accent-100 relative">
                    <div className="h-4 w-4 translate-x-0.5 translate-y-0.5 rounded-full bg-accent" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppearanceSettings;
