"use client";

import React, { useCallback, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useCollabSession } from "@/features/note-editing/hooks/useCollabSession";
import { useCollabProvider } from "@/features/note-editing/hooks/useCollabProvider";
import { useNoteSnapshot } from "@/features/note-editing/hooks/useNoteSnapshot";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { NotePage } from "@/page/note/NotePage";

export default function PublicNoteEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const noteId = params?.id as string;
  const editToken = searchParams?.get("token") || "";

  const { data, isLoading, error } = useCollabSession(
    noteId,
    editToken,
    !!noteId,
  );

  const note = data?.note;
  const collabToken = data?.token ?? "";
  const collabEnabled = Boolean(collabToken);

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
      }
    },
    [collabEnabled, scheduleSnapshot],
  );

  return (
    <NotePage
      note={note}
      isLoading={isLoading}
      error={error}
      isSynced={isSynced}
      isHydrated={isHydrated}
      showComments
      mode="edit"
      onContentUpdate={handleContentUpdate}
      onEditorReady={handleEditorReady}
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
    />
  );
}
