"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type SettingsPageProps = {
  children: React.ReactNode;
};

const menuItems = [
  { id: "general", label: "General", href: "/settings/general" },
  { id: "password", label: "Password", href: "/settings/password" },
  { id: "appearance", label: "Appearance", href: "/settings/appearance" },
  { id: "shortcuts", label: "Shortcuts", href: "/settings/shortcuts" },
  { id: "misc", label: "Misc", href: "/settings/misc" },
];

const SettingsPage = ({ children }: SettingsPageProps) => {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-background text-foreground mx-auto max-w-7xl w-full py-6">
      <h1 className=" font-bold tracking-tight text-text-primary mb-10">
        Settings
      </h1>
      <div className="py-8 md:py-12 w-full">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Sidebar */}
          <aside className="w-full md:w-48 flex-shrink-0">
            <div className="sticky top-8">
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "block w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      isActive(item.href)
                        ? "font-medium text-text-primary bg-accent/10"
                        : " text-text-muted hover:text-foreground hover:bg-accent/5",
                    )}
                  >
                    {item.label}
                  </Link>
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
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
