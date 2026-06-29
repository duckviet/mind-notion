import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Printer,
  Expand,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import NoteTagsSection from "./NoteTagsSection";
import CommentSection from "./CommentSection";
import { cn } from "@/shared/utils/cn";
import { Chatbot } from "@/features/chat-bot";
import { useChatbotSidebarStore } from "@/features/chat-bot";
import { MindNotionAi } from "@/shared/assets";

export interface CollaborativeSidebarProps {
  // Sidebar state
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;

  // Tags management
  tags?: string[];
  newTag?: string;
  onNewTagChange?: (value: string) => void;
  onTagAdd?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onTagRemove?: (tag: string) => void;
  tagsDisabled?: boolean;

  // Comments
  showComments?: boolean;
  noteId?: string;
  activeCommentId?: string | null;

  // Actions
  showShareActions?: boolean;
  onShareClick?: () => void;
  showPrintAction?: boolean;
  onPrintClick?: () => void;
  showExpandAction?: boolean;
  onExpandClick?: () => void;

  // Content info
  contentLength?: number;

  // Styling
  className?: string;
  contentClassName?: string;
}

export const CollaborativeSidebar: React.FC<CollaborativeSidebarProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  tags,
  newTag = "",
  onNewTagChange,
  onTagAdd,
  onTagRemove,
  tagsDisabled = false,
  showComments = false,
  noteId,
  activeCommentId,
  showShareActions = false,
  onShareClick,
  showPrintAction = false,
  onPrintClick,
  showExpandAction = false,
  onExpandClick,
  contentLength,
  className,
  contentClassName,
}) => {
  const { activeTab, setActiveTab } = useChatbotSidebarStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: 360 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className={cn(
        "flex shrink-0 flex-col overflow-y-auto rounded-lg p-2 shadow-none border border-border bg-card",
        className,
      )}
    >
      {/* Tab Switcher */}
      <div className="flex border-b border-border/60 mb-4 text-xs font-semibold shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("comments")}
          className={cn(
            "flex-1 py-2 text-center transition-colors border-b-2 cursor-pointer select-none",
            activeTab === "comments"
              ? "border-black text-black font-semibold dark:border-white dark:text-white"
              : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          💬 Comments
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("maind")}
          className={cn(
            "flex-1 py-2 text-center transition-colors border-b-2 cursor-pointer select-none flex items-center justify-center gap-1.5",
            activeTab === "maind"
              ? "border-black text-black font-semibold dark:border-white dark:text-white"
              : "border-transparent text-text-muted hover:text-text-primary"
          )}
        >
          <MindNotionAi className="w-3.5 h-3.5 shrink-0" />
          Maind
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {activeTab === "comments" ? (
          <div className="flex-1 flex flex-col space-y-6 min-w-0 px-1">
            {tags && onNewTagChange && onTagAdd && onTagRemove && (
              <NoteTagsSection
                tags={tags}
                newTag={newTag}
                onNewTagChange={onNewTagChange}
                onTagAdd={onTagAdd}
                onTagRemove={onTagRemove}
                disabled={tagsDisabled}
              />
            )}
            {showComments && noteId && (
              <CommentSection
                noteId={noteId}
                activeCommentId={activeCommentId}
              />
            )}
            {contentLength !== undefined && (
              <div className="text-[10px] text-right mt-auto text-text-muted/80 pb-2">
                {contentLength} chars
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            <Chatbot
              droppableId="chat-bot-collab-sidebar"
              className="w-full flex-1 border-none shadow-none bg-transparent max-h-[calc(100vh-140px)]"
            />
          </div>
        )}
      </div>
    </motion.aside>
  );
};

export default CollaborativeSidebar;
