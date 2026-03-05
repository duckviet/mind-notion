"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { SidebarHeader } from "@/shared/components/ui/sidebar";

interface ChatbotSidebarHeaderProps {
  onOpenMenu: () => void;
}

export function ChatbotSidebarHeader({
  onOpenMenu,
}: ChatbotSidebarHeaderProps) {
  return (
    <SidebarHeader className="flex-row items-center justify-between gap-2 px-4 py-3 border-b border-sidebar-border/50">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-black/5">
          <Image
            src="/mind-notion-ai.svg"
            alt="Logo"
            width={28}
            height={28}
            className="rounded-lg"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary leading-none truncate">
            Maind
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">AI assistant</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenMenu}
        className="w-8 h-8 rounded-full hover:bg-muted/70 transition-colors flex items-center justify-center"
        aria-label="Switch to normal sidebar"
        title="Quay lại sidebar"
      >
        <ArrowLeft className="w-4 h-4 text-text-muted" />
      </button>
    </SidebarHeader>
  );
}
