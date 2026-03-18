// HomePage.tsx
"use client";
import { useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { arrayMove } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { useNotes } from "@/shared/hooks/useNotes";
import { SearchField } from "@/features/search-content";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog/ConfirmDialog";
import { FocusEditModal } from "@/features/note-editing";
const MasonryGrid = dynamic(
  () => import("@/widgets/content-grid").then((m) => m.MasonryGrid),
  { ssr: false },
);
import NoteCard from "@/entities/note/ui/NoteCard";
import AddNoteForm from "@/features/add-note/ui/AddNoteForm";
import {
  getListFoldersQueryKey,
  getListNotesQueryKey,
  getListNotesTOMQueryKey,
  ListNotesTOMQueryResult,
  ReqUpdateNote,
  updateNoteTOM,
  useListNotesTOM,
} from "@/shared/services/generated/api";
import { AnimateCardProvider } from "@/entities/note/ui/AnimateCardProvider";
import {
  useGlobalDndHandlers,
  DroppableZone,
  SortableContext,
  rectSortingStrategy,
  DraggableItem,
} from "@/shared/components/dnd";
import { TopOfMind } from "@/features/top-of-mind";
import { ModalProvider, useModal } from "@/shared/contexts/ModalContext";
import { useDebounce } from "use-debounce";
import { FoldersListPage } from "../folder";
import DragAwareTomModal from "@/features/top-of-mind/ui/DragAwareTomModal";
import { useTomVisibility } from "@/features/top-of-mind/model/useTomVisibility";
import { useChatbotSidebarStore } from "@/features/chat-bot/store/chatbot-sidebar.store";
import {
  findNoteById,
  normalizeHomeDragId,
  resolveHomeDropAction,
} from "./home-dnd";

const SkeletonBlock = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse rounded-md  -elevated/50 ${className ?? ""}`}
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

function HomePageContent() {
  const [query, setQuery] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [focusEditNoteId, setFocusEditNoteId] = useState<string | null>(null);
  const setDroppedNotePayload = useChatbotSidebarStore(
    (state) => state.setDroppedNotePayload,
  );
  const { isModalOpen, openModal, closeModal } = useModal();
  const [debouncedQuery] = useDebounce(query, 300);
  const queryClient = useQueryClient();

  // Ref để track visibility của TopOfMind section

  const {
    notes: notesData,
    isLoading,
    deleteNote,
    createNote,
    updateNote,
    refetch,
  } = useNotes({ limit: 50, offset: 0, query: debouncedQuery, folder_id: "" });

  const {
    data: topOfMindNotesData,
    isLoading: isLoadingTopOfMindNotes,
    refetch: refetchTopOfMindNotes,
  } = useListNotesTOM({
    query: {
      retry: false,
    },
  });

  const { tomRef, isTomVisible } = useTomVisibility([
    topOfMindNotesData,
    isLoadingTopOfMindNotes,
  ]);

  const topOfMindNotes = useMemo(() => {
    return [...(topOfMindNotesData ?? [])].sort((a, b) => {
      const orderA = a.top_of_mind ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.top_of_mind ?? Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }, [topOfMindNotesData]);

  const getNextTopOfMindOrder = useCallback(() => {
    const maxOrder = topOfMindNotes.reduce((max, note) => {
      if (typeof note.top_of_mind !== "number") {
        return max;
      }

      return note.top_of_mind > max ? note.top_of_mind : max;
    }, 0);

    return maxOrder + 1;
  }, [topOfMindNotes]);

  const notes = useMemo(() => {
    return (notesData || []).map((note) => ({
      ...note,
      score: 1.0,
    }));
  }, [notesData]);

  const handleDeleteRequest = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await deleteNote(deleteTargetId);
    } catch (error) {
      console.error("Failed to delete note:", error);
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const handleUpdate = async (id: string, data: ReqUpdateNote) => {
    try {
      await updateNote({ id, data });
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };

  const handleDragEnd = (
    event: Parameters<typeof resolveHomeDropAction>[0],
  ) => {
    const action = resolveHomeDropAction(event);

    switch (action.type) {
      case "none": {
        return;
      }
      case "to-top-of-mind": {
        const noteToMove = findNoteById(action.activeId, notes);
        const alreadyInTopOfMind = findNoteById(
          action.activeId,
          topOfMindNotes,
        );

        if (noteToMove && !alreadyInTopOfMind) {
          void handleUpdateTopOfMindNote(
            action.activeId,
            getNextTopOfMindOrder(),
          );
        }
        return;
      }
      case "reorder-top-of-mind": {
        const oldIndex = topOfMindNotes.findIndex(
          (note) => note.id === action.activeId,
        );
        const newIndex = topOfMindNotes.findIndex(
          (note) => note.id === action.overId,
        );

        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
          return;
        }

        const previousTopOfMindNotes = topOfMindNotes;
        const reorderedNotes = arrayMove(
          topOfMindNotes,
          oldIndex,
          newIndex,
        ).map((note, index) => ({
          ...note,
          top_of_mind: index + 1,
        }));

        queryClient.setQueryData<ListNotesTOMQueryResult>(
          getListNotesTOMQueryKey(),
          reorderedNotes,
        );

        void handleReorderTopOfMindNote(
          action.activeId,
          newIndex + 1,
          previousTopOfMindNotes,
        );
        return;
      }
      case "to-chat-bot": {
        const droppedNote = findNoteById(
          action.activeId,
          notes,
          topOfMindNotes,
        );

        if (droppedNote) {
          setDroppedNotePayload({
            note: {
              id: droppedNote.id,
              title: droppedNote.title,
              content: droppedNote.content,
            },
            droppedAt: Date.now(),
          });
        }
        return;
      }
      case "to-grid": {
        const wasInTopOfMind = findNoteById(action.activeId, topOfMindNotes);

        if (wasInTopOfMind) {
          void handleUpdateTopOfMindNote(action.activeId, null);
        }
        return;
      }
      case "to-folder": {
        const activeNote = findNoteById(action.activeId, notes);

        if (activeNote) {
          void handleUpdate(action.activeId, {
            ...activeNote,
            folder_id: action.folderId,
          });
        }
      }
    }
  };

  const renderOverlay = useCallback(
    (activeId: string | number | null) => {
      if (!activeId) {
        return null;
      }

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

  // if (error) {
  //   return (
  //     <div className="flex justify-center items-center min-h-screen">
  //       <div className="text-red-500">Failed to load notes</div>
  //     </div>
  //   );
  // }

  const handleUpdateTopOfMindNote = async (
    id: string,
    tomOrder: number | null,
  ) => {
    try {
      // Strip "tom-" prefix if present (used for drag-and-drop identification)
      const normalizedId = id.startsWith("tom-") ? id.slice(4) : id;
      const noteId = normalizedId.startsWith("floating-")
        ? normalizedId.slice("floating-".length)
        : normalizedId;
      await updateNoteTOM(noteId, {
        tom: tomOrder,
      });
      const invalidations: Promise<void>[] = [
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListNotesTOMQueryKey() }),
        queryClient.invalidateQueries({
          queryKey: getListFoldersQueryKey(),
        }),
      ];

      await Promise.all(invalidations);
    } catch (error) {
      console.error("Failed to update top of mind note:", error);
    }
  };

  const handleReorderTopOfMindNote = async (
    noteId: string,
    tomOrder: number,
    previousTopOfMindNotes: ListNotesTOMQueryResult,
  ) => {
    try {
      await updateNoteTOM(noteId, {
        tom: tomOrder,
      });

      // await refetchTopOfMindNotes();
    } catch (error) {
      queryClient.setQueryData<ListNotesTOMQueryResult>(
        getListNotesTOMQueryKey(),
        previousTopOfMindNotes,
      );
      console.error("Failed to reorder top of mind note:", error);
    }
  };

  const handleFocusEdit = (id: string) => {
    setFocusEditNoteId(id);
    openModal();
  };

  const handleCloseFocusEdit = () => {
    setFocusEditNoteId(null);
    closeModal();
    refetch();
  };

  useGlobalDndHandlers({
    disabled: isModalOpen,
    onDragEnd: handleDragEnd,
    renderOverlay,
  });

  return (
    <div className="min-h-screen overflow-hidden">
      <div className="p-6 space-y-6">
        <SearchField
          className="rounded-md"
          query={query}
          setQuery={setQuery}
          onEnter={() => {}}
        />

        {/* Top of Mind Zone with SortableContext */}
        <SortableContext
          items={topOfMindNotes.map((n) => n.id)}
          strategy={rectSortingStrategy}
        >
          {isLoadingTopOfMindNotes && !topOfMindNotesData ? (
            <TopOfMindSkeleton />
          ) : (
            <div ref={tomRef}>
              <TopOfMind
                notes={topOfMindNotes}
                onUnpin={handleUpdateTopOfMindNote}
                onFocusEdit={handleFocusEdit}
              />
            </div>
          )}
        </SortableContext>

        {/* Floating TOM Modal - chỉ hiện khi TopOfMind gốc không visible */}
        <DragAwareTomModal isTomVisible={isTomVisible}>
          <TopOfMind
            droppableId="top-of-mind-zone-floating"
            draggableIdPrefix="floating-"
            notes={topOfMindNotes}
            onUnpin={handleUpdateTopOfMindNote}
            onFocusEdit={handleFocusEdit}
          />
        </DragAwareTomModal>

        {/* 
          {notes.length === 0 && !isLoading ? (
            <EmptyState
              type={query ? "no-results" : "new"}
              action={
                query
                  ? undefined
                  : {
                      label: "Add your first note",
                      onClick: () => setIsFabOpen(true),
                    }
              }
            />
          ) : ( */}
        <FoldersListPage />
        <DroppableZone
          id="grid-zone"
          activeClassName="ring-2 ring-green-300/20 ring-offset-1 ring-offset-green-300/20 rounded-md"
        >
          <MasonryGrid data={notes} isLoading={isLoading}>
            {isLoading && notes.length === 0 ? (
              <GridSkeleton />
            ) : (
              <div key="content-grid">
                <AnimateCardProvider>
                  {/* AddNoteForm */}
                  <div key="add-note-form" className="mb-6 break-inside-avoid">
                    {isLoading ? (
                      <SkeletonBlock className="h-28 w-full" />
                    ) : (
                      <AddNoteForm onCreate={createNote} />
                    )}
                  </div>
                  {/* Notes & Articles */}
                  {notes.map((note) => (
                    <DraggableItem
                      className="h-fit mb-6 break-inside-avoid"
                      key={note.id}
                      id={note.id}
                    >
                      <NoteCard
                        match={note}
                        onDelete={handleDeleteRequest}
                        onUpdateNote={handleUpdate}
                        onPin={(id, tom) =>
                          void handleUpdateTopOfMindNote(
                            id,
                            tom ? getNextTopOfMindOrder() : null,
                          )
                        }
                        onFocusEdit={handleFocusEdit}
                      />
                    </DraggableItem>
                  ))}
                </AnimateCardProvider>
              </div>
            )}
          </MasonryGrid>
        </DroppableZone>
        {/* )} */}
      </div>
      <ConfirmDialog
        open={!!deleteTargetId}
        title="Delete this note?"
        description="This action cannot be undone."
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        confirmVariant="destructive"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTargetId(null);
          }
        }}
      />

      {focusEditNoteId && isModalOpen && (
        <FocusEditModal
          isOpen={true}
          onClose={handleCloseFocusEdit}
          noteId={focusEditNoteId}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <ModalProvider>
      <HomePageContent />
    </ModalProvider>
  );
}
