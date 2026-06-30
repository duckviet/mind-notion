"use client";

import React, { useCallback, useRef, useState } from "react";
import { format } from "date-fns";
import dayjs from "dayjs";
import { Calendar, User, Clock, AlertCircle, Copy, Check } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";

import Link from "next/link";
import { useChatbotSidebarStore } from "@/features/chat-bot";
import { MindNotionAi } from "@/shared/assets";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { sanitizeHtml } from "@/shared/utils/sanitizeHtml";
import { cn } from "@/shared/utils/cn";
import { CollaborationConfig } from "@/shared/components/RichTextEditor/useTiptapEditor";
import { CollaborativeSidebar } from "@/features/note-editing";
import { ShareNoteModal } from "@/features/note-editing";
import usePersistentState from "@/shared/hooks/usePersistentState/usePersistentState";
import { ModalProvider } from "@/shared/contexts/ModalContext";
import {
  ResCollabTokenNote,
  ResDetailNote,
} from "@/shared/services/generated/api";

export interface NotePageProps {
  // Note data
  note?: ResCollabTokenNote | ResDetailNote;

  // States
  isLoading?: boolean;
  error?: Error | null;
  isSynced?: boolean;
  isHydrated?: boolean;

  // Mode: "view" (read-only) or "edit" (editable)
  mode?: "view" | "edit";

  // Title management
  onTitleChange?: (value: string) => void;

  // Editor callbacks
  onContentUpdate?: (content: string) => void;
  onEditorReady?: (editor: import("@tiptap/react").Editor) => void;

  // Collaboration
  collaboration?: CollaborationConfig;
  collabEnabled?: boolean;

  // Tags management
  newTag?: string;
  onNewTagChange?: (value: string) => void;
  onTagAdd?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onTagRemove?: (tag: string) => void;

  // Share functionality
  isPublic?: boolean;
  showShareActions?: boolean;
  showComments?: boolean;

  // Optional: Custom className for container
  containerClassName?: string;
}

export const NotePage: React.FC<NotePageProps> = ({
  note,
  isLoading = false,
  error = null,
  isSynced = true,
  isHydrated = true,
  mode = "view",
  onTitleChange,
  onContentUpdate,
  onEditorReady,
  collaboration,
  collabEnabled = false,
  newTag = "",
  onNewTagChange,
  onTagAdd,
  onTagRemove,
  isPublic = false,
  showShareActions = false,
  showComments = false,
  containerClassName,
}) => {
  const { activeTab, setActiveTab } = useChatbotSidebarStore();
  const [copied, setCopied] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = usePersistentState(
    "note-sidebar",
    false,
  );
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: note?.title,
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const isEditable = mode === "edit";
  const shouldWaitForCollabHydration = isEditable && collabEnabled;
  const showEditor = !shouldWaitForCollabHydration || isHydrated;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex justify-center items-start pt-20">
        <div className="w-full max-w-4xl space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4 rounded-lg" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (error || !note) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-accent p-8 rounded-xl border border-border shadow-sm text-center max-w-md w-full">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-semibold mb-2">
            {isEditable ? "Edit Link Unavailable" : "Note Unavailable"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isEditable
              ? "This edit link is invalid or has been disabled."
              : "This note may be private, deleted, or does not exist."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ModalProvider>
      <div
        className={cn(
          "h-screen flex w-full gap-4 px-4 py-6 mx-auto bg-background",
          containerClassName,
        )}
      >
        <div className="flex h-full w-fit flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-lg bg-card p-6 shadow-none dark:border dark:border-border">
          {/* Header */}
          <header className="mb-4 px-6 space-y-6">
            <div className="flex items-center justify-between w-full text-sm text-text-muted">
              <div className="flex items-center gap-1.5 font-medium">
                <Link href="/" className="hover:text-text-primary transition-colors">
                  ← Home
                </Link>
                <span>/</span>
                <span className="truncate max-w-[200px] text-text-primary">
                  {note.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-2 hover:bg-muted/70 text-xs py-1 h-8 rounded-md bg-surface-50 border border-border"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied" : "Copy Link"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab("maind")}
                  className={cn(
                    "shrink-0 gap-1.5 text-xs py-1 h-8 rounded-md bg-surface-50 border border-border font-medium",
                    activeTab === "maind" ? "bg-black text-white hover:bg-neutral-800" : "hover:bg-muted/70"
                  )}
                >
                  <MindNotionAi className="w-3.5 h-3.5 shrink-0" />
                  <span>Maind</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              {isEditable ? (
                <input
                  value={note.title}
                  onChange={(e) => onTitleChange?.(e.target.value)}
                  placeholder="Your note title..."
                  className="w-full bg-transparent font-serif text-3xl font-normal leading-tight text-text-primary outline-none placeholder:text-stone md:text-5xl animate-fade-in"
                  maxLength={200}
                />
              ) : (
                <h1 className="font-serif text-3xl font-normal leading-tight text-text-primary md:text-5xl">
                  {note.title}
                </h1>
              )}
            </div>
          </header>

          {/* Content Editor */}
          {showEditor && (
            <RichTextEditor
              noteId={note.id}
              content={isEditable ? note.content : sanitizeHtml(note.content)}
              editable={isEditable}
              showEditor={true}
              toolbar={true}
              onUpdate={isEditable ? onContentUpdate : undefined}
              onEditorReady={isEditable ? onEditorReady : undefined}
              collaboration={isEditable ? collaboration : undefined}
              contentRef={contentRef}
              onActiveCommentChange={setActiveCommentId}
            />
          )}

          {/* Footer */}
          <footer className="mt-12 text-center text-sm text-muted-foreground flex-1 content-end">
            <p>Shared via Mind Notion</p>
          </footer>
        </div>

        {/* Collaborative Sidebar */}
        <CollaborativeSidebar
          isSidebarCollapsed={isSidebarCollapsed || false}
          onToggleSidebar={handleToggleSidebar}
          tags={isEditable ? note.tags : undefined}
          newTag={newTag}
          onNewTagChange={isEditable ? onNewTagChange : undefined}
          onTagAdd={isEditable ? onTagAdd : undefined}
          onTagRemove={isEditable ? onTagRemove : undefined}
          tagsDisabled={false}
          showComments={showComments}
          noteId={note.id}
          activeCommentId={activeCommentId}
          showShareActions={showShareActions && isEditable}
          onShareClick={() => setIsShareModalOpen(true)}
          showPrintAction
          onPrintClick={handlePrint}
          contentLength={note.content?.length || 0}
          className="border border-border bg-card"
        />

        {note.id && showShareActions && isEditable && (
          <ShareNoteModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            noteId={note.id}
            isPublic={isPublic}
            title={note.title}
          />
        )}
      </div>
    </ModalProvider>
  );
};

export default NotePage;
