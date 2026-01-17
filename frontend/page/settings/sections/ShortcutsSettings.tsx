"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import {
  Keyboard,
  Search,
  FileText,
  Navigation,
  Type,
  MousePointer2,
} from "lucide-react";

const shortcuts = [
  {
    category: "General",
    icon: <Keyboard className="h-4 w-4" />,
    items: [
      { key: "⌘ K", description: "Open command palette" },
      { key: "⌘ /", description: "Show keyboard shortcuts" },
      { key: "Esc", description: "Close modal or cancel" },
    ],
  },
  {
    category: "Navigation",
    icon: <Navigation className="h-4 w-4" />,
    items: [
      { key: "⌘ N", description: "Create new item" },
      { key: "⌘ F", description: "Search" },
      { key: "G then G", description: "Go to file" },
    ],
  },
  {
    category: "Editor",
    icon: <FileText className="h-4 w-4" />,
    items: [
      { key: "⌘ B", description: "Bold text" },
      { key: "⌘ I", description: "Italic text" },
      { key: "⌘ S", description: "Save changes" },
    ],
  },
  {
    category: "View",
    icon: <MousePointer2 className="h-4 w-4" />,
    items: [
      { key: "⌘ +", description: "Zoom in" },
      { key: "⌘ -", description: "Zoom out" },
      { key: "⌘ 0", description: "Reset zoom" },
    ],
  },
];

const Kbd = ({ children }: { children: React.ReactNode }) => {
  return (
    <kbd className="inline-flex items-center justify-center rounded border border-border bg-surface-elevated px-2 py-1.5 text-xs font-semibold text-text-primary shadow-sm transition-colors hover:bg-hover">
      {children}
    </kbd>
  );
};

const ShortcutsSettings = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 delay-100">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          Keyboard Shortcuts
        </h2>
        <p className="text-text-secondary">
          Master the keyboard to navigate and perform actions faster.
        </p>
      </div>

      <Card className="border border-border shadow-sm bg-surface">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-text-primary">
            Available Shortcuts
          </CardTitle>
          <CardDescription className="text-text-secondary">
            Click on a shortcut to copy it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 md:grid-cols-2">
            {shortcuts.map((category, idx) => (
              <div key={category.category} className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <div className="text-accent">{category.icon}</div>
                  {category.category}
                </div>
                <div className="space-y-3">
                  {category.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="group flex items-center justify-between rounded-lg border border-transparent bg-surface-elevated p-2.5 transition-all hover:border-border hover:bg-hover"
                    >
                      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                        {item.description}
                      </span>
                      <div className="flex gap-1">
                        {item.key.split(" ").map((k, i) => (
                          <Kbd key={i}>{k}</Kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {idx < shortcuts.length - 1 && (
                  <div className="hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShortcutsSettings;
