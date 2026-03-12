// HomePage.tsx
"use client";
import { useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
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
    console.log("Updating note", id, data);
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
          topOfMindNotesData,
        );

        if (noteToMove && !alreadyInTopOfMind) {
          void handleUpdateTopOfMindNote(action.activeId, true);
        }
        return;
      }
      case "to-chat-bot": {
        const droppedNote = findNoteById(
          action.activeId,
          notes,
          topOfMindNotesData,
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
        const wasInTopOfMind = findNoteById(
          action.activeId,
          topOfMindNotesData,
        );

        if (wasInTopOfMind) {
          void handleUpdateTopOfMindNote(action.activeId, false);
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
      const note = findNoteById(noteId, notes, topOfMindNotesData);

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
    [notes, topOfMindNotesData],
  );

  // if (error) {
  //   return (
  //     <div className="flex justify-center items-center min-h-screen">
  //       <div className="text-red-500">Failed to load notes</div>
  //     </div>
  //   );
  // }

  const handleUpdateTopOfMindNote = async (id: string, tom: boolean) => {
    try {
      // Strip "tom-" prefix if present (used for drag-and-drop identification)
      const normalizedId = id.startsWith("tom-") ? id.slice(4) : id;
      const noteId = normalizedId.startsWith("floating-")
        ? normalizedId.slice("floating-".length)
        : normalizedId;
      await updateNoteTOM(noteId, {
        tom,
      });
      refetchTopOfMindNotes();
      refetch();
    } catch (error) {
      console.error("Failed to update top of mind note:", error);
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
          items={topOfMindNotesData?.map((n) => n.id) || []}
          strategy={rectSortingStrategy}
        >
          {isLoadingTopOfMindNotes && !topOfMindNotesData ? (
            <TopOfMindSkeleton />
          ) : (
            <div ref={tomRef}>
              <TopOfMind
                notes={topOfMindNotesData || []}
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
            notes={topOfMindNotesData || []}
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
                        onPin={handleUpdateTopOfMindNote}
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
