"use client";
import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
import { useNotes } from "@/shared/hooks/useNotes";
import { SearchField } from "@/features/search-content";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog/ConfirmDialog";
import { FocusEditModal } from "@/features/note-editing";
import { useListNotesTOM } from "@/shared/services/generated/api";
import { AnimateCardProvider, NoteCard } from "@/entities/note";
import {
  DroppableZone,
  SortableContext,
  rectSortingStrategy,
  DraggableItem,
} from "@/shared/components/dnd";
import {
  DragAwareTomModal,
  TopOfMind,
  useTomActions,
  useTomVisibility,
} from "@/features/top-of-mind";
import { useChatbotSidebarStore } from "@/features/chat-bot";
import { FoldersList } from "@/widgets/folders-list";
import { AddNoteForm } from "@/features/add-note";

import { useHomeState } from "../model/useHomeState";
import { useHomeDnd } from "../model/useHomeDnd";
import { useSortedTopOfMind } from "../model/useSortedTopOfMind";

const MasonryGrid = dynamic(
  () => import("@/widgets/content-grid").then((m) => m.MasonryGrid),
  { ssr: false },
);

const SkeletonBlock = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse rounded-lg bg-surface-100 ${className ?? ""}`}
  />
);

const GridSkeleton = ({ items = 6 }: { items?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: items }).map((_, idx) => (
      <div key={idx} className="break-inside-avoid">
        <SkeletonBlock className="h-48 w-full" />
      </div>
    ))}
  </div>
);

const TopOfMindSkeleton = () => (
  <div className="flex gap-3 overflow-x-auto py-2">
    {Array.from({ length: 4 }).map((_, idx) => (
      <SkeletonBlock key={idx} className="h-20 w-48 flex-shrink-0" />
    ))}
  </div>
);

export function HomePageContent() {
  const state = useHomeState();
  const { setDroppedNotePayload } = useChatbotSidebarStore();

  const {
    notes: notesData,
    isLoading,
    deleteNote,
    createNote,
    updateNote,
    moveNoteToFolder,
    refetch,
  } = useNotes({
    limit: 50,
    offset: 0,
    query: state.debouncedQuery,
    folder_id: "",
  });

  const { data: topOfMindNotesData, isLoading: isLoadingTom } = useListNotesTOM(
    {
      query: { retry: false },
    },
  );

  const topOfMindNotes = useSortedTopOfMind(topOfMindNotesData);
  const tomActions = useTomActions(topOfMindNotes);

  const notes = useMemo(() => {
    return (notesData || []).map((note) => ({
      ...note,
      score: 1.0,
    }));
  }, [notesData]);

  useHomeDnd({
    notes,
    topOfMindNotes,
    disabled: state.isModalOpen,
    onUpdateTom: tomActions.updateTopOfMindNote,
    onReorderTom: tomActions.reorderTopOfMindNote,
    onDropToChat: (note) =>
      setDroppedNotePayload({ note, droppedAt: Date.now() }),
    onUpdateNote: (id, data) => updateNote({ id, data }),
    onMoveNoteToFolder: (id, data) => moveNoteToFolder({ id, data }),
    getNextOrder: tomActions.getNextOrder,
  });

  const { tomRef, isTomVisible } = useTomVisibility([
    topOfMindNotesData,
    isLoadingTom,
  ]);

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <div className="p-6 space-y-6">
        <SearchField
          className="rounded-md"
          query={state.query}
          setQuery={state.setQuery}
          onEnter={() => { }}
        />

        <SortableContext
          items={topOfMindNotes.map((n) => n.id)}
          strategy={rectSortingStrategy}
        >
          {isLoadingTom && !topOfMindNotesData ? (
            <TopOfMindSkeleton />
          ) : (
            <div ref={tomRef}>
              <TopOfMind
                notes={topOfMindNotes}
                onUnpin={tomActions.updateTopOfMindNote}
                onFocusEdit={state.handleFocusEdit}
              />
            </div>
          )}
        </SortableContext>

        <DragAwareTomModal isTomVisible={isTomVisible}>
          <TopOfMind
            droppableId="top-of-mind-zone-floating"
            draggableIdPrefix="floating-"
            notes={topOfMindNotes}
            onUnpin={tomActions.updateTopOfMindNote}
            onFocusEdit={state.handleFocusEdit}
          />
        </DragAwareTomModal>

        <FoldersList />

        <DroppableZone
          id="grid-zone"
          activeClassName="ring-2 ring-brand-600/20 ring-offset-1 ring-offset-background rounded-lg"
        >
          <MasonryGrid data={notes} isLoading={isLoading}>
            {isLoading && notes.length === 0 ? (
              <GridSkeleton />
            ) : (
              <div key="content-grid">
                <AnimateCardProvider>
                  <div key="add-note-form" className="mb-6 break-inside-avoid">
                    {isLoading ? (
                      <SkeletonBlock className="h-28 w-full" />
                    ) : (
                      <AddNoteForm onCreate={createNote} />
                    )}
                  </div>
                  {notes.map((note) => (
                    <DraggableItem
                      className="h-fit mb-6 break-inside-avoid"
                      key={note.id}
                      id={note.id}
                    >
                      <NoteCard
                        match={note}
                        onDelete={state.handleDeleteRequest}
                        onUpdateNote={(id, data) => updateNote({ id, data })}
                        onPin={(id, tom) =>
                          void tomActions.updateTopOfMindNote(
                            id,
                            tom ? tomActions.getNextOrder() : null,
                          )
                        }
                        onFocusEdit={state.handleFocusEdit}
                      />
                    </DraggableItem>
                  ))}
                </AnimateCardProvider>
              </div>
            )}
          </MasonryGrid>
        </DroppableZone>
      </div>

      <ConfirmDialog
        open={!!state.deleteTargetId}
        title="Delete this note?"
        description="This action cannot be undone."
        confirmLabel={state.isDeleting ? "Deleting..." : "Delete"}
        confirmVariant="destructive"
        isConfirming={state.isDeleting}
        onConfirm={async () => {
          if (!state.deleteTargetId) return;
          state.setIsDeleting(true);
          await deleteNote(state.deleteTargetId).finally(() => {
            state.setIsDeleting(false);
            state.setDeleteTargetId(null);
          });
        }}
        onOpenChange={(open) => {
          if (!open) state.setDeleteTargetId(null);
        }}
      />

      {state.focusEditNoteId && state.isModalOpen && (
        <FocusEditModal
          isOpen
          noteId={state.focusEditNoteId}
          onClose={() => state.handleCloseFocusEdit(refetch)}
          onSave={(id, data) => updateNote({ id, data })}
        />
      )}
    </div>
  );
}
