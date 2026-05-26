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
    <div className="mx-auto min-h-screen w-full max-w-7xl bg-background py-6 px-6 text-foreground">
      <h1 className="mb-10 font-serif text-display font-normal leading-display text-text-primary">
        Settings
      </h1>
      <div className="w-full py-8 md:py-12">
        <div className="flex flex-col gap-8 md:flex-row">
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
                      "block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      isActive(item.href)
                        ? "bg-accent font-medium text-text-primary"
                        : "text-text-muted hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-8 px-2">
                <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Billing
                </div>
                <nav className="space-y-1">
                  <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground">
                    Payouts
                  </button>
                  <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground">
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
