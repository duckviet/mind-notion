"use client";

import Image from "next/image";
import Link from "next/link";
import { SidebarHeader } from "@/shared/components/ui/sidebar";
import { DroppableZone } from "@/shared/components/dnd";
import { MindNotionAi, MindNotionLogo } from "@/public";

interface MenuSidebarHeaderProps {
  onOpenChatbot: () => void;
}

export function MenuSidebarHeader({ onOpenChatbot }: MenuSidebarHeaderProps) {
  return (
    <SidebarHeader className="flex gap-2">
      <Link href="/" className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex aspect-square size-8 items-center justify-center rounded-md shadow-sm">
          <MindNotionLogo className="rounded-lg dark:text-white" />
        </div>
        <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
          <span className="truncate font-serif text-lg font-normal leading-none">
            Mind Notion
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase text-text-secondary">
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
          className="flex size-8 items-center justify-center transition-colors"
          aria-label="Open chatbot"
          title="Mở chatbot hoặc kéo note vào đây"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-md shadow-sm">
            <MindNotionAi className="rounded-lg dark:text-white" />
          </div>
        </button>
      </DroppableZone>
    </SidebarHeader>
  );
}
