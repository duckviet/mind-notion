import { useCallback, useEffect, useRef } from "react";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { saveNoteSnapshot } from "@/shared/services/generated/api";

type UseNoteSnapshotOptions = {
  noteId: string;
  editToken?: string;
  enabled?: boolean;
  intervalMs?: number;
  idleMs?: number;
};

export const useNoteSnapshot = ({
  noteId,
  enabled = true,
  intervalMs = 2000,
  idleMs = 500,
}: UseNoteSnapshotOptions) => {
  const loopRef = useRef<NodeJS.Timeout | null>(null);
  const idleStopRef = useRef<NodeJS.Timeout | null>(null);
  const latestContentRef = useRef<string>("");
  const lastSentContentRef = useRef<string>("");
  const hasUserEditedRef = useRef(false);
  const isSendingRef = useRef(false);

  const sendSnapshot = useCallback(
    async (content: string) => {
      if (!enabled || !noteId || isSendingRef.current) return;

      const sanitized = sanitizeHtml(content);
      if (sanitized === lastSentContentRef.current) return;

      lastSentContentRef.current = sanitized;
      isSendingRef.current = true;

      try {
        await saveNoteSnapshot(noteId, {
          content: sanitized,
        });
      } catch {
        // non-blocking
      } finally {
        isSendingRef.current = false;
      }
    },
    [noteId, enabled],
  );

  const scheduleSnapshot = useCallback(
    (content: string) => {
      if (!enabled || !noteId) return;
      if (!hasUserEditedRef.current) return;

      latestContentRef.current = content;

      // Start interval loop while user is typing
      if (!loopRef.current) {
        loopRef.current = setInterval(() => {
          const latest = latestContentRef.current;
          if (!latest) return;
          void sendSnapshot(latest);
        }, intervalMs);
      }

      // Reset idle timer on every input
      if (idleStopRef.current) clearTimeout(idleStopRef.current);
      idleStopRef.current = setTimeout(() => {
        // Stop the loop
        if (loopRef.current) {
          clearInterval(loopRef.current);
          loopRef.current = null;
        }

        // Flush the last snapshot
        const latest = latestContentRef.current;
        if (latest) {
          void sendSnapshot(latest);
        }

        idleStopRef.current = null;
      }, idleMs);
    },
    [enabled, noteId, sendSnapshot, intervalMs, idleMs],
  );

  const markUserEdited = useCallback(() => {
    hasUserEditedRef.current = true;
  }, []);

  // Reset when noteId changes or hook is disabled
  useEffect(() => {
    hasUserEditedRef.current = false;
    latestContentRef.current = "";
    lastSentContentRef.current = "";

    return () => {
      // Flush before cleanup
      const latest = latestContentRef.current;
      if (latest && hasUserEditedRef.current) {
        void sendSnapshot(latest);
      }

      if (loopRef.current) {
        clearInterval(loopRef.current);
        loopRef.current = null;
      }
      if (idleStopRef.current) {
        clearTimeout(idleStopRef.current);
        idleStopRef.current = null;
      }
    };
  }, [noteId, enabled, sendSnapshot]);

  return { scheduleSnapshot, markUserEdited };
};
