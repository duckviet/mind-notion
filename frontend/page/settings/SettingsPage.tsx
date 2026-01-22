"use client";

import React, { useState } from "react";
import {
  User,
  Lock,
  Palette,
  Keyboard,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AccountSettings from "./sections/AccountSettings";
import PasswordSettings from "./sections/PasswordSettings";
import AppearanceSettings from "./sections/AppearanceSettings";
import ShortcutsSettings from "./sections/ShortcutsSettings";
import MiscSettings from "./sections/MiscSettings";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("account");

  const menuItems = [
    { id: "account", label: "General", icon: User },
    { id: "password", label: "Password", icon: Lock },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
    { id: "misc", label: "Misc", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground mx-auto max-w-7xl w-full">
      <h1 className=" font-bold tracking-tight text-text-primary mb-10 pt-10">
        Settings
      </h1>
      <div className="py-8 md:py-12 w-full">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="sticky top-8">
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      activeTab === item.id
                        ? "font-medium text-text-primary bg-accent/10"
                        : " text-text-muted hover:text-foreground hover:bg-accent/5",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="mt-8 px-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Billing
                </div>
                <nav className="space-y-1">
                  <button className="w-full text-left px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/5">
                    Payouts
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/5">
                    Invoices
                  </button>
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {activeTab === "account" && <AccountSettings />}
            {activeTab === "password" && <PasswordSettings />}
            {activeTab === "appearance" && <AppearanceSettings />}
            {activeTab === "shortcuts" && <ShortcutsSettings />}
            {activeTab === "misc" && <MiscSettings />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
