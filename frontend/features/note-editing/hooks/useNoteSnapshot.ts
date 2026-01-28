import { useCallback, useEffect, useRef } from "react";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { saveNoteSnapshot } from "@/shared/services/generated/api";

type UseNoteSnapshotOptions = {
  noteId: string;
  editToken?: string;
  enabled?: boolean;
  delayMs?: number;
};

export const useNoteSnapshot = ({
  noteId,
  editToken,
  enabled = true,
  delayMs = 4000,
}: UseNoteSnapshotOptions) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>("");

  const sendSnapshot = useCallback(
    async (content: string) => {
      if (!enabled || !noteId) return;
      const sanitized = sanitizeHtml(content);
      if (sanitized === lastContentRef.current) return;
      lastContentRef.current = sanitized;
      try {
        await saveNoteSnapshot(noteId, { content: sanitized });
      } catch {
        // Snapshot errors are non-blocking for editing
      }
    },
    [noteId, editToken, enabled],
  );

  const scheduleSnapshot = useCallback(
    (content: string) => {
      if (!enabled || !noteId) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => sendSnapshot(content), delayMs);
    },
    [enabled, noteId, sendSnapshot, delayMs],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { scheduleSnapshot };
};
