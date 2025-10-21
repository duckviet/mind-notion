"use client";
import { MasonryGrid } from "@/widgets/content-grid";
import { SearchField } from "@/features/search-content/ui/SearchField";
import { FloatingActionButton } from "@/shared/components/FloatingActionButton";
import { EmptyState } from "@/shared/components/EmptyState";
import { CollaborativeEditor } from "@/features/collaborative-editor/ui/CollaborativeEditor";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useListNotes } from "@/shared/services/generated/api";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Fetch notes from API
  const {
    data: notesData,
    isLoading,
    error,
  } = useListNotes({
    limit: 50,
    offset: 0,
  });

  // Transform API data to match expected format
  const notes = useMemo(() => {
    if (!notesData?.notes) return [];
    return notesData.notes.map((note) => ({
      ...note,
      score: 1.0, // Default score for notes
    }));
  }, [notesData?.notes]);

  // Filter notes based on search query
  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      return notes;
    }

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

  const handleQueryIndex = () => {
    console.log("Searching for:", query);
  };

  const handleFabToggle = () => {
    setIsFabOpen(!isFabOpen);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[role="searchbox"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      if (e.key === "Escape" && isFabOpen) {
        setIsFabOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFabOpen]);

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <SearchField
            query={query}
            setQuery={setQuery}
            onEnter={handleQueryIndex}
            onSearch={handleSearch}
          />
        </div>

        {/* <div className="mb-8">
          <CollaborativeEditor />
        </div> */}

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-text-primary">
            {query ? "Search Results" : "Your Content"}
          </h2>
          <div className="text-sm text-text-muted">
            {filteredResults.length}{" "}
            {filteredResults.length === 1 ? "item" : "items"} found
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-text-muted">Loading your notes...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-red-500">Failed to load notes</div>
          </div>
        ) : filteredResults.length === 0 ? (
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
          <MasonryGrid
            key={`notes-${filteredResults.length}-${Date.now()}`}
            data={filteredResults}
            isLoading={isLoading}
            handleDelete={async () => {}}
          />
        )}
      </div>

      <FloatingActionButton isOpen={isFabOpen} onToggle={handleFabToggle} />
    </div>
  );
}
