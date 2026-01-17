"use client";

import React, { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  User,
  Lock,
  Palette,
  Keyboard,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AccountSettings from "./sections/AccountSettings";
import AppearanceSettings from "./sections/AppearanceSettings";
import ShortcutsSettings from "./sections/ShortcutsSettings";
import MiscSettings from "./sections/MiscSettings";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("account");

  const menuItems = [
    { id: "account", label: "Account", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
    { id: "misc", label: "Misc", icon: SettingsIcon },
  ];

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] w-full">
      {/* Mobile Tabs (Visible only on small screens) */}
      <div className="md:hidden w-full border-b border-border p-4 bg-surface">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 bg-background border border-border-subtle">
            {menuItems.slice(0, 3).map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg"
              >
                <item.icon className="h-4 w-4" />
                <span className="text-xs">{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {/* For mobile overflow, simplified logic */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
            {menuItems.slice(3).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
                  activeTab === item.id
                    ? "bg-accent text-white border-accent"
                    : "bg-surface text-text-secondary border-border hover:border-accent hover:text-accent",
                )}
              >
                <item.icon className="h-3 w-3" />
                {item.label}
              </button>
            ))}
          </div>
        </Tabs>
      </div>

      <div className="hidden md:grid grid-cols-4  w-full gap-8 relative">
        <div></div>
        {/* Content Area (left) */}
        <main className="col-span-2 w-full overflow-y-auto p-6 md:p-12 justify-center">
          <div className="mx-auto max-w-4xl">
            {activeTab === "account" && <AccountSettings />}
            {activeTab === "appearance" && <AppearanceSettings />}
            {activeTab === "shortcuts" && <ShortcutsSettings />}
            {activeTab === "misc" && <MiscSettings />}
          </div>
        </main>

        {/* Navigation Sidebar (right, sticky) */}
        <aside className="w-72 sticky top-12 right-6 self-start">
          <Card className="border border-border shadow-md bg-surface">
            <CardHeader className="text-2xl font-bold tracking-tight text-text-primary">
              Settings
            </CardHeader>
            <CardContent className="px-3">
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "group relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "text-text-primary"
                          : "text-text-muted hover:text-text-primary",
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 bg-primary rounded-e-full" />
                      )}
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          isActive
                            ? "text-text-primary"
                            : "text-text-muted group-hover:text-text-primary",
                        )}
                      />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default SettingsPage;
