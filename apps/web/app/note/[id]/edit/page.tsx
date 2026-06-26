"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCollabSession } from "@/features/note-editing";
import { useCollabProvider } from "@/features/note-editing";
import { useNoteSnapshot } from "@/features/note-editing";
import { sanitizeHtml } from "@/shared/utils/sanitizeHtml";
import { useUpdateNote } from "@/shared/services/generated/api";
import { invalidateNotesAfterUpdate } from "@/shared/hooks/query-invalidations";
import { NotePage } from "@/page/note";
import {
  resolveCollabEditState,
  resolveCollabEditorContent,
} from "@/features/note-editing/model/collabFallback";

export default function PublicNoteEditPage() {
  const queryClient = useQueryClient();
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

  const [title, setTitle] = useState("");

  // Sync title from server note
  useEffect(() => {
    if (note?.title && !title) {
      setTitle(note.title);
    }
  }, [note?.title, title]);

  const { mutate: updateNote } = useUpdateNote({
    mutation: {
      onSuccess: async () => {
        await invalidateNotesAfterUpdate(queryClient, noteId);
      },
    },
  });

  // Debounce title update
  useEffect(() => {
    if (!noteId || !title.trim() || title === note?.title) return;

    const timer = setTimeout(() => {
      updateNote({
        noteId,
        data: {
          id: noteId,
          title,
        },
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, noteId, note?.title, updateNote]);

  const editorRef = useRef<import("@tiptap/react").Editor | null>(null);

  // Pass initialHtml to useCollabProvider for automatic hydration
  const { doc, provider, isSynced, isHydrated, isFallbackActive } =
    useCollabProvider({
      noteId,
      token: collabToken,
      enabled: collabEnabled,
      initialHtml: note?.content ? sanitizeHtml(note.content) : undefined,
    });
  const collabEditState = resolveCollabEditState({
    collabEnabled,
    isFallbackActive,
    isHydrated,
  });
  const noteContent = note?.content ?? "";
  const editorContent = resolveCollabEditorContent({
    content: noteContent,
    fallbackContent: sanitizeHtml(noteContent),
    useFallbackContent: collabEditState.useFallbackContent,
  });

  const { scheduleSnapshot, markUserEdited } = useNoteSnapshot({
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
        markUserEdited();
        scheduleSnapshot(value);
      }
    },
    [collabEnabled, markUserEdited, scheduleSnapshot],
  );

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
  }, []);

  return (
    <NotePage
      note={note ? { ...note, title, content: editorContent } : note}
      isLoading={isLoading}
      error={error}
      isSynced={isSynced}
      isHydrated={isHydrated}
      collabEnabled={collabEditState.activeCollaboration}
      showComments
      mode="edit"
      onTitleChange={handleTitleChange}
      onContentUpdate={handleContentUpdate}
      onEditorReady={handleEditorReady}
      collaboration={
        collabEditState.activeCollaboration && doc && provider
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
