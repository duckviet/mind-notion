"use client";

import Image from "next/image";
import Link from "next/link";
import { SidebarHeader } from "@/shared/components/ui/sidebar";
import { DroppableZone } from "@/shared/components/dnd";

interface MenuSidebarHeaderProps {
  onOpenChatbot: () => void;
}

export function MenuSidebarHeader({ onOpenChatbot }: MenuSidebarHeaderProps) {
  return (
    <SidebarHeader className="flex gap-2">
      <Link href="/" className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-black/5">
          <Image
            src="/mind-notion-logo.svg"
            alt="Logo"
            width={28}
            height={28}
            className="rounded-lg"
          />
        </div>
        <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
          <span className="font-bold text-lg tracking-tight leading-none truncate">
            Mind Notion
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider mt-0.5">
            Workspace
          </span>
        </div>
      </Link>

      <DroppableZone
        id="chat-bot-sidebar"
        activeClassName="ring-2 ring-yellow-300/30 ring-offset-1 rounded-lg"
      >
        <button
          type="button"
          onClick={onOpenChatbot}
          className="size-8 rounded-lg border border-sidebar-border/60 bg-muted/40 hover:bg-muted/70 transition-colors flex items-center justify-center"
          aria-label="Open chatbot"
          title="Mở chatbot hoặc kéo note vào đây"
        >
          <Image
            src="/mind-notion-ai.svg"
            alt="AI"
            width={18}
            height={18}
            className="rounded"
          />
        </button>
      </DroppableZone>
    </SidebarHeader>
  );
}
