// HomePage.tsx
"use client";
import { useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useNotes } from "@/shared/hooks/useNotes";
import { SearchField } from "@/features/search-content";
import { EmptyState } from "@/shared/components/EmptyState";
import { FloatingActionButton } from "@/shared/components/FloatingActionButton";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog/ConfirmDialog";
const MasonryGrid = dynamic(
  () => import("@/widgets/content-grid").then((m) => m.MasonryGrid),
  { ssr: false }
);
import NoteCard from "@/entities/note/ui/NoteCard";
import ArticleCard from "@/entities/web-article/ui/ArticleCard";
import AddNoteForm from "@/features/add-note/ui/AddNoteForm";
import {
  ReqUpdateNote,
  updateNoteTOM,
  useListNotesTOM,
} from "@/shared/services/generated/api";
import { AnimateCardProvider } from "@/entities/note/ui/AnimateCardProvider";
import {
  MultiZoneDndProvider,
  DroppableZone,
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  DraggableItem,
} from "@/shared/components/dnd";
import { TopOfMind } from "@/features/top-of-mind";
import { DragEndEvent } from "@dnd-kit/core";
import { ModalProvider, useModal } from "@/shared/contexts/ModalContext";
import { useDebounce } from "use-debounce";

const SkeletonBlock = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse rounded-md bg-slate-200/80 ${className ?? ""}`}
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
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isModalOpen } = useModal();

  const [debouncedQuery] = useDebounce(query, 300);
  const {
    notes: notesData,
    setNotes,
    isLoading,
    error,
    deleteNote,
    createNote,
    updateNote,
    refetch,
  } = useNotes({ limit: 50, offset: 0, query: debouncedQuery });

  const {
    data: topOfMindNotesData,
    isLoading: isLoadingTopOfMindNotes,
    error: errorTopOfMindNotes,
    refetch: refetchTopOfMindNotes,
  } = useListNotesTOM({
    query: {
      retry: false,
    },
  });

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
  const handleFabToggle = () => {
    setIsFabOpen(!isFabOpen);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log("event", event);
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Lấy parent HTML element của activeId
    // const activeElement = document.querySelector(`[data-id="${activeId}"]`);
    // const parentElement = activeElement ? activeElement.parentElement : null;
    // const parentId = parentElement?.getAttribute("id");

    // const overElement = document.querySelector(`[data-id="${overId}"]`);
    // const overParentElement = overElement ? overElement.parentElement : null;
    // const overParentId = overParentElement?.getAttribute("id");

    // console.log("activeId", activeId, "overId", overId);
    // console.log("parentElement", parentId);
    // console.log("overParentElement", overParentId);
    // Check if dropping into top-of-mind zone
    if (overId === "top-of-mind-zone") {
      // Find the note from main grid
      const noteToMove = notes.find((n) => n.id === activeId);
      if (noteToMove && !topOfMindNotesData?.find((n) => n.id === activeId)) {
        // Add to top of mind if not already there
        handleUpdateTopOfMindNote(activeId, true);
      }
      return;
    }

    // Check if dropping into grid zone
    if (overId === "grid-zone") {
      // Remove from top of mind if it was there
      const wasInTopOfMind = topOfMindNotesData?.find((n) => n.id === activeId);
      if (wasInTopOfMind) {
        handleUpdateTopOfMindNote(activeId, false);
      }
      return;
    }
  };

  const renderOverlay = useCallback(
    (activeId: string | number | null) => {
      const noteId = activeId?.toString();
      const note =
        notes.find((n) => n.id === noteId) ||
        topOfMindNotesData?.find((n) => n.id === noteId);

      if (!note) return null;

      const previewText = note.title || note.content || "Note";

      return (
        <div className="w-full min-w-[260px] max-w-[320px] rounded-lg border border-border bg-white/90 shadow-lg px-4 py-3 opacity-90">
          <div className="text-xs font-semibold text-muted-foreground mb-2">
            Dragging
          </div>
          <div className="text-sm font-medium text-foreground line-clamp-2">
            {previewText}
          </div>
        </div>
      );
    },
    [notes, topOfMindNotesData]
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
      const noteId = id.startsWith("tom-") ? id.slice(4) : id;
      await updateNoteTOM(noteId, {
        tom,
      });
      refetchTopOfMindNotes();
      refetch();
    } catch (error) {
      console.error("Failed to update top of mind note:", error);
    }
  };

  return (
    <MultiZoneDndProvider
      disabled={isModalOpen}
      onDragEnd={handleDragEnd}
      renderOverlay={(activeId) => {
        const noteId = activeId?.toString();
        const note =
          notes.find((n) => n.id === noteId) ||
          topOfMindNotesData?.find((n) => n.id === noteId);
        return note ? (
          <div
            className="opacity-80 w-full min-w-[300px]"
            style={{ rotate: "5deg" }}
          >
            <NoteCard match={{ ...note, score: 1.0 }} onUpdateNote={() => {}} />
          </div>
        ) : null;
      }}
    >
      <div className="min-h-screen overflow-hidden">
        <div className="container mx-auto px-6 py-6 space-y-6">
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
              <TopOfMind
                notes={topOfMindNotesData || []}
                onUnpin={handleUpdateTopOfMindNote}
              />
            )}
          </SortableContext>
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
                    <div
                      key="add-note-form"
                      className="mb-6 break-inside-avoid"
                    >
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
                        {note.content_type === "text" ? (
                          <NoteCard
                            match={note}
                            onDelete={handleDeleteRequest}
                            onUpdateNote={handleUpdate}
                            onPin={handleUpdateTopOfMindNote}
                          />
                        ) : (
                          <ArticleCard
                            match={note}
                            onDelete={handleDeleteRequest}
                          />
                        )}
                      </DraggableItem>
                    ))}
                  </AnimateCardProvider>
                </div>
              )}
            </MasonryGrid>
          </DroppableZone>
          {/* )} */}
        </div>

        <FloatingActionButton isOpen={isFabOpen} onToggle={handleFabToggle} />

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
      </div>
    </MultiZoneDndProvider>
  );
}

export default function HomePage() {
  return (
    <ModalProvider>
      <HomePageContent />
    </ModalProvider>
  );
}
