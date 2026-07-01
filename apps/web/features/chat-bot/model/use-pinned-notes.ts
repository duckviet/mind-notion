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
    const isFolder = note.type === "folder";
    const title = (note.title || "Untitled").trim();
    const content = isFolder
      ? `Folder ID: ${note.id}\nThis is a pinned folder. Use folders.read with this ID to inspect its notes.`
      : (note.content || "").trim();

    setPinnedNotes((prev) => {
      const next = prev.filter((item) => item.id !== note.id);
      next.push({
        id: note.id,
        title,
        content,
        preview: isFolder ? "Folder containing notes" : content.slice(0, 240),
        droppedAt,
        type: note.type,
      });
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

  const handlePinNote = (item: { id: string; title: string; content?: string; type?: "note" | "folder" }) => {
    const isFolder = item.type === "folder";
    const title = (item.title || "Untitled").trim();
    const content = isFolder
      ? `Folder ID: ${item.id}\nThis is a pinned folder. Use folders.read with this ID to inspect its notes.`
      : (item.content || "").trim();

    setPinnedNotes((prev) => {
      const next = prev.filter((x) => x.id !== item.id);
      next.push({
        id: item.id,
        title,
        content,
        preview: isFolder ? "Folder containing notes" : content.slice(0, 240),
        droppedAt: Date.now(),
        type: item.type,
      });
      return next;
    });

    setActivePinnedId(item.id);
  };

  return {
    pinnedNotes,
    activePinnedId,
    setActivePinnedId,
    activePinnedNote,
    handleRemovePinnedNote,
    handleClearPinnedNotes,
    handlePinNote,
  };
}
