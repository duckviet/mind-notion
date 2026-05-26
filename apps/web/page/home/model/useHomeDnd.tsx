import React, { useCallback } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListNotesTOMQueryKey,
  ListNotesTOMQueryResult,
  ReqUpdateNote,
  ResDetailNote,
} from "@/shared/services/generated/api";
import { useGlobalDndHandlers } from "@/shared/components/dnd";
import NoteCard from "@/entities/note/ui/NoteCard";
import {
  findNoteById,
  normalizeHomeDragId,
  resolveHomeDropAction,
} from "../home-dnd";

interface Options {
  notes: any[]; // notesData with score added
  topOfMindNotes: ListNotesTOMQueryResult;
  disabled: boolean;
  onUpdateTom: (id: string, order: number | null) => Promise<void>;
  onReorderTom: (
    id: string,
    newIndex: number,
    prev: ListNotesTOMQueryResult,
  ) => Promise<void>;
  onDropToChat: (note: { id: string; title: string; content: string }) => void;
  onUpdateNote: (id: string, data: ReqUpdateNote) => Promise<ResDetailNote>;
  onMoveNoteToFolder: (
    id: string,
    data: ReqUpdateNote,
  ) => Promise<ResDetailNote>;
  getNextOrder: () => number;
}

export function useHomeDnd({
  notes,
  topOfMindNotes,
  disabled,
  onUpdateTom,
  onReorderTom,
  onDropToChat,
  onUpdateNote,
  onMoveNoteToFolder,
  getNextOrder,
}: Options) {
  const queryClient = useQueryClient();

  const renderOverlay = useCallback(
    (activeId: string | number | null) => {
      if (!activeId) return null;
      const noteId = normalizeHomeDragId(activeId.toString());
      const note = findNoteById(noteId, notes, topOfMindNotes);
      if (!note) return null;

      return (
        <div
          className="opacity-80 w-full min-w-[300px] scale-70"
          style={{ rotate: "5deg" }}
        >
          <NoteCard match={{ ...note, score: 1.0 }} onUpdateNote={() => {}} />
        </div>
      );
    },
    [notes, topOfMindNotes],
  );

  const handleDragEnd = (
    event: Parameters<typeof resolveHomeDropAction>[0],
  ) => {
    const action = resolveHomeDropAction(event);

    switch (action.type) {
      case "to-top-of-mind": {
        const already = findNoteById(action.activeId, topOfMindNotes);
        if (!already) void onUpdateTom(action.activeId, getNextOrder());
        return;
      }
      case "reorder-top-of-mind": {
        const oldIdx = topOfMindNotes.findIndex(
          (n) => n.id === action.activeId,
        );
        const newIdx = topOfMindNotes.findIndex((n) => n.id === action.overId);
        if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return;

        const prev = topOfMindNotes;
        queryClient.setQueryData<ListNotesTOMQueryResult>(
          getListNotesTOMQueryKey(),
          arrayMove(topOfMindNotes, oldIdx, newIdx).map((n, i) => ({
            ...n,
            top_of_mind: i + 1,
          })),
        );
        void onReorderTom(action.activeId, newIdx, prev);
        return;
      }
      case "to-chat-bot": {
        const note = findNoteById(action.activeId, notes, topOfMindNotes);
        if (note)
          onDropToChat({
            id: note.id,
            title: note.title,
            content: note.content,
          });
        return;
      }
      case "to-grid": {
        const wasInTom = findNoteById(action.activeId, topOfMindNotes);
        if (wasInTom) void onUpdateTom(action.activeId, null);
        return;
      }
      case "to-folder": {
        const note = findNoteById(action.activeId, notes);
        if (note)
          void onMoveNoteToFolder(action.activeId, {
            ...note,
            folder_id: action.folderId,
          });
        return;
      }
    }
  };

  useGlobalDndHandlers({ disabled, onDragEnd: handleDragEnd, renderOverlay });
}
