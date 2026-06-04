"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Chatbot } from "@/features/chat-bot";
import { useChatbotSidebarStore } from "@/features/chat-bot";
import { useAuthStore } from "@/features/auth";
import authAction from "@/shared/services/actions/auth.action";
import {
  Sidebar,
  SidebarContent,
  SidebarRail,
  useSidebar,
} from "@/shared/components/ui/sidebar";
import { ChatbotSidebarHeader } from "./components/ChatbotSidebarHeader";
import { MenuSidebarContent } from "./components/MenuSidebarContent";
import { MenuSidebarFooter } from "./components/MenuSidebarFooter";
import { MenuSidebarHeader } from "./components/MenuSidebarHeader";

type SidebarMode = "menu" | "chatbot";

export function AppSidebar() {
  const pathname = usePathname();
  const { logout: clearAuthStore, user } = useAuthStore();
  const { setOpen } = useSidebar();
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("menu");
  const droppedNotePayload = useChatbotSidebarStore(
    (state) => state.droppedNotePayload,
  );

  const isChatbotMode = sidebarMode === "chatbot";

  useEffect(() => {
    if (!droppedNotePayload) {
      return;
    }

    setSidebarMode("chatbot");
    setOpen(true);
  }, [droppedNotePayload, setOpen]);

  const handleLogout = useCallback(async () => {
    try {
      await authAction.logout();
    } finally {
      clearAuthStore();
    }
  }, [clearAuthStore]);

  const openChatbot = useCallback(() => {
    setSidebarMode("chatbot");
    setOpen(true);
  }, [setOpen]);

  const openMenu = useCallback(() => {
    setSidebarMode("menu");
  }, []);

  return (
    <Sidebar
      // side={isChatbotMode ? "right" : "left"}
      collapsible={isChatbotMode ? "offcanvas" : "icon"}
      variant="floating"
      className="sticky ml-2 max-w-[400px] py-6 text-text-primary shadow-none"
    >
      {isChatbotMode ? (
        <ChatbotSidebarHeader onOpenMenu={openMenu} />
      ) : (
        <MenuSidebarHeader onOpenChatbot={openChatbot} />
      )}

      {isChatbotMode ? (
        <SidebarContent className="p-0 overflow-hidden">
          <Chatbot
            droppableId="chat-bot-sidebar"
            className="max-w-[400px]"
            droppedNotePayload={droppedNotePayload}
          />
        </SidebarContent>
      ) : (
        <>
          <MenuSidebarContent pathname={pathname} />
          <MenuSidebarFooter userEmail={user?.email} onLogout={handleLogout} />
        </>
      )}

      <SidebarRail />
    </Sidebar>
  );
}
