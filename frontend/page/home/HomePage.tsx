// HomePage.tsx
"use client";
import { useState, useMemo } from "react";
import { useNotes } from "@/shared/hooks/useNotes";
import { SearchField } from "@/features/search-content";
import { EmptyState } from "@/shared/components/EmptyState";
import { FloatingActionButton } from "@/shared/components/FloatingActionButton";
import { MasonryGrid } from "@/widgets/content-grid";
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

function HomePageContent() {
  const [query, setQuery] = useState("");
  const [isFabOpen, setIsFabOpen] = useState(false);
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

  const handleDelete = async (id: string) => {
    if (confirm("Delete this note?")) {
      await deleteNote(id);
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
      <div className="min-h-screen">
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
            <TopOfMind
              notes={topOfMindNotesData || []}
              onUnpin={handleUpdateTopOfMindNote}
            />
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
                <div key="loading">Loading...</div>
              ) : (
                <div key="content-grid">
                  <AnimateCardProvider>
                    {/* AddNoteForm */}
                    <div
                      key="add-note-form"
                      className="mb-6 break-inside-avoid"
                    >
                      <AddNoteForm onCreate={createNote} />
                    </div>
                    {/* Notes & Articles */}

                    {notes.map((note) => (
                      // <SortableItem key={note.id} id={note.id}>
                      <DraggableItem
                        className="h-fit mb-6 break-inside-avoid"
                        key={note.id}
                        id={note.id}
                      >
                        {note.content_type === "text" ? (
                          <NoteCard
                            match={note}
                            onDelete={handleDelete}
                            onUpdateNote={handleUpdate}
                            onPin={handleUpdateTopOfMindNote}
                          />
                        ) : (
                          <ArticleCard match={note} onDelete={handleDelete} />
                        )}
                      </DraggableItem>
                      // </SortableItem>
                    ))}
                    {/* </SortableContext> */}
                  </AnimateCardProvider>
                </div>
              )}
            </MasonryGrid>
          </DroppableZone>
          {/* )} */}
        </div>

        <FloatingActionButton isOpen={isFabOpen} onToggle={handleFabToggle} />
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
