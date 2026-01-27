"use client";

import React, { useCallback, useRef } from "react";
import { format } from "date-fns";
import dayjs from "dayjs";
import {
  Calendar,
  User,
  Clock,
  AlertCircle,
  Copy,
  Check,
  PrinterIcon,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";

import { RichTextEditor } from "@/shared/components/RichTextEditor";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { cn } from "@/lib/utils";
import { CollaborationConfig } from "@/shared/components/RichTextEditor/useTiptapEditor";

export interface NotePageProps {
  // Note data
  note?: {
    id: string;
    title: string;
    content: string;
    created_at?: string | Date;
    updated_at?: string | Date;
    tags?: string[];
    [key: string]: any;
  } | null;

  // States
  isLoading?: boolean;
  error?: Error | null;
  isSynced?: boolean;
  isHydrated?: boolean;

  // Mode: "view" (read-only) or "edit" (editable)
  mode?: "view" | "edit";

  // Editor callbacks
  onContentUpdate?: (content: string) => void;
  onEditorReady?: (editor: import("@tiptap/react").Editor) => void;

  // Collaboration
  collaboration?: CollaborationConfig;

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
  onContentUpdate,
  onEditorReady,
  collaboration,
  containerClassName,
}) => {
  const [copied, setCopied] = React.useState(false);
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

  const isEditable = mode === "edit";
  const showEditor = !collaboration || isHydrated;

  // Format date
  const formatDate = (date?: string | Date) => {
    if (!date) return "Unknown date";
    // Check if using date-fns or dayjs
    if (typeof date === "string" && date.includes("T")) {
      return dayjs(date).format("MMM D, YYYY");
    }
    return format(new Date(date), "MMM d, yyyy");
  };

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
    <div
      className={cn(
        "h-screen   bg-background w-full  px-4 py-6 mx-auto",
        containerClassName,
      )}
    >
      <div className="flex flex-col p-6 rounded-lg bg-accent h-full overflow-y-auto">
        {/* Header */}
        <header className="mb-4 px-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 leading-tight">
              {note.title}
            </h1>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="shrink-0 gap-2 hover:bg-foreground/50"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied" : "Copy Link"}
              </Button>
              <Button
                size="sm"
                className="shrink-0 gap-2 hover:bg-foreground/50"
                onClick={handlePrint}
              >
                <PrinterIcon /> Print
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div
            className={cn(
              "flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-4",
              !isEditable && "border-b border-border pb-6",
            )}
          >
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 px-3 py-1.5 rounded-full">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(note.created_at)}</span>
            </div>
            {note.updated_at && (
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4" />
                <span>Updated {formatDate(note.updated_at)}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 px-3 py-1.5 rounded-full">
              <User className="w-4 h-4" />
              <span>{isEditable ? "Editable Link" : "Public View"}</span>
            </div>
          </div>
        </header>

        {/* Content Editor */}
        {showEditor && (
          <div ref={contentRef} className=" ">
            <RichTextEditor
              content={isEditable ? note.content : sanitizeHtml(note.content)}
              editable={isEditable}
              showEditor={true}
              toolbar={isEditable}
              onUpdate={isEditable ? onContentUpdate : undefined}
              onEditorReady={isEditable ? onEditorReady : undefined}
              collaboration={isEditable ? collaboration : undefined}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground flex-1 content-end">
          <p>Shared via Mind Notion</p>
        </footer>
      </div>
    </div>
  );
};

export default NotePage;
