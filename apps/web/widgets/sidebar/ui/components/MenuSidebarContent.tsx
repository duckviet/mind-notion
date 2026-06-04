"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/shared/utils/cn";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar";
import {
  FOOTER_ITEMS,
  MAIN_ITEMS,
  SECONDARY_ITEMS,
} from "@/shared/configs/sidebarConfigs";
import { FileFolderTree } from "./FileFolderTree";

interface MenuSidebarContentProps {
  pathname: string;
}

export function MenuSidebarContent({ pathname }: MenuSidebarContentProps) {
  const primaryItems = MAIN_ITEMS.filter((item) => item.href !== "/folder");

  return (
    <>
      <div className="p-2 group-data-[collapsible=icon]:hidden">
        <div className="relative flex items-center">
          <Search className="absolute left-3 size-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-lg border border-sidebar-border bg-surface-50/70 py-2 pl-9 pr-4 text-sm text-text-primary outline-none transition-all placeholder:text-stone focus:border-border-strong focus:ring-2 focus:ring-ring/20"
          />
        </div>
      </div>

      <SidebarContent
        style={{ scrollbarGutter: "stable", scrollbarWidth: "none" }}
      >
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2">
              {primaryItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "h-10 rounded-lg px-3 transition-all",
                        isActive
                          ? "bg-sidebar-accent font-medium !text-text-primary"
                          : "hover:bg-sidebar-accent/60 !text-text-muted",
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

            <div className="py-2 pl-2 w-[250px]">
              <FileFolderTree pathname={pathname} />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="my-2 px-4 group-data-[collapsible=icon]:hidden">
          <div className="h-px w-full bg-sidebar-border/50"></div>
        </div>

        <SidebarGroup className="p-2">
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
                        "h-10 rounded-lg px-3 transition-all",
                        isActive
                          ? "bg-sidebar-accent font-medium"
                          : "hover:bg-sidebar-accent/60",
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

        <SidebarGroup className="mt-auto p-2">
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
                      className="h-10 rounded-lg px-3 hover:bg-sidebar-accent/60"
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
    </>
  );
}
