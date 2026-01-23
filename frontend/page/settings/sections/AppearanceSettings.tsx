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
    { value: "light", label: "Light", icon: <Sun className="h-5 w-5" /> },
    { value: "dark", label: "Dark", icon: <Moon className="h-5 w-5" /> },
    {
      value: "black",
      label: "Black",
      icon: <div className="h-5 w-5 rounded-full bg-black" />,
    },
    { value: "auto", label: "Auto", icon: <Monitor className="h-5 w-5" /> },
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
    { value: "neutral", label: "Neutral", color: "bg-neutral-500" },
    { value: "blue", label: "Blue", color: "bg-blue-500" },
    { value: "purple", label: "Purple", color: "bg-purple-500" },
    { value: "green", label: "Green", color: "bg-green-500" },
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          Appearance
        </h2>
        <p className="text-text-secondary">
          Customize the look and feel of your workspace.
        </p>
      </div>

      {/* Theme Section */}
      <Card className="border border-border   shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-text-primary">
            Theme
          </CardTitle>
          <CardDescription className="text-sm text-text-secondary">
            Select the color scheme that suits your environment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {themes.map((theme) => {
              const isSelected =
                settingsTheme === theme.value ||
                (theme.value === "auto" && currentTheme === "system");
              return (
                <button
                  key={theme.value}
                  onClick={() => handleThemeChange(theme.value)}
                  className={cn(
                    "group relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-4 py-5 transition-all duration-200",
                    isSelected
                      ? "border-border-strong   shadow-sm"
                      : "border-border bg-muted hover:border-text-secondary hover:bg-muted-hover",
                  )}
                >
                  <div className="text-text-secondary">{theme.icon}</div>
                  <span className="text-sm font-medium text-text-primary">
                    {theme.label}
                  </span>
                  {isSelected && (
                    <Check className="absolute bottom-2 h-4 w-4 text-text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Primary Color & Typography */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Primary Color */}
        <Card className="border border-border   shadow-sm">
          <CardHeader className="pb-4">
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
                      "relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 hover:scale-110",
                      color.color,
                      isSelected &&
                        "ring-2 ring-accent ring-offset-2 ring-offset-surface",
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

        {/* Typography */}
        <Card className="border border-border   shadow-sm">
          <CardHeader className="pb-4">
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
                      "relative flex flex-col items-center justify-center rounded-xl border-2 px-3 py-4 transition-all duration-200",
                      isSelected
                        ? "border-accent bg-accent-light"
                        : "border-border bg-muted hover:border-text-secondary hover:bg-muted-hover",
                    )}
                  >
                    <span
                      className={cn(
                        "text-xl font-semibold",
                        isSelected ? "text-accent" : "text-text-primary",
                      )}
                    >
                      {font.preview}
                    </span>
                    <span
                      className={cn(
                        "mt-1 text-xs",
                        isSelected ? "text-accent" : "text-text-muted",
                      )}
                    >
                      {font.label}
                    </span>
                    {isSelected && (
                      <Check className="absolute right-2 top-2 h-4 w-4 text-accent" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Layout Density */}
      <Card className="border border-border   shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-text-primary">
            Layout Density
          </CardTitle>
          <CardDescription className="text-sm text-text-secondary">
            Adjust the spacing of elements in the interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {viewModes.map((mode) => {
              const isSelected = viewMode === mode.value;
              return (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value)}
                  className={cn(
                    "relative flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200",
                    isSelected
                      ? "border-accent bg-accent-light"
                      : "border-border bg-muted hover:border-text-secondary hover:bg-muted-hover",
                  )}
                >
                  {/* Radio indicator */}
                  <div
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                      isSelected ? "border-accent" : "border-text-muted",
                    )}
                  >
                    {isSelected && (
                      <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                    )}
                  </div>
                  <div>
                    <div
                      className={cn(
                        "font-medium",
                        isSelected ? "text-accent" : "text-text-primary",
                      )}
                    >
                      {mode.label}
                    </div>
                    <div className="mt-1 text-sm text-text-secondary">
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
      <Card className="border border-border   shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-text-primary">
            Live Preview
          </CardTitle>
          <CardDescription className="text-sm text-text-secondary">
            See how your settings look in the interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Preview Card 1 */}
            <div className="rounded-xl border border-border bg-muted p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    Project card
                  </div>
                  <div className="text-xs text-text-secondary">
                    Updated just now
                  </div>
                </div>
                <span className="rounded-full bg-accent-light px-2.5 py-1 text-xs font-medium text-accent">
                  Active
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-2 rounded-full bg-accent-light" />
                <div className="h-2 w-3/4 rounded-full bg-border" />
              </div>
              <div className="mt-4 flex gap-2">
                <button className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-text-inverse transition-colors hover:bg-accent-hover">
                  Primary
                </button>
                <button className="rounded-lg border border-border   px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent hover:text-accent">
                  Secondary
                </button>
              </div>
            </div>

            {/* Preview Card 2 */}
            <div className="rounded-xl border border-border bg-muted p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-text-primary">
                    Form preview
                  </div>
                  <div className="text-xs text-text-secondary">
                    Adapts to density
                  </div>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {viewMode}
                </span>
              </div>
              <div className="mt-3 space-y-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-text-muted">Input label</span>
                  <div className="rounded-lg border border-border   px-3 py-2 text-sm text-text-muted">
                    Placeholder text
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2">
                  <span className="text-xs text-text-secondary">Toggle</span>
                  <div className="relative h-5 w-9 rounded-full bg-accent">
                    <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm" />
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
