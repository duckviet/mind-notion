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
      <div className="md:hidden w-full border-b   p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50">
            {menuItems.slice(0, 3).map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <item.icon className="h-4 w-4" />
                <span className="text-xs">{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {/* For mobile overflow, simplified logic */}
          <div className="flex gap-2 mt-2 overflow-x-auto pb-2 scrollbar-hide">
            {menuItems.slice(3).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
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
          <Card className="border-none shadow-sm bg-white/80">
            <CardHeader className="text-2xl font-bold tracking-tight text-foreground">
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
                        "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          isActive
                            ? "text-primary-foreground"
                            : "text-muted-foreground group-hover:text-accent-foreground"
                        )}
                      />
                      {item.label}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground/20" />
                      )}
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
