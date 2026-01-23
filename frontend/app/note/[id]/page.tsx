"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar, User, Clock, AlertCircle, Copy, Check } from "lucide-react";
import { useGetPublicNote } from "@/shared/services/generated/api";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NotePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);

  const {
    data: note,
    isLoading,
    error,
  } = useGetPublicNote(id, {
    query: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  });

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen  p-4 md:p-8 flex justify-center items-start pt-20">
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

  if (error || !note) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-accent p-8 rounded-xl border border-border shadow-sm text-center max-w-md w-full">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Note Unavailable</h1>
          <p className="text-muted-foreground mb-6">
            This note may be private, deleted, or does not exist.
          </p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background w-full overflow-y-auto  px-4 py-6  mx-auto ">
      <div className="p-6 rounded-lg bg-accent">
        <header className="mb-8 md:mb-12 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 leading-tight">
              {note.title}
            </h1>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied" : "Copy Link"}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b border-border pb-6">
            <div className="flex items-center gap-1.5  -100 px-3 py-1.5 rounded-full">
              <Calendar className="w-4 h-4" />
              <span>
                {note.created_at
                  ? format(new Date(note.created_at), "MMM d, yyyy")
                  : "Unknown date"}
              </span>
            </div>
            {note.updated_at && (
              <div className="flex items-center gap-1.5  -100 px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4" />
                <span>
                  Updated {format(new Date(note.updated_at), "MMM d, yyyy")}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5  -100 px-3 py-1.5 rounded-full">
              <User className="w-4 h-4" />
              <span>Public View</span>
            </div>
          </div>
        </header>

        <RichTextEditor
          content={note.content}
          editable={false}
          showTOC={true}
          toolbar={false}
        />

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Shared via Mind Notion</p>
        </footer>
      </div>
    </div>
  );
}
