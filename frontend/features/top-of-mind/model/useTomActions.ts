import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListNotesTOMQueryKey,
  ListNotesTOMQueryResult,
  updateNoteTOM,
} from "@/shared/services/generated/api";
import { invalidateNotesAfterUpdate } from "@/shared/hooks/query-invalidations";

export function useTomActions(topOfMindNotes: ListNotesTOMQueryResult) {
  const queryClient = useQueryClient();

  const updateTopOfMindNote = async (id: string, tomOrder: number | null) => {
    // strip "tom-" and "floating-" prefixes used by DnD
    const noteId = id.replace(/^tom-/, "").replace(/^floating-/, "");

    await updateNoteTOM(noteId, { tom: tomOrder });
    await invalidateNotesAfterUpdate(queryClient, noteId);
  };

  const reorderTopOfMindNote = async (
    noteId: string,
    newIndex: number,
    previousNotes: ListNotesTOMQueryResult,
  ) => {
    try {
      await updateNoteTOM(noteId, { tom: newIndex + 1 });
    } catch {
      queryClient.setQueryData<ListNotesTOMQueryResult>(
        getListNotesTOMQueryKey(),
        previousNotes,
      );
    }
  };

  const getNextOrder = useCallback(() => {
    return (
      topOfMindNotes.reduce(
        (max, n) =>
          typeof n.top_of_mind === "number" && n.top_of_mind > max
            ? n.top_of_mind
            : max,
        0,
      ) + 1
    );
  }, [topOfMindNotes]);

  return { updateTopOfMindNote, reorderTopOfMindNote, getNextOrder };
}
