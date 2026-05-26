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
    <SidebarFooter className="border-t border-sidebar-border bg-sidebar rounded-b-lg">
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="group flex items-center gap-3 rounded-lg transition-all hover:bg-sidebar-accent/60">
            <div className="relative shrink-0">
              <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 font-medium">
                {userEmail?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="absolute bottom-0 right-0 size-3 rounded-full bg-terra-cotta ring-2 ring-sidebar"></div>
            </div>

            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-medium leading-none text-text-primary">
                {userEmail?.split("@")[0] || "User Name"}
              </span>
              <span className="mt-1 truncate text-[11px] font-medium text-text-secondary">
                {userEmail || "user@example.com"}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="ml-auto rounded-[8px] p-1.5 text-text-muted transition-all hover:bg-accent hover:text-destructive group-data-[collapsible=icon]:hidden"
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
