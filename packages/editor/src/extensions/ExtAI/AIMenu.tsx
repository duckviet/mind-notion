import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, CornerDownLeft, Search } from "lucide-react";
import { Input } from "../../components/ui/input";
import { AIAction } from "./types";
import { AI_ACTIONS } from "./configs";

export interface AIMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  selectedText: string;
  onAction: (action: AIAction, customPrompt?: string) => void;
  isLoading?: boolean;
  streamingPreview?: string;
}

export const AIMenu: React.FC<AIMenuProps> = ({
  isOpen,
  onClose,
  position,
  onAction,
  isLoading = false,
  streamingPreview = "",
}) => {
  const [customPrompt, setCustomPrompt] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPrompt.trim()) {
      onAction("custom", customPrompt);
      setCustomPrompt("");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          className="fixed z-[100] w-[min(32rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover shadow-2xl ring-1 ring-border"
          style={{ top: position.top, left: position.left }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="relative mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
                <Sparkles className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-primary" />
              </div>
              <p className="animate-pulse text-sm font-medium">
                AI is thinking...
              </p>
              {streamingPreview.trim().length > 0 && (
                <div className="mt-4 w-full rounded-lg border border-border bg-background/80 p-3 text-left">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Live preview
                  </p>
                  <p className="max-h-36 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-foreground/90">
                    {streamingPreview}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Custom Input Header */}
              <form
                onSubmit={handleCustomSubmit}
                className="border-b border-border bg-surface-50 p-3"
              >
                <div className="relative group">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    ref={inputRef}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Ask AI to edit or generate..."
                    className="h-9 border-border/50 bg-background pl-9 pr-8 text-sm focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                  {customPrompt && (
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-muted p-0.5 transition-all hover:bg-primary hover:text-primary-foreground"
                    >
                      <CornerDownLeft className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </form>

              {/* Action List */}
              <div className="max-h-[380px] overflow-y-auto overflow-x-hidden p-1.5">
                <div className="px-2 py-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Edit or Review
                  </span>
                </div>

                <div className="grid gap-0.5">
                  {AI_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => onAction(action.id)}
                      className="group flex w-full items-center gap-3 rounded-lg p-2 text-left outline-none transition-all hover:bg-surface-hover focus:bg-surface-hover"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background transition-all group-hover:border-primary/20 group-hover:shadow-sm">
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 text-[13px] font-medium leading-none">
                          {action.label}
                        </div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1">
                          {action.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border bg-muted/20 p-2">
                <div className="flex items-center gap-1.5 px-2">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-600" />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                    AI Assistant Active
                  </span>
                </div>
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">esc</span>
                </kbd>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIMenu;
