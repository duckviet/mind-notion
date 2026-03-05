"use client";

import { LogOutIcon } from "lucide-react";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar";

interface MenuSidebarFooterProps {
  userEmail?: string | null;
  onLogout: () => void;
}

export function MenuSidebarFooter({
  userEmail,
  onLogout,
}: MenuSidebarFooterProps) {
  return (
    <SidebarFooter className="border-t border-sidebar-border bg-sidebar-bg/50">
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="group flex items-center gap-3 rounded-2xl transition-all hover:bg-sidebar-accent/50">
            <div className="relative shrink-0">
              <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-accent/10 text-accent font-bold">
                {userEmail?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-sidebar-bg shadow-sm"></div>
            </div>

            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold text-sm leading-none">
                {userEmail?.split("@")[0] || "User Name"}
              </span>
              <span className="truncate text-[11px] font-medium mt-1">
                {userEmail || "user@example.com"}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="ml-auto p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all group-data-[collapsible=icon]:hidden"
              title="Log out"
            >
              <LogOutIcon className="size-4" />
            </button>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
