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
    [setQuery]
  );

  const handleClear = useCallback(() => {
    setQuery("");
  }, [setQuery]);

  return (
    <div className={cn("relative", className)}>
      <motion.div
        className={cn(
          "relative bg-white rounded-xl",
          "transition-all duration-200 ease-out",
          isFocused && "shadow-glass-lg border-accent-blue"
        )}
        animate={{
          scale: isFocused ? 1.02 : 1,
          boxShadow: isFocused
            ? "0 0 0 3px rgba(102, 126, 234, 0.1), 0 10px 15px -3px rgb(0 0 0 / 0.1)"
            : undefined,
          //   : "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)",
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
              "flex-1 bg-transparent text-lg placeholder:text-text-muted",
              "focus:outline-none text-text-primary",
              "transition-colors duration-200"
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
              className="ml-3 p-1 rounded-full hover:bg-glass-hover transition-colors duration-200"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-text-muted" />
            </motion.button>
          )}

          {/* Keyboard shortcut hint */}
          {!isFocused && !query && (
            <div className="ml-3 text-xs text-text-muted hidden sm:block">
              <kbd className="px-2 py-1 glass-bg rounded border border-glass-border">
                ⌘K
              </kbd>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
