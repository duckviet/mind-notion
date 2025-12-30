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
    { value: "red", label: "Red", color: "bg-red-600" },
    { value: "orange", label: "Orange", color: "bg-orange-600" },
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
        <h2 className="text-2xl font-bold tracking-tight">Appearance</h2>
        <p className="text-muted-foreground">
          Customize the look and feel of your workspace.
        </p>
      </div>

      {/* Theme Section */}
      <Card className="border-none shadow-sm bg-white/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Theme</CardTitle>
          <CardDescription className="text-sm">
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
                      ? "border-primary/50 bg-primary/5 shadow-sm"
                      : "bg-slate-50/50 border-slate-300"
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {theme.icon}
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium">{theme.label}</span>
                    {isSelected && (
                      <div className="mt-1 flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary" />
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
        <Card className="border-none shadow-sm bg-white/80">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Primary Color
            </CardTitle>
            <CardDescription className="text-sm">
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
                      "relative flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      color.color,
                      isSelected &&
                        "ring-2 ring-offset-2 ring-primary ring-offset-background"
                    )}
                    title={color.label}
                  >
                    {isSelected && <Check className="h-4 w-4 text-white" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white/80">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Typography
            </CardTitle>
            <CardDescription className="text-sm">
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
                      "relative flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all hover:bg-muted/50",
                      isSelected
                        ? "border-primary/50 bg-primary/5 shadow-sm"
                        : "bg-slate-50/50 border-slate-300"
                    )}
                  >
                    <span
                      className={cn("text-lg font-bold", `font-${font.value}`)}
                    >
                      {font.preview}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {font.label}
                    </span>
                    {isSelected && (
                      <Check className="absolute top-2 right-2 h-3 w-3 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Section */}
      <Card className="border-none shadow-sm bg-white/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Layout Density
          </CardTitle>
          <CardDescription className="text-sm">
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
                    "relative flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all hover:border-primary/50",
                    isSelected ? "border-primary" : "border-border"
                  )}
                >
                  <div className="h-4 w-4 rounded-full border-2 border-primary mt-1 flex items-center justify-center">
                    {isSelected && <div className="h-2 w-2 rounded-full " />}
                  </div>
                  <div>
                    <div className="font-medium">{mode.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">
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
      <Card className="border-none shadow-sm bg-white/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Live Preview
          </CardTitle>
          <CardDescription className="text-sm">
            See how accent, typography, and density feel in the interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-white/70 p-4 shadow-sm dark:border-border/50 dark:bg-background/40">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    Project card
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Updated just now
                  </div>
                </div>
                <span className="rounded-full bg-[color:var(--accent-100)] px-2 py-1 text-[11px] font-medium text-[color:var(--accent-600)]">
                  Accent chip
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                <div className="h-2 rounded-full bg-[color:var(--accent-100)]" />
                <div className="h-2 w-3/4 rounded-full bg-muted/70" />
              </div>
              <div className="mt-4 flex gap-2 text-sm">
                <button className="rounded-lg bg-[color:var(--accent-600)] px-3 py-2 font-medium text-white shadow-sm transition hover:brightness-110">
                  Primary action
                </button>
                <button className="rounded-lg border border-border bg-transparent px-3 py-2 font-medium text-foreground transition hover:border-[color:var(--accent-600)]">
                  Secondary
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-white/70 p-4 shadow-sm dark:border-border/50 dark:bg-background/40">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    Form preview
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Adapts to density
                  </div>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {viewMode === "compact" ? "Compact" : "Default"}
                </span>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Label</span>
                  <div className="rounded-lg border border-border bg-white/70 px-3 py-2 text-foreground shadow-inner" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                  <span>Toggle</span>
                  <div className="h-5 w-9 rounded-full bg-[color:var(--accent-100)]">
                    <div className="h-4 w-4 translate-x-1 rounded-full bg-[color:var(--accent-600)]" />
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
