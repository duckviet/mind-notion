// HomePage.tsx
"use client";
import { useState, useMemo, useEffect } from "react";
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

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [isFabOpen, setIsFabOpen] = useState(false);

  const {
    notes: notesData,
    setNotes,
    isLoading,
    error,
    deleteNote,
    createNote,
    updateNote,
    refetch,
  } = useNotes({ limit: 50, offset: 0 });

  const {
    data: topOfMindNotesData,
    isLoading: isLoadingTopOfMindNotes,
    error: errorTopOfMindNotes,
    refetch: refetchTopOfMindNotes,
  } = useListNotesTOM();

  const notes = useMemo(() => {
    return (notesData || []).map((note) => ({
      ...note,
      score: 1.0,
    }));
  }, [notesData]);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return notes;
    return notes.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.content?.toLowerCase().includes(query.toLowerCase()) ||
        item.tags?.some((tag) =>
          tag.toLowerCase().includes(query.toLowerCase())
        )
    );
  }, [notes, query]);

  const handleSearch = (searchTerm: string) => {
    setQuery(searchTerm);
  };

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

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Failed to load notes</div>
      </div>
    );
  }

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
      onDragEnd={handleDragEnd}
      renderOverlay={(activeId) => {
        const noteId = activeId?.toString();
        const note =
          notes.find((n) => n.id === noteId) ||
          topOfMindNotesData?.find((n) => n.id === noteId);
        return note ? (
          <div className="opacity-80">
            <NoteCard
              match={{ ...note, title: noteId || "", score: 1.0 }}
              onUpdateNote={() => {}}
            />
          </div>
        ) : null;
      }}
    >
      <div className="min-h-screen">
        <div className="container mx-auto px-6 py-8">
          <SearchField
            className="rounded-md"
            query={query}
            setQuery={setQuery}
            onSearch={handleSearch}
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

          {/* Main Grid Zone with SortableContext */}
          {/* <SortableContext
            items={notes.map((n) => n.id)}
            strategy={rectSortingStrategy}
          > */}
          <DroppableZone
            id="grid-zone"
            className="transition-all grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            activeClassName="ring-2 ring-green-400"
          >
            {notes.map((note) => (
              // <SortableItem key={note.id} id={note.id}>
              <DraggableItem key={note.id} id={note.id}>
                <NoteCard
                  match={note}
                  onDelete={handleDelete}
                  onUpdateNote={handleUpdate}
                  onPin={handleUpdateTopOfMindNote}
                />
              </DraggableItem>
              // </SortableItem>
            ))}
          </DroppableZone>
          {/* </SortableContext> */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-text-primary mt-2">
              {query ? "Search Results" : "Your Content"}
            </h2>
            <div className="text-sm text-text-muted">
              {filteredResults.length}{" "}
              {filteredResults.length === 1 ? "item" : "items"} found
            </div>
          </div>

          {filteredResults.length === 0 && !isLoading ? (
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
          ) : (
            <MasonryGrid data={filteredResults} isLoading={isLoading}>
              {isLoading && filteredResults.length === 0 ? (
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
                    {filteredResults.map((note) => (
                      <div
                        key={note.id}
                        className="h-fit mb-6 break-inside-avoid"
                      >
                        {note.content_type === "text" ? (
                          <NoteCard
                            match={note}
                            onDelete={handleDelete}
                            onUpdateNote={handleUpdate}
                          />
                        ) : (
                          <ArticleCard match={note} onDelete={handleDelete} />
                        )}
                      </div>
                    ))}
                  </AnimateCardProvider>
                </div>
              )}
            </MasonryGrid>
          )}
        </div>

        <FloatingActionButton isOpen={isFabOpen} onToggle={handleFabToggle} />
      </div>
    </MultiZoneDndProvider>
  );
}
