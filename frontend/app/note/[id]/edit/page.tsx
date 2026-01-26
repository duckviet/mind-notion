"use client";

import React, { useCallback, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useNoteForm } from "@/features/note-editing/hooks/useNoteForm";
import { useCollabSession } from "@/features/note-editing/hooks/useCollabSession";
import { useCollabProvider } from "@/features/note-editing/hooks/useCollabProvider";
import { useNoteSnapshot } from "@/features/note-editing/hooks/useNoteSnapshot";
import FocusEditModalContent from "@/features/note-editing/ui/FocusEditModalContent";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

export default function PublicNoteEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const noteId = params?.id as string;
  const editToken = searchParams?.get("token") || "";

  const { data, isLoading, error } = useCollabSession(
    noteId,
    editToken,
    !!noteId && !!editToken,
  );

  const note = data?.note;
  const collabToken = data?.token ?? "";
  const collabEnabled = Boolean(collabToken);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const {
    form,
    newTag,
    error: formError,
    titleRef,
    setNewTag,
    handleContentChange,
    handleTagAdd,
    handleTagRemove,
  } = useNoteForm(true, note as any);

  const editorRef = useRef<import("@tiptap/react").Editor | null>(null);

  // Pass initialHtml to useCollabProvider for automatic hydration
  const { doc, provider, isSynced, isHydrated } = useCollabProvider({
    noteId,
    token: collabToken,
    enabled: collabEnabled,
    initialHtml: note?.content ? sanitizeHtml(note.content) : undefined,
  });

  const { scheduleSnapshot } = useNoteSnapshot({
    noteId,
    editToken,
    enabled: collabEnabled,
  });

  const handleEditorReady = useCallback(
    (editor: import("@tiptap/react").Editor) => {
      editorRef.current = editor;
    },
    [],
  );

  const handleContentUpdate = useCallback(
    (value: string) => {
      if (collabEnabled) {
        scheduleSnapshot(value);
      } else {
        handleContentChange(value);
      }
    },
    [collabEnabled, scheduleSnapshot, handleContentChange],
  );

  // Show loading while fetching session
  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <Skeleton className="h-10 w-1/2 mb-6" />
        <Skeleton className="h-96 w-full" />
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
          <h1 className="text-xl font-semibold mb-2">Edit Link Unavailable</h1>
          <p className="text-muted-foreground mb-6">
            This edit link is invalid or has been disabled.
          </p>
        </div>
      </div>
    );
  }

  // Wait for Yjs to sync and hydrate before showing editor
  const showEditor = !collabEnabled || isHydrated;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <FocusEditModalContent
        form={form}
        newTag={newTag}
        error={formError}
        isSaving={false}
        isSidebarCollapsed={isSidebarCollapsed}
        titleRef={titleRef}
        noteId={noteId}
        isPublic={note?.is_public}
        onTitleChange={() => {}}
        onContentChange={handleContentUpdate}
        onNewTagChange={setNewTag}
        onTagAdd={handleTagAdd}
        onTagRemove={handleTagRemove}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        collaboration={
          doc && provider
            ? {
                document: doc,
                provider,
                user: {
                  name: "Guest",
                  color: "#10b981",
                },
              }
            : undefined
        }
        onEditorReady={handleEditorReady}
        readOnlyMeta
        showShareActions={false}
        showComments={false}
        showEditor={showEditor}
      />
    </div>
  );
}
