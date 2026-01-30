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
import NoteTagsSection from "@/features/note-editing/ui/NoteTagsSection";
import CommentSection from "@/features/note-editing/ui/CommentSection";
import { cn } from "@/lib/utils";

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
  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarCollapsed ? 50 : 320 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className={cn(
        "shrink-0 rounded-lg  p-4 pl-6 flex flex-col bg-surface overflow-auto dark:border dark:border-border",
        className,
      )}
      style={{
        scrollbarGutter: "stable",
      }}
    >
      <motion.div
        initial={false}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className={cn(
          "flex items-center justify-end gap-1",
          isSidebarCollapsed && "flex-col-reverse",
        )}
      >
        {showShareActions && onShareClick && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onShareClick}
            aria-label="Share note"
            className="hover:bg-hover-overlay"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        )}

        {showPrintAction && onPrintClick && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onPrintClick}
            aria-label="Print note"
            className="hover:bg-hover-overlay"
          >
            <Printer className="w-4 h-4" />
          </Button>
        )}

        {showExpandAction && onExpandClick && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onExpandClick}
            aria-label="Expand"
            className="hover:bg-hover-overlay"
          >
            <Expand className="w-4 h-4" />
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hover:bg-hover-overlay"
          onClick={onToggleSidebar}
          aria-label={
            isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
          }
        >
          {isSidebarCollapsed ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
      </motion.div>

      <AnimatePresence initial={false}>
        {!isSidebarCollapsed && (
          <motion.div
            key="sidebar-content"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "flex flex-col space-y-10 mt-4 min-w-0 mr-2",
              contentClassName,
            )}
          >
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
              <div className="text-xs text-right mt-auto text-gray-500">
                {contentLength} chars
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};

export default CollaborativeSidebar;
