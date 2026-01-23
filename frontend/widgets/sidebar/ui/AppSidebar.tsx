"use client";

import {
  HomeIcon,
  SettingsIcon,
  LogOutIcon,
  ShoppingBag,
  PackageIcon,
  Clock,
  FileIcon,
  Users,
  Palette,
  HelpCircle,
  Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import authAction from "@/shared/services/actions/auth.action";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/shared/components/ui/sidebar";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  FOOTER_ITEMS,
  MAIN_ITEMS,
  SECONDARY_ITEMS,
} from "@/shared/configs/sidebarConfigs";

// ... (Các mảng ITEMS giữ nguyên như của bạn)

export function AppSidebar() {
  const pathname = usePathname();
  const { logout: clearAuthStore, user } = useAuthStore();

  const handleLogout = useCallback(async () => {
    try {
      await authAction.logout();
    } finally {
      clearAuthStore();
    }
  }, [clearAuthStore]);

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="sticky text-text-primary py-6 ml-2"
    >
      {/* Header - Logo */}
      <SidebarHeader className="flex items-center">
        <Link href="/" className="flex items-center gap-3 w-full">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-black/5">
            <Image
              src="/mind-notion-logo.svg"
              alt="Logo"
              width={28}
              height={28}
              className="rounded-lg"
            />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-lg  tracking-tight leading-none">
              Mind Notion
            </span>
            <span className="text-[10px]  font-medium uppercase tracking-wider mt-0.5">
              Workspace
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Search Input - Thiết kế lại cho gọn */}
      <div className="p-2 group-data-[collapsible=icon]:hidden">
        <div className="relative flex items-center">
          <Search className="absolute left-3 size-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-lg border border-sidebar-border bg-sidebar-bg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent-500/40 transition-all placeholder:text-text-muted"
          />
        </div>
      </div>

      <SidebarContent className="">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {MAIN_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "h-10 px-3 rounded-lg transition-all",
                        isActive
                          ? " -100 font-semibold !text-text-primary"
                          : "hover:bg-sidebar-accent/50 !text-text-muted",
                      )}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3"
                      >
                        <item.icon
                          className={cn(
                            "size-5",
                            isActive ? "text-text-primary" : "text-text-muted",
                          )}
                        />
                        <p
                          className={cn(
                            "text-sm",
                            isActive ? "text-text-primary" : "text-text-muted",
                          )}
                        >
                          {item.label}
                        </p>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="my-2 px-4 group-data-[collapsible=icon]:hidden">
          <div className="h-px w-full bg-sidebar-border/50"></div>
        </div>

        {/* Secondary Actions */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {SECONDARY_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "h-10 px-3 rounded-lg transition-all",
                        isActive
                          ? " -100 font-semibold"
                          : "hover:bg-sidebar-accent/50 ",
                      )}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3"
                      >
                        <item.icon
                          className={cn(
                            "size-5",
                            isActive ? "text-text-primary" : "text-text-muted",
                          )}
                        />
                        <p
                          className={cn(
                            "text-sm",
                            isActive ? "text-text-primary" : "text-text-muted",
                          )}
                        >
                          {item.label}
                        </p>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="flex-1" />

        {/* Footer Actions */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {FOOTER_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className="h-10 px-3 rounded-xl /60 hover: hover:bg-sidebar-accent/50"
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3"
                      >
                        <item.icon className="size-5" />
                        <span className="text-[14px]">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile Card - Refined */}
      <SidebarFooter className=" border-t border-sidebar-border bg-sidebar-bg/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="group flex items-center gap-3 rounded-2xl transition-all hover:bg-sidebar-accent/50">
              <div className="relative shrink-0">
                <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-accent/10 text-accent font-bold">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-sidebar-bg shadow-sm"></div>
              </div>

              <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold text-sm  leading-none">
                  {user?.email?.split("@")[0] || "User Name"}
                </span>
                <span className="truncate text-[11px]  font-medium mt-1">
                  {user?.email || "user@example.com"}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="ml-auto p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all group-data-[collapsible=icon]:hidden"
                title="Log out"
              >
                <LogOutIcon className="size-4" />
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
