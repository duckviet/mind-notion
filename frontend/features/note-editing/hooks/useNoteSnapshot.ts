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
  const hasUserEditedRef = useRef(false);

  const sendSnapshot = useCallback(
    async (content: string) => {
      if (!enabled || !noteId) return;
      const sanitized = sanitizeHtml(content);
      if (sanitized === lastContentRef.current) return;
      lastContentRef.current = sanitized;
      try {
        await saveNoteSnapshot(noteId, { content: sanitized });
      } catch {
        // non-blocking
      }
    },
    [noteId, enabled],
  );

  const scheduleSnapshot = useCallback(
    (content: string) => {
      if (!enabled || !noteId) return;

      // Skip snapshots until user has actually edited
      if (!hasUserEditedRef.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => sendSnapshot(content), delayMs);
    },
    [enabled, noteId, sendSnapshot, delayMs],
  );

  // Call this when a real user interaction triggers a content change
  const markUserEdited = useCallback(() => {
    hasUserEditedRef.current = true;
  }, []);

  // Reset when noteId changes or modal closes
  useEffect(() => {
    hasUserEditedRef.current = false;
    lastContentRef.current = "";
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [noteId, enabled]);

  return { scheduleSnapshot, markUserEdited };
};
