import { useEffect, useMemo, useState } from "react";
import type { ChatbotDropPayload, PinnedNote } from "./chatbot-types";

interface UsePinnedNotesParams {
  droppedNotePayload?: ChatbotDropPayload | null;
}

export function usePinnedNotes({ droppedNotePayload }: UsePinnedNotesParams) {
  const [pinnedNotes, setPinnedNotes] = useState<PinnedNote[]>([]);
  const [activePinnedId, setActivePinnedId] = useState<string | null>(null);

  useEffect(() => {
    if (!droppedNotePayload) return;

    const { note, droppedAt } = droppedNotePayload;
    const title = (note.title || "Untitled note").trim();
    const content = (note.content || "").trim();

    setPinnedNotes((prev) => {
      const next = prev.filter((item) => item.id !== note.id);
      next.push({ id: note.id, title, content, preview: content.slice(0, 240), droppedAt });
      return next;
    });

    setActivePinnedId(note.id);
  }, [droppedNotePayload]);

  const activePinnedNote = useMemo(
    () => pinnedNotes.find((item) => item.id === activePinnedId) ?? null,
    [activePinnedId, pinnedNotes],
  );

  const handleRemovePinnedNote = (id: string) => {
    setPinnedNotes((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (activePinnedId === id) {
        setActivePinnedId(next.length ? next[next.length - 1].id : null);
      }
      return next;
    });
  };

  const handleClearPinnedNotes = () => {
    setPinnedNotes([]);
    setActivePinnedId(null);
  };

  return {
    pinnedNotes,
    activePinnedId,
    setActivePinnedId,
    activePinnedNote,
    handleRemovePinnedNote,
    handleClearPinnedNotes,
  };
}
