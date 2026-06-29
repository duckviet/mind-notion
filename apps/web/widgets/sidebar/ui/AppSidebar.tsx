"use client";

import { usePathname } from "next/navigation";
import { useCallback } from "react";
import { useChatbotSidebarStore } from "@/features/chat-bot";
import { useAuthStore } from "@/features/auth";
import authAction from "@/shared/services/actions/auth.action";
import {
  Sidebar,
  SidebarRail,
} from "@/shared/components/ui/sidebar";
import { MenuSidebarContent } from "./components/MenuSidebarContent";
import { MenuSidebarFooter } from "./components/MenuSidebarFooter";
import { MenuSidebarHeader } from "./components/MenuSidebarHeader";

export function AppSidebar() {
  const pathname = usePathname();
  const { logout: clearAuthStore, user } = useAuthStore();
  const { isOpen, setIsOpen } = useChatbotSidebarStore();

  const handleLogout = useCallback(async () => {
    try {
      await authAction.logout();
    } finally {
      clearAuthStore();
    }
  }, [clearAuthStore]);

  const handleToggleChatbot = useCallback(() => {
    setIsOpen(!isOpen);
  }, [setIsOpen, isOpen]);

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="sticky ml-2 max-w-[400px] py-6 text-text-primary shadow-none"
    >
      <MenuSidebarHeader onOpenChatbot={handleToggleChatbot} />
      <MenuSidebarContent pathname={pathname} />
      <MenuSidebarFooter userEmail={user?.email} onLogout={handleLogout} />
      <SidebarRail />
    </Sidebar>
  );
}
