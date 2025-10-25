// HomePage.tsx
"use client";
import { useState, useMemo } from "react";
import { useNotes } from "@/shared/hooks/useNotes";
import { SearchField } from "@/features/search-content/ui/SearchField";
import { EmptyState } from "@/shared/components/EmptyState";
import { FloatingActionButton } from "@/shared/components/FloatingActionButton";
import { MasonryGrid } from "@/widgets/content-grid";
import NoteCard from "@/entities/note/ui/NoteCard";
import ArticleCard from "@/entities/web-article/ui/ArticleCard";
import AddNoteForm from "@/features/add-note/ui/AddNoteForm";
import { Variants } from "framer-motion";
import { ReqUpdateNote } from "@/shared/services/generated/api";
import { AnimateCardProvider } from "@/entities/note/ui/AnimateCardProvider";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [isFabOpen, setIsFabOpen] = useState(false);

  const {
    notes: notesData,
    isLoading,
    error,
    deleteNote,
    createNote,
    updateNote,
  } = useNotes({ limit: 50, offset: 0 });

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

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Failed to load notes</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <SearchField
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          onEnter={() => {}}
        />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-text-primary">
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
                  <div key="add-note-form" className="mb-6 break-inside-avoid">
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
  );
}
