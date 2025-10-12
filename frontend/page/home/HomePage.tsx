"use client";
import { MasonryGrid } from "@/widgets/content-grid";
import { SearchField } from "@/features/search-content/ui/SearchField";
import { FloatingActionButton } from "@/shared/components/FloatingActionButton";
import { EmptyState } from "@/shared/components/EmptyState";
import { useSearch } from "@/features/search-content/model/use-search";
import { CollaborativeEditor } from "@/features/collaborative-editor/ui/CollaborativeEditor";
import { useState, useEffect } from "react";

export default function HomePage() {
  const { query, setQuery, filteredResults, handleSearch } = useSearch();
  const [isFabOpen, setIsFabOpen] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-background-primary to-background-secondary">
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

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-text-primary">
              {query ? "Search Results" : "Your Content"}
            </h2>
            <div className="text-sm text-text-muted">
              {filteredResults.length}{" "}
              {filteredResults.length === 1 ? "item" : "items"} found
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <EmptyState
              type={query ? "no-results" : "new"}
              action={
                query
                  ? undefined
                  : {
                      label: "Add your first item",
                      onClick: () => setIsFabOpen(true),
                    }
              }
            />
          ) : (
            <MasonryGrid
              data={{
                result: filteredResults,
              }}
              isLoading={false}
              handleDelete={async () => {}}
            />
          )}
        </div>
      </div>

      <FloatingActionButton isOpen={isFabOpen} onToggle={handleFabToggle} />
    </div>
  );
}
