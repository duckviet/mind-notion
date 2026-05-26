import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutTemplate, Check } from "lucide-react";
import { Editor } from "@tiptap/react";
import { cn } from "../../utils/cn";
import { LAYOUTS } from "../../extensions/ExtNoteLayout/layouts";
import { useNoteLayout } from "../../extensions/ExtNoteLayout/useNoteLayout";
import { NOTE_LAYOUT_ICONS } from "../../extensions/ExtNoteLayout/layoutIcons";

interface NoteLayoutDropdownProps {
  editor: Editor;
  noteId: string;
}

export default function NoteLayoutDropdown({
  editor,
  noteId,
}: NoteLayoutDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { layout, changeLayout } = useNoteLayout(editor, noteId);

  const currentConfig = LAYOUTS.find((l) => l.key === layout) ?? LAYOUTS[0];

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((v) => !v)}
        title={`Layout: ${currentConfig.label}`}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 mt-0.5 rounded text-xs font-medium transition-colors",
          "hover:bg-accent-foreground/40 hover:text-primary-foreground",
          isOpen && "bg-accent-foreground/40 text-primary-foreground",
        )}
      >
        <LayoutTemplate size={15} />
        <span className="hidden sm:inline">{currentConfig.label}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className="absolute top-full left-0 mt-2 z-50 min-w-[180px] bg-accent border border-border rounded-lg shadow-lg overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-border">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Page Layout
                </p>
              </div>

              <div className="p-1.5 flex flex-col gap-0.5">
                {LAYOUTS.map((l) => (
                  <button
                    key={l.key}
                    onClick={() => {
                      changeLayout(l.key);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors text-left",
                      layout === l.key
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent-foreground/20",
                    )}
                  >
                    <span className="text-muted-foreground">
                      {NOTE_LAYOUT_ICONS[l.key]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[13px] leading-tight">
                        {l.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-tight truncate">
                        {l.description}
                      </p>
                    </div>
                    {layout === l.key && (
                      <Check size={13} className="text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
