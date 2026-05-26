import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useDebounce } from "use-debounce";
import { cn } from "@/lib/utils";

type Props = {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  onEnter: () => void;
  onSearch?: (searchTerm: string) => void;
  className?: string;
};

export default function SearchField({
  query,
  setQuery,
  onEnter,
  onSearch,
  className,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onEnter();
    }
  };

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
    },
    [setQuery],
  );

  const handleClear = useCallback(() => {
    setQuery("");
  }, [setQuery]);

  return (
    <div className={cn("relative", className)}>
      <motion.div
        className={cn(
          "relative rounded-lg border border-border bg-surface-50",
          "transition-all duration-200 ease-out",
          isFocused && "border-border-strong",
        )}
        animate={{
          scale: 1,
          boxShadow: isFocused
            ? "0 0 0 3px rgba(31,30,29,0.08)"
            : undefined,
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center px-6 py-4">
          <Search className="w-5 h-5 text-text-muted mr-3 flex-shrink-0" />

          <input
            type="text"
            placeholder="Search my mind..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "flex-1 bg-transparent text-lg placeholder:text-stone",
              "focus:outline-none text-text-primary",
              "transition-colors duration-200",
            )}
            aria-label="Search your saved content"
            role="searchbox"
          />

          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              className="ml-3 rounded-full p-1 transition-colors duration-200 hover:bg-accent"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-text-muted" />
            </motion.button>
          )}

          {/* Keyboard shortcut hint */}
          {!isFocused && !query && (
            <div className="ml-3 text-xs text-text-muted hidden sm:block">
              <kbd className="rounded border border-border-subtle bg-surface px-2 py-1">
                ⌘K
              </kbd>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
